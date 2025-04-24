import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
    // Récupérer tous les headers
    const headersList = headers();
    const allHeaders: Record<string, string> = {};

    headersList.forEach((value, key) => {
        allHeaders[key] = value;
    });

    // Vérifier si le middleware a été exécuté
    const middlewareExecuted = headersList.get('x-middleware-executed');

    return NextResponse.json({
        message: 'Test API pour vérifier le middleware',
        middlewareExecuted: middlewareExecuted ? true : false,
        allHeaders
    });
} 