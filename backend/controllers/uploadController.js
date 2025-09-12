const VectorStoreService = require('../services/vectorStoreService');
const Session = require('../models/Session');
const { v4: uuidv4 } = require('uuid');

const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if the file is a PDF
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }

    // Get or create session
    let sessionId = req.body.sessionId;
    let session;
    
    if (sessionId) {
      session = await Session.findOne({ sessionId });
    }
    
    if (!session) {
      sessionId = uuidv4();
      session = await Session.create({ sessionId, pdfName: req.file.originalname });
    } else {
      // Clear previous documents from this session
      await VectorStoreService.clearSessionDocuments(sessionId);
      session.pdfName = req.file.originalname;
      await session.save();
    }

    const chunkCount = await VectorStoreService.storeDocument(
      req.file.originalname,
      req.file.buffer,
      sessionId
    );

    res.json({
      message: 'File uploaded and processed successfully',
      chunks: chunkCount,
      filename: req.file.originalname,
      sessionId: sessionId
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { uploadPDF };