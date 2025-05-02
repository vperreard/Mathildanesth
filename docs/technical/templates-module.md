# Module Templates

## Vue d'ensemble

Le module "Templates" permet la création, modification et gestion de trames de planning standardisées. 
Ces trames définissent les affectations (consultations, bloc opératoire, gardes) disponibles pour chaque jour de la semaine
avec la possibilité de configurer le nombre de postes requis et si l'affectation est ouverte par défaut.

## Architecture

### Structure des dossiers

```
src/modules/templates/
├── components/
│   ├── BlocPlanningTemplateEditor.tsx - Éditeur principal de trames
│   ├── TemplateManager.tsx - Gestionnaire des trames (liste, CRUD)
│   └── __tests__/
│       └── BlocPlanningTemplateEditor.test.tsx - Tests unitaires
├── services/
│   └── templateService.ts - Services d'accès aux données
└── types/
    └── template.ts - Définitions de types
```

### Composants principaux

#### TemplateManager

Composant de gestion qui affiche la liste des trames existantes et permet de créer, modifier, dupliquer ou supprimer des trames.

**Fonctionnalités clés :**
- Affichage des trames dans un tableau ordonné
- Création de nouvelles trames
- Édition de trames existantes via l'ouverture d'un dialogue
- Duplication de trames existantes
- Suppression de trames avec confirmation
- Gestion des erreurs et affichage des notifications

#### BlocPlanningTemplateEditor

Éditeur principal permettant de configurer une trame de planning. Organisé par jours de la semaine, il permet d'ajouter, 
modifier, réordonner et supprimer des affectations pour chaque jour.

**Fonctionnalités clés :**
- Configuration du nom de la trame
- Ajout d'affectations par type pour chaque jour
- Activation/désactivation des affectations (ouvert/fermé)
- Configuration du nombre de postes requis
- Réorganisation des affectations par glisser-déposer
- Validation des données en temps réel
- Affichage des erreurs de validation

### Services

#### templateService

Service centralisant les opérations CRUD sur les trames.

**Méthodes :**
- `getTemplates()` - Récupère toutes les trames disponibles
- `getTemplateById(id)` - Récupère une trame spécifique par son ID
- `saveTemplate(template)` - Sauvegarde une trame (création ou mise à jour)
- `deleteTemplate(id)` - Supprime une trame par son ID
- `duplicateTemplate(id)` - Duplique une trame existante
- `getAvailableAffectationTypes()` - Récupère les types d'affectations disponibles

### Types

Les principaux types définis dans `template.ts` :

- `AffectationType` - Types d'affectations possibles (`CONSULTATION`, `BLOC_OPERATOIRE`, etc.)
- `DayOfWeek` - Jours de la semaine (`LUNDI`, `MARDI`, etc.)
- `TemplateAffectation` - Définition d'une affectation avec ses propriétés
- `PlanningTemplate` - Définition complète d'une trame avec ses métadonnées et affectations

## Intégration avec react-dnd

Le module utilise `react-dnd` pour permettre le réordonnancement des affectations par glisser-déposer :

- `useDrag` - Hook utilisé pour rendre une affectation "déplaçable"
- `useDrop` - Hook utilisé pour définir les zones où les affectations peuvent être déposées
- `DndProvider` - Contexte nécessaire pour le fonctionnement de react-dnd

## Validation

Un système de validation en temps réel est implémenté dans l'éditeur qui vérifie :

1. Que le nom de la trame n'est pas vide
2. Qu'il n'y a pas d'affectations dupliquées pour un même jour et type
3. Que les affectations ouvertes ont au moins un poste requis

Les erreurs sont affichées dans une zone dédiée et le bouton de sauvegarde est désactivé tant que des erreurs subsistent.

## Tests

Le module est couvert par des tests unitaires qui vérifient :

- Le rendu correct des composants
- La validation des données
- Les interactions utilisateur (changement de nom, activation/désactivation d'affectations)
- Les opérations CRUD
- L'intégration avec react-dnd

## Utilisation

Pour utiliser le gestionnaire de trames dans une autre partie de l'application :

```tsx
import { TemplateManager } from '@/modules/templates/components/TemplateManager';

function PlanningManagementPage() {
  return (
    <div>
      <h1>Gestion des Planning</h1>
      <TemplateManager />
    </div>
  );
}
```

## Futures évolutions

- Intégration avec le module de planification (génération automatique de planning basé sur les trames)
- Système d'historique et de versions pour les trames
- Trames avec variations saisonnières
- Analyse d'optimisation des trames basée sur les données historiques 