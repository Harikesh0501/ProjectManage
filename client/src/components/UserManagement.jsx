import { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import EditUserModal from './EditUserModal';
import ChangePasswordModal from './ChangePasswordModal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from './ui/select';
import {
  Search, Filter, UserPlus, Download, Trash2, Edit3, Key,
  Shield, GraduationCap, Briefcase, Mail, Calendar, User, Info
} from 'lucide-react';
import { showToast } from '../lib/toast';
import API_URL from '../config';

const UserCard = ({ user, onDelete, onEdit, onChangePassword, index }) => {
  const roleConfig = {
    Admin: {
      color: 'from-purple-500 to-pink-600',
      icon: Shield,
      badgebBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      glow: 'shadow-purple-500/20'
    },
    Mentor: {
      color: 'from-emerald-500 to-green-600',
      icon: Briefcase,
      badgebBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      glow: 'shadow-emerald-500/20'
    },
    Student: {
      color: 'from-cyan-500 to-blue-600',
      icon: GraduationCap,
      badgebBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      glow: 'shadow-cyan-500/20'
    }
  };

  const config = roleConfig[user.role] || roleConfig['Student'];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className={`relative group`}
    >
      {/* Glow Effect */}
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${config.color} rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500`} />

      <div className="relative h-full dark:bg-slate-900/60 bg-white backdrop-blur-xl border dark:border-white/10 border-slate-200 rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-sm">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 dark:bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white shadow-lg`}>
              {user.photo ? (
                <img src={user.photo.startsWith('http') ? user.photo : `${API_URL}/${user.photo}`} className="w-full h-full object-cover rounded-xl" alt={user.name} />
              ) : (
                <span className="text-lg font-bold">{user.name.charAt(0)}</span>
              )}
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${config.badgebBg} flex items-center gap-1.5`}>
              <Icon size={12} />
              {user.role}
            </div>
          </div>

          <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-1 truncate">{user.name}</h3>
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
            <Mail size={14} />
            <span className="truncate">{user.email}</span>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-xs text-slate-500 border-t dark:border-white/5 border-slate-200 pt-3">
              <span className="flex items-center gap-1.5">
                <Calendar size={12} /> Joined
              </span>
              <span className="text-slate-300 font-mono">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-auto relative z-10">
          <Button
            onClick={() => onEdit(user)}
            variant="ghost"
            className="dark:bg-white/5 bg-slate-100 hover:bg-blue-500/20 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 border dark:border-white/5 border-slate-200"
            size="sm"
          >
            <Edit3 size={14} />
          </Button>
          <Button
            onClick={() => onChangePassword(user)}
            variant="ghost"
            className="dark:bg-white/5 bg-slate-100 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 border dark:border-white/5 border-slate-200"
            size="sm"
          >
            <Key size={14} />
          </Button>
          <Button
            onClick={() => onDelete(user._id)}
            variant="ghost"
            className="dark:bg-white/5 bg-slate-100 hover:bg-red-500/20 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 border dark:border-white/5 border-slate-200"
            size="sm"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const UserManagement = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToChangePassword, setUserToChangePassword] = useState(null);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Student' });
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin/users`, {
        headers: { 'Authorization': localStorage.getItem('token') }
      });
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast.error('Failed to load users');
    }
  };

  const handleUserSaved = () => {
    fetchUsers();
    setSelectedUser(null);
    setUserToChangePassword(null);
    showToast.success('User updated successfully');
  };

  const filterUsers = useCallback(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (roleFilter && roleFilter !== 'All') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  useEffect(() => {
    if (!user || user.role !== 'Admin') {
      navigate('/dashboard');
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, filterUsers]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/auth/register`, newUser);
      setShowAddUser(false);
      setNewUser({ name: '', email: '', password: '', role: 'Student' });
      fetchUsers();
      showToast.success('New user initialized successfully');
    } catch (error) {
      showToast.error('Error adding user: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_URL}/api/admin/users/${userId}`, {
          headers: { 'Authorization': localStorage.getItem('token') }
        });
        fetchUsers();
        showToast.success('User account terminated');
      } catch (error) {
        showToast.error('Error deleting user');
      }
    }
  };

  return (
    <div className="min-h-full flex flex-col gap-8 animate-in fade-in duration-500">

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-4 pt-4 md:px-8 md:pt-8">
        <div>
          <h2 className="text-3xl font-bold dark:text-white text-slate-900 tracking-tight flex items-center gap-3">
            <User className="text-cyan-400" /> User Database
          </h2>
          <p className="text-slate-400 mt-2 text-sm">Manage system access and privileges.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="dark:bg-slate-900/80 bg-white backdrop-blur-md border dark:border-white/10 border-slate-200 rounded-xl p-1 flex items-center gap-2 shadow-lg">
            <Button
              onClick={() => setShowAddUser(true)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/20 transition-all font-semibold"
            >
              <UserPlus size={18} className="mr-2" /> Add User
            </Button>
            <Button
              variant="ghost"
              className="text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              onClick={() => { }} // Export logic
            >
              <Download size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Cockpit Controls */}
      <div className="sticky top-0 z-20 dark:bg-[#050B14]/95 bg-slate-50/95 backdrop-blur-xl border-y dark:border-white/5 border-slate-200 py-4 px-4 md:px-8 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email or ID..."
              className="pl-10 dark:bg-slate-900/50 bg-white border-slate-200 dark:border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20 h-10 transition-all dark:text-white text-slate-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px] dark:bg-slate-900/50 bg-white dark:border-white/10 border-slate-200 h-10 dark:text-white text-slate-900">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-900 bg-white dark:border-white/10 border-slate-200 dark:text-white text-slate-900">
                <SelectItem value="All">All Roles</SelectItem>
                <SelectItem value="Student">Students</SelectItem>
                <SelectItem value="Mentor">Mentors</SelectItem>
                <SelectItem value="Admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: users.length, color: 'text-violet-400' },
          { label: 'Students', value: users.filter(u => u.role === 'Student').length, color: 'text-cyan-400' },
          { label: 'Mentors', value: users.filter(u => u.role === 'Mentor').length, color: 'text-emerald-400' },
          { label: 'Admins', value: users.filter(u => u.role === 'Admin').length, color: 'text-purple-400' }
        ].map((stat, i) => (
          <div key={i} className="dark:bg-slate-900/40 bg-white border dark:border-white/5 border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center shadow-sm">
            <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            <span className="text-xs text-slate-500 uppercase tracking-widest">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        <AnimatePresence>
          {filteredUsers.map((user, index) => (
            <UserCard
              key={user._id}
              user={user}
              index={index}
              onDelete={handleDeleteUser}
              onEdit={(u) => setSelectedUser(u)}
              onChangePassword={(u) => setUserToChangePassword(u)}
            />
          ))}
        </AnimatePresence>
        {filteredUsers.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500 flex flex-col items-center">
            <Info size={48} className="mb-4 opacity-50" />
            <p className="text-lg">No users found in the database.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="dark:bg-[#0A101F] bg-white border dark:border-white/10 border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
          >
            <div className="p-6 border-b dark:border-white/5 border-slate-200 bg-gradient-to-r dark:from-cyan-900/20 dark:to-blue-900/20 from-cyan-500/10 to-blue-500/10 dark:text-white text-slate-900">
              <h2 className="text-xl font-bold dark:text-white text-slate-900">Initialize New User</h2>
              <p className="text-xs text-slate-400 mt-1">Create a new access profile.</p>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Full Name</Label>
                <Input
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="dark:bg-slate-900/50 bg-slate-50 dark:border-white/10 border-slate-200 dark:text-white text-slate-900"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Email Address</Label>
                <Input
                  required
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="dark:bg-slate-900/50 bg-slate-50 dark:border-white/10 border-slate-200 dark:text-white text-slate-900"
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Password</Label>
                <Input
                  required
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="dark:bg-slate-900/50 bg-slate-50 dark:border-white/10 border-slate-200 dark:text-white text-slate-900"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400 text-xs uppercase">Role Assignment</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger className="dark:bg-slate-900/50 bg-slate-50 dark:border-white/10 border-slate-200 dark:text-white text-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 bg-white dark:border-white/10 border-slate-200 dark:text-white text-slate-900">
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Mentor">Mentor</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowAddUser(false)} className="flex-1 text-slate-400">Cancel</Button>
                <Button type="submit" className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white">Create Profile</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {selectedUser && (
        <EditUserModal user={selectedUser} onClose={() => setSelectedUser(null)} onSaved={handleUserSaved} />
      )}
      {userToChangePassword && (
        <ChangePasswordModal user={userToChangePassword} onClose={() => setUserToChangePassword(null)} onSaved={handleUserSaved} />
      )}
    </div>
  );
};

export default UserManagement;