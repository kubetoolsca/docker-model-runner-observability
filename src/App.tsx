
import React, { useState } from 'react';
import DocumentUploader from './components/DocumentUploader';
import DocumentAnalysisResult from './components/DocumentAnalysisResult';
import './App.css';

function App() {
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [documentName, setDocumentName] = useState('');

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Document Analysis</h1>
        <p className="text-gray-600">
          Upload a PDF document to extract insights using OCR and LLM analysis
        </p>
      </header>

      <main>
        <DocumentUploader 
          setAnalysisResult={setAnalysisResult}
          setIsAnalyzing={setIsAnalyzing}
          setDocumentName={setDocumentName}
        />
        
        <DocumentAnalysisResult 
          result={analysisResult}
          isLoading={isAnalyzing}
          documentName={documentName}
        />
      </main>

      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>Powered by Docker Model Runner and LLMs</p>
      </footer>
    </div>
  );
}

export default App;
