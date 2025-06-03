# 🗂️ RÈGLES D'ORGANISATION DES FICHIERS

## ⚠️ RÈGLES STRICTES - À RESPECTER ABSOLUMENT

### ❌ INTERDIT À LA RACINE DU PROJET

**NE JAMAIS créer ces types de fichiers à la racine :**

```
❌ rapport-*.md
❌ analysis-*.json  
❌ test-*.js
❌ debug-*.js
❌ create-*.js
❌ check-*.js
❌ *-coverage.*
❌ jest.config.*.js (multiples)
❌ next.config.*.js (variants)
❌ PLAN_*.md
❌ GUIDE_*.md
❌ TODO-*.md
❌ STRATEGIE_*.md
```

### ✅ ORGANISATION CORRECTE

| **Type de fichier** | **Emplacement correct** |
|---------------------|------------------------|
| Documentation | `/docs/` + sous-dossiers |
| Scripts temporaires | `/scripts/` puis SUPPRIMER |
| Rapports | `/docs/05_reports/` |
| Configs Jest | `/config/jest/` |
| Configs Next.js | `/config/nextjs/` |
| Tests | À côté du code source |

### 📁 STRUCTURE AUTORISÉE À LA RACINE

**Seuls ces fichiers peuvent rester à la racine :**

```
✅ CLAUDE.md          (instructions Claude)
✅ README.md          (documentation projet)  
✅ package.json       (dépendances)
✅ tsconfig.json      (config TypeScript principal)
✅ next.config.js     (config Next.js principal)
✅ tailwind.config.js (config Tailwind)
✅ jest.config.js     (config Jest principal)
✅ cypress.config.js  (config Cypress)
✅ .eslintrc.json     (config ESLint)
✅ .gitignore         (config Git)
```

## 🧹 RÈGLES DE NETTOYAGE AUTOMATIQUE

### Après création de fichiers temporaires :
1. **Scripts** → Déplacer vers `/scripts/` OU supprimer
2. **Rapports** → Déplacer vers `/docs/05_reports/` OU supprimer  
3. **Documentation** → Déplacer vers `/docs/` approprié
4. **Configs** → Déplacer vers `/config/` approprié

### Commandes de nettoyage rapide :
```bash
# Vérifier les fichiers en vrac
ls -la | grep -E "^-.*\.(md|js|json)$" | grep -v -E "(package|tsconfig|next\.config|README|CLAUDE\.md|tailwind|cypress|jest\.config\.js$)"

# Déplacer la documentation
mv *GUIDE*.md *PLAN*.md *RAPPORT*.md docs/05_reports/

# Nettoyer les scripts temporaires  
rm -f test-*.js debug-*.js create-*.js check-*.js
```

## 🎯 POURQUOI CES RÈGLES ?

1. **Lisibilité** : Racine propre = projet professionnel
2. **Maintenance** : Plus facile de trouver les fichiers
3. **Collaboration** : Structure claire pour l'équipe
4. **Automatisation** : Scripts peuvent compter sur structure stable

## ⚡ RESPECT OBLIGATOIRE

**Ces règles sont CRITIQUES et doivent être respectées par :**
- ✅ Tous les développeurs
- ✅ Tous les scripts automatiques  
- ✅ Tous les workers Claude
- ✅ Tous les outils de génération

**En cas de non-respect : nettoyage automatique immédiat.**

---

*Règles mises à jour le 31/05/2025 après le grand nettoyage (111 → 16 fichiers)*