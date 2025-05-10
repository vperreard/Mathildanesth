# Sécurité et Permissions dans Mathildanesth

## Introduction

La sécurité des données et la gestion fine des permissions sont des aspects critiques pour Mathildanesth, manipulant des informations sensibles sur le personnel et la planification. Ce document détaille l'approche de sécurité et le système de gestion des rôles et permissions.

## Principes de Sécurité

L'application est conçue en gardant à l'esprit les principes de sécurité suivants :

- **Défense en Profondeur :** Multiples couches de sécurité (authentification, autorisation, validation des entrées, infrastructure sécurisée).
- **Moindre Privilège :** Les utilisateurs ne disposent que des permissions strictement nécessaires à l'accomplissement de leurs tâches.
- **Validation Systématique des Entrées :** Toutes les données provenant du client ou de sources externes sont validées côté serveur (avec Zod) pour prévenir les injections (SQL, XSS) et autres attaques.
- **Protection contre les Vulnérabilités Courantes :** Prise en compte des risques OWASP Top 10 (ex: utilisation de requêtes paramétrées avec Prisma pour éviter les injections SQL, configuration des headers HTTP pour la sécurité).
- **Sécurité des Dépendances :** Suivi et mise à jour régulière des dépendances pour corriger les vulnérabilités connues.
- **Journalisation des Événements de Sécurité :** Les actions sensibles et les tentatives d'accès non autorisé sont journalisées (voir `04_Gestion_Erreurs_Logging.md` et `../02_Fonctionnalites/16_Historisation_Audit/01_Journal_Activite_Historique.md`).

## Authentification

- **Mécanisme :** [NextAuth.js](https://next-auth.js.org/) (Auth.js) est utilisé pour gérer l'authentification.
- **Fournisseurs d'Identité :**
  - Initialement, un fournisseur d'identifiants (email/mot de passe) est implémenté.
  - Possibilité d'étendre à d'autres fournisseurs (OAuth, SSO) si nécessaire.
- **Stockage des Mots de Passe :** Les mots de passe sont hashés (ex: bcrypt) avant d'être stockés en base de données. Jamais de stockage en clair.
- **Gestion des Sessions :** NextAuth.js gère les sessions utilisateur de manière sécurisée (ex: JWT stockés dans des cookies httpOnly).
- **Protection contre les Attaques de Force Brute :** Des mécanismes de limitation de taux (rate limiting) sur les tentatives de connexion peuvent être ajoutés.
- **Authentification à Deux Facteurs (2FA) :** Envisagée pour une phase ultérieure afin de renforcer la sécurité des comptes administrateurs (`documentation/roadmap-dev-updated.md`).

## Autorisation : Rôles et Permissions

Un système basé sur les rôles (RBAC - Role-Based Access Control) est implémenté pour gérer les permissions.

### 1. Définition des Rôles

Plusieurs rôles utilisateurs sont définis, chacun avec un ensemble de permissions spécifiques. Exemples de rôles :

- **`USER` (Utilisateur Standard) :**
  - Peut consulter son propre planning.
  - Peut soumettre des demandes de congés.
  - Peut proposer des échanges d'affectations.
  - Peut voir les commentaires journaliers.
- **`MAR_USER` (Médecin Anesthésiste-Réanimateur) :** Hérite de `USER` + permissions spécifiques si besoin.
- **`IADE_USER` (Infirmier Anesthésiste) :** Hérite de `USER` + permissions spécifiques si besoin.
- **`PLANNING_ADMIN` (Administrateur de Planning) :**
  - Peut générer, modifier et publier les plannings.
  - Peut valider/refuser les demandes de congés et d'échanges.
  - Peut gérer les indisponibilités.
  - Peut gérer les affectations et les remplacements.
  - Peut accéder aux statistiques d'équipe.
- **`SYSTEM_ADMIN` (Administrateur Système) :**
  - Peut gérer les comptes utilisateurs (créer, modifier, supprimer, assigner des rôles).
  - Peut configurer les paramètres globaux de l'application (types de congés, règles de base, etc.).
  - Peut gérer le référentiel de compétences.
  - A accès aux journaux d'audit complets.
- **`REMPLACANT` (Personnel Remplaçant) :**
  - Peut indiquer ses disponibilités.
  - Peut consulter les affectations qui lui sont proposées.

### 2. Modèle de Données pour Rôles et Permissions

- `User` : Table des utilisateurs.
- `Role` : Table des rôles (ex: `id`, `name`, `description`).
- `UserRole` : Table de liaison entre `User` et `Role` (un utilisateur peut avoir plusieurs rôles, bien qu'un rôle principal soit souvent suffisant).
- `Permission` (Optionnel, pour une granularité plus fine) : Table des permissions individuelles (ex: `id`, `action`, `resource`).
- `RolePermission` (Optionnel) : Table de liaison entre `Role` et `Permission`.

La roadmap et `NEXT_STEPS.md` mentionnent un "système de permissions granulaires" comme étant complété. Le schéma Prisma devrait refléter cette structure (`Role`, `UserRole`).

### 3. Application des Permissions

- **Côté Backend (API Routes, Server Actions) :**
  - Des middlewares ou des vérifications en début de chaque handler d'API/action serveur vérifient si l'utilisateur authentifié (via `getServerSession` de NextAuth.js) a le rôle/la permission requis(e) pour effectuer l'action.
  - En cas de non-autorisation, une réponse HTTP 403 (Forbidden) est retournée.
- **Côté Frontend (UI) :**
  - L'interface utilisateur est adaptée en fonction des permissions de l'utilisateur connecté.
  - Des éléments d'interface (boutons, menus, sections de page) peuvent être masqués ou désactivés si l'utilisateur n'a pas les droits nécessaires.
  - Ceci est une amélioration de l'UX, mais la véritable sécurité est assurée côté serveur.
  - Des hooks comme `usePermissions` pourraient être utilisés pour vérifier les droits côté client.

## Protection des Données

- **HTTPS :** Toute communication entre le client et le serveur doit se faire via HTTPS pour chiffrer les données en transit.
- **Sécurité de la Base de Données :**
  - Accès à la base de données limités et sécurisés (identifiants forts, pare-feu).
  - Sauvegardes régulières et sécurisées de la base de données.
- **Conformité RGPD (Règlement Général sur la Protection des Données) :**
  - Les principes du RGPD (minimisation des données, droit à l'oubli, consentement, etc.) doivent être pris en compte, surtout si des données personnelles sensibles sont gérées.
  - La roadmap mentionne des vérifications de conformité RGPD.

## Sécurité de l'Infrastructure (Hypothèses de Déploiement)

- **Pare-feu Réseau.**
- **Détection d'Intrusion.**
- **Mises à Jour Régulières** du système d'exploitation et des logiciels serveur.
- **Isolation des Environnements** (développement, pré-production, production).

## Conclusion

La sécurité et la gestion des permissions sont des piliers de Mathildanesth. L'utilisation de NextAuth.js, un système RBAC robuste, la validation systématique des entrées et le respect des bonnes pratiques de développement sécurisé contribuent à protéger l'application et ses données. Une vigilance continue et des mises à jour régulières sont nécessaires pour maintenir un haut niveau de sécurité.
