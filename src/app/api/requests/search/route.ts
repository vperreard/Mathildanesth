import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { unifiedRequestService } from '@/services/unifiedRequestService';
import { withUserRateLimit } from '@/lib/rateLimit';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { RequestFilter } from '@/types/unified-request';

async function handler(req: NextRequest) {
  try {
    // Vérification de l'authentification
    const authResult = await verifyAuthToken();
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    if (req.method !== 'POST') {
      return NextResponse.json(
        { error: 'Méthode non autorisée' },
        { status: 405 }
      );
    }

    const filter: RequestFilter = await req.json();

    // Si pas admin, forcer le filtre par utilisateur
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      // L'utilisateur ne peut voir que ses propres demandes ou celles qui le concernent
      filter.initiatorId = authResult.userId;
    }

    const results = await unifiedRequestService.getRequests(filter);

    return NextResponse.json(results);
  } catch (error: unknown) {
    logger.error('Erreur API requests/search:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export const POST = withUserRateLimit(handler);