# Tests E2E Puppeteer - Mathildanesth

## 🎯 **Vue d'Ensemble**

Ce dossier contient l'infrastructure complète de tests End-to-End (E2E) pour l'application Mathildanesth, utilisant **Puppeteer** pour automatiser et valider les workflows critiques utilisateur.

### Pourquoi Puppeteer pour Mathildanesth ?

En tant qu'application médicale critique de gestion d'anesthésistes, Mathildanesth nécessite des tests E2E robustes qui :
- ✅ **Valident les workflows complets** (authentification → navigation → action → résultat)
- ✅ **Détectent les bugs d'intégration** non couverts par les tests unitaires
- ✅ **Testent l'interface utilisateur réelle** dans des conditions proches de la production
- ✅ **Vérifient l'accessibilité** et l'expérience utilisateur
- ✅ **Simulent les conditions d'utilisation** en environnement médical

### 🆕 Nouveaux Tests Ajoutés

Depuis la dernière mise à jour, nous avons ajouté des tests E2E complets pour :
- 📅 **Calendrier** - Navigation, vues, événements
- 📋 **Planning Hebdomadaire** - Affichage, édition, drag & drop
- 👤 **Profil Utilisateur** - Informations, préférences, documents
- 🏥 **Bloc Opératoire** - Dashboard, salles, trames
- 🔔 **Notifications** - Centre, paramètres, temps réel
- 📊 **Statistiques** - Graphiques, exports, analyses

## 📁 **Structure du Projet**

```
tests/e2e/
├── 📊 workflows/              # Tests E2E par domaine fonctionnel
│   ├── auth.e2e.test.js      # ✅ Authentification et sécurité
│   ├── leaves.e2e.test.js    # ✅ Workflow gestion des congés
│   ├── calendar.e2e.test.js  # 🆕 Vue calendrier complète
│   ├── planning.e2e.test.js  # 🆕 Planning hebdomadaire
│   ├── profile.e2e.test.js   # 🆕 Profil utilisateur
│   ├── bloc-operatoire.e2e.test.js # 🆕 Bloc opératoire
│   ├── notifications.e2e.test.js   # 🆕 Notifications
│   ├── statistics.e2e.test.js      # 🆕 Statistiques
│   └── admin.e2e.test.js     # 🔄 Administration (à venir)
├── 🛠️ utils/                  # Helpers et utilitaires réutilisables
│   ├── puppeteer-helpers.js  # Classe PuppeteerHelpers
│   ├── test-data.js         # Données de test standardisées
│   └── page-objects.js      # Page Objects Pattern (à venir)
├── ⚙️ config/                 # Configuration
│   └── puppeteer.config.js  # Configuration Puppeteer centralisée
├── 📸 screenshots/           # Screenshots capturés pendant les tests
├── 📋 setup.js              # Setup global Jest-Puppeteer
├── 🚀 globalSetup.js        # Initialisation environnement test
├── 🧹 globalTeardown.js     # Nettoyage post-tests
└── 📖 README.md             # Cette documentation
```

## 🚀 **Démarrage Rapide**

### Prérequis

1. **Application démarrée** :
   ```bash
   npm run dev
   ```

2. **Utilisateur de test créé** :
   ```bash
   node create-test-user.js
   ```

### Exécution des Tests

```bash
# Tests E2E complets
npm run test:e2e

# Tests spécifiques par workflow
npm run test:e2e:auth     # Authentification
npm run test:e2e:leaves   # Gestion congés
npm run test:e2e:planning # Planning (à venir)

# Mode debug (navigateur visible)
npm run test:e2e:debug

# Mode CI/CD
npm run test:e2e:ci
```

## 🎯 **Workflows Testés**

### 1. 🔐 **Authentification (`auth.e2e.test.js`)**
- ✅ Connexion valide avec utilisateur de test
- ✅ Gestion échec de connexion (mauvais identifiants)
- ✅ Déconnexion complète et nettoyage session
- ✅ Redirection automatique session expirée
- ✅ Contrôles de sécurité (CSRF, validation)
- ✅ Accessibilité (navigation clavier, labels)

### 2. 🏥 **Gestion Congés (`leaves.e2e.test.js`)**
- ✅ Authentification et accès à la section congés
- ✅ Gestion des permissions (accès refusé sans connexion)
- ✅ Ouverture/fermeture formulaire de demande
- ✅ Remplissage complet du formulaire
- ✅ Validation des champs obligatoires
- ✅ Affichage du solde de congés
- ✅ Filtres et fonctions de recherche
- ✅ Gestion des erreurs réseau

### 3. 📅 **Calendrier (`calendar.e2e.test.js`)** 🆕
- ✅ Navigation et affichage du calendrier
- ✅ Navigation entre les mois
- ✅ Changement de vue (mois/semaine/jour)
- ✅ Affichage et interaction avec événements
- ✅ Filtrage des événements par type
- ✅ Export et paramètres
- ✅ Vue mobile responsive

### 4. 📋 **Planning Hebdomadaire (`planning.e2e.test.js`)** 🆕
- ✅ Visualisation du planning
- ✅ Navigation entre semaines
- ✅ Mode édition et drag & drop
- ✅ Filtres et recherche de personnel
- ✅ Statistiques de couverture
- ✅ Sauvegarde et publication
- ✅ Alertes et conflits

### 5. 👤 **Profil Utilisateur (`profile.e2e.test.js`)** 🆕
- ✅ Affichage informations personnelles
- ✅ Compteurs de congés
- ✅ Modification du profil
- ✅ Paramètres de notifications
- ✅ Historique et statistiques
- ✅ Documents et exports
- ✅ Personnalisation (thème, préférences)

### 6. 🏥 **Bloc Opératoire (`bloc-operatoire.e2e.test.js`)** 🆕
- ✅ Dashboard bloc opératoire
- ✅ Planning des salles
- ✅ Gestion des salles et équipements
- ✅ Trames d'affectation
- ✅ Règles de supervision
- ✅ Statistiques d'utilisation
- ✅ Export des données

### 7. 🔔 **Notifications (`notifications.e2e.test.js`)** 🆕
- ✅ Centre de notifications
- ✅ Filtrage par type et état
- ✅ Actions sur notifications
- ✅ Badge et dropdown header
- ✅ Paramètres de préférences
- ✅ Notifications temps réel
- ✅ Gestion et archivage

### 8. 📊 **Statistiques (`statistics.e2e.test.js`)** 🆕
- ✅ Dashboard statistiques principal
- ✅ Graphiques interactifs
- ✅ Statistiques utilisation bloc
- ✅ Prévisions et tendances
- ✅ Rapports personnalisés
- ✅ Export de données
- ✅ Analyses détaillées

### 9. 👤 **Administration** *(en développement)*
- 🔄 Gestion des utilisateurs
- 🔄 Configuration des paramètres
- 🔄 Exports et rapports

## 🛠️ **Utilitaires Disponibles**

### `PuppeteerHelpers` - Classe Principale

```javascript
const PuppeteerHelpers = require('./utils/puppeteer-helpers');

// Authentification automatique
await PuppeteerHelpers.login(page, user);

// Navigation intelligente
await PuppeteerHelpers.navigateToSection(page, 'leaves');

// Gestion des formulaires
await PuppeteerHelpers.fillForm(page, {
  'input[name="email"]': 'test@mathildanesth.fr',
  'input[name="password"]': 'test123'
});

// Gestion des modales
await PuppeteerHelpers.handleModal(page, 'open', '.modal', 'button.trigger');

// Screenshots automatiques
await PuppeteerHelpers.screenshot(page, 'test-state');

// Vérification chargement page
await PuppeteerHelpers.verifyPageLoad(page, ['.required-element']);
```

### Configuration Centralisée

```javascript
const config = require('./config/puppeteer.config');

// URLs d'environnement
config.urls.base;     // http://localhost:3000
config.urls.login;    // /auth/connexion
config.urls.leaves;   // /conges

// Sélecteurs standardisés
config.selectors.auth.emailInput;     // input[name="email"]
config.selectors.leaves.newRequestButton; // button:has-text("Nouvelle demande")

// Timeouts configurés
config.timeouts.fast;     // 5000ms
config.timeouts.medium;   // 15000ms
config.timeouts.slow;     // 30000ms
```

## 📊 **Métriques et Reporting**

### Screenshots Automatiques
- 📸 **Screenshots de succès** : Validation des états fonctionnels
- 🚨 **Screenshots d'erreur** : Debug automatique en cas d'échec
- 🕐 **Horodatage** : Tous les screenshots sont timestampés

### Logs Détaillés
```
🚀 Démarrage du navigateur pour les tests congés...
🔐 Connexion de l'utilisateur: test@mathildanesth.fr
✅ Connexion réussie
🧭 Navigation vers la section: leaves
✅ Navigation vers leaves terminée
📝 Remplissage du formulaire...
  ✓ input[name="startDate"]: "26/05/2025"
  ✓ input[name="endDate"]: "30/05/2025"
✅ Formulaire rempli
📸 Screenshot capturé: leave-form-filled-2025-01-25T08-45-32-123Z.png
```

## ⚙️ **Configuration et Personnalisation**

### Variables d'Environnement

```bash
# URL de base de l'application (défaut: http://localhost:3000)
TEST_BASE_URL=http://localhost:3001

# Mode headless (automatique en CI)
PUPPETEER_HEADLESS=false

# Ralentissement des actions (debug)
PUPPETEER_SLOWMO=100
```

### Adaptation des Sélecteurs

Modifiez `config/puppeteer.config.js` pour ajuster les sélecteurs selon votre interface :

```javascript
selectors: {
  leaves: {
    newRequestButton: 'button:has-text("Nouvelle demande")', // Ajustez selon votre UI
    leaveForm: '[data-testid="leave-form"]',                // Utilisez data-testid
    startDateInput: 'input[name="startDate"]'
  }
}
```

## 🔧 **Développement et Contribution**

### Créer un Nouveau Test E2E

1. **Créer le fichier de test** :
   ```bash
   touch tests/e2e/workflows/mon-workflow.e2e.test.js
   ```

2. **Structure de base** :
   ```javascript
   const puppeteer = require('puppeteer');
   const config = require('../config/puppeteer.config');
   const PuppeteerHelpers = require('../utils/puppeteer-helpers');

   describe('Mon Workflow E2E', () => {
     let browser, page;

     beforeAll(async () => {
       browser = await puppeteer.launch(config.browser);
     });

     beforeEach(async () => {
       page = await browser.newPage();
       await page.setViewport(config.page.viewport);
       await PuppeteerHelpers.login(page); // Si auth requise
     });

     test('Mon test spécifique', async () => {
       // Votre logique de test
     });
   });
   ```

3. **Ajouter le script npm** dans `package.json` :
   ```json
   "test:e2e:mon-workflow": "jest --config=jest.e2e.config.js --testNamePattern='mon-workflow'"
   ```

### Bonnes Pratiques

1. **Isolation des Tests** :
   - Chaque test doit être indépendant
   - Utiliser `beforeEach` pour setup propre
   - Nettoyer les données de test si nécessaire

2. **Gestion des Attentes** :
   ```javascript
   // ✅ Bon : attendre explicitement
   await page.waitForSelector('.element');
   
   // ❌ Éviter : attente fixe
   await page.waitForTimeout(5000);
   ```

3. **Screenshots et Debug** :
   ```javascript
   try {
     // Test logic
   } catch (error) {
     await PuppeteerHelpers.screenshot(page, 'error-state');
     throw error;
   }
   ```

4. **Sélecteurs Robustes** :
   ```javascript
   // ✅ Préférer : data-testid
   '[data-testid="submit-button"]'
   
   // ✅ Acceptable : sélecteurs sémantiques
   'button:has-text("Soumettre")'
   
   // ❌ Éviter : sélecteurs fragiles
   '.btn.btn-primary.mt-3'
   ```

## 🚨 **Dépannage**

### Problèmes Courants

1. **Application non démarrée** :
   ```
   ❌ Impossible d'accéder à l'application. Assurez-vous qu'elle est démarrée
   Solution: npm run dev
   ```

2. **Utilisateur de test manquant** :
   ```
   ❌ Échec de l'authentification
   Solution: node create-test-user.js
   ```

3. **Timeouts fréquents** :
   ```javascript
   // Augmenter les timeouts dans la config
   timeouts: {
     slow: 60000 // 60 secondes
   }
   ```

4. **Sélecteurs non trouvés** :
   ```javascript
   // Debug : lister tous les éléments disponibles
   await page.evaluate(() => {
     console.log(document.querySelector('button')); // Vérifier présence
   });
   ```

## 📈 **Intégration CI/CD**

### GitHub Actions Example

```yaml
name: Tests E2E
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
        
      - name: Start application
        run: npm run dev &
        
      - name: Wait for app
        run: npx wait-on http://localhost:3000
        
      - name: Run E2E tests
        run: npm run test:e2e:ci
```

## 📋 **TODO / Roadmap**

### ✅ Complété récemment
- [x] **Calendar Tests** : Tests E2E pour le calendrier
- [x] **Planning Tests** : Tests E2E pour le planning hebdomadaire
- [x] **Profile Tests** : Tests E2E pour le profil utilisateur
- [x] **Bloc Tests** : Tests E2E pour le bloc opératoire
- [x] **Notifications Tests** : Tests E2E pour les notifications
- [x] **Statistics Tests** : Tests E2E pour les statistiques

### 🔄 En cours / À venir
- [ ] **Admin Tests** : Tests E2E pour l'interface d'administration
- [ ] **Parameters Tests** : Tests E2E pour les paramètres système
- [ ] **Users Management** : Tests gestion utilisateurs
- [ ] **Performance Tests** : Tests de charge avec Puppeteer
- [ ] **Accessibility Tests** : Tests automatisés avec axe-puppeteer
- [ ] **Visual Regression** : Tests de régression visuelle
- [ ] **API Mocking** : Mock des APIs externes pour tests isolés
- [ ] **Cross-browser Tests** : Tests sur différents navigateurs

---

**Documentation mise à jour** : Janvier 2025  
**Version Puppeteer** : 23.9.0  
**Version Jest** : 29.7.0  
**Couverture des tests E2E** : ~80% des routes principales

Pour toute question ou contribution, consultez le guide de développement principal ou contactez l'équipe. 