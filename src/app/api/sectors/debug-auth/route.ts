import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    console.log("🔍 Debug Auth - Requête reçue");

    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');
    const authCookie = request.cookies.get('auth_token');

    return NextResponse.json({
        message: "Diagnostic d'authentification",
        headers: {
            userId,
            userRole,
            hasAuthCookie: !!authCookie,
            cookieValue: authCookie?.value ? "PRÉSENT" : "ABSENT"
        },
        allHeaders: Object.fromEntries(request.headers.entries()),
        authenticated: !!(userRole && userId),
        timestamp: new Date().toISOString()
    });
} 