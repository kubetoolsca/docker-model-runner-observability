
import React, { useState, useEffect, useRef } from 'react';
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
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const componentMountedRef = useRef<boolean>(true);
  
  // Enhanced debugging for component rendering and lifecycle
  useEffect(() => {
    console.log("%c[DOCUMENT CHAT MOUNTED]", "background: #4CAF50; color: white; padding: 2px 5px; border-radius: 2px;");
    console.log("- documentId:", documentId);
    console.log("- documentName:", documentName);
    
    // Scroll to bottom when chat history changes
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    
    return () => {
      componentMountedRef.current = false;
      console.log("%c[DOCUMENT CHAT UNMOUNTED]", "background: #F44336; color: white; padding: 2px 5px; border-radius: 2px;");
    };
  }, [documentId, documentName, chatHistory]);

  // Check DOM presence when component mounts
  useEffect(() => {
    // After render, verify presence in DOM
    setTimeout(() => {
      const parentElement = document.getElementById('document-chat-container');
      const chatComponent = document.querySelector('[data-testid="chat-container"]');
      
      console.log("%c[DOM CHECK]", "background: #2196F3; color: white; padding: 2px 5px; border-radius: 2px;");
      console.log("- Parent element exists:", !!parentElement);
      console.log("- Chat component exists:", !!chatComponent);
      console.log("- Document ID:", documentId);
    }, 100);
  }, [documentId]);

  const handleSendMessage = async () => {
    if (!message.trim() || !documentId) return;
    
    const userMessage = message;
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      console.log("%c[SENDING CHAT REQUEST]", "background: #FF9800; color: white; padding: 2px 5px; border-radius: 2px;");
      console.log("- For document:", documentId);
      console.log("- Message:", userMessage.substring(0, 50) + (userMessage.length > 50 ? "..." : ""));
      
      const response = await axios.post('/api/document/chat', {
        documentId,
        message: userMessage
      });
      
      console.log("%c[RECEIVED CHAT RESPONSE]", "background: #4CAF50; color: white; padding: 2px 5px; border-radius: 2px;");
      console.log(response.data);
      
      if (componentMountedRef.current) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: response.data.result }]);
        toast.success('Response received');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      if (componentMountedRef.current) {
        toast.error('Failed to send message. Please try again.');
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error processing your request.' 
        }]);
      }
    } finally {
      if (componentMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Check if document ID exists, if not, render empty
  if (!documentId) {
    console.log("%c[DOCUMENT CHAT NOT RENDERING] - No document ID", "background: #F44336; color: white; padding: 2px 5px; border-radius: 2px;");
    return null;
  }

  console.log("%c[DOCUMENT CHAT RENDERING] with ID:", "background: #4CAF50; color: white; padding: 2px 5px; border-radius: 2px;", documentId);
  
  return (
    <Card className="animate-fade-in" id="chat-card">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            Chat with "{documentName || 'Document'}"
          </h3>
          <span className="text-xs text-gray-500 ml-2">ID: {documentId.substring(0, 8)}</span>
        </div>

        <div 
          ref={chatContainerRef}
          className="bg-gray-50 rounded-md p-4 mb-4 h-64 overflow-y-auto"
          data-testid="chat-container"
        >
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
            data-testid="send-message-button"
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
