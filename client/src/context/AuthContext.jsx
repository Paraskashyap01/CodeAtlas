import { createContext, useContext, useEffect, useState } from 'react';
import { getProfile, logout as logoutApi } from '../api/auth.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        setUser(response.data.user);
      } catch (error) {
        setUser(null);
      } finally {
        setRestoring(false);
      }
    };

    fetchProfile();
  }, []);

  const login = (data) => {
    setUser(data.user);
    setRestoring(false);
  };

  const logout = async () => {
    await logoutApi().catch(() => {});
    setUser(null);
    setRestoring(false);
  };

  return (
    <AuthContext.Provider value={{ user, restoring, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
