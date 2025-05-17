const express = require('express');
const router = express.Router();
const app = express();
const cookieParser = require('cookie-parser');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const s3 = require('./awsConfig.js');
const multer = require('multer')
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });

app.use(cookieParser());
app.use(express.json());

const pool = require('./config.js');



const secretKey =process.env.SECRET_KEY

router.post('/collegelogin/', async (req, res) => {
  try {
      const { Email, password } = req.body;

      // Queries for different user types
      const studentQuery = 'SELECT * FROM students WHERE Email = ?';
      const lecturerQuery = 'SELECT * FROM lecturer WHERE Email = ?';
      const fondQuery = 'SELECT * FROM fond WHERE Email = ?';

      const connection = await pool.getConnection();
      let [rows] = await connection.query(studentQuery, [Email]);

      // Check in students table
      if (rows.length === 0) {
          // Check in lecturer table
          [rows] = await connection.query(lecturerQuery, [Email]);
          if (rows.length === 0) {
              // Check in fond table
              [rows] = await connection.query(fondQuery, [Email]);
              if (rows.length === 0) {
                  connection.release();
                  return res.status(401).json({ error: 'Invalid username or password' });
              }
          }
      }

      const user = rows[0];
      connection.release();

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Generate tokens
      const token = jwt.sign({ email: Email }, secretKey, { expiresIn: '2m' });
      const refreshToken = jwt.sign({ email: Email }, secretKey, { expiresIn: '30d' });

      // Set cookie and respond
      res.cookie('token', token, {
        httpOnly: true,
        secure: false, // Should be true in production
        sameSite: 'lax', // 'none' if cross-domain testing
      });

      res.status(200).json({ success: true, message: 'Login successful', token, refreshToken });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Authentication error' });
  }
});


/*
router.post('/app/collegelogin/', async (req, res) => {
  try {
      const { Email, password } = req.body;
      const query = 'SELECT * FROM students WHERE Email = ?';

      const connection = await pool.getConnection();
      const [rows] = await connection.query(query, [Email]);
      connection.release();
      
      if (rows.length === 0) {
        console.log("Logins")
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, rows[0].password);

    if (!isPasswordValid) {
      console.log("Logins Password")
       return  res.status(401).json({success: false,  message: 'Invalid username or password' });
    }

    const token = jwt.sign({ email: Email }, secretKey, { expiresIn: '5h' });
    const refreshToken = jwt.sign({ email: Email }, secretKey, { expiresIn: '30d' });

      res.status(200).json({ success: true, message: 'Login successful',token:token });
  } catch (error) {
    
      res.status(500).json({ success: false, message: 'Authentication error' });
  }
});*/


router.post('/app/collegelogin/', async (req, res) => {
  try {
    const { Email, password } = req.body;
    const studentQuery = 'SELECT * FROM students WHERE Email = ?';
    const otherTableQuery = 'SELECT * FROM lecturer WHERE Email = ?';

    const connection = await pool.getConnection();
    try {
      // Check in the 'students' table
      let [rows] = await connection.query(studentQuery, [Email]);
      
      // If not found, check in the 'lecturer' table
      if (rows.length === 0) {
        [rows] = await connection.query(otherTableQuery, [Email]);
        
        // If not found in either table
        if (rows.length === 0) {
          console.log("Invalid login attempt: No user found");
          return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
      }

      const user = rows[0];

      if (!user.password) {
        console.log("No password found for user");
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
    
      if (!isPasswordValid) {
        console.log("Invalid password");
        return res.status(401).json({ success: false, message: 'Invalid  password' });
      }

      // Generate tokens with id included
      const token = jwt.sign({ Regno: user.Regno, email: Email, Id:user.Id }, secretKey, { expiresIn: '25m' });
      const refreshToken = jwt.sign({ Regno: user.Regno, email: Email, Id:user.Id  }, secretKey, { expiresIn: '30d' });

      // Return success response
      return res.status(200).json({ success: true, message: 'Login successful', token, refreshToken });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
});


router.get('/logout/', async(req,res)=>{
  try {

    res.cookie('token', '', { expires: new Date(0), httpOnly: true });
  res.json({"message":"logged out"});
  

  } catch (error) {
   
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
})

router.get('/loginstatus/', async (req, res) => {
  try {
    const token = req.cookies.token;

    if (token) {
    
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.get('/app/loginstatus/', async (req, res) => {

     try {
      const token = req.headers.authorization;
      if (!token) {
        return res.json({ success: false, message: 'No token provided' });
      }
      const decoded = jwt.verify(token, secretKey);
      return res.json({ success: true, message: 'token valid' });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
       
        return res.json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
      } else {
        return res.json({ success: false, message: 'invalidtoken' });
      }
    }
  }
)

router.delete('/deleteFcmToken/', async (req, res) => {
  const token = req.headers.authorization;
  const { fcm_token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Missing required token' });
  }

  if (!fcm_token) {
    return res.status(400).json({ error: 'Missing required FCM token' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Token has expired or is invalid' });
    }
    return res.status(401).json({ error: 'Invalid token', errorMessage: error.message });
  }

  const { Regno } = decoded;

  try {
    // Delete the specific FCM token for the user
    const deleteQuery = 'DELETE FROM user_fcm_tokens WHERE regno = ? AND fcm_token = ?';
    const [result] = await pool.query(deleteQuery, [Regno, fcm_token]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'FCM token not found for the user' });
    }

    res.status(200).json({ success: true, message: 'FCM token deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database connection error', errorMessage: error.message });
  }
});

  /*
router.get('/app/loginstatus/', async (req, res) => {
  let connection;
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.json({ success: false, message: 'No token provided' });
    }

    connection = await pool.getConnection();
    const decoded = jwt.verify(token, secretKey);
    const email = decoded.email; // Assuming the email is stored in the token payload

    // Query to check if the user exists in the students table
    const [studentCheck] = await connection.query('SELECT Role FROM students WHERE email = ?', [email]);

    // Query to check if the user exists in the lecturers table
    const [lecturerCheck] = await connection.query('SELECT Role FROM lecturer WHERE email = ?', [email]);

    // Combine the results from both queries
    const user = studentCheck.length > 0 ? studentCheck[0] : lecturerCheck.length > 0 ? lecturerCheck[0] : null;

    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, message: user.Role });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.log("expired");
      return res.json({ success: false, message: 'Token expired' });
    } else {
      return res.json({ success: false, message: 'Invalid token' });
    }
  } finally {
    if (connection) connection.release(); // Ensure the connection is released
  }
});*/


router.get('/app/collegelogindata/', async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
    }

    const decoded = jwt.verify(token, secretKey);
    const { email, Regno } = decoded;  // Ensure this is lowercase 'id'
    // This should now correctly log the user's ID

    const studentQuery = 'SELECT Regno, Fullname, Email, College_name, Role, Profile,Number,Address,Gaurdian,Course,Section,Sem,Year,Gaurdian,Number,Address,class_id FROM students WHERE Email = ?';
    const otherTableQuery = 'SELECT Regno, Fullname, Email, College_name, Role, Profile,Number,Address,Desigination,Department,Number,Address,College_Code FROM lecturer WHERE Email = ?';

    const connection = await pool.getConnection();
    try {
      // Check in the 'students' table
      let [results] = await connection.query(studentQuery, [email]);

      if (results.length === 0) {
        // If not found, check in the 'lecturer' table
        [results] = await connection.query(otherTableQuery, [email]);

        if (results.length === 0) {
          console.log("User not found in both tables");
          return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
      }

      const { Profile, ...user } = results[0];

      // Fetch the profile image from S3
      const profileParams = {
        Bucket: 'add-imag',
        Key: Profile,
      };

      let profilepic = '';
      try {
        profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
      } catch (err) {
        console.error(`Error retrieving image for ${Profile}:`, err);
      }

      // Add the profile URL to the user data
      const userData = { ...user, profilepic };

      return res.status(200).json({ success: true, message: userData });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    }
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});



router.get('/collegelogindata/', async (req, res) => {
  try {
    const token = req.cookies.token; // Access token from cookies
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Unauthorized: Token expired' });
      } else if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
      } else {
        return res.status(401).json({ success: false, message: 'Unauthorized: Token verification failed' });
      }
    }

    const { email } = decoded;

    // Queries for different user tables
    const studentQuery = 'SELECT * FROM students WHERE Email = ?';
    const lecturerQuery = 'SELECT * FROM lecturer WHERE Email = ?';
    const fondQuery = 'SELECT * FROM fond WHERE Email = ?';

    const connection = await pool.getConnection();

    try {
      // Check in 'students' table
      let [results] = await connection.query(studentQuery, [email]);

      if (results.length === 0) {
        // Check in 'lecturer' table
        [results] = await connection.query(lecturerQuery, [email]);
        if (results.length === 0) {
          // Check in 'fond' table
          [results] = await connection.query(fondQuery, [email]);
          if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or user not found' });
          }
        }
      }

      const { Profile, ...user } = results[0];

      // Fetch the profile image from S3
      const profileParams = {
        Bucket: 'add-imag', // Replace with your S3 bucket name
        Key: Profile,       // The key should match the profile image path
      };

      let profilepic = '';
      try {
        profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
      } catch (err) {
        console.error(`Error retrieving image for ${Profile}:`, err);
      }

      // Add the profile URL to the user data
      const userData = { ...user, profilepic };

      return res.status(200).json({ success: true, message: userData });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

  module.exports = router;