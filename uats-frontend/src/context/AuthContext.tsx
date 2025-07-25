import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useCitizens, Citizen } from './CitizenContext';
import axios from 'axios';

interface User {
  name: string; 
  username: string;
  role: 'citizen' | 'leader' | 'official' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (user: Omit<User, 'role'> & { password: string; role: User['role'] }) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

//  Acocunts  for Admin
const users = [
  { username: 'evodenuby', password: 'evode@123', name: 'SystemAdmin EVODE', role: 'admin' as const },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const { citizens } = useCitizens();

  const login = async (username: string, password: string) => {
    // Only allow users for admin
    const found = users.find(u => u.username === username && u.password === password);
    if (found) {
      const userObj: User = { name: found.name, username: found.username, role: found.role };
      setUser(userObj);
      localStorage.setItem('user', JSON.stringify(userObj));
      return true;
    }
    // Citizens must log in with National ID and password from the backend
    try {
      const res = await axios.post('https://uats-backend.onrender.com/api/citizens/login', { username, password });
      const citizen: any = res.data;
      if (citizen?.nationalId === username && citizen?.password === password) {
        const userObj: User = { name: citizen?.fullName, username: citizen?.nationalId, role: 'citizen' };
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
        return true;
      }
    } catch (error) {
      // login failed
    }
    return false;
  };

  // Remove signup logic for citizens, as registration is handled in Signup page via CitizenContext
  const signup = async (_data: any) => {
    // No-op for citizens, handled in Signup page
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
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