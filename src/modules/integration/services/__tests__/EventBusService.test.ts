import { EventBusService, IntegrationEventType, EventQueueConfig } from '../EventBusService';

// Mock de setInterval et clearInterval pour les tests
jest.useFakeTimers();

describe('EventBusService', () => {
    let eventBus: EventBusService;

    beforeEach(() => {
        // Obtenir une nouvelle instance pour chaque test
        eventBus = EventBusService.getInstance();

        // Réinitialiser l'état avant chaque test
        eventBus.dispose();

        // Espionner les méthodes pour vérifier les appels
        jest.spyOn(console, 'debug').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Singleton Pattern', () => {
        it('devrait retourner la même instance lors d\'appels multiples à getInstance', () => {
            const instance1 = EventBusService.getInstance();
            const instance2 = EventBusService.getInstance();

            expect(instance1).toBe(instance2);
        });
    });

    describe('Abonnement & Publication', () => {
        it('devrait appeler les abonnés lorsqu\'un événement est publié', () => {
            // Créer des gestionnaires d'événements fictifs
            const handler1 = jest.fn();
            const handler2 = jest.fn();

            // S'abonner aux événements
            eventBus.subscribe(IntegrationEventType.LEAVE_CREATED, handler1);
            eventBus.subscribe(IntegrationEventType.LEAVE_CREATED, handler2);

            // Publier un événement
            const testPayload = { id: '123', type: 'ANNUAL' };
            eventBus.publish({
                type: IntegrationEventType.LEAVE_CREATED,
                payload: testPayload,
                source: 'test'
            });

            // Vérifier que les gestionnaires ont été appelés
            expect(handler1).toHaveBeenCalledTimes(1);
            expect(handler2).toHaveBeenCalledTimes(1);

            // Vérifier le contenu de l'événement reçu
            const eventArg = handler1.mock.calls[0][0];
            expect(eventArg.type).toBe(IntegrationEventType.LEAVE_CREATED);
            expect(eventArg.payload).toEqual(testPayload);
            expect(eventArg.source).toBe('test');
            expect(typeof eventArg.timestamp).toBe('number');
        });

        it('devrait permettre de se désabonner d\'un événement', () => {
            const handler = jest.fn();

            // S'abonner puis se désabonner
            const unsubscribe = eventBus.subscribe(IntegrationEventType.LEAVE_UPDATED, handler);
            unsubscribe();

            // Publier un événement
            eventBus.publish({
                type: IntegrationEventType.LEAVE_UPDATED,
                payload: { id: '123' },
                source: 'test'
            });

            // Le gestionnaire ne devrait pas être appelé
            expect(handler).not.toHaveBeenCalled();
        });

        it('devrait appeler les abonnés généraux pour tous les types d\'événements', () => {
            const specificHandler = jest.fn();
            const generalHandler = jest.fn();

            eventBus.subscribe(IntegrationEventType.LEAVE_CREATED, specificHandler);
            eventBus.subscribeToAll(generalHandler);

            // Publier plusieurs événements
            eventBus.publish({
                type: IntegrationEventType.LEAVE_CREATED,
                payload: { id: '1' },
                source: 'test'
            });

            eventBus.publish({
                type: IntegrationEventType.LEAVE_UPDATED,
                payload: { id: '2' },
                source: 'test'
            });

            // Vérifier les appels
            expect(specificHandler).toHaveBeenCalledTimes(1);
            expect(generalHandler).toHaveBeenCalledTimes(2);
        });

        it('devrait permettre de se désabonner de tous les événements', () => {
            const allEventsHandler = jest.fn();

            // S'abonner puis se désabonner
            const unsubscribe = eventBus.subscribeToAll(allEventsHandler);
            unsubscribe();

            // Publier un événement
            eventBus.publish({
                type: IntegrationEventType.LEAVE_CREATED,
                payload: { id: '123' },
                source: 'test'
            });

            // Le gestionnaire ne devrait pas être appelé
            expect(allEventsHandler).not.toHaveBeenCalled();
        });

        it('devrait traiter correctement les événements avec userId et correlationId', () => {
            const handler = jest.fn();
            eventBus.subscribe(IntegrationEventType.LEAVE_APPROVED, handler);

            const event = {
                type: IntegrationEventType.LEAVE_APPROVED,
                payload: { id: 'leave-123' },
                source: 'leave-module',
                userId: 'user-123',
                correlationId: 'corr-xyz'
            };

            eventBus.publish(event);

            const receivedEvent = handler.mock.calls[0][0];
            expect(receivedEvent.userId).toBe('user-123');
            expect(receivedEvent.correlationId).toBe('corr-xyz');
        });
    });

    describe('File d\'attente d\'événements', () => {
        it('devrait traiter en lot les événements à haute fréquence', () => {
            // Configurer la file d'attente
            eventBus.configureQueue({
                batchSize: 3,
                processingInterval: 100,
                highFrequencyEventTypes: [IntegrationEventType.AUDIT_ACTION]
            });

            const handler = jest.fn();
            eventBus.subscribe(IntegrationEventType.AUDIT_ACTION, handler);

            // Publier plusieurs événements
            for (let i = 0; i < 5; i++) {
                eventBus.publish({
                    type: IntegrationEventType.AUDIT_ACTION,
                    payload: { id: `audit-${i}` },
                    source: 'test'
                });
            }

            // Le gestionnaire ne devrait pas être appelé immédiatement
            expect(handler).not.toHaveBeenCalled();

            // Avancer le temps pour déclencher le traitement par lots
            jest.advanceTimersByTime(100);

            // Vérifier que 3 événements ont été traités (taille du lot)
            expect(handler).toHaveBeenCalledTimes(3);

            // Avancer encore le temps
            jest.advanceTimersByTime(100);

            // Les 2 événements restants devraient être traités
            expect(handler).toHaveBeenCalledTimes(5);
        });

        it('devrait gérer les dépassements de capacité de file d\'attente', () => {
            // Configurer une petite file d'attente
            eventBus.configureQueue({
                maxQueueSize: 3,
                highFrequencyEventTypes: [IntegrationEventType.AUDIT_ACTION]
            });

            const handler = jest.fn();
            eventBus.subscribe(IntegrationEventType.AUDIT_ACTION, handler);

            // Publier plus d'événements que la capacité
            for (let i = 0; i < 5; i++) {
                eventBus.publish({
                    type: IntegrationEventType.AUDIT_ACTION,
                    payload: { id: `overflow-${i}` },
                    source: 'test'
                });
            }

            // Avancer le temps
            jest.advanceTimersByTime(100);

            // Les événements les plus anciens devraient être supprimés
            // Donc seuls les événements les plus récents devraient être traités
            const stats = eventBus.getStats();
            expect(stats.queueStats.queueOverflows).toBeGreaterThan(0);

            // Vérifier que les événements ont été traités
            expect(handler).toHaveBeenCalled();
        });

        it('devrait vider la file d\'attente lors de l\'appel à flushQueue', () => {
            // Configurer la file d'attente
            eventBus.configureQueue({
                highFrequencyEventTypes: [IntegrationEventType.AUDIT_ACTION]
            });

            const handler = jest.fn();
            eventBus.subscribe(IntegrationEventType.AUDIT_ACTION, handler);

            // Ajouter des événements à la file d'attente
            for (let i = 0; i < 5; i++) {
                eventBus.publish({
                    type: IntegrationEventType.AUDIT_ACTION,
                    payload: { id: `audit-${i}` },
                    source: 'test'
                });
            }

            // Vider la file d'attente
            eventBus.flushQueue();

            // Avancer le temps
            jest.advanceTimersByTime(100);

            // Aucun événement ne devrait être traité
            expect(handler).not.toHaveBeenCalled();
        });

        it('devrait arrêter le traitement de la file d\'attente lors de l\'appel à stopQueueProcessor', () => {
            // Configurer la file d'attente
            eventBus.configureQueue({
                highFrequencyEventTypes: [IntegrationEventType.AUDIT_ACTION],
                processingInterval: 100
            });

            const handler = jest.fn();
            eventBus.subscribe(IntegrationEventType.AUDIT_ACTION, handler);

            // Ajouter des événements à la file d'attente
            for (let i = 0; i < 5; i++) {
                eventBus.publish({
                    type: IntegrationEventType.AUDIT_ACTION,
                    payload: { id: `audit-${i}` },
                    source: 'test'
                });
            }

            // Arrêter le processeur de file d'attente
            eventBus.stopQueueProcessor();

            // Avancer le temps
            jest.advanceTimersByTime(1000);

            // Aucun événement ne devrait être traité car le processeur est arrêté
            expect(handler).not.toHaveBeenCalled();
        });
    });

    describe('Historique d\'événements', () => {
        it('devrait stocker l\'historique des événements', () => {
            // Publier des événements
            eventBus.publish({
                type: IntegrationEventType.LEAVE_CREATED,
                payload: { id: '1' },
                source: 'test'
            });

            eventBus.publish({
                type: IntegrationEventType.LEAVE_UPDATED,
                payload: { id: '2' },
                source: 'test'
            });

            // Récupérer l'historique
            const history = eventBus.getEventHistory();

            expect(history.length).toBe(2);
            expect(history[0].type).toBe(IntegrationEventType.LEAVE_CREATED);
            expect(history[1].type).toBe(IntegrationEventType.LEAVE_UPDATED);
        });

        it('devrait limiter la taille de l\'historique', () => {
            // Publier plus d'événements que la taille maximale de l'historique (simulée ici)
            const maxHistorySize = 100;
            for (let i = 0; i < 101; i++) {
                eventBus.publish({
                    type: IntegrationEventType.LEAVE_CREATED,
                    payload: { id: `${i}` },
                    source: 'test'
                });
            }

            // Vérifier que l'historique est limité
            const history = eventBus.getEventHistory();
            expect(history.length).toBeLessThanOrEqual(maxHistorySize);
        });

        it('devrait permettre de filtrer l\'historique par type d\'événement', () => {
            // Publier différents types d'événements
            eventBus.publish({ type: IntegrationEventType.LEAVE_CREATED, payload: {}, source: 'test' });
            eventBus.publish({ type: IntegrationEventType.LEAVE_UPDATED, payload: {}, source: 'test' });
            eventBus.publish({ type: IntegrationEventType.LEAVE_APPROVED, payload: {}, source: 'test' });

            // Filtrer par type
            const filteredHistory = eventBus.getEventHistory(undefined, [IntegrationEventType.LEAVE_UPDATED]);

            expect(filteredHistory.length).toBe(1);
            expect(filteredHistory[0].type).toBe(IntegrationEventType.LEAVE_UPDATED);
        });

        it('devrait permettre de limiter le nombre d\'événements retournés', () => {
            // Publier plusieurs événements
            for (let i = 0; i < 5; i++) {
                eventBus.publish({
                    type: IntegrationEventType.LEAVE_CREATED,
                    payload: { id: `${i}` },
                    source: 'test'
                });
            }

            // Récupérer un nombre limité d'événements
            const limitedHistory = eventBus.getEventHistory(2);

            expect(limitedHistory.length).toBe(2);
            expect(limitedHistory[0].payload.id).toBe('3');
            expect(limitedHistory[1].payload.id).toBe('4');
        });

        it('devrait vider l\'historique', () => {
            // Publier des événements
            eventBus.publish({ type: IntegrationEventType.LEAVE_CREATED, payload: {}, source: 'test' });
            eventBus.publish({ type: IntegrationEventType.LEAVE_UPDATED, payload: {}, source: 'test' });

            // Vider l'historique
            eventBus.clearEventHistory();

            // Vérifier que l'historique est vide
            const history = eventBus.getEventHistory();
            expect(history.length).toBe(0);
        });
    });

    describe('Gestion des erreurs', () => {
        it('devrait continuer à traiter les événements même si un gestionnaire échoue', () => {
            const errorHandler = jest.fn().mockImplementation(() => {
                throw new Error('Erreur simulée');
            });

            const successHandler = jest.fn();

            eventBus.subscribe(IntegrationEventType.LEAVE_CREATED, errorHandler);
            eventBus.subscribe(IntegrationEventType.LEAVE_CREATED, successHandler);

            // Publier un événement
            eventBus.publish({
                type: IntegrationEventType.LEAVE_CREATED,
                payload: {},
                source: 'test'
            });

            // L'erreur ne devrait pas empêcher l'appel au deuxième gestionnaire
            expect(errorHandler).toHaveBeenCalled();
            expect(successHandler).toHaveBeenCalled();
            expect(console.error).toHaveBeenCalled();
        });

        it('devrait gérer les promesses rejetées dans les gestionnaires d\'événements', async () => {
            const asyncErrorHandler = jest.fn().mockImplementation(async () => {
                return Promise.reject(new Error('Promesse rejetée'));
            });

            const asyncSuccessHandler = jest.fn().mockImplementation(async () => {
                return Promise.resolve('ok');
            });

            eventBus.subscribe(IntegrationEventType.LEAVE_CREATED, asyncErrorHandler);
            eventBus.subscribe(IntegrationEventType.LEAVE_CREATED, asyncSuccessHandler);

            // Publier un événement
            eventBus.publish({
                type: IntegrationEventType.LEAVE_CREATED,
                payload: {},
                source: 'test'
            });

            // Attendre que les promesses soient résolues/rejetées
            await jest.runAllTimersAsync();

            // Les deux gestionnaires devraient avoir été appelés, malgré l'erreur dans le premier
            expect(asyncErrorHandler).toHaveBeenCalled();
            expect(asyncSuccessHandler).toHaveBeenCalled();
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('Types d\'événements', () => {
        it('devrait traiter correctement tous les types d\'événements liés aux congés', () => {
            // Créer un gestionnaire pour chaque type d'événement
            const leaveCreatedHandler = jest.fn();
            const leaveUpdatedHandler = jest.fn();
            const leaveApprovedHandler = jest.fn();
            const leaveRejectedHandler = jest.fn();
            const leaveCancelledHandler = jest.fn();
            const leaveDeletedHandler = jest.fn();

            // S'abonner aux événements
            eventBus.subscribe(IntegrationEventType.LEAVE_CREATED, leaveCreatedHandler);
            eventBus.subscribe(IntegrationEventType.LEAVE_UPDATED, leaveUpdatedHandler);
            eventBus.subscribe(IntegrationEventType.LEAVE_APPROVED, leaveApprovedHandler);
            eventBus.subscribe(IntegrationEventType.LEAVE_REJECTED, leaveRejectedHandler);
            eventBus.subscribe(IntegrationEventType.LEAVE_CANCELLED, leaveCancelledHandler);
            eventBus.subscribe(IntegrationEventType.LEAVE_DELETED, leaveDeletedHandler);

            // Publier un événement de chaque type
            eventBus.publish({
                type: IntegrationEventType.LEAVE_CREATED,
                payload: { id: '1' },
                source: 'test'
            });

            eventBus.publish({
                type: IntegrationEventType.LEAVE_UPDATED,
                payload: { id: '1' },
                source: 'test'
            });

            eventBus.publish({
                type: IntegrationEventType.LEAVE_APPROVED,
                payload: { id: '1' },
                source: 'test'
            });

            eventBus.publish({
                type: IntegrationEventType.LEAVE_REJECTED,
                payload: { id: '1' },
                source: 'test'
            });

            eventBus.publish({
                type: IntegrationEventType.LEAVE_CANCELLED,
                payload: { id: '1' },
                source: 'test'
            });

            eventBus.publish({
                type: IntegrationEventType.LEAVE_DELETED,
                payload: { id: '1' },
                source: 'test'
            });

            // Vérifier que chaque gestionnaire a été appelé
            expect(leaveCreatedHandler).toHaveBeenCalledTimes(1);
            expect(leaveUpdatedHandler).toHaveBeenCalledTimes(1);
            expect(leaveApprovedHandler).toHaveBeenCalledTimes(1);
            expect(leaveRejectedHandler).toHaveBeenCalledTimes(1);
            expect(leaveCancelledHandler).toHaveBeenCalledTimes(1);
            expect(leaveDeletedHandler).toHaveBeenCalledTimes(1);
        });

        it('devrait traiter correctement tous les types d\'événements liés au planning', () => {
            // Créer un gestionnaire pour chaque type d'événement
            const planningCreatedHandler = jest.fn();
            const planningUpdatedHandler = jest.fn();
            const planningDeletedHandler = jest.fn();

            // S'abonner aux événements
            eventBus.subscribe(IntegrationEventType.PLANNING_EVENT_CREATED, planningCreatedHandler);
            eventBus.subscribe(IntegrationEventType.PLANNING_EVENT_UPDATED, planningUpdatedHandler);
            eventBus.subscribe(IntegrationEventType.PLANNING_EVENT_DELETED, planningDeletedHandler);

            // Publier un événement de chaque type
            eventBus.publish({
                type: IntegrationEventType.PLANNING_EVENT_CREATED,
                payload: { id: '1' },
                source: 'test'
            });

            eventBus.publish({
                type: IntegrationEventType.PLANNING_EVENT_UPDATED,
                payload: { id: '1' },
                source: 'test'
            });

            eventBus.publish({
                type: IntegrationEventType.PLANNING_EVENT_DELETED,
                payload: { id: '1' },
                source: 'test'
            });

            // Vérifier que chaque gestionnaire a été appelé
            expect(planningCreatedHandler).toHaveBeenCalledTimes(1);
            expect(planningUpdatedHandler).toHaveBeenCalledTimes(1);
            expect(planningDeletedHandler).toHaveBeenCalledTimes(1);
        });

        it('devrait traiter correctement tous les types d\'événements liés aux quotas', () => {
            // Créer un gestionnaire pour chaque type d'événement
            const quotaUpdatedHandler = jest.fn();
            const quotaTransferredHandler = jest.fn();
            const quotaCarriedOverHandler = jest.fn();

            // S'abonner aux événements
            eventBus.subscribe(IntegrationEventType.QUOTA_UPDATED, quotaUpdatedHandler);
            eventBus.subscribe(IntegrationEventType.QUOTA_TRANSFERRED, quotaTransferredHandler);
            eventBus.subscribe(IntegrationEventType.QUOTA_CARRIED_OVER, quotaCarriedOverHandler);

            // Publier un événement de chaque type
            eventBus.publish({
                type: IntegrationEventType.QUOTA_UPDATED,
                payload: { id: '1' },
                source: 'test'
            });

            eventBus.publish({
                type: IntegrationEventType.QUOTA_TRANSFERRED,
                payload: { id: '1' },
                source: 'test'
            });

            eventBus.publish({
                type: IntegrationEventType.QUOTA_CARRIED_OVER,
                payload: { id: '1' },
                source: 'test'
            });

            // Vérifier que chaque gestionnaire a été appelé
            expect(quotaUpdatedHandler).toHaveBeenCalledTimes(1);
            expect(quotaTransferredHandler).toHaveBeenCalledTimes(1);
            expect(quotaCarriedOverHandler).toHaveBeenCalledTimes(1);
        });
    });

    describe('Statistiques', () => {
        it('devrait fournir des statistiques précises', () => {
            const handler = jest.fn();
            eventBus.subscribe(IntegrationEventType.LEAVE_CREATED, handler);
            eventBus.subscribe(IntegrationEventType.LEAVE_UPDATED, handler);

            // Publier des événements
            eventBus.publish({ type: IntegrationEventType.LEAVE_CREATED, payload: {}, source: 'test' });
            eventBus.publish({ type: IntegrationEventType.LEAVE_UPDATED, payload: {}, source: 'test' });

            // Récupérer les statistiques
            const stats = eventBus.getStats();

            expect(stats.subscriberCount).toBe(2);
            expect(stats.eventCount).toBe(2);
            expect(Object.keys(stats.eventTypes).length).toBe(2);
        });

        it('devrait fournir des statistiques précises sur la file d\'attente', () => {
            // Configurer la file d'attente
            eventBus.configureQueue({
                batchSize: 5,
                processingInterval: 100,
                highFrequencyEventTypes: [IntegrationEventType.AUDIT_ACTION]
            });

            const handler = jest.fn();
            eventBus.subscribe(IntegrationEventType.AUDIT_ACTION, handler);

            // Publier des événements à haute fréquence
            for (let i = 0; i < 10; i++) {
                eventBus.publish({
                    type: IntegrationEventType.AUDIT_ACTION,
                    payload: { id: `audit-${i}` },
                    source: 'test'
                });
            }

            // Vérifier les statistiques avant traitement
            const statsBeforeProcessing = eventBus.getStats();
            expect(statsBeforeProcessing.queueStats.currentQueueLength).toBe(10);
            expect(statsBeforeProcessing.queueStats.totalEnqueued).toBe(10);
            expect(statsBeforeProcessing.queueStats.totalProcessed).toBe(0);

            // Traiter les événements
            jest.advanceTimersByTime(100);

            // Vérifier les statistiques après traitement
            const statsAfterProcessing = eventBus.getStats();
            expect(statsAfterProcessing.queueStats.currentQueueLength).toBe(5); // 5 événements restants
            expect(statsAfterProcessing.queueStats.totalEnqueued).toBe(10);
            expect(statsAfterProcessing.queueStats.totalProcessed).toBe(5);
        });
    });

    describe('Nettoyage des ressources', () => {
        it('devrait nettoyer toutes les ressources lors de l\'appel à dispose', () => {
            // S'abonner à des événements
            const handler = jest.fn();
            eventBus.subscribe(IntegrationEventType.LEAVE_CREATED, handler);
            eventBus.subscribeToAll(handler);

            // Publier des événements
            eventBus.publish({ type: IntegrationEventType.LEAVE_CREATED, payload: {}, source: 'test' });

            // Nettoyer les ressources
            eventBus.dispose();

            // Vérifier que l'historique est vide
            const history = eventBus.getEventHistory();
            expect(history.length).toBe(0);

            // Publier un événement après nettoyage
            eventBus.publish({ type: IntegrationEventType.LEAVE_CREATED, payload: {}, source: 'test' });

            // Le gestionnaire ne devrait pas être appelé
            expect(handler).toHaveBeenCalledTimes(2); // 1 pour l'événement spécifique, 1 pour l'abonnement général
        });
    });
}); 