import { NextApiRequest, NextApiResponse } from 'next';
import { EventBusService } from '@/modules/integration/services/EventBusService';

/**
 * Endpoint pour récupérer les métriques de performance du bus d'événements
 * 
 * Cette API nécessite des permissions d'administration pour y accéder
 * et permet de surveiller les performances du bus d'événements en temps réel.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Vérifier les permissions (à implémenter avec votre système d'authentification)
    // Dans un environnement de production, cette vérification doit être stricte
    const isAuthorized = true; // À remplacer par une vraie vérification

    if (!isAuthorized) {
        return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Gestion des différentes méthodes HTTP
    switch (req.method) {
        case 'GET':
            return getMetrics(req, res);
        case 'POST':
            return updateConfiguration(req, res);
        case 'DELETE':
            return resetMetrics(req, res);
        default:
            return res.status(405).json({ error: 'Méthode non autorisée' });
    }
}

/**
 * Récupération des métriques
 */
async function getMetrics(req: NextApiRequest, res: NextApiResponse) {
    try {
        const eventBus = EventBusService.getInstance();
        const metrics = eventBus.getPerformanceMetrics();

        // Options de filtrage de la requête
        const { eventType, minTime, maxTime, limit } = req.query;

        let filteredMetrics = metrics;

        // Filtrer par type d'événement si spécifié
        if (eventType && typeof eventType === 'string') {
            filteredMetrics = {
                ...filteredMetrics,
                performance: {
                    ...filteredMetrics.performance,
                    eventMetrics: filteredMetrics.performance.eventMetrics.filter(
                        metric => metric.eventType === eventType
                    ),
                    subscriberMetrics: filteredMetrics.performance.subscriberMetrics.filter(
                        metric => metric.eventType === eventType
                    )
                }
            };
        }

        // Filtrer par temps de traitement minimum si spécifié
        if (minTime && typeof minTime === 'string') {
            const minTimeValue = parseFloat(minTime);
            if (!isNaN(minTimeValue)) {
                filteredMetrics = {
                    ...filteredMetrics,
                    performance: {
                        ...filteredMetrics.performance,
                        eventMetrics: filteredMetrics.performance.eventMetrics.filter(
                            metric => metric.averageHandlingTime >= minTimeValue
                        )
                    }
                };
            }
        }

        // Filtrer par temps de traitement maximum si spécifié
        if (maxTime && typeof maxTime === 'string') {
            const maxTimeValue = parseFloat(maxTime);
            if (!isNaN(maxTimeValue)) {
                filteredMetrics = {
                    ...filteredMetrics,
                    performance: {
                        ...filteredMetrics.performance,
                        eventMetrics: filteredMetrics.performance.eventMetrics.filter(
                            metric => metric.averageHandlingTime <= maxTimeValue
                        )
                    }
                };
            }
        }

        // Limiter le nombre de résultats si spécifié
        if (limit && typeof limit === 'string') {
            const limitValue = parseInt(limit, 10);
            if (!isNaN(limitValue) && limitValue > 0) {
                filteredMetrics = {
                    ...filteredMetrics,
                    performance: {
                        ...filteredMetrics.performance,
                        eventMetrics: filteredMetrics.performance.eventMetrics.slice(0, limitValue),
                        subscriberMetrics: filteredMetrics.performance.subscriberMetrics.slice(0, limitValue)
                    }
                };
            }
        }

        // Envoyer les métriques filtrées
        return res.status(200).json(filteredMetrics);
    } catch (error) {
        console.error('Error fetching event bus metrics:', error);
        return res.status(500).json({ error: 'Erreur lors de la récupération des métriques' });
    }
}

/**
 * Mise à jour de la configuration du profilage
 */
async function updateConfiguration(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { enabled, samplingRate, logSlowEvents, slowEventThreshold, detailedSubscriberMetrics } = req.body;

        // Valider les paramètres
        if (typeof enabled !== 'boolean' && enabled !== undefined) {
            return res.status(400).json({ error: 'Le paramètre "enabled" doit être un booléen' });
        }

        if (samplingRate !== undefined && (typeof samplingRate !== 'number' || samplingRate < 0 || samplingRate > 1)) {
            return res.status(400).json({ error: 'Le paramètre "samplingRate" doit être un nombre entre 0 et 1' });
        }

        // Construire l'objet de configuration
        const configUpdate: any = {};

        if (enabled !== undefined) configUpdate.enabled = enabled;
        if (samplingRate !== undefined) configUpdate.samplingRate = samplingRate;
        if (logSlowEvents !== undefined) configUpdate.logSlowEvents = !!logSlowEvents;
        if (slowEventThreshold !== undefined) configUpdate.slowEventThreshold = Number(slowEventThreshold);
        if (detailedSubscriberMetrics !== undefined) configUpdate.detailedSubscriberMetrics = !!detailedSubscriberMetrics;

        // Mettre à jour la configuration
        const eventBus = EventBusService.getInstance();
        eventBus.setProfilingEnabled(enabled ?? true, configUpdate);

        return res.status(200).json({ message: 'Configuration mise à jour avec succès' });
    } catch (error) {
        console.error('Error updating profiler configuration:', error);
        return res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration' });
    }
}

/**
 * Réinitialisation des métriques
 */
async function resetMetrics(req: NextApiRequest, res: NextApiResponse) {
    try {
        const eventBus = EventBusService.getInstance();

        // Réinitialiser les métriques avec la méthode implémentée
        eventBus.resetPerformanceMetrics();

        return res.status(200).json({ message: 'Métriques réinitialisées avec succès' });
    } catch (error) {
        console.error('Error resetting metrics:', error);
        return res.status(500).json({ error: 'Erreur lors de la réinitialisation des métriques' });
    }
} 