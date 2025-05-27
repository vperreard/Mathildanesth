# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🗓️ CRITICAL: Date Awareness
**IMPORTANT**: Always verify and use the correct current date. The date format is DD/MM/YY.
- When updating documentation, use the actual current date
- When reading logs or documentation, pay attention to date formats
- Example: 27/5/25 means May 27, 2025 (not January 27, 2025)

## Project Overview

Mathildanesth is a medical planning application for anesthesia teams (MARs and IADEs), managing schedules, leave requests, and work time. Built with Next.js 14, TypeScript, PostgreSQL, and Prisma.

## 📚 Documentation Structure (Updated January 2025)

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

### Testing (Updated)
```bash
npm test                     # Run all tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Generate coverage report
npm run test:critical       # Test critical modules (leaves, auth, rules)
npm run test:leaves         # Test leaves module specifically
npm run test:auth           # Test authentication module
npm run test:e2e           # Run E2E tests with Puppeteer
npm run cypress:open       # Open Cypress test runner
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

### Critical Modules

1. **Leaves Module** (`/src/modules/leaves/`)
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

### Testing Strategy (Enhanced)

1. **Unit Tests**: For utilities and pure functions (target: 70% coverage)
2. **Integration Tests**: For API routes and services (target: 80% for critical modules)
3. **E2E Tests**: Critical user flows with Cypress and Puppeteer
4. **Performance Tests**: Load testing and benchmarking

**Testing Infrastructure**:
- Jest configuration with coverage thresholds
- Factory functions for test data
- Mock strategies for external dependencies
- E2E infrastructure with Puppeteer and Cypress

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
5. **Documentation**: 
   - Update relevant docs in `/docs/` structure
   - **Add new TODOs or tasks to [ROADMAP.md](docs/04_roadmap/ROADMAP.md)** - DO NOT create new todo files
   - **Log bugs in [KNOWN_ISSUES.md](docs/04_roadmap/KNOWN_ISSUES.md)**
   - **IMPORTANT: After completing ANY task, immediately update ROADMAP.md and KNOWN_ISSUES.md**
   - Mark completed tasks with [x] and add completion date
   - Add new issues discovered during development
6. **Planning**: Check [Consolidated ROADMAP](docs/04_roadmap/ROADMAP.md) for current priorities
7. **Standards**: Follow [TypeScript Guidelines](docs/01_architecture/TYPESCRIPT_GUIDELINES.md)

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

**Last Updated**: May 2025 - Documentation maintenance rules added
- All TODO/NEXT_STEPS files consolidated into single ROADMAP.md
- Established rule: Only maintain ROADMAP.md and KNOWN_ISSUES.md for project planning
- Added requirement to update documentation immediately after completing tasks
- Added critical reminder about date awareness (DD/MM/YY format)