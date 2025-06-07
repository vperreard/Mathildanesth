# Stratégie Anti-Timeout pour Claude Code dans Docker

## 🚨 PROBLÈME IDENTIFIÉ
Claude Code se ferme automatiquement après ~2 minutes même avec keep-alive !

## ✅ SOLUTION : Commandes Ultra-Courtes (< 10 secondes)

### Principe de base
- **JAMAIS** de commandes longues (npm run dev, curl, tsc complet)
- **TOUJOURS** diviser en micro-tâches
- **FEEDBACK** immédiat toutes les 5-8 secondes

### Commands OK (< 10s)
```bash
echo "Test OK"                    # 1s
ls -la | head -5                  # 2s  
git status --porcelain            # 3s
npm run lint 2>&1 | head -10     # 8s
cat src/file.tsx | head -20       # 2s
```

### Commands INTERDITS (> 10s)
```bash
npm run dev                       # ∞ timeout
curl http://localhost:3000        # 30s+ timeout
npx tsc --noEmit                  # 60s+ timeout
npm test                          # 45s+ timeout
```

### Stratégie Page Planning (méthode rapide)
```bash
# 1. Vérifier fichier existe (2s)
ls -la src/app/planning/hebdomadaire/page-fixed.tsx

# 2. Backup rapide (3s)
cp src/app/planning/hebdomadaire/page.tsx src/app/planning/hebdomadaire/page-broken.tsx

# 3. Remplacer (2s)
cp src/app/planning/hebdomadaire/page-fixed.tsx src/app/planning/hebdomadaire/page.tsx

# 4. Vérifier (3s)
head -10 src/app/planning/hebdomadaire/page.tsx
```

## Scripts Anti-Timeout Créés
1. **claude-quick-fix.sh** : Succession rapide de micro-commandes
2. **claude-auto-keep-alive.sh** : Heartbeat avec limite temps

## 🔥 RÈGLE D'OR
**Aucune commande > 10 secondes**
**Feedback toutes les 5-8 secondes maximum**