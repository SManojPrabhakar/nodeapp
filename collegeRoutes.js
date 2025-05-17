const express = require('express');
const router = express.Router();
require('dotenv').config();
const multer = require('multer');
const s3 = require('./awsConfig');
const jwt = require('jsonwebtoken');
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });

const pool = require('./config.js');

const secretKey =process.env.SECRET_KEY

  router.get('/sin/collegenames/', async (req, res) => {
    try {
      
        const query = 'SELECT type, college_name FROM college_details';
        const connection = await pool.getConnection();

        try {
            const [rows] = await connection.query(query);
            connection.release();

            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'No colleges registered' });
            }

            // Map rows to response format
            const collegeData = rows.map(row => ({
                type: row.type,
                college_name: row.college_name,
            }));

            return res.status(200).json({ success: true, colleges: collegeData });
        } catch (queryError) {
            connection.release();
            console.error('Error executing query:', queryError);
            return res.status(500).json({ success: false, message: 'Failed to fetch college data' });
        }
    } catch (error) {
        console.error('Internal Server Error:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.get('/collegenames/', async (req, res) => {
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
  
      const query = 'SELECT type, college_name FROM college_details';
      const connection = await pool.getConnection();

      try {
          const [rows] = await connection.query(query);
          connection.release();

          if (rows.length === 0) {
              return res.status(404).json({ success: false, message: 'No colleges registered' });
          }

          // Map rows to response format
          const collegeData = rows.map(row => ({
              type: row.type,
              college_name: row.college_name,
          }));

          return res.status(200).json({ success: true, colleges: collegeData });
      } catch (queryError) {
          connection.release();
          console.error('Error executing query:', queryError);
          return res.status(500).json({ success: false, message: 'Failed to fetch college data' });
      }
  } catch (error) {
      console.error('Internal Server Error:', error);
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

router.get('/single/student/:Id', async (req, res) => {
  
  const Id=req.params.Id
  
 
try {
   const query = 'SELECT * FROM students where college_code=? And Course=? And Section=? And Year=? And Sem=?';

   // Use the connection pool to get a connection
   const connection = await pool.getConnection();

   // Execute the query using the connection
   const [result] = await connection.query(query,[college_code,Course,section,year,sem]); // Destructuring the result to access rows directly

   // Release the connection back to the pool
   connection.release();

 res.status(200).json(result);// Sending rows
   
} catch (error) {
   console.error('Error executing query:', error);
   res.status(500).json({ success: false, message: 'Internal Server Error' });
}
});


router.get('/students/:college/:course/:section/:year/:sem', async (req, res) => {
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

  const { college, course, section, year, sem } = req.params;

  // Validate route parameters
  if (!college || !course || !section || !year || !sem) {
    return res.status(400).json({ success: false, message: 'Missing required parameters' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const query = `
      SELECT Fullname, Year, Course, Section, Sem, Regno, Profile, Id 
      FROM students 
      WHERE college_name = ? 
      AND Course = ? 
      AND Section = ? 
      AND Year = ? 
      AND Sem = ? 
      AND (Active IS NULL OR Active = 'true')
    `;

    const [result] = await connection.query(query, [college, course, section, year, sem]);
    console.log(college)
    connection.release(); // Release connection immediately after query

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found.' });
    }

    const formattedResult = await Promise.all(result.map(async (student) => {
      const { Profile, ...rest } = student;

      let profilepic = null;
      if (Profile) {
        try {
          const profileParams = { Bucket: 'add-imag', Key: Profile };
          profilepic = await s3.getSignedUrlPromise('getObject', profileParams);
        } catch (err) {
          console.error(`Error retrieving image for ${Profile}:`, err);
        }
      }

      return { ...rest, profilepic };
    }));

    res.status(200).json(formattedResult);
  } catch (error) {
    if (connection) connection.release();
    
    console.error('Error executing query:', error.message, error.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error', errorMessage: error.message });
  }
});





router.get('/collages/', async (req, res) => {
    try {

      const query = 'SELECT College_Name,Imagekeys  FROM register ORDER BY id DESC LIMIT 4';
  
      // Use the connection pool to get a connection
      const connection = await pool.getConnection();
  
      // Execute the query using the connection
      const [results] = await connection.query(query);
  
      // Release the connection back to the pool
      connection.release();

      if (results.length === 0) {
        res.json({ message: 'Be the first one to register' });
      } else {
        // Extract the actual data from the results
        const collages = results.map(result => result.College_Name);
        const keys = results.map(keys => keys.Imagekeys);
  
        // Fetch image URLs from S3 using keys
        const imageUrls = await Promise.all(keys.map(async key => {
          const params = {
            Bucket: 'add-imag',
            Key: key,
          };
         
          const url = await s3.getSignedUrlPromise('getObject', params);
          
          return url;
        }));
      
     
        // Combine collages and imageUrls and send the response
        const responseData = collages.map((collage, index) => ({
          collage_name: collage,
          imageUrl: imageUrls[index],
        }));
       
        res.json(responseData);
      }
      
    } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  });


  router.post('/s3upload', upload.array('file'), (req, res) => {
    try {
      const files = req.files;
      console.log(files)
  
      if (!files || files.length === 0) {
        return res.status(400).send('No files were uploaded.');
      }
  
      const uploadedImages = [];
  
      files.forEach((file, index) => {
        const imageBuffer = file.buffer;
        const uniqueKey = `file_${Date.now()}_${index}.jpg`; // Use index to ensure unique keys for each file
  
        // Upload image to S3 bucket
        const params = {
          Bucket: 'add-imag',
          Key: uniqueKey,
          Body: imageBuffer,
          ContentType: 'image/jpeg',
        };
  
        s3.upload(params, (err, data) => {
          if (err) {
            console.log(`Error uploading image ${index + 1}:`, err);
          } else {
            console.log(`Image ${index + 1} uploaded successfully. S3 URL:`, data.Location);
            uploadedImages.push(uniqueKey);
          }
  
          if (uploadedImages.length === files.length) {
            // All files have been processed
            res.status(200).json(uploadedImages);
          }
        });
      });
    } catch (error) {
      console.log('Error handling file upload:', error.message);
      res.status(500).send('Internal Server Error');
    }
  });
  
  router.delete('/s3delete/:key', (req, res) => {
    const key = req.params.key;
  
    const params = {
      Bucket: 'add-imag',
      Key: key,
    };
  
    s3.deleteObject(params, (err, data) => {
      if (err) {
        console.log('Error deleting image:', err);
        res.status(500).json({ message: 'error in deleting' });
      } else {
       
        res.status(200).json({ message: 'Image deleted successfully.' });
      }
    });
  });

  
  router.put('/profilepic/', upload.single(), async (req, res) => {
    let connection;
    try {
      let filename = "";
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
      const files = req.files;
  
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }
  
      // Upload files to S3
      try {
        await Promise.all(files.map(async (file) => {
          const params = { Body: file.buffer, Bucket: 'add-imag', Key: file.originalname };
          await s3.putObject(params).promise();
          filename = file.originalname;
        }));
      } catch (s3Error) {
        console.error('S3 Upload Error:', s3Error);
        return res.status(500).json({ error: 'Failed to upload file to S3' });
      }
  
      connection = await pool.getConnection();
  
      // Check in students table
      try {
        const [studentRows] = await connection.execute('SELECT Regno FROM students WHERE Regno = ?', [Regno]);
  
        if (studentRows.length > 0) {
          await connection.execute('UPDATE students SET Profile = ? WHERE Regno = ?', [filename, Regno]);
        } else {
          const [lecturerRows] = await connection.execute('SELECT Regno FROM lecturer WHERE Regno = ?', [Regno]);
  
          if (lecturerRows.length > 0) {
            await connection.execute('UPDATE lecturer SET Profile = ? WHERE Regno = ?', [filename, Regno]);
          } else {
            return res.status(404).json({ error: 'User not found in students or lecturers' });
          }
        }
      } catch (sqlError) {
        console.error('Database Query Error:', sqlError);
        return res.status(500).json({ error: 'Failed to execute database query' });
      }
  
      res.json({ message: 'Profile picture updated successfully' });
  
    } catch (error) {
      console.error('Unexpected Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      if (connection) connection.release();
    }
  });
  
  module.exports = router;