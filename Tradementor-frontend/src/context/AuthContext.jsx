import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, getStoredUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    const userData = { token: data.access_token, user_id: data.user_id, name: data.name, email: data.email };
    localStorage.setItem('tm_user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (name, email, password) => {
    await authAPI.register(name, email, password);
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('tm_user');
    // Clear local caches
    ['tm_positions','tm_trade_history','tm_prices','tm_portfolio'].forEach(k => localStorage.removeItem(k));
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};