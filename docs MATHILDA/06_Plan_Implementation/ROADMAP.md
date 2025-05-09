# Roadmap MATHILDA

Ce document suit l'avancement global du projet MATHILDA.

## Statuts

*   ⚪️ À Faire
*   🟡 En Cours
*   🟢 Terminé
*   ⚫️ Bloqué / En Attente

## Phases du Projet

### 1. Initialisation et Documentation (🟢 Terminé)

*   [🟢] Définition de la structure du projet et des outils initiaux (Docker, Git)
*   [🟢] Élaboration des choix technologiques principaux
*   [🟢] Création de la structure de documentation
*   [🟢] Description de l'architecture technique générale
*   [🟢] Ébauche des principes de conception de l'API
*   [🟢] Ébauche des considérations de sécurité
*   [🟢] **Définition détaillée du modèle de données** (`docs/03_Modele_Donnees/`)
    *   [🟢] Schéma de base de données initial (`01_Schema_Base_Donnees.md`)
    *   [🟡] Intégration des précisions sur les entités et compteurs
*   [🟢] **Définition des règles métier spécifiques** (`docs/05_Regles_Metier/`)
    *   [🟢] Règles de planification initiales (`01_Regles_Planification.md`)
    *   [🟢] Règles de configuration initiales (`02_Regles_Configuration.md`)
    *   [🟡] Intégration des précisions (équité, pédiatrie, génération, compteurs, proratisation...)
*   [🟢] **Finalisation des spécifications fonctionnelles** (`docs/01_Specifications_Fonctionnelles/`)
    *   [🟢] Profils utilisateurs (`01_Profils_Utilisateurs.md`)
    *   [🟢] Fonctionnalités principales/secondaires (`02_...`, `03_...`)
    *   [🟢] Création doc Gestion Droits (`04_Gestion_Droits.md`)
    *   [🟢] Création doc Notifications (`05_Notifications.md`)
    *   [🟢] Création doc Historique/Audit (`06_Historique_Audit.md`)
    *   [🟢] Création doc Imports/Exports (`07_Imports_Exports.md`)
    *   [🟢] Création doc Reporting (`08_Reporting.md`)
    *   [🟢] Création doc Gestion Erreurs (`09_Gestion_Erreurs.md`)
    *   [🟢] Création doc Exigences Non Fonctionnelles (`10_Exigences_Non_Fonctionnelles.md`)
    *   [🟢] Création doc Livrables Non-Fonctionnels (`11_Non_Functional_Deliverables.md`)
    *   [🟢] Revue et validation globale des spécifications
*   [🟢] **Spécification détaillée des endpoints de l'API** (`docs/02_Architecture_Technique/03_API_Design.md`)
    *   [🟢] Définition des principes et endpoints clés
    *   [🟢] Endpoints détaillés pour configuration (Sites, Secteurs, Salles...)
    *   [🟢] Endpoints pour fonctionnalités avancées (Notifications, Échanges, Audit...)
    *   [🟢] Création fichier spécification OpenAPI (`04_API_Specification.yaml`)
*   [🟢] **Description des interfaces utilisateur** (`docs/04_Interfaces_Utilisateur/`)
    *   [🟢] Vue Planning (`01_Vue_Planning.md`)
    *   [🟢] Panneau de Configuration (`03_Panneau_Configuration.md`)
    *   [🟢] Parcours Utilisateurs (`04_Parcours_Utilisateurs.md`)
    *   [🟢] Maquettes détaillées 
        *   [🟢] Vue Planning (`02_Maquettes_Vue_Planning.md`)
        *   [🟢] Gestion Congés et Échanges (`05_Maquettes_Conges_Echanges.md`)
    *   [🟢] Création du Design System (`06_Design_System.md`)
*   [🟢] **Création des guides de développement et contribution**
    *   [🟢] Mise à jour `README.md` (Guide dev)
    *   [🟢] Création `CONTRIBUTING.md` (Conventions & QA)
*   [🟢] **Création du guide de déploiement** (`docs/07_Deployment_Production/01_Deployment_Guide.md`)

### 2. Développement Backend (⚪️ À Faire)

*   [🟡] Mise en place du projet Node.js/Express avec TypeScript (Next.js API routes pour `mathilda-app` en cours)
*   [⚪️] Configuration de Prisma et migration initiale de la base de données
*   [🟡] Implémentation de l'authentification (JWT / NextAuth.js backend part - API Users basique créée, NextAuth route à faire)
*   [⚪️] Développement des endpoints API (CRUD utilisateurs, gestion planning, congés...)
*   [⚪️] Implémentation des règles métier critiques (ex: équité planning)
*   [⚪️] Mise en place des tests unitaires et d'intégration

### 3. Développement Frontend (🟡 En Cours)

*   [🟢] Mise en place du projet Next.js avec TypeScript (`mathilda-app` initialisé)
*   [🟢] Configuration de Chakra UI et du thème (Provider et layout de base en place)
*   [🟡] **Authentification Client (NextAuth.js)**
    *   [🟢] Page de connexion (`login/page.tsx`) avec appel `signIn`
    *   [🟢] `SessionProvider` configuré
    *   [🟢] Page `dashboard` affichant les infos de session
    *   [⚪️] Création du handler NextAuth `src/app/api/auth/[...nextauth]/route.ts` (côté `mathilda-app`)
    *   [⚪️] Protection des routes via middleware ou vérifications client
    *   [⚪️] Gestion complète de la déconnexion
*   [⚪️] **Visualisation de Planning (FullCalendar)**
    *   [⚪️] Installation et configuration de FullCalendar
    *   [⚪️] Création d'une page `/planning`
    *   [⚪️] Affichage d'un calendrier de base
    *   [⚪️] Affichage des affectations (données statiques pour commencer)
*   [🟡] Développement des composants UI (Login, Tableau de bord, Layout principal en place, autres formulaires à venir)
*   [⚪️] Connexion au backend via l'API (pour les fonctionnalités autres que l'auth)
*   [⚪️] Gestion de l'état global (Zustand - hooks et stores à créer)
*   [⚪️] Implémentation du mode consultation hors-ligne (PWA ?)
*   [⚪️] Implémentation des tests composants et end-to-end (Cypress)

### 4. Intégration et Tests (⚪️ À Faire)

*   [⚪️] Configuration de la CI/CD avec GitHub Actions
*   [⚪️] Tests complets d'intégration Frontend/Backend
*   [⚪️] **Création de jeux de données de test réalistes** (basés sur plannings existants) pour l'algorithme de génération.
*   [⚪️] **Tests de performance (charge, profiling algo)** si nécessaire
*   [⚪️] Revue de sécurité
*   [⚪️] **Tests d'accessibilité (basiques)**

### 5. Déploiement (À Faire)

*   [⚪️] Choix de la plateforme d'hébergement (ex: Heroku, Scalingo, AWS, Azure...)
*   [⚪️] Configuration de l'environnement de production
*   [⚪️] Processus de déploiement automatisé
*   [⚪️] Mise en place de la supervision et des logs

### 6. Maintenance et Évolution (À Faire)

*   [⚪️] Correction de bugs post-lancement
*   [⚪️] Ajout de nouvelles fonctionnalités selon les retours 