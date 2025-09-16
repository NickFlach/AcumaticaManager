import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, authAwareApiRequest, setTokenRefreshHandler, setAccessTokenGetter, TokenRefreshResponse } from '@/lib/queryClient';
import { PublicUser } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

// =============================================
// TYPES AND INTERFACES
// =============================================

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

// Backend response types matching actual API contracts
export interface LoginResponse {
  message: string;
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  sessionCreated?: boolean;
}

export interface RegisterResponse {
  message: string;
  user: PublicUser;
  emailSent: boolean;
}

export interface MeResponse {
  user: PublicUser;
  authMethod: string;
}

export interface LogoutResponse {
  message: string;
  sessionRevoked: boolean;
}

export interface AuthContextType {
  // State
  user: PublicUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  
  // Authentication methods
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  
  // User management
  changePassword: (data: PasswordChangeData) => Promise<void>;
  
  // Utility methods
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
}

// =============================================
// CONTEXT CREATION
// =============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================
// CUSTOM HOOK
// =============================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// =============================================
// AUTH PROVIDER COMPONENT
// =============================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // State management with localStorage persistence
  const [user, setUser] = useState<PublicUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  });
  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Token persistence helpers
  const persistAccessToken = useCallback((token: string | null) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token);
      } else {
        localStorage.removeItem('accessToken');
      }
    }
    setAccessToken(token);
  }, []);

  const persistRefreshToken = useCallback((token: string | null) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('refreshToken', token);
      } else {
        localStorage.removeItem('refreshToken');
      }
    }
    setRefreshToken(token);
  }, []);

  // Computed state
  const isAuthenticated = !!user;

  // =============================================
  // API QUERIES AND MUTATIONS
  // =============================================

  // Query to get current user (used for initialization and auth validation)
  const { refetch: refetchUser } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: false, // We'll manually trigger this
    retry: false,
    staleTime: Infinity,
    queryFn: () => {
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      return fetch('/api/auth/me', {
        headers,
        credentials: 'include',
      }).then(async (res) => {
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        return res.json();
      });
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
      const response = await authAwareApiRequest('POST', '/api/auth/login', credentials);
      return response.json();
    },
    onSuccess: (data: LoginResponse) => {
      setUser(data.user);
      persistAccessToken(data.accessToken);
      persistRefreshToken(data.refreshToken);
      setError(null);
      // Invalidate specific auth queries
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.firstName}!`,
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData): Promise<RegisterResponse> => {
      const response = await authAwareApiRequest('POST', '/api/auth/register', userData);
      return response.json();
    },
    onSuccess: (data: RegisterResponse) => {
      setError(null);
      toast({
        title: "Registration Successful",
        description: data.emailSent 
          ? "Please check your email to verify your account."
          : "Account created successfully. You can now log in.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Registration failed';
      setError(errorMessage);
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async (): Promise<LogoutResponse> => {
      const response = await authAwareApiRequest('POST', '/api/auth/logout', undefined, accessToken);
      return response.json();
    },
    onSuccess: (data: LogoutResponse) => {
      setUser(null);
      persistAccessToken(null);
      persistRefreshToken(null);
      setError(null);
      // Clear all cached data
      queryClient.clear();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: any) => {
      // Even if logout fails on server, clear local data
      setUser(null);
      persistAccessToken(null);
      persistRefreshToken(null);
      queryClient.clear();
      console.error('Logout error:', error);
      // Still show success message since local state is cleared
      toast({
        title: "Logged Out",
        description: "You have been logged out.",
      });
    },
  });

  // Token refresh mutation
  const refreshTokenMutation = useMutation({
    mutationFn: async (): Promise<TokenRefreshResponse> => {
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      const response = await apiRequest('POST', '/api/auth/refresh', { refreshToken });
      return response.json();
    },
    onSuccess: (data: TokenRefreshResponse) => {
      persistAccessToken(data.accessToken);
      setUser(data.user);
      setError(null);
    },
    onError: (error: any) => {
      console.error('Token refresh failed:', error);
      // Clear tokens and user on refresh failure
      persistAccessToken(null);
      persistRefreshToken(null);
      setUser(null);
      queryClient.clear();
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordChangeData) => {
      const response = await authAwareApiRequest('POST', '/api/auth/change-password', data, accessToken);
      return response.json();
    },
    onSuccess: () => {
      setError(null);
      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Failed to change password';
      setError(errorMessage);
      toast({
        title: "Password Change Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // =============================================
  // TOKEN REFRESH HANDLER
  // =============================================

  // Create the token refresh handler function
  const handleTokenRefresh = useCallback(async (): Promise<string | null> => {
    try {
      if (!refreshToken) {
        return null;
      }
      const data = await refreshTokenMutation.mutateAsync();
      return data.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }, [refreshToken, refreshTokenMutation]);

  // Create access token getter
  const getAccessToken = useCallback(() => {
    return accessToken;
  }, [accessToken]);

  // Set up the token refresh handler and access token getter
  useEffect(() => {
    setTokenRefreshHandler(handleTokenRefresh);
    setAccessTokenGetter(getAccessToken);
    return () => {
      setTokenRefreshHandler(null);
      setAccessTokenGetter(null);
    };
  }, [handleTokenRefresh, getAccessToken]);

  // =============================================
  // AUTHENTICATION METHODS
  // =============================================

  const handleLogin = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await loginMutation.mutateAsync(credentials);
    } finally {
      setIsLoading(false);
    }
  }, [loginMutation]);

  const handleLogout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      // Logout locally even if server request fails
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      queryClient.clear();
    } finally {
      setIsLoading(false);
    }
  }, [logoutMutation, queryClient]);

  const handleRegister = useCallback(async (userData: RegisterData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await registerMutation.mutateAsync(userData);
    } finally {
      setIsLoading(false);
    }
  }, [registerMutation]);

  const handleChangePassword = useCallback(async (data: PasswordChangeData): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await changePasswordMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  }, [changePasswordMutation]);

  // =============================================
  // UTILITY METHODS
  // =============================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const checkAuthStatus = useCallback(async (): Promise<void> => {
    try {
      // Try JWT authentication first if we have stored tokens
      if (accessToken) {
        const result = await refetchUser();
        const responseData = result.data as MeResponse;
        
        if (responseData?.user) {
          setUser(responseData.user);
          setError(null);
          return;
        }
      }
      
      // Try session cookie authentication as fallback
      const result = await refetchUser();
      const responseData = result.data as MeResponse;
      
      if (responseData?.user) {
        setUser(responseData.user);
        setError(null);
      } else {
        // No valid authentication found
        setUser(null);
        // Clear stored tokens if authentication fails
        persistAccessToken(null);
        persistRefreshToken(null);
      }
    } catch (error) {
      // Authentication failed, user is not logged in
      setUser(null);
      // Clear stored tokens if authentication fails
      persistAccessToken(null);
      persistRefreshToken(null);
      console.log('No valid authentication found');
    } finally {
      setIsInitializing(false);
    }
  }, [refetchUser, accessToken, persistAccessToken, persistRefreshToken]);

  // =============================================
  // INITIALIZATION
  // =============================================

  // Initialize auth state on mount by checking current session
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // =============================================
  // CONTEXT VALUE
  // =============================================

  const contextValue: AuthContextType = {
    // State
    user,
    isAuthenticated,
    isLoading,
    isInitializing,
    error,
    
    // Authentication methods
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
    
    // User management
    changePassword: handleChangePassword,
    
    // Utility methods
    clearError,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// =============================================
// UTILITY HOOKS
// =============================================

/**
 * Hook to require authentication - redirects to login if not authenticated
 */
export const useRequireAuth = () => {
  const { isAuthenticated, isInitializing } = useAuth();
  
  if (!isInitializing && !isAuthenticated) {
    // In a real app, you might redirect to login page here
    console.warn('Authentication required but user is not authenticated');
  }
  
  return { isAuthenticated, isInitializing };
};

/**
 * Hook to get auth status without throwing error if used outside provider
 */
export const useOptionalAuth = () => {
  try {
    return useAuth();
  } catch {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitializing: false,
      error: null,
      login: async () => {},
      logout: async () => {},
      register: async () => {},
      changePassword: async () => {},
      clearError: () => {},
      checkAuthStatus: async () => {},
    };
  }
};

export default AuthProvider;