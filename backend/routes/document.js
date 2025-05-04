
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
    
    let result = '';

    try {
      // Only attempt to call Docker Model Runner if the endpoint is configured
      if (process.env.DMR_API_ENDPOINT) {
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

        // Try multiple endpoint variations if the default one fails
        let response;
        let errorMessages = [];
        
        try {
          // First try the configured endpoint
          console.log("Attempting to call configured endpoint:", dmrEndpoint);
          response = await callDockerModelRunner(dmrEndpoint, targetModel, prompt);
        } catch (error1) {
          errorMessages.push(`Primary endpoint error: ${error1.message}`);
          
          // If host.docker.internal fails, try localhost
          try {
            const localhostEndpoint = dmrEndpoint.replace('host.docker.internal', 'localhost');
            console.log("Attempting to call localhost endpoint:", localhostEndpoint);
            response = await callDockerModelRunner(localhostEndpoint, targetModel, prompt);
          } catch (error2) {
            errorMessages.push(`Localhost endpoint error: ${error2.message}`);
            
            // If that fails too, try with IP 172.17.0.1 (common Docker host IP)
            try {
              const ipEndpoint = dmrEndpoint.replace('host.docker.internal', '172.17.0.1');
              console.log("Attempting to call IP endpoint:", ipEndpoint);
              response = await callDockerModelRunner(ipEndpoint, targetModel, prompt);
            } catch (error3) {
              errorMessages.push(`IP endpoint error: ${error3.message}`);
              throw new Error(`All endpoints failed. ${errorMessages.join('; ')}`);
            }
          }
        }

        // Extract the result from the response
        if (response.data && response.data.response) {
          result = response.data.response;
        } else if (response.data && response.data.result) {
          result = response.data.result;
        } else {
          result = JSON.stringify(response.data);
        }
      } else {
        // Fallback when DMR_API_ENDPOINT is not set
        result = `Analysis for "${req.file.originalname}" (${extractedText.length} characters extracted):\n\n` +
                `This is a basic analysis response since Docker Model Runner is not configured.\n\n` +
                `Extracted text sample: "${extractedText.substring(0, 500)}..."`;
      }

      // Return the analysis result
      res.json({ result });
      
    } catch (error) {
      console.error('General error during document analysis:', error);
      
      // Return a fallback result with the extracted text
      const fallbackResult = `Analysis for "${req.file.originalname}" (extracted text only):\n\n` +
                            `The document contains ${extractedText.length} characters.\n\n` +
                            `Text Sample:\n${extractedText.substring(0, 500)}...\n\n` +
                            `Note: Full analysis is unavailable due to a system error: ${error.message}`;
      
      res.json({ result: fallbackResult });
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

// Helper function to call the Docker Model Runner API
async function callDockerModelRunner(endpoint, model, prompt) {
  return await axios.post(endpoint, {
    model: model,
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
}

module.exports = router;
