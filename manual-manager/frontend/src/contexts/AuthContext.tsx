'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginForm, RegisterForm } from '@/types';
import { apiClient } from '@/services/api';
import socketService from '@/services/socketService';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginForm) => Promise<void>;
  register: (userData: Omit<RegisterForm, 'confirmPassword'>) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          // Verify token is still valid
          await refreshUser();
        } catch (error) {
          console.error('Error parsing saved user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Update socket auth when user changes
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      if (token) {
        socketService.updateAuthToken(token);
      }
    } else {
      socketService.clearAuthToken();
    }
  }, [user]);

  const login = async (credentials: LoginForm): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await apiClient.post<{
        user: User;
        token: string;
        refreshToken: string;
      }>('/auth/login', credentials);

      if (response.success && response.data) {
        const { user: userData, token, refreshToken } = response.data;
        
        // Save to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        toast.success(`Bem-vindo, ${userData.name}!`);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Omit<RegisterForm, 'confirmPassword'>): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await apiClient.post<{
        user: User;
        token: string;
        refreshToken: string;
      }>('/auth/register', userData);

      if (response.success && response.data) {
        const { user: newUser, token, refreshToken } = response.data;
        
        // Save to localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        
        setUser(newUser);
        toast.success(`Conta criada com sucesso! Bem-vindo, ${newUser.name}!`);
      }
    } catch (error: any) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    try {
      // Call logout endpoint to invalidate token on server
      apiClient.post('/auth/logout').catch(console.error);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      setUser(null);
      socketService.clearAuthToken();
      toast.success('Logout realizado com sucesso!');
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      const response = await apiClient.put<User>('/auth/profile', userData);
      
      if (response.success && response.data) {
        const updatedUser = response.data;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('Perfil atualizado com sucesso!');
      }
    } catch (error: any) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await apiClient.get<User>('/auth/me');
      
      if (response.success && response.data) {
        const userData = response.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error: any) {
      console.error('Refresh user error:', error);
      // If refresh fails, user might be logged out
      if (error.response?.status === 401) {
        logout();
      }
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;