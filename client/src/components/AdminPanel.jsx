import { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EditUserModal from './EditUserModal';
import AuthContext from '../context/AuthContext';
import API_URL from '../config';

const AdminPanel = () => {
  console.log('AdminPanel component rendered');
  const { user, logout } = useContext(AuthContext);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [allProjects, setAllProjects] = useState([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [newProject, setNewProject] = useState({ title: '', description: '', status: 'Planning', startDate: '', endDate: '', mentor: '', teamMemberCount: 0 });
  const navigate = useNavigate();

  const fetchAdminData = useCallback(async () => {
    try {
      const usersRes = await axios.get(`${API_URL}/api/admin/users`);
      const projectsRes = await axios.get(`${API_URL}/api/admin/projects`);
      setAllUsers(usersRes.data);
      setAllProjects(projectsRes.data);
    } catch {
      console.log('Admin data fetch error');
    }
  }, []);

  const handleUserSaved = (updatedUser) => {
    setAllUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const projectData = {
        title: newProject.title,
        description: newProject.description,
        status: newProject.status,
        startDate: newProject.startDate,
        endDate: newProject.endDate
      };
      await axios.post(`${API_URL}/api/projects`, projectData);
      setNewProject({ title: '', description: '', status: 'Planning', startDate: '', endDate: '', mentor: '', teamMemberCount: 0 });
      alert('Project created successfully!');
      fetchAdminData();
    } catch (err) {
      alert('Failed to create project: ' + (err.response?.data?.error || err.message));
    }
  };

  useEffect(() => {
    console.log('AdminPanel useEffect - user:', user);
    if (user && user.role && user.role.toLowerCase() === 'admin') {
      console.log('User is admin, fetching data');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchAdminData();
    }
  }, [user, fetchAdminData]);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Loading...</h2>
        <p>Please wait while we verify your access.</p>
      </div>
    </div>;
  }

  if (!user.role || user.role.toLowerCase() !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
        <p>You don't have permission to access the admin panel.</p>
        <button onClick={() => navigate('/dashboard')} className="btn-gradient mt-4">
          Go to Dashboard
        </button>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen p-6 fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="glass p-6 rounded-2xl mb-8 flex justify-between items-center">
          <h1 className="text-4xl font-bold gradient-text">Admin Panel</h1>
          <div className="flex space-x-4">
            <button onClick={() => setActiveSection('profile')} className={`btn-gradient ${activeSection === 'profile' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}>
              Profile
            </button>
            <button onClick={() => setActiveSection('overview')} className={`btn-gradient ${activeSection === 'overview' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 'bg-gradient-to-r from-blue-500 to-cyan-500'}`}>
              Dashboard
            </button>
            <button onClick={logout} className="btn-gradient bg-gradient-to-r from-red-500 to-orange-500">
              Logout
            </button>
          </div>
        </div>

        {activeSection === 'profile' && (
          <div className="card-modern mb-8">
            <h2 className="text-3xl font-bold gradient-text mb-6">Admin Profile Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-6 rounded-xl">
                <h3 className="text-xl font-bold gradient-text mb-4">Personal Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Name</label>
                    <p className="text-lg">{user?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email</label>
                    <p className="text-lg">{user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Role</label>
                    <p className="text-lg">{user?.role}</p>
                  </div>
                </div>
              </div>
              <div className="glass p-6 rounded-xl">
                <h3 className="text-xl font-bold gradient-text mb-4">Account Statistics</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Total Users Managed</label>
                    <p className="text-lg">{allUsers.length}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Total Projects Overseen</label>
                    <p className="text-lg">{allProjects.length}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">System Health</label>
                    <p className="text-lg text-green-600">All Systems Operational</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'user-details' && (
          <div className="card-modern mb-8">
            <h2 className="text-3xl font-bold gradient-text mb-6">User Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {allUsers.map(u => (
                <div key={u._id} className="glass p-4 rounded-xl hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold gradient-text">{u.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.role === 'Admin' ? 'bg-gradient-to-r from-purple-400 to-purple-600 text-white' :
                      u.role === 'Mentor' ? 'bg-gradient-to-r from-green-400 to-green-600 text-white' :
                      'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{u.email}</p>
                  <p className="text-gray-500 text-xs mb-3">Joined: {new Date(u.createdAt).toLocaleDateString()}</p>
                  <div className="flex space-x-2">
                    <button onClick={() => setSelectedUser(u)} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                      Edit
                    </button>
                    <button className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'add-user' && (
          <div className="card-modern mb-8">
            <h2 className="text-3xl font-bold gradient-text mb-6">Add New User</h2>
            <div className="glass p-6 rounded-xl">
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Name</label>
                    <input type="text" className="input-modern w-full" placeholder="Enter user name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
                    <input type="email" className="input-modern w-full" placeholder="Enter email address" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Role</label>
                    <select className="input-modern w-full">
                      <option value="Student">Student</option>
                      <option value="Mentor">Mentor</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Password</label>
                    <input type="password" className="input-modern w-full" placeholder="Enter password" />
                  </div>
                </div>
                <button type="submit" className="btn-gradient bg-gradient-to-r from-green-500 to-teal-500">
                  Create User
                </button>
              </form>
            </div>
          </div>
        )}

        {activeSection === 'bulk-actions' && (
          <div className="card-modern mb-8">
            <h2 className="text-3xl font-bold gradient-text mb-6">Bulk User Actions</h2>
            <div className="glass p-6 rounded-xl">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Select Action</label>
                  <select className="input-modern w-full">
                    <option value="">Choose an action</option>
                    <option value="activate">Activate Selected Users</option>
                    <option value="deactivate">Deactivate Selected Users</option>
                    <option value="delete">Delete Selected Users</option>
                    <option value="change-role">Change Role</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Select Users</label>
                  <div className="max-h-48 overflow-y-auto border rounded-lg p-4">
                    {allUsers.map(u => (
                      <div key={u._id} className="flex items-center space-x-2 mb-2">
                        <input type="checkbox" id={`user-${u._id}`} className="rounded" />
                        <label htmlFor={`user-${u._id}`} className="text-sm">{u.name} ({u.email})</label>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="btn-gradient bg-gradient-to-r from-yellow-500 to-orange-500">
                  Execute Bulk Action
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'create-project' && (
          <div className="card-modern mb-8">
            <h2 className="text-3xl font-bold gradient-text mb-6">Create New Project</h2>
            <div className="glass p-6 rounded-xl">
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Project Title</label>
                    <input
                      type="text"
                      value={newProject.title}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                      className="input-modern w-full"
                      placeholder="Enter project title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Status</label>
                    <select
                      value={newProject.status}
                      onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                      className="input-modern w-full"
                    >
                      <option value="Planning">Planning</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Description</label>
                    <textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      className="input-modern w-full"
                      rows="4"
                      placeholder="Enter project description"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={newProject.startDate}
                      onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                      className="input-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">End Date</label>
                    <input
                      type="date"
                      value={newProject.endDate}
                      onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                      className="input-modern w-full"
                    />
                  </div>
                </div>
                <button type="submit" className="btn-gradient bg-gradient-to-r from-blue-500 to-cyan-500">
                  Create Project
                </button>
              </form>
            </div>
          </div>
        )}

        {activeSection === 'project-details' && (
          <div className="card-modern mb-8">
            <h2 className="text-3xl font-bold gradient-text mb-6">Project Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {allProjects.map(p => (
                <div key={p._id} className="glass p-4 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => navigate(`/project/${p._id}`)}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold gradient-text">{p.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === 'Completed' ? 'bg-gradient-to-r from-green-400 to-green-600 text-white' :
                      p.status === 'Active' ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white' :
                      'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{p.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Creator: {p.creator?.name || 'Unknown'}</span>
                    <span>Mentor: {p.mentor?.name || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Team: {p.teamMembers?.length || 0} members</span>
                    <span>Progress: {p.progress || 0}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Start: {p.startDate}</span>
                    <span>End: {p.endDate}</span>
                  </div>
                  {p.githubRepo && (
                    <div className="mt-2">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        <i className="fab fa-github mr-1"></i>GitHub Linked
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'bulk-edit' && (
          <div className="card-modern mb-8">
            <h2 className="text-3xl font-bold gradient-text mb-6">Bulk Project Edit</h2>
            <div className="glass p-6 rounded-xl">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Select Action</label>
                  <select className="input-modern w-full">
                    <option value="">Choose an action</option>
                    <option value="change-status">Change Status</option>
                    <option value="assign-mentor">Assign Mentor</option>
                    <option value="update-dates">Update Dates</option>
                    <option value="delete">Delete Projects</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Select Projects</label>
                  <div className="max-h-48 overflow-y-auto border rounded-lg p-4">
                    {allProjects.map(p => (
                      <div key={p._id} className="flex items-center space-x-2 mb-2">
                        <input type="checkbox" id={`project-${p._id}`} className="rounded" />
                        <label htmlFor={`project-${p._id}`} className="text-sm">{p.title}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <button className="btn-gradient bg-gradient-to-r from-yellow-500 to-orange-500">
                  Execute Bulk Edit
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'overview' && (
          <>

        {/* Admin Statistics Dashboard */}
        <div className="card-modern mb-8">
          <h2 className="text-3xl font-bold gradient-text mb-6">System Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass p-6 rounded-xl text-center">
              <h3 className="text-2xl font-bold gradient-text mb-2">{allUsers.length}</h3>
              <p className="text-gray-600">Total Users</p>
              <div className="mt-2 text-sm">
                <span className="text-blue-500">{allUsers.filter(u => u.role === 'Student').length} Students</span> •
                <span className="text-green-500"> {allUsers.filter(u => u.role === 'Mentor').length} Mentors</span> •
                <span className="text-purple-500"> {allUsers.filter(u => u.role === 'Admin').length} Admins</span>
              </div>
            </div>
            <div className="glass p-6 rounded-xl text-center">
              <h3 className="text-2xl font-bold gradient-text mb-2">{allProjects.length}</h3>
              <p className="text-gray-600">Total Projects</p>
              <div className="mt-2 text-sm">
                <span className="text-green-500">{allProjects.filter(p => p.status === 'Completed').length} Completed</span> •
                <span className="text-blue-500"> {allProjects.filter(p => p.status === 'Active').length} Active</span> •
                <span className="text-yellow-500"> {allProjects.filter(p => p.status === 'On Hold').length} On Hold</span>
              </div>
            </div>
            <div className="glass p-6 rounded-xl text-center">
              <h3 className="text-2xl font-bold gradient-text mb-2">
                {Math.round(allProjects.reduce((acc, p) => acc + (p.progress || 0), 0) / Math.max(allProjects.length, 1))}%
              </h3>
              <p className="text-gray-600">Average Progress</p>
            </div>
            <div className="glass p-6 rounded-xl text-center">
              <h3 className="text-2xl font-bold gradient-text mb-2">
                {allProjects.filter(p => p.githubRepo).length}
              </h3>
              <p className="text-gray-600">GitHub Integrated</p>
            </div>
          </div>
        </div>

        {/* User Management */}
        <div className="card-modern mb-8">
          <h2 className="text-3xl font-bold gradient-text mb-6">User Management</h2>
          <div className="mb-4 flex flex-wrap gap-4">
            <button onClick={() => setActiveSection('user-details')} className="btn-gradient bg-gradient-to-r from-blue-500 to-cyan-500">
              View User Details
            </button>
            <button onClick={() => setActiveSection('add-user')} className="btn-gradient bg-gradient-to-r from-green-500 to-teal-500">
              Add New User
            </button>
            <button onClick={() => setActiveSection('bulk-actions')} className="btn-gradient bg-gradient-to-r from-yellow-500 to-orange-500">
              Bulk Actions
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {allUsers.map(u => (
              <div key={u._id} className="glass p-4 rounded-xl hover:shadow-lg transition-all duration-300">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold gradient-text">{u.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    u.role === 'Admin' ? 'bg-gradient-to-r from-purple-400 to-purple-600 text-white' :
                    u.role === 'Mentor' ? 'bg-gradient-to-r from-green-400 to-green-600 text-white' :
                    'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
                  }`}>
                    {u.role}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{u.email}</p>
                <div className="flex space-x-2">
                  <button onClick={() => setSelectedUser(u)} className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                    Edit
                  </button>
                  <button className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedUser && (
          <EditUserModal user={selectedUser} onClose={() => setSelectedUser(null)} onSaved={handleUserSaved} />
        )}

        {/* Project Management */}
        <div className="card-modern mb-8">
          <h2 className="text-3xl font-bold gradient-text mb-6">Project Management</h2>
          <div className="mb-4 flex flex-wrap gap-4">
            <button onClick={() => setActiveSection('create-project')} className="btn-gradient bg-gradient-to-r from-blue-500 to-cyan-500">
              Create Project
            </button>
            <button onClick={() => setActiveSection('project-details')} className="btn-gradient bg-gradient-to-r from-green-500 to-teal-500">
              View Project Details
            </button>
            <button onClick={() => setActiveSection('bulk-edit')} className="btn-gradient bg-gradient-to-r from-yellow-500 to-orange-500">
              Bulk Edit
            </button>
            <select className="input-modern w-auto">
              <option value="">Filter by Status</option>
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {allProjects.map(p => (
              <div key={p._id} className="glass p-4 rounded-xl cursor-pointer hover:shadow-lg transition-all duration-300" onClick={() => navigate(`/project/${p._id}`)}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold gradient-text">{p.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    p.status === 'Completed' ? 'bg-gradient-to-r from-green-400 to-green-600 text-white' :
                    p.status === 'Active' ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white' :
                    'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Creator: {p.creator?.name || 'Unknown'}</span>
                  <span>Mentor: {p.mentor?.name || 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>Team: {p.teamMembers?.length || 0} members</span>
                  <span>Progress: {p.progress || 0}%</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Start: {p.startDate}</span>
                  <span>End: {p.endDate}</span>
                </div>
                {p.githubRepo && (
                  <div className="mt-2">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      <i className="fab fa-github mr-1"></i>GitHub Linked
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* System Settings */}
        <div className="card-modern">
          <h2 className="text-3xl font-bold gradient-text mb-6">System Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass p-4 rounded-xl">
              <h3 className="font-bold gradient-text mb-2">Database Management</h3>
              <p className="text-gray-600 text-sm mb-4">Backup, restore, and maintenance options</p>
              <div className="flex space-x-2">
                <button className="btn-gradient text-sm">Backup</button>
                <button className="btn-gradient text-sm bg-gradient-to-r from-yellow-500 to-orange-500">Maintenance</button>
              </div>
            </div>
            <div className="glass p-4 rounded-xl">
              <h3 className="font-bold gradient-text mb-2">System Logs</h3>
              <p className="text-gray-600 text-sm mb-4">View system activity and error logs</p>
              <button className="btn-gradient text-sm">View Logs</button>
            </div>
            <div className="glass p-4 rounded-xl">
              <h3 className="font-bold gradient-text mb-2">Notifications</h3>
              <p className="text-gray-600 text-sm mb-4">Configure system-wide notifications</p>
              <button className="btn-gradient text-sm">Configure</button>
            </div>
            <div className="glass p-4 rounded-xl">
              <h3 className="font-bold gradient-text mb-2">Reports</h3>
              <p className="text-gray-600 text-sm mb-4">Generate detailed system reports</p>
              <button className="btn-gradient text-sm">Generate Report</button>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;