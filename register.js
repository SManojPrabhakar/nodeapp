const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const pool = require('./config.js');

require('dotenv').config();
const secretKey =process.env.SECRET_KEY

  router.post('/register', async (req, res) => {
    try {
        // Get the JWT token from the Authorization header
        const token = req.cookies.token;
      
        if (!token) {
            return res.status(401).json({ success: false, message: 'Authorization token is missing or invalid.' });
        }
       

        // Verify the token
        const decodedToken = jwt.verify(token, secretKey);
        if (Date.now() >= decodedToken.exp * 1000) {
            return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
        }

        // Get data from the request body
        const {
            State,
            College_Type,
            College_Code,
            College_Name,
            College_Email,
            College_Number,
            Principal,
            Imagekeys,
            P_Email,
            College_Address
        } = req.body;
        
        let longValue = Number(College_Number);
        
        // Check if all fields are provided
        if (!State || !College_Type || !College_Code || !College_Name || !College_Email || !College_Number || !Principal || !P_Email || !College_Address) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
        }

        // Insert data into the database
        const connection = await pool.getConnection();
        try {
            await connection.query(
                `INSERT INTO register 
                (State, College_Type, College_Code, College_Name, College_Address, College_Email, College_Admin_Number, Principal, Imagekeys, P_Email) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [State, College_Type, College_Code, College_Name, College_Address, College_Email,longValue, Principal,Imagekeys, P_Email]
            );
        } finally {
            connection.release(); // Always release the connection
        }

        // Send success response
        res.status(200).json({ success: true, message: 'College registered successfully!' });
    } catch (error) {
        // Handle token errors
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token. Please log in again.' });
        }

        // Handle duplicate entry errors
        if (error.code === 'ER_DUP_ENTRY') {
            let message = 'Duplicate entry: ';
            if (error.sqlMessage.includes('College_Email')) message += 'Email already exists.';
            if (error.sqlMessage.includes('College_Code')) message += 'College code already exists.';
            if (error.sqlMessage.includes('College_Name')) message += 'College name already exists.';
            if (error.sqlMessage.includes('College_Number')) message += 'College number already exists.';
            return res.status(400).json({ success: false, message });
        }

        // Handle other errors
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});
  module.exports = router;