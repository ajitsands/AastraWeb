import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('aastra_admin_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((user) => setAdmin(user))
      .catch(() => {
        localStorage.removeItem('aastra_admin_token');
        setAdmin(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem('aastra_admin_token', res.token);
    setAdmin(res.admin);
    return res.admin;
  };

  const logout = () => {
    localStorage.removeItem('aastra_admin_token');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, isAuthenticated: !!admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
