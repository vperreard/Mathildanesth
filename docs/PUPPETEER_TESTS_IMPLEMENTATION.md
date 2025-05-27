# Documentation - Implémentation des Tests Puppeteer

## 📋 Résumé de l'implémentation

### Objectif
Créer des tests automatisés Puppeteer pour tester la gestion des sites, secteurs et salles d'opération.

### Date
25 Mai 2025

## 🚀 Travail réalisé

### 1. Structure des tests créée

#### Fichiers créés :
- `/tests/e2e/sites-rooms-management.test.ts` - Test principal complet
- `/tests/e2e/helpers/auth.ts` - Helper pour l'authentification
- `/tests/e2e/helpers/ensure-test-data.ts` - Helper pour créer les données de test
- `/tests/e2e/setup.ts` - Configuration globale des tests
- `/jest.e2e.puppeteer.config.js` - Configuration Jest pour Puppeteer
- `/scripts/ensure-test-users.js` - Script pour créer les utilisateurs de test

#### Package.json mis à jour :
```json
"test:e2e:sites": "jest --config=jest.e2e.puppeteer.config.js tests/e2e/sites-rooms-management.test.ts"
```

### 2. Structure du test principal

Le test couvre 4 sections principales :

1. **Gestion des Sites**
   - Création d'un nouveau site
   - Modification d'un site existant

2. **Gestion des Secteurs**
   - Création d'un secteur dans un site
   - Déplacement d'un secteur entre sites (prévu)

3. **Gestion des Salles**
   - Création d'une salle dans un secteur
   - Déplacement d'une salle entre secteurs (prévu)

4. **Nettoyage**
   - Suppression des données de test

### 3. Helpers créés

#### Helper d'authentification (`auth.ts`)
- Fonction `login()` générique qui gère plusieurs formats de formulaire
- Support pour login/email et différents sélecteurs
- Capture d'écran automatique en cas d'erreur
- Vérification de la connexion réussie

#### Configuration des utilisateurs de test
```typescript
export const testUsers = {
    admin: {
        email: 'admin',  // Login, pas email
        password: 'admin',
        role: 'ADMIN'
    }
};
```

## ⚠️ Problèmes rencontrés

### 1. Authentification
- La page de login utilise `login` au lieu de `email` comme champ
- L'URL est `/auth/connexion` et non `/auth/signin`
- Les credentials admin/admin fonctionnent bien selon l'utilisateur

### 2. Schéma de base de données
Le modèle User dans Prisma nécessite :
- `nom` et `prenom` (pas firstName/lastName)
- `role` : ADMIN_TOTAL, ADMIN_PARTIEL ou USER
- `professionalRole` : MAR, IADE ou SECRETAIRE
- `actif` au lieu de `isActive`

### 3. Problèmes techniques
- Les tests timeout car la connexion ne fonctionne pas automatiquement
- Besoin de vérifier pourquoi le formulaire de login ne se soumet pas correctement

## 📝 État actuel

### ✅ Complété
- Structure complète des tests Puppeteer
- Helpers d'authentification flexibles
- Configuration Jest pour les tests E2E
- Scripts de création d'utilisateurs
- Gestion des screenshots en cas d'erreur

### ❌ À corriger
- Problème de soumission du formulaire de login
- Tests de déplacement drag & drop à implémenter
- Vérification des permissions admin

## 🔧 Prochaines étapes recommandées

1. **Débugger l'authentification**
   ```bash
   # Lancer le test en mode visible pour voir ce qui se passe
   HEADLESS=false npm run test:e2e:sites
   ```

2. **Vérifier manuellement**
   - Que admin/admin fonctionne bien
   - L'URL exacte après connexion
   - Les sélecteurs CSS de la page de configuration

3. **Améliorer les tests**
   - Ajouter des assertions plus spécifiques
   - Implémenter les tests de drag & drop
   - Ajouter des tests de permissions

## 💡 Conseils pour le débogage

1. Utiliser le mode non-headless pour voir ce qui se passe :
   ```bash
   HEADLESS=false SLOWMO=200 npm run test:e2e:sites
   ```

2. Vérifier les screenshots dans `/tests/e2e/screenshots/`

3. Ajouter des `console.log` dans le test pour tracer l'exécution

4. Vérifier que le serveur de développement est bien lancé :
   ```bash
   npm run dev
   ```

## 📚 Documentation des sélecteurs

Pour faciliter les futurs tests, voici les sélecteurs importants :

### Page de login
- Login input : `input[name="login"]`
- Password input : `input[name="password"]`
- Submit button : `button[type="submit"]`

### Page de configuration
- Onglet Sites : `button:contains("Sites")`
- Onglet Secteurs : `button:contains("Secteurs")`
- Onglet Salles : `button:contains("Salles")`
- Boutons d'ajout : `button:contains("Ajouter")`

## 🎯 Conclusion

L'infrastructure de test est en place et bien structurée. Le principal blocage est l'authentification automatique qui doit être déboguée. Une fois ce problème résolu, les tests pourront s'exécuter correctement et tester toutes les fonctionnalités de gestion des sites, secteurs et salles.