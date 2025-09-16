import { type Request, type Response, type NextFunction } from "express";
import { type User, type Session } from "@shared/schema";
import { storage } from "./storage";
import { 
  verifyAccessToken, 
  verifyRefreshToken, 
  validateEmail,
  loginRateLimit,
  registerRateLimit,
  passwordResetRateLimit,
  emailVerificationRateLimit,
  generalRateLimit
} from "./auth-utils";

// =============================================
// TYPE EXTENSIONS
// =============================================

// Extend Express Request interface to include authenticated user information
declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: Session;
      authMethod?: 'jwt' | 'session';
    }
  }
}

// =============================================
// AUTHENTICATION MIDDLEWARE
// =============================================

/**
 * Extract token from Authorization header
 */
function extractTokenFromHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  // Support both "Bearer token" and "token" formats
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  
  return authHeader;
}

/**
 * Extract session token from cookies or headers
 */
function extractSessionToken(req: Request): string | null {
  // Try session cookie first
  if (req.cookies?.sessionToken) {
    return req.cookies.sessionToken;
  }
  
  // Try X-Session-Token header
  const sessionHeader = req.headers['x-session-token'];
  if (sessionHeader && typeof sessionHeader === 'string') {
    return sessionHeader;
  }
  
  return null;
}

/**
 * Require JWT authentication - verify JWT token and authenticate user
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractTokenFromHeader(req);
    
    if (!token) {
      res.status(401).json({ 
        error: "Authentication required", 
        code: "MISSING_TOKEN" 
      });
      return;
    }

    const tokenPayload = verifyAccessToken(token);
    if (!tokenPayload) {
      res.status(401).json({ 
        error: "Invalid or expired token", 
        code: "INVALID_TOKEN" 
      });
      return;
    }

    const user = await storage.getUser(tokenPayload.userId);
    if (!user) {
      res.status(401).json({ 
        error: "User not found", 
        code: "USER_NOT_FOUND" 
      });
      return;
    }

    // Attach user and auth method to request
    req.user = user;
    req.authMethod = 'jwt';

    // Add audit log for successful JWT authentication
    await storage.addAuditLog({
      userId: user.id,
      action: "jwt_auth_success",
      resourceType: "auth",
      resourceId: user.id,
      ipAddress: req.ip || req.connection.remoteAddress || "unknown",
      userAgent: req.headers['user-agent'] || "unknown",
      details: { method: req.method, path: req.path }
    });

    next();
  } catch (error) {
    console.error("JWT authentication error:", error);
    res.status(500).json({ 
      error: "Authentication service error", 
      code: "AUTH_SERVICE_ERROR" 
    });
  }
}

/**
 * Require session authentication - verify session token and authenticate user
 */
export async function requireSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionToken = extractSessionToken(req);
    
    if (!sessionToken) {
      res.status(401).json({ 
        error: "Session authentication required", 
        code: "MISSING_SESSION" 
      });
      return;
    }

    const session = await storage.getSessionByToken(sessionToken);
    if (!session) {
      res.status(401).json({ 
        error: "Invalid or expired session", 
        code: "INVALID_SESSION" 
      });
      return;
    }

    // Check if session is expired
    if (session.expiresAt && session.expiresAt < new Date()) {
      // Clean up expired session
      await storage.revokeSession(session.id);
      res.status(401).json({ 
        error: "Session expired", 
        code: "SESSION_EXPIRED" 
      });
      return;
    }

    const user = await storage.getUser(session.userId);
    if (!user) {
      // Clean up session for non-existent user
      await storage.revokeSession(session.id);
      res.status(401).json({ 
        error: "User not found", 
        code: "USER_NOT_FOUND" 
      });
      return;
    }

    // Update session last access
    await storage.updateSessionLastAccess(session.id);

    // Attach user, session, and auth method to request
    req.user = user;
    req.session = session;
    req.authMethod = 'session';

    // Add audit log for successful session authentication
    await storage.addAuditLog({
      userId: user.id,
      action: "session_auth_success",
      resourceType: "auth",
      resourceId: user.id,
      ipAddress: req.ip || req.connection.remoteAddress || "unknown",
      userAgent: req.headers['user-agent'] || "unknown",
      details: { 
        method: req.method, 
        path: req.path, 
        sessionId: session.id 
      }
    });

    next();
  } catch (error) {
    console.error("Session authentication error:", error);
    res.status(500).json({ 
      error: "Authentication service error", 
      code: "AUTH_SERVICE_ERROR" 
    });
  }
}

/**
 * Optional authentication - try to authenticate but don't fail if no token provided
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Try JWT first
    const token = extractTokenFromHeader(req);
    if (token) {
      const tokenPayload = verifyAccessToken(token);
      if (tokenPayload) {
        const user = await storage.getUser(tokenPayload.userId);
        if (user) {
          req.user = user;
          req.authMethod = 'jwt';
          next();
          return;
        }
      }
    }

    // Try session authentication
    const sessionToken = extractSessionToken(req);
    if (sessionToken) {
      const session = await storage.getSessionByToken(sessionToken);
      if (session && (!session.expiresAt || session.expiresAt >= new Date())) {
        const user = await storage.getUser(session.userId);
        if (user) {
          req.user = user;
          req.session = session;
          req.authMethod = 'session';
          
          // Update session last access
          await storage.updateSessionLastAccess(session.id);
        }
      }
    }

    // Continue regardless of authentication status
    next();
  } catch (error) {
    console.error("Optional authentication error:", error);
    // Don't fail for optional auth - just continue without user
    next();
  }
}

// =============================================
// AUTHORIZATION MIDDLEWARE
// =============================================

/**
 * Require user to have one of the specified roles
 */
export function requireRole(roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          error: "Authentication required", 
          code: "AUTHENTICATION_REQUIRED" 
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        // Add audit log for authorization failure
        await storage.addAuditLog({
          userId: req.user.id,
          action: "authorization_denied",
          resourceType: "auth",
          resourceId: req.user.id,
          ipAddress: req.ip || req.connection.remoteAddress || "unknown",
          userAgent: req.headers['user-agent'] || "unknown",
          details: { 
            method: req.method, 
            path: req.path, 
            requiredRoles: roles, 
            userRole: req.user.role 
          }
        });

        res.status(403).json({ 
          error: "Insufficient permissions", 
          code: "INSUFFICIENT_PERMISSIONS",
          required: roles,
          current: req.user.role
        });
        return;
      }

      next();
    } catch (error) {
      console.error("Role authorization error:", error);
      res.status(500).json({ 
        error: "Authorization service error", 
        code: "AUTH_SERVICE_ERROR" 
      });
    }
  };
}

/**
 * Require user to have verified their email
 */
export async function requireEmailVerified(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: "Authentication required", 
        code: "AUTHENTICATION_REQUIRED" 
      });
      return;
    }

    if (!req.user.emailVerified) {
      // Add audit log for email verification requirement
      await storage.addAuditLog({
        userId: req.user.id,
        action: "email_verification_required",
        resourceType: "auth",
        resourceId: req.user.id,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: { method: req.method, path: req.path }
      });

      res.status(403).json({ 
        error: "Email verification required", 
        code: "EMAIL_NOT_VERIFIED" 
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Email verification check error:", error);
    res.status(500).json({ 
      error: "Authorization service error", 
      code: "AUTH_SERVICE_ERROR" 
    });
  }
}

/**
 * Require user account to be active and not locked
 */
export async function requireActiveAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ 
        error: "Authentication required", 
        code: "AUTHENTICATION_REQUIRED" 
      });
      return;
    }

    if (!req.user.isActive) {
      // Add audit log for inactive account access attempt
      await storage.addAuditLog({
        userId: req.user.id,
        action: "inactive_account_access",
        resourceType: "auth",
        resourceId: req.user.id,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: { method: req.method, path: req.path }
      });

      res.status(403).json({ 
        error: "Account is deactivated", 
        code: "ACCOUNT_DEACTIVATED" 
      });
      return;
    }

    if (req.user.lockedUntil && req.user.lockedUntil > new Date()) {
      // Add audit log for locked account access attempt
      await storage.addAuditLog({
        userId: req.user.id,
        action: "locked_account_access",
        resourceType: "auth",
        resourceId: req.user.id,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: { 
          method: req.method, 
          path: req.path, 
          lockedUntil: req.user.lockedUntil.toISOString() 
        }
      });

      res.status(423).json({ 
        error: "Account is temporarily locked", 
        code: "ACCOUNT_LOCKED",
        lockedUntil: req.user.lockedUntil.toISOString()
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Account status check error:", error);
    res.status(500).json({ 
      error: "Authorization service error", 
      code: "AUTH_SERVICE_ERROR" 
    });
  }
}

// =============================================
// SECURITY MIDDLEWARE
// =============================================

/**
 * Check if account is locked due to failed login attempts
 */
export async function checkAccountLock(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, username } = req.body;
    
    if (!email && !username) {
      next();
      return;
    }

    let user;
    if (email && validateEmail(email)) {
      user = await storage.getUserByEmail(email.toLowerCase().trim());
    } else if (username) {
      user = await storage.getUserByUsername(username);
    }

    if (user) {
      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        // Add audit log for locked account login attempt
        await storage.addAuditLog({
          userId: user.id,
          action: "locked_account_login_attempt",
          resourceType: "auth",
          resourceId: user.id,
          ipAddress: req.ip || req.connection.remoteAddress || "unknown",
          userAgent: req.headers['user-agent'] || "unknown",
          details: { 
            loginAttempts: user.loginAttempts, 
            lockedUntil: user.lockedUntil.toISOString() 
          }
        });

        res.status(423).json({ 
          error: "Account is temporarily locked due to multiple failed login attempts", 
          code: "ACCOUNT_LOCKED",
          lockedUntil: user.lockedUntil.toISOString()
        });
        return;
      }

      // Check if account is deactivated
      if (!user.isActive) {
        res.status(403).json({ 
          error: "Account is deactivated", 
          code: "ACCOUNT_DEACTIVATED" 
        });
        return;
      }

      // Attach user to request for downstream middleware
      req.user = user;
    }

    next();
  } catch (error) {
    console.error("Account lock check error:", error);
    res.status(500).json({ 
      error: "Authentication service error", 
      code: "AUTH_SERVICE_ERROR" 
    });
  }
}

/**
 * Update user's last login time and session activity
 */
export async function updateLastAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user) {
      // Update last login time
      await storage.updateUserLastLogin(req.user.id);

      // If this is a session-based auth, the session last access was already updated
      // in requireSession middleware, so we don't need to do it again

      // Add audit log for successful login/access
      await storage.addAuditLog({
        userId: req.user.id,
        action: req.authMethod === 'jwt' ? "jwt_access" : "session_access",
        resourceType: "auth",
        resourceId: req.user.id,
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers['user-agent'] || "unknown",
        details: { method: req.method, path: req.path }
      });
    }

    next();
  } catch (error) {
    console.error("Update last access error:", error);
    // Don't fail the request for this - just log the error and continue
    next();
  }
}

// =============================================
// UTILITY MIDDLEWARE
// =============================================

/**
 * Combine multiple middleware functions for common authentication patterns
 */
export const authRequired = [requireAuth, requireActiveAccount, updateLastAccess];
export const sessionRequired = [requireSession, requireActiveAccount, updateLastAccess];
export const adminRequired = [requireAuth, requireActiveAccount, requireRole(['admin']), updateLastAccess];
export const emailVerifiedRequired = [requireAuth, requireActiveAccount, requireEmailVerified, updateLastAccess];

/**
 * Create middleware chain for role-based access
 */
export function roleRequired(roles: string[]) {
  return [requireAuth, requireActiveAccount, requireRole(roles), updateLastAccess];
}

/**
 * Create middleware chain for optional authentication with role check
 */
export function optionalRoleAccess(roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First try optional auth
    await optionalAuth(req, res, async () => {
      // If user is authenticated, check role
      if (req.user) {
        if (roles.includes(req.user.role)) {
          await updateLastAccess(req, res, next);
        } else {
          res.status(403).json({ 
            error: "Insufficient permissions", 
            code: "INSUFFICIENT_PERMISSIONS" 
          });
        }
      } else {
        // No user authenticated, proceed
        next();
      }
    });
  };
}

// =============================================
// RATE LIMITING MIDDLEWARE EXPORTS
// =============================================

// Re-export rate limiting middleware from auth-utils for easy access
export {
  loginRateLimit,
  registerRateLimit,
  passwordResetRateLimit,
  emailVerificationRateLimit,
  generalRateLimit
} from "./auth-utils";

// =============================================
// ERROR HANDLING UTILITIES
// =============================================

/**
 * Standard authentication error response
 */
export function sendAuthError(res: Response, message: string, code: string, status: number = 401) {
  res.status(status).json({
    error: message,
    code: code,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  userId: string | null,
  action: string,
  req: Request,
  details: Record<string, any> = {}
) {
  try {
    await storage.addAuditLog({
      userId,
      action,
      resourceType: "security",
      resourceId: userId || "anonymous",
      ipAddress: req.ip || req.connection.remoteAddress || "unknown",
      userAgent: req.headers['user-agent'] || "unknown",
      details: {
        method: req.method,
        path: req.path,
        ...details
      }
    });
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
}