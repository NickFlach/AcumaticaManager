import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// Password strength calculation
const calculatePasswordStrength = (password: string): { score: number; feedback: string[] } => {
  let score = 0;
  const feedback: string[] = [];

  if (password.length === 0) {
    return { score: 0, feedback: ['Password is required'] };
  }

  if (password.length >= 8) {
    score += 20;
  } else {
    feedback.push('Use at least 8 characters');
  }

  if (/[a-z]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Add lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Add uppercase letters');
  }

  if (/\d/.test(password)) {
    score += 20;
  } else {
    feedback.push('Add numbers');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Add special characters (!@#$%^&*)');
  }

  return { score: Math.min(score, 100), feedback };
};

export interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
  showFeedback?: boolean;
}

export const PasswordStrengthIndicator = ({ 
  password, 
  className,
  showFeedback = true 
}: PasswordStrengthIndicatorProps) => {
  const { score, feedback } = useMemo(() => calculatePasswordStrength(password), [password]);

  const getStrengthLabel = (score: number) => {
    if (score === 0) return 'Enter password';
    if (score < 40) return 'Weak';
    if (score < 60) return 'Fair';
    if (score < 80) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = (score: number) => {
    if (score === 0) return 'bg-gray-200';
    if (score < 40) return 'bg-destructive';
    if (score < 60) return 'bg-warning';
    if (score < 80) return 'bg-yellow-500';
    return 'bg-secondary';
  };

  if (!password) return null;

  return (
    <div className={cn('space-y-2 mt-2', className)} data-testid="password-strength-indicator">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Password strength:</span>
        <span className="text-xs font-medium" data-testid="password-strength-label">
          {getStrengthLabel(score)}
        </span>
      </div>
      <Progress 
        value={score} 
        className={cn('h-1.5', getStrengthColor(score))}
        data-testid="password-strength-bar"
      />
      {showFeedback && feedback.length > 0 && (
        <div className="space-y-1" data-testid="password-feedback">
          {feedback.map((item, index) => (
            <div key={index} className="flex items-center text-xs text-muted-foreground">
              <X className="h-3 w-3 mr-1 text-destructive" />
              {item}
            </div>
          ))}
        </div>
      )}
      {showFeedback && score === 100 && (
        <div className="flex items-center text-xs text-secondary" data-testid="password-success">
          <Check className="h-3 w-3 mr-1" />
          Great! Your password is strong.
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;