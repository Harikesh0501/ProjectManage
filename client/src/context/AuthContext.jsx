import { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_URL from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`);
      return res.data;
    } catch {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['x-auth-token'];
      return null;
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['x-auth-token'] = token;
        const userData = await fetchUser();
        setUser(userData);
      }
      setLoading(false);
    };
    loadUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        return { success: false, message: error.response.data.msg || 'Login failed' };
      } else if (error.request) {
        return { success: false, message: 'Server not responding. Please check if the backend is running.' };
      } else {
        return { success: false, message: 'Network error occurred' };
      }
    }
  };

  const register = async (name, email, password, role, collegeId) => {
    const res = await axios.post(`${API_URL}/api/auth/register`, { name, email, password, role, collegeId });
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['x-auth-token'] = res.data.token;
    setUser({ name, email, role });
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;