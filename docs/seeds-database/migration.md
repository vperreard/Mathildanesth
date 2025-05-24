# Migration données existantes - Seeds & Export/Import

## 🔄 Stratégies de migration

### Vue d'ensemble des approches

```
Ancien système → Mathilda
    ↓
1. Export données sources
2. Transformation format
3. Validation données
4. Import progressif
5. Vérification intégrité
```

## 📊 Migration depuis systèmes existants

### 1. Migration depuis Excel/CSV

**Contexte typique** : Planning RH dans Excel

```typescript
// scripts/migrate-from-excel.ts
import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { parse, isValid } from 'date-fns';

const prisma = new PrismaClient();

interface ExcelUser {
    'Nom': string;
    'Prénom': string;
    'Email': string;
    'Service': string;
    'Statut': string;
    'Date entrée': string;
    'Temps partiel': string;
    'Pourcentage': string;
}

interface ExcelLeave {
    'Nom': string;
    'Prénom': string;
    'Date début': string;
    'Date fin': string;
    'Type': string;
    'Statut': string;
    'Commentaire': string;
}

export class ExcelMigrator {
    async migrateUsers(filePath: string) {
        console.log('👥 Migration utilisateurs depuis Excel...');
        
        const workbook = XLSX.readFile(filePath);
        const usersSheet = workbook.Sheets['Utilisateurs'] || workbook.Sheets[workbook.SheetNames[0]];
        const users: ExcelUser[] = XLSX.utils.sheet_to_json(usersSheet);
        
        const results = {
            processed: 0,
            created: 0,
            updated: 0,
            errors: []
        };
        
        for (const excelUser of users) {
            try {
                results.processed++;
                
                // Validation données
                const validationResult = this.validateUserData(excelUser);
                if (!validationResult.valid) {
                    results.errors.push({
                        user: `${excelUser.Nom} ${excelUser.Prénom}`,
                        errors: validationResult.errors
                    });
                    continue;
                }
                
                // Transformation données
                const userData = this.transformUserData(excelUser);
                
                // Upsert utilisateur
                const user = await prisma.user.upsert({
                    where: { 
                        login: userData.login
                    },
                    update: {
                        nom: userData.nom,
                        prenom: userData.prenom,
                        email: userData.email,
                        professionalRole: userData.professionalRole,
                        tempsPartiel: userData.tempsPartiel,
                        pourcentageTempsPartiel: userData.pourcentageTempsPartiel
                    },
                    create: userData
                });
                
                if (user) {
                    results.created++;
                } else {
                    results.updated++;
                }
                
            } catch (error) {
                results.errors.push({
                    user: `${excelUser.Nom} ${excelUser.Prénom}`,
                    errors: [error.message]
                });
            }
        }
        
        console.log(`✅ Migration utilisateurs terminée:`);
        console.log(`   - Traités: ${results.processed}`);
        console.log(`   - Créés: ${results.created}`);
        console.log(`   - Mis à jour: ${results.updated}`);
        console.log(`   - Erreurs: ${results.errors.length}`);
        
        if (results.errors.length > 0) {
            console.log('\n❌ Erreurs détaillées:');
            results.errors.forEach(error => {
                console.log(`   ${error.user}: ${error.errors.join(', ')}`);
            });
        }
        
        return results;
    }
    
    async migrateLeaves(filePath: string) {
        console.log('🏖️ Migration congés depuis Excel...');
        
        const workbook = XLSX.readFile(filePath);
        const leavesSheet = workbook.Sheets['Congés'] || workbook.Sheets['Planning'];
        const leaves: ExcelLeave[] = XLSX.utils.sheet_to_json(leavesSheet);
        
        const results = {
            processed: 0,
            created: 0,
            skipped: 0,
            errors: []
        };
        
        // Cache des utilisateurs pour performance
        const usersCache = new Map();
        
        for (const excelLeave of leaves) {
            try {
                results.processed++;
                
                // Trouver utilisateur (avec cache)
                const userKey = `${excelLeave.Nom}_${excelLeave.Prénom}`;
                let user = usersCache.get(userKey);
                
                if (!user) {
                    user = await prisma.user.findFirst({
                        where: {
                            nom: excelLeave.Nom?.toUpperCase(),
                            prenom: excelLeave.Prénom
                        }
                    });
                    
                    if (user) {
                        usersCache.set(userKey, user);
                    }
                }
                
                if (!user) {
                    results.errors.push({
                        leave: `${excelLeave.Nom} ${excelLeave.Prénom} - ${excelLeave['Date début']}`,
                        errors: ['Utilisateur non trouvé']
                    });
                    continue;
                }
                
                // Transformation dates
                const startDate = this.parseDate(excelLeave['Date début']);
                const endDate = this.parseDate(excelLeave['Date fin']);
                
                if (!startDate || !endDate) {
                    results.errors.push({
                        leave: `${excelLeave.Nom} ${excelLeave.Prénom} - ${excelLeave['Date début']}`,
                        errors: ['Dates invalides']
                    });
                    continue;
                }
                
                // Vérifier doublons
                const existingLeave = await prisma.leave.findFirst({
                    where: {
                        userId: user.id,
                        startDate: startDate,
                        endDate: endDate
                    }
                });
                
                if (existingLeave) {
                    results.skipped++;
                    continue;
                }
                
                // Créer congé
                const leaveData = {
                    userId: user.id,
                    startDate,
                    endDate,
                    type: this.mapLeaveType(excelLeave.Type),
                    typeCode: this.mapLeaveType(excelLeave.Type),
                    status: this.mapLeaveStatus(excelLeave.Statut),
                    reason: `Migration depuis Excel - ${excelLeave.Type}`,
                    comment: excelLeave.Commentaire || '',
                    countedDays: this.calculateWorkingDays(startDate, endDate)
                };
                
                await prisma.leave.create({ data: leaveData });
                results.created++;
                
            } catch (error) {
                results.errors.push({
                    leave: `${excelLeave.Nom} ${excelLeave.Prénom} - ${excelLeave['Date début']}`,
                    errors: [error.message]
                });
            }
        }
        
        console.log(`✅ Migration congés terminée:`);
        console.log(`   - Traités: ${results.processed}`);
        console.log(`   - Créés: ${results.created}`);
        console.log(`   - Ignorés (doublons): ${results.skipped}`);
        console.log(`   - Erreurs: ${results.errors.length}`);
        
        return results;
    }
    
    private validateUserData(user: ExcelUser) {
        const errors = [];
        
        if (!user.Nom || user.Nom.trim() === '') {
            errors.push('Nom manquant');
        }
        
        if (!user.Prénom || user.Prénom.trim() === '') {
            errors.push('Prénom manquant');
        }
        
        if (!user.Email || !user.Email.includes('@')) {
            errors.push('Email invalide');
        }
        
        if (!['MAR', 'IADE', 'SECRETAIRE'].includes(this.mapRole(user.Service))) {
            errors.push('Service/Rôle non reconnu');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
    
    private transformUserData(excelUser: ExcelUser) {
        const nom = excelUser.Nom.toUpperCase().trim();
        const prenom = excelUser.Prénom.trim();
        const login = `${prenom.toLowerCase()}.${nom.toLowerCase()}`;
        
        return {
            nom,
            prenom,
            login,
            email: excelUser.Email.toLowerCase().trim(),
            role: 'UTILISATEUR',
            professionalRole: this.mapRole(excelUser.Service),
            tempsPartiel: excelUser['Temps partiel']?.toLowerCase() === 'oui',
            pourcentageTempsPartiel: excelUser.Pourcentage ? parseInt(excelUser.Pourcentage) : null,
            dateEntree: this.parseDate(excelUser['Date entrée']) || new Date(),
            dateSortie: null,
            actif: excelUser.Statut?.toLowerCase() !== 'inactif',
            phoneNumber: '',
            alias: `${prenom.charAt(0)}.${nom}`,
            workPattern: '',
            joursTravaillesSemaineImpaire: 'LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI',
            joursTravaillesSemainePaire: 'LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI',
            password: '$2b$10$defaulthashforexcelimport' // Hash par défaut, à changer
        };
    }
    
    private mapRole(service: string): 'MAR' | 'IADE' | 'SECRETAIRE' {
        const serviceMap = {
            'anesthésie': 'MAR',
            'anesthesia': 'MAR',
            'médecin': 'MAR',
            'docteur': 'MAR',
            'iade': 'IADE',
            'infirmier': 'IADE',
            'secrétaire': 'SECRETAIRE',
            'administratif': 'SECRETAIRE'
        };
        
        const key = service.toLowerCase();
        return serviceMap[key] || 'IADE';
    }
    
    private mapLeaveType(type: string): string {
        const typeMap = {
            'cp': 'ANNUAL',
            'congés payés': 'ANNUAL',
            'vacances': 'ANNUAL',
            'rtt': 'RECOVERY',
            'récupération': 'RECOVERY',
            'formation': 'TRAINING',
            'stage': 'TRAINING',
            'maladie': 'SICK',
            'arrêt maladie': 'SICK',
            'maternité': 'MATERNITY',
            'congé maternité': 'MATERNITY'
        };
        
        return typeMap[type.toLowerCase()] || 'OTHER';
    }
    
    private mapLeaveStatus(status: string): string {
        const statusMap = {
            'validé': 'APPROVED',
            'approuvé': 'APPROVED',
            'accepté': 'APPROVED',
            'en attente': 'PENDING',
            'refusé': 'REJECTED',
            'annulé': 'CANCELLED'
        };
        
        return statusMap[status.toLowerCase()] || 'PENDING';
    }
    
    private parseDate(dateStr: string): Date | null {
        if (!dateStr) return null;
        
        // Formats français courants
        const formats = [
            'dd/MM/yyyy',
            'dd-MM-yyyy',
            'dd.MM.yyyy',
            'yyyy-MM-dd',
            'MM/dd/yyyy'
        ];
        
        for (const format of formats) {
            try {
                const date = parse(dateStr, format, new Date());
                if (isValid(date)) {
                    return date;
                }
            } catch {
                continue;
            }
        }
        
        return null;
    }
    
    private calculateWorkingDays(start: Date, end: Date): number {
        let count = 0;
        let current = new Date(start);
        
        while (current <= end) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Pas weekend
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        
        return count;
    }
}

// Script d'exécution
async function main() {
    const migrator = new ExcelMigrator();
    
    try {
        // Migration utilisateurs
        console.log('🔄 Début migration...');
        const userResults = await migrator.migrateUsers('data/utilisateurs.xlsx');
        
        // Migration congés
        const leaveResults = await migrator.migrateLeaves('data/conges.xlsx');
        
        console.log('\n📊 Résumé migration:');
        console.log(`Users: ${userResults.created} créés, ${userResults.errors.length} erreurs`);
        console.log(`Leaves: ${leaveResults.created} créés, ${leaveResults.errors.length} erreurs`);
        
    } catch (error) {
        console.error('❌ Erreur migration:', error);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    main();
}
```

### 2. Migration depuis base de données externe

```typescript
// scripts/migrate-from-database.ts
import { PrismaClient } from '@prisma/client';
import mysql from 'mysql2/promise';

const prisma = new PrismaClient();

interface LegacyUser {
    id: number;
    lastname: string;
    firstname: string;
    email: string;
    role_id: number;
    is_part_time: boolean;
    start_date: Date;
    is_active: boolean;
}

interface LegacyLeave {
    id: number;
    user_id: number;
    start_date: Date;
    end_date: Date;
    leave_type_id: number;
    status: number;
    description: string;
}

export class DatabaseMigrator {
    private legacyConnection: mysql.Connection;
    
    async connect(legacyDbConfig: mysql.ConnectionOptions) {
        this.legacyConnection = await mysql.createConnection(legacyDbConfig);
        console.log('🔗 Connexion base legacy établie');
    }
    
    async migrateUsers() {
        console.log('👥 Migration utilisateurs depuis base legacy...');
        
        // Récupérer utilisateurs legacy
        const [legacyUsers] = await this.legacyConnection.execute<LegacyUser[]>(`
            SELECT 
                u.id, 
                u.lastname, 
                u.firstname, 
                u.email,
                u.role_id,
                u.is_part_time,
                u.start_date,
                u.is_active
            FROM users u
            WHERE u.deleted_at IS NULL
        `);
        
        // Récupérer mapping des rôles
        const [legacyRoles] = await this.legacyConnection.execute(`
            SELECT id, name FROM roles
        `);
        
        const roleMapping = new Map();
        (legacyRoles as any[]).forEach(role => {
            roleMapping.set(role.id, this.mapLegacyRole(role.name));
        });
        
        const results = { processed: 0, created: 0, errors: [] };
        
        for (const legacyUser of legacyUsers) {
            try {
                results.processed++;
                
                const userData = {
                    nom: legacyUser.lastname.toUpperCase(),
                    prenom: legacyUser.firstname,
                    login: `${legacyUser.firstname.toLowerCase()}.${legacyUser.lastname.toLowerCase()}`,
                    email: legacyUser.email,
                    role: 'UTILISATEUR',
                    professionalRole: roleMapping.get(legacyUser.role_id) || 'IADE',
                    tempsPartiel: legacyUser.is_part_time,
                    pourcentageTempsPartiel: legacyUser.is_part_time ? 80 : null,
                    dateEntree: legacyUser.start_date,
                    dateSortie: null,
                    actif: legacyUser.is_active,
                    phoneNumber: '',
                    alias: `${legacyUser.firstname.charAt(0)}.${legacyUser.lastname}`,
                    workPattern: '',
                    joursTravaillesSemaineImpaire: 'LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI',
                    joursTravaillesSemainePaire: 'LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI',
                    password: '$2b$10$defaultlegacyhash',
                    // Métadonnée pour traçabilité
                    metadata: {
                        legacyId: legacyUser.id,
                        migratedAt: new Date().toISOString()
                    }
                };
                
                await prisma.user.create({ data: userData });
                results.created++;
                
            } catch (error) {
                results.errors.push({
                    user: `${legacyUser.firstname} ${legacyUser.lastname}`,
                    error: error.message
                });
            }
        }
        
        console.log(`✅ Migration users: ${results.created}/${results.processed}`);
        return results;
    }
    
    async migrateLeaves() {
        console.log('🏖️ Migration congés depuis base legacy...');
        
        // Mapping des utilisateurs legacy → Mathilda
        const userMapping = await this.buildUserMapping();
        
        // Récupérer congés legacy
        const [legacyLeaves] = await this.legacyConnection.execute<LegacyLeave[]>(`
            SELECT 
                l.id,
                l.user_id,
                l.start_date,
                l.end_date,
                l.leave_type_id,
                l.status,
                l.description
            FROM leaves l
            WHERE l.deleted_at IS NULL
            AND l.start_date >= '2024-01-01'
        `);
        
        // Mapping types de congés
        const [legacyLeaveTypes] = await this.legacyConnection.execute(`
            SELECT id, name FROM leave_types
        `);
        
        const leaveTypeMapping = new Map();
        (legacyLeaveTypes as any[]).forEach(type => {
            leaveTypeMapping.set(type.id, this.mapLegacyLeaveType(type.name));
        });
        
        const results = { processed: 0, created: 0, skipped: 0, errors: [] };
        
        for (const legacyLeave of legacyLeaves) {
            try {
                results.processed++;
                
                // Trouver utilisateur Mathilda
                const mathildaUserId = userMapping.get(legacyLeave.user_id);
                if (!mathildaUserId) {
                    results.skipped++;
                    continue;
                }
                
                // Vérifier doublons
                const existingLeave = await prisma.leave.findFirst({
                    where: {
                        userId: mathildaUserId,
                        startDate: legacyLeave.start_date,
                        endDate: legacyLeave.end_date
                    }
                });
                
                if (existingLeave) {
                    results.skipped++;
                    continue;
                }
                
                const leaveData = {
                    userId: mathildaUserId,
                    startDate: legacyLeave.start_date,
                    endDate: legacyLeave.end_date,
                    type: leaveTypeMapping.get(legacyLeave.leave_type_id) || 'OTHER',
                    typeCode: leaveTypeMapping.get(legacyLeave.leave_type_id) || 'OTHER',
                    status: this.mapLegacyStatus(legacyLeave.status),
                    reason: 'Migration depuis système legacy',
                    comment: legacyLeave.description || '',
                    countedDays: this.calculateWorkingDays(legacyLeave.start_date, legacyLeave.end_date),
                    metadata: {
                        legacyId: legacyLeave.id,
                        migratedAt: new Date().toISOString()
                    }
                };
                
                await prisma.leave.create({ data: leaveData });
                results.created++;
                
            } catch (error) {
                results.errors.push({
                    leave: `Legacy ID ${legacyLeave.id}`,
                    error: error.message
                });
            }
        }
        
        console.log(`✅ Migration leaves: ${results.created}/${results.processed}`);
        return results;
    }
    
    private async buildUserMapping(): Promise<Map<number, number>> {
        // Utilisateurs avec métadonnées de migration
        const mathildaUsers = await prisma.user.findMany({
            where: {
                metadata: {
                    path: ['legacyId'],
                    not: null
                }
            }
        });
        
        const mapping = new Map();
        mathildaUsers.forEach(user => {
            const legacyId = (user.metadata as any)?.legacyId;
            if (legacyId) {
                mapping.set(parseInt(legacyId), user.id);
            }
        });
        
        return mapping;
    }
    
    private mapLegacyRole(roleName: string): 'MAR' | 'IADE' | 'SECRETAIRE' {
        const roleMap = {
            'anesthesiologist': 'MAR',
            'doctor': 'MAR',
            'nurse_anesthetist': 'IADE',
            'nurse': 'IADE',
            'secretary': 'SECRETAIRE',
            'admin': 'SECRETAIRE'
        };
        
        return roleMap[roleName.toLowerCase()] || 'IADE';
    }
    
    private mapLegacyLeaveType(typeName: string): string {
        const typeMap = {
            'annual_leave': 'ANNUAL',
            'sick_leave': 'SICK',
            'recovery_time': 'RECOVERY',
            'training': 'TRAINING',
            'maternity': 'MATERNITY'
        };
        
        return typeMap[typeName.toLowerCase()] || 'OTHER';
    }
    
    private mapLegacyStatus(status: number): string {
        const statusMap = {
            0: 'PENDING',
            1: 'APPROVED',
            2: 'REJECTED',
            3: 'CANCELLED'
        };
        
        return statusMap[status] || 'PENDING';
    }
    
    private calculateWorkingDays(start: Date, end: Date): number {
        let count = 0;
        let current = new Date(start);
        
        while (current <= end) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        
        return count;
    }
    
    async disconnect() {
        await this.legacyConnection.end();
        console.log('🔗 Connexion legacy fermée');
    }
}

// Script d'exécution
async function main() {
    const migrator = new DatabaseMigrator();
    
    try {
        await migrator.connect({
            host: process.env.LEGACY_DB_HOST,
            user: process.env.LEGACY_DB_USER,
            password: process.env.LEGACY_DB_PASSWORD,
            database: process.env.LEGACY_DB_NAME
        });
        
        const userResults = await migrator.migrateUsers();
        const leaveResults = await migrator.migrateLeaves();
        
        console.log('\n📊 Migration terminée:');
        console.log(`Users: ${userResults.created} migrés`);
        console.log(`Leaves: ${leaveResults.created} migrés`);
        
    } catch (error) {
        console.error('❌ Erreur migration:', error);
    } finally {
        await migrator.disconnect();
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    main();
}
```

## 🔍 Validation et rollback

### Système de validation post-migration

```typescript
// scripts/validate-migration.ts
export class MigrationValidator {
    async validateMigration() {
        console.log('🔍 Validation post-migration...');
        
        const results = {
            users: await this.validateUsers(),
            leaves: await this.validateLeaves(),
            integrity: await this.validateIntegrity(),
            performance: await this.validatePerformance()
        };
        
        const allValid = Object.values(results).every(r => r.valid);
        
        if (allValid) {
            console.log('✅ Migration validée avec succès');
        } else {
            console.log('❌ Problèmes détectés dans la migration');
            this.generateReport(results);
        }
        
        return results;
    }
    
    private async validateUsers() {
        const checks = {
            count: await this.checkUserCount(),
            emails: await this.checkEmailUniqueness(),
            roles: await this.checkRoleDistribution(),
            mandatory: await this.checkMandatoryFields()
        };
        
        return {
            valid: Object.values(checks).every(c => c.valid),
            checks
        };
    }
    
    private async validateLeaves() {
        const checks = {
            count: await this.checkLeaveCount(),
            dates: await this.checkDateConsistency(),
            users: await this.checkLeaveUserReferences(),
            duplicates: await this.checkDuplicateLeaves()
        };
        
        return {
            valid: Object.values(checks).every(c => c.valid),
            checks
        };
    }
    
    private async validateIntegrity() {
        const checks = {
            foreignKeys: await this.checkForeignKeys(),
            constraints: await this.checkConstraints(),
            orphans: await this.checkOrphanRecords()
        };
        
        return {
            valid: Object.values(checks).every(c => c.valid),
            checks
        };
    }
    
    private async checkUserCount() {
        const count = await prisma.user.count();
        const expected = parseInt(process.env.EXPECTED_USER_COUNT || '0');
        
        return {
            valid: expected === 0 || Math.abs(count - expected) <= 5,
            count,
            expected,
            message: `${count} utilisateurs (attendu: ~${expected})`
        };
    }
    
    private async checkEmailUniqueness() {
        const duplicates = await prisma.$queryRaw`
            SELECT email, COUNT(*) as count
            FROM "User"
            GROUP BY email
            HAVING COUNT(*) > 1
        `;
        
        return {
            valid: (duplicates as any[]).length === 0,
            duplicates: duplicates as any[],
            message: `${(duplicates as any[]).length} emails dupliqués`
        };
    }
    
    private async checkLeaveUserReferences() {
        const orphanLeaves = await prisma.leave.count({
            where: {
                user: null
            }
        });
        
        return {
            valid: orphanLeaves === 0,
            count: orphanLeaves,
            message: `${orphanLeaves} congés sans utilisateur`
        };
    }
}

// Système de rollback
export class MigrationRollback {
    async createBackup() {
        console.log('💾 Création backup pré-migration...');
        
        // Export complet avant migration
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = `backup-pre-migration-${timestamp}.json`;
        
        // Utiliser le système d'export existant
        execSync(`npm run export:all`);
        
        // Renommer pour identification
        const latestExport = execSync('ls -t exports/db-export-*.json | head -1').toString().trim();
        execSync(`cp ${latestExport} exports/${backupFile}`);
        
        console.log(`✅ Backup créé: ${backupFile}`);
        return backupFile;
    }
    
    async rollback(backupFile: string) {
        console.log(`⏪ Rollback depuis ${backupFile}...`);
        
        // Confirmation obligatoire
        const confirm = await this.confirmRollback();
        if (!confirm) {
            console.log('Rollback annulé');
            return;
        }
        
        try {
            // Reset base
            await prisma.$executeRaw`TRUNCATE TABLE "Leave" CASCADE`;
            await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
            
            // Restaurer depuis backup
            execSync(`node scripts/import-db-state.js ${backupFile}`);
            
            console.log('✅ Rollback terminé');
            
        } catch (error) {
            console.error('❌ Erreur rollback:', error);
            throw error;
        }
    }
    
    private async confirmRollback(): Promise<boolean> {
        // En production, nécessite confirmation explicite
        if (process.env.NODE_ENV === 'production') {
            const confirm = process.env.CONFIRM_ROLLBACK === 'yes';
            if (!confirm) {
                console.log('❌ Rollback production nécessite CONFIRM_ROLLBACK=yes');
                return false;
            }
        }
        
        return true;
    }
}
```

## 📋 Checklist migration complète

### Phase 1 : Préparation
- [ ] Analyse données sources (formats, volumes, qualité)
- [ ] Identification mapping champs/valeurs
- [ ] Tests migration sur échantillon
- [ ] Scripts validation développés
- [ ] Backup système existant

### Phase 2 : Migration
- [ ] Backup pré-migration créé
- [ ] Environnement test préparé
- [ ] Migration test réussie
- [ ] Validation données test
- [ ] Migration production planifiée

### Phase 3 : Validation
- [ ] Scripts validation exécutés
- [ ] Tests fonctionnels passés
- [ ] Performance vérifiée
- [ ] Intégrité référentielle OK
- [ ] Formation utilisateurs

### Phase 4 : Finalisation
- [ ] Documentation migration
- [ ] Scripts rollback testés
- [ ] Monitoring post-migration
- [ ] Nettoyage données temporaires
- [ ] Archivage ancien système

Cette approche garantit une migration sûre et tracée des données existantes vers Mathilda. 