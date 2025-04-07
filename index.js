const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = 8500;

// Ensure directories exist
const DIRECTORIES = {
  '.mp4': path.join(__dirname, 'mp4'),
  '.jpg': path.join(__dirname, 'jpg'),
  '.pdf': path.join(__dirname, 'pdf'),
  '.png': path.join(__dirname, 'png'),
  '.gif': path.join(__dirname, 'gif')
};

Object.values(DIRECTORIES).forEach(dir => fs.ensureDirSync(dir));

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const dir = DIRECTORIES[ext];
      if (dir) {
        cb(null, dir);
      } else {
        cb(new Error('Unsupported file type'), false);
      }
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    }
  }),
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB limit
});

// Endpoint to upload files
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded or unsupported file type.');
  }
  res.send(`File ${req.file.originalname} uploaded successfully.`);
});

// Endpoint to get files
app.get('/files/:type', (req, res) => {
  const type = req.params.type.toLowerCase();
  const dir = DIRECTORIES[`.${type}`];
  if (!dir) {
    return res.status(400).send('Unsupported file type.');
  }
  fs.readdir(dir, (err, files) => {
    if (err) {
      return res.status(500).send('Error reading directory.');
    }
    res.json(files);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});