const https = require('https');

class AIService {
  constructor() {
    this.apiToken = process.env.HUGGING_FACE_API_TOKEN;
  }

  async generateResponse(prompt, context = "") {
    // Try Hugging Face first
    try {
      const hfResponse = await this.tryHuggingFace(prompt, context);
      if (hfResponse && !hfResponse.includes('technical difficulties')) {
        return hfResponse;
      }
    } catch (error) {
      console.log('Hugging Face failed, trying fallback:', error.message);
    }

    // Fallback to rule-based responses
    return this.getFallbackResponse(prompt, context);
  }

  async tryHuggingFace(prompt, context) {
    return new Promise((resolve, reject) => {
      const fullPrompt = context 
        ? `Based on the following context: ${context}\n\nAnswer this question: ${prompt}`
        : `Please answer this question: ${prompt}`;

      // Use a model that's specifically designed for question answering
      const model = "deepset/roberta-base-squad2"; // Question answering model
      
      const data = JSON.stringify({
        inputs: {
          question: prompt,
          context: context || "This is a document uploaded by the user. Please provide helpful information based on its content."
        }
      });

      const options = {
        hostname: 'api-inference.huggingface.co',
        path: `/models/${model}`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: 15000
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              console.error('API error:', res.statusCode, responseData);
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
              return;
            }

            const result = JSON.parse(responseData);
            
            if (result.answer) {
              resolve(result.answer);
            } else if (result.error) {
              reject(new Error(result.error));
            } else {
              reject(new Error('Unexpected response format'));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });

      req.write(data);
      req.end();
    });
  }

  getFallbackResponse(prompt, context) {
    // Simple rule-based responses
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi') || lowerPrompt.includes('hey')) {
      return "Hello! I'm here to help you with questions about your documents.";
    } else if (lowerPrompt.includes('thank')) {
      return "You're welcome! Is there anything else you'd like to know?";
    } else if (lowerPrompt.includes('what') && lowerPrompt.includes('this') && lowerPrompt.includes('about')) {
      return "This appears to be a document you've uploaded. I can help answer questions about its content.";
    } else if (context) {
      // Try to extract some key information from the context
      const sentences = context.split('.');
      const preview = sentences.slice(0, 2).join('.') + (sentences.length > 2 ? '...' : '');
      return `Based on your document, I can see this is about: ${preview} Could you ask a more specific question about this content?`;
    } else {
      return "I'm here to help you with questions about your uploaded documents. Please try asking something specific about your PDF content.";
    }
  }

  async generateEmbedding(text) {
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
}

module.exports = new AIService();