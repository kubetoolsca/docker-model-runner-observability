
import React, { useState, useEffect } from 'react';
import { TaskProvider } from '@/contexts/TaskContext';
import TaskForm from '@/components/TaskForm';
import TaskFilters from '@/components/TaskFilters';
import TaskList from '@/components/TaskList';
import DocumentUploader from '@/components/DocumentUploader';
import DocumentAnalysisResult from '@/components/DocumentAnalysisResult';
import DocumentChat from '@/components/DocumentChat';
import { Toaster } from 'sonner';

const Index: React.FC = () => {
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [documentName, setDocumentName] = useState<string>("");
  const [documentId, setDocumentId] = useState<string | null>(null);

  // Debug logging to track document ID changes
  useEffect(() => {
    console.log("Document ID updated in Index:", documentId);
  }, [documentId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <TaskProvider>
        <div className="container mx-auto py-8 px-4 max-w-3xl">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-600 mb-2">Document Analysis App</h1>
            <p className="text-gray-600">Upload documents, extract insights, and chat with your documents</p>
          </header>
          
          <div className="mb-8 bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Document Analysis & Chat</h2>
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
            {documentId && (
              <div className="mt-6">
                <DocumentChat 
                  documentId={documentId} 
                  documentName={documentName}
                />
              </div>
            )}
          </div>
          
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Task Management</h2>
          <TaskForm />
          <TaskFilters />
          <TaskList />
        </div>
        
        <Toaster />
      </TaskProvider>
    </div>
  );
};

export default Index;
