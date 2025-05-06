import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface DocumentUploaderProps {
  setAnalysisResult: React.Dispatch<React.SetStateAction<string | null>>;
  setIsAnalyzing: React.Dispatch<React.SetStateAction<boolean>>;
  setDocumentName: React.Dispatch<React.SetStateAction<string>>;
  setDocumentId: React.Dispatch<React.SetStateAction<string | null>>;
  onAnalysisComplete?: (documentId: string, documentName: string, result: string) => void;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ 
  setAnalysisResult, 
  setIsAnalyzing,
  setDocumentName,
  setDocumentId,
  onAnalysisComplete
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Enhanced logging for component lifecycle
  React.useEffect(() => {
    console.log("%c[DOCUMENT UPLOADER MOUNTED]", "background: #4CAF50; color: white; padding: 2px 5px; border-radius: 2px;");
    
    return () => {
      console.log("%c[DOCUMENT UPLOADER UNMOUNTED]", "background: #F44336; color: white; padding: 2px 5px; border-radius: 2px;");
    };
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    setUploadError(null);
    
    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      setUploadError('File size exceeds 10MB limit');
      return;
    }
    
    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setDocumentId(null); // Reset document ID before new upload
    
    console.log("%c[STARTING DOCUMENT ANALYSIS]", "background: #FF9800; color: white; padding: 2px 5px; border-radius: 2px;");
    console.log("File:", selectedFile.name, "Size:", selectedFile.size, "bytes");
    
    try {
      console.log("Sending API request to /api/document/analyze...");
      const response = await axios.post('/api/document/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log("%c[DOCUMENT ANALYSIS COMPLETE]", "background: #4CAF50; color: white; padding: 2px 5px; border-radius: 2px;");
      console.log("Full response:", response.data);
      
      // Extract necessary data from response
      const result = response.data.result || "No analysis result provided";
      const fileName = selectedFile.name;
      
      // Always ensure we have a document ID (use response or generate temporary one)
      const documentId = response.data.documentId || `temp-${Date.now()}`;
      console.log("%c[SETTING DOCUMENT ID]", "background: #9C27B0; color: white; padding: 2px 5px; border-radius: 2px;", documentId);
      
      // Set state in correct sequence to ensure rendering
      setAnalysisResult(result);
      setDocumentName(fileName);
      
      // Critical: Use setTimeout to ensure state updates properly
      setTimeout(() => {
        console.log("%c[SETTING DOCUMENT ID AFTER DELAY]", "background: #9C27B0; color: white; padding: 2px 5px; border-radius: 2px;", documentId);
        setDocumentId(documentId);
        
        // Call the completion handler if provided
        if (onAnalysisComplete) {
          console.log("%c[CALLING ANALYSIS COMPLETE HANDLER]", "background: #9C27B0; color: white; padding: 2px 5px; border-radius: 2px;");
          onAnalysisComplete(documentId, fileName, result);
        }
      }, 100);
      
      toast.success('Document analyzed successfully!');
      setSelectedFile(null);
      
    } catch (error) {
      console.error('Error uploading document:', error);
      setUploadError('Failed to upload and analyze document');
      toast.error('Error analyzing document');
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging 
              ? 'border-indigo-500 bg-indigo-50' 
              : uploadError 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 hover:border-indigo-400'
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            {uploadError ? (
              <AlertCircle className="h-10 w-10 text-red-500" />
            ) : selectedFile ? (
              <FileText className="h-10 w-10 text-indigo-600" />
            ) : (
              <Upload className="h-10 w-10 text-gray-400" />
            )}
            
            {selectedFile ? (
              <div className="text-center">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="font-medium text-gray-600">
                  Drag and drop your PDF document
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or click to browse (max 10MB)
                </p>
              </div>
            )}
            
            {uploadError && (
              <p className="text-sm text-red-600">{uploadError}</p>
            )}
            
            <div className="flex justify-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                Browse Files
              </Button>
              
              {selectedFile && (
                <Button onClick={handleUpload} data-testid="analyze-button">
                  Analyze Document
                </Button>
              )}
              
              <input
                id="fileInput"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUploader;
