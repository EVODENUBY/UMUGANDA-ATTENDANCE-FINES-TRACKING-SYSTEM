const express = require('express');
const router = express.Router();
const Attendance = require('../models/attendance');
// Get all attendance records
router.get('/', async (req, res) => {
  const attendance = await Attendance.find();
  res.json(attendance);
});
// Add a new attendance record
router.post('/', async (req, res) => {
  try {
    const attendance = new Attendance(req.body);
    await attendance.save();
    res.status(201).json(attendance);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Update an attendance record by _id
router.put('/:id', async (req, res) => {
  try {
    const updated = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Attendance not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
module.exports = router; 