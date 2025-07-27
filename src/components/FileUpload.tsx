import React, { useCallback, useState } from 'react';
import { Upload, File, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { PDFProcessor } from '@/services/pdfProcessor';
import { embeddingService } from '@/services/embeddings';

interface FileUploadProps {
  onFilesProcessed: (fileCount: number) => void;
}

interface UploadedFile {
  name: string;
  status: 'processing' | 'complete' | 'error';
  size: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesProcessed }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFiles = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    
    const fileList: UploadedFile[] = files.map(file => ({
      name: file.name,
      status: 'processing',
      size: formatFileSize(file.size)
    }));
    
    setUploadedFiles(fileList);

    try {
      let totalDocuments = 0;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const documents = await PDFProcessor.processFile(file);
          await embeddingService.addDocuments(documents);
          
          setUploadedFiles(prev => prev.map((f, index) => 
            index === i ? { ...f, status: 'complete' } : f
          ));
          
          totalDocuments += documents.length;
          
        } catch (error) {
          setUploadedFiles(prev => prev.map((f, index) => 
            index === i ? { ...f, status: 'error' } : f
          ));
          toast.error(`Failed to process ${file.name}`);
        }
      }
      
      if (totalDocuments > 0) {
        toast.success(`Successfully processed ${files.length} files into ${totalDocuments} chunks`);
        onFilesProcessed(files.length);
      }
      
    } catch (error) {
      toast.error('Failed to process files');
    } finally {
      setIsProcessing(false);
    }
  }, [onFilesProcessed]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf' || file.name.endsWith('.pdf')
    );
    
    if (files.length === 0) {
      toast.error('Please upload PDF files only');
      return;
    }
    
    processFiles(files);
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setUploadedFiles([]);
    embeddingService.clearDocuments();
    onFilesProcessed(0);
    toast.success('All files cleared');
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Upload PDF Documents</h3>
        {uploadedFiles.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAll}>
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">Drop PDF files here</p>
        <p className="text-muted-foreground mb-4">or click to browse</p>
        
        <input
          type="file"
          multiple
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          disabled={isProcessing}
        />
        
        <Button asChild disabled={isProcessing}>
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Choose Files
          </label>
        </Button>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Uploaded Files</h4>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <File className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{file.size}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {file.status === 'processing' && (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
                {file.status === 'complete' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {file.status === 'error' && (
                  <X className="w-4 h-4 text-red-500" />
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};