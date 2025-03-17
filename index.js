const express = require('express');
const multer = require('multer');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure Multer storage - keeping original filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Keep the original filename as uploaded by the user
    cb(null, file.originalname);
  }
});

// File filter to accept only video files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

// Configure upload settings
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit (adjust as needed)
  }
});

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Video Upload API is running',
    author: 'ManojGowda89',
    timestamp: '2025-03-17 09:01:22'
  });
});

// VIDEO API ROUTES

// Upload a video
app.post('/api/videos/upload', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded'
      });
    }

    // Create response with file details
    const videoDetails = {
      success: true,
      message: 'Video uploaded successfully',
      video: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: `/uploads/${req.file.filename}` // URL path to access the video
      }
    };
    
    res.status(201).json(videoDetails);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading video',
      error: error.message
    });
  }
});

// Get all videos
app.get('/api/videos', (req, res) => {
  try {
    fs.readdir(uploadsDir, (err, files) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error reading videos directory',
          error: err.message
        });
      }
      
      const videos = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext);
      }).map(file => ({
        filename: file,
        url: `/uploads/${file}`
      }));
      
      res.json({
        success: true,
        count: videos.length,
        videos
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving videos',
      error: error.message
    });
  }
});

// Get a single video by filename
app.get('/api/videos/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    const stats = fs.statSync(filePath);
    
    res.json({
      success: true,
      video: {
        filename,
        url: `/uploads/${filename}`,
        size: stats.size,
        created: stats.birthtime
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving video',
      error: error.message
    });
  }
});

// Delete a video
app.delete('/api/videos/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }
    
    fs.unlink(filePath, err => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error deleting video',
          error: err.message
        });
      }
      
      res.json({
        success: true,
        message: 'Video deleted successfully'
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting video',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the limit (500MB)'
      });
    }
  }
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Video Upload Server running on port ${PORT}`);
  console.log(`Server started at: 2025-03-17 09:01:22`);
  console.log(`Created by: ManojGowda89`);
});