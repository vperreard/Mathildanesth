import { NextResponse } from 'next/server';

/**
 * GET /api/test/ping
 * Point de terminaison simple pour vérifier si l'API est disponible
 * Utile pour les tests Cypress
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
} 