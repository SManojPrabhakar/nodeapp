require('dotenv').config();
const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const app = express();
const port = process.env.PORT || 3000;

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS,
  secretAccessKey: process.env.SECRET_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const bucketName = process.env.S3_BUCKET_NAME;

app.use(express.json());

// Upload file endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.send('No file uploaded');
    }

    const params = {
      Bucket: bucketName,
      Key: req.file.originalname,
      Body: req.file.buffer
    };

    await s3.upload(params).promise();
    res.send('File uploaded successfully');
  } catch (err) {
    console.error(err);
    res.send('Failed to upload file');
  }
});

// Get file endpoint
app.get('/files/:key', async (req, res) => {
  try {
    const params = {
      Bucket: bucketName,
      Key: req.params.key
    };

    const data = await s3.getObject(params).promise();
    res.send(data.Body);
  } catch (err) {
    console.error(err);
    res.send('File not found');
  }
});

// List files endpoint
app.get('/files', async (req, res) => {
  try {
    const data = await s3.listObjectsV2({ Bucket: bucketName }).promise();
    res.send(data.Contents.map(file => file.Key));
  } catch (err) {
    console.error(err);
    res.send('Failed to list files');
  }
});

// Delete file endpoint
app.delete('/files/:key', async (req, res) => {
  try {
    await s3.deleteObject({
      Bucket: bucketName,
      Key: req.params.key
    }).promise();
    res.send('File deleted successfully');
  } catch (err) {
    console.error(err);
    res.send('Failed to delete file');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});