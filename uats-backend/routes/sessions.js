const express = require('express');
const router = express.Router();
const Session = require('../models/session');
const Fine = require('../models/fine');
const { v4: uuidv4 } = require('uuid');
// Get all sessions
router.get('/', async (req, res) => {
  const sessions = await Session.find();
  res.json(sessions);
});
// Add a new session
router.post('/', async (req, res) => {
  try {
    const session = new Session(req.body);
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Update a session by _id
router.put('/:id', async (req, res) => {
  try {
    // Find the existing session for comparison
    const existingSession = await Session.findById(req.params.id);
    if (!existingSession) return res.status(404).json({ error: 'Session not found' });

    // Update the session as before
    const updated = await Session.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Session not found' });

    // --- Fine management logic ---
    // For each attendance record, check if status is 'Absent' and handle fine
    if (Array.isArray(updated.attendance)) {
      for (const att of updated.attendance) {
        if (att.status === 'Absent') {
          // Try to find an existing fine for this citizen/session
          let fine = await Fine.findOne({
            citizenId: att.citizenNid,
            sessionId: updated.sessionId,
          });
          if (!fine) {
            // Create new fine
            fine = new Fine({
              fineId: uuidv4(),
              citizenId: att.citizenNid,
              sessionId: updated.sessionId,
              sessionDate: updated.date,
              sessionLocation: updated.location,
              amount: att.fine || 5000,
              status: att.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid',
              paymentMethod: att.paymentStatus === 'Paid' ? att.paymentMethod : undefined,
              paymentDate: att.paymentStatus === 'Paid' ? new Date() : undefined,
              paymentHistory: att.paymentStatus === 'Paid' ? [{
                amount: att.fine || 5000,
                method: att.paymentMethod,
                date: new Date(),
                sessionId: updated.sessionId,
                sessionLocation: updated.location
              }] : []
            });
            await fine.save();
          } else {
            // Update existing fine
            fine.amount = att.fine || 5000;
            fine.status = att.paymentStatus === 'Paid' ? 'Paid' : 'Unpaid';
            if (att.paymentStatus === 'Paid') {
              fine.paymentMethod = att.paymentMethod;
              fine.paymentDate = new Date();
              fine.paymentHistory = fine.paymentHistory || [];
              fine.paymentHistory.push({
                amount: att.fine || 5000,
                method: att.paymentMethod,
                date: new Date(),
                sessionId: updated.sessionId,
                sessionLocation: updated.location
              });
            }
            await fine.save();
          }
        } else if (att.status === 'Present') {
          // Remove fine for this session if present
          await Fine.deleteOne({ citizenId: att.citizenNid, sessionId: updated.sessionId });
        }
      }
    }
    // --- End fine management logic ---

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Delete a session by _id
router.delete('/:id', async (req, res) => {
  try {
    // Find the session to get its sessionId
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    // Delete all fines associated with this session
    await Fine.deleteMany({ sessionId: session.sessionId });
    // Delete the session itself
    const deleted = await Session.findByIdAndDelete(req.params.id);
    res.json({ message: 'Session and associated fines deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
module.exports = router; 