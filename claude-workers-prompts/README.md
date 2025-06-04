# CLAUDE CODE WORKERS - CENTRE DE COMMANDE

## 🚀 WORKERS DISPONIBLES

### 1. WORKER-AUTH
- **Focus**: Authentication & Security Tests
- **Priorité**: CRITICAL
- **Temps**: 15-20 min
- **Prompt**: [worker-auth-prompt.md](./worker-auth-prompt.md)

### 2. WORKER-LEAVES-CORE
- **Focus**: Leaves Core Services
- **Priorité**: CRITICAL
- **Temps**: 20-25 min
- **Prompt**: [worker-leaves-core-prompt.md](./worker-leaves-core-prompt.md)

### 3. WORKER-LEAVES-HOOKS
- **Focus**: Leaves Hooks & Components
- **Priorité**: CRITICAL
- **Temps**: 15-20 min
- **Prompt**: [worker-leaves-hooks-prompt.md](./worker-leaves-hooks-prompt.md)

### 4. WORKER-SERVICES-CORE
- **Focus**: Core Services (Primary)
- **Priorité**: CRITICAL
- **Temps**: 15-20 min
- **Prompt**: [worker-services-core-prompt.md](./worker-services-core-prompt.md)

### 5. WORKER-SERVICES-BUSINESS
- **Focus**: Business Services
- **Priorité**: HIGH
- **Temps**: 15-20 min
- **Prompt**: [worker-services-business-prompt.md](./worker-services-business-prompt.md)

### 6. WORKER-COMPONENTS-UI
- **Focus**: UI Components Core
- **Priorité**: HIGH
- **Temps**: 10-15 min
- **Prompt**: [worker-components-ui-prompt.md](./worker-components-ui-prompt.md)

### 7. WORKER-HOOKS-CORE
- **Focus**: Core Hooks (Non-Auth)
- **Priorité**: HIGH
- **Temps**: 10-15 min
- **Prompt**: [worker-hooks-core-prompt.md](./worker-hooks-core-prompt.md)

### 8. WORKER-UTILS
- **Focus**: Utils & Helpers
- **Priorité**: MEDIUM
- **Temps**: 10-15 min
- **Prompt**: [worker-utils-prompt.md](./worker-utils-prompt.md)

### 9. WORKER-TYPES
- **Focus**: Types & Validation
- **Priorité**: MEDIUM
- **Temps**: 5-10 min
- **Prompt**: [worker-types-prompt.md](./worker-types-prompt.md)

### 10. WORKER-INTEGRATION
- **Focus**: Integration & E2E Tests
- **Priorité**: LOW
- **Temps**: 25-30 min
- **Prompt**: [worker-integration-prompt.md](./worker-integration-prompt.md)

### 11. WORKER-CLEANUP
- **Focus**: Miscellaneous & Edge Cases
- **Priorité**: LOW
- **Temps**: 15-20 min
- **Prompt**: [worker-cleanup-prompt.md](./worker-cleanup-prompt.md)

## 📋 WORKFLOW RECOMMANDÉ

### Parallélisation Optimale
1. **Démarrer en premier**: worker-auth (CRITIQUE)
2. **En parallèle**: worker-leaves + worker-services  
3. **Ensuite**: worker-components + worker-hooks
4. **En dernier**: worker-integration

### Commandes de Suivi
```bash
# Surveiller les progrès
npm run test:bulletproof

# Tests par module
npm test -- --testPathPattern="auth"
npm test -- --testPathPattern="leaves" 
npm test -- --testPathPattern="services"

# Validation finale
npm run test:validate
```

## 🎯 OBJECTIF GLOBAL
- **100% des tests réparés**
- **< 30 secondes d'exécution**
- **Infrastructure bulletproof**
- **Documentation à jour**

Bon courage aux workers! 🤖⚡