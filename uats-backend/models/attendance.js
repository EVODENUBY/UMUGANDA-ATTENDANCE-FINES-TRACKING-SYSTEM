const mongoose = require('mongoose');
const attendanceSchema = new mongoose.Schema({
  attendanceId: { type: String, unique: true, required: true },
  citizenId: { type: String, required: true, ref: 'Citizen' },
  sessionId: { type: String, required: true, ref: 'Session' },
  status: { type: String, enum: ['Present', 'Absent'], required: true }
}, { timestamps: true });
module.exports = mongoose.model('Attendance', attendanceSchema); 