# Plan d'Implémentation - Phases de Développement

Ce document décrit les différentes phases envisagées pour le développement du projet MATHILDA.

## V0.1 (Pre-MVP/Alpha)

### Objectifs
- Mettre en place l'environnement de développement et de production initial.
- Configurer les outils de base (gestion de version, intégration continue embryonnaire).
- Implémenter le schéma initial de la base de données.
- Développer les fonctionnalités d'authentification et de gestion des utilisateurs (inscription, connexion, rôles basiques).
- Mettre en place les opérations CRUD (Créer, Lire, Mettre à jour, Supprimer) pour les entités principales du modèle de données.

### Livrables Attendus
- Dépôt de code initialisé.
- Documentation de l'architecture de base.
- Environnement de développement fonctionnel.
- Premiers modèles de données implémentés.
- Module d'authentification basique.

## V1.0 (MVP - Produit Minimum Viable)

### Objectifs
- Livrer un ensemble de fonctionnalités essentielles permettant aux premiers utilisateurs d'utiliser l'application et d'en tirer une valeur ajoutée minimale.
- Valider les hypothèses clés du produit.
- Recueillir les premiers retours utilisateurs.

### Fonctionnalités Clés (à détailler dans `02_Priorisation_Fonctionnalites.md`)
- [Fonctionnalité A - Core]
- [Fonctionnalité B - Core]
- [Fonctionnalité C - Support]
- Interface utilisateur simple et fonctionnelle pour les fonctionnalités MVP.

### Livrables Attendus
- Application déployée sur un environnement de test/staging accessible aux bêta-testeurs.
- Manuel utilisateur simplifié pour les fonctionnalités MVP.
- Plan de collecte des retours utilisateurs.

## V1.1 (Améliorations MVP & Retours Utilisateurs)

### Objectifs
- Corriger les bugs critiques et les problèmes d'ergonomie identifiés sur la V1.0.
- Implémenter des améliorations rapides basées sur les retours des premiers utilisateurs.
- Optimiser les performances si des goulots d'étranglement sont identifiés.

### Livrables Attendus
- Version corrigée et améliorée de l'application.
- Rapport de synthèse des retours utilisateurs et des actions entreprises.

## V1.2 (Stabilisation & Préparation V2)

### Objectifs
- Assurer la stabilité et la robustesse de la version 1.x.
- Compléter la documentation technique et utilisateur.
- Effectuer du refactoring de code si nécessaire pour préparer les évolutions futures.
- Mettre en place ou améliorer les outils de monitoring, logging et alerting.
- Étoffer la couverture de tests (unitaires, intégration, E2E).

### Livrables Attendus
- Codebase stable et bien documentée.
- Suite de tests complète.
- Infrastructure de monitoring opérationnelle.

## V2.0 (Nouvelles Fonctionnalités Majeures)

### Objectifs
- Introduire de nouvelles fonctionnalités significatives qui étendent les capacités de l'application et répondent à des besoins utilisateurs plus avancés ou à de nouveaux segments.
- Potentiellement, faire évoluer l'architecture ou l'interface utilisateur pour supporter ces nouvelles fonctionnalités.

### Fonctionnalités Clés (Exemples)
- [Nouvelle Fonctionnalité Majeure X]
- [Nouvelle Fonctionnalité Majeure Y]
- Intégrations avec des services tiers.
- Tableaux de bord et rapports avancés.

### Livrables Attendus
- Nouvelle version de l'application avec les fonctionnalités majeures implémentées.
- Documentation mise à jour.

## V2.x (Itérations sur la V2)

### Objectifs
- Continuer à améliorer l'application en ajoutant des fonctionnalités de moindre envergure.
- Optimiser et corriger les bugs sur les fonctionnalités de la V2.
- Répondre aux retours utilisateurs spécifiques à la V2.

### Livrables Attendus
- Mises à jour incrémentales de l'application.

## V3.0 (Évolution Stratégique)

### Objectifs
- Implémenter des changements qui peuvent modifier la portée, l'échelle ou le positionnement stratégique de l'application.
- Répondre à des évolutions majeures du marché ou des besoins à long terme de l'organisation.

### Exemples Potentiels
- Expansion vers de nouveaux marchés.
- Refonte technologique majeure.
- Développement de nouvelles lignes de produits basées sur la plateforme existante.

### Livrables Attendus
- Dépendra de la nature de l'évolution stratégique.

## Phases de Développement

Ce document découpe le développement de MATHILDA en phases logiques, en commençant par un Produit Minimum Viable (MVP) et en ajoutant progressivement des fonctionnalités.

## Phase 1 : MVP - Le Planning de Base et la Gestion Essentielle

**Objectif :** Mettre en place une version fonctionnelle permettant la connexion, la visualisation d'un planning simple (potentiellement saisi manuellement), la gestion des utilisateurs et des absences de base.

**Fonctionnalités Clés (User Stories) :**

**1. Authentification & Gestion Utilisateurs (Admin)**

*   **US1.1 (Admin) :** En tant qu'administrateur, je veux pouvoir me connecter à l'application avec mon email/username et mot de passe pour accéder aux fonctions d'administration.
    *   *Critères d'Acceptation (CA) :* L'admin peut accéder à une page admin après connexion réussie. Échec de connexion avec identifiants incorrects.
*   **US1.2 (Admin) :** En tant qu'administrateur, je veux pouvoir créer un nouvel utilisateur (MAR/IADE) en renseignant son nom, prénom, email, username, rôle et un mot de passe initial.
    *   *CA :* Le nouvel utilisateur apparaît dans la liste. Il peut se connecter avec le mot de passe initial.
*   **US1.3 (Admin) :** En tant qu'administrateur, je veux pouvoir voir la liste des utilisateurs avec leur rôle et statut (actif/inactif).
    *   *CA :* Le tableau des utilisateurs s'affiche correctement.
*   **US1.4 (Admin) :** En tant qu'administrateur, je veux pouvoir modifier les informations de base d'un utilisateur (nom, prénom, email, rôle) et son statut (activer/désactiver).
    *   *CA :* Les modifications sont enregistrées et visibles. Un utilisateur désactivé ne peut plus se connecter.
*   **US1.5 (Admin) :** En tant qu'administrateur, je veux pouvoir définir le temps de travail (%) pour un utilisateur MAR ou IADE.
    *   *CA :* Le pourcentage est enregistré et visible dans le profil utilisateur (admin).

**2. Gestion des Absences (Utilisateur & Admin)**

*   **US2.1 (Utilisateur MAR/IADE) :** En tant qu'utilisateur, je veux pouvoir demander un congé (type Annuel) en spécifiant une date de début et une date de fin.
    *   *CA :* La demande est enregistrée avec le statut "pending". L'admin est notifié (mécanisme simple V1).
*   **US2.2 (Utilisateur MAR/IADE) :** En tant qu'utilisateur, lors de la demande de congé, je veux voir combien d'autres personnes de mon rôle (MAR ou IADE) sont déjà absentes sur la période demandée.
    *   *CA :* Le nombre d'absents MAR/IADE s'affiche et se met à jour lors de la sélection des dates.
*   **US2.3 (Admin) :** En tant qu'administrateur, je veux voir la liste des demandes de congé en attente.
    *   *CA :* La liste s'affiche avec les informations clés (demandeur, dates, type).
*   **US2.4 (Admin) :** En tant qu'administrateur, je veux pouvoir approuver ou rejeter une demande de congé.
    *   *CA :* Le statut de la demande est mis à jour. L'utilisateur est notifié (mécanisme simple V1).

**3. Visualisation du Planning (Tous Utilisateurs)**

*   **US3.1 (Utilisateur MAR/IADE) :** En tant qu'utilisateur, je veux pouvoir me connecter avec mon email/username et mot de passe.
    *   *CA :* Connexion réussie redirige vers la vue planning.
*   **US3.2 (Utilisateur) :** En tant qu'utilisateur, je veux voir le planning sous forme de calendrier (vue semaine par défaut).
    *   *CA :* Le calendrier s'affiche avec les jours de la semaine.
*   **US3.3 (Utilisateur) :** En tant qu'utilisateur, je veux voir les affectations (saisies manuellement par l'admin pour la V1) me concernant dans le calendrier.
    *   *CA :* Mes affectations (ex: Garde, Bloc Salle X) apparaissent aux bonnes dates/heures avec mon nom.
*   **US3.4 (Utilisateur) :** En tant qu'utilisateur, je veux pouvoir naviguer entre les semaines (précédente/suivante) et revenir à la semaine en cours.
    *   *CA :* La navigation met à jour le calendrier avec les bonnes dates et affectations.
*   **US3.5 (Utilisateur) :** En tant qu'utilisateur, je veux voir une couleur différente pour les types d'affectations principaux (ex: Garde en rouge, Bloc en bleu, OFF en gris).
    *   *CA :* Les affectations ont des couleurs distinctes.
*   **US3.6 (Utilisateur) :** En tant qu'utilisateur, en cliquant sur une affectation, je veux voir les détails de base (Utilisateur, Type, Salle/Lieu, Horaire).
    *   *CA :* Une modale/popup s'affiche avec les informations correctes.

**4. Saisie Manuelle du Planning (Admin - pour V1)**

*   **US4.1 (Admin) :** En tant qu'administrateur, je veux pouvoir créer une affectation simple (ex: Garde, Bloc) pour un utilisateur donné, à une date et un créneau donnés, en spécifiant la salle si nécessaire.
    *   *CA :* L'affectation est créée et visible dans le planning.
*   **US4.2 (Admin) :** En tant qu'administrateur, je veux pouvoir modifier une affectation existante (utilisateur, type, date, salle).
    *   *CA :* Les modifications sont enregistrées et visibles.
*   **US4.3 (Admin) :** En tant qu'administrateur, je veux pouvoir supprimer une affectation.
    *   *CA :* L'affectation disparaît du planning.

**Technologies socles à mettre en place :**

- Projet React (Vite) + Node.js (Express) initialisé.
- Base de données PostgreSQL configurée + Schéma Prisma de base appliqué.
- Système d'authentification (NextAuth.js) fonctionnel.
- Composant Calendrier (FullCalendar) intégré.
- Structure API REST de base.
- Environnement Docker fonctionnel.

**Ce qui n'est PAS dans le MVP :**

- Génération automatique du planning.
- Gestion fine des règles métier complexes (supervision, continuité, etc.).
- Compteurs (horaires, gardes, pénibilité).
- Échanges d'affectations.
- Requêtes spécifiques.
- Import/Synchro Google Sheets.
- Notifications avancées.
- Gestion fine des jours travaillés MARs.
- Responsive design mobile complet (focus sur Desktop V1).

---

## Phase 2 : Algorithme de Base et Règles Essentielles

**Objectif :** Implémenter une première version de l'algorithme de génération automatique, prenant en compte les contraintes de base (congés, gardes obligatoires, personnel minimum par secteur simple).

*   **(Admin) :** Lancer la génération pour une période.
*   **(Système) :** Prend en compte les congés approuvés.
*   **(Système) :** Assigne les gardes MAR obligatoires.
*   **(Système) :** Tente d'assigner le personnel aux salles ouvertes selon règles simples (ex: 1 MAR ou 1 IADE par salle simple).
*   **(Admin) :** Visualiser les conflits/manques après génération.
*   Implémentation des règles de base par secteur (Hyper/Inter/Septique).
*   Gestion des statuts OFF post-garde.

## Phase 3 : Affinement Algorithme, Équité et Règles Complexes

**Objectif :** Intégrer les notions d'équité (gardes, temps OFF), les compteurs, les règles de supervision et les règles spécifiques Ophtalmo/Endoscopie.

*   Implémentation des compteurs (Gardes, Temps OFF MAR).
*   Algorithme prend en compte l'équilibrage des gardes.
*   Algorithme prend en compte l'équilibrage du temps OFF.
*   Implémentation des règles de supervision MAR/IADE.
*   Implémentation des règles spécifiques Ophtalmo/Endoscopie.
*   Prise en compte du temps partiel dans l'équilibrage.
*   Gestion IADE Volant/Fermeture (base).

## Phase 4 : Fonctionnalités Utilisateur Avancées

**Objectif :** Ajouter les échanges, les requêtes spécifiques, et améliorer l'ergonomie.

*   Fonctionnalité d'échange d'affectations entre utilisateurs.
*   Fonctionnalité de requêtes spécifiques utilisateur.
*   Amélioration de la vue planning (filtres avancés, drag & drop admin).
*   Interface "Mon Profil / Mes Compteurs" complète.
*   Notifications plus détaillées.

## Phase 5 : Outils Admin et Configuration

**Objectif :** Donner plus de contrôle aux administrateurs sur la configuration de l'application.

*   Interface d'administration pour gérer les règles (seuils, ratios, etc.).
*   Interface pour gérer la trame chirurgien (saisie manuelle).
*   Gestion fine des compétences et préférences/interdits.
*   Outils de statistiques et reporting de base.
*   (Optionnel) Import/Synchro Google Sheets pour trame chirurgien.

## Phase 6 : Optimisations et Finalisation

**Objectif :** Optimiser les performances, améliorer l'interface, tester en profondeur et préparer le déploiement.

*   Optimisation des requêtes base de données.
*   Optimisation du frontend (responsive design mobile).
*   Tests de charge et de performance.
*   Améliorations UI/UX basées sur les retours.
*   Mise en place complète CI/CD et monitoring.
*   Documentation utilisateur finale.

## Aperçu des Phases

Le développement de MATHILDA se déroulera en 6 phases principales, chacune construisant sur les résultats de la précédente :

1. **Phase de Préparation et Architecture**
2. **Phase de Base de Données et Modélisation**
3. **Phase de Fonctionnalités Centrales**
4. **Phase de Fonctionnalités Avancées**
5. **Phase d'Intégration et d'Extensions**
6. **Phase de Finalisation et Déploiement**

## Phase 1 : Préparation et Architecture (4 semaines)

Cette phase initiale pose les fondations techniques du projet.

### Objectifs :
- Établir l'environnement de développement
- Définir l'architecture technique
- Mettre en place l'infrastructure de base

### Tâches principales :
1. **Semaine 1 : Mise en place de l'environnement**
   - Configuration du dépôt de code et du système de versioning
   - Mise en place des environnements de développement/test/production
   - Définition des standards de code et de documentation

2. **Semaine 2 : Architecture technique**
   - Conception détaillée de l'architecture applicative
   - Choix des frameworks et bibliothèques
   - Mise en place de la structure du projet

3. **Semaine 3 : Prototypage de base**
   - Développement d'une maquette fonctionnelle minimale
   - Mise en place de l'authentification basique
   - Configuration du routage principal

4. **Semaine 4 : Structure commune**
   - Développement des composants d'interface communs
   - Mise en place du système de navigation
   - Configuration du système de build et de déploiement

### Livrables :
- Dépôt de code configuré avec structure du projet
- Document d'architecture technique détaillé
- Premier prototype navigable (sans fonctionnalités réelles)
- Environnements de développement et test opérationnels

## Phase 2 : Base de Données et Modélisation (4 semaines)

Cette phase se concentre sur la création et la mise en place de la structure de données.

### Objectifs :
- Créer le modèle de données complet
- Mettre en place la base de données
- Développer les couches d'accès aux données

### Tâches principales :
1. **Semaine 1 : Conception du modèle**
   - Finalisation du schéma relationnel
   - Définition des contraintes d'intégrité
   - Planification des migrations et évolutions

2. **Semaine 2 : Mise en place de la base de données**
   - Création des scripts de création de schéma
   - Développement des migrations initiales
   - Création des données de test

3. **Semaine 3 : Couche d'accès aux données**
   - Développement des modèles et entités
   - Création des repositories/services d'accès
   - Mise en place du système de requêtes complexes

4. **Semaine 4 : Tests et optimisation**
   - Écriture des tests unitaires pour la couche données
   - Optimisation des requêtes principales
   - Validation du modèle avec des données réelles

### Livrables :
- Base de données opérationnelle avec schéma complet
- Couche d'accès aux données testée et documentée
- Jeux de données de test
- Documentation technique du modèle de données

## Phase 3 : Fonctionnalités Centrales (6 semaines)

Cette phase développe les fonctionnalités essentielles de l'application.

### Objectifs :
- Implémenter les fonctionnalités de base du planning
- Développer la gestion des utilisateurs et des profils
- Créer les interfaces principales

### Tâches principales :
1. **Semaine 1-2 : Gestion des utilisateurs**
   - Développement du système d'authentification complet
   - Création des interfaces de gestion des profils
   - Implémentation des permissions et rôles

2. **Semaine 3-4 : Visualisation des plannings**
   - Développement des interfaces de planning (jour/semaine/mois)
   - Création des filtres et options d'affichage
   - Implémentation de la navigation temporelle

3. **Semaine 5-6 : Gestion des affectations**
   - Développement des fonctionnalités d'affectation manuelle
   - Création des interfaces de détail d'affectation
   - Implémentation des validations basiques

### Livrables :
- Système complet d'authentification et de gestion des utilisateurs
- Interface fonctionnelle de visualisation des plannings
- Fonctionnalité de gestion manuelle des affectations
- Tests d'acceptance pour les fonctionnalités centrales

## Phase 4 : Fonctionnalités Avancées (8 semaines)

Cette phase implémente les règles métier complexes et les algorithmes d'affectation.

### Objectifs :
- Développer l'algorithme de génération automatique des plannings
- Implémenter les règles métier spécifiques
- Créer les fonctionnalités de gestion des congés et requêtes

### Tâches principales :
1. **Semaine 1-2 : Règles métier**
   - Implémentation des règles d'affectation par secteur
   - Développement des contraintes par rôle
   - Création du système de validation des règles

2. **Semaine 3-4 : Algorithme de planification**
   - Développement de l'algorithme de génération de planning
   - Intégration des contraintes de disponibilité
   - Tests avec différents scénarios

3. **Semaine 5-6 : Congés et absences**
   - Développement du système de demande/validation de congés
   - Implémentation des règles d'approbation automatique
   - Intégration avec le système de planification

4. **Semaine 7-8 : Échanges et requêtes**
   - Création du système de demandes d'échange
   - Développement des fonctionnalités de requêtes spécifiques
   - Gestion des notifications associées

### Livrables :
- Algorithme de génération automatique des plannings
- Système complet de gestion des congés et absences
- Fonctionnalités d'échange et de requêtes
- Documentation détaillée des règles métier implémentées

## Phase 5 : Intégration et Extensions (6 semaines)

Cette phase ajoute les fonctionnalités complémentaires et réalise l'intégration avec des systèmes externes.

### Objectifs :
- Développer les tableaux de bord et statistiques
- Implémenter les fonctionnalités de configuration
- Réaliser les intégrations externes (Google Sheets, etc.)

### Tâches principales :
1. **Semaine 1-2 : Tableaux de bord et statistiques**
   - Développement des compteurs (heures, gardes)
   - Création des tableaux de bord personnalisés
   - Implémentation des graphiques et visualisations

2. **Semaine 3-4 : Configuration et administration**
   - Développement des interfaces de configuration
   - Création du système de paramétrage des règles
   - Implémentation des outils d'administration

3. **Semaine 5-6 : Intégrations externes**
   - Développement de l'intégration avec Google Sheets
   - Création des fonctionnalités d'import/export
   - Mise en place des API pour systèmes externes

### Livrables :
- Tableaux de bord et système de statistiques
- Interface d'administration et de configuration
- Intégrations externes fonctionnelles
- Documentation des API et interfaces

## Phase 6 : Finalisation et Déploiement (4 semaines)

Cette phase prépare l'application pour la mise en production et effectue les derniers ajustements.

### Objectifs :
- Réaliser les tests complets du système
- Optimiser les performances
- Finaliser la documentation
- Déployer en production

### Tâches principales :
1. **Semaine 1 : Tests et qualité**
   - Exécution des tests d'intégration complets
   - Tests de performance et optimisations
   - Revue de sécurité

2. **Semaine 2 : Préparation au déploiement**
   - Finalisation de la documentation utilisateur
   - Préparation des environnements de production
   - Création des procédures de sauvegarde et restauration

3. **Semaine 3 : Formation et transition**
   - Formation des administrateurs
   - Préparation des supports de formation utilisateurs
   - Migration des données initiales

4. **Semaine 4 : Déploiement et suivi**
   - Déploiement en production
   - Support post-déploiement
   - Collecte des retours initiaux

### Livrables :
- Application complète testée et validée
- Documentation utilisateur et technique finalisée
- Matériel de formation
- Application déployée en production

## Jalons Principaux

Pour suivre l'avancement du projet, voici les jalons principaux à atteindre :

1. **J1 : Validation de l'Architecture** (fin Phase 1)
   - Architecture technique validée
   - Environnements configurés
   - Prototype initial développé

2. **J2 : Modèle de Données Opérationnel** (fin Phase 2)
   - Base de données en place
   - Couche d'accès aux données testée
   - Modèle validé avec les parties prenantes

3. **J3 : Plateforme de Base Fonctionnelle** (fin Phase 3)
   - Authentification et gestion des utilisateurs
   - Visualisation de planning
   - Affectation manuelle possible

4. **J4 : Moteur de Planification Opérationnel** (mi-Phase 4)
   - Algorithme de génération de planning fonctionnel
   - Règles métier implémentées
   - Validation par les utilisateurs clés

5. **J5 : Système Complet en Recette** (fin Phase 5)
   - Toutes les fonctionnalités développées
   - Intégrations externes réalisées
   - Système prêt pour les tests finaux

6. **J6 : Mise en Production** (fin Phase 6)
   - Application déployée
   - Utilisateurs formés
   - Procédures opérationnelles en place

## Gestion des Risques

Les principaux risques identifiés pour ce développement sont :

1. **Complexité de l'algorithme de planification**
   - *Mitigation* : Approche progressive, tests avec cas réels fréquents

2. **Évolution des règles métier pendant le développement**
   - *Mitigation* : Architecture flexible, approche agile, révisions régulières

3. **Performance avec de grandes quantités de données**
   - *Mitigation* : Tests de performance précoces, optimisations continues

4. **Adoption par les utilisateurs**
   - *Mitigation* : Implication des utilisateurs clés tout au long du développement, feedback régulier

## Notes sur l'Approche de Développement

- Une approche agile sera adoptée, avec des cycles de 2 semaines
- Des démos régulières aux parties prenantes seront organisées
- Les phases peuvent se chevaucher partiellement selon l'avancement
- Les estimations de durée seront ajustées en fonction des retours et de l'avancement réel 