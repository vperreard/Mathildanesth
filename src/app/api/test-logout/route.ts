import { NextResponse } from 'next/server';

import { logger } from "@/lib/logger";
export async function GET() {
    const response = NextResponse.redirect(new URL('/planning', 'http://localhost:3000'));
    
    // Clear the auth_token cookie
    response.cookies.set('auth_token', '', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        expires: new Date(0)
    });
    
    logger.info('[TEST-LOGOUT] Cookie cleared, redirecting to /planning');
    
    return response;
}