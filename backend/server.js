
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

// Setup OpenTelemetry
const { setupObservability } = require('./observability');
setupObservability('mcp-server');

const app = express();
const PORT = process.env.PORT || 8001;

// Docker Model Runner endpoint (accessible via Docker's special DNS name)
const DMR_API_ENDPOINT = process.env.DMR_API_ENDPOINT || "http://model-runner.docker.internal:12434/v1";
const TARGET_MODEL = process.env.TARGET_MODEL || "ai/llama3:latest";

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(morgan('dev'));

// Upload directory
const upload = multer({ dest: 'uploads/' });

// Extract text from PDF buffer
async function extractTextFromPdf(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

// Query Docker Model Runner
async function queryDMR(prompt) {
  try {
    const payload = {
      model: TARGET_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant that analyzes documents. Extract key information, summarize content, and identify action items."
        },
        {
          role: "user",
          content: `Please analyze the following document text and provide a summary, key points, and any action items you can identify:\n\n${prompt}`
        }
      ],
      stream: false,
      max_tokens: 1000
    };

    const response = await axios.post(`${DMR_API_ENDPOINT}/chat/completions`, payload);
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling Docker Model Runner:", error);
    throw new Error("Failed to analyze document with AI model");
  }
}

// Analyze document endpoint
app.post('/analyze', async (req, res) => {
  try {
    const { document_data, document_name, document_type } = req.body;
    
    if (!document_data) {
      return res.status(400).json({ error: "No document data provided" });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(document_data, 'base64');
    
    // Extract text from PDF
    const extractedText = await extractTextFromPdf(buffer);
    
    // Limit text length for the model
    const truncatedText = extractedText.substring(0, 5000);
    
    // Call Docker Model Runner for analysis
    const analysisResult = await queryDMR(truncatedText);
    
    // Return the analysis result
    return res.json({ result: analysisResult });
  } catch (error) {
    console.error("Error during document analysis:", error);
    return res.status(500).json({ error: error.message || "Error processing document" });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});
