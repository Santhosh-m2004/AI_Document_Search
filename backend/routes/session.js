const express = require('express');
const { clearSession } = require('../controllers/chatController');

const router = express.Router();

router.post('/clear', clearSession);

module.exports = router;