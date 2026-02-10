// API Base URL - automatically uses environment variable in production
// In development: http://localhost:5000
// In production: set VITE_API_URL environment variable on Vercel/Netlify
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default API_URL;
