import { NextApiRequest, NextApiResponse } from 'next';
import { AuditEntry } from '@/services/AuditService';

/**
 * API pour traiter des lots d'entrées d'audit
 * Cette API est utilisée par le service d'audit optimisé
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Dans un environnement réel, nous vérifierions l'authentification ici
    // Pour simplifier, nous considérons que l'API est sécurisée par des mécanismes externes

    // Vérifier la méthode HTTP
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        // Vérifier si les données sont compressées
        const contentEncoding = req.headers['content-encoding'];
        let auditBatch: AuditEntry[];

        if (contentEncoding === 'gzip') {
            // Dans un environnement réel, nous décompresserions ici
            // Exemple: const decompressedData = await decompress(req.body);
            auditBatch = req.body;
        } else {
            auditBatch = req.body;
        }

        // Valider les données
        if (!Array.isArray(auditBatch)) {
            return res.status(400).json({ error: 'Format de lot invalide' });
        }

        // Vérifier si le lot respecte la taille maximale
        const MAX_BATCH_SIZE = 100;
        if (auditBatch.length > MAX_BATCH_SIZE) {
            return res.status(400).json({
                error: `Taille de lot excessive (${auditBatch.length}), maximum: ${MAX_BATCH_SIZE}`
            });
        }

        // Mesurer le temps de traitement
        const startTime = performance.now();

        // Traiter le lot
        const savedEntries = await processBatch(auditBatch);

        // Calculer le temps de traitement
        const processingTime = performance.now() - startTime;

        return res.status(200).json({
            success: true,
            count: savedEntries.length,
            processingTime: Math.round(processingTime)
        });
    } catch (error) {
        console.error('Erreur lors du traitement du lot d\'audit:', error);
        return res.status(500).json({ error: 'Erreur de traitement du lot' });
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