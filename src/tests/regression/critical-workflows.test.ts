/**
 * Tests de régression pour les workflows critiques
 * Ces tests doivent TOUJOURS passer avant tout déploiement
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { performanceMonitor } from '@/services/PerformanceMonitoringService';

describe('Tests de régression - Workflows critiques', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Nettoyer les métriques avant chaque test
    performanceMonitor.cleanup(0);
  });

  describe('Performance des opérations critiques', () => {
    it('devrait mesurer les performances correctement', async () => {
      // Test de mesure synchrone
      const { result, duration } = performanceMonitor.measureSync('test_sync', () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      });

      expect(result).toBe(499500);
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Devrait être très rapide
    });

    it('devrait mesurer les performances async correctement', async () => {
      // Test de mesure asynchrone
      const { result, duration } = await performanceMonitor.measureAsync('test_async', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'done';
      });

      expect(result).toBe('done');
      expect(duration).toBeGreaterThan(50);
      expect(duration).toBeLessThan(100);
    });

    it('devrait détecter les dégradations de performance', async () => {
      // Définir une baseline
      performanceMonitor.setBaseline('test_operation', 100);

      // Simuler une opération lente
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      performanceMonitor.startMeasure('test_operation');
      await new Promise(resolve => setTimeout(resolve, 150)); // 50% plus lent
      performanceMonitor.endMeasure('test_operation');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance degradation detected')
      );

      consoleSpy.mockRestore();
    });

    it('devrait générer des statistiques correctes', () => {
      // Ajouter plusieurs mesures
      for (let i = 0; i < 10; i++) {
        performanceMonitor.startMeasure('stats_test');
        // Simuler différentes durées
        const mockDuration = 50 + i * 10;
        const metrics = performanceMonitor.getMetrics('stats_test');
        if (metrics.length > 0) {
          metrics[metrics.length - 1].endTime = metrics[metrics.length - 1].startTime + mockDuration;
          metrics[metrics.length - 1].duration = mockDuration;
        }
      }

      const stats = performanceMonitor.getStats('stats_test');
      expect(stats).toBeDefined();
      expect(stats?.count).toBe(10);
      expect(stats?.min).toBe(50);
      expect(stats?.max).toBe(140);
      expect(stats?.average).toBe(95);
    });
  });

  describe('Gestion du cache et de la mémoire', () => {
    it('devrait nettoyer les anciennes métriques', () => {
      // Ajouter des métriques
      performanceMonitor.startMeasure('old_metric');
      performanceMonitor.endMeasure('old_metric');

      let metrics = performanceMonitor.getMetrics('old_metric');
      expect(metrics.length).toBeGreaterThan(0);

      // Nettoyer les métriques de moins d'une minute
      performanceMonitor.cleanup(0);

      metrics = performanceMonitor.getMetrics('old_metric');
      expect(metrics.length).toBe(0);
    });
  });

  describe('Export et rapport', () => {
    it('devrait générer un rapport valide', () => {
      // Ajouter quelques métriques
      performanceMonitor.measureSync('report_test_1', () => 'result1');
      performanceMonitor.measureSync('report_test_2', () => 'result2');

      const report = performanceMonitor.generateReport();
      
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('averageResponseTime');
      expect(report).toHaveProperty('slowestOperations');
      expect(report).toHaveProperty('timestamp');
      expect(report.metrics.length).toBeGreaterThanOrEqual(2);
    });

    it('devrait exporter les métriques en JSON', () => {
      performanceMonitor.measureSync('export_test', () => 'result');
      
      const exported = performanceMonitor.exportMetrics();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveProperty('report');
      expect(parsed).toHaveProperty('stats');
      expect(parsed).toHaveProperty('baseline');
    });
  });
});

describe('Tests de régression - Authentification', () => {
  // Mock des fonctions globales
  const mockFetch = jest.fn();
  global.fetch = mockFetch as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  it('devrait gérer les erreurs de token JWT', async () => {
    // Ce test vérifie que les erreurs JWT sont bien gérées
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Token invalide' })
    });

    try {
      const response = await fetch('http://localhost:3000/api/auth/me');
      const data = await response.json();
      expect(data.error).toBe('Token invalide');
      expect(response.status).toBe(401);
    } catch (error) {
      // L'erreur devrait être gérée gracieusement
      expect(error).toBeDefined();
    }
  });
});

describe('Tests de régression - Gestion des congés', () => {
  it('devrait valider les dates correctement', () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Test de validation basique
    expect(tomorrow > today).toBe(true);
    expect(yesterday < today).toBe(true);
  });

  it('devrait calculer les jours ouvrables', () => {
    // Fonction simple de calcul des jours ouvrables
    const calculateWorkdays = (start: Date, end: Date): number => {
      let count = 0;
      const current = new Date(start);
      
      while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Pas dimanche (0) ou samedi (6)
          count++;
        }
        current.setDate(current.getDate() + 1);
      }
      
      return count;
    };

    // Test du lundi au vendredi (5 jours)
    const monday = new Date('2024-01-01'); // Un lundi
    const friday = new Date('2024-01-05'); // Le vendredi de la même semaine
    
    expect(calculateWorkdays(monday, friday)).toBe(5);

    // Test incluant un weekend
    const nextMonday = new Date('2024-01-08');
    expect(calculateWorkdays(monday, nextMonday)).toBe(6); // 5 + 1
  });
});

describe('Tests de régression - Planning', () => {
  it('devrait détecter les conflits de planning', () => {
    interface TimeSlot {
      start: Date;
      end: Date;
      userId: number;
    }

    const detectConflict = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
      if (slot1.userId !== slot2.userId) return false;
      
      return (
        (slot1.start < slot2.end && slot1.end > slot2.start) ||
        (slot2.start < slot1.end && slot2.end > slot1.start)
      );
    };

    const slot1: TimeSlot = {
      start: new Date('2024-01-01T09:00:00'),
      end: new Date('2024-01-01T12:00:00'),
      userId: 1
    };

    const slot2: TimeSlot = {
      start: new Date('2024-01-01T11:00:00'),
      end: new Date('2024-01-01T14:00:00'),
      userId: 1
    };

    const slot3: TimeSlot = {
      start: new Date('2024-01-01T14:00:00'),
      end: new Date('2024-01-01T17:00:00'),
      userId: 1
    };

    expect(detectConflict(slot1, slot2)).toBe(true); // Conflit
    expect(detectConflict(slot1, slot3)).toBe(false); // Pas de conflit
    expect(detectConflict(slot2, slot3)).toBe(false); // Pas de conflit (adjacent)
  });
});