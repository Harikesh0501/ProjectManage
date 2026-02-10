const AuditLog = require('../models/AuditLog');

const logAction = async (userId, action, resource, details = {}, req = null) => {
    try {
        const log = new AuditLog({
            user: userId,
            action,
            resource,
            details,
            ipAddress: req ? req.ip : null,
            userAgent: req ? req.headers['user-agent'] : null
        });
        await log.save();
    } catch (err) {
        console.error('Audit Log Error:', err.message);
    }
};

module.exports = logAction;
