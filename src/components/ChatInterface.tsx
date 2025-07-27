import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatService, type ChatMessage } from '@/services/chatService';
import { toast } from 'sonner';

interface ChatInterfaceProps {
  disabled?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ disabled = false }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Focus input when not disabled
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading || disabled) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Add user message immediately to the UI
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);

      // Get AI response
      const aiResponse = await chatService.sendMessage(userMessage);
      
      // Update with AI response
      setMessages(prev => [...prev, aiResponse]);
      
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (disabled) {
    return (
      <Card className="p-8 text-center">
        <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Ready to Chat!</h3>
        <p className="text-muted-foreground">
          Upload PDF documents above to start asking questions about their content.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="p-4 border-b bg-gradient-primary rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full glass flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Assistant</h3>
            <p className="text-sm text-white/80">Context-aware PDF chatbot</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Start a conversation! I can answer questions based on your uploaded PDFs.
              </p>
            </div>
          )}
          
          {messages.map((message) => (
            <div key={message.id} className="animate-fade-up">
              <div className={`flex items-start space-x-3 ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-chat-bubble-user' 
                    : 'glass'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-chat-bubble-user-foreground" />
                  ) : (
                    <Bot className="w-4 h-4 text-foreground" />
                  )}
                </div>
                
                <div className={`flex-1 space-y-2 ${
                  message.role === 'user' ? 'items-end' : 'items-start'
                }`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-chat-bubble-user text-chat-bubble-user-foreground ml-auto'
                      : 'bg-chat-bubble-ai text-chat-bubble-ai-foreground glass'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  <div className={`flex items-center space-x-2 text-xs text-muted-foreground ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <span>{formatTime(message.timestamp)}</span>
                    {message.context && message.context.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <FileText className="w-3 h-3 mr-1" />
                        {message.context.length} sources
                      </Badge>
                    )}
                  </div>
                  
                  {message.context && message.context.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-muted-foreground">Sources:</p>
                      {message.context.slice(0, 3).map((ctx, idx) => (
                        <div key={idx} className="text-xs bg-muted/50 p-2 rounded border-l-2 border-primary/50">
                          <span className="font-medium">{ctx.document.metadata.filename}</span>
                          <span className="text-muted-foreground ml-2">
                            (similarity: {(ctx.score * 100).toFixed(0)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start space-x-3 animate-fade-up">
              <div className="w-8 h-8 rounded-full glass flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="glass p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-foreground rounded-full animate-typing"></div>
                  <div className="w-2 h-2 bg-foreground rounded-full animate-typing" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-foreground rounded-full animate-typing" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your PDFs..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="gradient-primary"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </Card>
  );
};