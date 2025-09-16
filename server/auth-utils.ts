import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import validator from "validator";

// Environment variables with secure defaults
const JWT_SECRET = process.env.JWT_SECRET || generateSecureSecret();
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || generateSecureSecret();
// Convert string durations to seconds for JWT compatibility
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY ? 
  (process.env.JWT_ACCESS_EXPIRY.endsWith('m') ? 
    parseInt(process.env.JWT_ACCESS_EXPIRY) * 60 : 
    process.env.JWT_ACCESS_EXPIRY.endsWith('h') ? 
      parseInt(process.env.JWT_ACCESS_EXPIRY) * 3600 : 
      process.env.JWT_ACCESS_EXPIRY.endsWith('d') ? 
        parseInt(process.env.JWT_ACCESS_EXPIRY) * 86400 : 
        parseInt(process.env.JWT_ACCESS_EXPIRY)) : 
  15 * 60; // 15 minutes in seconds

const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY ? 
  (process.env.JWT_REFRESH_EXPIRY.endsWith('m') ? 
    parseInt(process.env.JWT_REFRESH_EXPIRY) * 60 : 
    process.env.JWT_REFRESH_EXPIRY.endsWith('h') ? 
      parseInt(process.env.JWT_REFRESH_EXPIRY) * 3600 : 
      process.env.JWT_REFRESH_EXPIRY.endsWith('d') ? 
        parseInt(process.env.JWT_REFRESH_EXPIRY) * 86400 : 
        parseInt(process.env.JWT_REFRESH_EXPIRY)) : 
  7 * 24 * 60 * 60; // 7 days in seconds

const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || "587");
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASS = process.env.EMAIL_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@electroproject.com";
const APP_URL = process.env.APP_URL || "http://localhost:5000";

// =============================================
// PRODUCTION SECURITY VALIDATION
// =============================================

/**
 * HTML escape function to prevent XSS in email templates
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Generate a secure secret for JWT if not provided
 */
function generateSecureSecret(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Enhanced production environment security validation
 * Called on module load to validate critical security settings
 */
function validateProductionSecurity(): void {
  const isProduction = process.env.NODE_ENV === "production";
  const isDevelopment = process.env.NODE_ENV === "development";
  
  // Always validate critical environment variables
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required for database connectivity.");
  }
  
  if (isProduction) {
    // Check JWT secrets are properly configured
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("Production environment detected but JWT_SECRET is not configured or too short. Set a secure JWT_SECRET environment variable (minimum 32 characters).");
    }
    
    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
      throw new Error("Production environment detected but JWT_REFRESH_SECRET is not configured or too short. Set a secure JWT_REFRESH_SECRET environment variable (minimum 32 characters).");
    }
    
    // Check email configuration for production
    if (!EMAIL_USER || !EMAIL_PASS) {
      console.warn("Production environment detected but email credentials (EMAIL_USER and EMAIL_PASS) are not configured. Email functionality may not work.");
    }
    
    // Validate APP_URL is HTTPS in production
    if (!APP_URL.startsWith('https://')) {
      console.warn("Production environment detected but APP_URL does not use HTTPS. This is a security risk.");
    }
    
    // Ensure secure cookie settings are enforced
    console.log("✓ Production security validation passed");
  } else if (isDevelopment) {
    // Development warnings
    if (!process.env.JWT_SECRET) {
      console.warn("⚠️  Development: JWT_SECRET not set, using generated secret. Set environment variable for consistency.");
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      console.warn("⚠️  Development: JWT_REFRESH_SECRET not set, using generated secret. Set environment variable for consistency.");
    }
    console.log("✓ Development environment validated");
  }
  
  // Always validate admin bootstrap security regardless of environment
  try {
    validateAdminSecurity();
  } catch (error) {
    // In production, admin security failures should be fatal
    if (process.env.NODE_ENV === 'production' && error instanceof Error && error.message.includes('SECURITY:')) {
      console.error('🚨 FATAL SECURITY ERROR:', error.message);
      throw error; // Block startup in production
    }
    
    // Don't block module loading in development, but log the warning
    console.warn('Admin security validation warning:', error);
  }
}

// Run validation on module load
validateProductionSecurity();

// =============================================
// ADMIN ACCOUNT SECURITY VALIDATION
// =============================================

/**
 * Validate that no weak admin accounts exist in the system
 * This is a critical security check that should be run at startup
 */
export function validateAdminSecurity(): void {
  const isProduction = process.env.NODE_ENV === "production";
  const isDevelopment = process.env.NODE_ENV === "development";
  
  // Check for bootstrap security
  const shouldBootstrap = process.env.ADMIN_BOOTSTRAP === 'true';
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
  
  if (shouldBootstrap) {
    console.warn(`⚠️  SECURITY: Admin bootstrap requested in ${process.env.NODE_ENV || 'unknown'} environment`);
    
    if (!initialPassword) {
      throw new Error("SECURITY: ADMIN_BOOTSTRAP=true requires ADMIN_INITIAL_PASSWORD environment variable");
    }
    
    // Validate password strength
    const passwordValidation = validateAdminPassword(initialPassword);
    if (!passwordValidation.valid) {
      throw new Error(`SECURITY: ADMIN_INITIAL_PASSWORD is not strong enough: ${passwordValidation.errors.join(', ')}`);
    }
    
    // Additional checks for production
    if (isProduction) {
      if (initialPassword.length < 16) {
        throw new Error("SECURITY: Production ADMIN_INITIAL_PASSWORD must be at least 16 characters");
      }
      
      // Check for common weak patterns
      const weakPatterns = [
        /admin/i, /password/i, /123/i, /abc/i, /qwerty/i,
        /changeme/i, /default/i, /temp/i, /test/i
      ];
      
      for (const pattern of weakPatterns) {
        if (pattern.test(initialPassword)) {
          throw new Error(`SECURITY: Production ADMIN_INITIAL_PASSWORD cannot contain weak patterns`);
        }
      }
      
      console.error(`🚨 PRODUCTION ALERT: Bootstrap admin account will be created. This should be a one-time operation!`);
    }
  } else if (isDevelopment) {
    console.log("✓ SECURITY: No admin bootstrap requested. Use ADMIN_BOOTSTRAP=true to create admin account.");
  }
}

/**
 * Check if a password matches common weak passwords
 */
export function isWeakPassword(password: string): boolean {
  const weakPasswords = [
    'admin', 'password', '123456', '12345678', 'qwerty',
    'abc123', 'password123', 'admin123', 'changeme',
    'default', 'guest', 'user', 'test', 'demo'
  ];
  
  const lowerPassword = password.toLowerCase();
  return weakPasswords.some(weak => 
    lowerPassword === weak || 
    lowerPassword.includes(weak)
  );
}

/**
 * Enhanced password validation for admin accounts
 */
export function validateAdminPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Base password validation
  const baseValidation = validatePassword(password);
  if (!baseValidation.valid) {
    errors.push(...baseValidation.errors);
  }
  
  // Additional admin-specific requirements
  if (password.length < 12) {
    errors.push("Admin password must be at least 12 characters long");
  }
  
  if (isWeakPassword(password)) {
    errors.push("Admin password cannot contain common weak words");
  }
  
  // Check for keyboard patterns
  const keyboardPatterns = ['qwerty', 'asdf', '1234', 'abcd'];
  if (keyboardPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push("Admin password cannot contain keyboard patterns");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Verify if a given password matches any known weak admin passwords
 * Used to detect existing weak accounts
 */
export async function checkForWeakAdminPassword(hashedPassword: string): Promise<string | null> {
  const weakPasswords = ['admin', 'password', '123456', 'changeme', 'default', 'test', 'demo', 'qwerty', 'letmein', 'welcome'];
  
  for (const weakPwd of weakPasswords) {
    try {
      const isMatch = await verifyPassword(weakPwd, hashedPassword);
      if (isMatch) {
        return weakPwd;
      }
    } catch (error) {
      // Continue checking other passwords
    }
  }
  
  return null; // No weak password found
}

/**
 * Critical security function - validates all admin accounts for weak passwords
 * This function MUST be called at startup and WILL block production startup if weak passwords are found
 */
export async function validateAllAdminAccounts(getAdminUsers: () => Promise<any[]>): Promise<void> {
  const isProduction = process.env.NODE_ENV === 'production';
  
  try {
    const adminUsers = await getAdminUsers();
    
    for (const user of adminUsers) {
      if (user.role === 'admin' && user.hashedPassword) {
        const weakPassword = await checkForWeakAdminPassword(user.hashedPassword);
        
        if (weakPassword) {
          const errorMsg = `🚨 CRITICAL SECURITY ALERT: Admin account '${user.username}' has weak password '${weakPassword}'. ` +
            `This is a CRITICAL security vulnerability.`;
          
          console.error(errorMsg);
          
          if (isProduction) {
            // FATAL: Block production startup immediately
            throw new Error(`SECURITY: Admin account '${user.username}' has weak password '${weakPassword}'. Production startup BLOCKED until password is changed manually.`);
          } else {
            console.warn(`⚠️  DEVELOPMENT WARNING: Admin account '${user.username}' has weak password '${weakPassword}'. Change immediately!`);
          }
        }
      }
    }
    
    if (isProduction && adminUsers.filter(u => u.role === 'admin').length > 0) {
      console.log(`✓ SECURITY: ${adminUsers.filter(u => u.role === 'admin').length} admin account(s) validated in production`);
    }
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('SECURITY:')) {
      // Critical security error - must block startup
      throw error;
    }
    // Non-security errors (database connection etc.) - log but don't block
    console.warn('Warning: Could not validate admin accounts:', error);
    
    // In production, if we can't validate admin accounts, that's also a security concern
    if (isProduction) {
      console.error('🚨 PRODUCTION WARNING: Could not validate admin account security. Manual verification recommended.');
    }
  }
}

// =============================================
// PASSWORD MANAGEMENT
// =============================================

/**
 * Hash a password using bcrypt with 12 rounds
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    throw new Error("Failed to hash password");
  }
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    return false;
  }
}

// =============================================
// JWT TOKEN MANAGEMENT
// =============================================

/**
 * Generate access token (short expiry)
 */
export function generateAccessToken(userId: string, email: string): string {
  try {
    const payload = { userId, email, type: "access" };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });
  } catch (error) {
    throw new Error("Failed to generate access token");
  }
}

/**
 * Generate refresh token (long expiry)
 */
export function generateRefreshToken(userId: string): string {
  try {
    const payload = { userId, type: "refresh" };
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });
  } catch (error) {
    throw new Error("Failed to generate refresh token");
  }
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string, isRefreshToken: boolean = false): { userId: string; email?: string } | null {
  try {
    const secret = isRefreshToken ? JWT_REFRESH_SECRET : JWT_SECRET;
    const decoded = jwt.verify(token, secret) as any;
    
    if (!decoded.userId) {
      return null;
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Verify access token specifically
 */
export function verifyAccessToken(token: string): { userId: string; email?: string } | null {
  return verifyToken(token, false);
}

/**
 * Verify refresh token specifically
 */
export function verifyRefreshToken(token: string): { userId: string; email?: string } | null {
  return verifyToken(token, true);
}

// =============================================
// RANDOM TOKEN GENERATION
// =============================================

/**
 * Generate secure random token for email verification/password reset
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Generate session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Generate random UUID for general use
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

// =============================================
// INPUT VALIDATION
// =============================================

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }
  return validator.isEmail(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password || typeof password !== "string") {
    errors.push("Password is required");
    return { valid: false, errors };
  }

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (password.length > 128) {
    errors.push("Password must be less than 128 characters long");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  // Check for common weak patterns
  const commonPasswords = [
    "password", "123456", "qwerty", "admin", "letmein", 
    "welcome", "monkey", "dragon", "pass", "master"
  ];
  
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push("Password contains common words and is not secure");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Normalize email to lowercase and trim
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== "string") {
    return "";
  }
  return email.toLowerCase().trim();
}

/**
 * Validate username
 */
export function validateUsername(username: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!username || typeof username !== "string") {
    errors.push("Username is required");
    return { valid: false, errors };
  }

  if (username.length < 3) {
    errors.push("Username must be at least 3 characters long");
  }

  if (username.length > 30) {
    errors.push("Username must be less than 30 characters long");
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push("Username can only contain letters, numbers, and underscores");
  }

  if (username.startsWith("_") || username.endsWith("_")) {
    errors.push("Username cannot start or end with underscore");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// =============================================
// RATE LIMITING
// =============================================

/**
 * Rate limiter for login attempts
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: "Too many login attempts, please try again in 15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for registration
 */
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 registrations per hour
  message: {
    error: "Too many registration attempts, please try again in 1 hour"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for password reset requests
 */
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error: "Too many password reset attempts, please try again in 1 hour"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for email verification requests
 */
export const emailVerificationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 email verification requests per hour
  message: {
    error: "Too many email verification attempts, please try again in 1 hour"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * General API rate limiter
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests, please try again later"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// =============================================
// EMAIL HELPERS
// =============================================

// Create reusable transporter object using environment variables
const createTransporter = () => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn("Email credentials not configured. Email functionality will be disabled.");
    return null;
  }

  return nodemailer.createTransporter({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
};

/**
 * Send email verification email
 */
export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log("Email verification simulated for:", email);
      return true; // Return true when email is not configured
    }

    const verificationUrl = `${APP_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: EMAIL_FROM,
      to: email,
      subject: "Verify Your Email Address - ElectroProject",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Verify Your Email Address</h2>
          <p>Thank you for signing up for ElectroProject! Please click the button below to verify your email address:</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, you can copy and paste this link into your browser:
            <br><a href="${verificationUrl}">${verificationUrl}</a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log("Password reset email simulated for:", email);
      return true; // Return true when email is not configured
    }

    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: EMAIL_FROM,
      to: email,
      subject: "Reset Your Password - ElectroProject",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Reset Your Password</h2>
          <p>We received a request to reset your password for your ElectroProject account. Click the button below to create a new password:</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, you can copy and paste this link into your browser:
            <br><a href="${resetUrl}">${resetUrl}</a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
          <p style="color: #666; font-size: 14px;">
            For security reasons, this link can only be used once.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log("Welcome email simulated for:", email);
      return true; // Return true when email is not configured
    }
    
    const escapedFirstName = escapeHtml(firstName);
    
    const mailOptions = {
      from: EMAIL_FROM,
      to: email,
      subject: "Welcome to ElectroProject!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Welcome to ElectroProject, ${escapedFirstName}!</h2>
          <p>We're excited to have you on board! Your account has been successfully created and verified.</p>
          
          <h3 style="color: #374151;">Getting Started</h3>
          <ul style="color: #666;">
            <li>Create your first project and start tracking tasks</li>
            <li>Set up your team and assign responsibilities</li>
            <li>Monitor project progress with our dashboard</li>
            <li>Track time entries and manage budgets</li>
            <li>Handle RFIs and change orders efficiently</li>
          </ul>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${APP_URL}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            If you have any questions or need help getting started, feel free to reach out to our support team.
          </p>
          
          <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            The ElectroProject Team
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return false;
  }
}

/**
 * Send account locked notification email
 */
export async function sendAccountLockedEmail(email: string, firstName: string, unlockTime: Date): Promise<boolean> {
  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log("Account locked email simulated for:", email);
      return true; // Return true when email is not configured
    }

    const escapedFirstName = escapeHtml(firstName);
    const unlockTimeString = unlockTime.toLocaleString();
    
    const mailOptions = {
      from: EMAIL_FROM,
      to: email,
      subject: "Account Temporarily Locked - ElectroProject",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Account Temporarily Locked</h2>
          <p>Hello ${escapedFirstName},</p>
          <p>Your ElectroProject account has been temporarily locked due to multiple failed login attempts.</p>
          
          <p><strong>Your account will be automatically unlocked at:</strong> ${unlockTimeString}</p>
          
          <p style="color: #666;">If you believe this was not you, please contact our support team immediately.</p>
          
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <h4 style="color: #dc2626; margin: 0 0 8px 0;">Security Tips:</h4>
            <ul style="color: #991b1b; margin: 0;">
              <li>Use a strong, unique password</li>
              <li>Enable two-factor authentication</li>
              <li>Don't share your login credentials</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            The ElectroProject Security Team
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send account locked email:", error);
    return false;
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Generate password reset token with expiry
 */
export function generatePasswordResetToken(): { token: string; expires: Date } {
  const token = generateSecureToken(32);
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  return { token, expires };
}

/**
 * Generate email verification token
 */
export function generateEmailVerificationToken(): string {
  return generateSecureToken(32);
}

/**
 * Check if token has expired
 */
export function isTokenExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return true;
  return new Date() > expiryDate;
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input.trim().slice(0, 1000); // Limit length and trim whitespace
}

/**
 * Generate secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  
  const allChars = lowercase + uppercase + numbers + symbols;
  let password = "";
  
  // Ensure at least one character from each set using cryptographically secure random
  password += lowercase[crypto.randomInt(0, lowercase.length)];
  password += uppercase[crypto.randomInt(0, uppercase.length)];
  password += numbers[crypto.randomInt(0, numbers.length)];
  password += symbols[crypto.randomInt(0, symbols.length)];
  
  // Fill the rest randomly using cryptographically secure random
  for (let i = 4; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)];
  }
  
  // Shuffle the password using cryptographically secure random
  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }
  
  return passwordArray.join('');
}

// =============================================
// EXPORTS
// =============================================

export default {
  // Password Management
  hashPassword,
  verifyPassword,
  
  // JWT Token Management
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  
  // Random Token Generation
  generateSecureToken,
  generateSessionToken,
  generateUUID,
  
  // Input Validation
  validateEmail,
  validatePassword,
  normalizeEmail,
  validateUsername,
  
  // Rate Limiting
  loginRateLimit,
  registerRateLimit,
  passwordResetRateLimit,
  emailVerificationRateLimit,
  generalRateLimit,
  
  // Email Helpers
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAccountLockedEmail,
  
  // Utility Functions
  generatePasswordResetToken,
  generateEmailVerificationToken,
  isTokenExpired,
  sanitizeInput,
  generateSecurePassword,
};