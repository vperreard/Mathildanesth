// Script pour tester la connexion à Redis
require('dotenv').config();

const Redis = require('ioredis');

// Configuration Redis depuis les variables d'environnement
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_PREFIX = process.env.REDIS_PREFIX || 'mathilda:';

console.log('=== Test de connexion Redis ===');
console.log(`Tentative de connexion à Redis (${REDIS_HOST}:${REDIS_PORT}, DB ${REDIS_DB})`);

// Création du client Redis
const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    db: REDIS_DB,
    password: REDIS_PASSWORD || undefined,
    keyPrefix: REDIS_PREFIX,
    connectTimeout: 5000, // Timeout de connexion en ms
    maxRetriesPerRequest: 1, // Une seule tentative pour ce test
});

redis.on('connect', () => {
    console.log('✅ Connecté au serveur Redis');
});

redis.on('ready', async () => {
    console.log('✅ Serveur Redis prêt');

    // Tester les opérations de base
    try {
        // Tester SET
        await redis.set('test:key', 'test-value', 'EX', 60);
        console.log('✅ Opération SET réussie');

        // Tester GET
        const value = await redis.get('test:key');
        console.log(`✅ Opération GET réussie, valeur récupérée: ${value}`);

        // Tester DEL
        await redis.del('test:key');
        console.log('✅ Opération DEL réussie');

        console.log('Tests réussis! Redis fonctionne correctement.');
    } catch (error) {
        console.error('❌ Erreur lors des tests d\'opérations Redis:', error);
    }

    // Fermer la connexion
    redis.quit();
});

redis.on('error', (error) => {
    console.error('❌ Erreur de connexion Redis:', error);
    process.exit(1);
});

// Timeout pour éviter que le script reste bloqué indéfiniment
setTimeout(() => {
    console.error('❌ Timeout: Impossible de se connecter à Redis dans le délai imparti');
    redis.quit();
    process.exit(1);
}, 6000); 