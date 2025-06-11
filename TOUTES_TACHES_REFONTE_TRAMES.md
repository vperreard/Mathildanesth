# 📋 TOUTES LES TÂCHES - REFONTE MODULE TRAMES/AFFECTATIONS

> **Date** : 11/06/2025  
> **Durée totale** : 3-4 semaines  
> **15 tâches réparties en 4 phases**

---

## 🔴 PHASE 1 : STABILISATION URGENTE (1-2 jours)

### ✅ Tâche 1.1 : Éliminer rechargements intempestifs
- **ID** : trames_001
- **Priorité** : CRITICAL
- **Temps** : 30 minutes
- **Fichier** : `src/app/parametres/trames/TrameGridEditor.tsx`
- **Actions** :
  - Supprimer useEffect avec refresh automatique (lignes 354-378)
  - Retirer l'interval de 30 secondes
  - Conserver uniquement le bouton refresh manuel
- **Test** : Attendre 1 minute, vérifier aucun rechargement auto

### ✅ Tâche 1.2 : Corriger URLs hardcodées
- **ID** : trames_002
- **Priorité** : CRITICAL
- **Temps** : 1 heure
- **Actions** :
  - Créer `src/config/api-endpoints.ts`
  - Rechercher tous les "http://localhost:3000"
  - Remplacer par URLs relatives (/api/...)
  - Utiliser `process.env.NEXT_PUBLIC_API_URL`
- **Fichiers à vérifier** :
  - `useTrameEditor.ts`
  - `TrameHebdomadaireService.ts`
- **Test** : Toutes les requêtes API fonctionnent en dev et prod

### ✅ Tâche 1.3 : Fix toasts multiples
- **ID** : trames_003
- **Priorité** : CRITICAL
- **Temps** : 1 heure
- **Actions** :
  - Créer `src/lib/toast-manager.ts` (singleton)
  - Limite 3 toasts simultanés max
  - Auto-dismiss après 3 secondes
  - Améliorer bouton "🚫 Fermer toasts"
  - Deduplication pour éviter doublons
- **Test** : Max 3 toasts affichés, auto-dismiss fonctionne

### ✅ Tâche 1.4 : Bug semaines paires/impaires
- **ID** : trames_004
- **Priorité** : CRITICAL
- **Temps** : 2-3 heures
- **Actions** :
  - Dans `handleSaveAffectation` : hériter weekType de la trame
  - Adapter filtrage affectations (lignes 702-704)
  - Limiter sélecteur selon type trame :
    - PAIRES → ALL/EVEN seulement
    - IMPAIRES → ALL/ODD seulement
    - TOUTES → ALL/EVEN/ODD
- **Test** : Créer trame PAIRES, vérifier héritage type EVEN

---

## 🚀 PHASE 2 : OPTIMISATION PERFORMANCE (3-4 jours)

### 📊 Tâche 2.1 : React Query cache intelligent
- **ID** : trames_005
- **Priorité** : HIGH
- **Temps** : 1 jour
- **Actions** :
  - Créer `src/hooks/useTrameQueries.ts`
  - Configuration QueryClient :
    ```typescript
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchInterval: false
    ```
  - Créer hooks : `useTrameModeles()`, `useTrameModele(id)`, `useAffectations(trameId)`
  - Remplacer tous les axios.get par ces hooks
- **Test** : Vérifier cache fonctionne, pas de requêtes redondantes

### 📊 Tâche 2.2 : Unifier routes API
- **ID** : trames_006
- **Priorité** : HIGH
- **Temps** : 1 jour
- **Actions** :
  - Restructurer routes :
    - `/api/trame-modeles` : GET (liste), POST (créer)
    - `/api/trame-modeles/[id]` : GET, PUT, DELETE
    - `/api/trame-modeles/[id]/affectations` : POST, PUT, DELETE (batch)
  - Supprimer routes redondantes
  - Implémenter pagination et lazy loading
- **Test** : Toutes les opérations CRUD fonctionnent

### 📊 Tâche 2.3 : Optimistic Updates
- **ID** : trames_007
- **Priorité** : HIGH
- **Temps** : 1 jour
- **Actions** :
  - Implémenter mutations React Query avec optimistic updates
  - Updates locales immédiates
  - Rollback automatique en cas d'erreur
  - Queue de synchronisation pour mode offline
- **Code exemple** :
  ```typescript
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['trame', id]);
    const previous = queryClient.getQueryData(['trame', id]);
    queryClient.setQueryData(['trame', id], newData);
    return { previous };
  }
  ```
- **Test** : Modifications instantanées, rollback si erreur

### 📊 Tâche 2.4 : WebSockets temps réel
- **ID** : trames_008
- **Priorité** : HIGH
- **Temps** : 1 jour
- **Actions** :
  - Canal par trame : `trame:${trameId}`
  - Events : `affectation:created`, `affectation:updated`, `affectation:deleted`
  - Indicateur "X utilisateurs consultent cette trame"
  - Update automatique cache React Query sur events
- **Test** : Modifications visibles en temps réel entre utilisateurs

---

## 🎨 PHASE 3 : RÉVOLUTION ERGONOMIQUE (4-5 jours)

### 🖱️ Tâche 3.1 : Menu contextuel clic-droit
- **ID** : trames_009
- **Priorité** : MEDIUM
- **Temps** : 1.5 jours
- **Actions** :
  - Implémenter menu contextuel React
  - Structure hiérarchique :
    ```
    Ajouter affectation >
      - Matin
      - Après-midi  
      - Journée complète
      - 24h (garde/astreinte)
    Affecter chirurgien >
      - [Par spécialité] >
        - [Liste chirurgiens]
    ---
    Dupliquer
    Copier
    Coller
    Supprimer
    ---
    Appliquer à toute la ligne
    ```
- **Test** : Clic-droit ouvre menu, toutes actions fonctionnent

### 🖱️ Tâche 3.2 : Actions rapides et drag-drop
- **ID** : trames_010
- **Priorité** : MEDIUM
- **Temps** : 1.5 jours
- **Actions** :
  - Double-clic cellule vide → création rapide
  - Double-clic affectation → édition directe
  - Drag & drop amélioré avec preview ghost
  - Multi-sélection : Ctrl+clic, Shift+clic
  - Toolbar flottante pour actions groupées
- **Test** : Toutes les interactions rapides fonctionnent

### 🖱️ Tâche 3.3 : Vue unifiée ultra-rapide
- **ID** : trames_011
- **Priorité** : MEDIUM
- **Temps** : 1.5 jours
- **Actions** :
  - Pré-charger vue grille ET vue chirurgien
  - Utiliser `display: none` au lieu de conditional rendering
  - État partagé via Context
  - Virtual scrolling pour grandes listes
  - Animations GPU (transform3d)
- **Test** : Bascule instantanée < 100ms entre vues

### 🖱️ Tâche 3.4 : Détection conflits visuels
- **ID** : trames_012
- **Priorité** : MEDIUM
- **Temps** : 0.5 jour
- **Actions** :
  - Affectation normale : fond blanc, bordure grise
  - Conflit détecté : fond orange, bordure rouge
  - Icône warning sur conflits
  - Tooltip explicatif au survol
  - Panneau latéral listant tous les conflits
- **Test** : Conflits visibles immédiatement

---

## 💎 PHASE 4 : FEATURES ESSENTIELLES (2-3 jours)

### 🎯 Tâche 4.1 : Drag & drop avancé
- **ID** : trames_013
- **Priorité** : MEDIUM
- **Temps** : 1.5 jours
- **Actions** :
  - Déplacer entre salles (même jour)
  - Déplacer entre jours (même salle)
  - Déplacer entre salles ET jours
  - Multi-drag : déplacer plusieurs sélectionnées
  - Comportements :
    - Normal : déplacer
    - Shift : copier
    - Alt : échanger (swap)
  - Undo/Redo (Ctrl+Z/Y)
- **Test** : Tous les types de déplacement fonctionnent

### 🎯 Tâche 4.2 : Export PDF/Excel one-click
- **ID** : trames_014
- **Priorité** : MEDIUM
- **Temps** : 1 jour
- **Actions** :
  - Boutons export dans toolbar
  - Excel multi-feuilles :
    - Feuille 1 : Vue grille complète
    - Feuille 2 : Liste par chirurgien
    - Feuille 3 : Statistiques
  - PDF options :
    - Format A4/A3
    - Orientation paysage
    - En-têtes avec logo
    - Pagination auto
- **Test** : Exports générés correctement, lisibles

### 🎯 Tâche 4.3 : Semaines paires/impaires avancé
- **ID** : trames_015
- **Priorité** : MEDIUM
- **Temps** : 0.5 jour
- **Actions** :
  - Architecture simplifiée (Option A)
  - Une seule trame, variations au niveau affectation
  - Badges visuels clairs : "Sem. paires", "Sem. impaires"
  - Duplication intelligente avec alternance
  - Interface de sélection intuitive
- **Test** : Gestion paires/impaires claire et fonctionnelle

---

## 📊 TABLEAU RÉCAPITULATIF

| Phase | Nb tâches | Durée | Priorité | Impact |
|-------|-----------|-------|----------|---------|
| Phase 1 | 4 | 1-2 jours | CRITICAL | Stabilisation urgente |
| Phase 2 | 4 | 3-4 jours | HIGH | Performance x10 |
| Phase 3 | 4 | 4-5 jours | MEDIUM | Ergonomie révolutionnée |
| Phase 4 | 3 | 2-3 jours | MEDIUM | Features pro |

## 🎯 ORDRE D'EXÉCUTION RECOMMANDÉ

1. **Jour 1** : Tâches 1.1 + 1.2 + début 1.3
2. **Jour 2** : Finir 1.3 + 1.4
3. **Semaine 1** : Phase 2 complète
4. **Semaine 2** : Phase 3 complète
5. **Semaine 3** : Phase 4 + tests finaux

## 📈 MÉTRIQUES DE SUCCÈS

- ✅ **Phase 1** : 0 rechargement auto, 0 URL hardcodée, max 3 toasts
- ✅ **Phase 2** : 90% réduction appels API, temps réponse < 200ms
- ✅ **Phase 3** : 75% réduction clics, toutes actions < 2 clics
- ✅ **Phase 4** : Export < 5s, drag & drop fluide 60fps

---

**💡 Note** : Commencez ABSOLUMENT par la Phase 1 (stabilisation) avant toute autre amélioration !