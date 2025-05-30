/**
 * Security Test Environment Variables
 * Sets up secure testing environment
 */

// Security test environment configuration
process.env.NODE_ENV = 'test';
process.env.SECURITY_TEST_MODE = 'true';

// Use secure test secrets (different from production)
process.env.JWT_SECRET = 'test-jwt-secret-256-bit-key-for-security-testing-only';
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-security-tests-only';
process.env.SESSION_SECRET = 'test-session-secret-for-security-tests-only';

// Disable external services for security tests
process.env.SKIP_EXTERNAL_SERVICES = 'true';
process.env.MOCK_DATABASE = 'true';
process.env.DISABLE_RATE_LIMITING = 'false'; // Keep rate limiting for security tests
process.env.ENABLE_SECURITY_LOGGING = 'true';

// Database configuration for security tests
process.env.DATABASE_URL = 'memory://test-security-db';
process.env.PRISMA_DISABLE_WARNINGS = 'true';

// Security test specific settings
process.env.MAX_LOGIN_ATTEMPTS = '5';
process.env.LOCKOUT_DURATION = '1800000'; // 30 minutes in ms
process.env.TOKEN_EXPIRY = '3600'; // 1 hour in seconds
process.env.BCRYPT_ROUNDS = '10'; // Lower rounds for faster tests

// API security settings
process.env.API_RATE_LIMIT = '100'; // Requests per minute
process.env.API_TIMEOUT = '5000'; // 5 seconds
process.env.MAX_REQUEST_SIZE = '1mb';

// CORS settings for security tests
process.env.ALLOWED_ORIGINS = 'http://localhost:3000,https://localhost:3000';
process.env.CSRF_PROTECTION = 'true';

// Logging configuration
process.env.LOG_LEVEL = 'error'; // Reduce noise in tests
process.env.SECURITY_LOG_LEVEL = 'debug'; // Detailed security logging

// Disable features that might interfere with security tests
process.env.DISABLE_TELEMETRY = 'true';
process.env.DISABLE_ANALYTICS = 'true';
process.env.DISABLE_METRICS = 'true';

// Cache settings for security tests
process.env.REDIS_URL = 'memory://test-redis';
process.env.CACHE_TTL = '300'; // 5 minutes

// Email settings for security tests (disable)
process.env.DISABLE_EMAILS = 'true';
process.env.EMAIL_PROVIDER = 'mock';

// File upload settings for security tests
process.env.MAX_FILE_SIZE = '1mb';
process.env.ALLOWED_FILE_TYPES = 'jpg,jpeg,png,pdf,doc,docx';

// Security headers configuration
process.env.ENABLE_SECURITY_HEADERS = 'true';
process.env.CSP_ENABLED = 'true';
process.env.HSTS_ENABLED = 'true';

console.log('🔒 Security test environment configured');
console.log('📝 Security logging enabled');
console.log('🛡️ All security features activated for testing');