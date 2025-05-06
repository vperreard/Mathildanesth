# Module de Gestion du Bloc Opératoire

Ce module permet la gestion complète des ressources du bloc opératoire, incluant les salles d'opération, les secteurs, et les règles de supervision.

## Fonctionnalités implémentées

### Gestion des salles d'opération
- ✅ Interface CRUD complète pour les salles d'opération
- ✅ Attribution des salles à des secteurs spécifiques
- ✅ Gestion des statuts (Disponible, Occupé, Maintenance, Hors service)
- ✅ Activation/désactivation des salles

### Gestion des secteurs
- ✅ Interface CRUD complète pour les secteurs opératoires
- ✅ Attribution de codes couleur pour identification visuelle rapide
- ✅ Visualisation des salles associées à chaque secteur
- ✅ Activation/désactivation des secteurs

### Règles de supervision
- ✅ Interface CRUD complète pour les règles de supervision
- ✅ Définition de trois types de règles (Basique, Spécifique, Exception)
- ✅ Configuration fine des conditions de supervision
  - ✅ Nombre maximum de salles par MAR
  - ✅ Nombre maximum exceptionnel
  - ✅ Supervision interne uniquement
  - ✅ Supervision de salles contiguës uniquement
- ✅ Association de règles spécifiques à des secteurs
- ✅ Système de priorités pour gérer les cas d'exception

### Structure technique
- ✅ Hooks personnalisés avec React Query pour la gestion des données
- ✅ API simulée pour le développement et les tests
- ✅ Formulaires validés avec Zod
- ✅ Composants UI modernes et accessibles
- ✅ Pages d'administration dédiées

## Architecture

Le module est structuré de la façon suivante :

- `/src/modules/planning/bloc-operatoire/` - Module principal
  - `/types/` - Définitions TypeScript des entités
  - `/components/` - Composants React réutilisables
  - `/hooks/` - Hooks React Query pour la gestion des données
  - `/services/` - Services d'accès aux données (API)

- `/src/app/admin/bloc-operatoire/` - Pages d'administration
  - `/page.tsx` - Page principale avec navigation
  - `/salles/page.tsx` - Gestion des salles d'opération
  - `/secteurs/page.tsx` - Gestion des secteurs opératoires
  - `/regles-supervision/page.tsx` - Configuration des règles de supervision

## Prochaines étapes

### Interface de planning
- [ ] Vue calendrier des affectations par salle
- [ ] Fonctionnalités de drag-and-drop
- [ ] Filtres par salle/secteur/chirurgien
- [ ] Validation des contraintes en temps réel

### Intégrations
- [ ] Connexion aux API réelles (remplacer les simulées)
- [ ] Import/export des données
- [ ] Intégration avec le module de congés

## Utilisation

Pour accéder au module d'administration du bloc opératoire :

1. Naviguer vers `/admin/bloc-operatoire`
2. Utiliser les cartes de navigation pour accéder aux différentes sections
3. Gérer les salles via `/admin/bloc-operatoire/salles`
4. Gérer les secteurs via `/admin/bloc-operatoire/secteurs`
5. Configurer les règles de supervision via `/admin/bloc-operatoire/regles-supervision`

## Tests et documentation

- [ ] Tests unitaires pour les composants principaux
- [ ] Tests d'intégration pour les flux complets
- [ ] Documentation utilisateur complète 