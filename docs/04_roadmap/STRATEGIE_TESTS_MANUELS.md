# Stratégie de Stabilisation par Tests Manuels Automatisés

## 📅 Date : 02/06/2025

## 🎯 Objectif Principal
Stabiliser l'application réelle avant de corriger les tests unitaires cassés.

## 📊 État Actuel
- **Tests existants** : 272 fichiers
- **Couverture** : ~5-7%
- **Taux de réussite** : ~25-30%
- **@ts-ignore** : 14 occurrences
- **console.log** : 968 occurrences
- **Problème principal** : Les tests testent potentiellement du code obsolète

## 🚀 Nouvelle Approche : Tests Manuels Automatisés

### Phase 1 : Stabilisation Immédiate (3-5 jours)

#### 1. Navigation Automatique avec Puppeteer
- Script non-invasif qui navigue dans l'app
- Capture automatique des erreurs console
- Identification des vrais bugs runtime
- **AUCUNE modification du code source**

#### 2. Désactivation Temporaire des Tests Non-Critiques
```javascript
// jest.config.js - Configuration temporaire
testPathIgnorePatterns: [
  '/node_modules/',
  // Désactiver temporairement
  'src/components/__tests__/',  // UI moins critique
  'src/utils/__tests__/',       // Utils moins critiques
  'src/hooks/__tests__/',       // Hooks (sauf auth)
  // Garder actifs :
  // - src/lib/auth
  // - src/modules/leaves (critiques seulement)
  // - src/app/api (routes principales)
]
```

#### 3. Parcours Critiques à Tester
1. **Connexion/Déconnexion**
2. **Création demande de congés**
3. **Consultation planning**
4. **Navigation principale**
5. **Gestion utilisateurs (admin)**

### Phase 2 : Reconstruction Progressive (Semaine 2-3)

#### 1. Correction des Vrais Bugs
- Basée sur les erreurs trouvées par navigation automatique
- Priorisation par impact utilisateur
- Correction sans toucher aux tests existants

#### 2. Tests E2E Prioritaires
- 10 scénarios critiques maximum
- Cypress ou Puppeteer
- Focus sur parcours utilisateur complets

#### 3. Réactivation Progressive des Tests
- Module par module
- Seulement après stabilisation
- Réécriture si nécessaire

## 📋 Plan d'Action Immédiat

### Jour 1-2
- [ ] Créer script navigation automatique
- [ ] Désactiver tests non-critiques
- [ ] Lancer première analyse bugs

### Jour 3-4
- [ ] Corriger 5 bugs les plus bloquants
- [ ] Documenter parcours fonctionnels
- [ ] Préparer tests E2E critiques

### Jour 5
- [ ] Bilan stabilisation
- [ ] Plan pour semaine 2
- [ ] Décision sur tests à réactiver

## ⚠️ Règles Importantes

1. **Ne PAS modifier le code pour faire passer les tests**
2. **Ne PAS corriger les tests unitaires pour l'instant**
3. **Prioriser la stabilité de l'app réelle**
4. **Documenter tous les bugs trouvés**
5. **Script Puppeteer en READ-ONLY (aucune action destructrice)**

## 🎯 Critères de Succès Phase 1

- [ ] 0 erreurs console sur parcours critiques
- [ ] 5 parcours utilisateur fonctionnels
- [ ] Documentation des bugs réels
- [ ] Plan clair pour phase 2

## 💡 Avantages de cette Approche

1. **Focus sur les vrais problèmes** (pas les tests cassés)
2. **Résultats visibles rapidement**
3. **Pas de régression** (on ne touche pas au code pour les tests)
4. **Base solide** pour reconstruire les tests ensuite
5. **Automatisation** sans les inconvénients des tests unitaires

## 🔄 Prochaines Étapes

1. Exécuter `scripts/automated-manual-tester.js`
2. Analyser rapport d'erreurs
3. Prioriser corrections
4. Itérer quotidiennement

---

*Cette stratégie privilégie la stabilité réelle sur la couverture de tests théorique.*