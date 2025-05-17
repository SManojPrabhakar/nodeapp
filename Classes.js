const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const s3 = require('./awsConfig');
require('dotenv').config();
const secretKey =process.env.SECRET_KEY
const multer = require('multer')
const storage = multer.memoryStorage(); // Store the file in memory
const upload = multer({ storage: storage });
const pool = require('./config.js');

router.post("/classes/new/incharge/", async (req, res) => {
  let connection;
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;

    const { Course, Year, Section, Sem, Name, Role, college_name } = req.body;

    if (!Course || !Year || !Section || !Sem || !Name || !Role) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    connection = await pool.getConnection();

    // Start transaction
    await connection.beginTransaction();

    // Check for duplicates
    const checkDuplicateQuery = `
      SELECT COUNT(*) AS count FROM lect_classes 
      WHERE Leact_Id = ? AND name = ?
    `;
    const [duplicateResult] = await connection.query(checkDuplicateQuery, [Id, Name]);

    if (duplicateResult[0].count > 0) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({ success: false, message: "Class with this name already exists for this lecturer" });
    }

    // Insert into lect_classes
    const insertClassQuery = `
      INSERT INTO lect_classes (Leact_Id, name, year, course, sem, Role, section)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [insertResult] = await connection.query(insertClassQuery, [Id, Name, Year, Course, Sem, Role, Section]);
    const classId = insertResult.insertId;
     console.log(classId)
    // Update other table (example: lecturer_profile)
    const updateQuery = `
      UPDATE students
      SET class_id = ?
      WHERE College_Name = ?
      And year=?
      And sem=?
      And course=?
      And section=?
    `;
    const [updateResult] = await connection.query(updateQuery, [classId, college_name, Year, Sem,  Course, Section]);

    // Commit transaction if all queries succeeded
    await connection.commit();
    connection.release();

    res.status(201).json({ success: true, message: "Class created successfully" });

  } catch (error) {
    console.error("Transaction failed:", error);

    if (connection) {
      await connection.rollback();
      connection.release();
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Duplicate entry: Class already exists" });
    } else {
      return res.status(500).json({ success: false, message: "Transaction failed. Internal Server Error" });
    }
  }
});

router.post("/classes/new/mentor/", async (req, res) => {
  let connection;
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;

    const { Course, Year, Section, Sem, Name, Role } = req.body;

    if (!Course || !Year || !Section || !Sem || !Name || !Role) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    connection = await pool.getConnection();

 
    const checkDuplicateQuery =` 
      SELECT COUNT(*) AS count FROM lect_classes 
      WHERE Leact_Id = ? AND name = ?`
    ;
    const [result] = await connection.query(checkDuplicateQuery, [Id, Name]);

    if (result.count > 0) {
      connection.release();
      return res.status(409).json({ success: false, message: "Class with this name already exists for this lecturer" });
    }

    
    const attendanceQuery = `
      INSERT INTO lect_classes (Leact_Id, name, year, course, sem, Role, section)
      VALUES (?, ?, ?, ?, ?, ?, ?)`
    ;

    await connection.query(attendanceQuery, [Id, Name, Year, Course, Sem, Role, Section]);

    connection.release();
    res.status(201).json({ success: true, message: "Class created successfully" });

  } catch (error) {
    console.error("Error inserting class data:", error);

    if (connection) {
      connection.release();
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Duplicate entry: Class already exists" });
    } else {
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }
});


router.put("/timetable/", async (req, res) => {
  let connection;
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);

    
    const {id,  days} = req.body;
   
    const subjectsJSON = JSON.stringify(days);

if (!days) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    connection = await pool.getConnection();

  const attendanceQuery = `
     UPDATE lect_classes 
SET Timetable = ? 
WHERE Id = ?;

    `;

  await connection.query(attendanceQuery, [subjectsJSON,id]);

    connection.release();
    res.status(201).json({ success: true, message: "Timetable created successfully" });

  } catch (error) {
    console.error("Error inserting class data:", error);

    if (connection) {
      connection.release();
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Duplicate entry: Class already exists" });
    } else {
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }
});

router.put("/subjects/", async (req, res) => {
  let connection;
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);

    
    const {id,  subjects } = req.body;
   
    const subjectsJSON = JSON.stringify(subjects);
console.log(subjectsJSON)
    if (  !subjects) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    connection = await pool.getConnection();

  const attendanceQuery = `
     UPDATE lect_classes 
SET subjects = ? 
WHERE Id = ?;

    `;

  await connection.query(attendanceQuery, [subjectsJSON,id]);

    connection.release();
    res.status(201).json({ success: true, message: "Subjects added successfully" });

  } catch (error) {
    console.error("Error inserting class data:", error);

    if (connection) {
      connection.release();
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Duplicate entry: Class already exists" });
    } else {
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  }
});


router.get("/collegetype/", async (req, res) => {
  let connection;
  try {
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { email, Regno } = decoded;

    const {college_name} = req.query // Extract from query parameters
   console.log(college_name)
    if (!college_name) {
      return res.status(400).json({ success: false, message: "College name is required" });
    }

    // Query to get collegetype from the register table
    const collegetypeQuery = `SELECT college_type 
    FROM register 
    WHERE College_Code =?`
  
    // Start database operations
    connection = await pool.getConnection();

    // Fetch collegetype
    const [rows] = await connection.query(collegetypeQuery, [college_name]);
  
    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: "College not found in register table" });
    }
   
    
    connection.release();
    console.log(rows)
    res.status(200).json({ success: true, collegetype: rows[0] });

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


router.get("/classes/get/", async (req, res) => {
  let connection;

  try {
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Query to get classes for the lecturer
    const attendanceQuery = `
      SELECT Id, Name, Year, Sem, Course, Role, Section 
      FROM lect_classes 
      WHERE Leact_Id = ?;
    `;

    // Execute the query and retrieve the result
    const [rows] = await connection.query(attendanceQuery, [Id]);

    // If no classes are found, return an empty array with success message
    if (rows.length === 0) {
      return res.status(200).json({ success: true, message: "No classes found", classes: [] });
    }
     
    // Send response with retrieved data
    res.status(200).json(rows);

  } catch (error) {
    console.error("Error retrieving class data:", error);

    // Handle JWT-specific errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } 

    // Handle SQL errors
    if (error.code === "ER_BAD_FIELD_ERROR") {
      return res.status(400).json({ success: false, message: "Invalid database field in query" });
    } else if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ success: false, message: "Database table not found" });
    }

    // Handle other server errors
    res.status(500).json({ success: false, message: "Failed to retrieve classes" });

  } finally {
    if (connection) connection.release(); // Ensure connection is always released
  }
});

router.get('/subjects/list/', async (req, res) => {
  const token = req.headers.authorization;
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
const {id}=req.query

  let connection;

  try {
      connection = await pool.getConnection();

      const query = `SELECT subjects FROM lect_classes WHERE Id=?`;
      const [fees] = await connection.query(query, [id]); // Extract rows properly

      res.status(200).json(fees[0]);
  } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
      if (connection) connection.release(); // Ensure connection is released
  }
});


router.get('/timetable/list/', async (req, res) => {
  const token = req.headers.authorization;
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
const {id}=req.query

  let connection;

  try {
      connection = await pool.getConnection();

      const query = `SELECT Timetable FROM lect_classes WHERE Id=?`;
      const [fees] = await connection.query(query, [id]); // Extract rows properly

      res.status(200).json(fees[0]);
  } catch (error) {
      console.error('Error executing query:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
      if (connection) connection.release(); // Ensure connection is released
  }
});

router.delete('/timetable/delete/', async (req, res) => {
  const token = req.headers.authorization;
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

  const { id } = req.query; // Or req.body if sending in body
  if (!id) {
      return res.status(400).json({ success: false, message: 'Missing timetable ID' });
  }

  let connection;

  try {
      connection = await pool.getConnection();

      const query = `DELETE FROM lect_classes WHERE Id = ?`;
      const [result] = await connection.query(query, [id]);

      if (result.affectedRows === 0) {
          return res.status(404).json({ success: false, message: 'No timetable found with the given ID' });
      }

      res.status(200).json({ success: true, message: 'Timetable deleted successfully' });
  } catch (error) {
      console.error('Error executing delete query:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
      if (connection) connection.release();
  }
});


router.delete("/classes/delete/:className/", async (req, res) => {
  let connection;

  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded; // Lecturer ID

    const { className } = req.params; // Class name from the request

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Check if the class exists and belongs to the lecturer
    const checkQuery = `SELECT Id FROM lect_classes WHERE Name = ? AND Leact_Id = ?`;
    const [existingClass] = await connection.query(checkQuery, [className, Id]);

    if (existingClass.length === 0) {
      return res.status(404).json({ success: false, message: "Class not found or unauthorized" });
    }

    // Delete the class
    const deleteQuery = `DELETE FROM lect_classes WHERE Name = ? AND Leact_Id = ?`;
    await connection.query(deleteQuery, [className, Id]);

    res.status(200).json({ success: true, message: "Class deleted successfully" });

  } catch (error) {
    console.error("Error deleting class:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    }

    res.status(500).json({ success: false, message: "Failed to delete class" });

  } finally {
    if (connection) connection.release(); // Ensure connection is always released
  }
});




router.get("/attendancesheets/get/", async (req, res) => {
  let connection;

  try {
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Query to get classes for the lecturer
    const attendanceQuery = `
      SELECT Id, Name, Subject, Year, Sem, Course,  Section 
      FROM lect_attendancesheet
      WHERE Lect_Id = ?;
    `;

    // Execute the query and retrieve the result
    const [rows] = await connection.query(attendanceQuery, [Id]);

    // If no classes are found, return an empty array with success message
    if (rows.length === 0) {
      return res.status(200).json({ success: true, message: "No classes found", classes: [] });
    }

    // Send response with retrieved data
    res.status(200).json(rows);

  } catch (error) {
    console.error("Error retrieving class data:", error);

    // Handle JWT-specific errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } 

    // Handle SQL errors
    if (error.code === "ER_BAD_FIELD_ERROR") {
      return res.status(400).json({ success: false, message: "Invalid database field in query" });
    } else if (error.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({ success: false, message: "Database table not found" });
    }

    // Handle other server errors
    res.status(500).json({ success: false, message: "Failed to retrieve classes" });

  } finally {
    if (connection) connection.release(); // Ensure connection is always released
  }
});




router.post("/attendance/new/", async (req, res) => {
  let connection;
  
  try {
    const token = req.headers.authorization;
    
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded;

    // Extract required fields from request body
    const { Subject,  Course, Year, Section, Sem, Name } = req.body;

    if ( !Subject || !Course || !Year || !Section || !Sem || !Name) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
 
    // Get database connection
    connection = await pool.getConnection();

    // Check if an attendance sheet already exists
    const checkQuery = `
      SELECT * FROM lect_attendancesheet 
      WHERE Lect_Id = ? AND subject = ? AND year = ? AND course = ? AND sem = ? AND section = ?
    `;

    const [existing] = await connection.query(checkQuery, [Id, Subject, Year, Course, Sem, Section]);

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Attendance sheet already exists" });
    }

    // Insert attendance sheet
    const attendanceQuery = `
      INSERT INTO lect_attendancesheet (Lect_Id,Name, subject, year, course, sem, section)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.query(attendanceQuery, [ Id,Name,Subject, Year, Course, Sem, Section]);

    res.status(201).json({ success: true, message: "Class created successfully" });

  } catch (error) {
    console.error("Error inserting attendance data:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    } else if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Duplicate entry found" });
    }

    res.status(500).json({ success: false, message: "Failed to insert attendance data" });

  } finally {
    if (connection) connection.release(); // Ensure connection is always released
  }
});

router.delete("/attendancesheets/delete/:className/", async (req, res) => {
  let connection;

  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
    }

    const decoded = jwt.verify(token, secretKey);
    const { Id } = decoded; // Lecturer ID

    const { className } = req.params; // Class name from the request

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Check if the class exists and belongs to the lecturer
    const checkQuery = `SELECT Id FROM lect_attendancesheet WHERE Name = ? AND Leact_Id = ?`;
    const [existingClass] = await connection.query(checkQuery, [className, Id]);

    if (existingClass.length === 0) {
      return res.status(404).json({ success: false, message: "Attendancesheet not found or unauthorized" });
    }

    // Delete the class
    const deleteQuery = `DELETE FROM lect_attendancesheet WHERE Name = ? AND Leact_Id = ?`;
    await connection.query(deleteQuery, [className, Id]);

    res.status(200).json({ success: true, message: "Attendancesheet deleted successfully" });

  } catch (error) {
    console.error("Error deleting class:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
    }

    res.status(500).json({ success: false, message: "Failed to delete class" });

  } finally {
    if (connection) connection.release(); // Ensure connection is always released
  }
});
router.get("/search/get/", async (req, res) => {
  let connection;

  try {
    // Check for authorization token
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    // Verify token
    try {
      jwt.verify(token, secretKey);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
      } else if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
      }
    }

    // Get college name from query parameters
    const collegeName = req.query.college_name;
    if (!collegeName) {
      return res.status(400).json({ success: false, message: "Bad Request: college_name is required" });
    }

    // Database query to fetch student details
    const attendanceQuery = `
      SELECT Regno, Fullname, Profile, Year, Sem
      FROM students 
      WHERE college_name = ?;
    `;

    // Get database connection
    connection = await pool.getConnection();
    const [rows] = await connection.query(attendanceQuery, [collegeName]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No students found for this college" });
    }

    // Generate pre-signed URLs for profile images
    const studentsWithProfileUrls = await Promise.all(
      rows.map(async ({ Regno, Fullname, Year, Sem, Profile }) => {
        let profileUrl = null;
        if (Profile) {
          try {
            profileUrl = s3.getSignedUrl("getObject", {
              Bucket:'add-imag',
              Key: Profile,
              Expires: 3600, // 1 hour expiration
            });
          } catch (s3Error) {
            console.error("Error generating S3 URL:", s3Error);
          }
        }
        return { Regno, Fullname, Year, Sem, Profilepic: profileUrl };
      })
    );

    res.status(200).json(studentsWithProfileUrls);
  } catch (error) {
    console.error("Error retrieving student data:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
});


router.post("/uploadassignment/", upload.single('file'), async (req, res) => {
  let connection;

  try {
    // ✅ 1. Verify Token
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Token missing' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired' });
      } else {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
      }
    }

    // ✅ 2. Get Data
    const { classid, subjectname, due_date } = req.body;
    const file = req.file;

    if (!classid || !subjectname || !due_date || !file) {
      return res.status(400).json({ success: false, message: 'Missing required fields or file' });
    }

    // ✅ 3. Upload to S3
    const key = `assignments/${file.originalname}`;
    const params = {
      Bucket: 'add-imag',
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await s3.putObject(params).promise();

    // ✅ 4. Insert into DB
    connection = await pool.getConnection();
    const insertQuery = `
      INSERT INTO assignments (classid, subjectname, assimage, Deadline, timestamp)
      VALUES (?, ?, ?, ?, UNIX_TIMESTAMP())
    `;

    await connection.execute(insertQuery, [
      classid,
      subjectname,
      key, // Store single string instead of JSON array
      due_date,
    ]);

    res.status(200).json({
      success: true,
      message: 'Assignment uploaded and saved successfully',
    });
  } catch (error) {
    console.error('Error during assignment upload:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});



router.get("/search/home/", async (req, res) => {
  let connection;

  try {
    // Check for authorization token
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    // Verify token
    try {
      jwt.verify(token, secretKey);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
      } else if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
      }
    }

    // Database query to fetch student and lecturer details
    const attendanceQuery = `
      SELECT Fullname, Profile FROM students
      UNION
      SELECT Fullname, Profile FROM lecturer;
    `;

    // Get database connection
    connection = await pool.getConnection();
    const [rows] = await connection.query(attendanceQuery);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "No students or lecturers found" });
    }

    // Generate pre-signed URLs for profile images
    const profilesWithUrls = await Promise.all(
      rows.map(async ({ Fullname, Profile }) => {
        let profileUrl = null;
        if (Profile) {
          try {
            profileUrl = s3.getSignedUrl("getObject", {
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: Profile,
              Expires: 3600, // 1 hour expiration
            });
          } catch (s3Error) {
            console.error("Error generating S3 URL:", s3Error);
          }
        }
        return { Fullname, Profilepic: profileUrl };
      })
    );
    
    res.status(200).json(profilesWithUrls);
  } catch (error) {
    console.error("Error retrieving student and lecturer data:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/assignments/', async (req, res) => {
  const token = req.headers.authorization;
  const { id } = req.query;
console.log(id)
  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secretKey);
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    return res.status(500).json({ message: 'Failed to verify token' });
  }

  try {
    const connection = await pool.getConnection();

    const [results] = await connection.execute(
      'SELECT subjectname, assimage, Deadline, timestamp FROM assignments WHERE classid = ?',
      [id]
    );

    connection.release();

    const assignmentsWithUrls = await Promise.all(
      results.map(async (assignment) => {
        let imageKey = '';

        try {
          const rawImage = assignment.assimage;

          if (Array.isArray(rawImage)) {
            imageKey = rawImage[0];
          } else if (typeof rawImage === 'string') {
            if (rawImage.trim().startsWith('[')) {
              const parsed = JSON.parse(rawImage);
              imageKey = parsed[0];
            } else {
              imageKey = rawImage.split(',')[0].trim(); // handle comma-separated fallback
            }
          }

        } catch (err) {
          console.error('Error parsing assimage field:', err);
        }

        let signedUrl = '';
        try {
          if (imageKey) {
            signedUrl = await s3.getSignedUrlPromise('getObject', {
              Bucket: process.env.Bucket,
              Key: imageKey,
              Expires: 60 * 60, // 1 hour
            });
          }
        } catch (err) {
          console.error('Error generating signed URL:', err);
        }

        return {
          subjectname: assignment.subjectname,
          assimages: signedUrl || null,
          deadline: assignment.Deadline,
          timestamp: assignment.timestamp
        };
      })
    );

    res.status(200).json({ success: true, assignments: assignmentsWithUrls });

  } catch (err) {
    console.error('DB Error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;