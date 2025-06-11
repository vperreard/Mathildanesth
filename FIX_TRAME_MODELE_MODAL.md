# Fix for TrameModele DELETE 404 Error and Grid Refresh

## Problem

1. DELETE request to `/api/trame-modeles/2/affectations/6` was returning 404
2. The affectation with ID 6 didn't exist in the database
3. UI was showing stale data after deletions
4. No proper error handling for 404 responses

## Root Cause

- The affectation was already deleted from the database (or never existed)
- The UI was trying to delete a non-existent affectation
- No graceful handling of 404 errors to update the UI state

## Solution Implemented

### 1. Enhanced Error Handling in TrameGridView.tsx

```typescript
if (error.response.status === 404) {
  // Si l'affectation n'existe plus, on la retire quand même de l'UI
  logger.warn(`[DELETE] Affectation ${affectationId} introuvable (404), suppression de l'UI`);

  // Mise à jour locale : retirer l'affectation de l'interface
  const updatedTrame = {
    ...trameModele,
    affectations: trameModele.affectations.filter(
      a => a.id.toString() !== affectationId.toString()
    ),
  };

  // Mise à jour locale
  setTrame(updatedTrame);

  // Notification de changement pour propager vers le parent
  if (onTrameChange) {
    onTrameChange(updatedTrame);
  }

  toast.warning("L'affectation a déjà été supprimée. L'interface a été mise à jour.");

  // Fermer le modal
  setIsAffectationModalOpen(false);
  setModalConfig(null);
}
```

### 2. Added Auto-Refresh on Tab Focus

```typescript
useEffect(() => {
  const handleFocus = () => {
    logger.info('[TrameGridEditor] Fenêtre/onglet actif, vérification des données');
    // Actualiser uniquement si plus de 30 secondes se sont écoulées depuis le dernier chargement
    const lastRefresh = localStorage.getItem('lastTrameRefresh');
    const now = Date.now();
    if (!lastRefresh || now - parseInt(lastRefresh) > 30000) {
      handleRefresh();
      localStorage.setItem('lastTrameRefresh', now.toString());
    }
  };

  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      handleFocus();
    }
  });

  return () => {
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleFocus);
  };
}, []);
```

### 3. Improved Refresh Function

```typescript
const handleRefresh = async () => {
  logger.info("[TrameGridEditor] Actualisation demandée par l'utilisateur");
  setIsRefreshing(true);
  try {
    await fetchTrames();
    if (selectedSiteId !== undefined) {
      await fetchRoomsAndSectors(selectedSiteId);
    }
    toast.success('Données actualisées avec succès');
  } catch (error) {
    logger.error("[TrameGridEditor] Erreur lors de l'actualisation:", error);
    toast.error("Erreur lors de l'actualisation des données");
  } finally {
    setIsRefreshing(false);
  }
};
```

## Benefits

1. **Graceful Error Handling**: 404 errors now update the UI instead of showing an error
2. **Auto-Sync**: Data automatically refreshes when user returns to the tab (after 30s)
3. **User Feedback**: Clear toast messages inform users about what's happening
4. **Data Consistency**: UI state stays in sync with database state

## Testing

1. Try to delete an affectation that doesn't exist - should show warning and update UI
2. Switch tabs and come back after 30s - should auto-refresh
3. Click the refresh button - should show success message
4. Multiple users can work on the same trame without conflicts

## Database State (as of debugging)

- TrameModele 2 ("Bloc Mathilde 2025 impaires") has 0 affectations
- Total of 7 affectations exist in the database (IDs: 5, 7-12)
- Affectation ID 6 does not exist
