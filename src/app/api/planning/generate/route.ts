import { NextResponse } from 'next/server';
import { PlanningGenerator } from '@/services/planningGenerator';
import { ApiService } from '@/services/api'; // Supposons que l'ApiService peut aussi être utilisé côté serveur si nécessaire
import { GenerationParameters } from '@/types/assignment';
import { defaultRulesConfiguration, defaultFatigueConfig } from '@/types/rules';

export async function POST(request: Request) {
    try {
        const params: GenerationParameters = await request.json();

        // Ici, idéalement, on récupère les données réelles (users, assignments) via un accès direct DB ou un service interne
        // Pour l'exemple, utilisons une méthode fictive ou supposons un accès DB via Prisma/autre ORM
        // const users = await db.user.findMany({ where: { actif: true } });
        // const existingAssignments = await db.assignment.findMany({ where: { date: { gte: params.dateDebut, lte: params.dateFin } } });
        // Remplacer par la vraie logique de récupération de données
        const api = ApiService.getInstance(); // Attention: l'ApiService fetch peut ne pas être idéal ici.
        const users = await api.getActiveUsers(); // Préférer un accès direct à la base de données
        const existingAssignments = await api.getExistingAssignments(params.dateDebut, params.dateFin);

        // Utiliser les configurations par défaut ou celles passées en paramètre si nécessaire
        const rulesConfig = defaultRulesConfiguration;
        const fatigueConfig = defaultFatigueConfig;

        // Initialiser et exécuter le générateur
        const generator = new PlanningGenerator(params, rulesConfig, fatigueConfig);
        await generator.initialize(users, existingAssignments);
        const validationResult = await generator.generateFullPlanning();

        const results = generator.getResults();
        const allAssignments = [
            ...results.gardes,
            ...results.astreintes,
            ...results.consultations,
            ...results.blocs
        ];

        // Retourner le résultat complet
        return NextResponse.json({
            assignments: allAssignments,
            validationResult
        });

    } catch (error) {
        console.error('[API /planning/generate] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erreur lors de la génération du planning' },
            { status: 500 }
        );
    }
} 