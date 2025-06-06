import { NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { getServerSession } from '@/lib/auth/migration-shim';
import { authOptions } from '@/lib/auth/migration-shim';
import { getPredictiveInsights } from '@/services/analyticsService';

export async function GET() {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer les insights prédictifs
    const insights = await getPredictiveInsights();

    // Ajouter des métadonnées à la réponse
    const metadata = {
      generatedAt: new Date().toISOString(),
      predictionTimeframe: '3 prochains mois',
      confidenceThreshold: 0.6, // Ne montrer que les prédictions avec une confiance > 60%
      modelVersion: '1.0',
    };

    // Structurer la réponse
    return NextResponse.json({
      success: true,
      data: insights,
      metadata,
    });
  } catch (error: unknown) {
    logger.error('Erreur lors de la génération des insights prédictifs:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la génération des insights prédictifs',
      },
      { status: 500 }
    );
  }
}
