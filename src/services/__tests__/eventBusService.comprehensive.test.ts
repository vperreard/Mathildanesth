/**
 * @jest-environment node
 */
/**
 * @jest-environment node
 */
import { jest, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { 
  setupTestEnvironment, 
  cleanupTestEnvironment, 
  createMockPrismaClient,
  createMockBcrypt,
  createMockJWT,
  createMockLogger,
  testDataFactories 
} from '../../test-utils/standardMocks';


// Mock external dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: createMockPrismaClient()
}));

jest.mock('bcryptjs', () => createMockBcrypt());
jest.mock('jsonwebtoken', () => createMockJWT());
jest.mock('@/lib/logger', () => ({
  logger: createMockLogger()
}));

const mockPrisma = require('@/lib/prisma').prisma;
const mockBcrypt = require('bcryptjs');
const mockJwt = require('jsonwebtoken');
const mockLogger = require('@/lib/logger').logger;



describe('EventBusService - Tests Complets pour Communication Médicale', () => {
  let eventBus: EventBusService;
  let consoleMock: jest.SpyInstance;

  beforeEach(() => {
    // Réinitialiser l'instance singleton pour chaque test
    (EventBusService as any).instance = undefined;
    eventBus = EventBusService.getInstance();
    
    // Mock console.error pour capturer les erreurs
    consoleMock = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    eventBus.clearAllListeners();
    consoleMock.mockRestore();
  });

  describe('CRITICITÉ HAUTE - Pattern Singleton', () => {
    it('devrait retourner la même instance à chaque appel', () => {
      const instance1 = EventBusService.getInstance();
      const instance2 = EventBusService.getInstance();
      const instance3 = EventBusService.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
      expect(instance1).toBe(eventBus);
    });

    it('devrait maintenir l\'état partagé entre les accès', () => {
      const callback = jest.fn();
      
      const bus1 = EventBusService.getInstance();
      bus1.subscribe('test-event', callback);
      
      const bus2 = EventBusService.getInstance();
      bus2.emit({ type: 'test-event', data: 'test' });
      
      expect(callback).toHaveBeenCalledWith({ type: 'test-event', data: 'test' });
    });

    it('devrait être thread-safe pour usage médical critique', () => {
      // Simuler accès concurrent
      const instances = [];
      for (let i = 0; i < 100; i++) {
        instances.push(EventBusService.getInstance());
      }

      // Toutes les instances devraient être identiques
      instances.forEach(instance => {
        expect(instance).toBe(eventBus);
      });
    });
  });

  describe('CRITICITÉ HAUTE - Subscription et Publication', () => {
    describe('subscribe', () => {
      it('devrait permettre l\'abonnement à des événements médicaux', () => {
        const callback = jest.fn();
        
        const unsubscribe = eventBus.subscribe('patient-emergency', callback);
        
        expect(typeof unsubscribe).toBe('function');
        
        eventBus.emit({ type: 'patient-emergency', data: { patientId: '123', severity: 'high' } });
        
        expect(callback).toHaveBeenCalledWith({
          type: 'patient-emergency',
          data: { patientId: '123', severity: 'high' }
        });
      });

      it('devrait supporter plusieurs abonnés pour le même événement', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        const callback3 = jest.fn();

        eventBus.subscribe('shift-change', callback1);
        eventBus.subscribe('shift-change', callback2);
        eventBus.subscribe('shift-change', callback3);

        eventBus.emit({ type: 'shift-change', data: { from: 'day', to: 'night' } });

        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
        expect(callback3).toHaveBeenCalledTimes(1);
      });

      it('devrait permettre l\'abonnement à plusieurs types d\'événements', () => {
        const emergencyCallback = jest.fn();
        const scheduleCallback = jest.fn();
        const maintenanceCallback = jest.fn();

        eventBus.subscribe('patient-emergency', emergencyCallback);
        eventBus.subscribe('schedule-update', scheduleCallback);
        eventBus.subscribe('system-maintenance', maintenanceCallback);

        eventBus.emit({ type: 'patient-emergency', data: {} });
        eventBus.emit({ type: 'schedule-update', data: {} });
        eventBus.emit({ type: 'system-maintenance', data: {} });

        expect(emergencyCallback).toHaveBeenCalledTimes(1);
        expect(scheduleCallback).toHaveBeenCalledTimes(1);
        expect(maintenanceCallback).toHaveBeenCalledTimes(1);
      });

      it('devrait créer automatiquement les listes d\'événements', () => {
        const callback = jest.fn();
        
        // Événement qui n'existe pas encore
        eventBus.subscribe('new-medical-protocol', callback);
        eventBus.emit({ type: 'new-medical-protocol', data: { protocolId: 'PROT001' } });
        
        expect(callback).toHaveBeenCalledWith({
          type: 'new-medical-protocol',
          data: { protocolId: 'PROT001' }
        });
      });
    });

    describe('emit & publish', () => {
      it('devrait émettre des événements avec données complètes', () => {
        const callback = jest.fn();
        eventBus.subscribe('medication-alert', callback);

        const medicationData = {
          patientId: 'P001',
          medicationId: 'MED123',
          alertType: 'interaction',
          severity: 'critical',
          timestamp: new Date().toISOString()
        };

        eventBus.emit({ type: 'medication-alert', data: medicationData });

        expect(callback).toHaveBeenCalledWith({
          type: 'medication-alert',
          data: medicationData
        });
      });

      it('devrait supporter publish comme alias d\'emit', () => {
        const callback = jest.fn();
        eventBus.subscribe('test-event', callback);

        eventBus.publish({ type: 'test-event', data: 'publish test' });
        eventBus.emit({ type: 'test-event', data: 'emit test' });

        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenNthCalledWith(1, { type: 'test-event', data: 'publish test' });
        expect(callback).toHaveBeenNthCalledWith(2, { type: 'test-event', data: 'emit test' });
      });

      it('devrait gérer les événements sans données', () => {
        const callback = jest.fn();
        eventBus.subscribe('simple-notification', callback);

        eventBus.emit({ type: 'simple-notification' });

        expect(callback).toHaveBeenCalledWith({
          type: 'simple-notification'
        });
      });

      it('devrait ignorer les événements sans abonnés', () => {
        // Aucun callback enregistré
        expect(() => {
          eventBus.emit({ type: 'orphan-event', data: 'no listeners' });
        }).not.toThrow();
      });

      it('devrait gérer les données complexes médicales', () => {
        const callback = jest.fn();
        eventBus.subscribe('patient-status-update', callback);

        const complexPatientData = {
          patient: {
            id: 'P001',
            name: 'John Doe',
            age: 45,
            conditions: ['diabetes', 'hypertension']
          },
          vitals: {
            heartRate: 78,
            bloodPressure: '140/90',
            temperature: 37.2,
            timestamp: new Date()
          },
          medications: [
            { name: 'Metformin', dosage: '500mg', frequency: 'twice daily' },
            { name: 'Lisinopril', dosage: '10mg', frequency: 'once daily' }
          ],
          assignedStaff: [
            { id: 'DOC001', role: 'physician', name: 'Dr. Smith' },
            { id: 'NURSE001', role: 'nurse', name: 'Jane Wilson' }
          ]
        };

        eventBus.emit({ type: 'patient-status-update', data: complexPatientData });

        expect(callback).toHaveBeenCalledWith({
          type: 'patient-status-update',
          data: complexPatientData
        });
      });
    });
  });

  describe('CRITICITÉ HAUTE - Désabonnement', () => {
    it('devrait permettre le désabonnement via la fonction retournée', () => {
      const callback = jest.fn();
      
      const unsubscribe = eventBus.subscribe('surgery-scheduled', callback);
      
      // Émettre avant désabonnement
      eventBus.emit({ type: 'surgery-scheduled', data: { surgeryId: 'S001' } });
      expect(callback).toHaveBeenCalledTimes(1);
      
      // Désabonner
      unsubscribe();
      
      // Émettre après désabonnement
      eventBus.emit({ type: 'surgery-scheduled', data: { surgeryId: 'S002' } });
      expect(callback).toHaveBeenCalledTimes(1); // Pas d'appel supplémentaire
    });

    it('devrait gérer le désabonnement multiples sans erreur', () => {
      const callback = jest.fn();
      const unsubscribe = eventBus.subscribe('test-event', callback);

      // Désabonnements multiples
      expect(() => {
        unsubscribe();
        unsubscribe();
        unsubscribe();
      }).not.toThrow();
    });

    it('devrait maintenir les autres abonnés lors du désabonnement', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      const unsubscribe1 = eventBus.subscribe('equipment-malfunction', callback1);
      eventBus.subscribe('equipment-malfunction', callback2);
      eventBus.subscribe('equipment-malfunction', callback3);

      // Désabonner callback1
      unsubscribe1();

      eventBus.emit({ type: 'equipment-malfunction', data: { equipmentId: 'EQ001' } });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    it('devrait gérer le désabonnement de callbacks inexistants', () => {
      const callback = jest.fn();
      const unsubscribe = eventBus.subscribe('test-event', callback);

      // Supprimer manuellement le callback
      eventBus.clearEventListeners('test-event');

      // Le désabonnement ne devrait pas causer d'erreur
      expect(() => {
        unsubscribe();
      }).not.toThrow();
    });
  });

  describe('CRITICITÉ HAUTE - Gestion d\'Erreurs', () => {
    it('devrait capturer et logger les erreurs dans les callbacks', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = jest.fn();

      eventBus.subscribe('critical-alert', errorCallback);
      eventBus.subscribe('critical-alert', normalCallback);

      eventBus.emit({ type: 'critical-alert', data: { alert: 'test' } });

      // Les deux callbacks devraient être appelés
      expect(errorCallback).toHaveBeenCalledTimes(1);
      expect(normalCallback).toHaveBeenCalledTimes(1);

      // L'erreur devrait être loggée
      expect(consoleMock).toHaveBeenCalledWith(
        'Erreur lors de l\'exécution d\'un listener pour l\'événement critical-alert:',
        expect.any(Error)
      );
    });

    it('devrait continuer l\'exécution malgré les erreurs de callback', () => {
      const errorCallback1 = jest.fn(() => { throw new Error('Error 1'); });
      const errorCallback2 = jest.fn(() => { throw new Error('Error 2'); });
      const successCallback = jest.fn();

      eventBus.subscribe('system-error', errorCallback1);
      eventBus.subscribe('system-error', errorCallback2);
      eventBus.subscribe('system-error', successCallback);

      eventBus.emit({ type: 'system-error', data: {} });

      expect(errorCallback1).toHaveBeenCalledTimes(1);
      expect(errorCallback2).toHaveBeenCalledTimes(1);
      expect(successCallback).toHaveBeenCalledTimes(1);
      expect(consoleMock).toHaveBeenCalledTimes(2);
    });

    it('devrait gérer les callbacks avec des erreurs asynchrones', async () => {
      const asyncErrorCallback = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Async error');
      });

      eventBus.subscribe('async-event', asyncErrorCallback);

      // L'émission ne devrait pas attendre les callbacks async
      expect(() => {
        eventBus.emit({ type: 'async-event', data: {} });
      }).not.toThrow();

      expect(asyncErrorCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('CRITICITÉ MOYENNE - Nettoyage et Maintenance', () => {
    describe('clearEventListeners', () => {
      it('devrait nettoyer tous les listeners d\'un type d\'événement', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        const callback3 = jest.fn();

        eventBus.subscribe('room-occupied', callback1);
        eventBus.subscribe('room-occupied', callback2);
        eventBus.subscribe('other-event', callback3);

        eventBus.clearEventListeners('room-occupied');

        eventBus.emit({ type: 'room-occupied', data: {} });
        eventBus.emit({ type: 'other-event', data: {} });

        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
        expect(callback3).toHaveBeenCalledTimes(1);
      });

      it('devrait gérer le nettoyage d\'événements inexistants', () => {
        expect(() => {
          eventBus.clearEventListeners('non-existent-event');
        }).not.toThrow();
      });
    });

    describe('clearAllListeners', () => {
      it('devrait nettoyer tous les listeners de tous les événements', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        const callback3 = jest.fn();

        eventBus.subscribe('event1', callback1);
        eventBus.subscribe('event2', callback2);
        eventBus.subscribe('event3', callback3);

        eventBus.clearAllListeners();

        eventBus.emit({ type: 'event1', data: {} });
        eventBus.emit({ type: 'event2', data: {} });
        eventBus.emit({ type: 'event3', data: {} });

        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
        expect(callback3).not.toHaveBeenCalled();
      });

      it('devrait permettre de nouveaux abonnements après nettoyage complet', () => {
        const oldCallback = jest.fn();
        const newCallback = jest.fn();

        eventBus.subscribe('test-event', oldCallback);
        eventBus.clearAllListeners();
        eventBus.subscribe('test-event', newCallback);

        eventBus.emit({ type: 'test-event', data: {} });

        expect(oldCallback).not.toHaveBeenCalled();
        expect(newCallback).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('CRITICITÉ HAUTE - Scénarios Médicaux Réalistes', () => {
    it('devrait gérer un workflow complet d\'urgence médicale', () => {
      const emergencyDispatcher = jest.fn();
      const nursesAlert = jest.fn();
      const doctorAlert = jest.fn();
      const equipmentCheck = jest.fn();
      const securityNotify = jest.fn();

      // Abonnements pour une urgence
      eventBus.subscribe('emergency-declared', emergencyDispatcher);
      eventBus.subscribe('emergency-declared', nursesAlert);
      eventBus.subscribe('emergency-declared', doctorAlert);
      eventBus.subscribe('emergency-declared', equipmentCheck);
      eventBus.subscribe('emergency-declared', securityNotify);

      const emergencyData = {
        patientId: 'P001',
        roomId: 'ER-001',
        severity: 'critical',
        type: 'cardiac-arrest',
        timestamp: new Date().toISOString(),
        reportedBy: 'NURSE001'
      };

      eventBus.emit({ type: 'emergency-declared', data: emergencyData });

      // Tous les systèmes devraient être alertés
      expect(emergencyDispatcher).toHaveBeenCalledWith({
        type: 'emergency-declared',
        data: emergencyData
      });
      expect(nursesAlert).toHaveBeenCalledTimes(1);
      expect(doctorAlert).toHaveBeenCalledTimes(1);
      expect(equipmentCheck).toHaveBeenCalledTimes(1);
      expect(securityNotify).toHaveBeenCalledTimes(1);
    });

    it('devrait gérer la communication entre services de planning', () => {
      const planningUpdate = jest.fn();
      const staffNotification = jest.fn();
      const resourceReallocation = jest.fn();

      eventBus.subscribe('schedule-changed', planningUpdate);
      eventBus.subscribe('schedule-changed', staffNotification);
      eventBus.subscribe('schedule-changed', resourceReallocation);

      const scheduleChange = {
        type: 'shift-swap',
        originalStaff: 'DOC001',
        newStaff: 'DOC002',
        shift: {
          date: '2024-03-15',
          startTime: '08:00',
          endTime: '20:00',
          department: 'Emergency'
        },
        reason: 'sick-leave'
      };

      eventBus.emit({ type: 'schedule-changed', data: scheduleChange });

      expect(planningUpdate).toHaveBeenCalledTimes(1);
      expect(staffNotification).toHaveBeenCalledTimes(1);
      expect(resourceReallocation).toHaveBeenCalledTimes(1);
    });

    it('devrait gérer les notifications de maintenance d\'équipement', () => {
      const maintenanceScheduler = jest.fn();
      const operationsAlert = jest.fn();
      const inventoryUpdate = jest.fn();

      eventBus.subscribe('equipment-maintenance', maintenanceScheduler);
      eventBus.subscribe('equipment-maintenance', operationsAlert);
      eventBus.subscribe('equipment-maintenance', inventoryUpdate);

      const maintenanceData = {
        equipmentId: 'MRI-001',
        maintenanceType: 'preventive',
        scheduledDate: '2024-03-20',
        estimatedDuration: '4 hours',
        priority: 'medium',
        affectedServices: ['Radiology', 'Emergency']
      };

      eventBus.emit({ type: 'equipment-maintenance', data: maintenanceData });

      expect(maintenanceScheduler).toHaveBeenCalledWith({
        type: 'equipment-maintenance',
        data: maintenanceData
      });
      expect(operationsAlert).toHaveBeenCalledTimes(1);
      expect(inventoryUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('PERFORMANCE ET ROBUSTESSE', () => {
    it('devrait gérer un grand nombre d\'abonnés efficacement', () => {
      const callbacks = Array.from({ length: 1000 }, () => jest.fn());
      
      // Abonner 1000 callbacks
      callbacks.forEach(callback => {
        eventBus.subscribe('high-volume-event', callback);
      });

      const startTime = performance.now();
      eventBus.emit({ type: 'high-volume-event', data: { test: 'data' } });
      const endTime = performance.now();

      // Tous les callbacks devraient être appelés
      callbacks.forEach(callback => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // L'émission devrait être rapide même avec beaucoup d'abonnés
      expect(endTime - startTime).toBeLessThan(100); // <100ms
    });

    it('devrait gérer de nombreux événements différents', () => {
      const callbacks = new Map();
      
      // Créer 100 types d'événements différents
      for (let i = 0; i < 100; i++) {
        const callback = jest.fn();
        const eventType = `medical-event-${i}`;
        callbacks.set(eventType, callback);
        eventBus.subscribe(eventType, callback);
      }

      const startTime = performance.now();
      
      // Émettre tous les événements
      for (let i = 0; i < 100; i++) {
        eventBus.emit({ type: `medical-event-${i}`, data: { eventNumber: i } });
      }
      
      const endTime = performance.now();

      // Vérifier que tous ont été appelés
      callbacks.forEach((callback, eventType) => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      expect(endTime - startTime).toBeLessThan(50); // <50ms pour 100 événements
    });

    it('devrait maintenir la performance avec des données volumineuses', () => {
      const callback = jest.fn();
      eventBus.subscribe('large-data-event', callback);

      // Créer un objet de données volumineux
      const largeData = {
        patients: Array.from({ length: 1000 }, (_, i) => ({
          id: `P${i.toString().padStart(4, '0')}`,
          name: `Patient ${i}`,
          data: Array.from({ length: 100 }, (_, j) => `data-${j}`)
        }))
      };

      const startTime = performance.now();
      eventBus.emit({ type: 'large-data-event', data: largeData });
      const endTime = performance.now();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(endTime - startTime).toBeLessThan(50); // <50ms même avec données volumineuses
    });

    it('devrait être stable lors d\'opérations concurrentes', () => {
      const callbacks = [];
      const unsubscribers = [];

      // Abonnements concurrents
      for (let i = 0; i < 50; i++) {
        const callback = jest.fn();
        callbacks.push(callback);
        const unsubscribe = eventBus.subscribe('concurrent-event', callback);
        unsubscribers.push(unsubscribe);
      }

      // Émissions concurrentes
      for (let i = 0; i < 10; i++) {
        eventBus.emit({ type: 'concurrent-event', data: { iteration: i } });
      }

      // Désabonnements concurrents
      unsubscribers.forEach((unsubscribe, index) => {
        if (index % 2 === 0) {
          unsubscribe();
        }
      });

      // Nouvelle émission
      eventBus.emit({ type: 'concurrent-event', data: { final: true } });

      // Vérifier la cohérence
      callbacks.forEach((callback, index) => {
        if (index % 2 === 0) {
          // Désabonnés - devraient avoir 10 appels (avant désabonnement)
          expect(callback).toHaveBeenCalledTimes(10);
        } else {
          // Toujours abonnés - devraient avoir 11 appels
          expect(callback).toHaveBeenCalledTimes(11);
        }
      });
    });
  });
});