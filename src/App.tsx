
import React, { useState, useEffect, useRef } from 'react';
import DocumentUploader from './components/DocumentUploader';
import DocumentAnalysisResult from './components/DocumentAnalysisResult';
import DocumentChat from './components/DocumentChat';
import { Toaster } from 'sonner';
import './App.css';

function App() {
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [documentId, setDocumentId] = useState<string | null>(null);
  
  // Add reference to track mount state
  const isMounted = useRef(true);
  
  // Flag to force chat component render after analysis
  const [shouldShowChat, setShouldShowChat] = useState(false);

  // Enhanced debugging for document ID changes and component lifecycle
  useEffect(() => {
    // Component mount
    console.log("%c[APP COMPONENT MOUNTED]", "background: #4CAF50; color: white; padding: 2px 5px; border-radius: 2px;");
    
    return () => {
      isMounted.current = false;
      console.log("%c[APP COMPONENT UNMOUNTED]", "background: #F44336; color: white; padding: 2px 5px; border-radius: 2px;");
    };
  }, []);
  
  useEffect(() => {
    console.log("%c[APP STATE CHANGED]", "background: #2196F3; color: white; padding: 2px 5px; border-radius: 2px;");
    console.log("- documentId:", documentId);
    console.log("- documentName:", documentName);
    console.log("- analysisResult present:", !!analysisResult);
    console.log("- shouldShowChat:", shouldShowChat);
    
    // If we have a document ID, always ensure chat is shown
    if (documentId) {
      console.log("%c[DOCUMENT ID EXISTS] Chat component should render", "background: #FF9800; color: white; padding: 2px 5px; border-radius: 2px;");
      setShouldShowChat(true);
      
      // Verify DOM element for chat exists
      setTimeout(() => {
        const chatElement = document.getElementById('document-chat-container');
        console.log("Chat container in DOM:", !!chatElement);
      }, 100);
    }
  }, [documentId, documentName, analysisResult, shouldShowChat]);

  // Handler for when document analysis is complete
  const handleAnalysisComplete = (id: string, name: string, result: string) => {
    console.log("%c[ANALYSIS COMPLETE HANDLER CALLED]", "background: #9C27B0; color: white; padding: 2px 5px; border-radius: 2px;");
    console.log("- Received ID:", id);
    console.log("- Received name:", name);
    
    if (isMounted.current) {
      setDocumentId(id);
      setDocumentName(name);
      setAnalysisResult(result);
      setShouldShowChat(true);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Document Analysis & Chat</h1>
        <p className="text-gray-600">
          Upload a PDF document to extract insights and chat with your document
        </p>
      </header>

      <main className="space-y-6">
        <DocumentUploader 
          setAnalysisResult={setAnalysisResult}
          setIsAnalyzing={setIsAnalyzing}
          setDocumentName={setDocumentName}
          setDocumentId={setDocumentId}
          onAnalysisComplete={handleAnalysisComplete}
        />
        
        <DocumentAnalysisResult 
          result={analysisResult}
          isLoading={isAnalyzing}
          documentName={documentName}
        />

        {/* Always render the chat container div to ensure it exists */}
        <div 
          id="document-chat-container" 
          data-testid="chat-component-container"
          className={`mt-6 ${(documentId && shouldShowChat) ? '' : 'hidden'}`}
        >
          {(documentId && shouldShowChat) && (
            <DocumentChat 
              documentId={documentId} 
              documentName={documentName || "Untitled Document"}
              key={`chat-${documentId}`}
            />
          )}
        </div>
      </main>

      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>Powered by Docker Model Runner and LLMs</p>
      </footer>
      
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
