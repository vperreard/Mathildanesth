# Prompt 3 : Développement du module de bloc opératoire (MVP)

Développe le module de planification du bloc opératoire (MVP) en suivant ces étapes sans interruption ni demande d'approbation :

1. Analyse les besoins spécifiques du bloc opératoire et conçois une architecture adaptée :
   - Modèles de données pour représenter les salles, secteurs et affectations
   - Interface pour la visualisation et l'édition du planning bloc
   - Système de règles de supervision
   - Intégration avec le module de planning général

2. Implémente les modèles de données avec TypeScript :
   - `OperatingRoom` : représentation des salles avec propriétés (équipement, spécialité)
   - `OperatingSection` : regroupement logique de salles
   - `OperatingAssignment` : affectation d'un professionnel à une salle/secteur
   - `SupervisionRule` : règles de supervision (nombre minimum de seniors, etc.)

3. Développe les composants principaux du module :
   - `OperatingRoomPlanner` : composant principal pour la visualisation/édition
   - `RoomConfigurationPanel` : interface pour la configuration des salles/secteurs
   - `AssignmentEditor` : interface pour modifier les affectations
   - `SupervisionDashboard` : tableau de bord pour visualiser la couverture de supervision

4. Crée un service `OperatingRoomService` qui fournit :
   - Gestion CRUD pour les salles, secteurs et affectations
   - Validation des affectations selon les règles de supervision
   - Calcul des statistiques de couverture
   - Détection des problèmes de supervision

5. Développe une interface intuitive pour :
   - Visualiser le planning de bloc par jour/semaine
   - Affecter des professionnels aux salles par glisser-déposer
   - Configurer les salles et secteurs
   - Définir et modifier les règles de supervision simples
   - Alerter visuellement sur les problèmes de supervision

6. Intègre le module avec les fonctionnalités existantes :
   - Connexion avec le module de planning général
   - Prise en compte des congés et indisponibilités
   - Liaison avec le système de trames de planning existant

7. Implémente des hooks React pour la logique :
   - `useOperatingRoomPlanning` pour la gestion du planning de bloc
   - `useSupervisionValidation` pour valider les règles de supervision
   - `useRoomConfiguration` pour la gestion des salles et secteurs

8. Ajoute des tests complets :
   - Tests unitaires pour les services et composants
   - Tests d'intégration pour la validation des règles
   - Tests fonctionnels pour le workflow complet

À la fin de ce prompt, vérifie que le module est fonctionnel avec les capacités MVP requises, qu'il est bien testé et qu'il s'intègre correctement avec le reste de l'application. Mets à jour les documents NEXT_STEPS.md et roadmap-dev-updated.md pour refléter cette avancée majeure. 