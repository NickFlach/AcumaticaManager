import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'wouter';
import { Mail, ArrowLeft, Zap, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Form validation schema
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Make API call for password reset
      const response = await apiRequest('POST', '/api/auth/forgot-password', {
        email: data.email,
      });

      const result = await response.json();

      setIsSubmitted(true);
      toast({
        title: "Reset Email Sent",
        description: `Password reset instructions have been sent to ${data.email}`,
      });

    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send reset email';
      setError(errorMessage);
      toast({
        title: "Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = () => {
    const email = form.getValues('email');
    if (email) {
      form.handleSubmit(onSubmit)();
    }
  };

  if (isSubmitted) {
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
              Check Your Email
            </CardTitle>
            <CardDescription className="text-gray-600">
              We've sent password reset instructions to:
            </CardDescription>
            <p className="text-sm font-medium text-primary">
              {form.getValues('email')}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                If you don't receive an email within a few minutes, check your spam folder or try again.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                variant="outline"
                className="w-full h-11"
                disabled={isLoading}
                data-testid="button-resend-email"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Resend Email
                  </>
                )}
              </Button>

              <Button
                asChild
                variant="ghost"
                className="w-full h-11"
                data-testid="button-back-to-login"
              >
                <Link href="/auth/login">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Link>
              </Button>
            </div>
          </CardContent>

          <CardFooter className="text-center">
            <p className="text-xs text-gray-500 mx-auto">
              Didn't receive the email? Check your spam folder or contact support if the problem persists.
            </p>
          </CardFooter>
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
            Forgot Password?
          </CardTitle>
          <CardDescription className="text-gray-600">
            No worries! Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                data-testid="button-send-reset-email"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending Reset Email...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Reset Email
                  </>
                )}
              </Button>

              {/* Back to Login */}
              <Button
                asChild
                variant="ghost"
                className="w-full h-11"
                data-testid="button-back-to-login-form"
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
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
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