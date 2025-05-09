# Diagramme d'Architecture

Ce document présente l'architecture technique de MATHILDA à travers différents diagrammes et explications.

## 1. Vue d'Ensemble de l'Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (NAVIGATEUR)                     │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Interface  │  │  État Local │  │ Logique Présentation│  │
│  │  Utilisateur │  │   (Zustand) │  │    (React Query)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS/REST (vers API Routes Next.js ou Backend Dédié)
                            ▼
┌─────────────────────────────────────────────────────────────┐ ┌───────────────────────────────────────────┐
│      mathilda-app (Next.js API Routes + Prisma Client)      │ │       Backend Dédié (Express + Prisma)      │
│                                                             │ │            (Optionnel/Futur)              │
│      Logique serveur pour authentification, CRUD, etc.      │ │  Logique métier complexe, microservices   │
└───────────────────────────┬─────────────────────────────────┘ └───────────────────┬───────────────────────┘
                            │                                                       │
                            ▼                                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             BASE DE DONNÉES                                               │
│                                                PostgreSQL                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

MATHILDA suit une architecture distribuée comprenant principalement :

1.  **Application Web Principale (`mathilda-app`)** : Application Next.js (React) full-stack exécutée dans le navigateur (frontend) et sur le serveur (API routes Next.js). Elle gère l'interface utilisateur, l'état client, et certaines logiques backend via ses propres API routes (notamment pour l'authentification et les fonctionnalités directement intégrées). Ces API routes peuvent interagir directement avec la base de données via Prisma.
2.  **Backend Dédié (Optionnel/Futur - `MATHILDA/backend/`)** : Une API RESTful Node.js/Express, destinée à héberger des logiques métier plus complexes, des tâches de fond, ou des microservices. Elle interagit également avec la base de données via Prisma.
3.  **Base de données** : PostgreSQL pour le stockage persistant des données.

La communication entre le frontend `mathilda-app` et ses propres API routes Next.js est gérée en interne par Next.js. La communication entre le frontend `mathilda-app` et le Backend Dédié (lorsqu'il sera utilisé) se fera via des API REST sécurisées.

## 2. Architecture Détaillée du Frontend

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (REACT + TYPESCRIPT)                    │
│                                                                         │
│  ┌─────────────────┐   ┌────────────────┐   ┌─────────────────────────┐ │
│  │    Composants   │   │                │   │      Navigation         │ │
│  │    Partagés     │◄──┤     Pages      │◄──┤    React Router         │ │
│  │                 │   │                │   │                         │ │
│  └────────┬────────┘   └───────┬────────┘   └─────────────────────────┘ │
│           │                    │                          ▲              │
│           │                    │                          │              │
│           │            ┌───────▼────────┐                 │              │
│           │            │                │                 │              │
│           └────────────►   Hooks API    ├─────────────────┘              │
│                        │                │                                │
│                        └───────┬────────┘                                │
│                                │                                         │
│  ┌─────────────────┐   ┌───────▼────────┐   ┌─────────────────────────┐ │
│  │    Zustand      │   │  React Query   │   │      Services API        │ │
│  │   État Local    │◄──┤   État Serveur  │◄──┤     Axios / Fetch        │ │
│  │                 │   │                │   │                         │ │
│  └─────────────────┘   └────────────────┘   └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                              API REST BACKEND
```

### Composants Principaux :

1. **Pages** : Composants de haut niveau pour chaque vue de l'application
   - Dashboard (tableau de bord)
   - Planning (vue calendrier)
   - Administration
   - Gestion des congés/absences
   - Profil utilisateur

2. **Composants Partagés** : Éléments d'interface réutilisables
   - Calendrier (basé sur FullCalendar)
   - Modales de confirmation
   - Formulaires
   - Notifications

3. **Hooks API** : Logique partagée entre composants

4. **État** :
   - **Zustand** : Pour l'état local et les préférences utilisateur
   - **React Query** : Pour la gestion du cache des données serveur

5. **Services API / Logique d'accès aux données** : Communication avec les sources de données, ce qui peut inclure :
   - Appels aux API routes internes de Next.js (dans `mathilda-app/src/app/api/`) qui utilisent Prisma.
   - Appels à un Backend Dédié externe (API REST du dossier `MATHILDA/backend/`) pour des logiques métier spécifiques.

## 3. Architecture Détaillée du Backend Dédié (Optionnel/Futur - `MATHILDA/backend/`)

> Cette section décrit l'architecture du backend Node.js/Express dédié, qui est optionnel et destiné à des logiques métier complexes ou des microservices futurs. Pour la logique backend gérée directement par `mathilda-app` via ses API Routes Next.js (incluant l'authentification avec NextAuth.js), se référer au document `03_Structure_Projet_Code.md` qui détaille la structure de `mathilda-app/`.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       BACKEND (NODE.JS + EXPRESS + TYPESCRIPT)          │
│                                                                         │
│  ┌─────────────────┐   ┌────────────────┐   ┌─────────────────────────┐ │
│  │                 │   │                │   │                         │ │
│  │    Middlewares  │◄──┤     Routes     │◄──┤    Contrôleurs          │ │
│  │                 │   │                │   │                         │ │
│  └─────────────────┘   └───────┬────────┘   └───────────┬─────────────┘ │
│                                │                        │               │
│                                │                        │               │
│                        ┌───────▼────────────────────────▼─────────┐     │
│                        │                                          │     │
│                        │              Services                    │     │
│                        │          (Logique Métier)               │     │
│                        │                                          │     │
│                        └───────┬────────────────────────┬────────┘     │
│                                │                        │               │
│  ┌─────────────────┐   ┌───────▼────────┐   ┌───────────▼─────────────┐ │
│  │                 │   │                │   │                         │ │
│  │   Validateurs   │   │    Modèles     │   │       Utilitaires       │ │
│  │      (Zod)      │   │    (Prisma)    │   │                         │ │
│  │                 │   │                │   │                         │ │
│  └─────────────────┘   └────────────────┘   └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                                PostgreSQL
```

### Composants Principaux :

1. **Middlewares** : Fonctions intermédiaires pour le traitement des requêtes
   - Validation des entrées (par exemple avec Zod)
   - Logging
   - Gestion des erreurs
   - (Potentiellement, middlewares de sécurité spécifiques, gestion de droits si ce backend gère des ressources protégées non couvertes par l'authentification principale de `mathilda-app`)

2. **Routes** : Définition des endpoints de l'API
   - Utilisateurs
   - Plannings
   - Congés
   - Administration
   - Etc.

3. **Contrôleurs** : Logique de traitement des requêtes HTTP

4. **Services** : Logique métier pure
   - Service de planification (implémentation des règles complexes)
   - Service utilisateur
   - Service de notification
   - Etc.

5. **Modèles** : Interaction avec la base de données via Prisma ORM

6. **Validateurs** : Validation des données entrantes avec Zod

## 4. Schéma de la Base de Données

Le schéma détaillé de la base de données est disponible dans le document [Modèle de Données](../03_Modele_Donnees/01_Schema_Base_Donnees.md).

## 5. Flux d'Authentification

```
┌──────────┐                  ┌──────────┐                  ┌──────────┐
│          │                  │          │                  │          │
│  Client  │                  │  Serveur │                  │  Base de │
│          │                  │          │                  │  Données │
└────┬─────┘                  └────┬─────┘                  └────┬─────┘
     │                             │                             │
     │ 1. Tentative de connexion   │                             │
     │ (email/mot de passe)        │                             │
     │ ─────────────────────────► │                             │
     │                             │                             │
     │                             │ 2. Vérification             │
     │                             │ ─────────────────────────► │
     │                             │                             │
     │                             │ 3. Résultat                 │
     │                             │ ◄───────────────────────── │
     │                             │                             │
     │                             │ 4. Création JWT si valide   │
     │                             │                             │
     │ 5. Retour JWT + Cookie      │                             │
     │ ◄───────────────────────── │                             │
     │                             │                             │
     │ 6. Requêtes API avec JWT    │                             │
     │ ─────────────────────────► │                             │
     │                             │ 7. Vérification JWT         │
     │                             │                             │
     │ 8. Réponse API              │                             │
     │ ◄───────────────────────── │                             │
     │                             │                             │
```

> **Note sur le flux d'authentification :** Dans ce diagramme, le "Client" fait référence au navigateur exécutant le frontend de `mathilda-app`. Le "Serveur" fait référence aux API Routes de Next.js hébergées au sein de `mathilda-app` (par exemple, `/api/auth/...` gérées par NextAuth.js), qui interagissent ensuite avec la "Base de Données" via Prisma.

## 6. Architecture de Déploiement

```
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│                   ENVIRONNEMENT DE PRODUCTION                     │
│                      (RENDER/RAILWAY)                             │
│                                                                   │
│   ┌───────────────────────────────┐      ┌────────────────┐       │
│   │ Application Web `mathilda-app`  │      │ Backend Dédié  │       │
│   │ (Next.js - Frontend & API Routes)│◄────►│   (Node.js)    │       │
│   └──────────────┬────────────────┘      │ (Optionnel/    │       │
│                  │                       │    Futur)      │       │
│                  │                       └───────┬────────┘       │
│                  │                               │                │
│                  └─────────────┬─────────────────┘                │
│                                │                                  │
│                       ┌────────▼────────┐                         │
│                       │   PostgreSQL    │                         │
│                       └─────────────────┘                         │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                                   ▲
                                   │
                                   │
┌──────────────────────────────────┴──────────────────────────────┐
│                                                                 │
│                    CI/CD (GITHUB ACTIONS)                       │
│                                                                 │
│  ┌────────────────┐     ┌────────────────┐    ┌──────────────┐  │
│  │                │     │                │    │              │  │
│  │    Tests       │────►│    Build       │───►│  Déploiement │  │
│  │                │     │                │    │              │  │
│  └────────────────┘     └────────────────┘    └──────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 7. Environnement de Développement (Docker)

```
┌───────────────────────────────────────────────────────────────────┐
│                                                                   │
│                   DOCKER COMPOSE (DEV)                            │
│                                                                   │
│   ┌────────────────┐      ┌────────────────┐                      │
│   │  Container     │      │  Container     │                      │
│   │   Frontend     │◄────►│   Backend      │                      │
│   │   (Vite)       │      │  (Node.js)     │                      │
│   │                │      │                │                      │
│   └────────────────┘      └───────┬────────┘                      │
│         Port 3000                 │         Port 8000             │
│                                   │                               │
│                           ┌───────▼────────┐                      │
│                           │  Container     │                      │
│                           │  PostgreSQL    │                      │
│                           │                │                      │
│                           └────────────────┘                      │
│                                Port 5432                          │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

L'environnement de développement local utilisera Docker Compose pour créer trois conteneurs :

1. **Frontend** : Serveur de développement React avec Vite
2. **Backend** : Serveur API Node.js/Express avec redémarrage automatique
3. **Base de données** : Instance PostgreSQL avec volumes persistants

Cela garantit un environnement cohérent entre les développeurs et proche de la production.

## 8. Communication entre Services

L'application utilise plusieurs types de communication :

1. **Client → Serveur** : Requêtes HTTP/REST JSON
2. **Serveur → Base de données** : Requêtes SQL via Prisma ORM
3. **Intra-Serveur** : Communication directe entre modules via injection de dépendances

## 9. Sécurité de l'Architecture

La sécurité est intégrée à tous les niveaux :

1. **Transport** : HTTPS obligatoire
2. **Authentification** : NextAuth.js avec JWT
3. **Autorisation** : Contrôle d'accès basé sur les rôles
4. **Validation des entrées** : Zod côté serveur + validation frontend
5. **Protection contre attaques classiques** : CSRF, XSS, injections SQL
6. **Rate limiting** : Protection contre les attaques par force brute 