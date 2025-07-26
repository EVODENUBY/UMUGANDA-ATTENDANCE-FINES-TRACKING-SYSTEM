const express = require('express');
const router = express.Router();
const Fine = require('../models/fine');

// Get all fines
router.get('/', async (req, res) => {
  const fines = await Fine.find();
  res.json(fines);
});

// Add a new fine
router.post('/', async (req, res) => {
  try {
    const fine = new Fine(req.body);
    await fine.save();
    res.status(201).json(fine);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a fine by citizenId and sessionId
router.put('/', async (req, res) => {
  try {
    const { citizenId, sessionId, status, paymentMethod, paymentDate } = req.body;
    const fine = await Fine.findOne({ citizenId, sessionId });
    if (!fine) return res.status(404).json({ error: 'Fine not found' });
    fine.status = status || fine.status;
    if (status === 'Paid') {
      fine.paymentMethod = paymentMethod;
      fine.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
      fine.paymentHistory = fine.paymentHistory || [];
      fine.paymentHistory.push({
        amount: fine.amount,
        method: paymentMethod,
        date: paymentDate ? new Date(paymentDate) : new Date(),
        sessionId: fine.sessionId,
        sessionLocation: fine.sessionLocation
      });
    }
    await fine.save();
    res.json(fine);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a fine by _id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Fine.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Fine not found' });
    res.json({ message: 'Fine deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router; 