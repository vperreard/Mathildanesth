# Patterns de Sécurité - Mathildanesth

## Vue d'ensemble

Ce document décrit les patterns de sécurité implémentés dans l'application Mathildanesth pour garantir la protection des données et le respect des règles métier.

## 1. Architecture de Sécurité

### 1.1 Authentification (Authentication)
- **JWT Tokens** : Stockage sécurisé dans des cookies HTTPOnly
- **Vérification systématique** : Toutes les routes API vérifient le token
- **Gestion centralisée** : Via `verifyAuthToken()` dans `auth-server-utils.ts`

### 1.2 Autorisation (Authorization)
- **RBAC** : Role-Based Access Control avec permissions granulaires
- **Vérification à deux niveaux** :
  - Niveau route : Vérification du rôle utilisateur
  - Niveau données : Vérification des permissions sur les ressources spécifiques

### 1.3 Validation des Règles Métier
- **Service centralisé** : `BusinessRulesValidator`
- **Validation préventive** : Avant toute opération de création/modification
- **Messages d'erreur détaillés** : Pour guider l'utilisateur

## 2. Pattern de Validation des Règles Métier

### 2.1 Architecture du BusinessRulesValidator

```typescript
// src/services/businessRulesValidator.ts
export class BusinessRulesValidator {
  // Méthodes statiques pour chaque domaine métier
  static async validateLeaveRequest(input: LeaveValidationInput): Promise<ValidationResult>
  static async validateAssignment(input: AssignmentValidationInput): Promise<ValidationResult>
  static async validatePlanningGeneration(input: PlanningGenerationInput): Promise<ValidationResult>
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

### 2.2 Intégration dans les Routes API

#### Pattern Standard
```typescript
// 1. Vérification de l'authentification
const authResult = await verifyAuthToken(token);
if (!authResult.authenticated) {
  return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
}

// 2. Vérification des permissions
const user = await prisma.user.findUnique({ where: { id: authResult.userId } });
if (!hasPermission(user, requiredPermission)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// 3. Validation des règles métier
const validationResult = await BusinessRulesValidator.validateXXX(input);
if (!validationResult.valid) {
  logger.warn('Validation failed', { errors: validationResult.errors });
  return NextResponse.json({ 
    error: 'Validation des règles métier échouée',
    details: validationResult.errors
  }, { status: 400 });
}

// 4. Exécution de l'opération
// ... code métier ...

// 5. Logging de l'action
logger.info('Action completed', { action, userId, details });
```

### 2.3 Règles Métier Implémentées

#### Congés (Leaves)
1. **Durée maximale** : 30 jours consécutifs
2. **Chevauchements** : Interdits avec d'autres congés
3. **Quotas** : Respect des limites annuelles et par type
4. **Espacement** : 90 jours minimum entre congés longs (>14 jours)
5. **Limite annuelle** : 45 jours maximum par an

#### Affectations (Assignments)
1. **Conflits horaires** : Une seule affectation par jour
2. **Compétences** : Vérification pour salles spécialisées
3. **Gardes** :
   - Intervalle minimum : 7 jours
   - Maximum par mois : 4
4. **Temps de travail** : Maximum 48h/semaine
5. **Jours consécutifs** : Maximum 6 jours

#### Génération de Planning
1. **Période** : Maximum 31 jours
2. **Ressources** :
   - Ratio MARs/salles : 1 MAR pour 3 salles max
   - Minimum 1 IADE par salle
3. **Disponibilité** : Prise en compte des congés
4. **Équilibrage** : Distribution équitable des charges

## 3. Sécurité des Données

### 3.1 Protection contre les Injections
- **Prisma ORM** : Protection automatique contre SQL injection
- **Validation des entrées** : Schémas Zod sur toutes les routes
- **Sanitization** : Échappement automatique par React

### 3.2 Protection XSS
- **React** : Échappement automatique des données
- **Content Security Policy** : Headers de sécurité configurés
- **Validation côté serveur** : Double vérification des données

### 3.3 Protection CSRF
- **Cookies SameSite** : Protection contre les requêtes cross-origin
- **Tokens CSRF** : Pour les opérations sensibles (à implémenter)

## 4. Logging et Audit

### 4.1 Logging des Actions
```typescript
logger.info('Action description', {
  action: 'CREATE_LEAVE',
  authenticatedUserId: user.id,
  targetUserId: targetId,
  role: user.role,
  details: { /* données spécifiques */ }
});
```

### 4.2 Logging des Erreurs
```typescript
logger.warn('Security violation', {
  type: 'UNAUTHORIZED_ACCESS',
  userId: attemptingUser.id,
  resource: resourceId,
  reason: 'Insufficient permissions'
});
```

## 5. Bonnes Pratiques

### 5.1 Principe du Moindre Privilège
- Accorder uniquement les permissions nécessaires
- Vérifier les permissions au plus près de l'action
- Limiter la portée des tokens et sessions

### 5.2 Défense en Profondeur
- Multiple couches de sécurité
- Validation côté client ET serveur
- Logs détaillés pour l'audit

### 5.3 Fail Securely
- En cas d'erreur, refuser l'accès par défaut
- Messages d'erreur génériques pour les utilisateurs
- Logs détaillés côté serveur uniquement

## 6. Checklist de Sécurité pour Nouvelles Fonctionnalités

- [ ] Authentification requise sur toutes les routes sensibles
- [ ] Vérification des permissions (RBAC)
- [ ] Validation des règles métier via BusinessRulesValidator
- [ ] Validation des entrées avec Zod ou équivalent
- [ ] Logging des actions et erreurs
- [ ] Tests unitaires incluant les cas d'erreur
- [ ] Documentation des règles métier appliquées
- [ ] Revue de code par un pair

## 7. Maintenance et Évolution

### 7.1 Ajout de Nouvelles Règles
1. Ajouter la méthode dans `BusinessRulesValidator`
2. Créer les tests unitaires correspondants
3. Intégrer dans les routes API concernées
4. Documenter les nouvelles règles

### 7.2 Monitoring
- Surveiller les logs d'erreurs de validation
- Analyser les patterns d'utilisation
- Ajuster les règles selon les retours

### 7.3 Performance
- Les validations doivent rester rapides (<100ms)
- Utiliser la mise en cache quand approprié
- Optimiser les requêtes base de données

## 8. Références

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/authentication)
- [Prisma Security Guidelines](https://www.prisma.io/docs/guides/security)

---

**Dernière mise à jour** : Janvier 2025
**Statut** : ✅ Pattern implémenté et testé