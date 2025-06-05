import { NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import fs from 'fs';
import path from 'path';

/**
 * Route API pour récupérer les résultats des tests de performance
 * @returns {NextResponse} - Résultats des tests de performance au format JSON
 */
export async function GET() {
    try {
        // Chemin vers le fichier de résultats
        const resultsPath = path.join(process.cwd(), 'results', 'performance.json');

        // Vérifier si le fichier existe
        if (!fs.existsSync(resultsPath)) {
            return NextResponse.json({ error: 'Aucun résultat de test disponible' }, { status: 404 });
        }

        // Lire le fichier de résultats
        const fileContents = fs.readFileSync(resultsPath, 'utf8');
        const results = JSON.parse(fileContents);

        // Ajouter les en-têtes CORS pour permettre l'accès depuis n'importe où pendant le développement
        return NextResponse.json(results, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    } catch (error) {
        logger.error('Erreur lors de la récupération des résultats de performance:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
} 