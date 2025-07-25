const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  fullName: { type: String, required: true },
  nationalId: { type: String, unique: true, required: true },
  phone: { type: String, required: true },
  village: { type: String, required: true },
  sector: { type: String, required: true },
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'citizen'], required: true }
}, { timestamps: true });
module.exports = mongoose.model('User', userSchema); 