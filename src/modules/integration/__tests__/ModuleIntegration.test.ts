import { eventBus, IntegrationEventType } from '../services/EventBusService';
import { auditService, AuditActionType } from '../../leaves/services/AuditService';
import { LeavePermissionService, LeavePermission } from '../../leaves/permissions/LeavePermissionService';
import { jest } from '@jest/globals';
import axios from 'axios';

// Mock axios globalement. Jest devrait remplacer les méthodes comme .post par des jest.fn().
jest.mock('axios');

// Caster axios après le mock pour que TypeScript comprenne les mocks.
// Ce cast suppose que la structure mockée par Jest correspond à typeof axios,
// et que les méthodes comme .post sont des jest.Mock.
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Module Integration Tests', () => {
    const permissionService = LeavePermissionService.getInstance();

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset eventBus
        eventBus.dispose();

        // Mock pour les appels axios
        // Si jest.mock('axios') a bien fonctionné, mockedAxios.post devrait être un jest.Mock.
        // L'erreur originale suggère que ce n'est pas le cas.
        // Alternative: Tenter de forcer (axios.post as jest.Mock).mockResolvedValue({ data: {} });
        // Ou encore plus direct si mockedAxios est l'objet mocké:
        if (mockedAxios.post && typeof mockedAxios.post.mockResolvedValue === 'function') {
            mockedAxios.post.mockResolvedValue({ data: {} });
        } else {
            // Si mockedAxios.post n'est pas un mock valide, nous avons un problème avec jest.mock('axios')
            // Pour tenter de faire passer le test, on peut le créer à la volée, mais ce n'est pas idéal.
            console.error("axios.post n'a pas été correctement mocké par jest.mock('axios'). Tentative de mock manuel.");
            (axios.post as jest.Mock) = jest.fn().mockResolvedValue({ data: {} });
            // S'assurer que la référence mockedAxios est aussi mise à jour si elle est utilisée ailleurs pour post
            mockedAxios.post = (axios.post as jest.Mock);
        }

        // Mock pour audit
        jest.spyOn(auditService, 'createAuditEntry').mockResolvedValue({} as any);

        // Mock pour permissions
        jest.spyOn(permissionService, 'hasPermission').mockResolvedValue(true);
    });

    test('devrait propager les evenements de conge a travers les modules', async () => {
        // Espionner les methodes pertinentes
        const auditSpy = jest.spyOn(auditService, 'createAuditEntry');

        // Simuler un abonne pour le planning
        const planningSubscriber = jest.fn();
        eventBus.subscribe(IntegrationEventType.LEAVE_APPROVED, planningSubscriber);

        // Publier un evenement de conge approuve
        eventBus.publish({
            type: IntegrationEventType.LEAVE_APPROVED,
            payload: {
                id: 'leave123',
                userId: 'user456',
                type: 'conge annuel',
                startDate: '2023-08-15',
                endDate: '2023-08-20'
            },
            userId: 'manager789',
            source: 'leave-module'
        });

        // Attendre que les abonnes traitent l'evenement
        await new Promise(resolve => setTimeout(resolve, 50));

        // Verifier que le subscriber du planning a ete appele
        expect(planningSubscriber).toHaveBeenCalledTimes(1);
        expect(planningSubscriber).toHaveBeenCalledWith(expect.objectContaining({
            type: IntegrationEventType.LEAVE_APPROVED,
            payload: expect.objectContaining({
                id: 'leave123'
            })
        }));

        // Verifier que audit a ete cree
        expect(auditSpy).toHaveBeenCalled();
    });

    test('devrait propager les changements de permission a travers les modules', async () => {
        // Espionner les methodes pertinentes
        const auditSpy = jest.spyOn(auditService, 'logPermissionChange');
        const cacheInvalidateSpy = jest.spyOn(permissionService as any, 'invalidateUserCache');

        // Simuler un subscriber pour les notifications de permission
        const notificationSubscriber = jest.fn();
        eventBus.subscribe(IntegrationEventType.AUDIT_ACTION, notificationSubscriber);

        // Accorder une permission a un utilisateur
        await permissionService.grantPermission('user123', LeavePermission.VIEW_TEAM_LEAVES);

        // Verifier que audit a ete cree
        expect(auditSpy).toHaveBeenCalledWith(
            expect.any(String),
            'user123',
            LeavePermission.VIEW_TEAM_LEAVES,
            true
        );

        // Verifier que le cache a ete invalide
        expect(cacheInvalidateSpy).toHaveBeenCalledWith('user123');

        // Verifier que l'evenement de notification a ete capture par l'abonne
        expect(notificationSubscriber).toHaveBeenCalled();
    });

    test('devrait synchroniser correctement les quotas avec audit', async () => {
        // Espionner les methodes pertinentes
        const auditSpy = jest.spyOn(auditService, 'createAuditEntry');

        // Simuler un evenement de mise a jour de quota
        eventBus.publish({
            type: IntegrationEventType.QUOTA_UPDATED,
            payload: {
                userId: 'user123',
                leaveType: 'conge annuel',
                amount: 5,
                reason: 'Ajustement annuel'
            },
            userId: 'admin456',
            source: 'leave-module'
        });

        // Attendre le traitement asynchrone
        await new Promise(resolve => setTimeout(resolve, 50));

        // Verifier que audit a bien enregistre l'action
        expect(auditSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                actionType: AuditActionType.QUOTA_UPDATED,
                targetId: 'user123',
                targetType: 'quota'
            })
        );
    });

    test('devrait gerer correctement les flux complexes d\'evenements', async () => {
        // Simuler plusieurs abonnes pour differents types d'evenements
        const leaveCreatedHandler = jest.fn();
        const leaveApprovedHandler = jest.fn();
        const quotaUpdatedHandler = jest.fn();

        eventBus.subscribe(IntegrationEventType.LEAVE_CREATED, leaveCreatedHandler);
        eventBus.subscribe(IntegrationEventType.LEAVE_APPROVED, leaveApprovedHandler);
        eventBus.subscribe(IntegrationEventType.QUOTA_UPDATED, quotaUpdatedHandler);

        // Simuler un flux de travail complet
        // 1. Creer un conge
        eventBus.publish({
            type: IntegrationEventType.LEAVE_CREATED,
            payload: {
                id: 'leave123',
                userId: 'user123',
                type: 'conge annuel',
                startDate: '2023-08-15',
                endDate: '2023-08-20'
            },
            source: 'leave-form'
        });

        // 2. Approuver le conge
        eventBus.publish({
            type: IntegrationEventType.LEAVE_APPROVED,
            payload: {
                id: 'leave123',
                userId: 'user123',
                type: 'conge annuel',
                startDate: '2023-08-15',
                endDate: '2023-08-20',
                status: 'approved'
            },
            userId: 'manager456',
            source: 'leave-approval'
        });

        // 3. Mettre a jour le quota
        eventBus.publish({
            type: IntegrationEventType.QUOTA_UPDATED,
            payload: {
                userId: 'user123',
                leaveType: 'conge annuel',
                amount: -5,
                reason: 'Conge approuve'
            },
            userId: 'system',
            source: 'quota-service'
        });

        // Attendre le traitement asynchrone
        await new Promise(resolve => setTimeout(resolve, 100));

        // Verifier que tous les handlers ont ete appeles dans l'ordre
        expect(leaveCreatedHandler).toHaveBeenCalledTimes(1);
        expect(leaveApprovedHandler).toHaveBeenCalledTimes(1);
        expect(quotaUpdatedHandler).toHaveBeenCalledTimes(1);

        // Verifier que audit a enregistre toutes les actions
        expect(auditService.createAuditEntry).toHaveBeenCalledTimes(3);
    });

    test('devrait isoler correctement les evenements entre modules', async () => {
        // Simuler des gestionnaires d'evenements pour differents modules
        const leaveModuleHandler = jest.fn();
        const planningModuleHandler = jest.fn();

        // Abonner les handlers aux evenements specifiques
        eventBus.subscribe(IntegrationEventType.LEAVE_UPDATED, leaveModuleHandler);
        eventBus.subscribe(IntegrationEventType.PLANNING_EVENT_UPDATED, planningModuleHandler);

        // Publier un evenement leave
        eventBus.publish({
            type: IntegrationEventType.LEAVE_UPDATED,
            payload: { id: 'leave123' },
            source: 'leave-module'
        });

        // Publier un evenement planning
        eventBus.publish({
            type: IntegrationEventType.PLANNING_EVENT_UPDATED,
            payload: { id: 'planning123' },
            source: 'planning-module'
        });

        // Attendre le traitement
        await new Promise(resolve => setTimeout(resolve, 50));

        // Verifier que chaque handler n'a recu que son propre type d'evenement
        expect(leaveModuleHandler).toHaveBeenCalledTimes(1);
        expect(leaveModuleHandler).toHaveBeenCalledWith(expect.objectContaining({
            type: IntegrationEventType.LEAVE_UPDATED
        }));

        expect(planningModuleHandler).toHaveBeenCalledTimes(1);
        expect(planningModuleHandler).toHaveBeenCalledWith(expect.objectContaining({
            type: IntegrationEventType.PLANNING_EVENT_UPDATED
        }));
    });
}); 