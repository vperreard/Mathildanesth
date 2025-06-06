# Analyse des Scripts NPM - Package.json

Date: 06/06/2025
Total de scripts: 179

## Analyse par Catégories

### 1. Scripts de base (7)
- `dev` - next dev
- `dev:open` - ./scripts/dev-force-3000.sh
- `dev:clean` - ./scripts/clean-browser-and-start.sh
- `build` - next build
- `start` - next start
- `lint` - next lint
- `lint-staged` - lint-staged

### 2. Database/Prisma (11)
- `db:seed` - node prisma/seed.cjs
- `db:generate` - prisma generate
- `db:push` - prisma db push
- `db:studio` - prisma studio
- `prisma:seed` - prisma db seed
- `prisma:migrate` - prisma migrate dev
- `prisma:migrate:deploy` - prisma migrate deploy
- `prisma:migrate:reset` - prisma migrate reset
- `prisma:migrate:simulation-cache` - prisma migrate dev --name add_simulation_intermediate_results
- `seed` - ts-node -P ./tsconfig.seed.json ./prisma/seed.ts
- `seed:leaves-test` - tsx ./prisma/seed-leaves-test.ts

### 3. Tests Jest/Unit (35)
- `test` - jest
- `test:watch` - jest --watch
- `test:coverage` - jest --coverage
- `test:ci` - jest --ci
- `test:validate` - node scripts/validate-test-performance.js
- `test:bulletproof` - npm run test:validate
- `test:fast` - jest --config jest.config.bulletproof.js
- `test:recovery` - jest --config jest.config.recovery.js --passWithNoTests
- `test:recovery:watch` - jest --config jest.config.recovery.js --watch --passWithNoTests
- `test:fix-massive` - tsx scripts/fix-tests-massive.ts
- `test:check-syntax` - tsc --noEmit --project tsconfig.jest.json
- `test:integration` - jest --testPathPattern=integration
- `test:unit` - jest --testPathPattern=__tests__
- `test:all` - jest --coverage
- `test:performance` - jest --testNamePattern=Performance
- `test:performance:watch` - nodemon --watch src --ext ts --exec 'npm run test:performance'
- `test:services` - jest src/services/__tests__/*.test.ts
- `test:bloc` - jest src/hooks/__tests__/useOperatingRoom* src/services/__tests__/blocPlanning*
- `test:bloc:coverage` - jest --coverage src/hooks/__tests__/useOperatingRoom* src/services/__tests__/blocPlanning*
- `test:hooks` - jest src/hooks/__tests__/*.test.tsx
- `test:critical` - jest src/modules/conges src/lib/auth --coverage
- `test:performance:new` - jest src/tests/performance/
- `test:load` - jest src/tests/performance/api-load-testing.test.ts
- `test:leaves` - jest src/modules/conges --coverage
- `test:auth` - jest src/lib/auth --coverage
- `test:stable` - jest --config config/jest/jest.config.stabilization.js
- `test:stable:watch` - jest --config config/jest/jest.config.stabilization.js --watch
- `test:stable:coverage` - jest --config config/jest/jest.config.stabilization.js --coverage
- `test:security` - npm audit && npm run test:critical
- `test:security:comprehensive` - jest --config jest.security.config.js
- `test:security:auth` - jest --config jest.security.config.js --testPathPattern=auth
- `test:security:injection` - jest --config jest.security.config.js --testPathPattern=injection
- `test:security:xss` - jest --config jest.security.config.js --testPathPattern=xss
- `test:security:integration` - jest --config jest.security.config.js --testPathPattern=security-integration
- `test:security:full` - ./scripts/run-security-tests.sh

### 4. Tests E2E/Cypress (31)
- `cypress` - cypress open
- `cypress:open` - cypress open (DOUBLON)
- `cypress:run` - cypress run --browser chrome
- `cypress:run:headless` - cypress run --browser chrome --headless
- `cypress:e2e` - cypress run --e2e --browser chrome
- `cypress:e2e:headless` - cypress run --e2e --browser chrome --headless
- `cypress:component` - cypress run --component --browser chrome
- `cypress:component:headless` - cypress run --component --browser chrome --headless
- `cypress:e2e:open` - cypress open --e2e
- `cypress:component:open` - cypress open --component
- `cypress:reset-db` - node -e "require('dotenv').config(); require('@prisma/client').PrismaClient.$executeRawUnsafe('DELETE FROM \"User\" CASCADE; DELETE FROM \"Leaves\" CASCADE;')"
- `cypress:setup-test-db` - export DATABASE_URL='postgresql://mathildanesth_user:mathildanesth_password@localhost:5433/mathildanesth_test' && NODE_ENV=test prisma migrate deploy
- `cypress:a11y` - cypress run --e2e --spec "cypress/e2e/accessibility/**/*.spec.ts" --browser chrome --headless
- `cypress:responsive` - cypress run --e2e --spec "cypress/e2e/compatibility/**/*.spec.ts" --browser chrome --headless
- `cypress:perf` - cypress run --e2e --spec "cypress/e2e/performance/**/*.spec.ts" --browser chrome --headless
- `cypress:reports` - npx mochawesome-merge cypress/reports/mocha/*.json > cypress/reports/mocha/full-report.json && npx marge cypress/reports/mocha/full-report.json -f report -o cypress/reports/mocha
- `cypress:run:headed` - cypress run --headed
- `cypress:test:auth` - cypress run --spec 'cypress/e2e/auth/**/*'
- `cypress:test:leaves` - cypress run --spec 'cypress/e2e/conges/**/*'
- `cypress:test:bloc` - cypress run --spec 'cypress/e2e/bloc-operatoire/**/*'
- `cypress:test:rules` - cypress run --spec 'cypress/e2e/rules/**/*'
- `cypress:test:performance` - cypress run --spec 'cypress/e2e/performance/**/*'

### 5. Tests E2E/Puppeteer (19)
- `test:e2e` - jest --config=jest.e2e.config.js
- `test:e2e:ci` - jest --config=jest.e2e.config.js --runInBand --forceExit
- `test:e2e:puppeteer` - start-server-and-test dev http://localhost:3000 'HEADLESS=true jest --config jest.e2e.config.js --runInBand'
- `test:e2e:puppeteer:visual` - start-server-and-test dev http://localhost:3000 'HEADLESS=false jest --config jest.e2e.config.js --runInBand'
- `test:e2e:workflows` - jest --config jest.e2e.config.js --testPathPattern=workflows
- `test:e2e:performance` - jest --config jest.e2e.config.js --testPathPattern=performance
- `test:e2e:accessibility` - jest --config jest.e2e.config.js --testPathPattern=accessibility
- `test:e2e:regression` - jest --config jest.e2e.config.js --testPathPattern=regression
- `test:e2e:puppeteer:all` - npm run test:e2e:puppeteer
- `test:e2e:all` - cross-env DATABASE_URL='postgresql://mathildanesth_user:mathildanesth_password@localhost:5433/mathildanesth_test' start-server-and-test "sleep 5 && npm run dev" http://localhost:3000 "cypress run --e2e --browser chrome --headless"
- `test:e2e:all:visual` - cross-env DATABASE_URL='postgresql://mathildanesth_user:mathildanesth_password@localhost:5433/mathildanesth_test' start-server-and-test "sleep 5 && npm run dev" http://localhost:3000 "cypress run --e2e --browser chrome"
- `test:e2e:a11y` - start-server-and-test dev http://localhost:3000 cypress:a11y
- `test:e2e:responsive` - start-server-and-test dev http://localhost:3000 cypress:responsive
- `test:e2e:perf` - start-server-and-test dev http://localhost:3000 cypress:perf
- `test:e2e:auth` - jest --config=jest.e2e.config.js --testNamePattern='auth'
- `test:e2e:leaves` - jest --config=jest.e2e.config.js --testNamePattern='leaves'
- `test:e2e:planning` - jest --config=jest.e2e.config.js --testNamePattern='planning'
- `test:e2e:sites` - jest --config=jest.e2e.puppeteer.config.js tests/e2e/sites-rooms-management.test.ts
- `test:e2e:debug` - jest --config=jest.e2e.config.js --testNamePattern='debug' --runInBand

### 6. Tests Autonomous/Manual (12)
- `test:autonomous` - jest tests/e2e/autonomous-navigation.e2e.test.js --config jest.e2e.config.js --runInBand
- `test:autonomous:daemon` - node scripts/autonomous-testing-daemon.js
- `test:autonomous:infinite` - MAX_CYCLES=Infinity node scripts/autonomous-testing-daemon.js
- `test:autonomous:cycles` - MAX_CYCLES=5 CYCLE_DELAY=10000 node scripts/autonomous-testing-daemon.js
- `test:autonomous:never-stop` - node scripts/run-autonomous-tests.js
- `test:autonomous:fix-bugs` - node scripts/autonomous-bug-fixer.js
- `test:manual` - node scripts/automated-manual-tester.js
- `test:manual:visible` - HEADLESS=false node scripts/automated-manual-tester.js
- `test:manual:fast` - SLOW_MO=0 node scripts/automated-manual-tester.js

### 7. Claude Workers (5)
- `claude:workers` - node scripts/claude-test-workers.js
- `claude:analyze` - npm run claude:workers (DOUBLON)
- `claude:autonomous` - node scripts/claude-workers-autonomous.js
- `claude:autonomous:multi` - concurrently "npm run claude:autonomous claude-1" "npm run claude:autonomous claude-2" "npm run claude:autonomous claude-3"
- `claude:cycle` - node scripts/claude-workers-autonomous.js claude-1

### 8. Performance/Monitoring (16)
- `performance:analyze` - ANALYZE=true npm run build
- `performance:webpack` - WEBPACK_ANALYZE=true npm run build
- `performance:budget` - node scripts/performance-budget-monitor.js
- `performance:budget:watch` - nodemon --delay 3 --watch .next --watch src --ext js,ts,tsx --exec 'npm run performance:budget'
- `performance:budget:ci` - npm run build && npm run performance:budget
- `performance:budget:alert` - npm run performance:budget || echo 'Performance budget violations detected!'
- `performance:baseline` - npm run performance:audit && npm run test:performance
- `performance:audit` - node scripts/performance-audit-simple.js
- `monitor:start` - node scripts/performance-monitoring-daemon.js start
- `monitor:stop` - node scripts/performance-monitoring-daemon.js stop
- `monitor:status` - node scripts/performance-monitoring-daemon.js status
- `monitoring:start` - npm run dev & npm run performance:baseline
- `monitoring:report` - node scripts/monitoring-daemon.js report
- `monitoring:test` - node scripts/monitoring-daemon.js test

### 9. Quality/Audit (8)
- `quality:audit` - node scripts/quality-audit.js
- `quality:full` - npm run test:critical && npm run performance:audit
- `audit:security` - npm audit
- `audit:performance` - npm run performance:audit (DOUBLON)
- `audit:global` - ./scripts/audit-global.sh
- `audit:debt` - ./scripts/audit-technical-debt.sh
- `health:check` - curl -f http://localhost:3000/api/health || exit 1
- `health-check` - ./scripts/health-check.sh (DOUBLON)

### 10. Export/Import (6)
- `export:all` - node scripts/export-db-state.js
- `export:selective` - node scripts/export-specific-data.js
- `export:csv` - node scripts/export-to-csv.js
- `export:to-seed` - node scripts/create-seed-from-export.js

### 11. Seeds spécifiques (4)
- `seed:rules` - tsx src/scripts/seedRules.ts
- `seed:surgeons` - tsx src/modules/seeds/seedSurgeons.ts
- `seed:specialties` - tsx src/modules/seeds/seedSpecialties.ts
- `seed:rooms` - tsx src/modules/seeds/seedOperatingRooms.ts

### 12. Code Quality (7)
- `type-check` - tsc --noEmit
- `lint:fix` - next lint --fix
- `format` - prettier --write "**/*.{ts,tsx,md}"
- `validate` - npm run lint && npm run type-check && npm run test
- `verify` - npm run lint && npm test && npm run build
- `verify:quick` - npm run test:fast && npm run lint
- `verify:pre-commit` - npm run lint && npm test

### 13. Étape/Reporting (5)
- `etape` - ./scripts/etape
- `etape:quick` - ./scripts/etape --quick
- `etape:simple` - ./scripts/etape-simple
- `etape:roadmap` - ./scripts/etape --roadmap

### 14. Outils spécifiques (7)
- `optimize-images` - node src/utils/optimizeImages.js
- `check:surgeons` - npx tsx scripts/check-duplicate-surgeons.ts
- `cleanup:surgeons` - npx tsx scripts/check-duplicate-surgeons.ts --cleanup
- `cleanup:surgeons:execute` - npx tsx scripts/check-duplicate-surgeons.ts --cleanup --execute
- `migrate:trame-modeles` - node package-scripts/migrate-trame-modeles.js
- `optimize:cicd` - ./scripts/optimize-ci-cd.sh

### 15. Bulletproof (5)
- `bulletproof:tests` - ./scripts/run-bulletproof-tests.sh
- `bulletproof:e2e` - TEST_MODE=e2e ./scripts/run-bulletproof-tests.sh
- `bulletproof:performance` - TEST_MODE=performance ./scripts/run-bulletproof-tests.sh
- `bulletproof:quality` - TEST_MODE=quality ./scripts/run-bulletproof-tests.sh
- `bulletproof:unit` - TEST_MODE=unit ./scripts/run-bulletproof-tests.sh

### 16. E2E Status/Reporting (6)
- `test:e2e:status` - node tests/e2e/scripts/inventory-manager.js status
- `test:e2e:report` - node tests/e2e/scripts/inventory-manager.js report
- `test:e2e:needs-attention` - node tests/e2e/scripts/inventory-manager.js needs-attention
- `test:e2e:invalidate` - node tests/e2e/scripts/inventory-manager.js invalidate
- `test:e2e:validate` - node tests/e2e/scripts/inventory-manager.js validate

### 17. Autres (6)
- `analyze` - ANALYZE=true next build
- `clean` - rm -rf node_modules package-lock.json && npm install
- `prepare` - husky install
- `storybook` - storybook dev -p 6006
- `test:integration:api` - ./scripts/run-integration-tests.sh
- `test:all:comprehensive` - ./scripts/run-all-tests.sh

## Doublons identifiés (24 scripts redondants)

1. **Cypress Open**
   - `cypress` → `cypress:open` (identiques)

2. **Claude Analyze**
   - `claude:analyze` → `claude:workers` (identiques)

3. **Performance Audit**
   - `audit:performance` → `performance:audit` (identiques)

4. **Health Check**
   - `health:check` → `health-check` (similaires)

5. **Test Bulletproof**
   - `test:bulletproof` → `test:validate` (identiques)

6. **Tests E2E multiples**
   - `test:e2e:puppeteer:all` → `test:e2e:puppeteer` (identiques)
   - Beaucoup de scripts e2e avec des variations mineures

7. **Database/Prisma**
   - `db:seed` vs `prisma:seed` vs `seed` (3 façons de seeder)

8. **Tests Performance**
   - `test:performance` vs `test:performance:new`
   - `cypress:test:performance` vs `test:e2e:performance`

9. **Tests Sécurité**
   - Plusieurs variantes pour les mêmes tests

10. **Monitoring**
    - `monitoring:*` vs `monitor:*` (2 systèmes différents)

## Scripts obsolètes potentiels

1. Scripts de recovery test (probablement temporaires)
2. Scripts claude:* (temporairement désactivés selon CLAUDE.md)
3. Scripts autonomous test (expérimentaux)
4. Scripts bulletproof (ancienne approche)
5. Scripts manual test (remplacés par E2E)

## Recommandations

### Structure proposée (~50-60 scripts)

```json
{
  // Essentiels (5)
  "dev": "next dev",
  "build": "next build", 
  "start": "next start",
  "lint": "next lint",
  "test": "jest",

  // Dev variants (3)
  "dev:clean": "./scripts/clean-browser-and-start.sh",
  "dev:debug": "NODE_OPTIONS='--inspect' next dev",
  "dev:turbo": "next dev --turbo",

  // Database (5)
  "db:migrate": "prisma migrate dev",
  "db:migrate:prod": "prisma migrate deploy",
  "db:seed": "tsx prisma/seed.ts",
  "db:reset": "prisma migrate reset",
  "db:studio": "prisma studio",

  // Tests unitaires (5)
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:critical": "jest src/modules/conges src/lib/auth --coverage",
  "test:changed": "jest -o",
  "test:debug": "node --inspect-brk ./node_modules/.bin/jest --runInBand",

  // Tests E2E (5)
  "e2e": "cypress open",
  "e2e:run": "cypress run",
  "e2e:ci": "start-server-and-test dev http://localhost:3000 e2e:run",
  "e2e:debug": "DEBUG=cypress:* cypress open",
  "e2e:record": "cypress run --record",

  // Quality (5)
  "lint:fix": "next lint --fix",
  "type-check": "tsc --noEmit",
  "format": "prettier --write .",
  "quality": "npm run lint && npm run type-check",
  "validate": "npm run quality && npm test",

  // Performance (3)
  "perf:analyze": "ANALYZE=true next build",
  "perf:audit": "node scripts/performance-audit.js",
  "perf:monitor": "node scripts/performance-monitor.js",

  // CI/CD (3)
  "ci:test": "npm run validate && npm run test:coverage",
  "ci:e2e": "npm run build && npm run e2e:ci",
  "ci:full": "npm run ci:test && npm run ci:e2e",

  // Outils (5)
  "audit": "./scripts/audit-global.sh",
  "etape": "./scripts/etape",
  "export": "node scripts/export-db-state.js",
  "clean": "rm -rf .next node_modules",
  "setup": "npm install && npm run db:migrate && npm run db:seed",

  // Scripts composites (5)
  "precommit": "lint-staged",
  "prepush": "npm run validate",
  "release": "npm run validate && npm run build",
  "start:prod": "npm run build && npm run start",
  "update": "npm update && npm run validate"
}
```

Total: ~50 scripts bien organisés