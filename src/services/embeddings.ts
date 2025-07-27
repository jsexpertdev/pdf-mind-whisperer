// Simple client-side embedding using TF-IDF approach
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
  private documents: Document[] = [];
  private vocabulary: Set<string> = new Set();
  
  async initialize() {
    try {
      console.log('Embedding service initialized with simple TF-IDF');
    } catch (error) {
      console.error('Failed to initialize embedding service:', error);
      throw error;
    }
  }

  async addDocuments(docs: Document[]) {
    for (const doc of docs) {
      if (!doc.embedding) {
        doc.embedding = this.createEmbedding(doc.content);
      }
      this.documents.push(doc);
      // Build vocabulary
      const words = this.tokenize(doc.content);
      words.forEach(word => this.vocabulary.add(word));
    }
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  createEmbedding(text: string): number[] {
    const words = this.tokenize(text);
    const wordCount = new Map<string, number>();
    
    // Count word frequencies
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    
    // Create simple TF-IDF vector (simplified version)
    const embedding: number[] = [];
    Array.from(this.vocabulary).forEach(word => {
      const tf = (wordCount.get(word) || 0) / words.length;
      embedding.push(tf);
    });
    
    // Normalize vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async search(query: string, limit: number = 5): Promise<SearchResult[]> {
    if (this.documents.length === 0) {
      return [];
    }

    const queryEmbedding = this.createEmbedding(query);
    
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