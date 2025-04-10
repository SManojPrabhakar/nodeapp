const express = require('express');
const router = express.Router();
const multer = require('multer')
const jwt = require('jsonwebtoken');
const pool = require('./config.js');
const s3 = require('./awsConfig');
require('dotenv').config();
const secretKey =process.env.SECRET_KEY
const storage = multer.memoryStorage(); 
const upload = multer({ storage: storage });




  
 



router.post('/UploadImg/', upload.any(), async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
      }
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token', errorMessage: error.message });
    }

    const { Regno } = decoded;
    const { caption } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const uploadedFiles = [];

    await Promise.all(files.map(async (file) => {
      try {
        const uniqueFileName = `${Date.now()}_${file.originalname}`;
        const params = {
          Bucket: 'add-imag',
          Key: uniqueFileName,
          Body: file.buffer,
        };

        await s3.putObject(params).promise();
        uploadedFiles.push(uniqueFileName);
      } catch (err) {
        console.error(`Error uploading file ${file.originalname}:`, err);
      }
    }));

    if (uploadedFiles.length === 0) {
      return res.status(500).json({ success: false, message: 'File upload failed' });
    }

    const connection = await pool.getConnection();

    try {
      const query = `INSERT INTO posts (Image, regno, Description, timestamp) VALUES (?, ?, ?, UNIX_TIMESTAMP())`;
      await Promise.all(
        uploadedFiles.map(async (filename) => {
          await connection.execute(query, [filename, Regno, caption || '']);
        })
      );
      res.status(200).json({ success: true, message: 'Files uploaded and post created successfully', uploadedFiles });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error during file upload or database update:', error);
    res.status(500).json({ success: false, message: 'Internal server error', errorMessage: error.message });
  }
});



router.delete('/deleteImg/', async (req, res) => {
  try {
    const { filename } = req.body;
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
      }
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token', errorMessage: error.message });
    }

    const { Regno } = decoded;

    if (!filename) {
      return res.status(400).json({ success: false, message: 'Filename is required' });
    }

    const connection = await pool.getConnection();
    try {
      // Check if the image exists for the user before deleting
      const checkQuery = `SELECT Image FROM posts WHERE Image = ? AND regno = ?`;
      const [rows] = await connection.execute(checkQuery, [filename, Regno]);

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Image not found or does not belong to the user' });
      }

      // Delete from S3
      const deleteParams = {
        Bucket: 'add-imag',
        Key: filename,
      };

      try {
        await s3.headObject(deleteParams).promise(); // Check if file exists in S3
        await s3.deleteObject(deleteParams).promise();
      } catch (err) {
        if (err.code === 'NotFound') {
          console.warn(`S3 file not found: ${filename}`);
        } else {
          console.error('S3 deletion error:', err);
          return res.status(500).json({ success: false, message: 'Error deleting file from S3', errorMessage: err.message });
        }
      }

      // Delete from the database
      const deleteQuery = `DELETE FROM posts WHERE Image = ? AND regno = ?`;
      const [result] = await connection.execute(deleteQuery, [filename, Regno]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Image not found in database' });
      }

      res.json({ success: true, message: 'Image deleted successfully from S3 and database' });
    } finally {
      connection.release(); // Always release the connection
    }
  } catch (error) {
    console.error('Error during file deletion or database update:', error);
    res.status(500).json({ success: false, message: 'Internal server error', errorMessage: error.message });
  }
});



router.get('/comments/:postId', async (req, res) => {
  const postId = parseInt(req.params.postId);

  if (isNaN(postId)) {
    return res.status(400).json({ error: 'Invalid post ID' });
  }

  try {
    const query = `
     SELECT 
    comments_posts.Cmt_id AS commentId,  -- Include comment_id as commentId
    COALESCE(comment_students.Regno, comment_lecturer.Regno) AS regno,  -- Get Regno from students or lecturers
    COALESCE(comment_students.fullname, comment_lecturer.fullname) AS username,
    comments_posts.comments_text AS comment, 
    COALESCE(comment_students.profile, comment_lecturer.profile) AS profile
FROM 
    comments_posts
LEFT JOIN 
    students AS comment_students ON comments_posts.regno = comment_students.Regno
LEFT JOIN 
    lecturer AS comment_lecturer ON comments_posts.regno = comment_lecturer.Regno
WHERE 
    comments_posts.post_id = ?;


    `;

    // Execute the query to get comments data
    const [rows] = await pool.execute(query, [postId]);

    // Process each comment to retrieve signed profile URLs
    const commentsWithProfileUrls = await Promise.all(
      rows.map(async (comment) => {
        if (comment.profile) {
          // Fetch the profile URL from S3 if profile image is provided
          const profileParams = {
            Bucket: 'add-imag',
            Key: comment.profile,
          };
          try {
            comment.profile = await s3.getSignedUrlPromise('getObject', profileParams);
          } catch (error) {
            console.error(`Error retrieving image for ${comment.username}:`, error);
            comment.profile = null; // If URL retrieval fails, set to null
          }
        }
        return comment;
      })
    );

    // Send comments with profile URLs as the response
    res.status(200).json(commentsWithProfileUrls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve comments' });
  }
});


router.delete('/delete/comment/', async (req, res) => {
  const token = req.headers.authorization;
  const { commentId } = req.query; // Get commentId from the request body
  


  if (!token) {
    return res.status(400).json({ error: 'Missing required token' });
  }


  try {
    const query = `
      DELETE FROM comments_posts
      WHERE Cmt_id = ?;
    `;

    // Execute the query with the specified commentId
    const [result] = await pool.execute(query, [commentId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Comment not found or already deleted' });
    }

    res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

router.post('/add/like/', async (req, res) => {
  const { postId, Regno} = req.body; // Get postId, Regno, and Comment_text from the request body

  if (!postId || !Regno || !Comment_text) {
      return res.status(400).json({ error: 'Missing required fields: postId, Regno, or Comment_text' });
  }


  try {
      const query = `
          INSERT INTO likes ( Regno, postId, timestamp)
          VALUES (?, ?, UNIX_TIMESTAMP());
      `;

      // Execute the query with parameters
      const [rows] = await pool.execute(query, [ Regno,postId]);
      res.status(200).json({ success: true, message: 'Comment added successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to add comment' });
  }
});


router.get('/likes/', async (req, res) => {
  const { postId} = req.body; 

  if (!postId || !Regno || !Comment_text) {
      return res.status(400).json({ error: 'Missing required fields: postId, Regno, or Comment_text' });
  }


  try {
      const query = `
          INSERT INTO likes ( Regno, postId, timestamp)
          VALUES (?, ?, UNIX_TIMESTAMP());
      `;

      // Execute the query with parameters
      const [rows] = await pool.execute(query, [ Regno,postId]);
      res.status(200).json({ success: true, message: 'Comment added successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to add comment' });
  }
});



















router.get('/search/timeline/Id/', async (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
    } else {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }
  }

  const { Regno } = decoded;
  const Id = parseInt(req.query.Id);
  const pagenum = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.per_page) || 10;
  const offset = (pagenum - 1) * limit;

  let connection;
  try {
    // Get a database connection
    connection = await pool.getConnection();

    // Query to get the total count of posts
    const totalQuery = 'SELECT COUNT(*) AS total FROM posts WHERE regno = ?';
    const [totalResult] = await connection.query(totalQuery, [Regno]);
    const total = totalResult[0].total || 0;
    const totalPages = Math.ceil(total / limit);

    // Query to get the paginated records
    const [results] = await connection.query(
      `
      SELECT posts.*, 
         COALESCE(students.fullname, lecturer.fullname) AS fullname,
         COALESCE(students.college_name, lecturer.college_name) AS collegename,
         COALESCE(students.Profile, lecturer.Profile) AS profilepic,
         COALESCE(students.Active, lecturer.Active) AS active,
         COUNT(likes.post_id) AS likes -- Count the number of likes for each post
      FROM posts
      LEFT JOIN students ON posts.Regno = students.Regno
      LEFT JOIN lecturer ON posts.Regno = lecturer.Regno
      LEFT JOIN likes ON posts.id = likes.post_id -- Join with likes table
      WHERE posts.Id = ? -- Ensure we get posts only for a single user
        AND ((students.Active IS NULL OR students.Active = 'true')
          OR (lecturer.Active IS NULL OR lecturer.Active = 'true'))
      GROUP BY posts.id, students.fullname, lecturer.fullname, students.college_name, 
               lecturer.college_name, students.Profile, lecturer.Profile, 
               students.Active, lecturer.Active
      ORDER BY posts.id DESC -- Order by latest posts
      LIMIT ? OFFSET ?;
      `,
      [Id, limit, offset]
    );

    if (results.length === 0) {
      return res.status(404).json({ result: [] });
    }

    // Fetch image URLs and combine them with post data
    const postsData = await Promise.all(
      results.map(async (post) => {
        const { Image, profilepic, ...postData } = post;

        // Set up S3 params for the post image and profile image
        const postImageParams = { Bucket: 'add-imag', Key: Image };
        const profileImageParams = { Bucket: 'add-imag', Key: profilepic };

        let postUrl = '';
        let profileUrl = '';

        try {
          // Get the signed URL for the post image
          if (Image) {
            postUrl = await s3.getSignedUrlPromise('getObject', postImageParams);
          }

          // Get the signed URL for the profile image
          if (profilepic) {
            profileUrl = await s3.getSignedUrlPromise('getObject', profileImageParams);
          }
        } catch (err) {
          console.error('Error generating S3 signed URLs:', err);
        }

        // Return the post data with the URLs
        return { ...postData, profilepic: profileUrl, posts: postUrl };
      })
    );

    // Send the response with pagination metadata and posts data
    return res.json({
      paging: {
        total,
        totalPages,
        currentPage: pagenum,
        limit,
      },
      data: postsData,
    });
  } catch (error) {
    console.error('Error in /search/timeline/Id/ route:', error);
    return res.status(500).json({ result: [], error: 'Internal Server Error' });
  } finally {
    // Ensure the database connection is released
    if (connection) connection.release();
  }
});


  router.get('/timeline/Id/', async (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, secretKey);
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid Token' });
    }

    const { Regno } = decoded;
    if (!Regno) {
        return res.status(400).json({ success: false, message: 'Invalid Token Data' });
    }

    const pagenum = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.per_page) || 10;
    const offset = (pagenum - 1) * limit;

    let connection;
    try {
        connection = await pool.getConnection();

        // Get total count of posts
        const totalQuery = 'SELECT COUNT(*) AS total FROM posts WHERE Regno = ?';
        const [totalResult] = await connection.query(totalQuery, [Regno]);
        const total = totalResult[0].total || 0;
        const totalPages = Math.ceil(total / limit);

        // Fetch paginated posts
        const [results] = await connection.query(
            `SELECT posts.*, 
               COALESCE(students.fullname, lecturer.fullname) AS fullname,
               COALESCE(students.college_name, lecturer.college_name) AS collegename,
               COALESCE(students.Profile, lecturer.Profile) AS profilepic,
               COALESCE(students.Active, lecturer.Active) AS active,
               COUNT(DISTINCT likes.post_id) AS likes
            FROM posts
            LEFT JOIN students ON posts.Regno = students.Regno
            LEFT JOIN lecturer ON posts.Regno = lecturer.Regno
            LEFT JOIN likes ON posts.id = likes.post_id
            WHERE posts.Regno = ? 
              AND ((students.Active IS NULL OR students.Active = 'true') 
                OR (lecturer.Active IS NULL OR lecturer.Active = 'true'))
            GROUP BY posts.id
            ORDER BY posts.id DESC
            LIMIT ? OFFSET ?`,
            [Regno, limit, offset]
        );

        if (results.length === 0) {
            return res.status(404).json({ result: [] });
        }

        // Fetch image URLs and combine with post data
        const postsData = await Promise.all(results.map(async (post) => {
            const { Image, profilepic, ...postData } = post;

            let postUrl = Image ? await s3.getSignedUrlPromise('getObject', { Bucket: 'add-imag', Key: Image }) : '';
            let profileUrl = profilepic ? await s3.getSignedUrlPromise('getObject', { Bucket: 'add-imag', Key: profilepic }) : '';

            return { ...postData, profilepic: profileUrl, posts: postUrl };
        }));

        return res.json({
            paging: { total, totalPages, currentPage: pagenum, limit },
            data: postsData,
        });

    } catch (error) {
        console.error('Error in /timeline/Id/ route:', error);
        return res.status(500).json({ result: [], error: 'Internal Server Error' });
    } finally {
        if (connection) connection.release();
    }
});


router.get('/api/poster/', async (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
  }

  let decoded;
  try {
      decoded = jwt.verify(token, secretKey);
      const isExpired = Date.now() >= decoded.exp * 1000;
      if (isExpired) {
          return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
      }
  } catch (err) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }

  const pagenum = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.per_page) || 10;
  const offset = (pagenum - 1) * limit;

  let connection;
  try {
      connection = await pool.getConnection();

      // Get the total count of posts
      const totalQuery = 'SELECT COUNT(*) AS total FROM posts';
      const [totalResult] = await connection.query(totalQuery);
      const total = totalResult[0].total || 0;
      const totalPages = Math.ceil(total / limit);

      // Fetch paginated posts
      const [results] = await connection.query(`
          SELECT posts.*, 
              COALESCE(students.fullname, lecturer.fullname) AS fullname,
              COALESCE(students.college_name, lecturer.college_name) AS collegename,
              COALESCE(students.Profile, lecturer.Profile) AS profilepic,
              COALESCE(students.Active, lecturer.Active) AS active,
              COUNT(DISTINCT likes.post_id) AS likes
          FROM posts
          LEFT JOIN students ON posts.Regno = students.Regno
          LEFT JOIN lecturer ON posts.Regno = lecturer.Regno
          LEFT JOIN likes ON posts.id = likes.post_id
          WHERE (students.Active IS NULL OR students.Active = 'true')
             OR (lecturer.Active IS NULL OR lecturer.Active = 'true')
          GROUP BY posts.id, fullname, collegename, profilepic, active
          ORDER BY posts.id DESC
          LIMIT ? OFFSET ?;
      `, [limit, offset]);

      if (results.length === 0) {
          return res.status(200).json({
              paging: { total: 0, totalPages: 0, currentPage: pagenum, limit },
              data: [],
          });
      }

      // Generate signed URLs for images
      const postsData = await Promise.all(results.map(async (post) => {
          const { Image, profilepic, ...postData } = post;

          let postUrl = 'https://your-default-image.com/post-placeholder.jpg';
          let profileUrl = 'https://your-default-image.com/profile-placeholder.jpg';

          try {
              if (Image) {
                  postUrl = await s3.getSignedUrlPromise('getObject', { Bucket: 'add-imag', Key: Image });
              }
              if (profilepic) {
                  profileUrl = await s3.getSignedUrlPromise('getObject', { Bucket: 'add-imag', Key: profilepic });
              }
          } catch (err) {
              console.error('Error generating S3 signed URLs:', err);
          }

          return { ...postData, profilepic: profileUrl, posts: postUrl };
      }));

      // Return the final response
      return res.json({
          paging: {
              total,
              totalPages,
              currentPage: pagenum,
              limit,
          },
          data: postsData,
      });

  } catch (error) {
      console.error('Error in /poster/ route:', error);
      return res.status(500).json({ result: [], error: 'Internal Server Error' });
  } finally {
      if (connection) {
          try {
              connection.release();
          } catch (releaseError) {
              console.error('Error releasing connection:', releaseError);
          }
      }
  }
});

   


module.exports = router;