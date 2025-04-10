const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const pool = require('./config.js');

require('dotenv').config();
const secretKey =process.env.SECRET_KEY

router.get('/college-feelist/receipts/', async (req, res) => {
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

    const { Regno } = decoded;
    let connection;

    try {
        connection = await pool.getConnection();

        const query = `SELECT Feetype, paidFee, PaymentDate FROM CollegeFee WHERE regno = ?`;
        const [fees] = await connection.query(query, [Regno]); // Extract rows properly

        res.status(200).json({ success: true, message: fees });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        if (connection) connection.release(); // Ensure connection is released
    }
});

router.get('/college-feedue/list/', async (req, res) => {
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

    const { Regno } = decoded;
    let connection;

    try {
        connection = await pool.getConnection();

        const query = `SELECT Fee_type, Fee_year, Fee_due FROM yearly_Fees WHERE regno = ?`;
        const [fees] = await connection.query(query, [Regno]); // Extract rows properly

        res.status(200).json({ success: true, message: fees });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        if (connection) connection.release(); // Ensure connection is released
    }
});

router.post('/college-fee/', async (req, res) => {
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

    const { Regno, Fee_type, Fee, Ayear } = req.body;
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Check if a payment record already exists
        const checkQuery = `SELECT COUNT(*) AS count FROM CollegeFee WHERE Regno = ? AND Feetype = ? AND AcademicYear = ?`;
        const [checkResult] = await connection.query(checkQuery, [Regno, Fee_type, Ayear]);

        if (checkResult.count > 0) {
            throw new Error(`A payment record already exists for Regno: ${Regno}, FeeType: ${Fee_type}, Academic Year: ${Ayear}`);
        }

        // Insert new payment record
        const insertQuery = `INSERT INTO CollegeFee (Regno, Feetype, PaidFee, AcademicYear, PaymentDate) 
                             VALUES (?, ?, ?, ?, UNIX_TIMESTAMP())`;
        await connection.query(insertQuery, [Regno, Fee_type, Fee, Ayear]);

        // Update paid_amount in students table
        const updateQuery = `UPDATE students 
                             SET paid_amount = paid_amount + ? 
                             WHERE Regno = ? AND Academic_year = ?`;
        const [updateResult] = await connection.query(updateQuery, [Fee, Regno, Ayear]);

        if (updateResult.affectedRows === 0) {
            throw new Error(`No matching student record found for Regno: ${Regno} and Academic Year: ${Ayear}`);
        }

        await connection.commit();
        res.status(200).json({ success: true, message: "Payment processed and dues updated successfully!" });
    } catch (error) {
        if (connection) await connection.rollback();

        if (error.message.includes('A payment record already exists')) {
            res.status(409).json({ success: false, message: error.message });
        } else if (error.message.includes('No matching student record found')) {
            res.status(404).json({ success: false, message: error.message });
        } else {
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    } finally {
        if (connection) connection.release();
    }
});


router.get('/feetypes/', async (req, res) => {
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

    const { Regno } = decoded;
    let connection;

    try {
        connection = await pool.getConnection();

        // Fetch fee types for the authenticated user
        const query = "SELECT fee_type FROM yearly_fees WHERE regno = ?";
        const [result] = await connection.query(query, [Regno]);

        res.status(200).json(result);
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
        if (connection) connection.release(); // Ensure the connection is always released
    }
});


  


module.exports = router;