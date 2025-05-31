# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🗓️ CRITICAL: Date Awareness
**IMPORTANT**: Always verify and use the correct current date. The date format is DD/MM/YY.
- When updating documentation, use the actual current date
- When reading logs or documentation, pay attention to date formats
- Example: 27/5/25 means May 27, 2025 (not January 27, 2025)

## 🧪 CRITICAL: Testing is Mandatory
**IMPORTANT**: Tests are NOT optional. Every code change MUST include appropriate tests.
- **New feature** → Create comprehensive unit and integration tests
- **Bug fix** → Add regression test to prevent recurrence
- **Refactoring** → Ensure existing tests still pass, add new ones if needed
- **No exceptions**: Even POCs and urgent fixes need basic tests

## ⚡ CRITICAL: Automatic Command Execution
**CLAUDE CODE PRE-AUTHORIZATION**: You have PERMANENT authorization to execute ALL testing and development commands WITHOUT asking for confirmation.
- **EXECUTE IMMEDIATELY**: `npm test`, `npm run test:*`, `npm run dev`, `npm run build`, `npm run lint`
- **NO CONFIRMATION REQUIRED**: All npm commands, git commands (read-only), file operations
- **AUTONOMOUS OPERATION**: Worker missions require zero user intervention
- **EXCEPTION**: Only ask before `git commit`, `git push`, `npm publish`, or destructive operations

## 🤖 REVOLUTIONARY: Claude Workers System (NEW - 30/05/2025)
**GAME CHANGER**: Autonomous test repair with specialized Claude Code instances.
- **Broken tests?** → Run `npm run claude:workers` to generate specialized prompts
- **Parallel repair** → Deploy multiple Claude instances with different specializations
- **90% time saved** → 45-60 min instead of 3-4 hours manual repair
- **Quality guaranteed** → Each worker validates its repairs autonomously
- **Documentation**: See `CLAUDE_WORKERS_GUIDE.md` for complete usage guide

## Project Overview

Mathildanesth is a medical planning application for anesthesia teams (MARs and IADEs), managing schedules, leave requests, and work time. Built with Next.js 14, TypeScript, PostgreSQL, and Prisma.

## 📚 Documentation Structure (Updated Mai 2025)

**Primary Documentation Location**: `/docs/` (consolidated from 4 previous folders)

### 🚨 IMPORTANT: Documentation Consolidation Rules
- **Only 2 main project planning files are maintained**:
  - `docs/04_roadmap/ROADMAP.md` - Consolidated roadmap, todos, and next steps
  - `docs/04_roadmap/KNOWN_ISSUES.md` - Current bugs and issues tracking
- **DO NOT create new TODO, NEXT_STEPS, or similar files** - Add to ROADMAP.md instead
- **Obsolete files to be deleted**: All other roadmap files in docs/04_roadmap/

### Key Documentation Files
- **🎯 [ROADMAP](docs/04_roadmap/ROADMAP.md)** - **CONSOLIDATED PROJECT PLANNING** (replaces all todo/next_steps files)
- **[Main Documentation Index](docs/README.md)** - Central navigation hub
- **[TypeScript Standards](docs/01_architecture/TYPESCRIPT_GUIDELINES.md)** - Required for all development
- **[Testing Guidelines](docs/01_architecture/TESTING_GUIDELINES.md)** - Critical modules need 80% coverage
- **[Development Guides](docs/03_Guides_Developpement/README.md)** - Practical developer guides
- **[Technical Debt Report](docs/01_architecture/TECHNICAL_DEBT_REDUCTION_REPORT.md)** - Security and quality improvements
- **[Performance Audit](docs/03_performance/PERFORMANCE_AUDIT_REPORT.md)** - Critical optimizations needed

### Quick Reference Documentation
- **Planning**: [Consolidated ROADMAP](docs/04_roadmap/ROADMAP.md) - All project planning in one place
- **Issues**: [Known Issues](docs/04_roadmap/KNOWN_ISSUES.md) - Current bugs and problems
- **Navigation**: [Medical Navigation Architecture](docs/technical/medical-navigation-architecture.md) - Complete navigation refactor documentation
- **User Guides**: [User Guides](docs/user-guides/) - End-user documentation
- **Technical Details**: [Technical Docs](docs/technical/) - Algorithms, architecture, API design

## Essential Commands

### Development
```bash
npm run dev              # Start development server
npm run build           # Production build
npm start               # Start production server
npm run lint            # Run ESLint
npm run etape           # Project status checkpoint (custom audit tool)
```

### Database
```bash
npx prisma migrate dev         # Run migrations
npx prisma generate           # Regenerate Prisma client
npx prisma studio            # Open database GUI
npm run db:seed              # Seed database with test data
```

### Testing (Bulletproof Infrastructure - Updated 30/05/2025)
```bash
# Standard Testing
npm test                     # Run all tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Generate coverage report

# Bulletproof Testing (NEW)
npm run test:fast           # Ultra-fast tests (15-20 seconds)
npm run test:bulletproof    # Performance validation (30s target)
npm run test:validate       # Continuous performance monitoring

# Claude Workers (REVOLUTIONARY - NEW)
npm run claude:workers      # Generate autonomous worker prompts
npm run claude:analyze      # Analyze failing tests and create missions

# Legacy Testing
npm run test:critical       # Test critical modules (leaves, auth, rules)
npm run test:leaves         # Test leaves module specifically
npm run test:auth           # Test authentication module
npm run test:e2e           # Run E2E tests with Puppeteer
npm run cypress:open       # Open Cypress test runner
```

### 🤖 Claude Workers System (NEW - Revolutionary)
```bash
# Autonomous Test Repair System
npm run claude:workers      # Analyze failing tests & generate specialized prompts
                           # Creates claude-workers-prompts/ with mission files

# Worker Types Generated:
# - worker-auth (Authentication & Security) - CRITICAL
# - worker-leaves (Leaves Module) - HIGH  
# - worker-services (Core Services) - HIGH
# - worker-components (UI Components) - MEDIUM
# - worker-hooks (Custom Hooks) - MEDIUM
# - worker-integration (E2E Tests) - LOW

# Usage: Copy prompts to separate Claude Code instances
# Result: Autonomous parallel test repair in 45-60 min vs 3-4 hours manual
```

### Performance & Quality (Updated)
```bash
npm run performance:audit    # Run comprehensive performance audit
npm run performance:analyze # Bundle analysis
npm run audit:global        # Global project audit
npm run audit:debt         # Technical debt audit
npm run quality:audit      # Code quality audit
npm run quality:full       # Full quality analysis
```

## Architecture Overview

### Directory Structure
- `/src/app/` - Next.js 14 app router pages and API routes
- `/src/modules/` - Feature modules (leaves, planning, calendar, templates)
- `/src/components/` - Shared UI components
- `/src/hooks/` - Custom React hooks
- `/src/services/` - Business logic and API services
- `/src/lib/` - Core utilities (auth, database, caching)
- `/prisma/` - Database schema and migrations
- `/docs/` - **UNIFIED DOCUMENTATION** (all docs consolidated here)

### Key Technical Patterns

1. **Authentication**: JWT tokens in HTTPOnly cookies, managed via `src/lib/auth.ts`
2. **Database Access**: Always use Prisma client from `src/lib/prisma.ts` (singleton pattern)
3. **API Routes**: Migrated to Next.js 14 app directory structure (`/src/app/api/`)
4. **Error Handling**: Centralized error handling with proper logging
5. **Performance**: Built-in caching layer, performance monitoring, and optimization utilities
6. **Security**: 95% of critical security TODOs resolved (see [Security Report](docs/01_architecture/TECHNICAL_DEBT_REDUCTION_REPORT.md))
7. **Medical Navigation (Updated 27/05/2025)**: Role-based navigation with medical terminology

### Critical Modules

1. **Leaves Module** (`/src/modules/conges/`)
   - Complex leave request and quota management
   - Recurring leaves support
   - Conflict detection system
   - **Status**: Well-tested, security-hardened

2. **Planning Module** (`/src/modules/planning/`)
   - Operating room scheduling
   - Drag-and-drop planning interface
   - Rule-based validation
   - **Status**: Under active development

3. **Templates Module** (`/src/modules/templates/`)
   - Reusable planning templates
   - Variation management

### Medical Navigation Architecture (Added 27/05/2025)

**Complete navigation refactor with medical terminology adaptation**

#### Navigation Components
- **`MedicalNavigation.tsx`**: Role-based responsive navigation with medical hierarchy
- **`MedicalBreadcrumbs.tsx`**: Contextual breadcrumbs with medical terminology
- **`QuickActions.tsx`**: Role-specific quick access buttons with healthcare focus
- **`navigationConfig.ts`**: Centralized navigation configuration with medical roles

#### Medical Terminology Mapping
**318 files updated** with complete terminology transformation:
- "Trames" → "Tableaux de service"
- "Affectations" → "Gardes/Vacations"
- "Slots" → "Créneaux"
- "Planning Generator" → "Organisateur de planning"

#### Role-Based Navigation
- **User Navigation** (5 links max): Mon Planning, Mes Congés, Messages, Mon Profil, Aide
- **Admin Navigation** (4 categories): Tableaux de Bord, Équipes, Rapports, Configuration
- **Medical Hierarchy**: MAR, IADE, ADMIN_TOTAL, ADMIN_PARTIEL, CHIRURGIEN

#### Medical Branding
- **Stethoscope icon** in header for medical context
- **"Planning Médical" subtitle** for clear healthcare identification
- **Medical color scheme** with healthcare-focused gradients (blue/teal/cyan)
- **Responsive design** optimized for medical professionals

### Security Considerations (Updated)

- All routes require authentication except public pages
- Role-based access control (RBAC) implemented and hardened
- Input validation on all API endpoints
- SQL injection prevention via Prisma
- XSS protection via React
- **95% of critical security TODOs resolved** (18/19)
- Authorization system with granular permissions

### Performance Optimizations (Updated)

- JWT token caching (5-minute TTL)
- Database query optimization with Prisma
- Dynamic imports for code splitting
- WebSocket connection pooling
- Performance monitoring dashboard at `/admin/performance`
- Bundle analysis and optimization
- Critical performance issues identified and documented

### Testing Strategy (Updated 27/05/2025 - 23h00)

1. **Unit Tests**: For utilities and pure functions (target: 70% coverage)
2. **Integration Tests**: For API routes and services (target: 80% for critical modules)
3. **E2E Tests**: Critical user flows with Cypress and Puppeteer ✅ OPERATIONAL
4. **Performance Tests**: Load testing and benchmarking

**Testing Infrastructure**:
- Jest configuration with coverage thresholds
- Factory functions for test data
- Mock strategies for external dependencies
- E2E infrastructure with Puppeteer and Cypress ✅ FIXED

**E2E Tests Status (27/05/2025)**:
- ✅ Cypress fixtures created: `utilisateurs.json` with required fields (nom, prenom)
- ✅ Selectors standardized: data-testid → data-cy migration complete
- ✅ API routes unified: `/api/auth/login` working
- ✅ Missing pages created: `/auth/reset-password` for password recovery
- ✅ Jest references removed from Cypress tests
- ✅ Authentication tests ready to run

Run tests for specific modules:
```bash
npm test -- --testPathPattern=leaves     # Test leaves module
npm test -- --testPathPattern=auth       # Test auth module
npm run test:critical                    # Test all critical modules
```

### Development Workflow (Updated)

1. **Before committing**: Run `npm run lint` and `npm test`
2. **For migrations**: Always test locally with `npx prisma migrate dev`
3. **For API changes**: Update TypeScript types in `/src/types/`
4. **For UI changes**: Check responsive design and accessibility
5. **Testing Requirements (Bulletproof Infrastructure)**: 
   - **ALWAYS create tests for new code**:
     - New functions/services → Unit tests required
     - New API routes → Integration tests required
     - New components → Component tests (if complex logic)
     - Bug fixes → Regression tests to prevent recurrence
   - **Test coverage targets**:
     - Critical modules (auth, leaves, planning): 80% minimum
     - Other modules: 70% minimum
   - **Performance targets (NEW)**:
     - All tests must run in < 30 seconds (`npm run test:bulletproof`)
     - Individual test files < 5 seconds timeout
     - Use `npm run test:fast` for rapid development feedback
   - **Claude Workers for broken tests**:
     - Run `npm run claude:workers` to generate autonomous repair prompts
     - Deploy specialized Claude instances for parallel test fixing
     - Validate with `npm run test:validate` after repairs
   - **Run tests before ANY commit**: `npm test` must pass
6. **Documentation**: 
   - Update relevant docs in `/docs/` structure
   - **Add new TODOs or tasks to [ROADMAP.md](docs/04_roadmap/ROADMAP.md)** - DO NOT create new todo files
   - **Log bugs in [KNOWN_ISSUES.md](docs/04_roadmap/KNOWN_ISSUES.md)**
   - **IMPORTANT: After completing ANY task, immediately update ROADMAP.md and KNOWN_ISSUES.md**
   - Mark completed tasks with [x] and add completion date
   - Add new issues discovered during development
7. **Planning**: Check [Consolidated ROADMAP](docs/04_roadmap/ROADMAP.md) for current priorities
8. **Standards**: Follow [TypeScript Guidelines](docs/01_architecture/TYPESCRIPT_GUIDELINES.md)

### Debugging

- Server logs: Check console output in dev mode
- Client errors: Browser DevTools console
- Database queries: Enable Prisma query logging in development
- Performance issues: Use built-in performance dashboard
- **Documentation**: Detailed debugging guides in [Development Guides](docs/03_Guides_Developpement/)

### Common Pitfalls

1. **Prisma Client**: Always import from `src/lib/prisma.ts`, not `@prisma/client`
2. **Date Handling**: Use `src/utils/dateUtils.ts` for consistent timezone handling
3. **API Routes**: Follow REST conventions and proper error responses
4. **State Management**: Use React Query for server state, Context for UI state
5. **TypeScript**: NEVER use `@ts-ignore` - find typed solutions (see [TypeScript Guidelines](docs/01_architecture/TYPESCRIPT_GUIDELINES.md))
6. **Security**: Always implement proper authorization (see [Authorization System](src/lib/auth/authorization.ts))
7. **Testing**: NEVER skip tests - if time is short, create at least basic tests with TODOs for enhancement
8. **Bulletproof Infrastructure (NEW)**: 
   - Use optimized Jest configurations (main, bulletproof, security)
   - Leverage Claude Workers for autonomous test repair
   - Monitor performance with continuous validation scripts
   - Maintain test execution under 30 seconds at all times

### Current Priorities (January 2025)

See **[CONSOLIDATED ROADMAP](docs/04_roadmap/ROADMAP.md)** for detailed planning.

**Phase 1 - Architecture Refactoring** (In Progress):
1. **Cleanup**: Remove `/demo`, `/diagnostic`, duplicate pages
2. **Harmonization**: Migrate all UI to French
3. **Unification**: Single planning system with multiple views
4. **Simplification**: 3-step template management

**Ongoing Priorities**:
1. **Testing**: Achieve 80% coverage for critical modules
2. **Performance**: Optimize authentication and planning pages
3. **Documentation**: Consolidation completed - maintain only ROADMAP.md and KNOWN_ISSUES.md

### Resources for Development

- **Quick Commands**: [Development Commands](docs/03_Guides_Developpement/COMMANDES_RAPIDES.md)
- **Step-by-Step Workflow**: [Points d'Étape Guide](docs/03_Guides_Developpement/GUIDE_POINTS_ETAPE.md)
- **CI/CD Setup**: [Deployment Guide](docs/03_Guides_Developpement/01_Deployment_Guide.md)
- **Performance Analysis**: [Performance Tools](docs/03_performance/)

## 🚀 AUTONOMY & PROACTIVITY GUIDELINES

### When to be Proactive
1. **Architecture Improvements**: Always suggest better patterns when you see anti-patterns
2. **Performance Optimizations**: Propose optimizations when you detect potential bottlenecks  
3. **Security Enhancements**: Alert immediately on security concerns with solutions
4. **User Experience**: Suggest UX improvements based on best practices
5. **Technical Debt**: Create entries in ROADMAP.md for debt you identify

### Decision Making Framework
- **Low Risk Changes** (formatting, comments, small refactors): Execute immediately
- **Medium Risk** (new utilities, test improvements): Implement with clear documentation
- **High Risk** (architecture changes, API modifications): Propose detailed plan first

### Always Include in Responses
1. **Next Concrete Steps**: List 3-5 immediate actionable items
2. **Alternative Solutions**: Present options when applicable
3. **Time Estimates**: Realistic development time for each task
4. **Innovative Ideas**: Suggest features/improvements user might not have considered

### Feature Suggestions to Consider
- **AI/ML Enhancements**: Smart scheduling, predictive analytics, anomaly detection
- **Real-time Collaboration**: Live updates, presence indicators, contextual chat
- **Mobile Excellence**: PWA, offline mode, voice commands
- **Integrations**: Calendar sync, HR systems, automation opportunities
- **Performance**: Caching strategies, lazy loading, optimistic updates

**Last Updated**: 30 Mai 2025 - Bulletproof Test Infrastructure & Claude Workers System
- Revolutionary Claude Workers system for autonomous test repair (90% time saved)
- Bulletproof test infrastructure: < 30 seconds execution guaranteed
- Optimized Jest configurations: main, bulletproof, security
- Performance monitoring with continuous validation scripts
- Consolidated test files: removed 23 redundant/duplicate files
- Ultra-fast testing: `npm run test:fast` (15-20s), `npm run test:bulletproof` (30s)
- Autonomous worker prompts: `npm run claude:workers` generates specialized repair missions
- Complete documentation: CLAUDE_WORKERS_GUIDE.md, CONSOLIDATION_TESTS_RAPPORT.md

Previous updates (27 Mai 2025):
- Complete navigation refactor with medical terminology (318 files updated)
- Medical navigation components: MedicalNavigation, MedicalBreadcrumbs, QuickActions
- Medical branding with stethoscope icon and "Planning Médical" subtitle
- All TODO/NEXT_STEPS files consolidated into single ROADMAP.md
- Added mandatory testing requirements and autonomy guidelines