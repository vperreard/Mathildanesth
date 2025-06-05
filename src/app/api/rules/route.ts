import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { Rule } from '@/modules/rules/types/rule';
import { connectToDatabase } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

// GET /api/rules - Récupérer toutes les règles
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        const { db } = await connectToDatabase();
        const collection = db.collection('rules');

        // Filtrer par type si spécifié
        const query = type ? { type } : {};
        const rules = await collection.find(query).toArray();

        return NextResponse.json(rules);
    } catch (error) {
        logger.error('Erreur lors de la récupération des règles:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la récupération des règles' },
            { status: 500 }
        );
    }
}

// POST /api/rules - Créer une nouvelle règle
export async function POST(req: NextRequest) {
    try {
        const ruleData = await req.json();

        // Valider les données
        if (!ruleData.name || !ruleData.type || !ruleData.severity) {
            return NextResponse.json(
                { error: 'Données incomplètes pour la création de la règle' },
                { status: 400 }
            );
        }

        const { db } = await connectToDatabase();
        const collection = db.collection('rules');

        // Préparer la nouvelle règle
        const newRule: Rule = {
            id: ruleData.id || uuidv4(),
            name: ruleData.name,
            description: ruleData.description || '',
            type: ruleData.type,
            severity: ruleData.severity,
            enabled: ruleData.enabled !== undefined ? ruleData.enabled : true,
            configuration: ruleData.configuration || {},
            isDefault: ruleData.isDefault || false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await collection.insertOne(newRule);

        return NextResponse.json(newRule, { status: 201 });
    } catch (error) {
        logger.error('Erreur lors de la création de la règle:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la création de la règle' },
            { status: 500 }
        );
    }
} 