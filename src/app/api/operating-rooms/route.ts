import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createOperatingRoom, getAllOperatingRooms } from '@/modules/planning/bloc-operatoire/services/blocPlanningService';
import { OperatingRoomSchema } from '@/modules/planning/bloc-operatoire/models/BlocModels';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const rooms = await getAllOperatingRooms();
        return NextResponse.json(rooms);
    } catch (error) {
        console.error('Erreur lors de la récupération des salles d\'opération:', error);
        return NextResponse.json({ error: 'Erreur lors de la récupération des salles d\'opération' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const body = await request.json();
        const result = OperatingRoomSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Données invalides', details: result.error.format() }, { status: 400 });
        }

        const room = await createOperatingRoom(result.data);
        return NextResponse.json(room, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création d\'une salle d\'opération:', error);
        return NextResponse.json({ error: 'Erreur lors de la création d\'une salle d\'opération' }, { status: 500 });
    }
} 