/**
 * Security utilities for XSS, CSRF, and input validation
 */

/**
 * Sanitize HTML input to prevent XSS attacks
 * Removes dangerous tags and attributes
 */
export const sanitizeHTML = (input: string): string => {
  if (!input) return "";

  // Remove script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, "");

  return sanitized.trim();
};

/**
 * Escape HTML special characters to prevent XSS
 */
export const escapeHTML = (text: string): string => {
  if (!text) return "";

  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return text.replace(/[&<>"'\/]/g, (char) => map[char]);
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 */
export const isValidURL = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Sanitize input for SQL-like operations (additional layer)
 * Note: Supabase handles parameterized queries, but this adds extra safety
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return "";

  // Remove SQL injection patterns
  let sanitized = input.replace(/['";\\]/g, "");

  // Remove potential command injection
  sanitized = sanitized.replace(/[`$(){}[\]]/g, "");

  return sanitized.trim();
};

/**
 * Rate limiting helper - tracks attempts
 */
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export const checkRateLimit = (
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 60000 // 1 minute default
): { allowed: boolean; remainingAttempts: number } => {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    rateLimitStore.set(identifier, { count: 1, firstAttempt: now });
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  const timePassed = now - entry.firstAttempt;

  // Reset if window has passed
  if (timePassed > windowMs) {
    rateLimitStore.set(identifier, { count: 1, firstAttempt: now });
    return { allowed: true, remainingAttempts: maxAttempts - 1 };
  }

  // Check if limit exceeded
  if (entry.count >= maxAttempts) {
    return { allowed: false, remainingAttempts: 0 };
  }

  // Increment count
  entry.count++;
  return { allowed: true, remainingAttempts: maxAttempts - entry.count };
};

/**
 * Clear rate limit for an identifier (useful after successful action)
 */
export const clearRateLimit = (identifier: string): void => {
  rateLimitStore.delete(identifier);
};

/**
 * Generate CSRF token
 */
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

/**
 * Store CSRF token in sessionStorage
 */
export const setCSRFToken = (): string => {
  const token = generateCSRFToken();
  sessionStorage.setItem("csrf_token", token);
  return token;
};

/**
 * Get CSRF token from sessionStorage
 */
export const getCSRFToken = (): string | null => {
  return sessionStorage.getItem("csrf_token");
};

/**
 * Validate CSRF token
 */
export const validateCSRFToken = (token: string): boolean => {
  const storedToken = getCSRFToken();
  return storedToken !== null && storedToken === token;
};

/**
 * Validate file upload
 */
interface FileValidationOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export const validateFileUpload = (
  file: File,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } => {
  const {
    maxSizeMB = 10,
    allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"],
    allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".pdf"],
  } = options;

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }

  // Check file extension
  const extension = "." + file.name.split(".").pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: `File extension ${extension} is not allowed` };
  }

  return { valid: true };
};

/**
 * Secure random string generation
 */
export const generateSecureRandom = (length: number = 16): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);

  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
};

/**
 * Check for suspicious patterns in user input
 */
export const detectSuspiciousInput = (input: string): boolean => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
    /\.\.\/\.\.\//,  // Directory traversal
    /etc\/passwd/i,
    /cmd\.exe/i,
    /\/bin\/(ba)?sh/i,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
};

/**
 * Validate and sanitize PIN code
 */
export const validatePinCode = (pin: string): { valid: boolean; sanitized: string; error?: string } => {
  // Remove any non-alphanumeric characters
  const sanitized = pin.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (sanitized.length !== 8) {
    return { valid: false, sanitized, error: "PIN must be exactly 8 characters" };
  }

  // Check for suspicious patterns
  if (detectSuspiciousInput(sanitized)) {
    return { valid: false, sanitized: "", error: "Invalid PIN format" };
  }

  return { valid: true, sanitized };
};

/**
 * Content Security Policy headers (for reference)
 */
export const CSP_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.paystack.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};
