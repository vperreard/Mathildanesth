# Scripts et Outils de Refactoring

Ce document centralise tous les scripts, commandes et outils nécessaires pour exécuter le plan de refactoring technique de Mathildanesth.

## Scripts de Diagnostic et Suivi

### Script d'Audit Global
```bash
#!/bin/bash
# scripts/audit-global.sh

echo "🔍 AUDIT GLOBAL MATHILDANESTH"
echo "================================"

# Dette technique
echo "📊 DETTE TECHNIQUE:"
echo "- TODO/FIXME/HACK:"
grep -r "TODO\|FIXME\|HACK\|WORKAROUND" src --include="*.ts" --include="*.tsx" | wc -l

echo "- @ts-ignore:"
grep -r "@ts-ignore" src --include="*.ts" --include="*.tsx" | wc -l

echo "- Types 'any':"
grep -r ": any\|as any" src --include="*.ts" --include="*.tsx" | wc -l

# Architecture
echo ""
echo "🏗️ ARCHITECTURE:"
echo "- Fichiers Pages Router:"
find src/pages/api -name "*.ts" 2>/dev/null | wc -l

echo "- Fichiers App Router:"
find src/app/api -name "route.ts" 2>/dev/null | wc -l

# Tests
echo ""
echo "🧪 TESTS:"
echo "- Fichiers de tests:"
find src -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" | wc -l

echo "- Fichiers TypeScript total:"
find src -name "*.ts" -o -name "*.tsx" | wc -l

# Performance
echo ""
echo "⚡ PERFORMANCE:"
echo "- Bundle size actuel:"
du -sh node_modules/.next/static 2>/dev/null || echo "Non disponible (lancer npm run build)"

echo ""
echo "🎯 Objectifs du refactoring:"
echo "- Dette technique: < 10 occurrences"
echo "- Couverture tests: > 80%"
echo "- Performance: toutes pages < 3s"
echo "- Architecture: App Router uniquement"
```

### Script de Suivi Quotidien
```bash
#!/bin/bash
# scripts/daily-metrics.sh

DATE=$(date +"%Y-%m-%d")
METRICS_FILE="metrics/daily-$DATE.json"

echo "📈 Métriques du $DATE"

# Créer le dossier metrics s'il n'existe pas
mkdir -p metrics

# Générer les métriques en JSON
cat > $METRICS_FILE << EOF
{
  "date": "$DATE",
  "technicalDebt": {
    "todoCount": $(grep -r "TODO\|FIXME" src --include="*.ts" --include="*.tsx" | wc -l),
    "tsIgnoreCount": $(grep -r "@ts-ignore" src --include="*.ts" --include="*.tsx" | wc -l),
    "anyTypeCount": $(grep -r ": any\|as any" src --include="*.ts" --include="*.tsx" | wc -l)
  },
  "architecture": {
    "pagesRouterFiles": $(find src/pages/api -name "*.ts" 2>/dev/null | wc -l),
    "appRouterFiles": $(find src/app/api -name "route.ts" 2>/dev/null | wc -l)
  },
  "tests": {
    "testFiles": $(find src -name "*.test.ts" -o -name "*.test.tsx" | wc -l),
    "totalFiles": $(find src -name "*.ts" -o -name "*.tsx" | wc -l)
  }
}
EOF

echo "Métriques sauvegardées dans $METRICS_FILE"

# Afficher un résumé
echo ""
echo "📊 Résumé:"
echo "- Dette technique: $(grep -r "TODO\|FIXME" src --include="*.ts" --include="*.tsx" | wc -l) occurrences"
echo "- @ts-ignore: $(grep -r "@ts-ignore" src --include="*.ts" --include="*.tsx" | wc -l) occurrences"
echo "- Couverture tests: $(echo "scale=1; $(find src -name "*.test.ts" -o -name "*.test.tsx" | wc -l) * 100 / $(find src -name "*.ts" -o -name "*.tsx" | wc -l)" | bc)%"
```

## Scripts de Phase 1 - Stabilisation

### Audit des Routes en Conflit
```bash
#!/bin/bash
# scripts/phase1/audit-routes.sh

echo "🔍 AUDIT DES ROUTES API"
echo "======================="

# Créer les fichiers temporaires
PAGES_ROUTES="temp/pages-routes.txt"
APP_ROUTES="temp/app-routes.txt"
CONFLICTS="temp/route-conflicts.txt"

mkdir -p temp

# Lister toutes les routes Pages API
echo "📁 Routes Pages API:"
find src/pages/api -name "*.ts" -o -name "*.js" | sed 's|src/pages/api/||' | sed 's|\.ts$||' | sed 's|\.js$||' > $PAGES_ROUTES
cat $PAGES_ROUTES

echo ""
echo "📁 Routes App API:"
find src/app/api -name "route.ts" | sed 's|src/app/api/||' | sed 's|/route\.ts$||' > $APP_ROUTES
cat $APP_ROUTES

echo ""
echo "⚠️ Conflits potentiels:"
comm -12 <(sort $PAGES_ROUTES) <(sort $APP_ROUTES) > $CONFLICTS
if [ -s $CONFLICTS ]; then
  cat $CONFLICTS
  echo ""
  echo "🚨 $(wc -l < $CONFLICTS) conflit(s) détecté(s)!"
else
  echo "✅ Aucun conflit détecté"
fi

# Cleanup
rm -rf temp
```

### Script de Migration App Router
```bash
#!/bin/bash
# scripts/phase1/migrate-to-app-router.sh

echo "🔄 MIGRATION VERS APP ROUTER"
echo "============================="

# Vérification préalable
if [ ! -d "src/pages/api" ]; then
  echo "✅ Aucun fichier Pages API trouvé"
  exit 0
fi

echo "⚠️ Cette opération va supprimer src/pages/api/"
echo "Assurez-vous que toutes les routes sont migrées vers src/app/api/"
read -p "Continuer? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Backup
  echo "💾 Sauvegarde dans backup/pages-api-$(date +%Y%m%d-%H%M%S)"
  mkdir -p backup
  cp -r src/pages/api "backup/pages-api-$(date +%Y%m%d-%H%M%S)"
  
  # Suppression
  echo "🗑️ Suppression de src/pages/api/"
  rm -rf src/pages/api
  
  echo "✅ Migration terminée"
else
  echo "❌ Migration annulée"
fi
```

### Correction des @ts-ignore
```bash
#!/bin/bash
# scripts/phase1/fix-ts-ignore.sh

echo "🔧 CORRECTION DES @ts-ignore"
echo "============================="

# Trouver tous les @ts-ignore
TS_IGNORE_FILES=$(grep -r "@ts-ignore" src --include="*.ts" --include="*.tsx" -l)

if [ -z "$TS_IGNORE_FILES" ]; then
  echo "✅ Aucun @ts-ignore trouvé"
  exit 0
fi

echo "📋 Fichiers contenant @ts-ignore:"
echo "$TS_IGNORE_FILES"

echo ""
echo "🔍 Détails:"
grep -r "@ts-ignore" src --include="*.ts" --include="*.tsx" -n -A2 -B1

echo ""
echo "⚠️ Chaque @ts-ignore doit être traité manuellement"
echo "💡 Remplacez par des types appropriés ou refactorisez le code"
```

## Scripts de Phase 2 - Performance

### Audit des Performances
```bash
#!/bin/bash
# scripts/phase2/performance-audit.sh

echo "⚡ AUDIT DES PERFORMANCES"
echo "========================="

# Bundle analysis
echo "📦 Analyse du bundle:"
if [ -d ".next" ]; then
  echo "- Taille statique:"
  du -sh .next/static
  echo "- Fichiers principaux:"
  find .next/static -name "*.js" -exec du -sh {} \; | sort -hr | head -10
else
  echo "❌ Pas de build trouvé. Lancez 'npm run build' d'abord"
fi

# Lighthouse CI (si installé)
if command -v lhci &> /dev/null; then
  echo ""
  echo "🏮 Test Lighthouse:"
  lhci autorun --config=lighthouserc.json
else
  echo ""
  echo "💡 Installez lighthouse CI: npm install -g @lhci/cli"
fi

# Tests de performance avec autocannon (si installé)
if command -v autocannon &> /dev/null; then
  echo ""
  echo "🚀 Test de charge (10s):"
  autocannon -d 10 -c 10 http://localhost:3000
else
  echo ""
  echo "💡 Installez autocannon: npm install -g autocannon"
fi
```

### Script d'Optimisation Bundle
```bash
#!/bin/bash
# scripts/phase2/optimize-bundle.sh

echo "🎯 OPTIMISATION DU BUNDLE"
echo "=========================="

# Analyze bundle
echo "1️⃣ Analyse du bundle actuel..."
npm run build
npx @next/bundle-analyzer

echo ""
echo "2️⃣ Suggestions d'optimisation:"
echo "- Vérifiez les gros packages dans l'analyse"
echo "- Utilisez dynamic imports pour les composants lourds"
echo "- Configurez tree-shaking pour les librairies UI"

echo ""
echo "3️⃣ Configuration recommandée pour next.config.js:"
cat << 'EOF'
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      // Ajouter autres packages UI
    ]
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  }
}
EOF
```

## Scripts de Phase 3 - Architecture

### Refactoring des Modules
```bash
#!/bin/bash
# scripts/phase3/refactor-modules.sh

echo "🏗️ REFACTORING DE L'ARCHITECTURE MODULAIRE"
echo "==========================================="

# Analyser la structure actuelle
echo "📊 Structure actuelle des modules:"
ls -la src/modules/

echo ""
echo "📋 Plan de refactoring:"
echo "1. analytics + dashboard → reporting"
echo "2. profiles + settings → user-management"
echo "3. organization + unavailability → structure"

echo ""
echo "🔄 Étapes recommandées:"
echo "1. Créer les nouveaux modules"
echo "2. Migrer les fichiers un par un"
echo "3. Mettre à jour les imports"
echo "4. Supprimer les anciens modules"
echo "5. Tester la non-régression"

# Script helper pour migration
cat > scripts/phase3/migrate-module.sh << 'EOF'
#!/bin/bash
# Helper pour migrer un module
# Usage: ./migrate-module.sh old-module new-module

OLD_MODULE=$1
NEW_MODULE=$2

if [ -z "$OLD_MODULE" ] || [ -z "$NEW_MODULE" ]; then
  echo "Usage: $0 old-module new-module"
  exit 1
fi

echo "Migration $OLD_MODULE → $NEW_MODULE"

# Créer le nouveau module
mkdir -p src/modules/$NEW_MODULE

# Copier les fichiers
cp -r src/modules/$OLD_MODULE/* src/modules/$NEW_MODULE/

# TODO: Mettre à jour les imports (à faire manuellement)
echo "⚠️ N'oubliez pas de mettre à jour les imports!"
EOF

chmod +x scripts/phase3/migrate-module.sh
```

## Scripts de Phase 4 - Tests

### Setup des Tests
```bash
#!/bin/bash
# scripts/phase4/setup-tests.sh

echo "🧪 CONFIGURATION DES TESTS"
echo "=========================="

# Créer la structure de tests
mkdir -p src/tests/{unit,integration,e2e,factories,helpers,fixtures}

# Factory example
cat > src/tests/factories/userFactory.ts << 'EOF'
import { User, Role } from '@prisma/client';

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: Role.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});
EOF

# Test helper example
cat > src/tests/helpers/testUtils.ts << 'EOF'
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Wrapper avec providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
EOF

echo "✅ Structure de tests créée"
echo "📝 Prochaine étape: Écrire les tests pour chaque module"
```

### Script de Couverture de Tests
```bash
#!/bin/bash
# scripts/phase4/test-coverage.sh

echo "📊 RAPPORT DE COUVERTURE DE TESTS"
echo "=================================="

# Tests unitaires avec couverture
echo "🧪 Tests unitaires:"
npm run test:coverage

# Tests d'intégration
echo ""
echo "🔗 Tests d'intégration:"
npm run test:integration

# Tests E2E
echo ""
echo "🎭 Tests E2E:"
npm run test:e2e

# Résumé
echo ""
echo "📋 Résumé de couverture:"
echo "Objectif: 80% de couverture globale"
echo "Consultez coverage/lcov-report/index.html pour les détails"
```

## Configuration des Outils

### ESLint Configuration Renforcée
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/ban-ts-comment': 'error',
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

### Jest Configuration Optimisée
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**/*',
    '!src/**/*.stories.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Husky Pre-commit Hooks
```bash
#!/bin/bash
# .husky/pre-commit

echo "🔍 Vérifications pre-commit..."

# Lint
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint errors"
  exit 1
fi

# Type check
npm run type-check
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors"
  exit 1
fi

# Tests
npm run test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi

echo "✅ Pre-commit checks passed"
```

## Utilisation des Scripts

### Installation des Outils
```bash
# Rendre tous les scripts exécutables
chmod +x scripts/**/*.sh

# Installer les dépendances de développement
npm install --save-dev \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  jest-coverage-badges \
  lighthouse \
  autocannon
```

### Exécution Quotidienne
```bash
# Chaque matin
./scripts/daily-metrics.sh

# Avant chaque commit
./scripts/audit-global.sh

# Avant chaque release
./scripts/phase4/test-coverage.sh
```

### Intégration CI/CD
```yaml
# .github/workflows/refactoring.yml
name: Refactoring Progress
on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 9 * * *' # Chaque jour à 9h

jobs:
  metrics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run daily metrics
        run: ./scripts/daily-metrics.sh
      - name: Upload metrics
        uses: actions/upload-artifact@v3
        with:
          name: daily-metrics
          path: metrics/
```

Ce système de scripts et d'outils vous permet de suivre précisément l'avancement du refactoring et d'automatiser les tâches répétitives. Chaque script est conçu pour être exécuté indépendamment et fournir des résultats mesurables.