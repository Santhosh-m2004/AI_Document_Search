const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      return;
    }
    
    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      
      // Use the correct model name - try the latest available
      try {
        this.model = this.genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash", // Latest model as of 2024
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
          }
        });
        console.log('Gemini Service initialized successfully with model: gemini-1.5-flash');
      } catch (error) {
        console.log('Falling back to gemini-pro model');
        this.model = this.genAI.getGenerativeModel({ 
          model: "gemini-pro",
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
          }
        });
        console.log('Gemini Service initialized successfully with model: gemini-pro');
      }
    } catch (error) {
      console.error('Error initializing Gemini AI:', error);
    }
  }

  async generateResponse(prompt, context = "") {
    try {
      if (!this.model) {
        throw new Error('Gemini model not initialized');
      }

      const fullPrompt = context 
        ? `Based on the following context: ${context}\n\nAnswer this question: ${prompt}`
        : prompt;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating response with Gemini:', error);
      
      // Provide helpful error messages
      if (error.message.includes('quota') || error.message.includes('429')) {
        return "I've reached my API usage limit. Please try again later or check your Gemini API billing settings.";
      } else if (error.message.includes('API_KEY') || error.message.includes('key')) {
        return "Please check your Gemini API key configuration in the environment variables.";
      } else if (error.message.includes('model') || error.message.includes('404')) {
        return "The AI model is currently unavailable. Please try again later.";
      } else {
        return this.getFallbackResponse(prompt, context);
      }
    }
  }

  getFallbackResponse(prompt, context) {
    // Simple rule-based fallback responses
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi') || lowerPrompt.includes('hey')) {
      return "Hello! I'm here to help you with questions about your documents.";
    } else if (lowerPrompt.includes('thank')) {
      return "You're welcome! Is there anything else you'd like to know?";
    } else if (context) {
      // Try to extract some information from the context
      const sentences = context.split('.');
      const preview = sentences.slice(0, 2).join('.') + (sentences.length > 2 ? '...' : '');
      return `Based on your document, I can see this is about: ${preview}\n\nCould you ask a more specific question about this content?`;
    } else {
      return "I'm here to help you with questions about your uploaded documents. Please try asking something specific about your PDF content.";
    }
  }

  async generateEmbedding(text) {
    try {
      // For Gemini, we'll use a simple embedding approach
      return this.simpleEmbedding(text);
    } catch (error) {
      console.error('Error generating embedding:', error);
      return this.simpleEmbedding(text);
    }
  }

  simpleEmbedding(text) {
    // Simple word frequency-based embedding
    const words = text.toLowerCase().split(/\s+/);
    const embedding = {};
    
    words.forEach(word => {
      const normalizedWord = word.replace(/[^a-z0-9]/g, '');
      if (normalizedWord.length > 2) {
        embedding[normalizedWord] = (embedding[normalizedWord] || 0) + 1;
      }
    });
    
    return embedding;
  }

  isConfigured() {
    return !!process.env.GEMINI_API_KEY;
  }
}

module.exports = new GeminiService();