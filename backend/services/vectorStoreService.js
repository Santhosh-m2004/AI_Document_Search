const Document = require('../models/Document');
const PDFProcessor = require('./pdfProcessor');
const GeminiService = require('./geminiService'); // Changed from AIService to GeminiService

class VectorStoreService {
  async storeDocument(filename, buffer, sessionId) {
    try {
      // Extract text from PDF
      const text = await PDFProcessor.extractText(buffer);
      
      // Chunk the text
      const chunks = PDFProcessor.chunkText(text);
      
      // Generate embeddings for each chunk
      const documents = [];
      
      for (const chunk of chunks) {
        const embedding = await GeminiService.generateEmbedding(chunk);
        
        documents.push({
          filename,
          content: chunk,
          embedding,
          sessionId,
          uploadedAt: new Date()
        });
      }
      
      // Store in database
      await Document.insertMany(documents);
      
      return documents.length;
    } catch (error) {
      console.error('Error storing document:', error);
      throw new Error('Failed to process and store document');
    }
  }

  async findRelevantChunks(query,sessionId, limit = 5) {
    try {
      // Generate embedding for the query
      const queryEmbedding = await GeminiService.generateEmbedding(query);
       const sessionDocuments = await Document.find({ sessionId });
      // Find similar documents using cosine similarity
      
     const scoredDocuments = sessionDocuments.map(doc => {
        const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);
        return { ...doc.toObject(), similarity };
      });
      
      // Sort by similarity and return top results
      return scoredDocuments
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(doc => doc.content);
    } catch (error) {
      console.error('Error finding relevant chunks:', error);
      // Return empty array instead of failing
      return [];
    }
  }
  async clearSessionDocuments(sessionId) {
    try {
      await Document.deleteMany({ sessionId });
      return true;
    } catch (error) {
      console.error('Error clearing session documents:', error);
      return false;
    }
  }

  cosineSimilarity(vecA, vecB) {
    // Handle different embedding formats
    if (typeof vecA === 'object' && typeof vecB === 'object') {
      const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      
      for (const key of keys) {
        const a = vecA[key] || 0;
        const b = vecB[key] || 0;
        dotProduct += a * b;
        normA += a * a;
        normB += b * b;
      }
      
      return normA && normB ? dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
    }
    
    // Handle array-based embeddings
    if (Array.isArray(vecA) && Array.isArray(vecB)) {
      if (vecA.length !== vecB.length) return 0;
      
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      
      for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
      }
      
      return normA && normB ? dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
    }
    
    return 0;
  }
}

module.exports = new VectorStoreService();