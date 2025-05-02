import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
    getAllSupervisorRules,
    createSupervisorRule,
    updateSupervisorRule,
    deleteSupervisorRule
} from '@/modules/planning/bloc-operatoire/services/blocPlanningService';
import { SupervisionRuleSchema } from '@/modules/planning/bloc-operatoire/models/BlocModels';
import { ZodError } from 'zod';

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const sectorId = searchParams.get('sectorId');

        const rules = await getAllSupervisorRules(sectorId || undefined);
        return NextResponse.json(rules);
    } catch (error) {
        console.error('Erreur lors de la récupération des règles de supervision:', error);
        return NextResponse.json({ error: 'Erreur lors de la récupération des règles de supervision' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const body = await request.json();
        const result = SupervisionRuleSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Données invalides', details: result.error.format() }, { status: 400 });
        }

        const rule = await createSupervisorRule(result.data);
        return NextResponse.json(rule, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création d\'une règle de supervision:', error);

        if (error instanceof ZodError) {
            return NextResponse.json({
                error: 'Données invalides',
                details: error.format()
            }, { status: 400 });
        }

        return NextResponse.json({ error: 'Erreur lors de la création d\'une règle de supervision' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const body = await request.json();
        const result = SupervisionRuleSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Données invalides', details: result.error.format() }, { status: 400 });
        }

        if (!body.id) {
            return NextResponse.json({ error: 'ID de règle requis pour la mise à jour' }, { status: 400 });
        }

        const rule = await updateSupervisorRule(body.id, result.data);
        return NextResponse.json(rule);
    } catch (error) {
        console.error('Erreur lors de la mise à jour d\'une règle de supervision:', error);

        if (error instanceof ZodError) {
            return NextResponse.json({
                error: 'Données invalides',
                details: error.format()
            }, { status: 400 });
        }

        return NextResponse.json({ error: 'Erreur lors de la mise à jour d\'une règle de supervision' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID de règle requis pour la suppression' }, { status: 400 });
        }

        await deleteSupervisorRule(id);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Erreur lors de la suppression d\'une règle de supervision:', error);
        return NextResponse.json({ error: 'Erreur lors de la suppression d\'une règle de supervision' }, { status: 500 });
    }
} 