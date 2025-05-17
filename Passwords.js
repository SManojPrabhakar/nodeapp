const express = require('express');
const router = express.Router();
const app = express();
const cookieParser = require('cookie-parser');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');



app.use(cookieParser());
app.use(express.json());


const pool = require('./config.js');


require('dotenv').config();
const secretKey =process.env.SECRET_KEY


router.patch('/password/change', async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
      return res.status(401).json({ success: false, message: "Authorization token missing" });
  }

  const { password, newpassword } = req.body;
  if (!password || !newpassword) {
      return res.status(400).json({ success: false, message: "Both current and new passwords are required" });
  }

  let decoded;
  try {
      decoded = jwt.verify(token, secretKey);
  } catch (error) {
      if (error.name === "TokenExpiredError") {
          return res.status(401).json({ success: false, message:"Unauthorized: Token has expired or is invalid" });
      }
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token", error: error.message });
  }

  const { email } = decoded;
  let connection;

  try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Fetch user password
      const [rows] = await connection.query("SELECT Password FROM students WHERE Email = ?", [email]);


      // Validate old password
      const isMatch = await bcrypt.compare(password, rows[0].Password);
      if (!isMatch) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: "Incorrect current password" });
      }

      // Hash new password after validation
      const newHashedPassword = await bcrypt.hash(newpassword, 10);
      await connection.query("UPDATE students SET Password = ? WHERE Email = ?", [newHashedPassword, email]);

      await connection.commit();
      res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
      if (connection) await connection.rollback();
      console.error("Error updating password:", error);

      res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
      if (connection) connection.release(); // Ensure connection is always released
  }
});

router.patch('/lectpassword/change', async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
      return res.status(401).json({ success: false, message: "Authorization token missing" });
  }

  const { password, newpassword } = req.body;
  if (!password || !newpassword) {
      return res.status(400).json({ success: false, message: "Both current and new passwords are required" });
  }

  let decoded;
  try {
      decoded = jwt.verify(token, secretKey);
  } catch (error) {
      if (error.name === "TokenExpiredError") {
          return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
      }
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid token", error: error.message });
  }

  const { email } = decoded;
  let connection;

  try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Fetch user password
      const [rows] = await connection.query("SELECT Password FROM Lecturer WHERE Email = ?", [email]);


      // Validate old password
      const isMatch = await bcrypt.compare(password, rows[0].Password);
      if (!isMatch) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: "Incorrect current password" });
      }

      // Hash new password after validation
      const newHashedPassword = await bcrypt.hash(newpassword, 10);
      await connection.query("UPDATE Lecturer SET Password = ? WHERE Email = ?", [newHashedPassword, email]);

      await connection.commit();
      res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
      if (connection) await connection.rollback();
      console.error("Error updating password:", error);

      res.status(500).json({ success: false, message: "Internal Server Error" });
  } finally {
      if (connection) connection.release(); // Ensure connection is always released
  }
});


router.patch('/password/verify/', async (req, res) => {
  const token = req.headers.authorization;
  const { password } = req.body;

  if (!token || !password) {
      return res.status(400).json({ success: false, message: "Token and password are required" });
  }

  let connection;

  try {
      // Decode the token
      let decoded;
      try {
          decoded = jwt.verify(token, secretKey);
      } catch (error) {
          if (error.name === "TokenExpiredError") {
              return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
          }
          return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
      }

      const { email } = decoded;

      connection = await pool.getConnection();

      // Fetch user password
      const [rows] = await connection.query("SELECT Password FROM students WHERE Email = ?", [email]);

      if (rows.length === 0) {
          return res.status(404).json({ success: false, message: "User not found" });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, rows[0].Password);
      if (!isMatch) {
          return res.status(401).json({ success: false, message: "Invalid password" });
      }

      res.status(200).json({ success: true, message: "Password verified successfully" });

  } catch (error) {
      console.error("Error handling request:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
      if (connection) connection.release(); // Always release connection
  }
});


  router.patch('/deactivate/', async (req, res) => {
    let connection;
    try {
      const token = req.headers.authorization;
      const { Active } = req.body;
  
      // Ensure token and Active are provided
      if (!token || Active === undefined) {
        return res.status(400).json({ success: false, message: 'Token and Active status are required' });
      }
  console.log(Active)
      // Get a connection from the pool
      connection = await pool.getConnection();
  
      // Decode the token to get the user's email
      const decoded = jwt.verify(token, secretKey);
      const { email } = decoded;
  
      if (!email) {
        return res.status(400).json({ success: false, message: 'Invalid token' });
      }
  
      // Update the Active status for the user with the given email
      const [result] = await connection.query("UPDATE students SET Active = ? WHERE Email = ?", [Active, email]);
  
      // Check if the update affected any rows
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
  
      // Respond with success if the update was successful
      res.status(200).json({ success: true, message: "Status updated successfully" });
  
    } catch (error) {
      // Handle errors and respond with a 500 status code
      console.error('Error handling request:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    } finally {
      // Ensure the connection is released in all cases
      if (connection) connection.release();
    }
  });
  
  
  module.exports = router;