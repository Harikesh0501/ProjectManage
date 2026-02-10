const mentorOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'Mentor' && req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Only mentors and admins can perform this action' });
  }

  next();
};

module.exports = mentorOnly;
