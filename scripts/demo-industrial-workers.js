#!/usr/bin/env node
/**
 * Démo industrielle du système Claude Workers
 * Simule 1000+ tests cassés pour tester la capacité d'orchestration
 */

const ClaudeTestOrchestrator = require('./claude-test-workers.js');

// Simuler une grande quantité de tests cassés
const mockFailingTests = [
    // Auth & Security (20 fichiers)
    ...Array.from({length: 20}, (_, i) => `src/lib/auth/__tests__/auth-${i}.test.ts`),
    
    // Leaves Module (50 fichiers)
    ...Array.from({length: 30}, (_, i) => `src/modules/leaves/services/__tests__/leave-service-${i}.test.ts`),
    ...Array.from({length: 20}, (_, i) => `src/modules/leaves/hooks/__tests__/use-leave-${i}.test.tsx`),
    
    // Services Core (80 fichiers)
    ...Array.from({length: 40}, (_, i) => `src/services/__tests__/service-${i}.test.ts`),
    ...Array.from({length: 20}, (_, i) => `src/services/__tests__/auditService-${i}.test.ts`),
    ...Array.from({length: 20}, (_, i) => `src/services/__tests__/loggerService-${i}.test.ts`),
    
    // Business Services (60 fichiers)
    ...Array.from({length: 30}, (_, i) => `src/services/__tests__/planning-service-${i}.test.ts`),
    ...Array.from({length: 30}, (_, i) => `src/services/__tests__/validation-service-${i}.test.ts`),
    
    // Components (100 fichiers)
    ...Array.from({length: 50}, (_, i) => `src/components/__tests__/component-${i}.test.tsx`),
    ...Array.from({length: 30}, (_, i) => `src/components/planning/__tests__/planning-component-${i}.test.tsx`),
    ...Array.from({length: 20}, (_, i) => `src/components/bloc/__tests__/bloc-component-${i}.test.tsx`),
    
    // Hooks (40 fichiers)
    ...Array.from({length: 40}, (_, i) => `src/hooks/__tests__/use-custom-${i}.test.tsx`),
    
    // Utils & Types (30 fichiers)
    ...Array.from({length: 20}, (_, i) => `src/utils/__tests__/util-${i}.test.ts`),
    ...Array.from({length: 10}, (_, i) => `src/types/__tests__/type-${i}.test.ts`),
    
    // Integration (10 fichiers)
    ...Array.from({length: 10}, (_, i) => `src/integration/__tests__/integration-${i}.test.ts`),
];

console.log('🎭 DÉMONSTRATION INDUSTRIELLE CLAUDE WORKERS');
console.log('═══════════════════════════════════════════════');
console.log(`📊 Simulation de ${mockFailingTests.length} tests cassés`);

// Créer une instance modifiée de l'orchestrateur
class IndustrialDemoOrchestrator extends ClaudeTestOrchestrator {
    analyzeFailingTests() {
        console.log('🔍 Analyse de tests en échec (SIMULATION)...', );
        
        return {
            totalFailing: mockFailingTests.length,
            failingFiles: mockFailingTests,
            rawOutput: 'Simulation output'
        };
    }
}

// Lancer la démo
const demo = new IndustrialDemoOrchestrator();
demo.run();