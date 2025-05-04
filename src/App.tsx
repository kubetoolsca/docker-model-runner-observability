
import React, { useState } from 'react';
import DocumentUploader from './components/DocumentUploader';
import DocumentAnalysisResult from './components/DocumentAnalysisResult';
import DocumentChat from './components/DocumentChat';
import { Toaster } from './components/ui/sonner';
import './App.css';

function App() {
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [documentId, setDocumentId] = useState<string | null>(null);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Document Analysis & Chat</h1>
        <p className="text-gray-600">
          Upload a PDF document to extract insights and chat with your document
        </p>
      </header>

      <main>
        <DocumentUploader 
          setAnalysisResult={setAnalysisResult}
          setIsAnalyzing={setIsAnalyzing}
          setDocumentName={setDocumentName}
          setDocumentId={setDocumentId}
        />
        
        <DocumentAnalysisResult 
          result={analysisResult}
          isLoading={isAnalyzing}
          documentName={documentName}
        />

        <DocumentChat 
          documentId={documentId} 
          documentName={documentName}
        />
      </main>

      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>Powered by Docker Model Runner and LLMs</p>
      </footer>
      
      <Toaster />
    </div>
  );
}

export default App;
