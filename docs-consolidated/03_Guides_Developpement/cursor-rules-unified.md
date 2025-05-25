# Cursor Rules Améliorées - Mathildanesth

## A. Compréhension & Planification
- Commence toujours par **comprendre** la demande puis **planifie** ta réponse : réfléchis aux étapes, aux outils nécessaires et aux impacts sur le code.
- Planifie et réfléchis **avant** chaque appel d'outil ; à la fin de chaque étape, réfléchis rapidement au résultat pour ajuster la suite.

## B. Continuité & Reprise
- Si tu es interrompu malgré toi (timeout, limite), **reprends immédiatement** là où tu t'es arrêté, sans attendre de question supplémentaire.
- Tu peux découper ton travail en **plusieurs messages automatiques** si le volume est trop important ; ne demande pas la permission de continuer.

## C. Qualité du Code & Tests (NOUVEAU - PRIORITAIRE)

### Tests obligatoires
- **TOUJOURS** écrire des tests unitaires pour chaque nouvelle fonction/composant
- Utiliser Jest pour les tests unitaires, Cypress pour les tests E2E
- Maintenir une couverture de tests > 70%
- **JAMAIS** de code en production sans tests correspondants

### 🎯 **Tests E2E Puppeteer - NOUVEAU WORKFLOW**

#### Quand utiliser Puppeteer vs Tests Unitaires :
- **Tests Unitaires (60-65%)** : Logique métier, hooks, services, utilitaires
- **Tests E2E Puppeteer (10-15%)** : Workflows critiques utilisateur complets
- **Tests d'Intégration (25-30%)** : APIs, base de données, services externes

#### Workflows Critiques à Tester avec Puppeteer :
1. **🔐 Authentification complète** (login → accès sécurisé)
2. **🏥 Création congé médical** (formulaire → validation → soumission)
3. **📅 Planning bloc opératoire** (génération → modification → validation)
4. **👤 Gestion utilisateurs** (création → permissions → suppression)
5. **📊 Export données patients** (sélection → export → téléchargement)

#### Structure des Tests E2E :
```
tests/e2e/
├── workflows/
│   ├── auth.e2e.test.js           # Authentification
│   ├── leaves.e2e.test.js         # Workflow congés
│   ├── planning.e2e.test.js       # Workflow planning
│   └── admin.e2e.test.js          # Workflow administration
├── utils/
│   ├── puppeteer-helpers.js       # Utilitaires réutilisables
│   ├── test-data.js               # Données de test
│   └── page-objects.js            # Page Objects Pattern
└── config/
    └── puppeteer.config.js        # Configuration Puppeteer
```

#### Tests E2E Obligatoires :
- **AVANT** chaque release majeure
- **APRÈS** modification d'un workflow critique
- **QUAND** bug critique détecté en production
- **SYSTÉMATIQUEMENT** pour les features médicales sensibles

### Standards TypeScript
- **INTERDICTION ABSOLUE** d'utiliser `@ts-ignore` - trouver la solution typée
- Préférer `as Type` seulement quand nécessaire et documenté
- Typer explicitement les paramètres et retours de fonctions
- Utiliser les types Prisma générés

### Architecture Next.js
- **UNIQUEMENT App Router** - ne pas mélanger avec Pages Router
- Structure modulaire cohérente sous `/src/modules/`
- Services dans `/src/services/` pour la logique métier complexe
- Composants réutilisables dans `/src/components/`

## D. Conventions Spécifiques Mathildanesth

### Structure des modules
```
src/modules/[module-name]/
├── components/         # Composants UI du module
├── services/          # Logique métier
├── types/            # Types TypeScript
├── tests/            # Tests du module
│   ├── unit/         # Tests unitaires
│   └── e2e/          # Tests E2E Puppeteer spécifiques
└── README.md         # Documentation du module
```

### Nommage
- Composants : PascalCase (`LeaveForm.tsx`)
- Services : camelCase (`leaveService.ts`)
- Types : PascalCase avec suffixe (`LeaveRequestType`)
- Hooks : `use` + PascalCase (`useLeaveCalculation`)
- Tests E2E : `[feature].e2e.test.js` (`leaves.e2e.test.js`)

### Gestion d'erreurs
- Utiliser des Result types ou Error boundaries
- **Jamais** de `throw new Error()` sans gestion
- Logger les erreurs avec winston/pino

## E. Usage des Outils & Contexte
- Lorsque tu n'es pas certain du contenu d'un fichier ou d'un point technique, utilise les outils de Cursor pour **lire** ou **chercher** ; ne devine pas.
- **Consulte toujours** la documentation existante du module avant de modifier
- Vérifie la cohérence avec l'architecture existante
- Lors de modifications, affiche uniquement les **diffs ou parties modifiées**

## F. Processus de Développement avec Tests E2E

### Avant toute modification critique
1. Lire la documentation du module concerné
2. Identifier les tests existants à maintenir
3. **Planifier les tests E2E** si workflow critique impacté
4. Planifier les nouveaux tests nécessaires

### Pendant le développement
1. Écrire le test unitaire d'abord (TDD when possible)
2. Implémenter le code
3. **Écrire/mettre à jour tests E2E** pour workflows impactés
4. Refactorer si nécessaire
5. Documenter les changements

### Après chaque modification critique
1. Vérifier que tous les tests unitaires passent
2. **Exécuter tests E2E** des workflows impactés
3. Vérifier la compilation TypeScript sans erreur
4. Mettre à jour la documentation si nécessaire

## G. **🎯 GOUVERNANCE TESTS E2E PUPPETEER (NOUVEAU)**

### **G.1 Obligation de Vérification E2E**

**AVANT toute modification de code impactant l'UI/UX :**

1. **Consulter l'inventaire** :
   ```bash
   node tests/e2e/scripts/inventory-manager.js status
   ```

2. **Identifier les tests impactés** :
   - Modifications composants avec `data-testid`
   - Changement routes principales (`/auth/login`, `/leaves`, `/planning`, etc.)
   - Modification APIs utilisées par l'interface
   - Changement structure formulaires/modales

3. **Classification impact** :
   - 🔴 **BREAKING** : Invalidation immédiate tests + re-validation obligatoire
   - 🟡 **MINOR** : Re-validation recommandée
   - 🟢 **PATCH** : Surveillance résultats tests

### **G.2 Actions Obligatoires selon Impact**

#### **🔴 BREAKING CHANGES**
```bash
# 1. Invalider tests impactés
node tests/e2e/scripts/inventory-manager.js invalidate "/route1,/route2"

# 2. Re-tester workflows concernés
npm run test:e2e:auth      # Si auth impacté
npm run test:e2e:leaves    # Si congés impacté
npm run test:e2e:planning  # Si planning impacté

# 3. Valider tests après corrections
node tests/e2e/scripts/inventory-manager.js validate "/route1,/route2" "TESTED"

# 4. Mettre à jour changelog
# Ajouter entrée dans tests/e2e/test-changelog.md
```

#### **🟡 MINOR CHANGES**
```bash
# 1. Vérifier status
node tests/e2e/scripts/inventory-manager.js needs-attention

# 2. Tester manuellement workflows principaux si nécessaire
npm run test:e2e:debug

# 3. Planifier nouveaux tests si nouvelles features
```

### **G.3 Conditions de Terminaison E2E**

**Une tâche est complète SEULEMENT si :**
- Le code compile sans erreurs TypeScript
- Les tests unitaires ET E2E passent
- La documentation est mise à jour
- **L'inventaire E2E est à jour** (`test-inventory.json`)
- **Coverage critique ≥ 60%** (cible 80%)
- **Aucun test FAILING > 48h**

### **G.4 Ajout Nouvelles Routes/Features**

**Lors de création nouvelles routes UI :**

1. **Ajouter à l'inventaire** :
   ```bash
   # Via script (à développer)
   node tests/e2e/scripts/inventory-manager.js add-route [workflow] [route] [metadata]
   ```

2. **Ou manuellement dans `test-inventory.json`** :
   ```json
   "/nouvelle-route": {
     "name": "Description route",
     "method": "GET",
     "testStatus": "NOT_TESTED",
     "priority": "CRITICAL|HIGH|MEDIUM|LOW",
     "scenarios": [...]
   }
   ```

3. **Planifier tests E2E** selon priorité :
   - **CRITICAL** : Tests E2E obligatoires avant merge
   - **HIGH** : Tests E2E dans les 7 jours
   - **MEDIUM/LOW** : Tests E2E selon roadmap

### **G.5 Bonnes Pratiques E2E**

1. **Sélecteurs robustes** :
   ```javascript
   // ✅ Préférer
   '[data-testid="submit-button"]'
   'button:has-text("Soumettre")'
   
   // ❌ Éviter
   '.btn.btn-primary.mt-3'
   ```

2. **Ajout data-testid** pour éléments critiques :
   ```tsx
   <button data-testid="leave-submit-button" onClick={submit}>
     Soumettre Demande
   </button>
   ```

3. **Timeouts adaptés** :
   ```javascript
   // Utiliser les timeouts configurés
   config.timeouts.fast      // 5s - éléments rapides
   config.timeouts.medium    // 15s - interactions normales
   config.timeouts.slow      // 30s - opérations lentes
   ```

### **G.6 Scripts NPM E2E Intégrés**

```json
{
  "test:full": "npm run test && npm run test:e2e",
  "test:e2e": "jest --config=jest.e2e.config.js",
  "test:e2e:status": "node tests/e2e/scripts/inventory-manager.js status",
  "test:e2e:report": "node tests/e2e/scripts/inventory-manager.js report",
  "test:e2e:needs-attention": "node tests/e2e/scripts/inventory-manager.js needs-attention"
}
```

## H. Terminaison & Validation
- À chaque fois que tu termines ta réponse par une question, ou que tu attends une validation, lance systématiquement le tool interactive_feedback
- **CONDITION DE TERMINAISON** : Une tâche est complète SEULEMENT si :
  - Le code compile sans erreurs TypeScript
  - Les tests unitaires ET E2E passent
  - La documentation est mise à jour
  - **L'inventaire E2E est à jour**
  - Aucun `@ts-ignore` n'a été introduit
  - L'architecture reste cohérente
  - **Coverage E2E critique ≥ 60%**

## I. Règles de Performance
- Utiliser React.memo pour les composants lourds
- Optimiser les requêtes Prisma (éviter N+1)
- Implémenter le cache Redis pour les données fréquentes
- Utiliser Next.js Image pour les optimisations

## J. Sécurité (pour app médicale)
- Valider TOUS les inputs utilisateur
- Utiliser Zod pour la validation des schémas
- Chiffrer les données sensibles
- Implémenter rate limiting sur les APIs
- Logger les accès aux données patients

## K. **🚨 ALERTES AUTOMATIQUES E2E**

**Déclencher alertes si :**
- Coverage critique < 60% 
- Plus de 5 tests FAILING simultanément
- Plus de 10 tests NEEDS_REVALIDATION
- Tests critiques non re-validés > 7 jours

**Actions automatiques :**
- Bloquer merge si tests critiques FAILING
- Notification équipe si coverage < seuils
- Rapport hebdomadaire status E2E 