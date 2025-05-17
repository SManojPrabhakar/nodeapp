const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const pool = require('./config.js');

require('dotenv').config();
const secretKey =process.env.SECRET_KEY
//updates
//update student info table 
router.patch("/user/update/", async (req, res) => {
    let connection;
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, secretKey);
        const { Id } = decoded;

        const {Email, Fullname, Gaurdian, Department, Desigination, Number, Address } = req.body;
       
        if (!Fullname || !Number || !Address) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Get a database connection
        connection = await pool.getConnection();
        await connection.beginTransaction(); // Start transaction

        // Try updating the students table
        const studentUpdateQuery = `
            UPDATE students SET fullname=?, Number=?, Address=?, Gaurdian=?, Email=?
            WHERE Id=?`;
        const [studentUpdateResult] = await connection.query(studentUpdateQuery, [Fullname, Number, Address, Gaurdian, Email, Id]);

        if (studentUpdateResult.affectedRows === 0) {
            // If not found in students table, update in lecturer table
            const lecturerUpdateQuery = `
                UPDATE lecturer SET fullname=?, Department=?, Desigination=?, Number=?, Address=? 
                WHERE Id=?`;
            const [lecturerUpdateResult] = await connection.query(lecturerUpdateQuery, [Fullname, Department, Desigination, Number, Address, Id]);

            if (lecturerUpdateResult.affectedRows === 0) {
                // If user not found in both tables, rollback transaction
                await connection.rollback();
                return res.status(404).json({ success: false, message: "User not found" });
            }
        }

        await connection.commit(); // Commit transaction
        return res.status(200).json({ success: true, message: "Updated Successfully" });

    } catch (err) {
        if (connection) await connection.rollback();
        
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
        } else if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
        }

        console.error("Error updating user:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    } finally {
        if (connection) connection.release();
    }
});


router.patch("/user/update/edit/", async (req, res) => {
    let connection;
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, secretKey);
        const { Regno } = decoded;

        const { Fullname, Year,Section,Sem,aRegno,Course } = req.body;
       
        /*if (!Fullname || !Number || !Address) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }*/

        // Get a database connection
        connection = await pool.getConnection();
        

        // Try updating the students table
        const studentUpdateQuery = `
            UPDATE students SET fullname=?, regno=?, year=?, sem=?, course=?, section=? 
            WHERE Regno=?`;
        const [studentUpdateResult] = await connection.query(studentUpdateQuery, [Fullname, aRegno, Year, Sem,Course, Section, aRegno]);

     

       
        return res.status(200).json({ success: true, message: "Updated Successfully" });

    } catch (err) {
        if (connection) await connection.rollback();
        
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
        } else if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
        }

        console.error("Error updating user:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    } finally {
        if (connection) connection.release();
    }
});

router.put("/Academic/student/update/", async (req, res) => {
    const token = req.headers.authorization;
    const { Year, Sem, Regnos } = req.body; // Destructuring req.body

    let connection;

    try {
        // Decode token
        const decoded = jwt.verify(token, secretKey);
        const { Regno } = decoded;

        // Check if the token has expired
        if (Date.now() >= decoded.exp * 1000) {
            return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
        }

        connection = await pool.getConnection();

        // Start a transaction
        await connection.beginTransaction();

        // Fetch current values from the 'students' table
        const selectQuery = `SELECT Regno, Year, Sem FROM students WHERE Regno IN (?)`;
        const [rows] = await connection.query(selectQuery, [Regnos]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No students found' });
        }

        // Check if there are changes
        const studentsToUpdate = rows.filter(student => student.Year !== Year || student.Sem !== Sem);

        if (studentsToUpdate.length === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'No changes detected, update not performed' });
        }

        // Update query
        const studentUpdateQuery = `UPDATE students SET Sem = ?, Year = ? WHERE Regno IN (?)`;
        await connection.query(studentUpdateQuery, [Sem, Year, Regnos]);

        // Commit the transaction
        await connection.commit();

        return res.status(200).json({ success: true, message: 'Updated Successfully' });

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
        } else {
            return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
        }
    } finally {
        if (connection) {
            await connection.release();
        }
    }
});



router.put("/Academic/lect/updatey/", async (req, res) => {
    const token = req.headers.authorization;
   
    const Year = req.body.Year;
    const Sem = req.body.Sem;
   

    let connection;  // Declare connection in the broader scope

    try {
        // Decode token
        const decoded = jwt.verify(token, secretKey);
        const { Regno } = decoded;

        // Check if the token has expired
        const isExpired = Date.now() >= decoded.exp * 1000;
        if (isExpired) {
            const errorMessage = 'Your session has expired. Please log in again.';
            return res.status(401).json({ success: false, message: errorMessage });
        }

        connection = await pool.getConnection();  // Assign connection here

        // Start a transaction
        await connection.beginTransaction();

        // Fetch current values from the 'students' table
        const selectQuery = "SELECT  Year, Sem FROM students WHERE Regno = ?";
        const [rows] = await connection.query(selectQuery, [Regno]);

        // Check if the student exists
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const currentValues = rows[0];

        // Check if any of the new values are different from the current values
        const isDifferent =
          
            currentValues.Year !== Year ||
            currentValues.Sem !== Sem

        if (isDifferent) {
            // Values are different, proceed with the update
            const studentUpdateQuery = "UPDATE students SET  Sem=?, Year=? WHERE Regno=?";
            await connection.query(studentUpdateQuery, [Course, Section, Sem, Year, Regno]);

            // Reset the Total and Attend columns to 0 in the studentattendance table
            const attendanceUpdateQuery = "UPDATE student_attedance SET Total = 0, Attended = 0,Attendance = JSON_OBJECT() WHERE Regno = ?";
            await connection.query(attendanceUpdateQuery, [Regno]);

            // Commit the transaction
            await connection.commit();

            return res.status(200).json({ success: true, message: 'Updated Successfully and attendance reset.' });
        } else {
            // Values are the same, do not update
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'No changes detected, update not performed' });
        }
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
        } else {
            return res.status(500).json({ success: false, message: 'Unauthorized: Token has expired or is invalid', error: err.message });
        }
    } finally {
        // Ensure connection is released if it was successfully created
        if (connection) {
            await connection.release();
        }
    }
});


router.patch("/user/Deactive/", async (req, res) => {
    try {
        const token = req.headers.authorization;
        const Active = req.body.Active;
      
        const decoded = jwt.verify(token, secretKey);
        const { Regno } = decoded;

        // Check if the token has expired
        const isExpired = Date.now() >= decoded.exp * 1000;
        if (isExpired) {
            const errorMessage = 'Your session has expired. Please log in again.';
            return res.status(401).json({ success: false, message: errorMessage });
        }

        connection = await pool.getConnection();
        try {
            // Start transaction
            await connection.beginTransaction();

            // Update in 'students' table
            const studentUpdateQuery = "UPDATE students SET Active=?  WHERE Regno=?";
            let [studentUpdateResult] = await connection.query(studentUpdateQuery, [Active, Regno]);

            // If not found in 'students' table, check and update in 'lecturer' table
            if (studentUpdateResult.affectedRows === 0) {
                const lecturerUpdateQuery = "UPDATE lecturer SET Active=? WHERE Regno=?";
                let [lecturerUpdateResult] = await connection.query(lecturerUpdateQuery, [Active, Regno]);

                // If not found in both tables
                if (lecturerUpdateResult.affectedRows === 0) {
                    console.log("User not found in both tables");
                    return res.status(404).json({ success: false, message: 'User not found' });
                }
            }

            // Commit the transaction
            await connection.commit();

            return res.status(200).json({ success: true, message: 'Updated Successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
        
            return res.json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
          } else {
            return res.json({ success: false, message: 'Unauthorized: Invalidtoken' });
          }
    }
});

router.put("/change/college/", async (req, res) => {
    let connection; 
  
    try {
      // Extract token from headers
      const token = req.headers.authorization
      if (!token) {
        return res.status(403).json({ success: false, message: "No token provided" });
      }
  
      // Verify JWT token
      const decoded = jwt.verify(token, secretKey);
      const { Id } = decoded; // Extract user ID from JWT
  
      // Extract request body
      const { Collegename, Code, Regno } = req.body;
     
      if (!Collegename || !Code || !Regno) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }
  
      connection = await pool.getConnection();
  
      // Step 1: Retrieve the correct College_Name from the register table using Code
      const checkSql = "SELECT College_Name FROM register WHERE code = ?";
      const [rows] = await connection.query(checkSql, [Code]);
  
      if (rows.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid code, college not found" });
      }
  
      const registeredCollege = rows[0].College_Name; // Correct case
  
      // Step 2: Check if the provided Collegename matches the one retrieved from the register table
      if (registeredCollege !== Collegename) {
        return res.status(400).json({ success: false, message: "College name does not match the registered name for this code" });
      }
  
      // Step 3: Update the lecturer's details
      const updateSql = "UPDATE lecturer SET College_Name = ?, Code = ?, Regno = ? WHERE Id = ?";
      const [result] = await connection.query(updateSql, [Collegename, Code, Regno, Id]);
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Lecturer not found or not authorized to update" });
      }
  
      res.json({ success: true, message: "College updated successfully" });
    } catch (error) {
      console.error("Error:", error);
  
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
      } else if (error.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Unauthorized: Invalidtoken" });
      }
  
      res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    } finally {
      if (connection) connection.release(); // Release connection
    }
  });

module.exports = router;