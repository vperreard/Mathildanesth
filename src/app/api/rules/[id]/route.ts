import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// GET /api/rules/[id] - Récupérer une règle par ID
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { db } = await connectToDatabase();
        const collection = db.collection('rules');

        const rule = await collection.findOne({ id });

        if (!rule) {
            return NextResponse.json(
                { error: 'Règle non trouvée' },
                { status: 404 }
            );
        }

        return NextResponse.json(rule);
    } catch (error) {
        console.error('Erreur lors de la récupération de la règle:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la récupération de la règle' },
            { status: 500 }
        );
    }
}

// PUT /api/rules/[id] - Mettre à jour une règle
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const ruleData = await req.json();

        const { db } = await connectToDatabase();
        const collection = db.collection('rules');

        const existingRule = await collection.findOne({ id });

        if (!existingRule) {
            return NextResponse.json(
                { error: 'Règle non trouvée' },
                { status: 404 }
            );
        }

        // Mettre à jour la règle
        const updatedRule = {
            ...existingRule,
            ...ruleData,
            id, // Conserver l'id original
            updatedAt: new Date()
        };

        await collection.updateOne({ id }, { $set: updatedRule });

        return NextResponse.json(updatedRule);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la règle:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la mise à jour de la règle' },
            { status: 500 }
        );
    }
}

// DELETE /api/rules/[id] - Supprimer une règle
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { db } = await connectToDatabase();
        const collection = db.collection('rules');

        const result = await collection.deleteOne({ id });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: 'Règle non trouvée' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Erreur lors de la suppression de la règle:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la suppression de la règle' },
            { status: 500 }
        );
    }
} 