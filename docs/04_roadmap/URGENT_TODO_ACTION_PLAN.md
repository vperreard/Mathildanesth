# 🚨 PLAN D'ACTION URGENT - TODO CRITIQUES DE SÉCURITÉ

**Date :** 25 mai 2025  
**Criticité :** HAUTE - 19 TODO de sécurité détectés  
**Total TODO :** 91 occurrences

## ⚠️ SITUATION CRITIQUE

### TODO de Sécurité Critiques (19)
Ces TODO représentent des **failles de sécurité potentielles** dans l'application médicale :

#### 🔐 Vérifications d'Permissions Manquantes (9 TODO)
1. `src/app/api/leaves/route.ts:67` - Permissions utilisateur/admin
2. `src/app/api/affectation-modeles/[...]/route.ts:23,165` - Vérifications de rôle (2)
3. `src/app/api/trame-modeles/[...]/route.ts:33` - Admin modifications
4. `src/app/api/contextual-messages/[...]/route.ts:80,49,234` - Permissions admin (3)
5. `src/app/api/simulations/[scenarioId]/route.ts:65,94` - Permissions scénario (2)

#### 🏥 Contrôles Métier Manquants (6 TODO)
1. `src/modules/planning/bloc-operatoire/services/blocPlanningService.ts:1077` - Permissions statut
2. `src/modules/planning/bloc-operatoire/services/blocPlanningService.ts:1110` - Droits modification
3. `src/modules/planning/bloc-operatoire/services/blocPlanningService.ts:1153` - Droits suppression
4. `src/modules/leaves/services/leaveService.ts:458,504` - Vérifications congés (2)
5. `src/app/api/admin/leave-types/route.ts:52` - Vérifications admin

#### 🔍 Validations Manquantes (4 TODO)
1. `src/hooks/useDateValidation.ts:426,427` - Validations avancées (2)
2. `src/app/api/operating-rooms/[id]/route.ts:249` - Vérification utilisation
3. `src/app/api/operating-sectors/[id]/route.ts:182` - Vérification secteur

## 🎯 PLAN D'ACTION IMMÉDIAT

### Phase 1 : Sécurité API Routes (URGENT - 24h)
```
Priorité 1 : API de gestion des congés et affectations
- src/app/api/leaves/route.ts
- src/app/api/affectation-modeles/[affectationModeleId]/route.ts
- src/app/api/trame-modeles/[trameModeleId]/affectations/route.ts

Priorité 2 : API administratives
- src/app/api/admin/leave-types/route.ts
- src/app/api/contextual-messages/[messageId]/route.ts
- src/app/api/simulations/[scenarioId]/route.ts
```

### Phase 2 : Services Critiques (URGENT - 48h)
```
- src/modules/planning/bloc-operatoire/services/blocPlanningService.ts
- src/modules/leaves/services/leaveService.ts
- src/hooks/useDateValidation.ts
```

### Phase 3 : Vérifications Infrastructure (72h)
```
- src/app/api/operating-rooms/[id]/route.ts
- src/app/api/operating-sectors/[id]/route.ts
```

## 🛡️ PATTERNS DE SÉCURITÉ À IMPLÉMENTER

### 1. Middleware d'Autorisation
```typescript
// src/lib/auth/authorization.ts
export const requireRole = (roles: string[]) => {
  return async (req: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !roles.includes(session.user.role)) {
      throw new Error('Insufficient permissions');
    }
    return session;
  };
};
```

### 2. Vérification Propriétaire/Admin
```typescript
export const requireOwnerOrAdmin = async (
  userId: string, 
  session: Session
) => {
  if (session.user.role !== 'ADMIN' && session.user.id !== userId) {
    throw new Error('Access denied');
  }
};
```

### 3. Validation Métier
```typescript
export const validateBusinessRules = async (
  action: string,
  resourceId: string,
  userId: string
) => {
  // Logique de validation métier
};
```

## 📋 CHECKLIST SÉCURITÉ

### Pour chaque API Route :
- [ ] Vérification session utilisateur
- [ ] Validation des permissions/rôles
- [ ] Validation des paramètres d'entrée
- [ ] Vérification propriétaire/admin
- [ ] Logging des actions sensibles
- [ ] Rate limiting si nécessaire

### Pour chaque Service :
- [ ] Validation des droits d'accès
- [ ] Vérification des règles métier
- [ ] Audit trail des modifications
- [ ] Gestion des erreurs sécurisée

## 🔄 PROCESSUS DE RÉSOLUTION

### 1. Analyse de Chaque TODO (30min/TODO)
- Identifier le risque exact
- Définir les permissions nécessaires
- Choisir le pattern approprié

### 2. Implémentation (45min/TODO)
- Ajouter les vérifications
- Écrire les tests de sécurité
- Documenter les règles

### 3. Test et Validation (15min/TODO)
- Test avec différents rôles
- Test des cas d'erreur
- Vérification des logs

## 📊 ESTIMATION TEMPORELLE

- **Phase 1 (9 TODO critiques)** : 14h (1.5j développeur)
- **Phase 2 (6 TODO services)** : 9h (1j développeur)  
- **Phase 3 (4 TODO infra)** : 6h (0.5j développeur)
- **Total :** 29h (3.5j développeur)

## 🚨 RISQUES SI NON TRAITÉ

1. **Élévation de privilèges** : Utilisateurs accédant à des ressources non autorisées
2. **Modification non autorisée** : Altération de données critiques (plannings, congés)
3. **Fuite d'informations** : Accès à des données médicales sensibles
4. **Audit/Conformité** : Non-respect des réglementations médicales

## ✅ VALIDATION FINALE

Une fois tous les TODO traités :
- [ ] Audit de sécurité complet
- [ ] Tests de pénétration basiques
- [ ] Review par un expert sécurité
- [ ] Documentation des mesures implementées
- [ ] Formation équipe sur les nouvelles règles

---

**🔥 ACTION REQUISE IMMÉDIATEMENT :** Commencer par les API routes de la Phase 1 dès aujourd'hui. La sécurité d'une application médicale est non-négociable. 