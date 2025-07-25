const express = require('express');
const router = express.Router();
const Citizen = require('../models/citizen');

// Get all citizens
router.get('/', async (req, res) => {
  const citizens = await Citizen.find();
  res.json(citizens);
});

// Add a new citizen
router.post('/', async (req, res) => {
  try {
    const citizen = new Citizen(req.body);
    await citizen.save();
    res.status(201).json(citizen);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Citizen login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const citizen = await Citizen.findOne({ username, password });
    if (!citizen) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json(citizen);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a citizen by _id
router.put('/:id', async (req, res) => {
  try {
    const updated = await Citizen.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Citizen not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a citizen by _id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Citizen.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Citizen not found' });
    res.json({ message: 'Citizen deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router; 