// src/services/__mocks__/AuditService.ts

// Importer jest pour les fonctions mock
import { jest } from '@jest/globals';

// Mock de la méthode logAction
const mockLogAction = jest.fn().mockResolvedValue({});

// Mock de l'instance retournée par getInstance
const mockAuditInstance = {
    logAction: mockLogAction,
    // Ajouter d'autres méthodes si nécessaire pour les tests
    getAuditHistory: jest.fn().mockResolvedValue([]),
    getUserAuditHistory: jest.fn().mockResolvedValue([]),
    setDebugMode: jest.fn(),
};

// Mock de la classe AuditService
export const AuditService = {
    // Mock de la méthode statique getInstance
    getInstance: jest.fn().mockReturnValue(mockAuditInstance),
    // Exporter les mocks individuels pour pouvoir les vérifier dans les tests si besoin
    _mockInstance: mockAuditInstance,
    _mockLogAction: mockLogAction,
};

// Exporter comme défaut pour correspondre à l'export réel
export default AuditService; 