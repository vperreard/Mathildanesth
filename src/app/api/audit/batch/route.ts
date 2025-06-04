import { NextRequest, NextResponse } from 'next/server';
import { AuditEntry } from '@/services/AuditService';

/**
 * API pour traiter des lots d'entrées d'audit
 * Cette API est utilisée par le service d'audit optimisé
 */
export async function POST(request: NextRequest) {
    // Dans un environnement réel, nous vérifierions l'authentification ici
    // Pour simplifier, nous considérons que l'API est sécurisée par des mécanismes externes

    try {
        // Vérifier si les données sont compressées
        const contentEncoding = request.headers.get('content-encoding');
        let auditBatch: AuditEntry[];

        if (contentEncoding === 'gzip') {
            // Dans un environnement réel, nous décompresserions ici
            // Exemple: const decompressedData = await decompress(req.body);
            auditBatch = await request.json();
        } else {
            auditBatch = await request.json();
        }

        // Valider les données
        if (!Array.isArray(auditBatch)) {
            return NextResponse.json(
                { error: 'Format de lot invalide' },
                { status: 400 }
            );
        }

        // Vérifier si le lot respecte la taille maximale
        const MAX_BATCH_SIZE = 100;
        if (auditBatch.length > MAX_BATCH_SIZE) {
            return NextResponse.json({
                error: `Taille de lot excessive (${auditBatch.length}), maximum: ${MAX_BATCH_SIZE}`
            }, { status: 400 });
        }

        // Mesurer le temps de traitement
        const startTime = performance.now();

        // Traiter le lot
        const savedEntries = await processBatch(auditBatch);

        // Calculer le temps de traitement
        const processingTime = performance.now() - startTime;

        return NextResponse.json({
            success: true,
            count: savedEntries.length,
            processingTime: Math.round(processingTime)
        });
    } catch (error) {
        console.error('Erreur lors du traitement du lot d\'audit:', error);
        return NextResponse.json(
            { error: 'Erreur de traitement du lot' },
            { status: 500 }
        );
    }
}

/**
 * Traite un lot d'entrées d'audit
 */
async function processBatch(batch: AuditEntry[]): Promise<AuditEntry[]> {
    if (batch.length === 0) {
        return [];
    }

    try {
        // Dans un environnement réel, nous enregistrerions les entrées dans la base de données
        // Exemple: const savedEntries = await prisma.auditEntry.createMany({ data: batch });

        // Simuler un délai de traitement variable selon la taille du lot
        const processingDelay = Math.min(50 + batch.length * 2, 500);
        await new Promise(resolve => setTimeout(resolve, processingDelay));

        // Simulation d'un traitement réussi
        return batch.map(entry => ({
            ...entry,
            id: entry.id || `gen-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        }));
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement du lot d\'audit:', error);
        throw error;
    }
} 