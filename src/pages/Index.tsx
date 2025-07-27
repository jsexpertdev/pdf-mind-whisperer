import React, { useState, useEffect } from 'react';
import { Brain, FileText, MessageCircle, Sparkles } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { ChatInterface } from '@/components/ChatInterface';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { embeddingService } from '@/services/embeddings';

const Index = () => {
  const [uploadedFileCount, setUploadedFileCount] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize embedding service
    const initializeServices = async () => {
      try {
        await embeddingService.initialize();
        console.log('Services initialized successfully');
      } catch (error) {
        console.error('Failed to initialize services:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeServices();
  }, []);

  const features = [
    {
      icon: FileText,
      title: "PDF Processing",
      description: "Upload and process PDF documents with intelligent text chunking"
    },
    {
      icon: Brain,
      title: "Vector Embeddings", 
      description: "Create semantic embeddings using advanced transformer models"
    },
    {
      icon: MessageCircle,
      title: "Context-Aware Chat",
      description: "Maintain conversation history for natural, contextual responses"
    },
    {
      icon: Sparkles,
      title: "Smart Search",
      description: "Find relevant information using semantic similarity search"
    }
  ];

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-secondary">
        <Card className="p-8 text-center glass">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Initializing AI Models</h2>
          <p className="text-muted-foreground">Please wait while we load the embedding models...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <div className="border-b border-border/10 bg-background/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">PDF Chatbot</h1>
                <p className="text-muted-foreground">Context-aware AI assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="hidden sm:flex">
                <FileText className="w-3 h-3 mr-1" />
                {uploadedFileCount} PDFs loaded
              </Badge>
              <Badge variant={embeddingService.getDocuments().length > 0 ? "default" : "secondary"}>
                <Brain className="w-3 h-3 mr-1" />
                {embeddingService.getDocuments().length} chunks ready
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - File Upload & Features */}
          <div className="lg:col-span-5 space-y-6">
            <FileUpload onFilesProcessed={setUploadedFileCount} />
            
            {/* Features */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Instructions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">How to Use</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">1</div>
                  <p>Upload 2 PDF documents (your favorite topics)</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">2</div>
                  <p>Wait for the documents to be processed and embedded</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">3</div>
                  <p>Start asking questions about your documents</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">4</div>
                  <p>Test memory with: "What was the last question?" or "Tell me more about it."</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Chat Interface */}
          <div className="lg:col-span-7">
            <ChatInterface disabled={uploadedFileCount === 0} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;