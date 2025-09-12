const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  embedding: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  sessionId: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Document', documentSchema);