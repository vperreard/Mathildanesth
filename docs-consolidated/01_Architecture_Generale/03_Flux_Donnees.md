# Flux de Données Principaux

## Introduction

Comprendre les flux de données est essentiel pour appréhender le fonctionnement interne de Mathildanesth, de l'interaction utilisateur à la persistance des données et leur restitution. Ce document détaille quelques-uns des flux de données les plus significatifs.

## 1. Flux de Génération de Planning (Simplifié)

```mermaid
graph LR
    A[Administrateur] -- Demande génération --> B(Interface de Génération de Planning);
    B -- Paramètres (période, options) --> C{API Route: /api/planning/generate};
    C -- Appelle --> D[Service: PlanningGeneratorService];
    D -- Récupère règles --> E[Service: RuleEngineService];
    E -- Lit règles --> F[DB: RuleConfiguration];
    D -- Récupère données --> G[DB: User, Leave, Availability, AssignmentType, OperatingRoom, etc. via Prisma];
    D -- Calcule --> H(Logique Algorithmique de Génération);
    H -- Évalue solutions --> E;
    H -- Propose solutions --> C;
    C -- Retourne propositions --> B;
    B -- Affiche propositions --> A;
    A -- Sélectionne & Valide --> I{API Route: /api/planning/publish};
    I -- Sauvegarde planning --> J[DB: Assignment, PlanningState];
    I -- Notifie --> K[Service: NotificationService];
```

**Description des Étapes :**

1.  **Initiation :** L'administrateur initie la génération via l'UI, en spécifiant la période et d'autres options.
2.  **Requête API :** L'UI envoie une requête à l'API `/api/planning/generate`.
3.  **Appel au Service de Génération :** L'API Route transmet la demande au `PlanningGeneratorService`.
4.  **Collecte des Données :**
    - Le `PlanningGeneratorService` interroge le `RuleEngineService` pour obtenir les règles de planification actives.
    - Il récupère toutes les autres données nécessaires depuis la base via Prisma (informations sur le personnel, congés, disponibilités, types d'affectations, structure des salles, etc.).
5.  **Exécution de l'Algorithme :** L'algorithme de génération traite ces données, applique les règles et explore différentes solutions de planning.
6.  **Évaluation :** Les solutions candidates sont évaluées (respect des règles, équité, etc.).
7.  **Retour des Propositions :** Les meilleures propositions de planning sont retournées à l'UI.
8.  **Validation et Publication :** L'administrateur examine les propositions, en sélectionne une, et la valide pour publication.
9.  **Sauvegarde et Notification :** Le planning validé est sauvegardé en base de données, et des notifications sont envoyées aux utilisateurs concernés.

## 2. Flux de Demande et Validation de Congé

```mermaid
graph LR
    U[Utilisateur] -- Soumet demande --> F1(Formulaire de Demande de Congé);
    F1 -- Données du formulaire --> A1{API Route: /api/leaves};
    A1 -- Crée demande (statut: PENDING) --> DB1[DB: LeaveRequest];
    A1 -- Notifie Admin --> N1[Service: NotificationService];
    N1 -- Envoie notif --> AD(Administrateur);
    AD -- Consulte demandes --> F2(Interface Admin: Liste des Demandes);
    F2 -- Charge demandes --> A2{API Route: /api/leaves?status=PENDING};
    A2 -- Récupère données --> DB1;
    AD -- Approuve/Refuse via F2 --> A3{API Route: /api/leaves/:id/approve ou /api/leaves/:id/reject};
    A3 -- Met à jour statut --> DB1;
    A3 -- Ajuste quotas si besoin --> QS[Service: QuotaService];
    QS -- Met à jour --> DB2[DB: LeaveBalance];
    A3 -- Notifie Utilisateur --> N1;
    N1 -- Envoie notif --> U;
```

**Description des Étapes :**

1.  **Soumission :** L'utilisateur soumet une demande de congé via un formulaire.
2.  **Création de la Demande :** L'API `/api/leaves` enregistre la demande avec un statut "PENDING" et notifie l'administrateur.
3.  **Consultation Admin :** L'administrateur consulte la liste des demandes en attente.
4.  **Décision Admin :** L'administrateur approuve ou refuse la demande via l'API.
5.  **Mise à Jour :** Le statut de la demande est mis à jour. Si approuvée, le `QuotaService` peut être appelé pour ajuster les soldes de congés de l'utilisateur.
6.  **Notification Utilisateur :** L'utilisateur est notifié de la décision.

## 3. Flux d'Affichage d'un Planning Hebdomadaire

```mermaid
graph LR
    U[Utilisateur] -- Navigue vers Vue Hebdo --> P(Page Planning Hebdomadaire - Client Component);
    P -- Demande données (semaine S, filtres F) --> H1(Hook: useWeeklyPlanningData);
    H1 -- Appelle API (SWR/React Query) --> A1{API Route: /api/planning/weekly?week=S&filters=F};
    A1 -- Valide paramètres & droits --> S1[Service: PlanningQueryService / Prisma];
    S1 -- Récupère affectations, congés, etc. --> DB[DB: Assignment, Leave, User, etc.];
    A1 -- Retourne données formatées --> H1;
    H1 -- Fournit données --> P;
    P -- Rend le Calendrier/Grille --> UI(Affichage du Planning);
```

**Description des Étapes :**

1.  **Navigation :** L'utilisateur accède à la vue du planning hebdomadaire.
2.  **Récupération de Données (Client) :** Un composant client (ex: la page elle-même ou un composant `Calendar`) utilise un hook de récupération de données (ex: `useSWR` ou `TanStack Query` via un hook personnalisé `useWeeklyPlanningData`).
3.  **Appel API :** Le hook déclenche un appel à l'API `/api/planning/weekly`, en passant la semaine désirée et les filtres actifs.
4.  **Traitement Backend :** L'API Route valide les paramètres, vérifie les droits d'accès, puis interroge la base de données (directement avec Prisma ou via un service de requêtage dédié) pour récupérer toutes les informations pertinentes (affectations, congés, indisponibilités) pour la semaine et les filtres donnés.
5.  **Retour des Données :** Les données sont formatées et retournées au hook côté client.
6.  **Rendu UI :** Le composant React utilise les données reçues pour afficher la grille du planning.

## 4. Flux de Notification en Temps Réel (Exemple : Modification d'Affectation)

```mermaid
graph LR
    ADM[Administrateur] -- Modifie affectation X --> API_M{API Route: /api/assignments/:id};
    API_M -- Met à jour en BDD --> DB_A[DB: Assignment];
    API_M -- Publie événement --> EVB[Service: EventBusService - AssignmentUpdatedEvent(X)];
    NS[Service: NotificationService] -- S'abonne à EVB --> EVB;
    NS -- Reçoit AssignmentUpdatedEvent(X) --> D(Décide qui notifier pour X);
    NS -- Crée notification en BDD --> DB_N[DB: Notification];
    NS -- Envoie via WebSocket --> WSS[Service: WebSocketService];
    WSS -- Pousse notif aux clients connectés concernés --> UC(Client Utilisateur concerné);
    UC -- Reçoit notif --> UI_N(Affichage Notification In-App);
```

**Description des Étapes :**

1.  **Action Déclenchante :** Un administrateur modifie une affectation via une API.
2.  **Mise à Jour BDD :** L'affectation est mise à jour en base de données.
3.  **Publication d'Événement :** L'API publie un événement (ex: `AssignmentUpdatedEvent`) sur l'`EventBusService`.
4.  **Traitement par le Service de Notification :** Le `NotificationService`, abonné à cet événement, le reçoit.
5.  **Création et Envoi :** Le `NotificationService` détermine les utilisateurs à notifier, crée un enregistrement `Notification` en base, et utilise le `WebSocketService` pour pousser la notification en temps réel aux clients concernés.
6.  **Réception Client :** Le client de l'utilisateur reçoit la notification via WebSocket et l'affiche.

Ces flux illustrent l'interaction entre les composants frontend, le backend Next.js (API Routes, Server Actions), les services métier, la base de données, et les systèmes de communication comme l'EventBus et les WebSockets. Ils soulignent l'importance d'une architecture modulaire et découplée pour la maintenabilité et l'évolutivité.
