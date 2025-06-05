import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { unifiedRequestService } from '@/services/unifiedRequestService';
import { withUserRateLimit } from '@/lib/rateLimit';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { UnifiedRequestType, RequestPriority } from '@/types/unified-request';

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

    if (req.method === 'GET') {
      // Récupérer les demandes de l'utilisateur
      const requests = await unifiedRequestService.getRequests({
        initiatorId: authResult.userId
      });

      return NextResponse.json(requests);
    }

    if (req.method === 'POST') {
      const data = await req.json();

      // Validation des données
      if (!data.type || !data.title) {
        return NextResponse.json(
          { error: 'Type et titre requis' },
          { status: 400 }
        );
      }

      // Créer la demande
      const request = await unifiedRequestService.createRequest({
        type: data.type as UnifiedRequestType,
        title: data.title,
        description: data.description || '',
        priority: data.priority as RequestPriority || RequestPriority.MEDIUM,
        initiatorId: authResult.userId,
        targetUserId: data.targetUserId,
        metadata: data.metadata,
        expiresAt: data.expiresAt
      });

      return NextResponse.json(request, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Méthode non autorisée' },
      { status: 405 }
    );
  } catch (error: unknown) {
    logger.error('Erreur API requests:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export const GET = withUserRateLimit(handler);
export const POST = withUserRateLimit(handler);