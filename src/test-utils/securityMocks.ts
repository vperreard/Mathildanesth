/**
 * @file Security-focused Mock Utilities for Auth Testing
 * @description Provides secure, reusable mocks for JWT, roles, sessions, and security testing
 */

import { Role, UserStatus } from '@prisma/client';
import type { User } from '@/types/user';

export interface SecurityMockUser extends Partial<User> {
    id: number;
    email: string;
    nom: string;
    prenom: string;
    role: Role;
    userStatus?: UserStatus;
    professionalRole?: string;
    loginAttempts?: number;
    lockedUntil?: Date | null;
    lastLogin?: Date;
    sites?: Array<{ id: number; name: string; }>;
}

export interface JWTMockPayload {
    userId: number;
    login: string;
    role: Role;
    iat?: number;
    exp?: number;
}

export interface SecurityTestScenario {
    name: string;
    user: SecurityMockUser;
    token: string;
    expectedStatus: number;
    expectedAccess: boolean;
}

/**
 * Medical role hierarchy for testing
 */
export const MEDICAL_ROLES = {
    MAR: 'MAR',
    IADE: 'IADE', 
    CHIRURGIEN: 'CHIRURGIEN',
    ANESTHESISTE: 'ANESTHESISTE',
    INFIRMIER: 'INFIRMIER'
} as const;

/**
 * Security attack payloads for testing
 */
export const SECURITY_ATTACK_PAYLOADS = {
    SQL_INJECTION: [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "' UNION SELECT * FROM users --",
        "admin' --",
        "' OR 1=1 #",
        "'; UPDATE users SET role='ADMIN' WHERE id=1; --",
        "1' UNION SELECT password FROM users WHERE '1'='1",
        "' UNION SELECT NULL,username,password FROM users --"
    ],
    XSS_PAYLOADS: [
        "<script>alert('xss')</script>",
        "javascript:alert('xss')",
        "<img src=x onerror=alert('xss')>",
        "<svg onload=alert('xss')>",
        "';alert('xss');//",
        "<iframe src='javascript:alert(\"xss\")'></iframe>",
        "<<SCRIPT>alert('xss')</SCRIPT>",
        "<BODY ONLOAD=alert('xss')>"
    ],
    JWT_ATTACKS: [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.TAMPERED_SIGNATURE',
        'invalid.jwt.token',
        'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOjEsImV4cCI6OTk5OTk5OTk5OX0.',
        '', // Empty token
        'Bearer malformed',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.invalid', // Empty payload with invalid signature
        'null',
        'undefined'
    ],
    TIMING_ATTACK_EMAILS: [
        'existing@example.com',
        'nonexistent@example.com',
        'admin@example.com',
        'test@example.com',
        'user@example.com'
    ]
} as const;

/**
 * Create a mock user with security defaults
 */
export function createSecureMockUser(overrides: Partial<SecurityMockUser> = {}): SecurityMockUser {
    return {
        id: 1,
        email: 'test@example.com',
        nom: 'Doe',
        prenom: 'John',
        role: Role.USER,
        userStatus: UserStatus.ACTIF,
        professionalRole: MEDICAL_ROLES.MAR,
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
        sites: [{ id: 1, name: 'Site Test' }],
        ...overrides
    };
}

/**
 * Create a mock admin user
 */
export function createMockAdminUser(level: 'TOTAL' | 'PARTIEL' = 'TOTAL'): SecurityMockUser {
    return createSecureMockUser({
        role: level === 'TOTAL' ? Role.ADMIN_TOTAL : Role.ADMIN_PARTIEL,
        professionalRole: MEDICAL_ROLES.MAR,
        email: `admin-${level.toLowerCase()}@example.com`,
        sites: [
            { id: 1, name: 'Site Principal' },
            { id: 2, name: 'Site Secondaire' }
        ]
    });
}

/**
 * Create a locked user for brute force testing
 */
export function createLockedUser(): SecurityMockUser {
    return createSecureMockUser({
        loginAttempts: 5,
        lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // Locked for 15 minutes
        userStatus: UserStatus.SUSPENDU
    });
}

/**
 * Create medical professional users
 */
export function createMedicalProfessionals(): SecurityMockUser[] {
    return [
        createSecureMockUser({
            professionalRole: MEDICAL_ROLES.MAR,
            email: 'mar@example.com',
            role: Role.USER
        }),
        createSecureMockUser({
            professionalRole: MEDICAL_ROLES.IADE,
            email: 'iade@example.com',
            role: Role.USER
        }),
        createSecureMockUser({
            professionalRole: MEDICAL_ROLES.CHIRURGIEN,
            email: 'chirurgien@example.com',
            role: Role.USER
        })
    ];
}

/**
 * Generate a mock JWT payload
 */
export function createMockJWTPayload(user: SecurityMockUser): JWTMockPayload {
    return {
        userId: user.id,
        login: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
}

/**
 * Generate an expired JWT payload
 */
export function createExpiredJWTPayload(user: SecurityMockUser): JWTMockPayload {
    return {
        userId: user.id,
        login: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000) - (25 * 60 * 60), // 25 hours ago
        exp: Math.floor(Date.now() / 1000) - (1 * 60 * 60)   // 1 hour ago (expired)
    };
}

/**
 * Security test scenarios for role-based access testing
 */
export function getRoleBasedAccessScenarios(): SecurityTestScenario[] {
    return [
        {
            name: 'Regular user access',
            user: createSecureMockUser(),
            token: 'valid_user_token',
            expectedStatus: 200,
            expectedAccess: true
        },
        {
            name: 'Admin total access',
            user: createMockAdminUser('TOTAL'),
            token: 'valid_admin_total_token',
            expectedStatus: 200,
            expectedAccess: true
        },
        {
            name: 'Admin partiel access',
            user: createMockAdminUser('PARTIEL'),
            token: 'valid_admin_partiel_token',
            expectedStatus: 200,
            expectedAccess: true
        },
        {
            name: 'Inactive user access',
            user: createSecureMockUser({ userStatus: UserStatus.INACTIF }),
            token: 'valid_but_inactive_token',
            expectedStatus: 200, // Auth might succeed but business logic should handle
            expectedAccess: false
        },
        {
            name: 'Suspended user access',
            user: createSecureMockUser({ userStatus: UserStatus.SUSPENDU }),
            token: 'valid_but_suspended_token',
            expectedStatus: 200, // Auth might succeed but business logic should handle
            expectedAccess: false
        },
        {
            name: 'Locked user access',
            user: createLockedUser(),
            token: 'valid_but_locked_token',
            expectedStatus: 200, // Auth might succeed but business logic should handle
            expectedAccess: false
        }
    ];
}

/**
 * Mock Prisma responses for security testing
 */
export function createSecurePrismaMocks() {
    return {
        user: {
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            delete: jest.fn()
        },
        auditLog: {
            create: jest.fn()
        },
        session: {
            findMany: jest.fn(),
            deleteMany: jest.fn()
        }
    };
}

/**
 * Mock bcrypt for security testing
 */
export function createSecureBcryptMocks() {
    return {
        compare: jest.fn(),
        hash: jest.fn(),
        genSalt: jest.fn()
    };
}

/**
 * Mock JWT utilities for security testing
 */
export function createSecureJWTMocks() {
    return {
        sign: jest.fn(),
        verify: jest.fn(),
        decode: jest.fn()
    };
}

/**
 * Security headers for testing
 */
export const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
} as const;

/**
 * Rate limiting test scenarios
 */
export function getRateLimitingScenarios() {
    return {
        RAPID_REQUESTS: 10,
        BRUTE_FORCE_ATTEMPTS: 20,
        CONCURRENT_USERS: 5,
        TIME_WINDOW_MS: 60000 // 1 minute
    };
}

/**
 * CORS test origins
 */
export const CORS_TEST_ORIGINS = {
    TRUSTED: [
        'https://example.com',
        'https://medical-app.com',
        'http://localhost:3000'
    ],
    MALICIOUS: [
        'http://malicious-site.com',
        'https://phishing-example.com',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'file://etc/passwd'
    ]
} as const;

/**
 * Medical terminology security test data
 */
export const MEDICAL_SECURITY_DATA = {
    VALID_DEPARTMENTS: ['Anesthésie', 'Chirurgie', 'Urgences', 'Réanimation'],
    VALID_SPECIALTIES: ['Anesthésie-Réanimation', 'Chirurgie Générale', 'Cardiologie'],
    VALID_ROOM_TYPES: ['Bloc Opératoire', 'Salle de Réveil', 'Consultation'],
    MALICIOUS_INPUTS: [
        '<script>alert("Hack hôpital")</script>',
        '"; DROP TABLE patients; --',
        '../../../etc/passwd',
        '${process.env.DATABASE_URL}'
    ]
} as const;

/**
 * Session security utilities
 */
export function createSessionSecurityMocks() {
    return {
        createSession: jest.fn(),
        validateSession: jest.fn(),
        invalidateSession: jest.fn(),
        refreshSession: jest.fn(),
        checkConcurrentSessions: jest.fn()
    };
}

/**
 * Audit logging mocks for security testing
 */
export function createAuditSecurityMocks() {
    return {
        logLogin: jest.fn(),
        logLogout: jest.fn(),
        logFailedAttempt: jest.fn(),
        logSuspiciousActivity: jest.fn(),
        logPrivilegeEscalation: jest.fn(),
        logDataAccess: jest.fn()
    };
}