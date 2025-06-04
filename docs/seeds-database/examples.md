# Exemples pratiques - Seeds & Export/Import

## 🎯 Cas concrets avec solutions complètes

### Exemple 1 : Ajouter une nouvelle équipe de 10 IADE

**Contexte** : L'hôpital recrute 10 nouveaux IADE pour renforcer l'équipe

**Données** :
```csv
nom,prenom,login,email,role,professionalRole,tempsPartiel,pourcentageTempsPartiel,dateEntree,dateSortie,actif,phoneNumber,alias,workPattern,joursTravaillesSemaineImpaire,joursTravaillesSemainePaire
MARTIN,Julie,julie.martin,julie.martin@hopital.fr,UTILISATEUR,IADE,false,,2025-06-01,,true,0123456789,J.MARTIN,,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI
BERNARD,Pierre,pierre.bernard,pierre.bernard@hopital.fr,UTILISATEUR,IADE,false,,2025-06-01,,true,0123456790,P.BERNARD,,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI
ROUSSEAU,Marie,marie.rousseau,marie.rousseau@hopital.fr,UTILISATEUR,IADE,true,80,2025-06-01,,true,0123456791,M.ROUSSEAU,,LUNDI;MARDI;MERCREDI;JEUDI,LUNDI;MARDI;MERCREDI;JEUDI
LEFEVRE,Antoine,antoine.lefevre,antoine.lefevre@hopital.fr,UTILISATEUR,IADE,false,,2025-06-01,,true,0123456792,A.LEFEVRE,,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI
MOREAU,Camille,camille.moreau,camille.moreau@hopital.fr,UTILISATEUR,IADE,false,,2025-06-01,,true,0123456793,C.MOREAU,,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI
SIMON,Lucas,lucas.simon,lucas.simon@hopital.fr,UTILISATEUR,IADE,false,,2025-06-01,,true,0123456794,L.SIMON,,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI
MICHEL,Sophie,sophie.michel,sophie.michel@hopital.fr,UTILISATEUR,IADE,true,90,2025-06-01,,true,0123456795,S.MICHEL,,LUNDI;MARDI;MERCREDI;JEUDI,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI
GARCIA,Thomas,thomas.garcia,thomas.garcia@hopital.fr,UTILISATEUR,IADE,false,,2025-06-01,,true,0123456796,T.GARCIA,,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI
MARTINEZ,Emma,emma.martinez,emma.martinez@hopital.fr,UTILISATEUR,IADE,false,,2025-06-01,,true,0123456797,E.MARTINEZ,,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI
LOPEZ,Hugo,hugo.lopez,hugo.lopez@hopital.fr,UTILISATEUR,IADE,false,,2025-06-01,,true,0123456798,H.LOPEZ,,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI
```

**Solution complète** :

```bash
# 1. Backup préventif
npm run export:all

# 2. Exporter utilisateurs actuels
npm run export:csv users

# 3. Créer le fichier avec nouveaux IADE
cat > nouveaux-iade.csv << 'EOF'
nom,prenom,login,email,role,professionalRole,tempsPartiel,pourcentageTempsPartiel,dateEntree,dateSortie,actif,phoneNumber,alias,workPattern,joursTravaillesSemaineImpaire,joursTravaillesSemainePaire
MARTIN,Julie,julie.martin,julie.martin@hopital.fr,UTILISATEUR,IADE,false,,2025-06-01,,true,0123456789,J.MARTIN,,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI
BERNARD,Pierre,pierre.bernard,pierre.bernard@hopital.fr,UTILISATEUR,IADE,false,,2025-06-01,,true,0123456790,P.BERNARD,,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI,LUNDI;MARDI;MERCREDI;JEUDI;VENDREDI
# ... autres lignes
EOF

# 4. Fusionner avec utilisateurs existants
tail -n +2 nouveaux-iade.csv >> exports/csv/utilisateurs-$(date +%Y-%m-%d).csv

# 5. Remplacer le fichier source
cp exports/csv/utilisateurs-$(date +%Y-%m-%d).csv prisma/seed_data/utilisateurs.csv

# 6. Appliquer
npm run db:seed

# 7. Vérifier
curl "http://localhost:3000/api/utilisateurs?role=IADE" | jq 'length'
```

### Exemple 2 : Planifier les congés d'été 2026

**Contexte** : Préparer les congés d'été pour l'année suivante

**Script personnalisé** :

```typescript
// prisma/seed-leaves-summer-2026.ts
import { PrismaClient, LeaveType, LeaveStatus, ProfessionalRole } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration 2026
const SUMMER_2026_START = new Date('2026-07-01');
const SUMMER_2026_END = new Date('2026-08-31');

const leaveTemplates2026 = [
    // Équipe senior (MAR expérimentés)
    { 
        roles: ['MAR'], 
        seniority: 'senior',
        patterns: [
            { duration: 21, type: 'ANNUAL', label: 'Grandes vacances' },
            { duration: 5, type: 'RECOVERY', label: 'Récupération post-garde' }
        ]
    },
    // Nouveaux IADE (planification prioritaire)
    { 
        roles: ['IADE'], 
        seniority: 'junior',
        patterns: [
            { duration: 14, type: 'ANNUAL', label: 'Vacances été' },
            { duration: 3, type: 'TRAINING', label: 'Formation continue' }
        ]
    }
];

async function generateSummer2026Leaves() {
    console.log('🏖️ Génération congés été 2026...');

    // Récupérer utilisateurs par catégorie
    const seniorMAR = await prisma.user.findMany({
        where: { 
            professionalRole: 'MAR',
            dateEntree: { lte: new Date('2023-01-01') } // Ancienneté > 2 ans
        }
    });

    const juniorIADE = await prisma.user.findMany({
        where: { 
            professionalRole: 'IADE',
            dateEntree: { gte: new Date('2025-01-01') } // Nouveaux recrutés
        }
    });

    let totalLeaves = 0;

    // Planification MAR seniors
    for (const user of seniorMAR) {
        const leaves = generateUserLeaves2026(user, leaveTemplates2026[0].patterns);
        await createLeavesForUser(user.id, leaves);
        totalLeaves += leaves.length;
    }

    // Planification IADE juniors  
    for (const user of juniorIADE) {
        const leaves = generateUserLeaves2026(user, leaveTemplates2026[1].patterns);
        await createLeavesForUser(user.id, leaves);
        totalLeaves += leaves.length;
    }

    console.log(`✅ ${totalLeaves} congés créés pour été 2026`);
}

function generateUserLeaves2026(user: any, patterns: any[]) {
    const leaves = [];
    let currentDate = new Date(SUMMER_2026_START);

    for (const pattern of patterns) {
        // Répartition aléatoire dans la période
        const randomOffset = Math.floor(Math.random() * 40); // 40 jours d'été
        const startDate = addDays(currentDate, randomOffset);
        const endDate = addDays(startDate, pattern.duration - 1);

        if (endDate <= SUMMER_2026_END) {
            leaves.push({
                startDate,
                endDate,
                type: pattern.type,
                typeCode: pattern.type,
                status: 'PENDING', // À valider par chef de service
                reason: pattern.label,
                comment: `Planification automatique été 2026 - ${user.prenom} ${user.nom}`,
                countedDays: calculateWorkingDays(startDate, endDate)
            });
        }

        currentDate = addDays(endDate, 1);
    }

    return leaves;
}

async function createLeavesForUser(userId: number, leaves: any[]) {
    for (const leave of leaves) {
        await prisma.leave.create({
            data: {
                userId,
                ...leave
            }
        });
    }
}

// Utilitaires
function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function calculateWorkingDays(start: Date, end: Date): number {
    // Simplification : 5 jours / 7
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor(totalDays * 5 / 7);
}

generateSummer2026Leaves()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
```

**Exécution** :
```bash
# Ajouter script à package.json
npm pkg set scripts.seed:summer-2026="tsx prisma/seed-leaves-summer-2026.ts"

# Exécuter
npm run seed:summer-2026
```

### Exemple 3 : Migration depuis Excel existant

**Contexte** : Importer planning existant depuis fichier Excel RH

**Fichier Excel** : `planning-rh-2025.xlsx`
| Nom | Prénom | Email | Service | Début Congé | Fin Congé | Type |
|-----|--------|-------|---------|-------------|-----------|------|
| Dupont | Jean | jean.dupont@hp.fr | Anesthésie | 01/07/2025 | 15/07/2025 | CP |
| Martin | Sophie | sophie.martin@hp.fr | Anesthésie | 08/07/2025 | 22/07/2025 | CP |

**Script de conversion** :

```javascript
// scripts/import-from-excel.js
import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { parse, format } from 'date-fns';

const prisma = new PrismaClient();

async function importFromExcel(filePath) {
    console.log('📊 Import depuis Excel...');
    
    // 1. Lire le fichier Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`${data.length} lignes trouvées`);
    
    // 2. Mapper les types de congés
    const typeMapping = {
        'CP': 'ANNUAL',
        'RTT': 'RECOVERY', 
        'Formation': 'TRAINING',
        'Maladie': 'SICK'
    };
    
    let imported = 0;
    let errors = 0;
    
    for (const row of data) {
        try {
            // 3. Trouver l'utilisateur
            const user = await prisma.user.findFirst({
                where: {
                    nom: row.Nom?.toUpperCase(),
                    prenom: row.Prénom
                }
            });
            
            if (!user) {
                console.warn(`⚠️  Utilisateur non trouvé: ${row.Nom} ${row.Prénom}`);
                errors++;
                continue;
            }
            
            // 4. Parser les dates (format français)
            const startDate = parse(row['Début Congé'], 'dd/MM/yyyy', new Date());
            const endDate = parse(row['Fin Congé'], 'dd/MM/yyyy', new Date());
            
            // 5. Mapper le type
            const leaveType = typeMapping[row.Type] || 'OTHER';
            
            // 6. Calculer jours ouvrés
            const countedDays = calculateWorkingDays(startDate, endDate);
            
            // 7. Créer le congé
            await prisma.leave.create({
                data: {
                    userId: user.id,
                    startDate,
                    endDate,
                    type: leaveType,
                    typeCode: leaveType,
                    status: 'APPROVED', // Déjà validé en RH
                    reason: `Import RH - ${row.Type}`,
                    comment: `Importé depuis ${filePath}`,
                    countedDays
                }
            });
            
            imported++;
            
        } catch (error) {
            console.error(`❌ Erreur ligne ${imported + errors + 1}:`, error.message);
            errors++;
        }
    }
    
    console.log(`✅ Import terminé: ${imported} congés créés, ${errors} erreurs`);
}

function calculateWorkingDays(start, end) {
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

// Usage
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Usage: node scripts/import-from-excel.js <fichier.xlsx>');
    process.exit(1);
}

importFromExcel(args[0])
    .catch(console.error)
    .finally(() => prisma.$disconnect());
```

**Utilisation** :
```bash
# Conversion Excel → CSV d'abord (optionnel)
npm install -g xlsx

# Import direct
node scripts/import-from-excel.js planning-rh-2025.xlsx
```

### Exemple 4 : Synchronisation multi-environnements

**Contexte** : Même données sur dev, staging et prod

**Script de synchronisation** :

```bash
#!/bin/bash
# scripts/sync-environments.sh

set -e

SOURCE_ENV=${1:-production}
TARGET_ENV=${2:-staging}

echo "🔄 Synchronisation $SOURCE_ENV → $TARGET_ENV"

# 1. Export depuis source
echo "📤 Export depuis $SOURCE_ENV..."
if [ "$SOURCE_ENV" = "production" ]; then
    DATABASE_URL=$PROD_DATABASE_URL npm run export:all
else
    DATABASE_URL=$DEV_DATABASE_URL npm run export:all
fi

# 2. Trouver le dernier export
LATEST_EXPORT=$(ls -t exports/db-export-*.json | head -1)
echo "📁 Fichier: $LATEST_EXPORT"

# 3. Nettoyer données sensibles
echo "🔒 Nettoyage données sensibles..."
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('$LATEST_EXPORT'));

// Anonymiser emails et mots de passe
if (data.users) {
    data.users = data.users.map(u => ({
        ...u,
        email: u.email.replace(/@.*/, '@example.com'),
        phoneNumber: '0123456789'
    }));
}

// Supprimer données confidentielles
delete data.auditLogs;
delete data.notifications;

fs.writeFileSync('$LATEST_EXPORT.sanitized', JSON.stringify(data, null, 2));
"

# 4. Import vers cible
echo "📥 Import vers $TARGET_ENV..."
if [ "$TARGET_ENV" = "staging" ]; then
    DATABASE_URL=$STAGING_DATABASE_URL node scripts/import-db-state.js "$LATEST_EXPORT.sanitized"
else
    DATABASE_URL=$DEV_DATABASE_URL node scripts/import-db-state.js "$LATEST_EXPORT.sanitized"
fi

echo "✅ Synchronisation terminée"

# 5. Nettoyage
rm "$LATEST_EXPORT.sanitized"
```

### Exemple 5 : Tests automatisés des seeds

**Contexte** : Valider que les seeds fonctionnent toujours

**Tests Jest** :

```typescript
// tests/seeds.test.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

describe('Seeds Tests', () => {
    beforeEach(async () => {
        // Reset DB avant chaque test
        execSync('npm run prisma:migrate:reset -- --force');
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    test('should seed base data correctly', async () => {
        // Exécuter seed de base
        execSync('npm run db:seed');

        // Vérifier utilisateurs
        const users = await prisma.user.findMany();
        expect(users.length).toBeGreaterThan(20);

        const mars = users.filter(u => u.professionalRole === 'MAR');
        const iades = users.filter(u => u.professionalRole === 'IADE');
        
        expect(mars.length).toBeGreaterThan(10);
        expect(iades.length).toBeGreaterThan(5);

        // Vérifier spécialités
        const specialties = await prisma.specialty.findMany();
        expect(specialties.length).toBe(20);

        // Vérifier chirurgiens
        const surgeons = await prisma.surgeon.findMany();
        expect(surgeons.length).toBe(70);
    });

    test('should seed test leaves correctly', async () => {
        // Prérequis
        execSync('npm run db:seed');
        
        // Exécuter seed congés
        execSync('npm run seed:leaves-test');

        // Vérifier congés
        const leaves = await prisma.leave.findMany({
            include: { user: true }
        });

        expect(leaves.length).toBe(66);

        // Vérifier répartition par rôle
        const marsLeaves = leaves.filter(l => l.user.professionalRole === 'MAR');
        const iadesLeaves = leaves.filter(l => l.user.professionalRole === 'IADE');

        expect(marsLeaves.length).toBe(42); // 14 MAR × 3 congés
        expect(iadesLeaves.length).toBe(24); // 8 IADE × 3 congés

        // Vérifier types de congés
        const annualLeaves = leaves.filter(l => l.type === 'ANNUAL');
        expect(annualLeaves.length).toBeGreaterThan(20);

        // Vérifier toutes les dates sont dans la période d'été
        const summerStart = new Date('2025-06-01');
        const summerEnd = new Date('2025-09-30');
        
        for (const leave of leaves) {
            expect(leave.startDate.getTime()).toBeGreaterThanOrEqual(summerStart.getTime());
            expect(leave.endDate.getTime()).toBeLessThanOrEqual(summerEnd.getTime());
        }
    });

    test('should export/import data correctly', async () => {
        // Seed initial
        execSync('npm run db:seed');
        
        // Export
        execSync('npm run export:all');
        
        // Vérifier fichier créé
        const exports = execSync('ls exports/db-export-*.json').toString().trim().split('\n');
        expect(exports.length).toBeGreaterThan(0);
        
        // Reset et import
        execSync('npm run prisma:migrate:reset -- --force');
        const latestExport = exports[exports.length - 1];
        execSync(`node scripts/import-db-state.js ${latestExport.split('/').pop()}`);
        
        // Vérifier données restaurées
        const users = await prisma.user.findMany();
        expect(users.length).toBeGreaterThan(20);
    });
});
```

**Commande** :
```bash
# Ajouter aux scripts npm
npm pkg set scripts.test:seeds="jest tests/seeds.test.ts"

# Exécuter
npm run test:seeds
```

### Exemple 6 : Dashboard de monitoring des seeds

**Contexte** : Interface web pour surveiller l'état des données

**API Endpoint** :

```typescript
// src/pages/api/admin/seeds-status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Statistiques globales
        const stats = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { professionalRole: 'MAR' } }),
            prisma.user.count({ where: { professionalRole: 'IADE' } }),
            prisma.surgeon.count(),
            prisma.specialty.count(),
            prisma.leave.count(),
            prisma.leave.count({ where: { status: 'APPROVED' } }),
            prisma.leave.count({ 
                where: { 
                    startDate: { gte: new Date('2025-07-01') },
                    endDate: { lte: new Date('2025-08-31') }
                } 
            }),
        ]);

        // Dernière activité de seed
        const lastLeave = await prisma.leave.findFirst({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { nom: true, prenom: true } } }
        });

        // Vérifications de santé
        const healthChecks = {
            hasUsers: stats[0] > 0,
            hasSurgeons: stats[3] > 0,
            hasSpecialties: stats[4] > 0,
            hasLeaves: stats[5] > 0,
            hasMinimumUsers: stats[0] >= 20,
            hasBalancedRoles: stats[1] > 10 && stats[2] > 5,
            hasSummerLeaves: stats[7] > 0
        };

        const healthScore = Object.values(healthChecks).filter(Boolean).length / Object.keys(healthChecks).length * 100;

        res.status(200).json({
            stats: {
                totalUsers: stats[0],
                marsCount: stats[1],
                iadesCount: stats[2],
                surgeonsCount: stats[3],
                specialtiesCount: stats[4],
                totalLeaves: stats[5],
                approvedLeaves: stats[6],
                summerLeaves: stats[7]
            },
            lastActivity: lastLeave ? {
                date: lastLeave.createdAt,
                user: `${lastLeave.user.prenom} ${lastLeave.user.nom}`,
                type: lastLeave.type
            } : null,
            health: {
                score: Math.round(healthScore),
                checks: healthChecks
            },
            recommendations: generateRecommendations(stats, healthChecks)
        });

    } catch (error) {
        console.error('Erreur API seeds-status:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

function generateRecommendations(stats: number[], checks: any): string[] {
    const recs = [];
    
    if (!checks.hasMinimumUsers) {
        recs.push('⚠️ Peu d\'utilisateurs - Exécuter npm run db:seed');
    }
    
    if (!checks.hasBalancedRoles) {
        recs.push('⚠️ Déséquilibre MAR/IADE - Vérifier prisma/seed_data/utilisateurs.csv');
    }
    
    if (stats[5] === 0) {
        recs.push('💡 Aucun congé - Exécuter npm run seed:leaves-test');
    }
    
    if (!checks.hasSummerLeaves) {
        recs.push('🏖️ Pas de congés d\'été - Données de test recommandées');
    }
    
    if (recs.length === 0) {
        recs.push('✅ Données en bon état');
    }
    
    return recs;
}
```

**Composant React** :

```tsx
// src/components/admin/SeedsStatusDashboard.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SeedsStatus {
    stats: any;
    health: { score: number; checks: any };
    recommendations: string[];
    lastActivity: any;
}

export function SeedsStatusDashboard() {
    const [status, setStatus] = useState<SeedsStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        try {
            const response = await fetch('/api/admin/seeds-status');
            const data = await response.json();
            setStatus(data);
        } catch (error) {
            console.error('Erreur chargement status:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Refresh toutes les 30s
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div>Chargement...</div>;
    if (!status) return <div>Erreur de chargement</div>;

    const getHealthColor = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Score de santé */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getHealthColor(status.health.score)}`} />
                        Santé des données
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{status.health.score}%</div>
                    <div className="text-sm text-gray-600">Score de santé global</div>
                </CardContent>
            </Card>

            {/* Statistiques */}
            <Card>
                <CardHeader>
                    <CardTitle>Statistiques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between">
                        <span>Utilisateurs</span>
                        <Badge variant="outline">{status.stats.totalUsers}</Badge>
                    </div>
                    <div className="flex justify-between">
                        <span>MAR</span>
                        <Badge variant="outline">{status.stats.marsCount}</Badge>
                    </div>
                    <div className="flex justify-between">
                        <span>IADE</span>
                        <Badge variant="outline">{status.stats.iadesCount}</Badge>
                    </div>
                    <div className="flex justify-between">
                        <span>Chirurgiens</span>
                        <Badge variant="outline">{status.stats.surgeonsCount}</Badge>
                    </div>
                    <div className="flex justify-between">
                        <span>Congés</span>
                        <Badge variant="outline">{status.stats.totalLeaves}</Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Recommandations */}
            <Card>
                <CardHeader>
                    <CardTitle>Recommandations</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {status.recommendations.map((rec, index) => (
                            <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                                {rec}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card className="md:col-span-2 lg:col-span-3">
                <CardHeader>
                    <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 flex-wrap">
                        <Button onClick={() => triggerSeed('base')}>
                            Reseed base
                        </Button>
                        <Button onClick={() => triggerSeed('leaves')}>
                            Congés test
                        </Button>
                        <Button onClick={() => triggerExport()}>
                            Export backup
                        </Button>
                        <Button variant="outline" onClick={fetchStatus}>
                            Actualiser
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    async function triggerSeed(type: string) {
        // Appeler API pour déclencher seed
        console.log(`Triggering ${type} seed...`);
    }

    async function triggerExport() {
        // Appeler API pour déclencher export
        console.log('Triggering export...');
    }
}
```

Ces exemples couvrent les cas d'usage les plus courants. Chaque exemple inclut le code complet, les commandes à exécuter et les vérifications à effectuer. 