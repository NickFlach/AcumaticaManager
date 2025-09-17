import express, { type Request, Response, NextFunction } from "express";
import path from "node:path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// =============================================
// SECURITY CONFIGURATION
// =============================================

// Configure Express to trust proxy headers for rate limiting
// This is needed when running behind a reverse proxy (like in production)
app.set('trust proxy', 1);

// Security headers middleware
app.use((req, res, next) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Set CSP header for development/production
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    // Hardened CSP without unsafe-inline directives
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self';");
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
});

// Configure secure session/cookie settings
if (process.env.NODE_ENV === 'production') {
  // In production, ensure secure cookie settings
  app.set('trust proxy', 1); // Required for secure cookies behind proxy
  
  // Middleware to enforce secure cookies in production
  app.use((req, res, next) => {
    const originalCookie = res.cookie.bind(res);
    res.cookie = function(name: string, value: string, options: any = {}) {
      const secureOptions = {
        ...options,
        httpOnly: true,
        secure: true,
        sameSite: 'strict' as const,
        maxAge: options.maxAge || 24 * 60 * 60 * 1000 // 24 hours default
      };
      return originalCookie(name, value, secureOptions);
    };
    next();
  });
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Secure request logging middleware - NEVER logs response bodies
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Only log safe information: method, path, status, and timing
      // NEVER log request/response bodies which can contain sensitive data
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });

  next();
});

// =============================================
// STATIC FILE SERVING
// =============================================

// Serve static files from public directory with correct MIME types
const publicDir = path.resolve(process.cwd(), 'public');
app.use(express.static(publicDir, {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.txt')) {
      res.type('text/plain; charset=utf-8');
    }
  },
}));

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Safely send error response
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
    
    // Log error for debugging, but DON'T throw after response is sent
    // This prevents process crashes from malicious error-triggering requests
    console.error('Express error handler:', {
      status,
      message: err.message,
      stack: err.stack,
      url: _req.url,
      method: _req.method
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
