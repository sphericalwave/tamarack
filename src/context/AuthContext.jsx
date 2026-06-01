import { createContext, useContext, useState } from 'react';
import { getItem, setItem } from '../hooks/useStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userId, setUserId] = useState(() => localStorage.getItem('tm_current_user'));

  const currentUser = userId
    ? (getItem('tm_users') || []).find(u => u.id === userId) || null
    : null;

  function login(email, password) {
    const users = getItem('tm_users') || [];
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return false;
    localStorage.setItem('tm_current_user', user.id);
    setUserId(user.id);
    return user;
  }

  function logout() {
    localStorage.removeItem('tm_current_user');
    setUserId(null);
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
