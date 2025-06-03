# 🚀 RÉFÉRENCE RAPIDE CLAUDE WORKERS

## Commandes Essentielles

```bash
# Générer les missions autonomes
npm run claude:workers

# Tests bulletproof
npm run test:fast              # 15-20 secondes
npm run test:bulletproof       # Validation 30s
npm run test:validate          # Monitoring continu

# Surveillance par module
npm test -- --testPathPattern="auth"
npm test -- --testPathPattern="leaves"
npm test -- --testPathPattern="services"
```

## Workflow en 5 Étapes

### 1. Analyser et Générer
```bash
npm run claude:workers
# → Crée claude-workers-prompts/ avec missions spécialisées
```

### 2. Déployer Workers
```bash
# Option A: Multi-instances Claude Code
# - Ouvrir 3-4 onglets claude.ai/code
# - Copier 1 prompt différent par onglet
# - Démarrer en parallèle

# Option B: Mode séquentiel  
# - 1 seule instance Claude Code
# - Traiter workers un par un (ordre priorité)
```

### 3. Surveiller Progression
```bash
# Vérification globale
npm run test:bulletproof

# Vérification par worker
npm test -- --testPathPattern="MODULE"
```

### 4. Validation Finale
```bash
# Tous les workers terminés ?
npm run test:validate
# ✅ SUCCESS = Mission accomplie!
```

### 5. Célébrer! 🎉
```bash
# Tests réparés en 45-60 min au lieu de 3-4h
# Infrastructure bulletproof garantie
# 90% de temps gagné!
```

## Types de Workers

| Worker | Focus | Priorité | Temps |
|--------|--------|----------|-------|
| **worker-auth** | Auth & Sécurité | 🚨 CRITIQUE | 15-20 min |
| **worker-leaves** | Module Congés | 🔥 HAUTE | 20-25 min |
| **worker-services** | Services Core | 🔥 HAUTE | 15-20 min |
| **worker-components** | UI Components | ⚡ MOYENNE | 10-15 min |
| **worker-hooks** | Hooks Custom | ⚡ MOYENNE | 10-15 min |
| **worker-integration** | Tests E2E | 📝 BASSE | 25-30 min |

## Résolution de Problèmes

### Worker Bloqué?
```bash
# Vérifier le module spécifique
npm test -- --testPathPattern="MODULE_DU_WORKER"

# Relancer le worker avec plus de contexte
# Ajouter: "Problème spécifique détecté: [ERREUR]"
```

### Tests Toujours Lents?
```bash
# Vérifier la config bulletproof
npm run test:fast
# Si > 30s, optimiser jest.config.bulletproof.js
```

### Worker Confus?
```bash
# Régénérer les prompts
npm run claude:workers
# Copier le nouveau prompt, plus détaillé
```

## Liens Documentation

- **Guide Complet**: CLAUDE_WORKERS_GUIDE.md
- **Configuration**: CLAUDE.md (section Claude Workers)
- **Rapport Technique**: CONSOLIDATION_TESTS_RAPPORT.md
- **Roadmap**: docs/04_roadmap/ROADMAP.md

## Dépannage Express

| Problème | Solution |
|----------|----------|
| "Prompts pas générés" | Vérifier: `npm run claude:workers` dans le bon dossier |
| "Worker ne comprend pas" | Copier TOUT le prompt, incluant les instructions |
| "Tests toujours cassés" | 1 worker à la fois, valider avant suivant |
| "Trop lent" | Utiliser `npm run test:fast` pendant développement |

---

**💡 TIP**: Sauvegarde cette page dans tes favoris pour un accès rapide!