const express = require('express');
const { chatWithPDF, getChatHistory } = require('../controllers/chatController');

const router = express.Router();

router.post('/', chatWithPDF);
router.get('/:chatId', getChatHistory);

module.exports = router;