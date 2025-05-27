import { NextRequest } from 'next/server';

// Mock NextResponse
jest.mock('next/server', () => ({
    NextRequest: jest.requireActual('next/server').NextRequest,
    NextResponse: {
        json: (data: any, init?: ResponseInit) => {
            const response = new Response(JSON.stringify(data), {
                ...init,
                headers: {
                    'content-type': 'application/json',
                    ...(init?.headers || {})
                }
            });
            return response;
        }
    }
}));

describe('POST /api/auth/logout', () => {
    let handler: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        const route = await import('@/app/api/auth/logout/route');
        handler = route.POST;
    });

    const createRequest = () => {
        return new NextRequest('http://localhost:3000/api/auth/logout', {
            method: 'POST',
            headers: {
                'cookie': 'auth-token=valid_token',
            },
        });
    };

    it('should successfully logout and clear cookie', async () => {
        const request = createRequest();
        const response = await handler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Déconnexion réussie');

        // Check that auth cookie is cleared
        const setCookieHeader = response.headers.get('set-cookie');
        expect(setCookieHeader).toBeTruthy();
        expect(setCookieHeader).toContain('auth-token=');
        expect(setCookieHeader).toContain('Max-Age=0');
    });

    it('should handle logout even without existing auth cookie', async () => {
        const request = new NextRequest('http://localhost:3000/api/auth/logout', {
            method: 'POST',
        });

        const response = await handler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Déconnexion réussie');
    });

    it('should set secure cookie flags in production', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const request = createRequest();
        const response = await handler(request);

        const setCookieHeader = response.headers.get('set-cookie');
        expect(setCookieHeader).toContain('HttpOnly');
        expect(setCookieHeader).toContain('SameSite=Strict');

        process.env.NODE_ENV = originalEnv;
    });
});