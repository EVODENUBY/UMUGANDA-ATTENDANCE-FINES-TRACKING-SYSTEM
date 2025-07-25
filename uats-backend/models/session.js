const mongoose = require('mongoose');
const sessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  attendance: [{
    citizenNid: String,
    status: String,
    fine: Number,
    paymentStatus: String
  }]
}, { timestamps: true });
module.exports = mongoose.model('Session', sessionSchema); 