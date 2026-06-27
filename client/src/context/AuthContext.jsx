import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('cpgt_token'));
  const [restoring, setRestoring] = useState(Boolean(localStorage.getItem('cpgt_token')));

  useEffect(() => {
    if (token) {
      localStorage.setItem('cpgt_token', token);
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      localStorage.removeItem('cpgt_token');
      delete axios.defaults.headers.common.Authorization;
      setRestoring(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || user) return;

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_BASE}/auth/profile`);
        setUser(response.data.user);
      } catch (error) {
        console.error('Unable to restore user from token', error);
        setToken(null);
      } finally {
        setRestoring(false);
      }
    };

    fetchProfile();
  }, [token, user]);

  const login = (data) => {
    setToken(data.token);
    setUser(data.user);
    setRestoring(false);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setRestoring(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, restoring, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
