# 🚨 PLAN D'ACTION URGENT - REFONTE MODULE TRAMES/AFFECTATIONS

> **Date** : 11/06/2025  
> **Criticité** : MAXIMALE - Module central inutilisable en production  
> **Durée totale estimée** : 3-4 semaines

## 📊 RÉSUMÉ EXÉCUTIF

Suite à l'audit complet, le module Trames/Affectations présente des **problèmes critiques** :
- **Performance catastrophique** : 10-20x trop d'appels API
- **Ergonomie très limitée** : 3-4 clics pour chaque action
- **Rechargements intempestifs** : Toutes les 30 secondes
- **Bugs bloquants** : Semaines paires/impaires, toasts multiples

## 🎯 PHASE 1 : STABILISATION URGENTE (1-2 jours) 🔴

**À FAIRE AUJOURD'HUI ET DEMAIN - PRIORITÉ ABSOLUE**

### ✅ Tâche 1.1 : Éliminer rechargements intempestifs (30 min)
```javascript
// Fichier : src/app/parametres/trames/TrameGridEditor.tsx
// Lignes : 354-378
// Action : Supprimer le refresh automatique, garder uniquement manuel
```

### ✅ Tâche 1.2 : Corriger URLs hardcodées (1h)
```javascript
// Créer : src/config/api-endpoints.ts
// Remplacer tous les "http://localhost:3000" par URLs relatives
// Utiliser process.env.NEXT_PUBLIC_API_URL
```

### ✅ Tâche 1.3 : Fix toasts multiples (1h)
```javascript
// Créer : src/lib/toast-manager.ts
// Singleton avec limite 3 toasts max
// Auto-dismiss après 3 secondes
```

### ✅ Tâche 1.4 : Bug semaines paires/impaires (2-3h)
```javascript
// Dans handleSaveAffectation : hériter weekType de la trame
// Adapter filtrage lignes 702-704
// Limiter sélecteur selon type trame
```

## 📈 PHASE 2 : OPTIMISATION PERFORMANCE (3-4 jours)

**SEMAINE PROCHAINE - Diviser par 10 les appels API**

### 🚀 Tâche 2.1 : React Query cache intelligent (1 jour)
```typescript
// Créer : src/hooks/useTrameQueries.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchInterval: false
    }
  }
});
```

### 🚀 Tâche 2.2 : Unifier routes API (1 jour)
- `/api/trame-modeles` : Liste avec options
- `/api/trame-modeles/[id]` : CRUD complet
- `/api/trame-modeles/[id]/affectations` : Batch operations

### 🚀 Tâche 2.3 : Optimistic Updates (1 jour)
- Updates locales immédiates
- Rollback automatique en cas d'erreur
- Queue synchronisation offline

### 🚀 Tâche 2.4 : WebSockets temps réel (1 jour)
- Canal `trame:${trameId}`
- Synchronisation multi-utilisateurs
- Indicateur présence

## 🎨 PHASE 3 : RÉVOLUTION ERGONOMIQUE (4-5 jours)

**DANS 2 SEMAINES - Interface ultra-rapide**

### 🖱️ Tâche 3.1 : Menu contextuel clic-droit (1.5 jours)
- Ajouter affectation → Matin/Après-midi/Journée/24h
- Affecter chirurgien → Par spécialité → Liste chirurgiens
- Appliquer à toute la ligne

### ⚡ Tâche 3.2 : Actions rapides (1.5 jours)
- Double-clic = édition instantanée
- Drag & drop amélioré avec preview
- Multi-sélection Ctrl+clic

### 🔄 Tâche 3.3 : Vue unifiée (1.5 jours)
- Bascule instantanée grille ↔ chirurgien
- Pré-chargement des vues
- Virtual scrolling

### ⚠️ Tâche 3.4 : Conflits visuels (0.5 jour)
- Orange = conflit détecté
- Panneau latéral des conflits

## 💎 PHASE 4 : FEATURES ESSENTIELLES (2-3 jours)

**DANS 3 SEMAINES - Fonctionnalités avancées**

### 🎯 Tâche 4.1 : Drag & drop pro (1.5 jours)
- Déplacer entre salles ET jours
- Multi-drag sélection
- Shift = copier, Alt = swap

### 📊 Tâche 4.2 : Export PDF/Excel (1 jour)
- Excel multi-feuilles
- PDF A4/A3 paysage

### 📅 Tâche 4.3 : Semaines paires/impaires (0.5 jour)
- Architecture simplifiée
- Badges visuels clairs

## 📋 CHECKLIST QUOTIDIENNE

### AUJOURD'HUI (Jour 1)
- [ ] Tâche 1.1 : Supprimer refresh auto (30 min)
- [ ] Tâche 1.2 : URLs relatives (1h)
- [ ] Commencer Tâche 1.3 : Toast manager (30 min)

### DEMAIN (Jour 2)
- [ ] Finir Tâche 1.3 : Toast manager (30 min)
- [ ] Tâche 1.4 : Bug semaines paires/impaires (2-3h)
- [ ] Tests de validation Phase 1

### SEMAINE 1
- [ ] Phase 2 complète : React Query + API + WebSockets

### SEMAINE 2
- [ ] Phase 3 : Clic-droit + ergonomie

### SEMAINE 3
- [ ] Phase 4 : Features avancées
- [ ] Tests finaux et déploiement

## 🎯 RÉSULTATS ATTENDUS

✅ **Performance** : 90% réduction appels API  
✅ **Productivité** : 75% moins de clics  
✅ **Stabilité** : 0 rechargement intempestif  
✅ **UX** : Création affectation 4x plus rapide  

## 💡 CONSEILS POUR DÉMARRER

1. **Commencez par la Phase 1** - C'est urgent et rapide (1-2 jours)
2. **Testez après chaque modification** - Évitez les régressions
3. **Documentez les changements** - Pour l'équipe
4. **Communiquez les progrès** - Les utilisateurs attendent

---

**Ce plan a été ajouté dans `/docs/04_roadmap/ROADMAP.md` pour suivi long terme.**