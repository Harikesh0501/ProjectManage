import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Briefcase, FileText, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';
import API_URL from '../config';

const EditUserModal = ({ user, onClose, onSaved }) => {
  const [form, setForm] = useState({ name: '', email: '', role: 'Student', bio: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '', role: user.role || 'Student', bio: user.bio || '' });
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    setError('');
    if (!form.name || !form.email) {
      setError('Name and email are required');
      return;
    }
    setSaving(true);
    try {
      const res = await axios.put(`${API_URL}/api/admin/users/${user._id}`, form);
      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to save user');
      setSaving(false);
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'Admin': return 'from-purple-600 to-purple-700';
      case 'Mentor': return 'from-green-600 to-green-700';
      case 'Student': return 'from-blue-600 to-blue-700';
      default: return 'from-slate-600 to-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border-2 border-slate-700 rounded-3xl p-8 max-w-2xl w-full shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Edit User
            </h2>
            <p className="text-slate-400 mt-2">Update user information and settings</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-all">
            <X className="w-6 h-6 text-slate-300" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Name Field */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <label className="flex items-center gap-2 text-slate-200 font-semibold mb-3">
              <User className="w-5 h-5 text-blue-400" />
              Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Enter full name"
              className="w-full bg-slate-700/50 border-2 border-slate-600 hover:border-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-white placeholder:text-slate-400 rounded-xl px-4 py-3 transition-all"
            />
          </motion.div>

          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="flex items-center gap-2 text-slate-200 font-semibold mb-3">
              <Mail className="w-5 h-5 text-green-400" />
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="user@example.com"
              className="w-full bg-slate-700/50 border-2 border-slate-600 hover:border-slate-500 focus:border-green-500 focus:ring-2 focus:ring-green-200 text-white placeholder:text-slate-400 rounded-xl px-4 py-3 transition-all"
            />
          </motion.div>

          {/* Role Selection */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="flex items-center gap-2 text-slate-200 font-semibold mb-3">
              <Briefcase className="w-5 h-5 text-yellow-400" />
              User Role
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['Student', 'Mentor', 'Admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => setForm({ ...form, role })}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all border-2 ${
                    form.role === role
                      ? `bg-gradient-to-r ${getRoleColor(role)} text-white border-white shadow-lg`
                      : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:border-slate-500'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Bio Field */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="flex items-center gap-2 text-slate-200 font-semibold mb-3">
              <FileText className="w-5 h-5 text-purple-400" />
              Bio (Optional)
            </label>
            <textarea
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder="Write a short bio about the user..."
              rows="4"
              className="w-full bg-slate-700/50 border-2 border-slate-600 hover:border-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-white placeholder:text-slate-400 rounded-xl px-4 py-3 transition-all resize-none"
            />
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-900/30 border border-red-600 text-red-200 px-4 py-3 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white font-bold py-3 rounded-xl transition-all"
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default EditUserModal;
