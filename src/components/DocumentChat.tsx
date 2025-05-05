
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader, Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface DocumentChatProps {
  documentId: string | null;
  documentName: string;
}

const DocumentChat: React.FC<DocumentChatProps> = ({ documentId, documentName }) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  if (!documentId) {
    return null; // Don't render if no document ID is available
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !documentId) return;
    
    const userMessage = message;
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axios.post('/api/document/chat', {
        documentId,
        message: userMessage
      });
      
      setChatHistory(prev => [...prev, { role: 'assistant', content: response.data.result }]);
      toast.success('Response received');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mt-6 animate-fade-in">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Chat with "{documentName}"
          </h3>
        </div>

        <div className="bg-gray-50 rounded-md p-4 mb-4 h-64 overflow-y-auto">
          {chatHistory.length === 0 ? (
            <div className="text-gray-500 text-center py-12">
              Ask questions about your document
            </div>
          ) : (
            <div className="space-y-4">
              {chatHistory.map((chat, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${
                    chat.role === 'user' 
                      ? 'bg-indigo-100 ml-8 text-gray-800' 
                      : 'bg-gray-200 mr-8 text-gray-800'
                  }`}
                >
                  {chat.content}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-center py-2">
                  <Loader className="h-5 w-5 text-indigo-600 animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask a question about your document..."
            className="flex-grow"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentChat;
