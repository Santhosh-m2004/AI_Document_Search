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

      // Try a different model that's more likely to work
      const model = "microsoft/DialoGPT-large";
      
      const data = JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_length: 300,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false
        }
      });

      const options = {
        hostname: 'api-inference.huggingface.co',
        path: `/models/${model}`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'Content-Length': data.length
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
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
              return;
            }

            const result = JSON.parse(responseData);
            
            if (Array.isArray(result) && result.length > 0) {
              resolve(result[0].generated_text || "");
            } else if (result.generated_text) {
              resolve(result.generated_text);
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
      return "Based on your document, I can see this is related to the content you uploaded. Could you ask a more specific question?";
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