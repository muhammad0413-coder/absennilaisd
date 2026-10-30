import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { loginUser, logoutUser, requestPasswordReset, fetchUserProfile } from '../services/firebase/authService';
import { auth, isFirebaseConfigured } from '../services/firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfileState: (updated: Partial<UserProfile>) => void;
  canAccessClass: (classId: string) => boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isPrincipal: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem('auth_current_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser && fbUser.email) {
          const profile = await fetchUserProfile(fbUser.uid, fbUser.email);
          setUser(profile);
          if (profile) {
            localStorage.setItem('auth_current_user', JSON.stringify(profile));
          }
        } else {
          // If no fbUser, keep local cached or clear
          const cached = localStorage.getItem('auth_current_user');
          if (!cached) setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local demo mode
      const cached = localStorage.getItem('auth_current_user');
      if (cached) {
        setUser(JSON.parse(cached));
      }
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<UserProfile> => {
    setLoading(true);
    try {
      const loggedUser = await loginUser(email, pass);
      setUser(loggedUser);
      localStorage.setItem('auth_current_user', JSON.stringify(loggedUser));
      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    localStorage.removeItem('auth_current_user');
  };

  const resetPassword = async (email: string) => {
    await requestPasswordReset(email);
  };

  const updateProfileState = (updated: Partial<UserProfile>) => {
    if (!user) return;
    const newUser = { ...user, ...updated };
    setUser(newUser);
    localStorage.setItem('auth_current_user', JSON.stringify(newUser));
  };

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'guru';
  const isPrincipal = user?.role === 'kepsek';

  const canAccessClass = (classId: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'kepsek') return true;
    if (user.role === 'guru') {
      return user.assignedClasses.includes(String(classId).trim());
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        resetPassword,
        updateProfileState,
        canAccessClass,
        isAdmin,
        isTeacher,
        isPrincipal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
