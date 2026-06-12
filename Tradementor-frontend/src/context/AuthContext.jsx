import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('tm_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Mock auth — replace with FastAPI call when backend is ready
    const userData = {
      email,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      token: btoa(`${email}:${Date.now()}`),
      joinedAt: new Date().toISOString(),
      balance: parseFloat(localStorage.getItem('tm_balance') || '10000'),
    };
    localStorage.setItem('tm_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('tm_user');
    setUser(null);
  };

  const updateBalance = (newBalance) => {
    const updated = { ...user, balance: newBalance };
    localStorage.setItem('tm_user', JSON.stringify(updated));
    localStorage.setItem('tm_balance', String(newBalance));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateBalance }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);