# Known Issues & Progress

## Test Stabilization Progress (January 2025)

### ✅ Completed

1. **TestFactory.LeaveBalance.createForUser** - Added missing method
2. **DayOfWeek/Period Enums** - Added to Prisma mock (`__mocks__/@prisma/client.ts`)
3. **URL Standardization** - Created fix script (all tests already using absolute URLs)
4. **@ts-ignore Elimination** - Removed from critical modules:
   - `src/modules/leaves/services/conflictDetectionService.test.ts` - Fixed using Object.defineProperty
   - Other modules already clean

### 📊 Test Coverage Status

- **Current Global Coverage**: 1.67% (Critical!)
- **Auth Module**: ~95.7% ✅
- **Leaves Module**: ~30-40% ⚠️
- **Planning Module**: ~20-30% ⚠️

### 🚨 Critical Files Without Tests (91 identified)

Top priorities:

- ❌ `src/lib/auth/authCache-redis.ts` - Test created
- ❌ `src/modules/leaves/services/publicHolidayService.ts` - Test created
- ❌ `src/hooks/useDebounce.ts` - Test created
- ❌ `src/services/planningGenerator.ts` - Test created
- Many more services and hooks need tests

### 🐛 Remaining Test Issues

1. **Leaves Module**:

   - Some tests still expect relative URLs in API mocks
   - Missing mock implementations for complex services

2. **Planning Module**:

   - Component tests missing data-testid attributes
   - Some validation logic tests failing

3. **E2E Tests**:
   - Cypress tests need route updates (leaves → conges)
   - WebSocket tests have timeout issues

## Performance Issues

### 🚨 API Performance

1. **Auth API**: Currently >2s (target: <1s)

   - JWT validation needs caching optimization
   - Database queries need indexing

2. **Planning Loading**: Currently >5s (target: <2s)
   - N+1 queries in bloc-operatoire
   - Missing eager loading for relations

### 📦 Bundle Size

- Not yet analyzed - need to run bundle analyzer

## Architecture Issues

### 🏗️ Bloc-Opératoire Fusion (80% complete)

Remaining 20%:

- Merge duplicate validation logic
- Unify drag-drop implementations
- Consolidate API endpoints

### 🔄 Request System Unification

Current: 3 separate interfaces
Target: 1 unified interface

- Leave requests
- Assignment swap requests
- General user requests

## Next Steps Priority

1. **Immediate** (This week):

   - Add tests for remaining 87 critical files
   - Fix auth API performance with caching
   - Run bundle size analysis

2. **Short term** (Next 2 weeks):

   - Achieve 40% test coverage
   - Complete bloc-opératoire fusion
   - Optimize planning queries

3. **Medium term** (Next month):
   - Reach 70% test coverage
   - Unify request systems
   - Full performance optimization

---

Last Updated: ${new Date().toISOString()}
