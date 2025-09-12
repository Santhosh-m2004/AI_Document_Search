const VectorStoreService = require('../services/vectorStoreService');

const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if the file is a PDF
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    // Check file size
    if (req.file.size > 10 * 1024 * 1024) { // 10MB limit
      return res.status(400).json({ error: 'File size exceeds the 10MB limit' });
    }

    const chunkCount = await VectorStoreService.storeDocument(
      req.file.originalname,
      req.file.buffer
    );

    res.json({
      message: 'File uploaded and processed successfully',
      chunks: chunkCount,
      filename: req.file.originalname
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Provide more specific error messages
    if (error.message.includes('scanned document') || error.message.includes('image-based')) {
      res.status(400).json({ error: error.message });
    } else if (error.message.includes('corrupted') || error.message.includes('unsupported format')) {
      res.status(400).json({ error: error.message });
    } else if (error.message.includes('Empty PDF') || error.message.includes('empty')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to process the PDF file. Please try again with a different file.' });
    }
  }
};

module.exports = { uploadPDF };