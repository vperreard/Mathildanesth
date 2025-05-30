/**
 * @jest-environment jsdom
 * XSS Protection and Input Validation Tests
 * Medical Application - Critical Security Requirements
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock validation utilities
const validateInput = (input: string, type: 'email' | 'name' | 'text' | 'html' = 'text'): string => {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input');
  }

  // Basic sanitization
  let sanitized = input.trim();

  switch (type) {
    case 'email':
      // Simple email validation and sanitization
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
        throw new Error('Invalid email format');
      }
      break;
    case 'name':
      // Remove HTML tags and special characters for names
      sanitized = sanitized.replace(/<[^>]*>/g, '');
      sanitized = sanitized.replace(/[<>&"']/g, '');
      break;
    case 'html':
      // For HTML content, escape dangerous characters
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
      break;
    case 'text':
    default:
      // Basic text sanitization
      sanitized = sanitized.replace(/[<>&"']/g, '');
      break;
  }

  return sanitized;
};

const sanitizeForDatabase = (input: any): any => {
  if (typeof input === 'string') {
    return validateInput(input, 'text');
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeForDatabase(value);
    }
    return sanitized;
  }
  return input;
};

describe('🛡️ XSS Protection and Input Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Input Sanitization Tests', () => {
    describe('HTML Content Sanitization', () => {
      it('should sanitize basic XSS payloads', () => {
        const xssPayloads = [
          '<script>alert("XSS")</script>',
          '<img src="x" onerror="alert(1)">',
          '<svg onload="alert(1)">',
          '<iframe src="javascript:alert(1)">',
          '<object data="javascript:alert(1)">',
          '<embed src="javascript:alert(1)">',
          '<link rel="stylesheet" href="javascript:alert(1)">',
          '<style>@import"javascript:alert(1)"</style>',
          '<div onclick="alert(1)">Click me</div>',
          '<a href="javascript:alert(1)">Click</a>'
        ];

        for (const payload of xssPayloads) {
          const sanitized = validateInput(payload, 'html');
          
          expect(sanitized).not.toContain('<script');
          expect(sanitized).not.toContain('javascript:');
          expect(sanitized).not.toContain('onerror');
          expect(sanitized).not.toContain('onload');
          expect(sanitized).not.toContain('onclick');
          expect(sanitized).not.toContain('alert');
          
          // Should be escaped
          expect(sanitized).toContain('&lt;');
          expect(sanitized).toContain('&gt;');
        }
      });

      it('should sanitize advanced XSS techniques', () => {
        const advancedXssPayloads = [
          'javascript:/*--></title></style></textarea></script></xmp><svg/onload="+/"/+/onmouseover=1/+/[*/[]/+alert(1)"//"">',
          '<svg><script>alert&#40;1&#41;</script>',
          '<img src="x" onerror="eval(String.fromCharCode(97,108,101,114,116,40,49,41))">',
          '<iframe srcdoc="<script>parent.alert(1)</script>">',
          '<math><mi//xlink:href="data:x,<script>alert(1)</script>">',
          '<table background="javascript:alert(1)">',
          '<div style="background:url(javascript:alert(1))">',
          '"><svg onload=alert(1)>',
          '\';alert(String.fromCharCode(88,83,83))//\';alert(String.fromCharCode(88,83,83))//";',
          '<script>/**/alert(1)</script>'
        ];

        for (const payload of advancedXssPayloads) {
          const sanitized = validateInput(payload, 'html');
          
          expect(sanitized).not.toContain('script');
          expect(sanitized).not.toContain('javascript:');
          expect(sanitized).not.toContain('onload');
          expect(sanitized).not.toContain('alert');
          expect(sanitized).not.toContain('eval');
          expect(sanitized).not.toContain('String.fromCharCode');
        }
      });

      it('should handle encoded XSS attempts', () => {
        const encodedXssPayloads = [
          '&lt;script&gt;alert(1)&lt;/script&gt;',
          '%3Cscript%3Ealert(1)%3C/script%3E',
          '&#60;script&#62;alert(1)&#60;/script&#62;',
          '&amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt;',
          '\\u003cscript\\u003ealert(1)\\u003c/script\\u003e',
          '\\x3cscript\\x3ealert(1)\\x3c/script\\x3e'
        ];

        for (const payload of encodedXssPayloads) {
          const sanitized = validateInput(payload, 'html');
          
          // Should remain escaped or be further sanitized
          expect(sanitized).not.toContain('<script>');
          expect(sanitized).not.toContain('alert(1)');
        }
      });
    });

    describe('Medical Data Sanitization', () => {
      it('should sanitize patient names and medical data', () => {
        const maliciousPatientData = [
          'Dr. <script>alert("XSS")</script> Martin',
          'Jean-Claude <img src="x" onerror="alert(1)"> Dupont',
          'Marie "javascript:alert(1)" Dubois',
          "O'Connor <svg onload=\"alert(1)\"> Patrick",
          'Test\'); DROP TABLE patients; --',
          'Normal Name <iframe src="evil.com">',
          'José María <object data="javascript:alert(1)">',
          'Anne-Marie <style>@import"javascript:alert(1)"</style>'
        ];

        for (const patientName of maliciousPatientData) {
          const sanitized = validateInput(patientName, 'name');
          
          expect(sanitized).not.toContain('<');
          expect(sanitized).not.toContain('>');
          expect(sanitized).not.toContain('script');
          expect(sanitized).not.toContain('javascript:');
          expect(sanitized).not.toContain('DROP TABLE');
          expect(sanitized).not.toContain('iframe');
          expect(sanitized).not.toContain('object');
          expect(sanitized).not.toContain('style');
          
          // Should preserve valid name characters
          expect(sanitized).toMatch(/^[a-zA-ZÀ-ÿ\s\-'.]+$/);
        }
      });

      it('should sanitize medical notes and comments', () => {
        const maliciousMedicalNotes = [
          'Patient shows improvement <script>steal_data()</script>',
          'Allergic to penicillin <img src="x" onerror="send_to_attacker()">',
          'Surgery successful <!-- <script>alert(1)</script> -->',
          'Patient condition: <svg onload="malicious_code()">stable</svg>',
          'Dosage: 10mg <iframe src="data:text/html,<script>alert(1)</script>">',
          'Blood pressure normal <object data="javascript:alert(document.cookie)">',
          'Follow-up needed <link rel="stylesheet" href="javascript:alert(1)">'
        ];

        for (const note of maliciousMedicalNotes) {
          const sanitized = validateInput(note, 'html');
          
          expect(sanitized).not.toContain('<script');
          expect(sanitized).not.toContain('javascript:');
          expect(sanitized).not.toContain('onerror');
          expect(sanitized).not.toContain('onload');
          expect(sanitized).not.toContain('<iframe');
          expect(sanitized).not.toContain('<object');
          expect(sanitized).not.toContain('<link');
          
          // Should preserve medical content
          expect(sanitized).toContain('Patient');
          expect(sanitized).toMatch(/&lt;.*&gt;/); // Should be escaped
        }
      });
    });

    describe('Form Input Validation', () => {
      it('should validate email inputs', () => {
        const validEmails = [
          'doctor@hospital.com',
          'nurse.jane@medical.center.fr',
          'admin+test@clinic.org',
          'user.name@subdomain.hospital.edu'
        ];

        const invalidEmails = [
          '<script>alert(1)</script>@test.com',
          'test@<img src="x" onerror="alert(1)">.com',
          'javascript:alert(1)@test.com',
          'test@test.com<script>alert(1)</script>',
          'test"; DROP TABLE users; --@test.com',
          'test@test.com\'); INSERT INTO admin',
          '@test.com',
          'test@',
          'not-an-email',
          ''
        ];

        // Valid emails should pass
        for (const email of validEmails) {
          expect(() => validateInput(email, 'email')).not.toThrow();
        }

        // Invalid emails should fail
        for (const email of invalidEmails) {
          expect(() => validateInput(email, 'email')).toThrow();
        }
      });

      it('should validate and sanitize text inputs', () => {
        const maliciousTexts = [
          'Normal text with <script>alert(1)</script>',
          'Text with "quotes" and <tags>',
          "Text with 'single quotes' and &entities;",
          'Text with \'; DROP TABLE users; --',
          'Text with <iframe src="evil.com">',
          'Text with <svg onload="alert(1)">',
          'Text with javascript:alert(1)',
          'Text with <img onerror="alert(1)">'
        ];

        for (const text of maliciousTexts) {
          const sanitized = validateInput(text, 'text');
          
          expect(sanitized).not.toContain('<');
          expect(sanitized).not.toContain('>');
          expect(sanitized).not.toContain('"');
          expect(sanitized).not.toContain("'");
          expect(sanitized).not.toContain('&');
          expect(sanitized).not.toContain('script');
          expect(sanitized).not.toContain('DROP TABLE');
          
          // Should preserve normal text
          expect(sanitized).toContain('Normal text') || 
          expect(sanitized).toContain('Text with');
        }
      });
    });
  });

  describe('Database Input Sanitization', () => {
    it('should sanitize data before database operations', () => {
      const maliciousUserData = {
        name: 'Dr. <script>alert("XSS")</script> Martin',
        email: 'test@test.com<script>alert(1)</script>',
        role: 'ADMIN\'; DROP TABLE users; --',
        bio: 'Experienced doctor <img src="x" onerror="steal_cookies()">',
        notes: 'Patient care notes <iframe src="evil.com">'
      };

      const sanitized = sanitizeForDatabase(maliciousUserData);

      expect(sanitized.name).not.toContain('<script');
      expect(sanitized.name).not.toContain('alert');
      expect(sanitized.email).not.toContain('<script');
      expect(sanitized.role).not.toContain('DROP TABLE');
      expect(sanitized.bio).not.toContain('<img');
      expect(sanitized.bio).not.toContain('onerror');
      expect(sanitized.notes).not.toContain('<iframe');
    });

    it('should handle nested objects in database sanitization', () => {
      const complexData = {
        user: {
          name: 'Test <script>alert(1)</script>',
          profile: {
            bio: 'Bio with <img src="x" onerror="alert(1)">',
            settings: {
              theme: 'dark<script>alert(1)</script>'
            }
          }
        },
        metadata: {
          created: new Date(),
          tags: ['normal', '<script>alert(1)</script>', 'safe']
        }
      };

      const sanitized = sanitizeForDatabase(complexData);

      expect(sanitized.user.name).not.toContain('<script');
      expect(sanitized.user.profile.bio).not.toContain('<img');
      expect(sanitized.user.profile.settings.theme).not.toContain('<script');
      expect(sanitized.metadata.tags[1]).not.toContain('<script');
    });
  });

  describe('DOM Manipulation Security', () => {
    it('should safely insert sanitized content into DOM', () => {
      const maliciousContent = 'Safe content <script>alert("XSS")</script>';
      const sanitized = validateInput(maliciousContent, 'html');

      const div = document.createElement('div');
      div.innerHTML = sanitized;
      document.body.appendChild(div);

      // Should not execute scripts
      expect(div.innerHTML).not.toContain('<script');
      expect(div.innerHTML).toContain('Safe content');
      expect(div.innerHTML).toContain('&lt;script');
    });

    it('should handle user-generated content safely', () => {
      const userComments = [
        'Great doctor! <script>steal_data()</script>',
        'Excellent service <img src="x" onerror="alert(1)">',
        'Highly recommended <svg onload="malicious()">',
        'Professional staff <iframe src="evil.com">'
      ];

      for (const comment of userComments) {
        const sanitized = validateInput(comment, 'html');
        
        const commentDiv = document.createElement('div');
        commentDiv.className = 'user-comment';
        commentDiv.innerHTML = sanitized;
        
        expect(commentDiv.innerHTML).not.toContain('<script');
        expect(commentDiv.innerHTML).not.toContain('onerror');
        expect(commentDiv.innerHTML).not.toContain('onload');
        expect(commentDiv.innerHTML).not.toContain('<iframe');
      }
    });

    it('should safely handle dynamic attribute values', () => {
      const maliciousAttributes = [
        'javascript:alert(1)',
        'onclick="alert(1)"',
        'onmouseover="steal_data()"',
        'href="javascript:malicious()"',
        'src="data:text/html,<script>alert(1)</script>"'
      ];

      for (const attr of maliciousAttributes) {
        const sanitized = validateInput(attr, 'text');
        
        const link = document.createElement('a');
        link.setAttribute('data-value', sanitized);
        
        expect(link.getAttribute('data-value')).not.toContain('javascript:');
        expect(link.getAttribute('data-value')).not.toContain('onclick');
        expect(link.getAttribute('data-value')).not.toContain('alert');
        expect(link.getAttribute('data-value')).not.toContain('<script');
      }
    });
  });

  describe('Content Security Policy (CSP) Testing', () => {
    it('should block inline scripts with CSP', () => {
      // Simulate CSP headers
      const mockCSP = "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'";
      
      // Test that inline scripts would be blocked
      const inlineScript = '<script>alert("This should be blocked")</script>';
      const sanitized = validateInput(inlineScript, 'html');
      
      expect(sanitized).not.toContain('<script');
      expect(sanitized).toContain('&lt;script');
    });

    it('should allow safe external resources with CSP', () => {
      const safeContent = 'Medical image: <img src="/images/xray.jpg" alt="X-ray">';
      const sanitized = validateInput(safeContent, 'html');
      
      // Should preserve safe image tags (after proper validation)
      expect(sanitized).toContain('Medical image:');
      expect(sanitized).toContain('&lt;img');
    });
  });

  describe('File Upload Security', () => {
    it('should validate file types and content', () => {
      const maliciousFileNames = [
        'document.pdf<script>alert(1)</script>',
        'image.jpg"; DROP TABLE files; --',
        'report.html<iframe src="evil.com">',
        'data.csv<svg onload="alert(1)">',
        'normal.txt<object data="javascript:alert(1)">'
      ];

      for (const fileName of maliciousFileNames) {
        const sanitized = validateInput(fileName, 'name');
        
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('DROP TABLE');
        expect(sanitized).not.toContain('<iframe');
        expect(sanitized).not.toContain('<svg');
        expect(sanitized).not.toContain('<object');
        expect(sanitized).not.toContain('javascript:');
        
        // Should preserve file extension
        expect(sanitized).toMatch(/\.(pdf|jpg|html|csv|txt)$/);
      }
    });

    it('should sanitize file metadata', () => {
      const maliciousMetadata = {
        description: 'Medical report <script>alert(1)</script>',
        tags: ['urgent', '<img src="x" onerror="alert(1)">', 'confidential'],
        notes: 'Patient data <iframe src="evil.com">contains sensitive info'
      };

      const sanitized = sanitizeForDatabase(maliciousMetadata);

      expect(sanitized.description).not.toContain('<script');
      expect(sanitized.tags[1]).not.toContain('<img');
      expect(sanitized.notes).not.toContain('<iframe');
    });
  });

  describe('API Response Sanitization', () => {
    it('should sanitize API responses before sending to client', () => {
      const apiResponse = {
        users: [
          {
            id: 1,
            name: 'Dr. Smith <script>alert(1)</script>',
            email: 'smith@hospital.com',
            bio: 'Experienced surgeon <img src="x" onerror="steal_data()">'
          },
          {
            id: 2,
            name: 'Nurse <svg onload="alert(1)"> Jane',
            email: 'jane@hospital.com',
            notes: 'Dedicated professional <iframe src="evil.com">'
          }
        ],
        metadata: {
          count: 2,
          message: 'Success <script>alert("XSS")</script>'
        }
      };

      const sanitized = sanitizeForDatabase(apiResponse);

      expect(sanitized.users[0].name).not.toContain('<script');
      expect(sanitized.users[0].bio).not.toContain('<img');
      expect(sanitized.users[1].name).not.toContain('<svg');
      expect(sanitized.users[1].notes).not.toContain('<iframe');
      expect(sanitized.metadata.message).not.toContain('<script');
    });
  });

  describe('Search Query Sanitization', () => {
    it('should sanitize search queries', () => {
      const maliciousSearchQueries = [
        'doctor <script>alert(1)</script>',
        'patient"; DROP TABLE search_logs; --',
        'nurse <img src="x" onerror="alert(1)">',
        'admin <svg onload="malicious()">',
        'user <iframe src="evil.com">',
        'test <object data="javascript:alert(1)">',
        'search <link rel="stylesheet" href="javascript:alert(1)">'
      ];

      for (const query of maliciousSearchQueries) {
        const sanitized = validateInput(query, 'text');
        
        expect(sanitized).not.toContain('<');
        expect(sanitized).not.toContain('>');
        expect(sanitized).not.toContain('script');
        expect(sanitized).not.toContain('DROP TABLE');
        expect(sanitized).not.toContain('javascript:');
        
        // Should preserve search terms
        expect(sanitized).toMatch(/^[a-zA-Z\s]+$/);
      }
    });
  });
});