
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Disable Next.js body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the incoming form data
    const form = formidable({ keepExtensions: true });
    
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const file = files.file;
    
    if (!file || Array.isArray(file)) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read the file and convert to base64
    const filePath = file.filepath;
    const fileData = fs.readFileSync(filePath);
    const base64Data = fileData.toString('base64');

    // Call the MCP server for analysis (using Docker's host.docker.internal)
    const response = await axios.post('http://localhost:8001/analyze', {
      document_data: base64Data,
      document_name: file.originalFilename || 'document.pdf',
      document_type: file.mimetype || 'application/pdf'
    });

    // Return the analysis result
    return res.status(200).json({ result: response.data.result });
    
  } catch (error) {
    console.error('Error during document analysis:', error);
    return res.status(500).json({ error: 'Error analyzing document' });
  }
};

export default handler;
