#!/usr/bin/env node

console.log('🔍 Test de correction Redis Edge Runtime');

// Simuler l'environnement Edge Runtime
global.EdgeRuntime = { version: '1.0' };

try {
    // Tenter d'importer le module Redis
    const redisModule = require('./src/lib/redis.ts');
    console.log('✅ Module Redis importé avec succès');
    console.log('📊 Redis activé:', redisModule.redis?.isEnabled());
} catch (error) {
    console.error('❌ Erreur lors de l\'import du module Redis:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
}

// Test sans Edge Runtime
delete global.EdgeRuntime;

try {
    // Nettoyer le cache et re-tester
    delete require.cache[require.resolve('./src/lib/redis.ts')];
    const redisModule2 = require('./src/lib/redis.ts');
    console.log('✅ Module Redis sans Edge Runtime importé avec succès');
} catch (error) {
    console.error('❌ Erreur sans Edge Runtime:');
    console.error(error.message);
} 