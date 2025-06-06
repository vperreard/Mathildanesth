# Migration des Scripts NPM - Guide

## Vue d'ensemble

Le package.json contenait **179 scripts NPM**, ce qui rendait la maintenance et l'utilisation très difficiles. Cette refactorisation réduit le nombre à **58 scripts** bien organisés et documentés.

## Changements Principaux

### 1. Structure Simplifiée

**Avant :**
- Scripts dispersés sans logique claire
- Nombreux doublons (cypress/cypress:open, health:check/health-check)
- Préfixes incohérents

**Après :**
- Organisation par catégories avec préfixes cohérents
- Suppression des doublons
- Hiérarchie claire : `category:action`

### 2. Catégories de Scripts

```
dev:*      → Développement
test:*     → Tests unitaires
e2e:*      → Tests end-to-end
db:*       → Base de données
perf:*     → Performance
ci:*       → Intégration continue
seed:*     → Seeds spécifiques
```

### 3. Scripts Supprimés

#### Claude Workers (Temporairement)
- `claude:workers`
- `claude:analyze`
- `claude:autonomous`
- `claude:autonomous:multi`
- `claude:cycle`

**Raison :** Désactivés jusqu'au 10/01/2025 selon CLAUDE.md

#### Tests Expérimentaux
- `test:autonomous:*`
- `test:manual:*`
- `test:bulletproof:*`
- `test:recovery:*`

**Raison :** Approches expérimentales remplacées par des solutions stables

#### Puppeteer
- `test:e2e:puppeteer:*`

**Raison :** Consolidation sur Cypress uniquement

#### Scripts Obsolètes
- Multiples variantes de monitoring
- Scripts de migration temporaires
- Scripts de debug spécifiques

### 4. Scripts Consolidés

| Anciens Scripts | Nouveau Script | Description |
|----------------|----------------|-------------|
| `cypress`, `cypress:open` | `e2e` | Ouvrir Cypress |
| `cypress:run`, `cypress:run:headless` | `e2e:run` | Lancer les tests |
| `prisma:migrate`, `db:migrate` | `db:migrate` | Migrations DB |
| `test:leaves`, `test:auth` | `test:critical` | Tests critiques |
| `performance:*`, `monitor:*` | `perf:*` | Performance unifiée |

### 5. Nouveaux Scripts Utiles

- **`npm run setup`** - Installation complète pour nouveaux développeurs
- **`npm run validate`** - Validation complète avant commit
- **`npm run ci:full`** - Pipeline CI complet
- **`npm run start:prod`** - Build + Start production

## Guide de Migration

### Pour les Développeurs

1. **Scripts quotidiens inchangés :**
   - `npm run dev` ✅
   - `npm run build` ✅
   - `npm test` ✅
   - `npm run lint` ✅

2. **Scripts renommés fréquents :**
   ```bash
   # Ancien → Nouveau
   npm run cypress:open → npm run e2e
   npm run test:leaves → npm run test:critical
   npm run prisma:migrate → npm run db:migrate
   ```

3. **Nouveaux workflows recommandés :**
   ```bash
   # Avant un commit
   npm run validate
   
   # Tests en développement
   npm run test:watch
   
   # Debug
   npm run dev:debug
   npm run test:debug
   ```

### Pour la CI/CD

**Avant :**
```yaml
- npm run lint
- npm run type-check
- npm run test:ci
- npm run test:e2e:ci
```

**Après :**
```yaml
- npm run ci:full  # Tout en un !
```

### Pour les Scripts Personnalisés

Si vous aviez des scripts personnalisés qui dépendaient des anciens noms :

1. Vérifiez le mapping dans `NPM_SCRIPTS_ANALYSIS.md`
2. Mettez à jour vos scripts avec les nouveaux noms
3. Utilisez les scripts composites quand possible

## Application de la Migration

### Automatique
```bash
node scripts/migrate-npm-scripts.js
```

### Manuelle
1. Sauvegarder : `cp package.json package.json.backup`
2. Copier les scripts de `package-optimized.json`
3. Tester : `npm run validate`

### Restauration
```bash
mv package.json.backup package.json
```

## FAQ

**Q: Où sont passés les scripts Claude ?**
R: Temporairement désactivés. Réactivation prévue le 10/01/2025.

**Q: Pourquoi supprimer Puppeteer ?**
R: Cypress couvre tous nos besoins E2E. Maintenir deux systèmes était redondant.

**Q: Les scripts bulletproof ?**
R: L'approche "bulletproof" est intégrée dans les scripts de test standards maintenant.

**Q: Comment débugger ?**
R: Utilisez les variants `:debug` → `dev:debug`, `test:debug`, `e2e:debug`

## Bénéfices

1. **Clarté** : Structure logique et prévisible
2. **Performance** : Moins de scripts = recherche plus rapide
3. **Maintenance** : Plus facile à maintenir et documenter
4. **Onboarding** : Nouveaux développeurs comprennent rapidement
5. **CI/CD** : Scripts optimisés pour l'automatisation

## Support

- Documentation complète : `docs/NPM_SCRIPTS.md`
- Analyse détaillée : `docs/NPM_SCRIPTS_ANALYSIS.md`
- Questions : Créer une issue sur GitHub