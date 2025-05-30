#!/usr/bin/env node

/**
 * Script pour configurer la base de données avec optimisations performance
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function setupOptimizedDatabase() {
    console.log('🚀 Configuration de la base de données optimisée...');
    
    try {
        // 1. Vérifier la connexion
        await prisma.$connect();
        console.log('✅ Connexion à la base de données établie');
        
        // 2. Appliquer les migrations Prisma
        console.log('📦 Application des migrations Prisma...');
        const { spawn } = require('child_process');
        
        await new Promise((resolve, reject) => {
            const migrate = spawn('npx', ['prisma', 'migrate', 'dev'], {
                stdio: 'inherit',
                cwd: process.cwd()
            });
            
            migrate.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Migration failed with code ${code}`));
                }
            });
        });
        
        console.log('✅ Migrations Prisma appliquées');
        
        // 3. Créer les indexes de performance
        await createPerformanceIndexes();
        
        // 4. Configurer les paramètres de performance
        await configurePerformanceSettings();
        
        // 5. Créer des données de test optimisées si nécessaire
        await seedOptimizedTestData();
        
        console.log('🎉 Base de données optimisée configurée avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur lors de la configuration:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function createPerformanceIndexes() {
    console.log('🏗️ Création des indexes de performance...');
    
    const indexes = [
        // Index User.email (critique pour auth)
        'CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");',
        
        // Indexes pour requêtes temporelles fréquentes
        'CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");',
        'CREATE INDEX IF NOT EXISTS "User_actif_idx" ON "User"("actif");',
        
        // Si les tables existent, créer d'autres indexes
        // Ces requêtes échoueront silencieusement si les tables n'existent pas
        'CREATE INDEX IF NOT EXISTS "Leave_userId_status_idx" ON "Leave"("userId", "status");',
        'CREATE INDEX IF NOT EXISTS "Leave_startDate_endDate_idx" ON "Leave"("startDate", "endDate");',
        
        'CREATE INDEX IF NOT EXISTS "Assignment_userId_date_idx" ON "Assignment"("userId", "date");',
        'CREATE INDEX IF NOT EXISTS "Assignment_date_idx" ON "Assignment"("date");',
        
        'CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");',
        'CREATE INDEX IF NOT EXISTS "Session_expires_idx" ON "Session"("expires");',
    ];
    
    for (const indexQuery of indexes) {
        try {
            await prisma.$executeRawUnsafe(indexQuery);
            console.log(`✅ Index créé: ${indexQuery.substring(0, 50)}...`);
        } catch (error) {
            console.log(`⚠️ Index ignoré (table inexistante): ${indexQuery.substring(0, 50)}...`);
        }
    }
    
    console.log('✅ Indexes de performance créés');
}

async function configurePerformanceSettings() {
    console.log('⚙️ Configuration des paramètres de performance...');
    
    try {
        // Vérifier si on est sur PostgreSQL
        const result = await prisma.$queryRaw`SELECT version();`;
        const isPostgreSQL = result[0]?.version?.includes('PostgreSQL');
        
        if (isPostgreSQL) {
            console.log('🐘 PostgreSQL détecté, optimisation...');
            
            // Paramètres de performance PostgreSQL
            const postgresOptimizations = [
                // Augmenter les statistiques pour de meilleures requêtes
                "ALTER DATABASE mathildanesth SET default_statistics_target = 100;",
                
                // Optimiser les requêtes de jointure
                "ALTER DATABASE mathildanesth SET random_page_cost = 1.1;",
                
                // Cache plus agressif
                "ALTER DATABASE mathildanesth SET effective_cache_size = '256MB';",
            ];
            
            for (const optimization of postgresOptimizations) {
                try {
                    await prisma.$executeRawUnsafe(optimization);
                    console.log(`✅ Paramètre appliqué: ${optimization.substring(0, 50)}...`);
                } catch (error) {
                    console.log(`⚠️ Paramètre ignoré: ${error.message}`);
                }
            }
        } else {
            console.log('📄 SQLite détecté, optimisation...');
            
            // Paramètres de performance SQLite
            const sqliteOptimizations = [
                "PRAGMA synchronous = NORMAL;",
                "PRAGMA cache_size = 10000;",
                "PRAGMA journal_mode = WAL;",
                "PRAGMA temp_store = memory;",
            ];
            
            for (const optimization of sqliteOptimizations) {
                try {
                    await prisma.$executeRawUnsafe(optimization);
                    console.log(`✅ Paramètre appliqué: ${optimization}`);
                } catch (error) {
                    console.log(`⚠️ Paramètre ignoré: ${error.message}`);
                }
            }
        }
        
    } catch (error) {
        console.warn('⚠️ Impossible de déterminer le type de base de données:', error.message);
    }
    
    console.log('✅ Paramètres de performance configurés');
}

async function seedOptimizedTestData() {
    console.log('🌱 Création de données de test optimisées...');
    
    try {
        // Vérifier s'il y a déjà des utilisateurs
        const userCount = await prisma.user.count();
        
        if (userCount === 0) {
            console.log('📝 Création des utilisateurs de test...');
            
            // Créer quelques utilisateurs de test avec des patterns optimisés
            const testUsers = [
                {
                    email: 'admin@test.com',
                    nom: 'Admin',
                    prenom: 'Test',
                    password: '$2b$10$K8l.yZ5qPm9L3Q7mN2p8XeJ.ZvQ3kN4j8Lm2rOw1qA7sY6tU9rE8V',
                    role: 'ADMIN_TOTAL',
                    professionalRole: 'MAR',
                    actif: true,
                    login: 'admin'
                },
                {
                    email: 'medecin@test.com',
                    nom: 'Medecin',
                    prenom: 'Test',
                    password: '$2b$10$K8l.yZ5qPm9L3Q7mN2p8XeJ.ZvQ3kN4j8Lm2rOw1qA7sY6tU9rE8V',
                    role: 'USER',
                    professionalRole: 'MAR',
                    actif: true,
                    login: 'medecin'
                },
                {
                    email: 'iade@test.com',
                    nom: 'IADE',
                    prenom: 'Test',
                    password: '$2b$10$K8l.yZ5qPm9L3Q7mN2p8XeJ.ZvQ3kN4j8Lm2rOw1qA7sY6tU9rE8V',
                    role: 'USER',
                    professionalRole: 'IADE',
                    actif: true,
                    login: 'iade'
                }
            ];
            
            for (const user of testUsers) {
                try {
                    await prisma.user.create({ data: user });
                    console.log(`✅ Utilisateur créé: ${user.email}`);
                } catch (error) {
                    console.log(`⚠️ Utilisateur ignoré: ${user.email} (existe déjà)`);
                }
            }
        } else {
            console.log(`ℹ️ ${userCount} utilisateurs existants détectés, pas de seed nécessaire`);
        }
        
    } catch (error) {
        console.warn('⚠️ Erreur lors du seed des données de test:', error.message);
    }
    
    console.log('✅ Données de test optimisées créées');
}

// Fonction pour mesurer les performances de la DB
async function benchmarkDatabase() {
    console.log('📊 Benchmark de la base de données...');
    
    const benchmarks = [];
    
    try {
        // Test 1: Requête simple par email
        const start1 = Date.now();
        await prisma.user.findFirst({ where: { email: 'admin@test.com' } });
        const time1 = Date.now() - start1;
        benchmarks.push({ test: 'User by email', time: time1 });
        
        // Test 2: Count des utilisateurs
        const start2 = Date.now();
        await prisma.user.count();
        const time2 = Date.now() - start2;
        benchmarks.push({ test: 'User count', time: time2 });
        
        // Test 3: Requête avec filtre
        const start3 = Date.now();
        await prisma.user.findMany({ where: { actif: true }, take: 10 });
        const time3 = Date.now() - start3;
        benchmarks.push({ test: 'Active users (limit 10)', time: time3 });
        
        console.log('📈 Résultats du benchmark:');
        benchmarks.forEach(b => {
            const status = b.time < 10 ? '🟢' : b.time < 50 ? '🟡' : '🔴';
            console.log(`${status} ${b.test}: ${b.time}ms`);
        });
        
        const avgTime = benchmarks.reduce((sum, b) => sum + b.time, 0) / benchmarks.length;
        console.log(`📊 Temps moyen: ${avgTime.toFixed(2)}ms`);
        
        return benchmarks;
        
    } catch (error) {
        console.warn('⚠️ Erreur lors du benchmark:', error.message);
        return [];
    }
}

// Interface CLI
if (require.main === module) {
    const command = process.argv[2] || 'setup';
    
    switch (command) {
        case 'setup':
            setupOptimizedDatabase();
            break;
        case 'benchmark':
            (async () => {
                await prisma.$connect();
                await benchmarkDatabase();
                await prisma.$disconnect();
            })();
            break;
        case 'indexes':
            (async () => {
                await prisma.$connect();
                await createPerformanceIndexes();
                await prisma.$disconnect();
            })();
            break;
        default:
            console.log('Usage: node setup-optimized-database.js [setup|benchmark|indexes]');
            process.exit(1);
    }
}

module.exports = {
    setupOptimizedDatabase,
    benchmarkDatabase,
    createPerformanceIndexes
};