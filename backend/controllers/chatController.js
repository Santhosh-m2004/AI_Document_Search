const Chat = require('../models/Chat');
const VectorStoreService = require('../services/vectorStoreService');
const AIService = require('../services/aiService');

const chatWithPDF = async (req, res) => {
  try {
    const { message, chatId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Find relevant context from uploaded documents
    const relevantChunks = await VectorStoreService.findRelevantChunks(message);
    const context = relevantChunks.join('\n\n');

    // Generate response using AI service
    const response = await AIService.generateResponse(message, context);

    // Save to database
    let chat;
    if (chatId) {
      chat = await Chat.findById(chatId);
      chat.messages.push({ role: 'user', content: message });
      chat.messages.push({ role: 'assistant', content: response });
      await chat.save();
    } else {
      chat = await Chat.create({
        messages: [
          { role: 'user', content: message },
          { role: 'assistant', content: response }
        ]
      });
    }

    res.json({
      response,
      chatId: chat._id,
      context: relevantChunks
    });
  } catch (error) {
    console.error('Chat error:', error);
    // Provide a more specific error message
    res.json({
      response: "I'm having trouble processing your request right now. Please try again in a moment.",
      chatId: null
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

module.exports = { chatWithPDF, getChatHistory };