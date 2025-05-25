# Prompt 2 : Développement du module de règles dynamiques (MVP)

Développe un module complet de règles dynamiques pour la génération de plannings en respectant ces étapes sans interruption ni demande d'approbation :

1. Crée l'architecture du module de règles dynamiques avec les composants suivants :
   - Un service `DynamicRuleService` pour la logique métier
   - Des modèles de données pour représenter différents types de règles
   - Une interface d'administration CRUD
   - Un moteur d'évaluation des règles
   - Des hooks React pour intégrer le système de règles dans les composants

2. Développe les types de règles de base suivants :
   - Règles de répartition équitable des gardes
   - Règles de temps minimum entre deux gardes
   - Règles de respect des compétences requises
   - Règles pour les périodes critiques/spéciales
   - Règles de priorité pour les conflits

3. Crée une interface d'administration intuitive permettant de :
   - Visualiser les règles existantes dans un tableau avec filtres et tri
   - Ajouter/éditer des règles via un formulaire dynamique
   - Activer/désactiver des règles 
   - Configurer des paramètres spécifiques pour chaque type de règle
   - Prévisualiser l'impact des règles sur un planning test

4. Implémente le moteur d'évaluation qui :
   - Évalue les règles dans un ordre déterminé
   - Calcule des scores/pénalités pour les affectations potentielles
   - Détecte et signale les violations de règles
   - Optimise les performances avec mise en cache
   - Gère les conflits entre règles avec système de priorité

5. Développe les hooks React pour l'intégration :
   - `useRuleEvaluation` pour évaluer des affectations contre les règles
   - `useRuleManagement` pour la gestion CRUD des règles
   - `useRuleViolations` pour détecter et afficher les violations

6. Intègre le module avec les fonctionnalités existantes :
   - Connecte le moteur de règles avec l'algorithme de génération des plannings
   - Ajoute la détection des violations lors de modifications manuelles
   - Intègre les règles dans le système de conflits existant

7. Ajoute des tests complets pour le module :
   - Tests unitaires pour chaque type de règle
   - Tests d'intégration pour le moteur d'évaluation
   - Tests pour les interfaces d'administration

À la fin de ce prompt, assure-toi que le module est fonctionnel, testé et documenté. Mets à jour les documents NEXT_STEPS.md et roadmap-dev-updated.md pour refléter cette avancée. 