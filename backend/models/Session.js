const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  pdfName: {
    type: String,
    default: null
  },
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours in seconds
  }
});

module.exports = mongoose.model('Session', sessionSchema);