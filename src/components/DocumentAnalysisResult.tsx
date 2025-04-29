
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { loader } from 'lucide-react';

interface DocumentAnalysisResultProps {
  result: string | null;
  isLoading: boolean;
  documentName: string;
}

const DocumentAnalysisResult: React.FC<DocumentAnalysisResultProps> = ({ 
  result, 
  isLoading, 
  documentName 
}) => {
  if (!result && !isLoading) {
    return null;
  }

  return (
    <Card className="mt-6 animate-fade-in">
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <loader className="h-8 w-8 text-indigo-600 animate-spin" />
            <p className="mt-4 text-gray-600">
              Analyzing {documentName}...
            </p>
            <p className="mt-1 text-sm text-gray-500">
              This may take a moment depending on the document size
            </p>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Analysis Results for "{documentName}"
            </h3>
            <div className="bg-gray-50 rounded-md p-4 whitespace-pre-wrap text-sm font-mono">
              {result}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentAnalysisResult;
