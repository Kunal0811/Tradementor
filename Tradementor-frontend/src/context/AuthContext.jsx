import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('user_email');
    if (token && email) {
      setUser({ email, token });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Mock login mechanism for client initialization
    // Once FastAPI is up, replace this with: const res = await api.post('/auth/token', { email, password });
    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user_email', email);
    setUser({ email, token: mockToken });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_email');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);