# Documentation Seeds & Export/Import - Mathilda

## 📋 Vue d'ensemble

Ce système permet de gérer facilement les données de test et de production dans Mathilda via plusieurs méthodes :

- **Seeds de base** : Données fondamentales (utilisateurs, chirurgiens, spécialités)
- **Seeds de test** : Données temporaires pour les tests (congés, planning)
- **Export/Import** : Sauvegarde et restauration de données existantes
- **Transformation** : Conversion d'exports en nouveaux seeds

## 🗂️ Architecture des fichiers

```
Mathildanesth/
├── prisma/
│   ├── seed_data/           # Données CSV de base
│   │   ├── users.csv        # Utilisateurs MARS/IADES
│   │   ├── surgeons.csv     # Chirurgiens
│   │   ├── leave_types.csv  # Types de congés
│   │   └── operating_rooms.csv
│   ├── seed.ts              # Script principal de seed
│   ├── seed.cjs             # Version CommonJS
│   └── seed-leaves-test.ts  # Seeds de congés de test
├── scripts/
│   ├── export-db-state.js        # Export complet JSON
│   ├── export-specific-data.js   # Export sélectif JSON
│   ├── export-to-csv.js          # Export CSV éditable
│   ├── create-seed-from-export.js # Générateur de seeds
│   └── import-db-state.js         # Import complet
├── exports/
│   ├── *.json               # Exports JSON
│   └── csv/                 # Exports CSV éditables
└── docs/seeds-database/     # Cette documentation
```

## 🚀 Commandes NPM disponibles

### Seeds
```bash
# Seeds de base
npm run db:seed              # Toutes les données de base
npm run seed:leaves-test     # Congés de test été 2025
npm run seed:surgeons        # Chirurgiens uniquement
npm run seed:specialties     # Spécialités uniquement

# Alternative Prisma
npm run prisma:seed          # Équivalent à db:seed
```

### Exports
```bash
# Export complet (toutes données)
npm run export:all

# Export sélectif (tables spécifiques)
npm run export:selective users,leaves

# Export CSV éditable
npm run export:csv leaves,surgeons

# Conversion export → seed
npm run export:to-seed fichier-export.json
```

### Base de données
```bash
# Reset complet
npm run prisma:migrate:reset

# Migration seule
npm run prisma:migrate
```

## 📖 Guide d'utilisation

### Scénario 1 : Modification des utilisateurs existants

**But** : Ajouter de nouveaux utilisateurs MARS/IADES

```bash
# 1. Exporter les utilisateurs actuels
npm run export:csv users

# 2. Éditer le fichier CSV
code exports/csv/utilisateurs-YYYY-MM-DD.csv

# 3. Remplacer le fichier de seed
cp exports/csv/utilisateurs-YYYY-MM-DD.csv prisma/seed_data/utilisateurs.csv

# 4. Appliquer les changements
npm run db:seed
```

**Détails d'édition CSV** :
- **Colonnes obligatoires** : `nom`, `prenom`, `login`, `email`, `professionalRole`
- **Rôles disponibles** : `MAR`, `IADE`, `SECRETAIRE`
- **Format dates** : `YYYY-MM-DD`
- **Booléens** : `true`/`false`

### Scénario 2 : Créer des congés réalistes depuis l'existant

**But** : Prendre les congés actuels comme base pour de nouveaux seeds

```bash
# 1. Exporter les congés actuels
npm run export:selective leaves

# 2. Générer un seed depuis l'export
npm run export:to-seed selective-export-YYYY-MM-DD.json

# 3. Éditer le seed généré
code prisma/seed-from-export-YYYY-MM-DD.ts

# 4. Exécuter le nouveau seed
tsx prisma/seed-from-export-YYYY-MM-DD.ts
```

### Scénario 3 : Backup et restauration

**But** : Sauvegarder l'état actuel avant une grosse modification

```bash
# 1. Backup complet
npm run export:all

# 2. Faire vos modifications...

# 3. Si problème, restaurer
node scripts/import-db-state.js db-export-YYYY-MM-DD.json
```

### Scénario 4 : Ajouter massivement des congés

**But** : Créer 100+ congés rapidement via CSV

```bash
# 1. Créer un fichier CSV vide
echo "userNom,userPrenom,userRole,startDate,endDate,typeCode,type,status,countedDays,reason,comment" > mes-conges.csv

# 2. Remplir avec Excel/LibreOffice
# Exemple de ligne :
# "MARTIN","Sophie","MAR","2025-07-01","2025-07-15","ANNUAL","ANNUAL","APPROVED","11","Vacances été","Congés d'été"

# 3. Convertir CSV en seed personnalisé
# (Adapter le script create-seed-from-export.js pour lire CSV directement)
```

## 🔧 Modification avancée des scripts

### Personnaliser le seed de congés de test

**Fichier** : `prisma/seed-leaves-test.ts`

```typescript
// Modifier les constantes en haut du fichier
const SUMMER_START = new Date('2025-07-04');  // Début été
const SUMMER_END = new Date('2025-08-31');    // Fin été

// Ajouter de nouveaux utilisateurs
const leaveDataForUsers = [
    // ... existants ...
    {
        firstName: 'Nouveau',
        lastName: 'Utilisateur',
        professionalRole: 'MAR',
        baseLeaveStartDate: new Date('2025-07-10'),
        // ...
    }
];
```

### Ajouter une nouvelle table à l'export

**Fichier** : `scripts/export-specific-data.js`

```javascript
// Dans availableTables, ajouter :
nouvelleTable: async () => await prisma.nouvelleTable.findMany({
    include: {
        // relations si nécessaire
    }
}),
```

**Fichier** : `scripts/create-seed-from-export.js`

```javascript
// Dans le switch, ajouter :
case 'nouvelleTable':
    seedContent += generateNouvelleTableSeeds(data);
    break;

// Puis créer la fonction :
function generateNouvelleTableSeeds(items) {
    // Code de génération...
}
```

## 📊 Référence des données

### Types de congés disponibles
```typescript
enum LeaveType {
    ANNUAL = 'ANNUAL',           // Congé annuel
    RECOVERY = 'RECOVERY',       // Récupération
    TRAINING = 'TRAINING',       // Formation
    SICK = 'SICK',               // Maladie
    MATERNITY = 'MATERNITY',     // Maternité
    SPECIAL = 'SPECIAL',         // Congé spécial
    UNPAID = 'UNPAID',           // Sans solde
    OTHER = 'OTHER'              // Autre
}
```

### Rôles professionnels
```typescript
enum ProfessionalRole {
    MAR = 'MAR',                 // Médecin Anesthésiste Réanimateur
    IADE = 'IADE',               // Infirmier Anesthésiste
    SECRETAIRE = 'SECRETAIRE'    // Secrétaire
}
```

### Statuts de congés
```typescript
enum LeaveStatus {
    PENDING = 'PENDING',         // En attente
    APPROVED = 'APPROVED',       // Approuvé
    REJECTED = 'REJECTED',       // Rejeté
    CANCELLED = 'CANCELLED'      // Annulé
}
```

## 🚨 Dépannage

### Erreur : "Table inconnue"
**Cause** : La table demandée n'existe pas dans le script d'export
**Solution** : Vérifier la liste des tables disponibles

```bash
# Voir les tables disponibles
npm run export:selective
# Affiche : users, leaves, surgeons, specialties, leaveTypes, operatingRooms, operatingSectors, rules, planningRules
```

### Erreur : "leaveType does not exist"
**Cause** : Tentative d'accès à une relation incorrecte
**Solution** : Utiliser `typeCode` au lieu de `leaveType` pour les congés

### Erreur : "Module type not specified"
**Cause** : Les scripts .js ne sont pas reconnus comme modules ES
**Solution** : Ignorer (warning seulement) ou ajouter `"type": "module"` dans package.json

### Base corrompue après seed
**Solution** : Reset complet

```bash
npm run prisma:migrate:reset
npm run db:seed
```

## 📝 Bonnes pratiques

### 1. Toujours backup avant modification importante
```bash
npm run export:all  # Backup automatique avec timestamp
```

### 2. Tester en développement avant production
```bash
# Environnement de dev
npm run seed:leaves-test

# Vérifier le résultat
# Puis appliquer en prod
```

### 3. Versionner les seeds personnalisés
```bash
# Créer une branche pour les seeds
git checkout -b seeds/new-summer-leaves
# Faire les modifications
git add prisma/seed-custom-leaves.ts
git commit -m "Add custom summer leaves seed"
```

### 4. Documenter les modifications
```bash
# Ajouter un README dans le seed personnalisé
echo "# Seeds congés été 2025
Créé le $(date)
Utilisateurs concernés : 22 (14 MAR + 8 IADE)
Période : 4 juillet - 31 août 2025
" > prisma/README-seed-leaves.md
```

## 🔗 Fichiers connexes

- [Schema Prisma](../prisma/schema.prisma) - Structure de base
- [Migrations](../prisma/migrations/) - Historique des changements
- [Scripts utilitaires](../scripts/) - Outils d'export/import
- [Tests](../tests/) - Tests des seeds

## 💡 Cas d'usage avancés

Voir les guides détaillés :
- [Workflows quotidiens](workflows.md)
- [Exemples pratiques](examples.md)
- [Personnalisation avancée](advanced.md)
- [Migration données existantes](migration.md) 