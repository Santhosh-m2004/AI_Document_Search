const Chat = require('../models/Chat');
const VectorStoreService = require('../services/vectorStoreService');
const GeminiService = require('../services/geminiService');
const Session = require('../models/Session');

const chatWithPDF = async (req, res) => {
  try {
    const { message, chatId, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required. Please upload a PDF first.' });
    }

    // Find relevant context from uploaded documents for this session
    const relevantChunks = await VectorStoreService.findRelevantChunks(message, sessionId);
    const context = relevantChunks.join('\n\n');

    // Generate response using Gemini AI
    const response = await GeminiService.generateResponse(message, context);

    // Get session info for the response
    const session = await Session.findOne({ sessionId });
    const pdfName = session ? session.pdfName : 'Unknown PDF';

    // Save to database
    let chat;
    if (chatId) {
      chat = await Chat.findById(chatId);
      chat.messages.push({ role: 'user', content: message });
      chat.messages.push({ role: 'assistant', content: response });
      await chat.save();
    } else {
      chat = await Chat.create({
        sessionId,
        messages: [
          { role: 'user', content: message },
          { role: 'assistant', content: response }
        ]
      });
    }

    res.json({
      response,
      chatId: chat._id,
      sessionId,
      pdfName,
      context: relevantChunks
    });
  } catch (error) {
    console.error('Chat error:', error);
    // Provide a friendly error message
    res.json({
      response: "I'm currently experiencing technical difficulties. Please try again later.",
      chatId: null,
      sessionId: req.body.sessionId || null
    });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: error.message });
  }
};

const clearSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Clear documents for this session
    await VectorStoreService.clearSessionDocuments(sessionId);
    
    // Clear session record
    await Session.deleteOne({ sessionId });
    
    res.json({
      message: 'Session cleared successfully',
      sessionId: null
    });
  } catch (error) {
    console.error('Clear session error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { chatWithPDF, getChatHistory, clearSession };