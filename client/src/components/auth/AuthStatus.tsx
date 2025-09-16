import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, LogOut, LogIn } from 'lucide-react';

export const AuthStatus = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    isInitializing, 
    error, 
    login, 
    logout, 
    clearError 
  } = useAuth();

  const handleQuickLogin = async () => {
    try {
      await login({
        username: 'testuser',
        password: 'SecureP@ssw0rd9!',
        rememberMe: true
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isInitializing) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span>Initializing authentication...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md" data-testid="auth-status-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Authentication Status
        </CardTitle>
        <CardDescription>
          Current authentication state and user information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Authentication Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge 
            variant={isAuthenticated ? "default" : "secondary"}
            data-testid="auth-status-badge"
          >
            {isAuthenticated ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium">Error:</p>
            <p className="text-sm text-destructive">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearError} 
              className="mt-2"
              data-testid="button-clear-error"
            >
              Clear Error
            </Button>
          </div>
        )}

        {/* User Information */}
        {isAuthenticated && user ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">User Information:</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div data-testid="text-user-name">
                <strong>Name:</strong> {user.firstName} {user.lastName}
              </div>
              <div data-testid="text-user-email">
                <strong>Email:</strong> {user.email}
              </div>
              <div data-testid="text-user-role">
                <strong>Role:</strong> {user.role}
              </div>
              <div data-testid="text-user-username">
                <strong>Username:</strong> {user.username}
              </div>
              <div>
                <strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Active:</strong> {user.isActive ? 'Yes' : 'No'}
              </div>
              {user.lastLoginAt && (
                <div>
                  <strong>Last Login:</strong> {new Date(user.lastLoginAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No user information available
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          {isAuthenticated ? (
            <Button 
              onClick={handleLogout} 
              disabled={isLoading}
              className="flex items-center gap-2"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          ) : (
            <Button 
              onClick={handleQuickLogin} 
              disabled={isLoading}
              className="flex items-center gap-2"
              data-testid="button-quick-login"
            >
              <LogIn className="h-4 w-4" />
              Quick Login (testuser)
            </Button>
          )}
        </div>

        {/* Debug Information */}
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Debug Information
          </summary>
          <div className="mt-2 p-2 bg-muted rounded text-muted-foreground">
            <pre>{JSON.stringify({ 
              isAuthenticated, 
              isLoading, 
              isInitializing, 
              hasUser: !!user,
              hasError: !!error 
            }, null, 2)}</pre>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};

export default AuthStatus;