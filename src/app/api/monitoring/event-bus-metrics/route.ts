import { NextRequest, NextResponse } from 'next/server';
import { EventBusService } from '@/modules/integration/services/EventBusService';

/**
 * Endpoint pour récupérer les métriques de performance du bus d'événements
 * 
 * Cette API nécessite des permissions d'administration pour y accéder
 * et permet de surveiller les performances du bus d'événements en temps réel.
 */

/**
 * Récupération des métriques
 */
export async function GET(request: NextRequest) {
    // Vérifier les permissions (à implémenter avec votre système d'authentification)
    // Dans un environnement de production, cette vérification doit être stricte
    const isAuthorized = true; // À remplacer par une vraie vérification

    if (!isAuthorized) {
        return NextResponse.json(
            { error: 'Accès non autorisé' },
            { status: 403 }
        );
    }

    try {
        const eventBus = EventBusService.getInstance();
        const metrics = eventBus.getPerformanceMetrics();

        // Options de filtrage de la requête
        const { searchParams } = new URL(request.url);
        const eventType = searchParams.get('eventType');
        const minTime = searchParams.get('minTime');
        const maxTime = searchParams.get('maxTime');
        const limit = searchParams.get('limit');

        let filteredMetrics = metrics;

        // Filtrer par type d'événement si spécifié
        if (eventType) {
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
        if (minTime) {
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
        if (maxTime) {
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
        if (limit) {
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
        return NextResponse.json(filteredMetrics);
    } catch (error) {
        console.error('Error fetching event bus metrics:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des métriques' },
            { status: 500 }
        );
    }
}

/**
 * Mise à jour de la configuration du profilage
 */
export async function POST(request: NextRequest) {
    // Vérifier les permissions
    const isAuthorized = true; // À remplacer par une vraie vérification

    if (!isAuthorized) {
        return NextResponse.json(
            { error: 'Accès non autorisé' },
            { status: 403 }
        );
    }

    try {
        const body = await request.json();
        const { enabled, samplingRate, logSlowEvents, slowEventThreshold, detailedSubscriberMetrics } = body;

        // Valider les paramètres
        if (typeof enabled !== 'boolean' && enabled !== undefined) {
            return NextResponse.json(
                { error: 'Le paramètre "enabled" doit être un booléen' },
                { status: 400 }
            );
        }

        if (samplingRate !== undefined && (typeof samplingRate !== 'number' || samplingRate < 0 || samplingRate > 1)) {
            return NextResponse.json(
                { error: 'Le paramètre "samplingRate" doit être un nombre entre 0 et 1' },
                { status: 400 }
            );
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

        return NextResponse.json({ message: 'Configuration mise à jour avec succès' });
    } catch (error) {
        console.error('Error updating profiler configuration:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour de la configuration' },
            { status: 500 }
        );
    }
}

/**
 * Réinitialisation des métriques
 */
export async function DELETE(request: NextRequest) {
    // Vérifier les permissions
    const isAuthorized = true; // À remplacer par une vraie vérification

    if (!isAuthorized) {
        return NextResponse.json(
            { error: 'Accès non autorisé' },
            { status: 403 }
        );
    }

    try {
        const eventBus = EventBusService.getInstance();

        // Réinitialiser les métriques avec la méthode implémentée
        eventBus.resetPerformanceMetrics();

        return NextResponse.json({ message: 'Métriques réinitialisées avec succès' });
    } catch (error) {
        console.error('Error resetting metrics:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la réinitialisation des métriques' },
            { status: 500 }
        );
    }
} 