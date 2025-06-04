import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyAuthToken, getAuthTokenServer } from '../../../../lib/auth-server-utils';

// Configuration par défaut simple
const defaultPreferences = {
    defaultView: 'month',
    showWeekends: true,
    showHolidays: true,
    colorScheme: 'default',
    notifications: {
        email: true,
        sound: false,
        browser: true
    }
};

export async function GET(request: NextRequest) {
    try {
        const tokenFromHeader = request.headers.get('Authorization')?.replace('Bearer ', '');
        const tokenFromCookie = await getAuthTokenServer();
        const authToken = tokenFromHeader || tokenFromCookie;

        if (!authToken) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }
        
        const authResult = await verifyAuthToken(authToken);
        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json({ error: authResult.error || 'Session invalide' }, { status: 401 });
        }

        // Chercher les paramètres de calendrier utilisateur
        const userSettings = await prisma.userCalendarSettings.findUnique({
            where: { userId: authResult.userId }
        });

        // Si pas de paramètres, retourner la config par défaut
        const currentPreferences = userSettings ? {
            defaultView: userSettings.defaultView,
            showWeekends: userSettings.showWeekends,
            showHolidays: userSettings.showHolidays,
            colorScheme: userSettings.colorScheme,
            notifications: userSettings.notifications as any
        } : defaultPreferences;
        
        return NextResponse.json(currentPreferences, {
            headers: {
                'Cache-Control': 'private, max-age=300'
            }
        });

    } catch (error) {
        console.error("Erreur GET /api/user/preferences:", error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const tokenFromHeader = request.headers.get('Authorization')?.replace('Bearer ', '');
        const tokenFromCookie = await getAuthTokenServer();
        const authToken = tokenFromHeader || tokenFromCookie;

        if (!authToken) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
        }
        
        const authResult = await verifyAuthToken(authToken);
        if (!authResult.authenticated || !authResult.userId) {
            return NextResponse.json({ error: authResult.error || 'Session invalide' }, { status: 401 });
        }

        const preferences = await request.json();
        
        // Mettre à jour ou créer les paramètres de calendrier utilisateur
        await prisma.userCalendarSettings.upsert({
            where: { userId: authResult.userId },
            update: {
                defaultView: preferences.defaultView || 'month',
                showWeekends: preferences.showWeekends ?? true,
                showHolidays: preferences.showHolidays ?? true,
                colorScheme: preferences.colorScheme || 'default',
                notifications: preferences.notifications || { email: true, sound: false, browser: true },
                updatedAt: new Date()
            },
            create: {
                userId: authResult.userId,
                defaultView: preferences.defaultView || 'month',
                showWeekends: preferences.showWeekends ?? true,
                showHolidays: preferences.showHolidays ?? true,
                colorScheme: preferences.colorScheme || 'default',
                notifications: preferences.notifications || { email: true, sound: false, browser: true }
            }
        });
        
        return NextResponse.json({ 
            message: 'Préférences mises à jour avec succès',
            preferences 
        });

    } catch (error) {
        console.error("Erreur POST /api/user/preferences:", error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}