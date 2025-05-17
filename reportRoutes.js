const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mysql = require('mysql2/promise');
const pool = require('./config.js');

require('dotenv').config();
const secretKey =process.env.SECRET_KEY
const transporter = nodemailer.createTransport({
    service: 'Gmail', // Use your email service provider
    auth: {
      user: 'manojprabhakar3792@gmail.com', // Replace with your email
      pass: 'sogf bnmv nijm jhjz' // Replace with your email password
    }
  });

  router.post("/reporting/", async (req, res) => {
    try {
        const token = req.headers.authorization;
        const { Email,Regno,Fullname, Organization,Number,Message } = req.body;

        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
        }

        // Verify the token
        let decoded;
        try {
            decoded = jwt.verify(token, secretKey);
        } catch (error) {
            console.error("JWT Verification Error:", error);
            if (error.name === "TokenExpiredError") {
                return res.status(401).json({ success: false, message: "Unauthorized: Token has expired or is invalid" });
            }
            return res.status(401).json({ success: false, message: "Unauthorized: Invalid token" });
        }

        // Validate required fields
        if (!Email || !Organization || !Fullname || !Number || !Message) {
            return res.status(400).json({ success: false, message: "Missing required fields (Email, Organization, Fullname, ReportDetails)" });
        }

        // Prevent Email Header Injection
        const sanitizedEmail = Email.replace(/(\r\n|\n|\r)/gm, "");

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitizedEmail)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        // Send email
        const mailOptions = {
            from: "manojprabhakar3792@gmail.com",
            to: Email,
            subject: `Reported - ${Organization}`,
            text: `Dear ${Fullname},

We'd like to thank you for reporting the issue to us.
We will review the complaint and get in touch with you
in case any further information is needed.

Best regards,
The Attendance2day Team`
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error("Error sending email:", emailError);
            return res.status(500).json({ success: false, message: "Failed to send email", error: emailError.message });
        }

        // Insert report data into MySQL table
        const connection = await pool.getConnection();
        try {
            const query = `
                INSERT INTO report (email, Username, full_name,Regno,Number, message, Timestamp) 
                VALUES (?, ?, ?, ?, ?, ?,UNIX_TIMESTAMP())`;
            await connection.execute(query, [Email, Organization, Fullname, Regno,Number,Message]);
            connection.release();

            return res.status(200).json({ success: true, message: "Email sent and report saved successfully" });
        } catch (dbError) {
            connection.release();
            console.error("Database Error:", dbError);

            // Handling specific MySQL errors
            if (dbError.code === "ER_DUP_ENTRY") {
                return res.status(409).json({ success: false, message: "Duplicate report entry" });
            } else if (dbError.code === "ER_BAD_FIELD_ERROR") {
                return res.status(500).json({ success: false, message: "Invalid database field" });
            }

            return res.status(500).json({ success: false, message: "Failed to save report", error: dbError.message });
        }

    } catch (unexpectedError) {
        console.error("Unexpected Error:", unexpectedError);
        return res.status(500).json({ success: false, message: "Something went wrong", error: unexpectedError.message });
    }
});

  

  /*router.put('/dbrepo/', async (req, res) => {
    try {
        // Extract token from headers
        const token = req.headers.authorization;
        if (!token) {
          return res.status(401).json({ success: false, message: 'No token provided.' });
        }
    
        // Verify and decode the JWT token
        const decoded = jwt.verify(token, secretKey); // Replace 'your-secret-key' with your actual secret key
      const { Organization, Message,Number } = req.body;
      const { Regno}  = decoded;
      const isExpired = Date.now() >= decoded.exp * 1000;
      if (isExpired) {
        return res.status(401).json({ success: false, message: 'Your session has expired. Please log in again.' });
      }
  
      
      // Insert the received data into MySQL database
      const connection = await pool.getConnection();
  
      // Update the Report column with the JSON data for the specified email
      const [results] = await connection.query(
      `
    UPDATE students
    SET Report = JSON_ARRAY_APPEND(
        Report,
        '$',
        JSON_OBJECT(
            'OriganizationName/Username', ?,
            'Number',?,
            'Issue', ?
        )
    )
    WHERE Regno = ?;
  `,
        [Organization,Number,Message,Regno]
      );
  
      connection.release();
  
      // Check if any rows were affected
      if (results.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'No user found with the provided email.' });
      }
  
      // Send a success response to the client
      const serverResponse = 'Report updated successfully';
      res.status(200).json({ success: true, message: serverResponse });
  
    } catch (error) {
      console.error('Error handling request:', error);
  
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired' });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      } else {
        console.error('Error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
      }
    }
  });*/
  
  router.post("/app/feedback/", async (req, res) => {
    try {
        const token = req.headers.authorization;
        const { Email, Message } = req.body;
            console.log(Email)
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized: Token missing" });
        }

        // Verify the token
        let decoded;
        try {
            decoded = jwt.verify(token, secretKey);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'Unauthorized: Token has expired or is invalid' });
            }
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token', error: error.message });
        }

        const { Regno } = decoded; // Extract Regno from decoded token

        // Validate required fields
        if (!Email || !Message) {
            return res.status(400).json({ success: false, message: "Missing required fields (Email, Message)" });
        }

        // Prevent Email Header Injection
        const sanitizedEmail = Email.replace(/(\r\n|\n|\r)/gm, "");

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitizedEmail)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        // Send email confirmation
        const mailOptions = {
            from: "manojprabhakar3792@gmail.com",
            to: "prabhakarm605@gmail.com",
            subject: "Thank You for Your Feedback!",
            text: `Dear User,

Thank you for your valuable feedback. We appreciate your time and effort in helping us improve.

If you have any further suggestions or concerns, feel free to reach out.

Best regards,
The Attendance2day Team`
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error("Error sending email:", emailError);
            return res.status(500).json({ success: false, message: "Failed to send email", error: emailError.message });
        }

        // Insert feedback data into MySQL table
        const connection = await pool.getConnection();
        try {
            const query = `INSERT INTO feedback (regno, message, Timestamp) VALUES (?, ?, UNIX_TIMESTAMP())`;
            await connection.execute(query, [Regno, Message]);
            connection.release();

            return res.status(200).json({ success: true, message: "Feedback submitted successfully" });
        } catch (dbError) {
            connection.release();
            console.error("Database Error:", dbError);

            return res.status(500).json({ success: false, message: "Failed to save feedback", error: dbError.message });
        }
    } catch (unexpectedError) {
        console.error("Unexpected Error:", unexpectedError);
        return res.status(500).json({ success: false, message: "Something went wrong", error: unexpectedError.message });
    }
});


  module.exports = router;