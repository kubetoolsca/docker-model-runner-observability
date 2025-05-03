
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pdfParse = require('pdf-parse');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function(req, file, cb) {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

// POST /api/document/analyze
router.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    
    // Extract text from the PDF
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const extractedText = pdfData.text;
    
    // For development without docker model runner, return mock data
    if (!process.env.DMR_API_ENDPOINT) {
      console.log('DMR_API_ENDPOINT not set. Using mock analysis.');
      
      // Clean up the uploaded file
      fs.unlinkSync(filePath);
      
      return res.json({ 
        result: `Analysis for "${req.file.originalname}" (${extractedText.length} characters extracted):\n\n` +
                `This is a mock analysis response. To enable real analysis, set the DMR_API_ENDPOINT environment variable.\n\n` +
                `Extracted text sample: "${extractedText.substring(0, 200)}..."`
      });
    }
    
    try {
      const modelRunnerEndpoint = process.env.DMR_API_ENDPOINT || 'http://localhost:8001/analyze';
      
      // Call the Docker Model Runner for analysis
      console.log(`Calling model runner at: ${modelRunnerEndpoint}`);
      const response = await axios.post(modelRunnerEndpoint, {
        document_text: extractedText,
        document_name: req.file.originalname,
        document_type: 'application/pdf'
      }, {
        timeout: 30000 // 30 second timeout
      });

      // Return the analysis result
      res.json({ result: response.data.result });
    } catch (error) {
      console.error('Error calling Docker Model Runner:', error.message);
      
      // Return a more user-friendly error
      res.status(500).json({ 
        error: 'Error analyzing document with LLM',
        details: error.message,
        message: 'The model runner service is not available. Please check your Docker setup.'
      });
    }

    // Clean up the uploaded file
    fs.unlinkSync(filePath);
    
  } catch (error) {
    console.error('Error during document analysis:', error);
    res.status(500).json({ 
      error: 'Error analyzing document',
      details: error.message 
    });
  }
});

module.exports = router;
