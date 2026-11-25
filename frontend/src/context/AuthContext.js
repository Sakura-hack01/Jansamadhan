import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const persistSession = (data) => {
    if (data?.token) localStorage.setItem('token', data.token);
    if (data?.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    if (data?.user) {
      setUser(data.user);
      setIsAuthenticated(true);
    }
  };

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    persistSession(data);
    return data;
  };

  const updateExpiredPassword = async (token, newPassword) => {
    const { data } = await api.post('/auth/update-expired-password', { token, newPassword });
    persistSession(data);
    return data;
  };

  const register = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    return data;
  };

  const googleLogin = async (payload) => {
    const body = typeof payload === 'string' ? { credential: payload } : payload;
    const { data } = await api.post('/auth/google', body);
    persistSession(data);
    return data;
  };

  const sendLoginOtp = async (email) => {
    const { data } = await api.post('/auth/send-otp', { email });
    return data;
  };

  const verifyLoginOtp = async (email, otp) => {
    const { data } = await api.post('/auth/verify-otp', { email, otp });
    persistSession(data);
    return data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const isAdmin = user?.role === 'admin';
  const isOfficer = user?.role === 'officer';
  const isUser = user?.role === 'user';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdmin,
        isOfficer,
        isUser,
        login,
        updateExpiredPassword,
        register,
        googleLogin,
        sendLoginOtp,
        verifyLoginOtp,
        logout,
        loadUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
