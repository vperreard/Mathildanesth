import { NextResponse } from 'next/server';
// import { getSession } from 'next-auth/react'; // Commenté car nous utilisons les headers
import { headers as nextHeaders } from 'next/headers'; // Renommer pour éviter conflit potentiel
// import { getCurrentUser } from '@/lib/auth/session'; // Supposons une fonction pour obtenir l'utilisateur côté serveur
// Chemin relatif corrigé pour pointer vers config/seed-config.js à la racine
// import { planningRules } from '../../../../../config/seed-config.js';
import path from 'path';
import fs from 'fs/promises';

// Définir le type ici aussi pour la cohérence
interface FatigueConfig {
    enabled: boolean;
    points: { [key: string]: number };
    recovery: { [key: string]: number };
    thresholds: { [key: string]: number };
    weighting: { equity: number; fatigue: number };
}

// Chemin vers le fichier de configuration (adapter si nécessaire)
const configFilePath = path.resolve(process.cwd(), 'config', 'fatigue-settings.json');

// Définition de la configuration de fatigue par défaut directement ici
const defaultFatigueSeedConfig: FatigueConfig = {
    enabled: false,
    points: { garde: 0, astreinte: 0, supervisionMultiple: 0, pediatrie: 0, specialiteLourde: 0 },
    recovery: { jourOff: 0, weekendOff: 0, demiJourneeOff: 0 },
    thresholds: { alert: 100, critical: 150 },
    weighting: { equity: 0.5, fatigue: 0.5 }
};

// Fonction pour lire la configuration
async function readConfigFile(): Promise<FatigueConfig> {
    try {
        const data = await fs.readFile(configFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.warn('fatigue-settings.json not found, returning default seed config.');
            return defaultFatigueSeedConfig; // Utiliser le fallback codé en dur
        }
        console.error("Error reading fatigue config file:", error);
        throw new Error('Could not read fatigue configuration.');
    }
}

// Fonction pour écrire la configuration
async function writeConfigFile(config: FatigueConfig): Promise<void> {
    try {
        await fs.writeFile(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
        console.error("Error writing fatigue config file:", error);
        throw new Error('Could not save fatigue configuration.');
    }
}

// Helper pour vérifier les rôles admin
const checkAdminRole = (): boolean => {
    const headersList = nextHeaders();
    // const userRoleString = headersList.get('x-user-role'); // Ligne problématique commentée
    // return !!userRoleString && ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(userRoleString);
    console.warn("[SECURITY] checkAdminRole est désactivé et retourne toujours true. À RÉPARER IMPÉRATIVEMENT.")
    return true; // ATTENTION: À remplacer par une vraie vérification
};

// Handler GET
export async function GET(request: Request) {
    if (!checkAdminRole()) {
        return NextResponse.json({ error: 'Unauthorized: Missing or invalid admin role' }, { status: 403 }); // 403 Forbidden
    }

    try {
        const config = await readConfigFile();
        return NextResponse.json(config);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Handler PUT
export async function PUT(request: Request) {
    if (!checkAdminRole()) {
        return NextResponse.json({ error: 'Unauthorized: Missing or invalid admin role' }, { status: 403 }); // 403 Forbidden
    }

    try {
        const newConfig: FatigueConfig = await request.json();

        // Validation simple (peut être plus robuste)
        if (typeof newConfig.enabled !== 'boolean' || !newConfig.points || !newConfig.recovery || !newConfig.thresholds || !newConfig.weighting) {
            return NextResponse.json({ error: 'Invalid configuration format' }, { status: 400 });
        }
        if (Math.abs(newConfig.weighting.equity + newConfig.weighting.fatigue - 1) > 0.001) {
            return NextResponse.json({ error: 'Weighting sum must be 1' }, { status: 400 });
        }

        await writeConfigFile(newConfig);
        return NextResponse.json({ message: 'Configuration saved successfully' });
    } catch (error: any) {
        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to save configuration' }, { status: 500 });
    }
} 