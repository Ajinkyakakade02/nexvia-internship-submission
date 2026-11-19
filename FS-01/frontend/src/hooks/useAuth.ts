import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { loginUser, registerUser, logoutUser, clearError, updateUserState } from '@/store/slices/authSlice';
import { LoginFormData, RegisterFormData, User, UserRole } from '@/types';
import { useCallback } from 'react';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth);

  const login = useCallback(
    (credentials: LoginFormData) => dispatch(loginUser(credentials)),
    [dispatch]
  );

  const register = useCallback(
    (formData: RegisterFormData) => dispatch(registerUser(formData)),
    [dispatch]
  );

  const logout = useCallback(() => dispatch(logoutUser()), [dispatch]);

  const clearAuthError = useCallback(() => dispatch(clearError()), [dispatch]);

  const updateUser = useCallback(
    (updatedUser: User) => dispatch(updateUserState(updatedUser)),
    [dispatch]
  );

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    role: user?.role as UserRole | undefined,
    isCustomer: user?.role === UserRole.CUSTOMER,
    isVendor: user?.role === UserRole.VENDOR,
    isAdmin: user?.role === UserRole.ADMIN,
    login,
    register,
    logout,
    clearAuthError,
    updateUser,
  };
};
