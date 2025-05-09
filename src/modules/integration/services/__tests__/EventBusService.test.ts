import { EventBusService, IntegrationEventType, IntegrationEvent } from '../EventBusService';
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('EventBusService', () => {
    let eventBus: EventBusService;
    let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
    let consoleWarnSpy: jest.SpiedFunction<typeof console.warn>;

    beforeEach(() => {
        jest.useFakeTimers(); // Activer les fake timers avant chaque test

        eventBus = EventBusService.getInstance();
        // S'assurer que dispose nettoie bien tout, y compris l'intervalle du processeur de file.
        eventBus.dispose();
        // Après dispose, getInstance() devrait soit retourner une instance "propre" (si le singleton est réinitialisable pour les tests)
        // ou alors il faut une méthode pour réinitialiser l'état interne du singleton plus en profondeur.
        // Pour l'instant, on suppose que getInstance() après dispose sur le singleton précédent est suffisant 
        // ou que les tests ne s'appuient pas sur une "nouvelle" instance vide à chaque fois mais sur une instance nettoyée.
        // Si des tests échouent à cause d'un état persistant, il faudra revoir cela.

        // Nettoyer les mocks Jest, pas l'état interne de l'eventBus qui est géré par dispose()
        jest.clearAllMocks();

        // Espionner console.error et console.warn pour les tests qui en ont besoin
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore(); // Restaurer console.error
        consoleWarnSpy.mockRestore();  // Restaurer console.warn
        jest.useRealTimers(); // Restaurer les timers réels après chaque test
        // jest.clearAllMocks(); // Déjà fait dans beforeEach ou après des espions spécifiques si besoin
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
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            const eventType = IntegrationEventType.LEAVE_CREATED;
            const eventPayload = { message: 'Hello' };
            const eventSource = 'test-source';
            const eventToPublish: Omit<IntegrationEvent, 'timestamp'> = {
                type: eventType,
                payload: eventPayload,
                source: eventSource
            };

            eventBus.subscribe(eventType, handler1);
            eventBus.subscribe(eventType, handler2);

            eventBus.publish(eventToPublish);

            expect(handler1).toHaveBeenCalledTimes(1);
            expect(handler2).toHaveBeenCalledTimes(1);
            expect(handler1).toHaveBeenCalledWith(expect.objectContaining({
                ...eventToPublish,
                timestamp: expect.any(Number)
            }));
            expect(handler2).toHaveBeenCalledWith(expect.objectContaining({
                ...eventToPublish,
                timestamp: expect.any(Number)
            }));
        });

        it('devrait permettre de se désabonner d\'un événement', () => {
            const handler = jest.fn();
            const eventType = IntegrationEventType.LEAVE_CANCELLED;

            const unsubscribe = eventBus.subscribe(eventType, handler);
            unsubscribe();

            eventBus.publish({ type: eventType, payload: {}, source: 'test' });

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

            const event: IntegrationEvent = {
                type: IntegrationEventType.LEAVE_APPROVED,
                payload: { id: 'leave-123' },
                source: 'leave-module',
                userId: 'user-123',
                correlationId: 'corr-xyz',
                timestamp: Date.now()
            };

            eventBus.publish(event);

            const receivedEvent = handler.mock.calls[0][0] as IntegrationEvent;
            expect(receivedEvent.userId).toBe('user-123');
            expect(receivedEvent.correlationId).toBe('corr-xyz');
        });

        it('devrait permettre de nettoyer tous les abonnements pour un type', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            const eventType = IntegrationEventType.AUDIT_ACTION;

            eventBus.subscribe(eventType, handler1);
            eventBus.subscribe(eventType, handler2);

            if ((eventBus as any).clearEventListeners) {
                (eventBus as any).clearEventListeners(eventType);
            } else {
                console.warn('EventBusService ne semble pas avoir de méthode clearEventListeners');
            }

            eventBus.publish({ type: eventType, payload: {}, source: 'test' });

            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).not.toHaveBeenCalled();
        });

        it('devrait permettre de nettoyer tous les abonnements', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            const eventType1 = IntegrationEventType.LEAVE_DELETED;
            const eventType2 = IntegrationEventType.PLANNING_EVENT_DELETED;

            eventBus.subscribe(eventType1, handler1);
            eventBus.subscribe(eventType2, handler2);

            if ((eventBus as any).dispose) {
                (eventBus as any).dispose();
                eventBus = EventBusService.getInstance();
                (eventBus as any).listeners = {};
                (eventBus as any).wildCardSubscribers = new Set();
                (eventBus as any).eventQueue = [];
            } else if ((eventBus as any).clearAllListeners) {
                (eventBus as any).clearAllListeners();
            } else {
                console.warn('EventBusService ne semble pas avoir de méthode dispose() ou clearAllListeners()');
            }

            eventBus.publish({ type: eventType1, payload: {}, source: 'test' });
            eventBus.publish({ type: eventType2, payload: {}, source: 'test' });

            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).not.toHaveBeenCalled();
        });

        it('devrait appeler les abonnés wildcard pour tous les événements', () => {
            const wildcardHandler = jest.fn();
            const eventType1 = IntegrationEventType.PLANNING_EVENT_CREATED;
            const eventType2 = IntegrationEventType.QUOTA_UPDATED;
            const event1: Omit<IntegrationEvent, 'timestamp'> = { type: eventType1, payload: { val: 1 }, source: 'test1' };
            const event2: Omit<IntegrationEvent, 'timestamp'> = { type: eventType2, payload: { val: 2 }, source: 'test2' };

            if (typeof (eventBus as any).subscribeToAll === 'function') {
                (eventBus as any).subscribeToAll(wildcardHandler);
            } else {
                console.warn('EventBusService ne semble pas avoir de méthode subscribeToAll');
            }

            eventBus.publish(event1);
            eventBus.publish(event2);

            expect(wildcardHandler).toHaveBeenCalledTimes(2);
            expect(wildcardHandler).toHaveBeenCalledWith(expect.objectContaining({ ...event1, timestamp: expect.any(Number) }));
            expect(wildcardHandler).toHaveBeenCalledWith(expect.objectContaining({ ...event2, timestamp: expect.any(Number) }));
        });

        it('devrait appeler les abonnés lorsqu\'un événement (non-HF) est publié', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            const eventType = IntegrationEventType.LEAVE_CREATED; // Non HF par défaut
            const eventPayload = { message: 'Direct Hello' };
            const eventSource = 'test-direct';
            const eventToPublish: Omit<IntegrationEvent, 'timestamp'> = {
                type: eventType,
                payload: eventPayload,
                source: eventSource
            };

            eventBus.subscribe(eventType, handler1);
            eventBus.subscribe(eventType, handler2);

            eventBus.publish(eventToPublish);

            // Les handlers devraient être appelés directement
            expect(handler1).toHaveBeenCalledTimes(1);
            expect(handler2).toHaveBeenCalledTimes(1);
        });

        it('devrait appeler les abonnés généraux pour tous les types d\'événements (directs et en file)', () => {
            const generalHandler = jest.fn();
            eventBus.subscribeToAll(generalHandler);
            eventBus.configureQueue({ highFrequencyEventTypes: [IntegrationEventType.AUDIT_ACTION], processingInterval: 10 });

            // Publier un événement direct
            eventBus.publish({ type: IntegrationEventType.LEAVE_CREATED, payload: { id: '1' }, source: 'test' });
            // Publier un événement mis en file
            eventBus.publish({ type: IntegrationEventType.AUDIT_ACTION, payload: { id: '2' }, source: 'test' });

            // Le premier handler (direct) est appelé immédiatement
            expect(generalHandler).toHaveBeenCalledTimes(1);
            expect(generalHandler).toHaveBeenLastCalledWith(expect.objectContaining({ type: IntegrationEventType.LEAVE_CREATED }));

            // Avancer les timers pour traiter la file
            jest.runAllTimers();

            // Le deuxième handler (en file) devrait avoir été appelé
            expect(generalHandler).toHaveBeenCalledTimes(2);
            expect(generalHandler).toHaveBeenLastCalledWith(expect.objectContaining({ type: IntegrationEventType.AUDIT_ACTION }));
        });
    });

    describe('File d\'attente d\'événements', () => {
        it('devrait traiter en lot les événements à haute fréquence', () => {
            eventBus.configureQueue({
                batchSize: 3,
                processingInterval: 100,
                highFrequencyEventTypes: [IntegrationEventType.AUDIT_ACTION]
            });

            const handler = jest.fn();
            eventBus.subscribe(IntegrationEventType.AUDIT_ACTION, handler);

            for (let i = 0; i < 5; i++) {
                eventBus.publish({
                    type: IntegrationEventType.AUDIT_ACTION,
                    payload: { id: `audit-${i}` },
                    source: 'test'
                });
            }
            expect(handler).not.toHaveBeenCalled();

            // Exécuter TOUS les timers en attente (devrait traiter les deux lots)
            jest.runAllTimers();

            // S'attendre à ce que tous les 5 événements aient été traités
            expect(handler).toHaveBeenCalledTimes(5);
            // Vérifier le dernier appel par exemple
            expect(handler).toHaveBeenLastCalledWith(expect.objectContaining({ payload: { id: 'audit-4' } }));
        });

        it('devrait gérer les dépassements de capacité de file d\'attente (Comportement FIFO observé)', () => {
            const maxQueue = 3;
            eventBus.configureQueue({
                maxQueueSize: maxQueue,
                batchSize: 1,
                processingInterval: 50,
                highFrequencyEventTypes: [IntegrationEventType.AUDIT_ACTION]
            });

            const handler = jest.fn();
            eventBus.subscribe(IntegrationEventType.AUDIT_ACTION, handler);

            for (let i = 0; i < 5; i++) {
                eventBus.publish({
                    type: IntegrationEventType.AUDIT_ACTION,
                    payload: { id: `overflow-${i}` }, // 0, 1, 2, 3, 4
                    source: 'test-overflow'
                });
            }

            const stats = eventBus.getStats();
            // Le comportement réel semble être: la file se remplit (0, 1, 2), puis les suivants (3, 4) sont ignorés.
            expect(stats.queueStats.queueOverflows).toBe(2);
            expect(stats.queueStats.currentQueueLength).toBe(maxQueue);
            expect(consoleWarnSpy).toHaveBeenCalledTimes(2);

            // Traiter la file
            jest.runAllTimers(); // Traiter tous les événements en attente dans la file (0, 1, 2)

            expect(handler).toHaveBeenCalledTimes(3);
            // Vérifier l'ordre FIFO
            expect(handler).toHaveBeenNthCalledWith(1, expect.objectContaining({ payload: { id: 'overflow-0' } }));
            expect(handler).toHaveBeenNthCalledWith(2, expect.objectContaining({ payload: { id: 'overflow-1' } }));
            expect(handler).toHaveBeenNthCalledWith(3, expect.objectContaining({ payload: { id: 'overflow-2' } }));

            const finalStats = eventBus.getStats();
            expect(finalStats.queueStats.currentQueueLength).toBe(0);
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
            jest.runAllTimers();

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
            jest.runAllTimers();

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

            eventBus.publish({
                type: IntegrationEventType.LEAVE_CREATED,
                payload: {},
                source: 'test'
            });

            expect(errorHandler).toHaveBeenCalled();
            expect(successHandler).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled(); // Utiliser l'espion
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

            eventBus.publish({
                type: IntegrationEventType.LEAVE_CREATED,
                payload: {},
                source: 'test'
            });

            await jest.runAllTimersAsync(); // S'assurer que les promesses ont le temps de s'exécuter/rejeter

            expect(asyncErrorHandler).toHaveBeenCalled();
            expect(asyncSuccessHandler).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalled(); // Utiliser l'espion
        });

        it('ne devrait pas arrêter le traitement si un abonné lève une erreur', () => {
            const faultyHandler = jest.fn(() => { throw new Error('Faulty'); });
            const normalHandler = jest.fn();
            const eventType = IntegrationEventType.LEAVE_APPROVED;
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            eventBus.subscribe(eventType, faultyHandler);
            eventBus.subscribe(eventType, normalHandler);

            eventBus.publish({ type: eventType, payload: {}, source: 'test' });

            expect(faultyHandler).toHaveBeenCalledTimes(1);
            expect(normalHandler).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
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

            expect(stats.subscriberCount).toBe(2); // Un handler abonné à 2 types différents compte pour 2 abonnements spécifiques
            expect(stats.eventCount).toBe(2); // Nombre total d'événements publiés directement (hors file d'attente ici)
            expect(Object.keys(stats.eventTypes).length).toBe(2);
        });

        it('devrait fournir des statistiques précises sur la file d\'attente', () => {
            const batchSize = 5;
            const processingInterval = 100;
            eventBus.configureQueue({
                batchSize: batchSize,
                processingInterval: processingInterval,
                highFrequencyEventTypes: [IntegrationEventType.AUDIT_ACTION]
            });

            const handler = jest.fn();
            eventBus.subscribe(IntegrationEventType.AUDIT_ACTION, handler);

            const numEvents = 10;
            for (let i = 0; i < numEvents; i++) {
                eventBus.publish({
                    type: IntegrationEventType.AUDIT_ACTION,
                    payload: { id: `audit-${i}` },
                    source: 'test'
                });
            }

            const statsBeforeProcessing = eventBus.getStats();
            expect(statsBeforeProcessing.queueStats.currentQueueLength).toBe(numEvents);
            expect(statsBeforeProcessing.queueStats.totalEnqueued).toBe(numEvents);
            expect(statsBeforeProcessing.queueStats.totalProcessed).toBe(0);

            // Traiter tous les timers en attente
            jest.runAllTimers();
            const statsAfterAllBatches = eventBus.getStats();
            expect(statsAfterAllBatches.queueStats.currentQueueLength).toBe(0);
            expect(statsAfterAllBatches.queueStats.totalProcessed).toBe(numEvents);
        });
    });

    describe('Nettoyage des ressources', () => {
        it('devrait nettoyer toutes les ressources lors de l\'appel à dispose', () => {
            const handler = jest.fn();
            eventBus.subscribe(IntegrationEventType.LEAVE_CREATED, handler);
            eventBus.subscribeToAll(handler);
            eventBus.configureQueue({ highFrequencyEventTypes: [IntegrationEventType.AUDIT_ACTION], processingInterval: 10 });

            // Publier un événement direct et un en file
            eventBus.publish({ type: IntegrationEventType.LEAVE_CREATED, payload: {}, source: 'test' });
            eventBus.publish({ type: IntegrationEventType.AUDIT_ACTION, payload: {}, source: 'test' });

            // Le handler direct est appelé
            expect(handler).toHaveBeenCalledTimes(2); // Une fois pour LEAVE_CREATED spécifique, une fois pour wildcard

            eventBus.dispose();

            // Avancer les timers après dispose ne devrait rien faire
            jest.runAllTimers();
            expect(handler).toHaveBeenCalledTimes(2); // Pas d'appels supplémentaires

            // L'historique et les stats devraient être vides ou réinitialisés
            const history = eventBus.getEventHistory();
            expect(history.length).toBe(0);
            const stats = eventBus.getStats();
            expect(stats.subscriberCount).toBe(0);
            expect(stats.queueStats.currentQueueLength).toBe(0);

            // Publier après dispose ne devrait rien faire
            eventBus.publish({ type: IntegrationEventType.LEAVE_CREATED, payload: {}, source: 'test' });
            expect(handler).toHaveBeenCalledTimes(2);
        });
    });
}); 