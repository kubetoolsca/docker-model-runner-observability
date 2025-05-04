
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

// Store extracted document content for later chat functionality
const documentCache = new Map();

// POST /api/document/analyze
router.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const documentId = path.basename(filePath, path.extname(filePath));
    
    // Extract text from the PDF
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const extractedText = pdfData.text;
    
    // Store the extracted text for future chat interactions
    documentCache.set(documentId, {
      filename: req.file.originalname,
      text: extractedText,
      uploadTime: new Date().toISOString()
    });
    
    let result = '';

    try {
      // Only attempt to call Docker Model Runner if the endpoint is configured
      if (process.env.DMR_API_ENDPOINT) {
        // Construct proper Docker Model Runner endpoint URLs
        const baseEndpoint = process.env.DMR_API_ENDPOINT;
        const targetModel = process.env.TARGET_MODEL || 'ai/llama3.2:1B-Q8_0';
        
        // Multiple potential endpoints to try
        const endpoints = [
          // Primary standard endpoint
          `${baseEndpoint}/chat/completions`,
          // Try model runner specific format
          `http://model-runner.docker.internal/engines/v1/chat/completions`,
          // Try without the specific path
          `${baseEndpoint}`,
          // Try with /v1/chat/completions (OpenAI standard)
          `${baseEndpoint.replace('/v1', '')}/v1/chat/completions`
        ];

        console.log(`Will attempt to call Docker Model Runner using multiple possible endpoints`);
        console.log(`Using model: ${targetModel}`);
        
        // Prepare the messages in OpenAI compatible format
        const messages = [
          {
            role: "system",
            content: "You are a helpful document analysis assistant. Analyze the provided document and provide insights."
          },
          {
            role: "user",
            content: `Analyze the following document and provide a concise summary:
            
Document Name: ${req.file.originalname}
Document Type: PDF
Document Content:

${extractedText.substring(0, 3000)}... (truncated)

Please provide:
1. A brief summary of the document (3-5 sentences)
2. Main topics or key points
3. Any action items or recommendations`
          }
        ];

        // Try endpoints one by one
        let response = null;
        let errorMessages = [];
        let successfulEndpoint = null;

        for (const endpoint of endpoints) {
          try {
            console.log(`Attempting API call to: ${endpoint}`);
            
            response = await axios.post(endpoint, {
              model: targetModel,
              messages: messages,
              temperature: 0.7,
              max_tokens: 1024,
              stream: false
            }, {
              timeout: 60000,
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            // If we get here, the call was successful
            successfulEndpoint = endpoint;
            console.log(`Successful API call to: ${endpoint}`);
            break;
          } catch (endpointError) {
            const errorMsg = `Failed with endpoint ${endpoint}: ${endpointError.message}`;
            console.error(errorMsg);
            errorMessages.push(errorMsg);
            
            // Continue to the next endpoint
          }
        }

        if (!response) {
          throw new Error(`All Docker Model Runner endpoints failed. Errors: ${errorMessages.join('; ')}`);
        }

        // Extract the result based on OpenAI API response format
        if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
          result = response.data.choices[0].message.content;
        } else if (response.data && response.data.response) {
          // Fallback to DMR specific format
          result = response.data.response;
        } else if (response.data && response.data.result) {
          result = response.data.result;
        } else {
          console.warn("Unexpected response format:", JSON.stringify(response.data));
          result = `Analysis generated via: ${successfulEndpoint}\n\n` + JSON.stringify(response.data);
        }
      } else {
        // Fallback when DMR_API_ENDPOINT is not set
        result = `Analysis for "${req.file.originalname}" (${extractedText.length} characters extracted):\n\n` +
                `This is a basic analysis response since Docker Model Runner is not configured.\n\n` +
                `Extracted text sample: "${extractedText.substring(0, 500)}..."`;
      }

      // Return the analysis result along with document ID for future chat reference
      res.json({ 
        result,
        documentId,
        documentName: req.file.originalname 
      });
      
    } catch (error) {
      console.error('General error during document analysis:', error);
      
      // Return a fallback result with the extracted text
      const fallbackResult = `Analysis for "${req.file.originalname}" (extracted text only):\n\n` +
                            `The document contains ${extractedText.length} characters.\n\n` +
                            `Text Sample:\n${extractedText.substring(0, 500)}...\n\n` +
                            `Note: Full analysis is unavailable due to a system error: ${error.message}`;
      
      res.json({ 
        result: fallbackResult,
        documentId,
        documentName: req.file.originalname,
        error: error.message
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

// POST /api/document/chat - Endpoint for chatting with a previously analyzed document
router.post('/chat', express.json(), async (req, res) => {
  try {
    const { documentId, message } = req.body;
    
    if (!documentId || !message) {
      return res.status(400).json({ error: 'Document ID and message are required' });
    }
    
    // Check if document exists in cache
    if (!documentCache.has(documentId)) {
      return res.status(404).json({ error: 'Document not found. Please analyze a document first.' });
    }
    
    const document = documentCache.get(documentId);
    
    // Only attempt to call Docker Model Runner if the endpoint is configured
    if (process.env.DMR_API_ENDPOINT) {
      // Construct proper Docker Model Runner endpoint URLs
      const baseEndpoint = process.env.DMR_API_ENDPOINT;
      const targetModel = process.env.TARGET_MODEL || 'ai/llama3.2:1B-Q8_0';
      
      // Multiple potential endpoints to try
      const endpoints = [
        // Primary standard endpoint
        `${baseEndpoint}/chat/completions`,
        // Try model runner specific format
        `http://model-runner.docker.internal/engines/v1/chat/completions`,
        // Try without the specific path
        `${baseEndpoint}`,
        // Try with /v1/chat/completions (OpenAI standard)
        `${baseEndpoint.replace('/v1', '')}/v1/chat/completions`
      ];

      console.log(`Will attempt chat with Docker Model Runner using multiple possible endpoints`);
      
      // Prepare the messages in OpenAI compatible format
      const messages = [
        {
          role: "system",
          content: `You are a helpful document assistant. You're answering questions about a document named "${document.filename}". Use only the information in the document to answer questions.`
        },
        {
          role: "user",
          content: `Here's the document content:\n\n${document.text.substring(0, 3000)}... (truncated)`
        },
        {
          role: "user",
          content: message
        }
      ];

      // Try endpoints one by one
      let response = null;
      let errorMessages = [];
      let successfulEndpoint = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Attempting chat API call to: ${endpoint}`);
          
          response = await axios.post(endpoint, {
            model: targetModel,
            messages: messages,
            temperature: 0.7,
            max_tokens: 1024,
            stream: false
          }, {
            timeout: 60000,
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          // If we get here, the call was successful
          successfulEndpoint = endpoint;
          console.log(`Successful chat API call to: ${endpoint}`);
          break;
        } catch (endpointError) {
          const errorMsg = `Failed with endpoint ${endpoint}: ${endpointError.message}`;
          console.error(errorMsg);
          errorMessages.push(errorMsg);
          
          // Continue to the next endpoint
        }
      }

      if (!response) {
        throw new Error(`All Docker Model Runner endpoints failed. Errors: ${errorMessages.join('; ')}`);
      }

      // Extract the result from the response based on OpenAI API response format
      let result = '';
      if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        result = response.data.choices[0].message.content;
      } else if (response.data && response.data.response) {
        result = response.data.response;
      } else if (response.data && response.data.result) {
        result = response.data.result;
      } else {
        result = JSON.stringify(response.data);
      }
      
      return res.json({ result });
    } else {
      // Fallback when DMR_API_ENDPOINT is not set
      return res.json({
        result: `I can't respond to your question about "${document.filename}" because the AI service is not configured. Please set up Docker Model Runner to enable chat functionality.`
      });
    }
  } catch (error) {
    console.error('Error during document chat:', error);
    res.status(500).json({ 
      error: 'Error chatting with document',
      details: error.message 
    });
  }
});

module.exports = router;
