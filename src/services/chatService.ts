import { embeddingService, type SearchResult } from './embeddings';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: SearchResult[];
}

export interface ChatHistory {
  messages: ChatMessage[];
}

const OPENROUTER_API_KEY = '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';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export class ChatService {
  private history: ChatHistory = { messages: [] };

  async sendMessage(userMessage: string): Promise<ChatMessage> {
    // Add user message to history
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    this.history.messages.push(userMsg);

    try {
      // Search for relevant context
      const searchResults = await embeddingService.search(userMessage, 5);
      
      // Prepare context for the AI
      const context = searchResults.map(result => 
        `Source: ${result.document.metadata.filename}\n${result.document.content}`
      ).join('\n\n');

      // Get recent chat history for context
      const recentMessages = this.history.messages.slice(-6); // Last 6 messages for context
      
      // Create prompt with context and history
      const systemPrompt = `You are a helpful AI assistant that answers questions based on the provided PDF documents. 
Use the following context to answer the user's question. If the answer is not in the context, say so politely.

Context from PDFs:
${context}

Recent conversation history:
${recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Please provide a helpful and accurate response based on the context provided.`;

      // Call OpenRouter API
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Context-Aware Chatbot'
        },
        body: JSON.stringify({
          model: 'microsoft/wizardlm-2-8x22b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

      // Create AI message
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        context: searchResults
      };

      this.history.messages.push(aiMsg);
      return aiMsg;

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Create error message
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };

      this.history.messages.push(errorMsg);
      return errorMsg;
    }
  }

  getHistory(): ChatHistory {
    return this.history;
  }

  clearHistory() {
    this.history.messages = [];
  }
}

export const chatService = new ChatService();