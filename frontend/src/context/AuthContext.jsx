/**
 * CRIMENEXUS AI — Authentication Context
 * Provides role, user data, and permission checks to the entire component tree.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { hasPermission, getLandingPage, getRoleMetadata, ROLES } from '../config/rbacConfig';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('crime_auth_token');
    const role = localStorage.getItem('crime_user_role');
    const name = localStorage.getItem('crime_user_name');

    if (token && role) {
      setUser({
        access_token: token,
        role: role,
        full_name: name || 'Officer',
        username: role,
      });
      setIsAuthenticated(true);
    }
  }, []);

  const login = useCallback((userData) => {
    // Normalize the role string
    let role = (userData.role || 'investigator').toLowerCase().trim();
    if (role === 'administrator' || role === 'chief administrator') role = ROLES.ADMIN;
    if (role === 'intelligence analyst') role = ROLES.ANALYST;
    if (role === 'senior io' || role === 'senior io rajesh varma') role = ROLES.INVESTIGATOR;

    const normalizedUser = { ...userData, role };

    localStorage.setItem('crime_auth_token', normalizedUser.access_token || 'mock_token');
    localStorage.setItem('crime_user_role', normalizedUser.role);
    localStorage.setItem('crime_user_name', normalizedUser.full_name || normalizedUser.username || 'Officer');

    setUser(normalizedUser);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('crime_auth_token');
    localStorage.removeItem('crime_user_role');
    localStorage.removeItem('crime_user_name');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const checkPermission = useCallback((pageId) => {
    if (!user?.role) return false;
    return hasPermission(user.role, pageId);
  }, [user]);

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated,
    login,
    logout,
    checkPermission,
    landingPage: user?.role ? getLandingPage(user.role) : 'inv_overview',
    metadata: user?.role ? getRoleMetadata(user.role) : {},
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
