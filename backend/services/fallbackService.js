const fetch = require('node-fetch');

class FallbackService {
  constructor() {
    this.providers = [
      this.tryHuggingFace.bind(this),
      this.tryDeepAI.bind(this),
      this.tryOpenAICompatible.bind(this)
    ];
  }

  async generateResponse(prompt, context = "") {
    const fullPrompt = context 
      ? `Based on the following context: ${context}\n\nAnswer this question: ${prompt}`
      : `Please answer this question: ${prompt}`;

    let lastError = null;
    
    // Try each provider in order
    for (const provider of this.providers) {
      try {
        const response = await provider(fullPrompt);
        if (response) return response;
      } catch (error) {
        lastError = error;
        console.log(`Provider failed:`, error.message);
      }
    }
    
    // If all providers failed
    throw lastError || new Error('All providers failed');
  }

  async tryHuggingFace(prompt) {
    // Your existing Hugging Face implementation
    const apiToken = process.env.HUGGING_FACE_API_TOKEN;
    if (!apiToken) throw new Error('No Hugging Face token');
    
    const response = await fetch(
      'https://api-inference.huggingface.co/models/gpt2',
      {
        headers: { 
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json" 
        },
        method: "POST",
        body: JSON.stringify({ 
          inputs: prompt,
          parameters: {
            max_length: 200,
            temperature: 0.7
          }
        }),
      }
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    return result[0]?.generated_text || null;
  }

  async tryDeepAI(prompt) {
    // DeepAI offers a free text generation API
    const response = await fetch(
      'https://api.deepai.org/api/text-generator',
      {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': process.env.DEEP_AI_API_KEY || 'quickstart-credential' // Free tier
        },
        body: JSON.stringify({
          text: prompt
        })
      }
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    return result.output || null;
  }

  async tryOpenAICompatible(prompt) {
    // Try a free OpenAI-compatible API
    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer free-token' // This won't work, but some services offer free tiers
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{role: "user", content: prompt}],
          max_tokens: 150
        })
      }
    );
    
    // This is just a placeholder - you'd need to find a real free API
    throw new Error('OpenAI compatible API not configured');
  }

  async generateEmbedding(text) {
    // Simple embedding fallback
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

module.exports = new FallbackService();