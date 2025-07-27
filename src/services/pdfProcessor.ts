import type { Document } from './embeddings';

export class PDFProcessor {
  static async extractTextFromPDF(file: File): Promise<string> {
    try {
      // For now, we'll use a simpler approach with FileReader
      // In a real implementation, you'd use pdf-parse or similar
      const text = await this.readFileAsText(file);
      return text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  static chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end);
      
      // Clean up the chunk
      const cleanChunk = chunk.trim();
      if (cleanChunk.length > 0) {
        chunks.push(cleanChunk);
      }

      start = end - overlap;
      if (start >= text.length) break;
    }

    return chunks;
  }

  static async processFile(file: File): Promise<Document[]> {
    try {
      const text = await this.extractTextFromPDF(file);
      const chunks = this.chunkText(text);
      
      return chunks.map((chunk, index) => ({
        id: `${file.name}-chunk-${index}`,
        content: chunk,
        metadata: {
          source: file.name,
          filename: file.name,
          page: Math.floor(index / 5) + 1 // Rough page estimation
        }
      }));
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  }
}