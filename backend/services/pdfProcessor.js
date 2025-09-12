const pdf = require('pdf-parse');

class PDFProcessor {
  async extractText(buffer) {
    try {
      // Check if buffer is valid
      if (!buffer || buffer.length === 0) {
        throw new Error('Empty PDF file provided');
      }

      const data = await pdf(buffer);
      
      // Check if text was extracted
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('No text content could be extracted from the PDF. This might be a scanned document or image-based PDF.');
      }
      
      return data.text;
    } catch (error) {
      console.error('PDF extraction error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('No text content')) {
        throw new Error('The PDF appears to be a scanned document or image-based PDF. Please upload a text-based PDF for analysis.');
      } else if (error.message.includes('Empty PDF')) {
        throw new Error('The uploaded file appears to be empty or corrupted.');
      } else if (error.message.includes('PDF')) {
        throw new Error('Failed to process the PDF file. It might be corrupted or in an unsupported format.');
      } else {
        throw new Error('Failed to extract text from PDF: ' + error.message);
      }
    }
  }

  chunkText(text, chunkSize = 1000, overlap = 200) {
    try {
      // Handle empty or very short text
      if (!text || text.length === 0) {
        return ['No text content found in the PDF'];
      }
      
      // Clean up text
      const cleanedText = text.replace(/\s+/g, ' ').trim();
      
      // Split into sentences
      const sentences = cleanedText.split(/(?<=[.!?])\s+/);
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

      return chunks.length > 0 ? chunks : [cleanedText];
    } catch (error) {
      console.error('Text chunking error:', error);
      // Fallback: return the whole text as a single chunk
      return [text || 'No text content available'];
    }
  }
}

module.exports = new PDFProcessor();