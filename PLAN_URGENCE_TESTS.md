# Plan d'Urgence - Infrastructure Tests Mathildanesth

## 🚨 NIVEAU D'URGENCE : **ÉLEVÉ**

### Contexte Critique
- **Application médicale** : Aucune tolérance aux erreurs patient
- **367 tests échouent** / 1536 total (24% d'échec)
- **Modules critiques manquants** bloquent développement
- **Déploiement production risqué** sans stabilisation

---

## ⏰ ACTIONS IMMÉDIATES (48h)

### 1. Modules Manquants Critiques
```typescript
// PRIORITÉ 1 - Créer apiClient.ts
src/lib/apiClient.ts
- Configuration Axios base
- Intercepteurs auth 
- Gestion erreurs réseau
- Types de réponse API

// PRIORITÉ 2 - Créer teamService.ts  
src/services/teamService.ts
- CRUD équipes médicales
- Gestion rôles et permissions
- Validation données équipe
```

### 2. Mocks Essentiels à Fixer
```typescript
// NextResponse.json mocks
jest.mock('next/server', () => ({
    NextResponse: { json: jest.fn() }
}));

// Timing des intercepteurs Axios
await new Promise(resolve => setTimeout(resolve, 0));
```

### 3. Commande de Diagnostic
```bash
# Identifier les tests les plus critiques échoués
npm test -- --reporter=verbose | grep -E "(FAIL|ERROR)" > urgences.log

# Tests critiques modules métier uniquement
npm test -- --testPathPattern="(leaves|auth|bloc)" --passWithNoTests=false
```

---

## 📈 PLANNING RÉCUPÉRATION

### Semaine 1 : Stabilisation Critique
- [x] Infrastructure créée (FAIT)
- [ ] **Jour 1-2** : Modules manquants (apiClient, teamService)
- [ ] **Jour 3-4** : Mocks NextResponse et intercepteurs
- [ ] **Jour 5** : Validation 80% tests passent

### Semaine 2 : Finalisation Qualité  
- [ ] Correction types TypeScript complexes
- [ ] Tests composants UI simplifiés
- [ ] Documentation mise à jour
- [ ] **Objectif : 95% tests passent**

### Semaine 3 : Optimisation
- [ ] Performance < 100ms tous tests
- [ ] Couverture 85% modules critiques
- [ ] Tests E2E scénarios métier
- [ ] **Objectif : Production ready**

---

## 🎯 CRITÈRES DE SUCCÈS

### Seuil Minimum Acceptable (Fin Semaine 1)
```
✅ > 80% des tests passent (vs 73% actuel)
✅ Modules critiques (apiClient, teamService) fonctionnels
✅ Zéro erreur de compilation TypeScript
✅ CI/CD pipeline stable
```

### Objectif Optimal (Fin Semaine 3)
```
🎯 > 95% des tests passent
🎯 Couverture 85% modules leaves/auth/bloc
🎯 Performance < 100ms tests unitaires
🎯 Documentation complète jour
```

---

## 💰 IMPACT BUSINESS

### Risques si NON traité immédiatement :
- **Régressions patient** non détectées (€€€€)
- **Développement bloqué** (équipe improductive)
- **Déploiement manuel** (risques humains)
- **Dette technique** exponentielle

### Bénéfices si traité rapidement :
- **Confiance déploiement** (+80%)
- **Productivité équipe** (+60%)
- **Qualité logicielle** (prévention bugs)
- **Conformité médicale** (audit ready)

---

## 🛠️ RESSOURCES NÉCESSAIRES

### Temps Développeur
- **2-3 jours** pour modules manquants
- **1-2 jours** pour mocks critiques  
- **1 jour** validation et documentation

### Compétences Requises
- TypeScript avancé (types complexes)
- Jest/Testing Library (mocks)
- Next.js (API routes, server components)
- Architecture logicielle (patterns)

---

## 📞 ESCALADE SI BESOIN

### Blocages Techniques
1. **Types complexes** : Simplifier avant optimiser
2. **Performance lente** : Paralléliser tests par module
3. **Mocks instables** : Retour factories simples

### Décision Go/No-Go Déploiement
**Seuil minimum :** 80% tests passent + modules critiques OK
**Si en dessous :** Report déploiement production

---

## ✅ CONCLUSION

**URGENCE CONFIRMÉE** : Infrastructure à 73% de stabilité pour app médicale = inacceptable

**Action recommandée :** START IMMÉDIAT sur modules manquants puis stabilisation progressive

**Timeline :** 2-3 semaines pour infrastructure production-ready solide 