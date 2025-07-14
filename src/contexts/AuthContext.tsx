import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import * as db from '../services/database';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored email only
    const storedEmail = localStorage.getItem('nosso-templo-email');
    const storedPassword = localStorage.getItem('nosso-templo-password');
    
    if (storedEmail && storedPassword) {
      // Forçar uma nova autenticação para buscar dados atualizados do banco
      console.log('Found stored credentials, authenticating to get fresh data...');
      
      (async () => {
        try {
          await login(storedEmail, storedPassword);
        } catch (error) {
          console.error('Error auto-authenticating:', error);
          localStorage.removeItem('nosso-templo-email');
          localStorage.removeItem('nosso-templo-password');
        } finally {
          setIsLoading(false);
        }
      })();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('AuthContext: Attempting login for:', email);
      
      const authenticatedUser = await db.authenticateUser(email, password);
      
      if (authenticatedUser) {
        console.log('AuthContext: Login successful for:', authenticatedUser.email);
        console.log('AuthContext: User is admin:', authenticatedUser.isAdmin);
        console.log('AuthContext: Student data:', authenticatedUser.student?.fullName);
        
        // Ensure studentId is set for non-admin users
        if (!authenticatedUser.isAdmin && authenticatedUser.student) {
          authenticatedUser.studentId = authenticatedUser.student.id;
        }
        
        setUser(authenticatedUser);
        // Armazenar apenas email e senha para re-autenticação
        localStorage.setItem('nosso-templo-email', email);
        localStorage.setItem('nosso-templo-password', password);
        return true;
      }
      
      console.log('AuthContext: Login failed - no user returned');
      return false;
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      // Re-throw the error so the component can handle it properly
      throw error;
    }
  };

  const logout = () => {
    console.log('AuthContext: Logging out user');
    setUser(null);
    localStorage.removeItem('nosso-templo-email');
    localStorage.removeItem('nosso-templo-password');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};