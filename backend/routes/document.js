
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
      const dmrEndpoint = process.env.DMR_API_ENDPOINT;
      const targetModel = process.env.TARGET_MODEL || 'ai/llama3.2:1B-Q8_0';
      
      console.log(`Calling Docker Model Runner at: ${dmrEndpoint}`);
      console.log(`Using model: ${targetModel}`);
      
      // Prepare the prompt for the LLM
      const prompt = `Analyze the following document and provide a concise summary:
      
Document Name: ${req.file.originalname}
Document Type: PDF
Document Content:

${extractedText.substring(0, 3000)}... (truncated)

Please provide:
1. A brief summary of the document (3-5 sentences)
2. Main topics or key points
3. Any action items or recommendations`;

      // Call the Docker Model Runner API
      const response = await axios.post(dmrEndpoint, {
        model: targetModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 1024
        }
      }, {
        timeout: 60000, // 60 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Extract the result from the response
      let result;
      if (response.data && response.data.response) {
        result = response.data.response;
      } else if (response.data && response.data.result) {
        result = response.data.result;
      } else {
        result = JSON.stringify(response.data);
      }

      // Return the analysis result
      res.json({ result });
    } catch (error) {
      console.error('Error calling Docker Model Runner:', error.message);
      console.error('Error details:', error.response?.data || 'No additional error details');
      
      // Return a more user-friendly error
      res.status(500).json({ 
        error: 'Error analyzing document with LLM',
        details: error.message,
        message: 'There was an issue communicating with the Docker Model Runner. Please ensure it is running and accessible.'
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
