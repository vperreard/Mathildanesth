import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export function withAuth(handler: Function) {
    return async (request: Request, context: unknown) => {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        return handler(request, context);
    };
} 