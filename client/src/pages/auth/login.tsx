import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { Eye, EyeOff, Mail, Lock, User, LogIn, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Form validation schema
const loginSchema = z.object({
  emailOrUsername: z
    .string()
    .min(1, 'Email or username is required')
    .refine(
      (value) => {
        // Check if it's an email or username
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) || value.length >= 3;
      },
      {
        message: 'Please enter a valid email address or username (min 3 characters)',
      }
    ),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuth();
  const [, setLocation] = useLocation();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Determine if input is email or username
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmail = emailRegex.test(data.emailOrUsername);

      const credentials = {
        [isEmail ? 'email' : 'username']: data.emailOrUsername,
        password: data.password,
        rememberMe: data.rememberMe,
      };

      await login(credentials);
      
      // Redirect to dashboard on successful login
      setLocation('/');
    } catch (error) {
      // Error handling is managed by AuthContext
      console.error('Login error:', error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

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
            Welcome Back
          </CardTitle>
          <CardDescription className="text-gray-600">
            Sign in to your ElectroProject Pro account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Email/Username Field */}
              <FormField
                control={form.control}
                name="emailOrUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      Email or Username
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type="text"
                          placeholder="Enter your email or username"
                          className="pl-10 pr-4 py-2 h-11"
                          disabled={isLoading}
                          data-testid="input-email-username"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          {field.value && field.value.includes('@') ? (
                            <Mail className="h-4 w-4 text-gray-400" />
                          ) : (
                            <User className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          className="pl-10 pr-12 py-2 h-11"
                          disabled={isLoading}
                          data-testid="input-password"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <Lock className="h-4 w-4 text-gray-400" />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                          onClick={togglePasswordVisibility}
                          disabled={isLoading}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
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

              {/* Remember Me Checkbox */}
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                        data-testid="checkbox-remember-me"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal text-gray-700 cursor-pointer">
                        Remember me for 30 days
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-11 text-white font-semibold"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Forgot Password Link */}
          <div className="text-center">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              data-testid="link-forgot-password"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Login Placeholder */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              type="button"
              disabled
              className="h-11 font-medium"
              data-testid="button-google-login"
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled
              className="h-11 font-medium"
              data-testid="button-microsoft-login"
            >
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 2v20h20V2H2zm9 9H3V3h8v8zm9 0h-8V3h8v8zM3 21v-8h8v8H3zm18 0h-8v-8h8v8z"/>
              </svg>
              Microsoft
            </Button>
          </div>
        </CardContent>

        <CardFooter>
          <div className="text-center w-full">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                href="/auth/register"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
                data-testid="link-register"
              >
                Create one here
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}