const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');

// Get logs (Admin only ideally, but using general auth for hackathon speed)
router.get('/', auth, async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(100); // Limit to last 100 activites
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
