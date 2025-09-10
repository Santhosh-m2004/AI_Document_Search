const pdf = require('pdf-parse');

class PDFProcessor {
  async extractText(buffer) {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF: ' + error.message);
    }
  }

  chunkText(text, chunkSize = 1000, overlap = 200) {
    try {
      // Handle empty or very short text
      if (!text || text.length === 0) {
        return ['No text content found in the PDF'];
      }
      
      // Split into sentences
      const sentences = text.split(/(?<=[.!?])\s+/);
      const chunks = [];
      let currentChunk = '';

      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > chunkSize) {
          if (currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = currentChunk.slice(-overlap) + ' ' + sentence;
          } else {
            // If a single sentence is longer than chunkSize, split it
            chunks.push(sentence.substring(0, chunkSize));
            currentChunk = sentence.substring(chunkSize - overlap);
          }
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }

      if (currentChunk) {
        chunks.push(currentChunk);
      }

      return chunks;
    } catch (error) {
      console.error('Text chunking error:', error);
      // Fallback: return the whole text as a single chunk
      return [text || 'No text content available'];
    }
  }
}

module.exports = new PDFProcessor();