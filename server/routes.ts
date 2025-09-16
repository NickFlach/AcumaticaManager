import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema, 
  insertTaskSchema, 
  insertTimeEntrySchema, 
  insertRfiSchema, 
  insertChangeOrderSchema, 
  insertRiskSchema, 
  insertAcumaticaSyncSchema,
  insertUserSchema,
  updateProfileSchema,
  changePasswordSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  resetUserPasswordSchema,
  userListFiltersSchema,
  updateNotificationPreferencesSchema,
  toPublicUser 
} from "@shared/schema";
import { z } from "zod";
import { 
  requireAuth, 
  requireSession, 
  optionalAuth, 
  requireRole,
  requireEmailVerified,
  requireActiveAccount,
  authRequired,
  adminRequired,
  roleRequired,
  generalRateLimit
} from "./auth-middleware";
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateSessionToken,
  validateEmail,
  validatePassword,
  validateUsername,
  normalizeEmail,
  sanitizeInput,
  loginRateLimit,
  registerRateLimit,
  passwordResetRateLimit,
  emailVerificationRateLimit,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAccountLockedEmail,
  generatePasswordResetToken,
  generateEmailVerificationToken,
  isTokenExpired
} from "./auth-utils";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication demonstration routes - showing middleware in action
  app.get("/api/auth/test/public", (req, res) => {
    res.json({ message: "Public endpoint - no authentication required", user: req.user || null });
  });

  app.get("/api/auth/test/optional", optionalAuth, (req, res) => {
    res.json({ 
      message: "Optional authentication endpoint", 
      authenticated: !!req.user,
      user: req.user ? { id: req.user.id, username: req.user.username, role: req.user.role } : null 
    });
  });

  app.get("/api/auth/test/required", ...authRequired, (req, res) => {
    res.json({ 
      message: "Authentication required endpoint", 
      user: { id: req.user!.id, username: req.user!.username, role: req.user!.role },
      authMethod: req.authMethod
    });
  });

  app.get("/api/auth/test/admin", ...adminRequired, (req, res) => {
    res.json({ 
      message: "Admin only endpoint", 
      user: { id: req.user!.id, username: req.user!.username, role: req.user!.role }
    });
  });

  app.get("/api/auth/test/manager", ...roleRequired(['admin', 'manager']), (req, res) => {
    res.json({ 
      message: "Manager or Admin only endpoint", 
      user: { id: req.user!.id, username: req.user!.username, role: req.user!.role }
    });
  });

  // =============================================
  // AUTHENTICATION ROUTES
  // =============================================

  // Register new user with email verification
  app.post("/api/auth/register", registerRateLimit, async (req, res) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      // Input validation
      if (!username || !email || !password || !firstName || !lastName) {
        return res.status(400).json({ 
          error: "All fields are required", 
          code: "MISSING_FIELDS" 
        });
      }

      // Sanitize inputs
      const sanitizedUsername = sanitizeInput(username);
      const sanitizedEmail = normalizeEmail(email);
      const sanitizedFirstName = sanitizeInput(firstName);
      const sanitizedLastName = sanitizeInput(lastName);

      // Validate username
      const usernameValidation = validateUsername(sanitizedUsername);
      if (!usernameValidation.valid) {
        return res.status(400).json({ 
          error: "Invalid username", 
          details: usernameValidation.errors,
          code: "INVALID_USERNAME"
        });
      }

      // Validate email
      if (!validateEmail(sanitizedEmail)) {
        return res.status(400).json({ 
          error: "Invalid email format", 
          code: "INVALID_EMAIL" 
        });
      }

      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: "Invalid password", 
          details: passwordValidation.errors,
          code: "INVALID_PASSWORD"
        });
      }

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(sanitizedUsername);
      if (existingUsername) {
        return res.status(409).json({ 
          error: "Username already exists", 
          code: "USERNAME_EXISTS" 
        });
      }

      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(sanitizedEmail);
      if (existingEmail) {
        return res.status(409).json({ 
          error: "Email already registered", 
          code: "EMAIL_EXISTS" 
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Generate email verification token
      const emailVerificationToken = generateEmailVerificationToken();

      // Create user
      const userData = {
        username: sanitizedUsername,
        hashedPassword,
        email: sanitizedEmail,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        emailVerificationToken,
        role: "user",
        emailVerified: false,
        isActive: true,
        twoFactorEnabled: false,
        loginAttempts: 0
      };

      const user = await storage.createUser(userData);

      // Send verification email
      const emailSent = await sendVerificationEmail(sanitizedEmail, emailVerificationToken);
      if (!emailSent) {
        console.warn("Failed to send verification email for user:", user.id);
      }

      // Add audit log
      await storage.addAuditLog({
        userId: user.id,
        action: "user_registration",
        resourceType: "user",
        resourceId: user.id,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: { 
          username: sanitizedUsername, 
          email: sanitizedEmail,
          emailSent 
        }
      });

      res.status(201).json({
        message: "User registered successfully. Please check your email to verify your account.",
        user: toPublicUser(user),
        emailSent
      });

    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ 
        error: "Registration failed", 
        code: "REGISTRATION_ERROR" 
      });
    }
  });

  // User login with rate limiting and account lockout
  app.post("/api/auth/login", loginRateLimit, async (req, res) => {
    try {
      const { username, email, password, rememberMe = false } = req.body;

      if (!password || (!username && !email)) {
        return res.status(400).json({ 
          error: "Username/email and password are required", 
          code: "MISSING_CREDENTIALS" 
        });
      }

      // Find user by username or email
      let user;
      if (email) {
        const normalizedEmail = normalizeEmail(email);
        user = await storage.getUserByEmail(normalizedEmail);
      } else {
        const sanitizedUsername = sanitizeInput(username);
        user = await storage.getUserByUsername(sanitizedUsername);
      }

      if (!user) {
        // Add audit log for failed login attempt
        await storage.addAuditLog({
          action: "login_failed",
          resourceType: "auth",
          ipAddress: req.ip || req.connection.remoteAddress || "unknown",
          userAgent: req.headers['user-agent'] || "unknown",
          details: { 
            reason: "user_not_found", 
            attempted_username: username,
            attempted_email: email 
          },
          success: false
        });

        return res.status(401).json({ 
          error: "Invalid credentials", 
          code: "INVALID_CREDENTIALS" 
        });
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        await storage.addAuditLog({
          userId: user.id,
          action: "login_failed_account_locked",
          resourceType: "auth",
          resourceId: user.id,
          ipAddress: req.ip || req.connection.remoteAddress || "unknown",
          userAgent: req.headers['user-agent'] || "unknown",
          details: { lockedUntil: user.lockedUntil },
          success: false
        });

        return res.status(423).json({ 
          error: "Account is temporarily locked due to too many failed attempts", 
          code: "ACCOUNT_LOCKED",
          lockedUntil: user.lockedUntil
        });
      }

      // Check if account is active
      if (!user.isActive) {
        await storage.addAuditLog({
          userId: user.id,
          action: "login_failed_inactive_account",
          resourceType: "auth",
          resourceId: user.id,
          ipAddress: req.ip || req.connection.remoteAddress || "unknown",
          userAgent: req.headers['user-agent'] || "unknown",
          details: {},
          success: false
        });

        return res.status(403).json({ 
          error: "Account is inactive", 
          code: "ACCOUNT_INACTIVE" 
        });
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.hashedPassword);

      if (!isPasswordValid) {
        // Increment login attempts
        const newLoginAttempts = (user.loginAttempts || 0) + 1;
        const maxAttempts = 5;
        let lockedUntil: Date | undefined;

        if (newLoginAttempts >= maxAttempts) {
          lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
          
          // Send account locked email
          await sendAccountLockedEmail(user.email, user.firstName, lockedUntil);
        }

        await storage.updateUserLoginAttempts(user.id, newLoginAttempts, lockedUntil);

        await storage.addAuditLog({
          userId: user.id,
          action: "login_failed_invalid_password",
          resourceType: "auth",
          resourceId: user.id,
          ipAddress: req.ip || req.connection.remoteAddress || "unknown",
          userAgent: req.headers['user-agent'] || "unknown",
          details: { 
            loginAttempts: newLoginAttempts,
            accountLocked: !!lockedUntil
          },
          success: false
        });

        return res.status(401).json({ 
          error: "Invalid credentials", 
          code: "INVALID_CREDENTIALS" 
        });
      }

      // Reset login attempts on successful login
      await storage.updateUserLoginAttempts(user.id, 0);
      await storage.updateUserLastLogin(user.id);

      // Generate tokens
      const accessToken = generateAccessToken(user.id, user.email);
      const refreshToken = generateRefreshToken(user.id);

      // Create session if remember me is enabled
      let session;
      if (rememberMe) {
        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        session = await storage.createSession({
          userId: user.id,
          sessionToken,
          expiresAt,
          lastAccessedAt: new Date(),
          userAgent: req.headers['user-agent'] || "unknown",
          ipAddress: req.ip || req.connection.remoteAddress || "unknown",
          isActive: true
        });

        // Set session cookie
        res.cookie('sessionToken', sessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
      }

      // Add audit log for successful login
      await storage.addAuditLog({
        userId: user.id,
        action: "login_success",
        resourceType: "auth",
        resourceId: user.id,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: { 
          rememberMe,
          sessionCreated: !!session
        }
      });

      res.json({
        message: "Login successful",
        user: toPublicUser(user),
        accessToken,
        refreshToken,
        sessionCreated: !!session
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ 
        error: "Login failed", 
        code: "LOGIN_ERROR" 
      });
    }
  });

  // User logout (revoke session)
  app.post("/api/auth/logout", optionalAuth, async (req, res) => {
    try {
      let sessionRevoked = false;
      
      if (req.session) {
        await storage.revokeSession(req.session.id);
        sessionRevoked = true;
        
        // Clear session cookie
        res.clearCookie('sessionToken');
      }

      if (req.user) {
        // Add audit log
        await storage.addAuditLog({
          userId: req.user.id,
          action: "logout",
          resourceType: "auth",
          resourceId: req.user.id,
          ipAddress: req.ip || req.connection.remoteAddress || "unknown",
          userAgent: req.headers['user-agent'] || "unknown",
          details: { sessionRevoked }
        });
      }

      res.json({
        message: "Logout successful",
        sessionRevoked
      });

    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ 
        error: "Logout failed", 
        code: "LOGOUT_ERROR" 
      });
    }
  });

  // Get current authenticated user
  app.get("/api/auth/me", ...authRequired, async (req, res) => {
    try {
      res.json({
        user: toPublicUser(req.user!),
        authMethod: req.authMethod
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ 
        error: "Failed to get user information", 
        code: "GET_USER_ERROR" 
      });
    }
  });

  // Refresh JWT access token using refresh token
  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ 
          error: "Refresh token is required", 
          code: "MISSING_REFRESH_TOKEN" 
        });
      }

      const tokenPayload = verifyRefreshToken(refreshToken);
      if (!tokenPayload) {
        return res.status(401).json({ 
          error: "Invalid or expired refresh token", 
          code: "INVALID_REFRESH_TOKEN" 
        });
      }

      const user = await storage.getUser(tokenPayload.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ 
          error: "User not found or inactive", 
          code: "USER_NOT_FOUND" 
        });
      }

      // Generate new access token
      const newAccessToken = generateAccessToken(user.id, user.email);

      // Add audit log
      await storage.addAuditLog({
        userId: user.id,
        action: "token_refresh",
        resourceType: "auth",
        resourceId: user.id,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: {}
      });

      res.json({
        accessToken: newAccessToken,
        user: toPublicUser(user)
      });

    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({ 
        error: "Token refresh failed", 
        code: "TOKEN_REFRESH_ERROR" 
      });
    }
  });

  // Send password reset email
  app.post("/api/auth/forgot-password", passwordResetRateLimit, async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ 
          error: "Email is required", 
          code: "MISSING_EMAIL" 
        });
      }

      const normalizedEmail = normalizeEmail(email);
      if (!validateEmail(normalizedEmail)) {
        return res.status(400).json({ 
          error: "Invalid email format", 
          code: "INVALID_EMAIL" 
        });
      }

      const user = await storage.getUserByEmail(normalizedEmail);
      
      // Always return success to prevent email enumeration
      const response = {
        message: "If an account with that email exists, a password reset link has been sent."
      };

      if (!user) {
        // Add audit log for attempt with non-existent email
        await storage.addAuditLog({
          action: "password_reset_failed",
          resourceType: "auth",
          ipAddress: req.ip || req.connection.remoteAddress || "unknown",
          userAgent: req.headers['user-agent'] || "unknown",
          details: { 
            reason: "email_not_found",
            attempted_email: normalizedEmail 
          },
          success: false
        });

        return res.json(response);
      }

      if (!user.isActive) {
        // Add audit log for inactive account
        await storage.addAuditLog({
          userId: user.id,
          action: "password_reset_failed",
          resourceType: "auth",
          resourceId: user.id,
          ipAddress: req.ip || req.connection.remoteAddress || "unknown",
          userAgent: req.headers['user-agent'] || "unknown",
          details: { reason: "account_inactive" },
          success: false
        });

        return res.json(response);
      }

      // Generate password reset token
      const { token, expires } = generatePasswordResetToken();
      
      // Save token to user
      await storage.setPasswordResetToken(user.id, token, expires);

      // Send password reset email
      const emailSent = await sendPasswordResetEmail(normalizedEmail, token);

      // Add audit log
      await storage.addAuditLog({
        userId: user.id,
        action: "password_reset_requested",
        resourceType: "auth",
        resourceId: user.id,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: { emailSent }
      });

      res.json(response);

    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ 
        error: "Failed to process password reset request", 
        code: "FORGOT_PASSWORD_ERROR" 
      });
    }
  });

  // Reset password using token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ 
          error: "Token and new password are required", 
          code: "MISSING_FIELDS" 
        });
      }

      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: "Invalid password", 
          details: passwordValidation.errors,
          code: "INVALID_PASSWORD"
        });
      }

      // Find user by reset token
      const user = await storage.getUserByPasswordResetToken(token);

      if (!user) {
        return res.status(400).json({ 
          error: "Invalid or expired reset token", 
          code: "INVALID_RESET_TOKEN" 
        });
      }

      // Check if token has expired (already checked in getUserByPasswordResetToken, but double-check)
      if (!user.passwordResetExpires || isTokenExpired(user.passwordResetExpires)) {
        await storage.clearPasswordResetToken(user.id);
        
        await storage.addAuditLog({
          userId: user.id,
          action: "password_reset_failed",
          resourceType: "auth",
          resourceId: user.id,
          ipAddress: req.ip || req.connection.remoteAddress || "unknown",
          userAgent: req.headers['user-agent'] || "unknown",
          details: { reason: "token_expired" },
          success: false
        });

        return res.status(400).json({ 
          error: "Reset token has expired", 
          code: "TOKEN_EXPIRED" 
        });
      }

      // Check password reuse (last 5 passwords)
      const hashedNewPassword = await hashPassword(newPassword);
      const isPasswordReused = await storage.checkPasswordReuse(user.id, hashedNewPassword, 5);
      
      if (isPasswordReused) {
        await storage.addAuditLog({
          userId: user.id,
          action: "password_reset_failed",
          resourceType: "auth",
          resourceId: user.id,
          ipAddress: req.ip || req.connection.remoteAddress || "unknown",
          userAgent: req.headers['user-agent'] || "unknown",
          details: { reason: "password_reused" },
          success: false
        });

        return res.status(400).json({ 
          error: "Cannot reuse a recent password", 
          code: "PASSWORD_REUSED" 
        });
      }

      // Add current password to history
      await storage.addPasswordHistory({
        userId: user.id,
        hashedPassword: user.hashedPassword
      });

      // Update password
      await storage.updateUserPassword(user.id, hashedNewPassword);

      // Clear reset token
      await storage.clearPasswordResetToken(user.id);

      // Reset login attempts if user was locked
      await storage.updateUserLoginAttempts(user.id, 0);

      // Revoke all user sessions for security
      await storage.revokeAllUserSessions(user.id);

      // Add audit log
      await storage.addAuditLog({
        userId: user.id,
        action: "password_reset_success",
        resourceType: "auth",
        resourceId: user.id,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: {}
      });

      res.json({
        message: "Password reset successfully. Please log in with your new password."
      });

    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ 
        error: "Password reset failed", 
        code: "RESET_PASSWORD_ERROR" 
      });
    }
  });

  // Change password for authenticated users
  app.post("/api/auth/change-password", ...authRequired, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          error: "Current password and new password are required", 
          code: "MISSING_FIELDS" 
        });
      }

      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: "Invalid password", 
          details: passwordValidation.errors,
          code: "INVALID_PASSWORD"
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(currentPassword, req.user!.hashedPassword);
      if (!isCurrentPasswordValid) {
        await storage.addAuditLog({
          userId: req.user!.id,
          action: "password_change_failed",
          resourceType: "auth",
          resourceId: req.user!.id,
          ipAddress: req.ip || req.connection.remoteAddress || "unknown",
          userAgent: req.headers['user-agent'] || "unknown",
          details: { reason: "invalid_current_password" },
          success: false
        });

        return res.status(400).json({ 
          error: "Current password is incorrect", 
          code: "INVALID_CURRENT_PASSWORD" 
        });
      }

      // Check password reuse
      const hashedNewPassword = await hashPassword(newPassword);
      const isPasswordReused = await storage.checkPasswordReuse(req.user!.id, hashedNewPassword, 5);
      
      if (isPasswordReused) {
        await storage.addAuditLog({
          userId: req.user!.id,
          action: "password_change_failed",
          resourceType: "auth",
          resourceId: req.user!.id,
          ipAddress: req.ip || req.connection.remoteAddress || "unknown",
          userAgent: req.headers['user-agent'] || "unknown",
          details: { reason: "password_reused" },
          success: false
        });

        return res.status(400).json({ 
          error: "Cannot reuse a recent password", 
          code: "PASSWORD_REUSED" 
        });
      }

      // Add current password to history
      await storage.addPasswordHistory({
        userId: req.user!.id,
        hashedPassword: req.user!.hashedPassword
      });

      // Update password
      await storage.updateUserPassword(req.user!.id, hashedNewPassword);

      // Add audit log
      await storage.addAuditLog({
        userId: req.user!.id,
        action: "password_change_success",
        resourceType: "auth",
        resourceId: req.user!.id,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: {}
      });

      res.json({
        message: "Password changed successfully"
      });

    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ 
        error: "Password change failed", 
        code: "CHANGE_PASSWORD_ERROR" 
      });
    }
  });

  // Verify email using token
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ 
          error: "Verification token is required", 
          code: "MISSING_TOKEN" 
        });
      }

      // Find user by verification token
      const user = await storage.getUserByEmailVerificationToken(token);

      if (!user) {
        return res.status(400).json({ 
          error: "Invalid verification token", 
          code: "INVALID_VERIFICATION_TOKEN" 
        });
      }

      if (user.emailVerified) {
        return res.status(400).json({ 
          error: "Email is already verified", 
          code: "EMAIL_ALREADY_VERIFIED" 
        });
      }

      // Mark email as verified
      await storage.updateUserEmailVerification(user.id, true);
      await storage.clearEmailVerificationToken(user.id);

      // Send welcome email
      await sendWelcomeEmail(user.email, user.firstName);

      // Add audit log
      await storage.addAuditLog({
        userId: user.id,
        action: "email_verification_success",
        resourceType: "auth",
        resourceId: user.id,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: {}
      });

      res.json({
        message: "Email verified successfully",
        user: toPublicUser({ ...user, emailVerified: true, emailVerificationToken: null })
      });

    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ 
        error: "Email verification failed", 
        code: "EMAIL_VERIFICATION_ERROR" 
      });
    }
  });

  // Resend email verification
  app.post("/api/auth/resend-verification", emailVerificationRateLimit, async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ 
          error: "Email is required", 
          code: "MISSING_EMAIL" 
        });
      }

      const normalizedEmail = normalizeEmail(email);
      const user = await storage.getUserByEmail(normalizedEmail);

      // Always return success to prevent email enumeration
      const response = {
        message: "If an unverified account with that email exists, a verification email has been sent."
      };

      if (!user) {
        return res.json(response);
      }

      if (user.emailVerified) {
        return res.json(response);
      }

      if (!user.isActive) {
        return res.json(response);
      }

      // Generate new verification token
      const newToken = generateEmailVerificationToken();
      await storage.setEmailVerificationToken(user.id, newToken);

      // Send verification email
      const emailSent = await sendVerificationEmail(normalizedEmail, newToken);

      // Add audit log
      await storage.addAuditLog({
        userId: user.id,
        action: "email_verification_resent",
        resourceType: "auth",
        resourceId: user.id,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: { emailSent }
      });

      res.json(response);

    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ 
        error: "Failed to resend verification email", 
        code: "RESEND_VERIFICATION_ERROR" 
      });
    }
  });

  // =============================================
  // PROFILE AND USER MANAGEMENT ROUTES
  // =============================================

  // Update user profile
  app.put("/api/auth/profile", ...authRequired, async (req, res) => {
    try {
      const validatedData = updateProfileSchema.parse(req.body);
      
      // Check if email is being changed and if it's already taken
      if (validatedData.email !== req.user!.email) {
        const existingUser = await storage.getUserByEmail(validatedData.email);
        if (existingUser && existingUser.id !== req.user!.id) {
          return res.status(409).json({ 
            error: "Email already in use", 
            code: "EMAIL_EXISTS" 
          });
        }
      }

      const updatedUser = await storage.updateUserProfile(req.user!.id, validatedData);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Add audit log
      await storage.addAuditLog({
        userId: req.user!.id,
        action: "profile_updated",
        resourceType: "user",
        resourceId: req.user!.id,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: { 
          changes: validatedData,
          emailChanged: validatedData.email !== req.user!.email
        }
      });

      res.json({
        message: "Profile updated successfully",
        user: toPublicUser(updatedUser)
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid profile data", details: error.errors });
      }
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Update notification preferences
  // Get user notification preferences
  app.get("/api/auth/preferences", ...authRequired, async (req, res) => {
    try {
      const preferences = await storage.getUserNotificationPreferences(req.user!.id);
      
      // Return default preferences if none exist
      const defaultPreferences = {
        emailNotifications: true,
        projectUpdates: true,
        taskReminders: true,
        securityAlerts: true,
      };
      
      res.json({ preferences: preferences || defaultPreferences });
    } catch (error) {
      console.error("Failed to get notification preferences:", error);
      res.status(500).json({ error: "Failed to get preferences" });
    }
  });

  // Update user notification preferences
  app.put("/api/auth/preferences", ...authRequired, async (req, res) => {
    try {
      const validatedData = updateNotificationPreferencesSchema.parse(req.body);
      
      // Actually persist the preferences
      const success = await storage.updateUserNotificationPreferences(req.user!.id, validatedData);
      
      if (!success) {
        return res.status(500).json({ error: "Failed to update preferences" });
      }
      
      // Add audit log
      await storage.addAuditLog({
        userId: req.user!.id,
        action: "preferences_updated",
        resourceType: "user",
        resourceId: req.user!.id,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: validatedData
      });

      res.json({
        message: "Preferences updated successfully",
        preferences: validatedData
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid preferences data", details: error.errors });
      }
      console.error("Failed to update notification preferences:", error);
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  // Get user sessions
  app.get("/api/auth/sessions", ...authRequired, async (req, res) => {
    try {
      const sessions = await storage.getUserSessions(req.user!.id);
      
      // Add current session indicator
      const sessionToken = req.headers.authorization?.replace('Bearer ', '') || '';
      const currentSession = req.session?.id;
      
      const sessionsWithIndicator = sessions.map(session => ({
        ...session,
        isCurrent: session.id === currentSession || session.sessionToken === sessionToken
      }));

      res.json(sessionsWithIndicator);
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Logout from specific session
  app.delete("/api/auth/sessions/:sessionId", ...authRequired, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const success = await storage.revokeSession(sessionId);
      
      if (!success) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Add audit log
      await storage.addAuditLog({
        userId: req.user!.id,
        action: "session_revoked",
        resourceType: "session",
        resourceId: sessionId,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: { sessionId }
      });

      res.json({ message: "Session ended successfully" });
    } catch (error) {
      console.error("Session logout error:", error);
      res.status(500).json({ error: "Failed to end session" });
    }
  });

  // Logout from all devices
  app.post("/api/auth/logout-all", ...authRequired, async (req, res) => {
    try {
      const revokedCount = await storage.revokeAllUserSessions(req.user!.id);

      // Add audit log
      await storage.addAuditLog({
        userId: req.user!.id,
        action: "all_sessions_revoked",
        resourceType: "session",
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: { revokedCount }
      });

      res.json({ 
        message: "Logged out from all devices successfully",
        revokedSessions: revokedCount
      });
    } catch (error) {
      console.error("Logout all error:", error);
      res.status(500).json({ error: "Failed to logout from all devices" });
    }
  });

  // =============================================
  // ADMIN USER MANAGEMENT ROUTES
  // =============================================

  // Get all users with filtering
  app.get("/api/admin/users", ...adminRequired, async (req, res) => {
    try {
      const filters = userListFiltersSchema.parse(req.query);
      const usersResponse = await storage.getUsersWithFilters(filters);
      
      // Convert user data to public format
      const safeUsersResponse = {
        ...usersResponse,
        users: usersResponse.users.map(user => toPublicUser(user))
      };

      res.json(safeUsersResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid filter parameters", details: error.errors });
      }
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Update user role
  app.put("/api/admin/users/role", ...adminRequired, async (req, res) => {
    try {
      const validatedData = updateUserRoleSchema.parse(req.body);
      
      // Prevent self role change
      if (validatedData.userId === req.user!.id) {
        return res.status(400).json({ 
          error: "Cannot change your own role", 
          code: "SELF_ROLE_CHANGE" 
        });
      }

      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const success = await storage.updateUserRole(validatedData.userId, validatedData.role);
      if (!success) {
        return res.status(500).json({ error: "Failed to update user role" });
      }

      // Add audit log
      await storage.addAuditLog({
        userId: req.user!.id,
        action: "user_role_updated",
        resourceType: "user",
        resourceId: validatedData.userId,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: { 
          previousRole: user.role,
          newRole: validatedData.role,
          targetUser: { id: user.id, username: user.username }
        }
      });

      res.json({ 
        message: "User role updated successfully",
        user: { id: user.id, username: user.username, role: validatedData.role }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid role data", details: error.errors });
      }
      console.error("Update user role error:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // Update user status (enable/disable)
  app.put("/api/admin/users/status", ...adminRequired, async (req, res) => {
    try {
      const validatedData = updateUserStatusSchema.parse(req.body);
      
      // Prevent self status change
      if (validatedData.userId === req.user!.id) {
        return res.status(400).json({ 
          error: "Cannot change your own account status", 
          code: "SELF_STATUS_CHANGE" 
        });
      }

      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const success = await storage.updateUserStatus(validatedData.userId, validatedData.isActive);
      if (!success) {
        return res.status(500).json({ error: "Failed to update user status" });
      }

      // Revoke all sessions if deactivating
      if (!validatedData.isActive) {
        await storage.revokeAllUserSessions(validatedData.userId);
      }

      // Add audit log
      await storage.addAuditLog({
        userId: req.user!.id,
        action: validatedData.isActive ? "user_activated" : "user_deactivated",
        resourceType: "user",
        resourceId: validatedData.userId,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: { 
          previousStatus: user.isActive,
          newStatus: validatedData.isActive,
          targetUser: { id: user.id, username: user.username },
          sessionsRevoked: !validatedData.isActive
        }
      });

      res.json({ 
        message: `User ${validatedData.isActive ? 'activated' : 'deactivated'} successfully`,
        user: { id: user.id, username: user.username, isActive: validatedData.isActive }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid status data", details: error.errors });
      }
      console.error("Update user status error:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // Reset user password (admin)
  app.post("/api/admin/users/reset-password", ...adminRequired, async (req, res) => {
    try {
      const validatedData = resetUserPasswordSchema.parse(req.body);
      
      // Prevent self password reset
      if (validatedData.userId === req.user!.id) {
        return res.status(400).json({ 
          error: "Cannot reset your own password", 
          code: "SELF_PASSWORD_RESET" 
        });
      }

      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Hash new password
      const hashedPassword = await hashPassword(validatedData.newPassword);

      // Add current password to history
      await storage.addPasswordHistory({
        userId: user.id,
        hashedPassword: user.hashedPassword
      });

      // Update password
      const success = await storage.updateUserPassword(validatedData.userId, hashedPassword);
      if (!success) {
        return res.status(500).json({ error: "Failed to reset password" });
      }

      // Revoke all user sessions for security
      await storage.revokeAllUserSessions(validatedData.userId);

      // Add audit log
      await storage.addAuditLog({
        userId: req.user!.id,
        action: "user_password_reset",
        resourceType: "user",
        resourceId: validatedData.userId,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: { 
          targetUser: { id: user.id, username: user.username },
          sessionsRevoked: true
        }
      });

      res.json({ 
        message: "User password reset successfully",
        user: { id: user.id, username: user.username }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid password data", details: error.errors });
      }
      console.error("Reset user password error:", error);
      res.status(500).json({ error: "Failed to reset user password" });
    }
  });

  // Get audit logs for a user
  app.get("/api/admin/audit-logs/:userId", ...adminRequired, async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const auditLogs = await storage.getAuditLogsByUser(userId, limit);
      res.json(auditLogs);
    } catch (error) {
      console.error("Get audit logs error:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // Projects routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid project data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(req.params.id, validatedData);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid project data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Tasks routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const { projectId } = req.query;
      const tasks = projectId 
        ? await storage.getTasksByProject(projectId as string)
        : await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid task data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, validatedData);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid task data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTask(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Time entries routes
  app.get("/api/time-entries", async (req, res) => {
    try {
      const { projectId, userId } = req.query;
      let timeEntries;
      if (projectId) {
        timeEntries = await storage.getTimeEntriesByProject(projectId as string);
      } else if (userId) {
        timeEntries = await storage.getTimeEntriesByUser(userId as string);
      } else {
        timeEntries = await storage.getTimeEntries();
      }
      res.json(timeEntries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time entries" });
    }
  });

  app.post("/api/time-entries", async (req, res) => {
    try {
      const validatedData = insertTimeEntrySchema.parse(req.body);
      const timeEntry = await storage.createTimeEntry(validatedData);
      res.status(201).json(timeEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid time entry data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create time entry" });
    }
  });

  app.put("/api/time-entries/:id", async (req, res) => {
    try {
      const validatedData = insertTimeEntrySchema.partial().parse(req.body);
      const timeEntry = await storage.updateTimeEntry(req.params.id, validatedData);
      if (!timeEntry) {
        return res.status(404).json({ error: "Time entry not found" });
      }
      res.json(timeEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid time entry data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update time entry" });
    }
  });

  app.delete("/api/time-entries/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTimeEntry(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Time entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete time entry" });
    }
  });

  // RFIs routes
  app.get("/api/rfis", async (req, res) => {
    try {
      const { projectId } = req.query;
      const rfis = projectId 
        ? await storage.getRfisByProject(projectId as string)
        : await storage.getRfis();
      res.json(rfis);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch RFIs" });
    }
  });

  app.post("/api/rfis", async (req, res) => {
    try {
      const validatedData = insertRfiSchema.parse(req.body);
      const rfi = await storage.createRfi(validatedData);
      res.status(201).json(rfi);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid RFI data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create RFI" });
    }
  });

  app.put("/api/rfis/:id", async (req, res) => {
    try {
      const validatedData = insertRfiSchema.partial().parse(req.body);
      const rfi = await storage.updateRfi(req.params.id, validatedData);
      if (!rfi) {
        return res.status(404).json({ error: "RFI not found" });
      }
      res.json(rfi);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid RFI data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update RFI" });
    }
  });

  app.delete("/api/rfis/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteRfi(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "RFI not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete RFI" });
    }
  });

  // Change Orders routes
  app.get("/api/change-orders", async (req, res) => {
    try {
      const { projectId } = req.query;
      const changeOrders = projectId 
        ? await storage.getChangeOrdersByProject(projectId as string)
        : await storage.getChangeOrders();
      res.json(changeOrders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch change orders" });
    }
  });

  app.post("/api/change-orders", async (req, res) => {
    try {
      const validatedData = insertChangeOrderSchema.parse(req.body);
      const changeOrder = await storage.createChangeOrder(validatedData);
      res.status(201).json(changeOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid change order data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create change order" });
    }
  });

  app.put("/api/change-orders/:id", async (req, res) => {
    try {
      const validatedData = insertChangeOrderSchema.partial().parse(req.body);
      const changeOrder = await storage.updateChangeOrder(req.params.id, validatedData);
      if (!changeOrder) {
        return res.status(404).json({ error: "Change order not found" });
      }
      res.json(changeOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid change order data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update change order" });
    }
  });

  // Risks routes
  app.get("/api/risks", async (req, res) => {
    try {
      const { projectId } = req.query;
      const risks = projectId 
        ? await storage.getRisksByProject(projectId as string)
        : await storage.getRisks();
      res.json(risks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch risks" });
    }
  });

  app.post("/api/risks", async (req, res) => {
    try {
      const validatedData = insertRiskSchema.parse(req.body);
      const risk = await storage.createRisk(validatedData);
      res.status(201).json(risk);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid risk data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create risk" });
    }
  });

  app.put("/api/risks/:id", async (req, res) => {
    try {
      const validatedData = insertRiskSchema.partial().parse(req.body);
      const risk = await storage.updateRisk(req.params.id, validatedData);
      if (!risk) {
        return res.status(404).json({ error: "Risk not found" });
      }
      res.json(risk);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid risk data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update risk" });
    }
  });

  // Acumatica Sync routes
  app.get("/api/acumatica/sync", async (req, res) => {
    try {
      const syncs = await storage.getAcumaticaSyncs();
      res.json(syncs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sync history" });
    }
  });

  app.post("/api/acumatica/sync", async (req, res) => {
    try {
      const { syncType } = req.body;
      if (!syncType) {
        return res.status(400).json({ error: "Sync type is required" });
      }

      const syncData = {
        syncType,
        status: "in-progress" as const,
        recordsProcessed: 0,
        recordsSuccessful: 0,
        recordsFailed: 0,
        startedAt: new Date(),
        syncData: null,
      };

      const sync = await storage.createAcumaticaSync(syncData);

      // Simulate sync process
      setTimeout(async () => {
        await storage.updateAcumaticaSync(sync.id, {
          status: "completed",
          recordsProcessed: 100,
          recordsSuccessful: 98,
          recordsFailed: 2,
          completedAt: new Date(),
        });
      }, 2000);

      res.status(201).json(sync);
    } catch (error) {
      res.status(500).json({ error: "Failed to start sync" });
    }
  });

  // Dashboard metrics endpoint
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      const tasks = await storage.getTasks();
      const rfis = await storage.getRfis();
      const timeEntries = await storage.getTimeEntries();

      const activeProjects = projects.filter(p => p.status === "active").length;
      const onTimeProjects = projects.filter(p => p.health === "on-track").length;
      const totalProjects = projects.length;
      const onTimeRate = totalProjects > 0 ? Math.round((onTimeProjects / totalProjects) * 100) : 0;
      
      const totalBudget = projects.reduce((sum, p) => sum + (parseFloat(p.budgetAmount || "0")), 0);
      const totalActual = projects.reduce((sum, p) => sum + (parseFloat(p.actualAmount || "0")), 0);
      const budgetVariance = totalBudget > 0 ? ((totalActual - totalBudget) / totalBudget) * 100 : 0;
      
      const openRfis = rfis.filter(r => r.status === "open").length;

      res.json({
        activeProjects,
        onTimeRate: `${onTimeRate}%`,
        budgetVariance: `${budgetVariance.toFixed(1)}%`,
        openRfis,
        totalBudget,
        totalActual,
        projectHealthStats: {
          onTrack: projects.filter(p => p.health === "on-track").length,
          atRisk: projects.filter(p => p.health === "at-risk").length,
          behindSchedule: projects.filter(p => p.health === "behind-schedule").length,
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Excel export endpoint
  app.get("/api/export/:type", async (req, res) => {
    try {
      const { type } = req.params;
      let data;

      switch (type) {
        case "projects":
          data = await storage.getProjects();
          break;
        case "tasks":
          data = await storage.getTasks();
          break;
        case "time-entries":
          data = await storage.getTimeEntries();
          break;
        case "rfis":
          data = await storage.getRfis();
          break;
        case "change-orders":
          data = await storage.getChangeOrders();
          break;
        case "risks":
          data = await storage.getRisks();
          break;
        default:
          return res.status(400).json({ error: "Invalid export type" });
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
