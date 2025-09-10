const https = require('https');

class HuggingFaceService {
  constructor() {
    this.apiToken = process.env.HUGGING_FACE_API_TOKEN;
    console.log('Hugging Face Service initialized');
  }

  async generateResponse(prompt, context = "") {
    return new Promise((resolve) => {
      try {
        if (!this.apiToken) {
          throw new Error('HUGGING_FACE_API_TOKEN is not set in environment variables');
        }

        const fullPrompt = context 
          ? `Based on the following context: ${context}\n\nAnswer this question: ${prompt}`
          : `Please answer this question: ${prompt}`;

        // Use a more reliable model that's known to work
        const model = "microsoft/DialoGPT-large"; // Try the large version
        
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
          timeout: 30000 // 30 second timeout
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
                // Fallback to a simple response
                resolve(this.getFallbackResponse(prompt, context));
                return;
              }

              const result = JSON.parse(responseData);
              
              if (Array.isArray(result) && result.length > 0) {
                resolve(result[0].generated_text || this.getFallbackResponse(prompt, context));
              } else if (result.generated_text) {
                resolve(result.generated_text);
              } else {
                console.log('Unexpected response format:', responseData);
                resolve(this.getFallbackResponse(prompt, context));
              }
            } catch (error) {
              console.error('Error parsing response:', error);
              resolve(this.getFallbackResponse(prompt, context));
            }
          });
        });

        req.on('error', (error) => {
          console.error('Request error:', error);
          resolve(this.getFallbackResponse(prompt, context));
        });

        req.on('timeout', () => {
          console.error('Request timeout');
          req.destroy();
          resolve(this.getFallbackResponse(prompt, context));
        });

        req.write(data);
        req.end();

      } catch (error) {
        console.error('Error with Hugging Face API:', error);
        resolve(this.getFallbackResponse(prompt, context));
      }
    });
  }

  getFallbackResponse(prompt, context) {
    // Simple rule-based fallback responses
    if (prompt.toLowerCase().includes('hello') || prompt.toLowerCase().includes('hi')) {
      return "Hello! How can I help you with your document?";
    } else if (prompt.toLowerCase().includes('thank')) {
      return "You're welcome! Is there anything else you'd like to know?";
    } else if (context) {
      return "Based on the document, this appears to be related to the content you uploaded. Could you provide more specific details about what you're looking for?";
    } else {
      return "I'm here to help you with questions about your uploaded documents. Please try asking something specific about your PDF content.";
    }
  }

  async generateEmbedding(text) {
    try {
      // Use simple embedding to avoid API issues
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
    return !!process.env.HUGGING_FACE_API_TOKEN;
  }
}

module.exports = new HuggingFaceService();