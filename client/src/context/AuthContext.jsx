import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.auth.getMe()
        .then(res => setUser(res.user))
        .catch(() => {
          setAuthToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email_or_username, password) => {
    const res = await api.auth.login({ email_or_username, password });
    setAuthToken(res.token);
    setUser(res.user);
    return res;
  };

  const register = async (username, email, password, role = 'user') => {
    return await api.auth.register({ username, email, password, role });
  };

  const verifyEmail = async (email, token) => {
    return await api.auth.verifyEmail({ email, token });
  };

  const forgotPassword = async (email) => {
    return await api.auth.forgotPassword({ email });
  };

  const resetPassword = async (email, token, new_password) => {
    return await api.auth.resetPassword({ email, token, new_password });
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      login,
      register,
      verifyEmail,
      forgotPassword,
      resetPassword,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
