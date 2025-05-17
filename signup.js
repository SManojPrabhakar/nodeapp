const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const jwt=require("jsonwebtoken")
const pool = require('./config.js');
require('dotenv').config();
const secretKey =process.env.SECRET_KEY
  /*router.put('/student/signup/', async (req, res) => {
    let connection;
    try {
      const { roll, Email, password } = req.body; // Destructure request body for better readability
  
      // Validate input
      if (!roll || !Email || !password) {
        return res.status(400).json({ success: false, message: 'Roll, Email, and password are required.' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Get a database connection
      connection = await pool.getConnection();
  
      // Update the Email and password in the students table
      const [result] = await connection.query(
        'UPDATE students SET Email = ?, password = ? WHERE Id = ?',
        [Email, hashedPassword, roll]
      );
  
      if (result.affectedRows === 0) {
        // If no rows are affected, the roll number does not exist
        return res.status(404).json({ success: false, message: `Student with roll number ${roll} does not registered.` });
      }
  
      // Release the connection
      connection.release();
  
      // Send a success response
      res.status(200).json({ success: true, message: 'Student details updated successfully' });
    } catch (error) {
      if (connection) connection.release(); // Ensure connection is released on error
      console.error('Error updating student details:', error);
  
      // Handle specific error cases
      if (error.code === 'ER_DUP_ENTRY') {
        // Handle duplicate email entry
        res.status(400).json({ success: false, message: 'The provided email is already in use.' });
      } else {
        // Generic error response
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    }
  });*/
  


  router.post('/lecturer/admin/signup/', async (req, res) => {
    let connection;

    try {
        const { Role, College,Fullname,Regno, Email, Code, password } = req.body;
   
        // Hash the password for secure storage
        const hashedPassword = await bcrypt.hash(password, 10);

        // Get a database connection
        connection = await pool.getConnection();

        // Insert data into the lecturer table
        const query = `
            INSERT INTO lecturer (regno, Email, College_name, Fullname, Code, Password, Role) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const values = [Regno, Email, College, Fullname, Code, hashedPassword, Role];
        await connection.query(query, values);

        // Release the connection
        connection.release();

        // Respond with success
        res.status(200).json({ success: true, message: 'Congratulations, user account has been created' });
    } catch (error) {
        if (connection) {
            connection.release();
        }

        console.error('Error handling signup request:', error);

        // Handle duplicate entry errors (specific to MySQL)
        if (error.code === 'ER_DUP_ENTRY') {
            if (error.sqlMessage.includes('Email')) {
                return res.status(400).json({ success: false, message: 'A user with the same Email already exists.' });
            }
            if (error.sqlMessage.includes('regno')) {
                return res.status(400).json({ success: false, message: 'A user with the same registration number already exists.' });
            }
        }

        // Default error response
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
    router.post('/founder/signup/', async (req, res) => {
      let connection;
        try {
          const { Role, Fullname, Email, password } = req.body;
          
          
          
          // Insert the received data into MySQL database
          const hashedPassword = await bcrypt.hash(password, 10);
          connection = await pool.getConnection();
         
      
          // Updating student attendance table
         
          await connection.query('INSERT INTO  fond (Email,Fullname,Password,Role) VALUES (?,?,?,?)',
          [Email,Fullname,hashedPassword,Role] );
         
          connection.release();
      
          // Send a success response to the client
          const serverResponse = 'Congratulations,user account has been created';
          res.status(200).json({ success: true, message: serverResponse });
        } catch (error) {
          console.error('Error handling request:', error);
      
          // Check for duplicate entry error
          if (error.code.includes('ER_DUP_ENTRY')) {
            // Duplicate entry error for the unique constraint (assuming 'Email' here)
            if (error.sqlMessage.includes('Email')) {
              const errorMessage = 'A user with the same Email already exists.';
              res.status(400).json({ success: false, message: errorMessage });
            }  else {
              // Handle other errors if needed
              res.status(500).json({ success: false, message: 'Internal server error' });
            }
          } else {
            // Handle other errors if needed
            res.status(500).json({ success: false, message: 'Internal server error' });
          }
        }
      });
  
      router.get('/college-feelist/receipts/', async (req, res) => {

   
        try {
            const query = `select Feetype,paidFee,PaymentDate from CollegeFee where regno=?`
      
            // Use the connection pool to get a connection
            const connection = await pool.getConnection();
      
            // Execute the query using the connection
            const result= await connection.query(query); // Destructuring the result to access rows directly
      const fees= result[0] 
            // Release the connection back to the pool
            connection.release();
      
            res.status(200).json({ success: true, message:fees}); 
            
          
        } catch (error) {
            console.error('Error executing query:', error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    });
    
    
    router.post('/college-fee/reg/', async (req, res) => {
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
    
      const { Regno, Fullname, joiningdate, Year, Section, Course, Gender, College, Sem, Fee,  Completion,Password ,Role} = req.body;
      const hashedPassword = await bcrypt.hash(Password, 10);
      // Validate missing fields
      if (!Regno || !Fullname || !joiningdate || !Year || !Section || !Course || !Gender || !College || !Sem || !Fee  || !Completion) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }
    
      // Validate Completion value
      if (Completion <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid Completion value (must be greater than zero)' });
      }
    
      const college_fee = Fee / Completion;
      let connection;
    
      try {
        connection = await pool.getConnection();
        await connection.beginTransaction(); // Start a transaction
    
        // Check if Regno already exists
        const checkQuery = `SELECT Regno FROM students WHERE Regno = ?`;
        const [rows] = await connection.query(checkQuery, [Regno]);
    
        if (rows.length > 0) {
          connection.release();
          return res.status(409).json({ success: false, message: "Regno already exists. Please use a different Regno." });
        }
    
        // Insert into the students table
        const insertQuery1 = `
          INSERT INTO students (Regno, Fullname, joining_date, Year, Section, Course, Gender, college_name, course_completion_years,password,Role,Sem) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?)
        `;
        await connection.query(insertQuery1, [Regno, Fullname, joiningdate, Year, Section, Course, Gender, College, Completion,hashedPassword,Role,Sem]);
    
        // Insert into the fee_register table
        const insertQuery2 = `
          INSERT INTO fee_register (Regno, Fee_amount, Due_amount) 
          VALUES (?, ?, ?)
        `;
        await connection.query(insertQuery2, [Regno, Fee, Fee]);
    
        // Insert into Yearly_fee_register
        const currentAcademicYear = `${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`;
        const insertFeeQuery = `
          INSERT INTO Yearly_fees (Regno, Fee_type, Fee_year, Fee_total, Fee_due) 
          VALUES (?, ?, ?, ?, ?)
        `;
        await connection.query(insertFeeQuery, [Regno, "college-fee", currentAcademicYear, 0.00, college_fee]);
    
        await connection.commit(); // Commit the transaction
        connection.release();
    
        res.status(200).json({ success: true, message: "Registered successfully" });
    
      } catch (error) {
        if (connection) {
          await connection.rollback(); // Rollback the transaction in case of error
          connection.release();
        }
    
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ success: false, message: "Regno already exists. Please use a different Regno." });
        }
        
        if (error.code === 'ER_NO_REFERENCED_ROW' || error.code === 'ER_NO_REFERENCED_ROW_2') {
          return res.status(400).json({ success: false, message: "Invalid foreign key reference. Please check if the college exists." });
        }
    
        console.error('Error executing query:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', errorMessage: error.message });
      }
    });
    

  module.exports = router;