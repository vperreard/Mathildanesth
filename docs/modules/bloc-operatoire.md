# Module Bloc Opératoire

## Présentation

Le module Bloc Opératoire offre une solution complète pour la gestion et la planification des activités du bloc opératoire dans un établissement de santé. Ce module permet d'organiser les salles d'opération, d'affecter des superviseurs, et de suivre les interventions chirurgicales.

## Fonctionnalités principales

- **Planning hebdomadaire du bloc** : Visualisation claire du planning sur une semaine
- **Gestion des salles d'opération** : Configuration et organisation des salles
- **Gestion des secteurs** : Regroupement des salles par spécialités ou zones
- **Règles de supervision** : Configuration des règles d'affectation des médecins anesthésistes-réanimateurs
- **Validation des plannings** : Contrôle du respect des règles et validation des affectations

## Structure des données

### Entités principales

- **Salles d'opération (OperatingRoom)** : Représente une salle physique avec ses caractéristiques
- **Secteurs (BlocSector)** : Regroupe des salles avec des spécialités communes
- **Règles de supervision (SupervisionRule)** : Définit les contraintes d'affectation des superviseurs
- **Planning journalier (BlocDayPlanning)** : Contient les affectations pour une journée spécifique
- **Affectation de salle (BlocRoomAssignment)** : Association d'une salle avec ses superviseurs
- **Superviseur (BlocSupervisor)** : Médecin affecté à la supervision d'une salle pour une ou plusieurs périodes

## Architecture technique

### Services

- **blocPlanningService** : Service principal qui gère toutes les opérations CRUD sur les données du bloc opératoire

### Composants UI

- **BlocPlanning** : Affichage du planning hebdomadaire
- **BlocPlanningDay** : Affichage du planning pour un jour spécifique
- **BlocPlanningEditor** : Interface d'édition du planning
- **AdminComponents** :
  - SallesAdmin
  - SecteursAdmin
  - ReglesSupervisionAdmin

### Pages

- **/bloc-operatoire** : Page principale du module
- **/bloc-operatoire/edit/[date]** : Édition du planning pour une date
- **/bloc-operatoire/create/[date]** : Création d'un nouveau planning
- **/admin/bloc-operatoire** : Administration du module

## Guide d'utilisation

### Consultation du planning

1. Accédez à la page "Bloc Opératoire"
2. Utilisez les contrôles de navigation pour changer de semaine
3. Cliquez sur une date pour voir les détails du planning de ce jour

### Création d'un planning

1. Depuis la vue hebdomadaire, cliquez sur "Créer planning" pour un jour sans planning
2. Ajoutez des salles au planning depuis le panneau de gauche
3. Pour chaque salle, ajoutez un ou plusieurs superviseurs
4. Définissez les périodes de supervision pour chaque superviseur
5. Ajoutez des notes si nécessaire
6. Enregistrez le planning (brouillon, proposé, validé ou publié)

### Édition d'un planning existant

1. Depuis la vue hebdomadaire, cliquez sur "Modifier" pour un jour avec planning existant
2. Modifiez les affectations des salles et superviseurs
3. Mettez à jour le statut du planning si nécessaire
4. Enregistrez les modifications

### Administration

1. Accédez à la page "Administration du Bloc Opératoire"
2. Utilisez les onglets pour gérer :
   - Les salles d'opération
   - Les secteurs
   - Les règles de supervision

## Intégration avec les autres modules

- **Module de planning général** : Vérification des disponibilités des médecins
- **Module de gestion des utilisateurs** : Récupération des informations des superviseurs
- **Module de calendrier** : Affichage des interventions dans le calendrier général

## Développement futur

- Gestion des interventions chirurgicales avec durée et équipe
- Gestion des urgences et reprogrammations
- Tableau de bord avec statistiques d'occupation des salles
- Système de notifications pour les changements de planning
- Interface mobile pour consultation rapide

## Tests et assurance qualité

Des tests unitaires ont été mis en place pour garantir le bon fonctionnement du service blocPlanningService, couvrant :

- Gestion des salles d'opération
- Gestion des secteurs
- Gestion des règles de supervision
- Planification du bloc opératoire

## Contributeurs

- Équipe de développement Mathildanesth 