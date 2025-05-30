/**
 * Security Tests Setup
 * Configures environment and mocks for security testing
 */

// Enhanced error handling for security tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in Security Test:', reason);
  throw reason;
});

// Security test globals
global.SECURITY_TEST_MODE = true;
global.SECURITY_TIMEOUT = 10000;

// Mock console for security tests to capture potential information leakage
const originalConsole = { ...console };
global.securityTestLogs = [];

beforeEach(() => {
  global.securityTestLogs = [];
  
  // Capture console logs during security tests
  console.log = (...args) => {
    global.securityTestLogs.push({ level: 'log', args });
    originalConsole.log(...args);
  };
  
  console.warn = (...args) => {
    global.securityTestLogs.push({ level: 'warn', args });
    originalConsole.warn(...args);
  };
  
  console.error = (...args) => {
    global.securityTestLogs.push({ level: 'error', args });
    originalConsole.error(...args);
  };
});

afterEach(() => {
  // Restore console
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  
  // Check for potential security information leakage in logs
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /api[_-]?key/i,
    /private[_-]?key/i,
    /database[_-]?url/i,
    /connection[_-]?string/i
  ];
  
  global.securityTestLogs.forEach(log => {
    const logString = log.args.join(' ');
    sensitivePatterns.forEach(pattern => {
      if (pattern.test(logString)) {
        console.warn(`⚠️ Potential sensitive data in ${log.level} log:`, logString);
      }
    });
  });
});

// Security test utilities
global.createMaliciousPayload = (type = 'xss') => {
  const payloads = {
    xss: [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(1)">',
      '<svg onload="alert(1)">',
      'javascript:alert(1)',
      '"><script>alert(1)</script>'
    ],
    sql: [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'; DELETE FROM users; --",
      "1 UNION SELECT * FROM admin",
      "'; INSERT INTO admin VALUES ('hacker'); --"
    ],
    injection: [
      "'; system('rm -rf /'); --",
      "../../../etc/passwd",
      "${7*7}",
      "{{7*7}}",
      "<%=7*7%>"
    ]
  };
  
  return payloads[type] || payloads.xss;
};

global.validateNoSensitiveDataLeakage = (response) => {
  const responseString = JSON.stringify(response);
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /private[_-]?key/i,
    /database[_-]?url/i,
    /jwt[_-]?secret/i
  ];
  
  sensitivePatterns.forEach(pattern => {
    if (pattern.test(responseString)) {
      throw new Error(`Potential sensitive data leakage detected: ${pattern}`);
    }
  });
};

// Mock fetch for security tests
global.mockSecureFetch = (mockResponses = {}) => {
  global.fetch = jest.fn((url, options = {}) => {
    // Validate request security
    if (options.method === 'POST' || options.method === 'PUT') {
      const contentType = options.headers?.['Content-Type'] || options.headers?.['content-type'];
      if (!contentType || !contentType.includes('application/json')) {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: 'Invalid content type' })
        });
      }
    }
    
    // Return mock response
    const mockResponse = mockResponses[url] || { ok: true, status: 200, json: () => Promise.resolve({}) };
    return Promise.resolve(mockResponse);
  });
};

// Security assertion helpers
global.expectSecureResponse = (response) => {
  expect(response).toBeDefined();
  expect(response.status).toBeDefined();
  
  if (response.status >= 200 && response.status < 300) {
    // Success responses should not leak sensitive data
    global.validateNoSensitiveDataLeakage(response);
  }
  
  // Check for security headers (if applicable)
  if (response.headers) {
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];
    
    securityHeaders.forEach(header => {
      if (response.headers[header]) {
        console.log(`✅ Security header present: ${header}`);
      }
    });
  }
};

global.expectAuthenticationRequired = (response) => {
  expect(response.status).toBe(401);
  expect(response.body || response.data).toEqual(
    expect.objectContaining({
      error: expect.stringMatching(/authentication|login|unauthorized/i)
    })
  );
};

global.expectAuthorizationDenied = (response) => {
  expect(response.status).toBe(403);
  expect(response.body || response.data).toEqual(
    expect.objectContaining({
      error: expect.stringMatching(/authorization|permission|forbidden/i)
    })
  );
};

// Security test data generators
global.generateSecureTestUser = (role = 'USER') => ({
  id: Math.floor(Math.random() * 1000) + 1,
  email: `test${Date.now()}@hospital.com`,
  name: `Test User ${Date.now()}`,
  role,
  active: true,
  loginAttempts: 0,
  lockedUntil: null,
  lastLogin: null,
  createdAt: new Date(),
  updatedAt: new Date()
});

global.generateMaliciousInput = () => ({
  xssScript: '<script>alert("XSS")</script>',
  sqlInjection: "'; DROP TABLE users; --",
  pathTraversal: '../../../etc/passwd',
  commandInjection: '; cat /etc/passwd',
  htmlInjection: '<img src="x" onerror="alert(1)">',
  jsInjection: 'javascript:alert(1)',
  xmlInjection: '<!ENTITY xxe SYSTEM "file:///etc/passwd">',
  ldapInjection: '*)|(uid=*',
  nosqlInjection: '{"$ne": null}',
  templateInjection: '{{7*7}}'
});

// Performance monitoring for security tests
global.monitorSecurityTestPerformance = () => {
  const startTime = process.hrtime.bigint();
  
  return {
    end: () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      if (duration > 5000) { // More than 5 seconds
        console.warn(`⚠️ Security test took ${duration}ms - potential DoS vulnerability`);
      }
      
      return duration;
    }
  };
};

// Rate limiting test helper
global.simulateRateLimit = async (requestFunction, maxRequests = 5, timeWindow = 1000) => {
  const requests = [];
  
  for (let i = 0; i < maxRequests + 2; i++) {
    requests.push(requestFunction());
  }
  
  const results = await Promise.allSettled(requests);
  
  // Should have some requests that fail due to rate limiting
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  return { successful, failed, total: results.length };
};

console.log('🔒 Security test setup complete');
console.log('📊 Security test utilities loaded');
console.log('⚡ Ready for comprehensive security testing');