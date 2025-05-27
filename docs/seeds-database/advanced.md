# Personnalisation avancée - Seeds & Export/Import

## 🔧 Architecture modulaire des seeds

### Structure recommandée pour seeds complexes

```typescript
// prisma/seeds/base/
├── users.seed.ts         // Seeds utilisateurs
├── specialties.seed.ts   // Seeds spécialités
├── surgeons.seed.ts      // Seeds chirurgiens
└── index.ts              // Orchestrateur

// prisma/seeds/test/
├── leaves.seed.ts        // Seeds congés test
├── planning.seed.ts      // Seeds planning test
└── index.ts              // Orchestrateur test

// prisma/seeds/production/
├── migration.seed.ts     // Migration données prod
└── fixtures.seed.ts      // Fixtures spécifiques prod
```

**Exemple d'orchestrateur** :

```typescript
// prisma/seeds/base/index.ts
import { PrismaClient } from '@prisma/client';
import { seedUsers } from './utilisateurs.seed';
import { seedSpecialties } from './specialties.seed';
import { seedSurgeons } from './chirurgiens.seed';

const prisma = new PrismaClient();

export async function seedBaseData(options: {
    skipExisting?: boolean;
    verbose?: boolean;
    dryRun?: boolean;
}) {
    const { skipExisting = false, verbose = false, dryRun = false } = options;
    
    if (verbose) console.log('🌱 Début seeding données de base...');
    
    const results = {
        users: 0,
        specialties: 0,
        surgeons: 0,
        errors: []
    };

    try {
        // 1. Spécialités (dépendance de chirurgiens)
        if (verbose) console.log('📋 Seeding spécialités...');
        results.specialties = await seedSpecialties(prisma, { skipExisting, dryRun });
        
        // 2. Utilisateurs
        if (verbose) console.log('👥 Seeding utilisateurs...');
        results.users = await seedUsers(prisma, { skipExisting, dryRun });
        
        // 3. Chirurgiens (nécessite spécialités)
        if (verbose) console.log('👨‍⚕️ Seeding chirurgiens...');
        results.surgeons = await seedSurgeons(prisma, { skipExisting, dryRun });
        
        if (verbose) {
            console.log('✅ Seeding terminé:');
            console.log(`   - Utilisateurs: ${results.users}`);
            console.log(`   - Spécialités: ${results.specialties}`);
            console.log(`   - Chirurgiens: ${results.surgeons}`);
        }
        
        return results;
        
    } catch (error) {
        results.errors.push(error.message);
        throw error;
    }
}

// Usage depuis le seed principal
if (require.main === module) {
    seedBaseData({ verbose: true })
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
```

## 📊 Factory Pattern pour génération de données

### Factory pour utilisateurs réalistes

```typescript
// prisma/seeds/factories/user.factory.ts
import { faker } from '@faker-js/faker';
import { ProfessionalRole } from '@prisma/client';

interface UserFactoryOptions {
    role?: ProfessionalRole;
    partTime?: boolean;
    startDate?: Date;
    department?: string;
    seniority?: 'junior' | 'senior' | 'expert';
}

export class UserFactory {
    static create(options: UserFactoryOptions = {}) {
        const {
            role = faker.helpers.arrayElement(['MAR', 'IADE', 'SECRETAIRE']),
            partTime = faker.datatype.boolean(0.2), // 20% temps partiel
            startDate = faker.date.past(5),
            department = 'Anesthésie',
            seniority = faker.helpers.arrayElement(['junior', 'senior', 'expert'])
        } = options;

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName().toUpperCase();
        const login = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
        
        // Générer pattern de travail selon séniorité
        const workPattern = this.generateWorkPattern(role, seniority, partTime);
        
        // Email selon le département
        const email = `${login}@${department.toLowerCase()}.hopital.fr`;
        
        return {
            nom: lastName,
            prenom: firstName,
            login,
            email,
            role: 'UTILISATEUR',
            professionalRole: role,
            tempsPartiel: partTime,
            pourcentageTempsPartiel: partTime ? faker.number.int({ min: 50, max: 90 }) : null,
            dateEntree: startDate,
            dateSortie: null,
            actif: true,
            phoneNumber: faker.phone.number('01########'),
            alias: `${firstName.charAt(0)}.${lastName}`,
            workPattern: workPattern.pattern,
            joursTravaillesSemaineImpaire: workPattern.oddWeek,
            joursTravaillesSemainePaire: workPattern.evenWeek,
            // Métadonnées pour tests
            _metadata: {
                seniority,
                department,
                generatedAt: new Date().toISOString()
            }
        };
    }

    static createBatch(count: number, options: UserFactoryOptions = {}) {
        return Array.from({ length: count }, () => this.create(options));
    }

    static createTeam(config: {
        mars: number;
        iades: number;
        secretaires: number;
        department: string;
    }) {
        const { mars, iades, secretaires, department } = config;
        
        return [
            ...this.createBatch(mars, { role: 'MAR', department }),
            ...this.createBatch(iades, { role: 'IADE', department }),
            ...this.createBatch(secretaires, { role: 'SECRETAIRE', department })
        ];
    }

    private static generateWorkPattern(
        role: ProfessionalRole, 
        seniority: string, 
        partTime: boolean
    ) {
        const fullWeek = 'LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI';
        
        if (!partTime) {
            return {
                pattern: 'STANDARD',
                oddWeek: fullWeek,
                evenWeek: fullWeek
            };
        }

        // Patterns temps partiel selon rôle
        const partTimePatterns = {
            MAR: ['LUNDI;MARDI;MERCREDI;JEUDI', 'MARDI;MERCREDI;JEUDI;VENDREDI'],
            IADE: ['LUNDI;MARDI;MERCREDI', 'MERCREDI;JEUDI;VENDREDI'],
            SECRETAIRE: ['LUNDI;MARDI;MERCREDI', 'LUNDI;MERCREDI;VENDREDI']
        };

        const pattern = faker.helpers.arrayElement(partTimePatterns[role]);
        
        return {
            pattern: 'PART_TIME',
            oddWeek: pattern,
            evenWeek: pattern
        };
    }
}
```

### Factory pour congés réalistes

```typescript
// prisma/seeds/factories/leave.factory.ts
import { faker } from '@faker-js/faker';
import { addDays, format, startOfMonth, endOfMonth } from 'date-fns';
import { LeaveType, LeaveStatus } from '@prisma/client';

interface LeaveFactoryOptions {
    userId?: number;
    type?: LeaveType;
    status?: LeaveStatus;
    period?: { start: Date; end: Date };
    duration?: { min: number; max: number };
    realistic?: boolean;
}

export class LeaveFactory {
    static create(options: LeaveFactoryOptions = {}) {
        const {
            type = faker.helpers.arrayElement(['ANNUAL', 'RECOVERY', 'TRAINING', 'SICK']),
            status = faker.helpers.arrayElement(['APPROVED', 'PENDING']),
            period = {
                start: new Date('2025-01-01'),
                end: new Date('2025-12-31')
            },
            duration = { min: 1, max: 21 },
            realistic = true
        } = options;

        // Durée selon type si realistic
        const leaveDuration = realistic 
            ? this.getRealisticDuration(type)
            : faker.number.int(duration);

        // Date de début aléatoire dans la période
        const periodDays = Math.floor(
            (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)
        );
        const randomDay = faker.number.int({ min: 0, max: periodDays - leaveDuration });
        const startDate = addDays(period.start, randomDay);
        const endDate = addDays(startDate, leaveDuration - 1);

        // Éviter weekends si realistic
        const adjustedDates = realistic 
            ? this.adjustForWeekends(startDate, endDate)
            : { startDate, endDate };

        return {
            startDate: adjustedDates.startDate,
            endDate: adjustedDates.endDate,
            type,
            typeCode: type,
            status,
            reason: this.generateReason(type),
            comment: realistic ? this.generateRealisticComment(type) : faker.lorem.sentence(),
            countedDays: this.calculateWorkingDays(adjustedDates.startDate, adjustedDates.endDate),
            _metadata: {
                originalDuration: leaveDuration,
                generatedAt: new Date().toISOString(),
                realistic
            }
        };
    }

    static createForPeriod(
        period: { start: Date; end: Date },
        config: {
            totalLeaves: number;
            typeDistribution?: Partial<Record<LeaveType, number>>;
            realistic?: boolean;
        }
    ) {
        const {
            totalLeaves,
            typeDistribution = {
                ANNUAL: 0.6,
                RECOVERY: 0.2,
                TRAINING: 0.1,
                SICK: 0.1
            },
            realistic = true
        } = config;

        const leaves = [];
        
        // Générer selon distribution
        for (const [type, percentage] of Object.entries(typeDistribution)) {
            const count = Math.floor(totalLeaves * percentage);
            
            for (let i = 0; i < count; i++) {
                leaves.push(this.create({
                    type: type as LeaveType,
                    period,
                    realistic
                }));
            }
        }

        // Trier par date de début
        return leaves.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    }

    private static getRealisticDuration(type: LeaveType): number {
        const durations = {
            ANNUAL: [14, 21, 7, 10], // Vacances typiques
            RECOVERY: [1, 2, 3],     // RTT courts
            TRAINING: [2, 3, 5],     // Formations
            SICK: [1, 2, 3, 7],      // Arrêts maladie
            MATERNITY: [112],        // Congé maternité standard
            SPECIAL: [1, 3, 5],      // Congés exceptionnels
            UNPAID: [7, 14],         // Sans solde
            OTHER: [1, 2, 3]         // Autres
        };

        return faker.helpers.arrayElement(durations[type] || [1, 2, 3]);
    }

    private static adjustForWeekends(startDate: Date, endDate: Date) {
        // Éviter de commencer un weekend
        let adjustedStart = new Date(startDate);
        while (adjustedStart.getDay() === 0 || adjustedStart.getDay() === 6) {
            adjustedStart = addDays(adjustedStart, 1);
        }

        // Recalculer fin
        const duration = Math.floor(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
        
        const adjustedEnd = addDays(adjustedStart, duration - 1);

        return { startDate: adjustedStart, endDate: adjustedEnd };
    }

    private static generateReason(type: LeaveType): string {
        const reasons = {
            ANNUAL: [
                'Congés d\'été',
                'Vacances familiaux',
                'Repos annuel',
                'Congés de fin d\'année'
            ],
            RECOVERY: [
                'Récupération heures supplémentaires',
                'RTT',
                'Compensation garde',
                'Récupération weekend travaillé'
            ],
            TRAINING: [
                'Formation continue',
                'Congrès médical',
                'Séminaire professionnel',
                'Formation sécurité'
            ],
            SICK: [
                'Arrêt maladie',
                'Indisponibilité médicale',
                'Congé maladie'
            ]
        };

        return faker.helpers.arrayElement(reasons[type] || ['Congé']);
    }

    private static generateRealisticComment(type: LeaveType): string {
        const comments = {
            ANNUAL: [
                'Congés planifiés en famille',
                'Période de repos nécessaire',
                'Vacances réservées depuis janvier'
            ],
            RECOVERY: [
                'Récupération suite à période intensive',
                'RTT accumulées à récupérer',
                'Compensation garde de nuit'
            ],
            TRAINING: [
                'Formation obligatoire réglementaire',
                'Mise à jour compétences',
                'Perfectionnement professionnel'
            ],
            SICK: [
                'Prescription médicale',
                'Repos médical nécessaire'
            ]
        };

        return faker.helpers.arrayElement(comments[type] || ['']);
    }

    private static calculateWorkingDays(start: Date, end: Date): number {
        let count = 0;
        let current = new Date(start);

        while (current <= end) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Pas weekend
                count++;
            }
            current = addDays(current, 1);
        }

        return count;
    }
}
```

## 🎯 Seeds conditionnels et environnements

### Système de configuration par environnement

```typescript
// prisma/seeds/config/environments.ts
interface SeedConfig {
    users: {
        count: number;
        includeTestData: boolean;
        defaultPassword: string;
    };
    leaves: {
        generateTestLeaves: boolean;
        testPeriod: { start: string; end: string };
        leavesPerUser: number;
    };
    performance: {
        enableBulkOperations: boolean;
        batchSize: number;
    };
    cleanup: {
        resetOnStart: boolean;
        preserveUserData: boolean;
    };
}

const environments: Record<string, SeedConfig> = {
    development: {
        users: {
            count: 50,
            includeTestData: true,
            defaultPassword: 'dev123'
        },
        leaves: {
            generateTestLeaves: true,
            testPeriod: { start: '2025-01-01', end: '2025-12-31' },
            leavesPerUser: 5
        },
        performance: {
            enableBulkOperations: true,
            batchSize: 100
        },
        cleanup: {
            resetOnStart: true,
            preserveUserData: false
        }
    },
    
    staging: {
        users: {
            count: 100,
            includeTestData: true,
            defaultPassword: 'staging123'
        },
        leaves: {
            generateTestLeaves: true,
            testPeriod: { start: '2025-06-01', end: '2025-09-30' },
            leavesPerUser: 3
        },
        performance: {
            enableBulkOperations: true,
            batchSize: 200
        },
        cleanup: {
            resetOnStart: false,
            preserveUserData: true
        }
    },
    
    production: {
        users: {
            count: 0, // Pas de génération auto
            includeTestData: false,
            defaultPassword: '' // Obligatoire de spécifier
        },
        leaves: {
            generateTestLeaves: false,
            testPeriod: { start: '', end: '' },
            leavesPerUser: 0
        },
        performance: {
            enableBulkOperations: false,
            batchSize: 50
        },
        cleanup: {
            resetOnStart: false,
            preserveUserData: true
        }
    }
};

export function getSeedConfig(): SeedConfig {
    const env = process.env.NODE_ENV || 'development';
    return environments[env] || environments.development;
}

// Validation de configuration
export function validateSeedConfig(config: SeedConfig) {
    if (process.env.NODE_ENV === 'production') {
        if (config.users.includeTestData) {
            throw new Error('❌ Test data not allowed in production');
        }
        if (config.cleanup.resetOnStart) {
            throw new Error('❌ Database reset not allowed in production');
        }
    }
    
    if (config.users.count > 1000) {
        console.warn('⚠️ Large user count detected, consider performance impact');
    }
}
```

### Seeds avec conditions avancées

```typescript
// prisma/seeds/conditional.seed.ts
import { PrismaClient } from '@prisma/client';
import { getSeedConfig, validateSeedConfig } from './config/environments';
import { UserFactory } from './factories/user.factory';
import { LeaveFactory } from './factories/leave.factory';

const prisma = new PrismaClient();

export async function conditionalSeed() {
    const config = getSeedConfig();
    validateSeedConfig(config);
    
    console.log(`🌱 Seeding pour environnement: ${process.env.NODE_ENV}`);
    
    // Nettoyage conditionnel
    if (config.cleanup.resetOnStart) {
        console.log('🧹 Nettoyage base de données...');
        await cleanupDatabase(config.cleanup.preserveUserData);
    }
    
    // Vérification pré-requis
    const prerequisitesCheck = await checkPrerequisites();
    if (!prerequisitesCheck.passed) {
        console.log('⚠️ Pré-requis non satisfaits:', prerequisitesCheck.missing);
        
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Prerequisites missing in production');
        }
        
        // Auto-correction en dev
        await fixPrerequisites(prerequisitesCheck.missing);
    }
    
    // Génération utilisateurs
    if (config.users.count > 0) {
        await seedUsers(config);
    }
    
    // Génération congés test
    if (config.leaves.generateTestLeaves) {
        await seedTestLeaves(config);
    }
    
    // Post-seeding optimizations
    if (config.performance.enableBulkOperations) {
        await optimizeDatabase();
    }
    
    console.log('✅ Seeding conditionnel terminé');
}

async function checkPrerequisites() {
    const checks = {
        specialties: await prisma.specialty.count() > 0,
        leaveTypes: await prisma.leaveTypeSetting.count() > 0,
        operatingSectors: await prisma.operatingSector.count() > 0
    };
    
    const missing = Object.entries(checks)
        .filter(([_, passed]) => !passed)
        .map(([name]) => name);
    
    return {
        passed: missing.length === 0,
        missing
    };
}

async function fixPrerequisites(missing: string[]) {
    console.log('🔧 Correction automatique des pré-requis...');
    
    if (missing.includes('specialties')) {
        await seedMinimalSpecialties();
    }
    
    if (missing.includes('leaveTypes')) {
        await seedMinimalLeaveTypes();
    }
    
    if (missing.includes('operatingSectors')) {
        await seedMinimalOperatingSectors();
    }
}

async function seedMinimalSpecialties() {
    const minimalSpecialties = [
        { name: 'Anesthésie Générale', isPediatric: false },
        { name: 'Anesthésie Pédiatrique', isPediatric: true },
        { name: 'Réanimation', isPediatric: false }
    ];
    
    for (const specialty of minimalSpecialties) {
        await prisma.specialty.upsert({
            where: { name: specialty.name },
            update: {},
            create: specialty
        });
    }
    
    console.log('   ✅ Spécialités minimales créées');
}

async function seedMinimalLeaveTypes() {
    const minimalTypes = [
        { code: 'ANNUAL', label: 'Congé Annuel', isActive: true, isUserSelectable: true },
        { code: 'SICK', label: 'Congé Maladie', isActive: true, isUserSelectable: false },
        { code: 'RECOVERY', label: 'Récupération', isActive: true, isUserSelectable: true }
    ];
    
    for (const type of minimalTypes) {
        await prisma.leaveTypeSetting.upsert({
            where: { code: type.code },
            update: {},
            create: type
        });
    }
    
    console.log('   ✅ Types de congés minimaux créés');
}

async function cleanupDatabase(preserveUserData: boolean) {
    const tablesToClean = ['Leave'];
    
    if (!preserveUserData) {
        tablesToClean.push('User');
    }
    
    for (const table of tablesToClean) {
        await prisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
        console.log(`   🗑️ Table ${table} nettoyée`);
    }
}

async function optimizeDatabase() {
    console.log('⚡ Optimisation base de données...');
    
    // Analyse des tables
    await prisma.$executeRaw`ANALYZE`;
    
    // Rebuild des index si PostgreSQL
    if (process.env.DATABASE_URL?.includes('postgresql')) {
        await prisma.$executeRaw`REINDEX DATABASE`;
    }
    
    console.log('   ✅ Optimisation terminée');
}
```

## 🚀 Performance et optimisations

### Seeding par batch avec monitoring

```typescript
// prisma/seeds/utils/batch-processor.ts
interface BatchOptions<T> {
    batchSize: number;
    onProgress?: (processed: number, total: number) => void;
    onBatchComplete?: (batchIndex: number, batchSize: number) => void;
    validateItem?: (item: T) => boolean;
    transformItem?: (item: T) => T;
}

export class BatchProcessor<T> {
    static async process<T>(
        items: T[],
        processor: (batch: T[]) => Promise<void>,
        options: BatchOptions<T> = {}
    ) {
        const {
            batchSize = 100,
            onProgress,
            onBatchComplete,
            validateItem,
            transformItem
        } = options;

        // Filtrage et transformation
        let processedItems = items;
        
        if (validateItem) {
            processedItems = processedItems.filter(validateItem);
        }
        
        if (transformItem) {
            processedItems = processedItems.map(transformItem);
        }

        const totalItems = processedItems.length;
        const totalBatches = Math.ceil(totalItems / batchSize);
        
        console.log(`📦 Traitement ${totalItems} éléments en ${totalBatches} batches`);

        let processed = 0;

        for (let i = 0; i < totalBatches; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, totalItems);
            const batch = processedItems.slice(start, end);

            const startTime = Date.now();
            
            try {
                await processor(batch);
                processed += batch.length;
                
                const duration = Date.now() - startTime;
                
                if (onBatchComplete) {
                    onBatchComplete(i + 1, totalBatches);
                }
                
                if (onProgress) {
                    onProgress(processed, totalItems);
                }
                
                console.log(
                    `   Batch ${i + 1}/${totalBatches}: ${batch.length} éléments (${duration}ms)`
                );
                
            } catch (error) {
                console.error(`❌ Erreur batch ${i + 1}:`, error);
                throw error;
            }
        }

        console.log(`✅ Traitement terminé: ${processed}/${totalItems} éléments`);
    }
}

// Usage pour seeding masse
export async function seedMassiveUsers(count: number) {
    console.log(`👥 Génération ${count} utilisateurs...`);
    
    const users = UserFactory.createBatch(count);
    
    await BatchProcessor.process(
        users,
        async (batch) => {
            await prisma.user.createMany({
                data: batch,
                skipDuplicates: true
            });
        },
        {
            batchSize: 50,
            onProgress: (processed, total) => {
                const percentage = Math.round((processed / total) * 100);
                console.log(`   Progress: ${percentage}% (${processed}/${total})`);
            },
            validateItem: (user) => {
                return user.email && user.login && user.nom;
            }
        }
    );
}
```

### Cache et mémoire pour seeds volumineux

```typescript
// prisma/seeds/utils/cache-manager.ts
export class SeedCache {
    private cache = new Map<string, any>();
    private readonly maxSize = 1000;

    set(key: string, value: any, ttl?: number) {
        if (this.cache.size >= this.maxSize) {
            // Supprimer le plus ancien
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        const item = {
            value,
            timestamp: Date.now(),
            ttl: ttl ? Date.now() + ttl : null
        };

        this.cache.set(key, item);
    }

    get(key: string) {
        const item = this.cache.get(key);
        
        if (!item) return null;
        
        if (item.ttl && Date.now() > item.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    clear() {
        this.cache.clear();
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            usage: Math.round((this.cache.size / this.maxSize) * 100)
        };
    }
}

// Cache global pour sessions de seeding
export const seedCache = new SeedCache();

// Utilitaire pour cache des requêtes
export async function cachedQuery<T>(
    key: string,
    query: () => Promise<T>,
    ttl?: number
): Promise<T> {
    const cached = seedCache.get(key);
    if (cached) return cached;

    const result = await query();
    seedCache.set(key, result, ttl);
    return result;
}

// Usage dans seeds
async function getCachedSpecialties() {
    return cachedQuery(
        'specialties:all',
        () => prisma.specialty.findMany(),
        60000 // 1 minute
    );
}
```

Cette documentation avancée couvre les patterns les plus sophistiqués pour gérer des seeds complexes, performants et maintenables. 