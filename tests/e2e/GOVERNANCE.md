# 🎯 Gouvernance Tests E2E - Guide Équipe Mathildanesth

## 📋 **Vue d'Ensemble**

Ce guide définit **comment maintenir et faire évoluer** les tests End-to-End (E2E) avec Puppeteer dans Mathildanesth, en particulier **la gestion des modifications de code** et **l'inventaire des routes testées**.

---

## 🗂️ **Système d'Inventaire**

### **Fichiers Clés**
- **📊 `test-inventory.json`** : Inventaire exhaustif de toutes les routes utilisateur
- **📝 `test-changelog.md`** : Historique des modifications impactant les tests
- **🛠️ `scripts/inventory-manager.js`** : Script CLI de gestion automatisée

### **États des Tests**
- **🟢 TESTED** : Test validé et fonctionnel
- **🟡 TESTING** : Test en cours de développement
- **🔵 PLANNED** : Test planifié mais non développé
- **⚪ NOT_TESTED** : Aucun test prévu/créé
- **🔄 NEEDS_REVALIDATION** : Test invalidé par modification code
- **🔴 FAILING** : Test en échec

---

## ⚡ **Commandes de Base**

### **📊 Consulter le Status**
```bash
# Status global des tests E2E
npm run test:e2e:status

# Rapport détaillé par workflow
npm run test:e2e:report

# Éléments nécessitant attention
npm run test:e2e:needs-attention
```

### **🧪 Exécuter les Tests**
```bash
# Tests E2E complets
npm run test:e2e

# Tests par workflow
npm run test:e2e:auth     # Authentification
npm run test:e2e:leaves   # Gestion congés
npm run test:e2e:planning # Planning bloc opératoire

# Mode debug (navigateur visible)
npm run test:e2e:debug
```

---

## 🔄 **Workflow Modification de Code**

### **🛠️ Avant Modification**

1. **Vérifier l'état actuel** :
   ```bash
   npm run test:e2e:status
   ```

2. **Identifier les tests impactés** :
   - Routes modifiées (`/auth/login`, `/leaves`, etc.)
   - Composants avec `data-testid`
   - APIs utilisées par l'interface
   - Structure formulaires/modales

### **🔧 Pendant Modification**

1. **Si UI/UX change** : Ajouter/maintenir `data-testid` sur éléments critiques :
   ```tsx
   <button data-testid="leave-submit-button">
     Soumettre Demande
   </button>
   ```

2. **Si nouvelle route** : Ajouter à l'inventaire :
   ```bash
   # Manuellement dans test-inventory.json
   # Ou via script (en développement)
   ```

### **✅ Après Modification**

#### **🔴 Pour BREAKING CHANGES :**
```bash
# 1. Invalider tests impactés
npm run test:e2e:invalidate "/auth/login,/leaves"

# 2. Re-tester workflows
npm run test:e2e:auth

# 3. Valider tests corrigés
npm run test:e2e:validate "/auth/login" "TESTED"

# 4. Mettre à jour changelog
```

#### **🟡 Pour MINOR CHANGES :**
```bash
# Vérifier état et tester si nécessaire
npm run test:e2e:needs-attention
npm run test:e2e:debug
```

---

## 📊 **Métriques et Objectifs**

### **Seuils Qualité**
- **Coverage critique** : ≥ 80% (routes CRITICAL)
- **Coverage global** : ≥ 60% (toutes routes)
- **Tests en échec** : ≤ 5 simultanément
- **Re-validation** : ≤ 48h après modification

### **Priorités Routes**
- **🔴 CRITICAL** : Authentification, congés, planning bloc
- **🟠 HIGH** : Administration, utilisateurs
- **🟡 MEDIUM** : Statistiques, notifications
- **🟢 LOW** : Documentations, paramètres

---

## 🚨 **Gestion des Problèmes**

### **Tests FAILING**

1. **Identifier la cause** :
   ```bash
   npm run test:e2e:debug  # Mode visuel
   ```

2. **Problèmes courants** :
   - **Sélecteurs** : Composants UI modifiés
   - **Timeouts** : Pages lentes, builds Next.js
   - **Navigation** : Routes ou menus changés
   - **Data** : Utilisateur test manquant

3. **Actions correctives** :
   ```bash
   # Correction sélecteurs dans config
   # Augmentation timeouts si nécessaire
   # Re-création utilisateur test
   node create-test-user.js
   ```

### **Coverage Insuffisant**

1. **Identifier gaps** :
   ```bash
   npm run test:e2e:report
   ```

2. **Prioriser tests critiques** :
   - Routes CRITICAL d'abord
   - Workflows métier prioritaires
   - Authentification et sécurité

3. **Planifier développement** :
   - Ajouter dans backlog
   - Assigner à sprint suivant
   - Marquer comme PLANNED

---

## 👥 **Responsabilités Équipe**

### **🧑‍💻 Développeurs**
- **Avant chaque commit** : Vérifier impact E2E
- **Après modification UI** : Invalider/re-valider tests
- **Nouvelles features** : Ajouter à l'inventaire
- **Merge requests** : S'assurer tests passent

### **🧪 QA/Test Lead**
- **Maintenance inventaire** : Mise à jour régulière
- **Coverage monitoring** : Surveillance métriques
- **Test planning** : Priorisation nouveaux tests
- **CI/CD** : Intégration pipeline

### **👨‍💼 Product Owner**
- **Priorisation routes** : Définir CRITICAL/HIGH/MEDIUM
- **Validation workflows** : Accepter critères qualité
- **Roadmap tests** : Planifier coverage objectifs

---

## 📅 **Processus Récurrents**

### **📊 Weekly Review** (Équipe Dev)
```bash
# 1. Status global
npm run test:e2e:status

# 2. Éléments attention
npm run test:e2e:needs-attention

# 3. Planifier actions correctives
```

### **📈 Monthly Report** (QA Lead)
```bash
# 1. Rapport détaillé
npm run test:e2e:report

# 2. Mise à jour objectifs
# 3. Analyse trends coverage
# 4. Planning nouveaux tests
```

### **🎯 Quarterly Goals** (Product Owner)
- Définir objectifs coverage
- Prioriser nouveaux workflows
- Valider ROI tests E2E
- Ajuster seuils qualité

---

## 🛠️ **Outils et Scripts**

### **Scripts Disponibles**
```bash
# Gestion inventaire
npm run test:e2e:status           # Status global
npm run test:e2e:report           # Rapport détaillé
npm run test:e2e:needs-attention  # Éléments urgents
npm run test:e2e:invalidate       # Invalider tests
npm run test:e2e:validate         # Valider tests

# Exécution tests
npm run test:e2e                  # Tests complets
npm run test:e2e:auth            # Tests authentification
npm run test:e2e:leaves          # Tests congés
npm run test:e2e:debug           # Mode debug
npm run test:e2e:ci              # Mode CI/CD
```

### **Fichiers Configuration**
- `tests/e2e/config/puppeteer.config.js` : Configuration Puppeteer
- `tests/e2e/utils/puppeteer-helpers.js` : Helpers réutilisables
- `jest.e2e.config.js` : Configuration Jest E2E

---

## 📚 **Ressources et Documentation**

- **📖 README Tests E2E** : `tests/e2e/README.md`
- **🎯 Cursor Rules** : `docs-consolidated/03_Guides_Developpement/cursor-rules-unified.md`
- **📝 Changelog** : `tests/e2e/test-changelog.md`
- **🔧 Helpers Documentation** : Inline dans `puppeteer-helpers.js`

---

## 🆘 **Support et Contact**

**Questions techniques** : Consulter documentation ou créer issue
**Problèmes urgents** : Notifier QA Lead
**Nouvelles demandes** : Ajouter dans backlog avec tag `e2e-tests`

---

**Version** : 1.0.0  
**Dernière MAJ** : 2025-01-25  
**Équipe** : Mathildanesth Development Team 