const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  name: { type: String, default: null },
  body: { type: String, required: true },
  direction: { type: String, enum: ['sent','received'], required: true },
  timestamp: { type: Date, required: true },
});

module.exports = mongoose.model('Message', MessageSchema);
