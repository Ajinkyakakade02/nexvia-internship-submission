import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { getMe, forceLogout } from '@/store/slices/authSlice';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  role: UserRole | null;
  isCustomer: boolean;
  isVendor: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      dispatch(getMe());
    }

    const handleLogout = () => {
      dispatch(forceLogout());
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [dispatch, user]);

  const role = user?.role || null;
  const isCustomer = role === UserRole.CUSTOMER;
  const isVendor = role === UserRole.VENDOR;
  const isAdmin = role === UserRole.ADMIN;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        role,
        isCustomer,
        isVendor,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
