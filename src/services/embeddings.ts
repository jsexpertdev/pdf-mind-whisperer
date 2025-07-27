import { pipeline, env } from '@xenova/transformers';

// Configure transformers to use local models
env.allowRemoteModels = false;
env.allowLocalModels = true;

export interface Document {
  id: string;
  content: string;
  metadata: {
    source: string;
    filename: string;
    page?: number;
  };
  embedding?: number[];
}

export interface SearchResult {
  document: Document;
  score: number;
}

export class EmbeddingService {
  private embedder: any = null;
  private documents: Document[] = [];
  
  async initialize() {
    try {
      // Use a smaller, faster model for embeddings
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('Embedding service initialized');
    } catch (error) {
      console.error('Failed to initialize embedding service:', error);
      throw error;
    }
  }

  async addDocuments(docs: Document[]) {
    if (!this.embedder) {
      await this.initialize();
    }

    for (const doc of docs) {
      if (!doc.embedding) {
        doc.embedding = await this.createEmbedding(doc.content);
      }
      this.documents.push(doc);
    }
  }

  async createEmbedding(text: string): Promise<number[]> {
    if (!this.embedder) {
      throw new Error('Embedding service not initialized');
    }

    try {
      const result = await this.embedder(text, { pooling: 'mean', normalize: true });
      return Array.from(result.data);
    } catch (error) {
      console.error('Error creating embedding:', error);
      throw error;
    }
  }

  cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async search(query: string, limit: number = 5): Promise<SearchResult[]> {
    if (!this.embedder || this.documents.length === 0) {
      return [];
    }

    const queryEmbedding = await this.createEmbedding(query);
    
    const results: SearchResult[] = this.documents
      .map(doc => ({
        document: doc,
        score: this.cosineSimilarity(queryEmbedding, doc.embedding!)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  getDocuments(): Document[] {
    return this.documents;
  }

  clearDocuments() {
    this.documents = [];
  }
}

export const embeddingService = new EmbeddingService();