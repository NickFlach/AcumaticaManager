import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useSearch } from 'wouter';
import { Eye, EyeOff, Lock, Zap, Check, X, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { cn } from '@/lib/utils';


// Form validation schema
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/, 
      'Password must contain lowercase, uppercase, number, and special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;


export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { toast } = useToast();

  // Extract token from URL parameters
  const urlParams = new URLSearchParams(search);
  const token = urlParams.get('token');
  const email = urlParams.get('email');

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const watchPassword = form.watch('password');

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setError('Invalid or missing reset token');
        return;
      }

      try {
        // Validate the token with the backend
        await apiRequest('POST', '/api/auth/validate-reset-token', { token });
      } catch (error: any) {
        setIsValidToken(false);
        setError('Invalid or expired reset token');
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Submit new password with token
      const response = await apiRequest('POST', '/api/auth/reset-password', {
        token,
        newPassword: data.password,
      });

      const result = await response.json();

      setIsSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated successfully. You can now login with your new password.",
      });

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to reset password';
      setError(errorMessage);
      toast({
        title: "Password Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show success page
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10">
                <CheckCircle className="h-8 w-8 text-secondary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Password Reset Complete
            </CardTitle>
            <CardDescription className="text-gray-600">
              Your password has been successfully updated. You can now login with your new password.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              asChild
              className="w-full h-11 text-white font-semibold"
              data-testid="button-login-new-password"
            >
              <Link href="/auth/login">
                Continue to Login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show invalid token error
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              Invalid Reset Link
            </CardTitle>
            <CardDescription className="text-gray-600">
              This password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button
                asChild
                className="w-full h-11 text-white font-semibold"
                data-testid="button-request-new-reset"
              >
                <Link href="/auth/forgot-password">
                  Request New Reset Link
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                className="w-full h-11"
                data-testid="button-back-to-login-invalid"
              >
                <Link href="/auth/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">ElectroProject</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-gray-600">
            {email ? (
              <>Enter a new password for <span className="font-medium">{email}</span></>
            ) : (
              'Choose a strong new password for your account'
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* New Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your new password"
                          className="pl-10 pr-12 py-2 h-11"
                          disabled={isLoading}
                          data-testid="input-new-password"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                          data-testid="button-toggle-new-password"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <PasswordStrengthIndicator password={watchPassword} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Confirm Password Field */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your new password"
                          className="pl-10 pr-12 py-2 h-11"
                          disabled={isLoading}
                          data-testid="input-confirm-new-password"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isLoading}
                          data-testid="button-toggle-confirm-new-password"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 text-white font-semibold"
                disabled={isLoading}
                data-testid="button-reset-password"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Reset Password
                  </>
                )}
              </Button>

              {/* Back to Login */}
              <Button
                asChild
                variant="ghost"
                className="w-full h-11"
                data-testid="button-back-to-login-reset"
              >
                <Link href="/auth/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter>
          <div className="text-center w-full">
            <p className="text-xs text-gray-500">
              Make sure to use a strong password that you haven't used before.
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}