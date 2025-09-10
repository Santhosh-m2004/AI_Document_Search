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
    if (error.message.includes('Failed to extract text')) {
      res.status(400).json({ error: 'The PDF file appears to be corrupted or inaccessible' });
    } else if (error.message.includes('Failed to process and store')) {
      res.status(500).json({ error: 'Failed to process the PDF file' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = { uploadPDF };