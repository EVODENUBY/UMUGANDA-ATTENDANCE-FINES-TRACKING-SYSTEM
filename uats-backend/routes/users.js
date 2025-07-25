const express = require('express');
const router = express.Router();
const User = require('../models/user');
// Get all users
router.get('/', async (req, res) => {
  const users = await User.find();
  res.json(users);
});
// Add a new user
router.post('/', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
module.exports = router; 