
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'Gmail', // Use your email service provider
    auth: {
      user: 'manojprabhakar3792@gmail.com', // Replace with your email
      pass: 'sogf bnmv nijm jhjz' // Replace with your email password
    }
  });
const generateRandomOTP = () => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < 5; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
};
let otp;


router.post('/send-otp', async (req, res) => {
  const userEmail = req.body.Email;
   otp = generateRandomOTP();

  const token = jwt.sign({ otp }, 'madman@', { expiresIn: '1h' });

  try {
    const mailOptions = {
        from: 'manojprabhakar3792@gmail.com', // Replace with your email
        to: userEmail,
        subject: `Your OTP - ${otp}`,
        text: `Your code is:${otp} `,
       
      };

    const result = await transporter.sendMail(mailOptions);

    res.status(200).json({success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});


router.post('/verify-otp', (req, res) => {
    const  enteredOTP  = req.body.otp;
    
      if (enteredOTP === otp) {
        res.status(200).json({success:true, message: 'OTP verification successful' });
      } else {
        res.status(400).json({ error: 'Invalid OTP' });
      }
    })

module.exports = router;
