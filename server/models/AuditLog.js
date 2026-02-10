const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Can be null for system actions
    action: { type: String, required: true }, // e.g., 'LOGIN', 'DELETE_PROJECT', 'UPDATE_SPRINT'
    resource: { type: String }, // e.g., 'Project: 12345'
    details: { type: Object }, // Flexible field for extra info (diffs, etc.)
    ipAddress: String,
    userAgent: String
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
