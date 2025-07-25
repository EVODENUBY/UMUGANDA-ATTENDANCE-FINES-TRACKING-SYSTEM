const mongoose = require('mongoose');
const fineSchema = new mongoose.Schema({
  fineId: { type: String, unique: true, required: true },
  citizenId: { type: String, required: true, ref: 'Citizen' },
  sessionId: { type: String, required: false },
  sessionDate: { type: Date, required: true },
  sessionLocation: { type: String },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
  paymentMethod: { type: String },
  paymentDate: { type: Date },
  paymentHistory: [
    {
      amount: Number,
      method: String,
      date: Date,
      sessionId: String,
      sessionLocation: String
    }
  ]
}, { timestamps: true });
module.exports = mongoose.model('Fine', fineSchema); 