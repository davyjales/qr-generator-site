const express = require('express');
const cors = require('cors');
const path = require('path');
const qrRoutes = require('./routes/qr');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/qr', qrRoutes);
app.use('/upload', uploadRoutes);

// Download endpoint for files
app.get('/download/:id', (req, res) => {
  const fileId = req.params.id;
  const filePath = path.join(__dirname, 'uploads', fileId);
  res.download(filePath, (err) => {
    if (err) {
      res.status(404).send('File not found');
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://10.137.174.164:${PORT}`);
});
