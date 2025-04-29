
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

interface DocumentUploaderProps {
  setAnalysisResult: React.Dispatch<React.SetStateAction<string | null>>;
  setIsAnalyzing: React.Dispatch<React.SetStateAction<boolean>>;
  setDocumentName: React.Dispatch<React.SetStateAction<string>>;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ 
  setAnalysisResult, 
  setIsAnalyzing, 
  setDocumentName 
}) => {
  const [dragActive, setDragActive] = useState(false);
  
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Only accept PDFs
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF document",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      setDocumentName(file.name);
      setAnalysisResult(null);
      
      const formData = new FormData();
      formData.append("file", file);
      
      // Make API call to our backend
      const response = await fetch("/api/document/analyze", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      setAnalysisResult(data.result);
      
      toast({
        title: "Analysis complete",
        description: `"${file.name}" has been successfully analyzed`,
      });
    } catch (error) {
      console.error("Error analyzing document:", error);
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing your document",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-6 mb-6 text-center transition-colors ${
        dragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        id="document-upload" 
        className="hidden" 
        accept=".pdf" 
        onChange={handleFileChange}
      />
      
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      
      <p className="mt-2 text-sm text-gray-600">
        Drag and drop your PDF document here, or
      </p>
      
      <Button 
        variant="outline" 
        className="mt-2" 
        onClick={() => document.getElementById("document-upload")?.click()}
      >
        Browse Files
      </Button>
      
      <p className="mt-1 text-xs text-gray-500">
        Only PDF files are supported (max 10MB)
      </p>
    </div>
  );
};

export default DocumentUploader;
