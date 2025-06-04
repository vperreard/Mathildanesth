# 🚨 PRIORITÉ ABSOLUE : STABILISATION PAR TESTS MANUELS

**MISE À JOUR CRITIQUE : 02/06/2025**

## 🔄 NOUVELLE STRATÉGIE : Tests Manuels Automatisés FIRST

### Pourquoi ce changement radical ?
- **272 fichiers de tests** avec ~75% d'échec
- Tests qui testent **potentiellement du code obsolète**
- **Risque élevé** de casser du code fonctionnel en "corrigeant" les tests
- Besoin de stabiliser **l'app RÉELLE** avant les tests unitaires

## 📋 Plan d'Action Immédiat (02-07/06/2025)

### Phase 1 : Navigation Automatique (Jours 1-2)
```bash
npm run test:manual          # Mode headless
npm run test:manual:visible  # Mode visible pour debug
```
- Script Puppeteer qui navigue dans l'app
- Capture TOUTES les erreurs console
- Génère rapport dans `results/manual-test-report.json`
- **AUCUNE modification du code source**

### Phase 2 : Tests Critiques Seulement (Jours 2-3)
```bash
npm run test:stable  # Seulement auth, leaves, API critiques
```
- Config Jest allégée : `config/jest/jest.config.stabilization.js`
- **80% des tests désactivés temporairement**
- Focus sur les vrais bugs, pas les tests cassés

### Phase 3 : Correction des Vrais Bugs (Jours 3-5)
- Basée sur erreurs trouvées par navigation automatique
- PAS de correction de tests unitaires
- Documentation dans `STRATEGIE_TESTS_MANUELS.md`

## ⛔ INTERDICTIONS ABSOLUES

1. **NE PAS corriger les tests unitaires cassés**
2. **NE PAS modifier le code pour faire passer des tests**
3. **NE PAS ajouter de nouvelles features**
4. **NE PAS faire de refactoring**

## ✅ Critères de Succès Phase 1

- [ ] **0 erreurs console** sur les 5 parcours critiques
- [ ] Rapport d'erreurs complet généré
- [ ] 5 bugs bloquants identifiés et documentés
- [ ] Plan clair pour corrections

## 🚀 Commandes Utiles

```bash
# Tests manuels automatisés
npm run test:manual          # Rapide, headless
npm run test:manual:visible  # Debug visuel

# Tests unitaires allégés
npm run test:stable          # Seulement critiques
npm run test:stable:watch    # Mode watch
npm run test:stable:coverage # Coverage réduite

# Anciens tests (ÉVITER)
npm test                     # 272 fichiers, 75% échec
```

## 📊 Métriques Actuelles vs Objectif

| Métrique | Actuel | Objectif Semaine |
|----------|--------|------------------|
| Erreurs console prod | ??? | 0 |
| Tests unitaires passants | 25-30% | 80% (critiques) |
| Bugs bloquants | ??? | 0 |
| Parcours fonctionnels | ??? | 5/5 |

---

**NOUVEAU MANTRA**: Stabiliser l'app réelle > Faire passer des tests cassés