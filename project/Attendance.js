const express = require('express');
const router = express.Router();
const multer = require('multer')
const jwt = require('jsonwebtoken');
const s3 = require('./awsConfig');
require('dotenv').config();
const secretKey =process.env.SECRET_KEY

const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });

const pool = require('./config.js');
  

router.post("/attendance/new/", async (req, res) => {
  const token = req.headers.authorization;
  let connection;  // Declare connection outside for proper rollback

  try {
      if (!token) {
          return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
      }

      const decoded = jwt.verify(token, secretKey);
      const { subject_name, date, period, attendance, lecturer_id} = req.body;

      // Validate input data
      if (!subject_name || !date || !Array.isArray(attendance) || !lecturer_id) {
          return res.status(400).json({ error: "Invalid input data" });
      }

      if (attendance.length === 0) {
          return res.status(400).json({ error: "Attendance array cannot be empty" });
      }

      const unixTimestamp = Math.floor(Date.now() / 1000);
      const values = attendance.map(record => [
          record.student_id,
          subject_name,
          date,
          period,
          record.is_present,
          unixTimestamp
      ]);

      const attendanceQuery = `
          INSERT INTO attendance (student_Id, subject_name, date, period, is_present, timestamp)
          VALUES ?
      `;

      const lecturerQuery = `
          INSERT INTO lecturer (lecturer_id, subject_name, course, Year, section, date, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      connection = await pool.getConnection();
      await connection.beginTransaction();

      await connection.query(attendanceQuery, [values]);
      await connection.query(lecturerQuery, [
          lecturer_id, subject_name, course, Year, section, date, unixTimestamp
      ]);

      await connection.commit();
      connection.release();

      res.status(201).json({ success: true, message: "Attendance and lecturer records inserted successfully" });

  } catch (error) {
      console.error("Error inserting attendance data:", error);

      if (connection) {
          await connection.rollback();
          connection.release();
      }

      if (error.name === "TokenExpiredError") {
          return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
      } else if (error.name === "JsonWebTokenError") {
          return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
      } else if (error.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Duplicate entry detected" });
      } else if (error.code === "ER_NO_REFERENCED_ROW" || error.code === "ER_NO_REFERENCED_ROW_2") {
          return res.status(400).json({ error: "Foreign key constraint failed" });
      } else if (error.code === "ER_BAD_NULL_ERROR") {
          return res.status(400).json({ error: "A required field cannot be NULL" });
      } else if (error.code === "ER_PARSE_ERROR") {
          return res.status(500).json({ error: "SQL syntax error" });
      }

      res.status(500).json({ error: "Failed to insert attendance and lecturer records" });
  }
});

 
router.get('/getattendance/new/single/', async (req, res) => {
  let connection;
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;
 
   

    const query = "SELECT subject_name, date, is_present, period FROM attendance WHERE student_id = ?";
    
    connection = await pool.getConnection();
    const [result] = await connection.query(query, [Id]);
    connection.release();

    if (!result.length) {
      return res.status(200).json({ success: true, message: "No attendance records found", attendanceDetails: [] });
    }

    let totalClasses = result.length; 
    let attendedClasses = 0;

    const attendanceDetails = result.reduce((acc, curr) => {
      try {
        let date = curr.date;
        if (!(date instanceof Date)) {
          throw new Error('Invalid date format');
        }

        const normalizedDate = date.toISOString().split('T')[0];

        const subjectDetails = {
          subject_name: curr.subject_name,
          period: curr.period,
          is_present: curr.is_present
        };

        if (curr.is_present === 1) {
          attendedClasses += 1;
        }

        const existingDate = acc.find(item => item.date === normalizedDate);
        if (existingDate) {
          existingDate.subjects.push(subjectDetails);
        } else {
          acc.push({ date: normalizedDate, subjects: [subjectDetails] });
        }
      } catch (err) {
        console.error("Date processing error:", err);
      }
      return acc;
    }, []);

    res.status(200).json({ 
      success: true, 
      message: [{
        total_classes: totalClasses,
        attended_classes: attendedClasses,
        attendanceDetails: attendanceDetails
      }]
    });

  } catch (error) {
    console.error('Error executing query:', error);

    if (connection) {
      connection.release();
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(400).json({ success: false, message: "Invalid database field name in query" });
    } else if (error.code === 'ER_PARSE_ERROR') {
      return res.status(400).json({ success: false, message: "SQL syntax error in query" });
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ success: false, message: "Table not found in database" });
    } else {
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
});


  
    module.exports = router;