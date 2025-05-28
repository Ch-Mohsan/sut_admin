import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getCSRFToken = () => {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  const makeAuthenticatedRequest = async (url, options = {}) => {
    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCSRFToken(),
      },
    };

    return fetch(url, { ...defaultOptions, ...options });
  };

  const checkAuthStatus = async () => {
    try {
      const response = await makeAuthenticatedRequest('http://localhost:8000/api/check-auth/');
      
      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUser(data.user);
        setError(null);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
      setError('Failed to check authentication status');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      // First, get CSRF token
      const csrfResponse = await makeAuthenticatedRequest('http://localhost:8000/api/csrf-token/');
      
      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token');
      }

      const response = await makeAuthenticatedRequest('http://localhost:8000/api/login/', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        setUser(data.user);
        setError(null);
        return true;
      }
      
      const errorData = await response.json();
      setError(errorData.error || 'Invalid credentials');
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      setError('Failed to login');
      return false;
    }
  };

  const logout = async () => {
    try {
      await makeAuthenticatedRequest('http://localhost:8000/api/logout/', {
        method: 'POST',
      });
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setError('Failed to logout');
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        error,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 