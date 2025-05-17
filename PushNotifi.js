const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const cron = require('node-cron');
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const serviceAccount = require('./att2-5950c-firebase-adminsdk-ifr80-5ddcd325ed.json'); // Path to Firebase service account JSON file
const multer = require('multer');
const s3 = require('./awsConfig.js');
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });
// Initialize Firebase Admin SDK

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

require('dotenv').config();
const secretKey =process.env.SECRET_KEY
const app = express();
app.use(express.json()); // To parse JSON bodies

const pool = require('./config.js');

// API to store or update user's last open time and FCM token
router.post('/api/updateUserActivity/', async (req, res) => {
  const token = req.headers.authorization;
  const { fcm_token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Missing required token' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Token has expired or is invalid' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token', errorMessage: error.message });
  }

  const { Regno } = decoded;

  if (!fcm_token) {
    return res.status(400).json({ error: 'Missing required field: fcm_token' });
  }

  const query = `
    INSERT INTO user_fcm_tokens (Regno, fcm_token, timestamp) 
    VALUES (?, ?, UNIX_TIMESTAMP()) 
    ON DUPLICATE KEY UPDATE timestamp = UNIX_TIMESTAMP();
  `;

  try {
    const [result] = await pool.query(query, [Regno, fcm_token]);
    res.status(200).json({ success: true, message: 'User activity updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Database connection error', errorMessage: error.message });
  }
});


router.get("/get/notifications/", async (req, res) => {
  const token = req.headers.authorization;

  // Handle Missing Token
  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
  }

  try {
    // Verify JWT Token
    const decoded = jwt.verify(token, secretKey);
    const { Regno } = decoded;

    // Fetch Notifications from DB
    const query = `SELECT regno, title, body, image, Timestamp FROM notifications WHERE regno = ? ORDER BY Timestamp DESC;`;
    const [result] = await pool.query(query, [Regno]);

    if (result.length === 0) {
      return res.status(200).json({ success: true, notify: [], message: "No notifications available" });
    }

    // Generate S3 Signed URLs for Images
    const notifications = await Promise.all(
      result.map(async (notification) => {
        if (notification.image) {
          try {
            const params = {
              Bucket: "add-imag",
              Key: notification.image,
            };
            notification.imageUrl = await s3.getSignedUrlPromise("getObject", params);
          } catch (s3Error) {
            console.error("S3 Error:", s3Error);
            notification.imageUrl = null; // If S3 fails, return null instead of breaking
          }
        }
        return notification;
      })
    );

    res.status(200).json({ success: true, notify: notifications });

  } catch (err) {
    console.error("Error fetching notifications:", err);

    // Handle Specific JWT Errors
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    }

    // Handle Database Errors
    if (err.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ success: false, message: "Database error: Table does not exist" });
    } else if (err.code === "ER_ACCESS_DENIED_ERROR") {
      return res.status(500).json({ success: false, message: "Database error: Access denied" });
    }

    // Handle AWS S3 Errors
    if (err.code === "NetworkingError") {
      return res.status(500).json({ success: false, message: "AWS S3 connection error" });
    }

    // Generic Server Error
    res.status(500).json({ success: false, message: "Failed to fetch notifications", error: err.message });
  }
});


// Function to send push notifications
const sendPushNotification = async (token) => {
  const message = {
    notification: {
      title: 'We miss you!',
      body: 'It looks like you haven’t opened the app in a while. Come back and check what’s new!',
    },
    token: token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// Cron job to check for inactive users every day at 08:00
cron.schedule('00 08 * * *', async () => {
  // Find users who haven’t opened the app in the past 7 minutes
  const sevenMinsAgo = Date.now() - (7 * 60 * 1000); // 7 minutes ago

  console.log('Seven minutes ago (formatted):', sevenMinsAgo);

  const query = 'SELECT regno, fcm_token FROM students WHERE last_open_time < ?';

  try {
    const [result] = await pool.query(query, [sevenMinsAgo]); // Await MySQL query

    if (result.length === 0) {
      console.log('No inactive users found.');
      return;
    }

    for (const user of result) {
      console.log('User:', user);
      await sendPushNotification(user.fcm_token); // Await the notification sending
    }
  } catch (err) {
    console.error('Error fetching inactive users or sending notifications:', err);
  }
});

async function sendFavoriteNotification(token, name,notificationBody) {

  const message = {
    notification: {
      title: name,
      body: notificationBody,
       
    },
   
    token: token,
  };
  

  try {
    const response = await admin.messaging().send(message);
   
    return { success: true, response };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error };
  }
}


// Endpoint to send favorite notification
router.post('/sendFavoriteNotification/', async (req, res) => {
  const token = req.headers.authorization;
  const { post_id } = req.body;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization token missing' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
    }
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token', error: error.message });
  }

  const { Regno } = decoded;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Insert the like into the likes table
    try {
      const likeQuery = 'INSERT INTO likes (Regno, post_id, liked_at) VALUES (?, ?, UNIX_TIMESTAMP());';
      await connection.query(likeQuery, [Regno, post_id]);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Already liked this post' });
      }
      throw error;
    }

    // Fetch user details and FCM token
    const [rows] = await connection.query(`
      SELECT students.Fullname, students.Profile, user_fcm_tokens.fcm_token 
      FROM students
      JOIN user_fcm_tokens ON students.regno = user_fcm_tokens.regno
      WHERE students.regno = ?;
    `, [Regno]);

    if (rows.length === 0 || !rows[0].fcm_token) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'User or FCM token not found' });
    }

    const user = rows[0];
    const notificationBody = `liked your post`;

    // Send the notification
    const result = await sendFavoriteNotification(user.fcm_token, user.Fullname, notificationBody);

    if (!result.success) {
      await connection.rollback();
      return res.status(500).json({ success: false, message: 'Failed to send notification' });
    }

    // Store the notification details
    try {
      const insertNotificationQuery = `
        INSERT INTO notifications (regno, title, body, image, Timestamp)
        VALUES (?, ?, ?, ?, UNIX_TIMESTAMP());
      `;
      await connection.query(insertNotificationQuery, [Regno, user.Fullname, notificationBody, user.Profile]);
    } catch (error) {
      await connection.rollback();
      return res.status(500).json({ success: false, message: 'Failed to save notification', error: error.message });
    }

    await connection.commit();
    return res.status(200).json({ success: true, message: result.response });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  } finally {
    if (connection) connection.release();
  }
});



router.post('/add/comment/', async (req, res) => {
  const token = req.headers.authorization;
  const { postId, Comment_text } = req.body; // Removed aRegno, using authenticated Regno

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authorization token missing' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
    }
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token', error: error.message });
  }

  const { Regno } = decoded;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Insert the comment into comments_posts table
    try {
      const insertCommentQuery = `
        INSERT INTO comments_posts (post_id, Regno, comments_text, timestamp) 
        VALUES (?, ?, ?, UNIX_TIMESTAMP());
      `;
      await connection.query(insertCommentQuery, [postId, Regno, Comment_text]);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Duplicate comment not allowed' });
      }
      throw error;
    }

    // Fetch user details and FCM token
    const [rows] = await connection.query(`
      SELECT students.Fullname, students.Profile, user_fcm_tokens.fcm_token 
      FROM students
      JOIN user_fcm_tokens ON students.regno = user_fcm_tokens.regno
      WHERE students.regno = ?;
    `, [Regno]);

    if (rows.length === 0 || !rows[0].fcm_token) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'User or FCM token not found' });
    }

    const user = rows[0];
    const notificationBody = `commented on your post`;

    // Send the notification
    const result = await sendFavoriteNotification(user.fcm_token, user.Fullname, notificationBody);

    if (!result.success) {
      await connection.rollback();
      return res.status(500).json({ success: false, message: 'Failed to send notification' });
    }

    // Store the notification details
    try {
      const insertNotificationQuery = `
        INSERT INTO notifications (regno, title, body, image, Timestamp)
        VALUES (?, ?, ?, ?, UNIX_TIMESTAMP());
      `;
      await connection.query(insertNotificationQuery, [Regno, user.Fullname, notificationBody, user.Profile]);
    } catch (error) {
      await connection.rollback();
      return res.status(500).json({ success: false, message: 'Failed to save notification', error: error.message });
    }

    await connection.commit();
    return res.status(200).json({ success: true, message: result.response });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  } finally {
    if (connection) connection.release();
  }
});




router.get("/liked/posts/", async (req, res) => {
  let connection;
  try {
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Regno } = decoded;



    // Query to get collegetype from the register table
    const collegetypeQuery = `SELECT post_id
    FROM likes 
    WHERE regno =?`
  
    // Start database operations
    connection = await pool.getConnection();

    // Fetch collegetype
    const [rows] = await connection.query(collegetypeQuery, [Regno]);
  
    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: "College not found in register table" });
    }
   
    
    connection.release();
   
    res.status(200).json(rows);

  } catch (error) {
    console.error("Error fetching collegetype:", error);

    if (connection) {
      connection.release();
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else if (error.code === "ER_BAD_FIELD_ERROR") {
      return res.status(400).json({ success: false, message: "Invalid database field name in query" });
    } else if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ success: false, message: "Database table not found" });
    } else if (error.code === "ER_PARSE_ERROR") {
      return res.status(400).json({ success: false, message: "SQL syntax error in query" });
    } else {
      res.status(500).json({ success: false, message: "Failed to retrieve collegetype" });
    }
  }
});



module.exports = router;
