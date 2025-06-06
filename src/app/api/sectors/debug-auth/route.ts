import { NextRequest, NextResponse } from 'next/server';

import { logger } from "@/lib/logger";
import { getServerSession } from '@/lib/auth/migration-shim';
import { authOptions } from '@/lib/auth/migration-shim';
export async function GET(request: NextRequest) {
    logger.info("🔍 Debug Auth - Requête reçue");

    const userRole = request.headers.get('x-user-role');
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
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