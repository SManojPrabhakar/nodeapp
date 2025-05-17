// routes.js
const express = require('express');
const path = require('path');
const router = express.Router();

// Serve HTML pages
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'mad.html'));
});

router.get('/registration', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'index.html'));
});

router.get('/aboutus', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'about.html'));
});

router.get('/report', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'report.html'));
});

router.get('/contactus', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'contact.html'));
});

router.get('/help', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'help.html'));
});

/*router.get('/userui', (req, res) => {
  res.sendFile(path.join(__dirname, 'htmlpages', 'Profile.html'));
});*/
module.exports = router;
