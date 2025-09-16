import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  UserPlus, 
  Zap, 
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { cn } from '@/lib/utils';


// Form validation schema
const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/, 
      'Password must contain lowercase, uppercase, number, and special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  acceptTerms: z
    .boolean()
    .refine((value) => value === true, 'You must accept the Terms of Service'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;


export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isLoading, error } = useAuth();
  const [, setLocation] = useLocation();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const watchPassword = form.watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register({
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
      });
      
      // Registration success message is handled by AuthContext
      // Redirect to login page
      setLocation('/auth/login');
    } catch (error) {
      // Error handling is managed by AuthContext
      console.error('Registration error:', error);
    }
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
            Create Account
          </CardTitle>
          <CardDescription className="text-gray-600">
            Join ElectroProject Pro to manage your electrical projects
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name Fields Row */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">First Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="John"
                          className="h-11"
                          disabled={isLoading}
                          data-testid="input-first-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Last Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Doe"
                          className="h-11"
                          disabled={isLoading}
                          data-testid="input-last-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Username Field */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type="text"
                          placeholder="Enter a unique username"
                          className="pl-10 pr-4 py-2 h-11"
                          disabled={isLoading}
                          data-testid="input-username"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email address"
                          className="pl-10 pr-4 py-2 h-11"
                          disabled={isLoading}
                          data-testid="input-email"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <Mail className="h-4 w-4 text-gray-400" />
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
                          placeholder="Create a strong password"
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
                          onClick={() => setShowPassword(!showPassword)}
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
                    <FormLabel className="text-gray-700">Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          className="pl-10 pr-12 py-2 h-11"
                          disabled={isLoading}
                          data-testid="input-confirm-password"
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
                          data-testid="button-toggle-confirm-password"
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

              {/* Terms of Service */}
              <FormField
                control={form.control}
                name="acceptTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                        data-testid="checkbox-accept-terms"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-normal text-gray-700 cursor-pointer">
                        I agree to the{' '}
                        <Link 
                          href="/terms" 
                          className="text-primary hover:text-primary/80 underline"
                          data-testid="link-terms"
                        >
                          Terms of Service
                        </Link>
                        {' '}and{' '}
                        <Link 
                          href="/privacy" 
                          className="text-primary hover:text-primary/80 underline"
                          data-testid="link-privacy"
                        >
                          Privacy Policy
                        </Link>
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-start">
                  <AlertCircle className="h-4 w-4 text-destructive mr-2 mt-0.5" />
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              {/* Register Button */}
              <Button
                type="submit"
                className="w-full h-11 text-white font-semibold"
                disabled={isLoading}
                data-testid="button-register"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter>
          <div className="text-center w-full">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
                data-testid="link-login"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}