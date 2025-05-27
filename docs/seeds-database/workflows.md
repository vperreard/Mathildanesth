# Workflows quotidiens - Seeds & Base de données

## 🔄 Workflows par cas d'usage

### 1. Début de projet / Environnement vide

**Objectif** : Initialiser une base de données complète

```bash
# Setup initial complet
npm run prisma:migrate         # Appliquer les migrations
npm run db:seed               # Données de base (utilisateurs, chirurgiens, spécialités)
npm run seed:leaves-test      # Données de test (congés été 2025)

# Vérifier que tout fonctionne
curl http://localhost:3000/api/utilisateurs
```

**Résultat attendu** :
- ✅ 29 utilisateurs (MARS/IADES/SECRÉTAIRES)
- ✅ 70 chirurgiens avec spécialités
- ✅ 20 spécialités médicales
- ✅ 66 congés de test pour été 2025

### 2. Ajout de nouveaux utilisateurs

**Objectif** : Ajouter 5 nouveaux MARS à l'équipe

```bash
# 1. Backup préventif
npm run export:all

# 2. Exporter utilisateurs actuels
npm run export:csv users

# 3. Éditer le CSV
code exports/csv/utilisateurs-$(date +%Y-%m-%d).csv

# 4. Ajouter les nouvelles lignes :
# "NOUVEAU","Jean","jean.nouveau","jean.nouveau@hopital.fr","UTILISATEUR","MAR","false","","2025-01-01","","true","","","","",""

# 5. Remplacer le fichier source
cp exports/csv/utilisateurs-$(date +%Y-%m-%d).csv prisma/seed_data/utilisateurs.csv

# 6. Reseeder
npm run db:seed
```

### 3. Modification des congés de test

**Objectif** : Changer les dates de vacances d'été

```bash
# Option A : Modifier le script directement
code prisma/seed-leaves-test.ts
# Changer SUMMER_START et SUMMER_END
# npm run seed:leaves-test

# Option B : Depuis export existant
npm run export:selective leaves
code exports/selective-export-*.json
# Modifier les dates
npm run export:to-seed selective-export-*.json
tsx prisma/seed-from-export-*.ts
```

### 4. Sauvegarde avant mise en production

**Objectif** : Backup complet avant déploiement

```bash
# 1. Export complet avec timestamp
npm run export:all

# 2. Export CSV pour édition facile
npm run export:csv

# 3. Versionner les seeds actuels
git add prisma/seed_data/
git commit -m "Backup seeds before production deployment"

# 4. Tag de version
git tag -a "seeds-v1.0-$(date +%Y%m%d)" -m "Seeds backup before production"
```

### 5. Restauration après problème

**Objectif** : Retour à un état stable connu

```bash
# Option A : Reset complet + seeds de base
npm run prisma:migrate:reset
npm run db:seed

# Option B : Restauration depuis backup
ls exports/db-export-*.json
node scripts/import-db-state.js db-export-2025-XX-XX.json

# Option C : Depuis tag Git
git checkout seeds-v1.0-20250524
npm run db:seed
```

### 6. Synchronisation environnements dev/staging/prod

**Objectif** : Aligner les données entre environnements

```bash
# Depuis production (ou référence)
npm run export:all

# Vers environnement cible
scp exports/db-export-*.json staging:/app/exports/
ssh staging "cd /app && node scripts/import-db-state.js exports/db-export-*.json"

# Vérification
ssh staging "cd /app && curl http://localhost:3000/api/utilisateurs | jq length"
```

### 7. Tests de charge avec données volumineuses

**Objectif** : Générer 1000+ congés pour tests de performance

```bash
# 1. Script de génération massive
cat > scripts/generate-massive-leaves.js << 'EOF'
import { PrismaClient } from '@prisma/client';
import { addDays, format } from 'date-fns';

const prisma = new PrismaClient();

async function generateMassiveLeaves() {
    const users = await prisma.user.findMany({
        where: { professionalRole: { in: ['MAR', 'IADE'] } }
    });
    
    const leaves = [];
    const startDate = new Date('2025-01-01');
    
    for (let i = 0; i < 1000; i++) {
        const user = users[i % users.length];
        const leaveStart = addDays(startDate, Math.floor(Math.random() * 365));
        const leaveEnd = addDays(leaveStart, Math.floor(Math.random() * 14) + 1);
        
        leaves.push({
            userId: user.id,
            startDate: leaveStart,
            endDate: leaveEnd,
            type: 'ANNUAL',
            typeCode: 'ANNUAL',
            status: 'APPROVED',
            countedDays: 5,
            reason: `Test congé #${i}`,
        });
    }
    
    await prisma.leave.createMany({ data: leaves });
    console.log(`${leaves.length} congés créés`);
}

generateMassiveLeaves().finally(() => prisma.$disconnect());
EOF

# 2. Exécuter
node scripts/generate-massive-leaves.js
```

### 8. Migration de données existantes

**Objectif** : Importer des données depuis ancien système

```bash
# 1. Préparer les données sources (CSV depuis Excel/ancien système)
# Format attendu : nom,prenom,email,role,dateEntree

# 2. Adapter le script d'import
cp scripts/export-to-csv.js scripts/import-legacy-data.js
# Modifier pour lire depuis un CSV custom

# 3. Test sur données partielles
head -10 legacy-users.csv > test-users.csv
node scripts/import-legacy-data.js test-users.csv

# 4. Import complet après validation
node scripts/import-legacy-data.js legacy-users.csv
```

## ⚡ Scripts d'automatisation

### Script de déploiement complet

```bash
#!/bin/bash
# deploy-with-seeds.sh

set -e

echo "🚀 Déploiement avec seeds..."

# 1. Backup
npm run export:all
echo "✅ Backup créé"

# 2. Migration
npm run prisma:migrate:deploy
echo "✅ Migrations appliquées"

# 3. Seeds de base
npm run db:seed
echo "✅ Seeds de base appliqués"

# 4. Seeds de test si environnement de dev
if [ "$NODE_ENV" = "development" ]; then
    npm run seed:leaves-test
    echo "✅ Seeds de test appliqués"
fi

echo "🎉 Déploiement terminé"
```

### Script de nettoyage périodique

```bash
#!/bin/bash
# cleanup-old-exports.sh

# Garder seulement les exports des 30 derniers jours
find exports/ -name "*.json" -mtime +30 -delete
find exports/csv/ -name "*.csv" -mtime +30 -delete

echo "🧹 Anciens exports supprimés"
```

### Script de vérification santé

```bash
#!/bin/bash
# health-check-db.sh

# Vérifier que les tables principales ont des données
USERS=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"User\";" | tail -1)
SURGEONS=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Surgeon\";" | tail -1)
SPECIALTIES=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Specialty\";" | tail -1)

echo "👥 Utilisateurs: $USERS"
echo "👨‍⚕️ Chirurgiens: $SURGEONS"
echo "🏥 Spécialités: $SPECIALTIES"

if [ "$USERS" -lt 20 ]; then
    echo "⚠️  Peu d'utilisateurs, reseed recommandé"
    exit 1
fi

echo "✅ Base de données en bonne santé"
```

## 🔧 Automatisation avec GitHub Actions

```yaml
# .github/workflows/seed-tests.yml
name: Test Seeds

on: [push, pull_request]

jobs:
  test-seeds:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Setup test database
        run: |
          docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=test postgres:13
          sleep 10
          
      - name: Run migrations
        run: npm run prisma:migrate:deploy
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
          
      - name: Test base seeds
        run: npm run db:seed
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
          
      - name: Test leaves seeds
        run: npm run seed:leaves-test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
          
      - name: Test export functionality
        run: |
          npm run export:all
          npm run export:csv users
          ls -la exports/
```

## 📋 Checklist de maintenance

### Hebdomadaire
- [ ] Vérifier la taille du dossier `exports/` (nettoyer si > 1GB)
- [ ] Backup des seeds personnalisés vers Git
- [ ] Test des scripts d'export/import

### Mensuelle  
- [ ] Update des données de test (nouveaux utilisateurs, congés)
- [ ] Vérification performance seeds (temps d'exécution)
- [ ] Review des scripts custom créés

### Avant mise en production
- [ ] Backup complet de production
- [ ] Test des migrations sur copie de prod
- [ ] Validation des seeds sur environnement staging
- [ ] Documentation des changements effectués

## 🆘 Résolution de problèmes courants

### Seeds très lents
```bash
# Vérifier les index
npx prisma db execute --stdin <<< "EXPLAIN ANALYZE SELECT * FROM \"User\";"

# Optimiser les requêtes batch
# Dans les scripts, utiliser createMany() au lieu de create() en boucle
```

### Conflits de données
```bash
# Mode debug pour voir les erreurs détaillées
DEBUG=* npm run db:seed

# Vérifier les contraintes
npx prisma validate
```

### Exports volumineux
```bash
# Export partiel par date
npm run export:selective leaves | grep "2025-07"

# Compression des exports
gzip exports/db-export-*.json
``` 