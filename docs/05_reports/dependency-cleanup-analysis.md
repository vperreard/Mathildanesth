# Dependency Cleanup Analysis Report

**Date:** January 6, 2025  
**Task:** #19 - Clean redundant dependencies  
**Goal:** Reduce node_modules by at least 30%

## Executive Summary

Analysis reveals significant opportunities for dependency reduction:

- **9 completely unused** dependencies identified
- **4 drag-and-drop** libraries can be reduced to 1
- **4 UI component** libraries can be reduced to 1
- **Multiple date/icon** libraries can be consolidated
- **Estimated savings:** 40-50% reduction in node_modules size

## 1. Unused Dependencies (Remove Immediately)

```bash
# Dependencies with 0 imports - safe to remove
npm uninstall @radix-ui/react-dropdown-menu @types/pg bufferutil cookies-next critters pg pg-hstore react-window-infinite-loader utf-8-validate
```

## 2. Drag-and-Drop Libraries

### Current State

- `@dnd-kit/*` - 4 imports (minimal usage)
- `@hello-pangea/dnd` - 15 imports (moderate usage)
- `react-beautiful-dnd` - 2 imports (deprecated library)
- `react-dnd` + `react-dnd-html5-backend` - 12 imports

### Recommendation

**Standardize on `@hello-pangea/dnd`** (fork of react-beautiful-dnd):

- Most files already use it (15 files)
- Modern, maintained alternative to react-beautiful-dnd
- Simpler API than react-dnd

### Migration Impact

- 18 files need updating (4 @dnd-kit + 2 react-beautiful-dnd + 12 react-dnd)

## 3. UI Component Libraries

### Current State

- **Radix UI** - 21 direct + 1,090 via components/ui (dominant)
- **Material-UI** - 12 files
- **Ant Design** - 9 files (not even in dependencies!)
- **Headless UI** - 5 files

### Recommendation

**Standardize on Radix UI**:

- Already the foundation for components/ui
- Works perfectly with Tailwind CSS
- Most comprehensive primitive set

### Migration Impact

- 26 files need updating (12 MUI + 9 Ant + 5 Headless)

## 4. Date/Time Libraries

### Current State

- **date-fns** - 187 files (primary)
- **react-datepicker** - 5 files
- **react-day-picker** - 5 files
- **@fullcalendar** - 9 files (heavy but necessary for calendar views)
- **@mui/x-date-pickers** - 0 files (unused)

### Recommendation

**Keep date-fns as primary**, remove unused:

- Remove @mui/x-date-pickers
- Keep react-datepicker & react-day-picker (both use date-fns)
- Keep @fullcalendar (no lightweight alternative for complex calendars)

## 5. Icon Libraries

### Current State

- **lucide-react** - 278 files (but NOT in package.json!)
- **@heroicons/react** - 30 files
- **@mui/icons-material** - 5 files
- **@ant-design/icons** - 6 files

### Critical Issue

**lucide-react is missing from dependencies!** This needs immediate fix.

### Recommendation

1. **Add lucide-react to dependencies** (critical)
2. Migrate all icons to lucide-react
3. Remove other icon libraries

### Migration Impact

- 41 files need icon updates

## 6. Other Redundancies

### Multiple Testing Libraries

- `@testing-library/react` + `@testing-library/react-hooks` (legacy)
- Both Cypress and Puppeteer for E2E

### Build Tools

- Multiple Babel presets and plugins (some unused)
- Both webpack and Next.js built-in bundler configs

### Utility Duplicates

- `uuid` + `nanoid` (both for ID generation)
- `clsx` + `classnames` (both for className utilities)

## Implementation Plan

### Phase 1: Quick Wins (1 hour)

1. Remove 9 unused dependencies
2. Add missing lucide-react to package.json
3. Remove @mui/x-date-pickers

### Phase 2: Drag-and-Drop Consolidation (2 hours)

1. Migrate all to @hello-pangea/dnd
2. Remove @dnd-kit, react-beautiful-dnd, react-dnd

### Phase 3: UI Library Consolidation (3 hours)

1. Migrate MUI components to Radix UI
2. Remove Ant Design imports
3. Migrate Headless UI to Radix UI

### Phase 4: Icon Migration (2 hours)

1. Replace @heroicons with lucide-react
2. Replace @mui/icons with lucide-react
3. Replace @ant-design/icons with lucide-react

### Phase 5: Final Cleanup (1 hour)

1. Consolidate utility libraries
2. Remove duplicate test utilities
3. Clean build tool dependencies

## Expected Results

### Bundle Size Reduction

- **Current**: ~179 dependencies
- **After cleanup**: ~120 dependencies
- **Reduction**: ~33%

### Benefits

1. **Faster npm install**: Fewer packages to download
2. **Smaller bundle**: Less code shipped to users
3. **Easier maintenance**: Fewer libraries to update
4. **Better consistency**: Single solution per problem
5. **Reduced conflicts**: Fewer version mismatches

## Risks and Mitigation

1. **Breaking changes**: Run full test suite after each phase
2. **Missing functionality**: Ensure replacement libraries cover all use cases
3. **Team familiarity**: Document new patterns and provide examples

## Next Steps

1. Get approval for the plan
2. Create feature branch for each phase
3. Implement changes with thorough testing
4. Update documentation
5. Measure actual bundle size reduction
