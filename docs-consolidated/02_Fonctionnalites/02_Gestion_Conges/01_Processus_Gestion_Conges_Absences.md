# Processus de Gestion des Congés et Absences

## Introduction

La gestion des congés et des absences est une fonctionnalité essentielle de Mathildanesth. Elle permet au personnel de soumettre des demandes, aux administrateurs de les valider, et au système de prendre en compte ces indisponibilités lors de la génération des plannings. Ce document décrit le workflow général, de la demande à l'impact sur le planning.

Le module `Leaves` de `mathildanesth` est central ici, et la roadmap indique qu'il est déjà bien avancé (validation, quotas, notifications, détection de conflits).

## Types de Congés et Absences

Le système doit pouvoir gérer différents types de congés/absences, chacun pouvant avoir des règles de validation et de décompte spécifiques :

- **Congés Payés (CP)**
- **RTT**
- **Congés Formation**
- **Congés Événements Familiaux**
- **Congés Maladie / Absence Imprévue**
- **Congés Maternité/Paternité**
- **Congés Sans Solde**
- **Récupération**

Chaque type (`LeaveType` dans `prisma/schema.prisma`, configuré via `LeaveTypeSetting`) aura des propriétés (ex: nécessite justificatif, impact sur quotas, etc.).

## 1. Demande de Congés/Absences par l'Utilisateur

### Interface de Demande

- Les utilisateurs (MAR, IADE) doivent disposer d'une interface intuitive pour soumettre leurs demandes.
- Champs requis typiques :
  - Type de congé/absence.
  - Date de début (et heure si pertinent, ex: demi-journée).
  - Date de fin (et heure si pertinent).
  - Commentaire/motif (obligatoire pour certains types).
  - Possibilité de joindre un justificatif (pour absences maladie, etc.).
- **Affichage d'Informations Contextuelles :**
  - Visualisation de leurs propres congés déjà posés et validés sur la période.
  - Affichage du solde de jours restants pour les types de congés soumis à quota (`LeaveBalance`).
  - Potentiellement, une indication du nombre de collègues déjà en congé sur la période demandée (configurable si cette info est partagée à ce stade).
- La validation des dates elles-mêmes est gérée par le système de validation technique (voir `02_Validation_Dates_Technique.md`).

### Processus de Soumission

1.  L'utilisateur remplit le formulaire de demande.
2.  Le système effectue des validations initiales (ex: dates cohérentes, solde suffisant si applicable).
3.  La demande est enregistrée avec un statut "En attente de validation".
4.  Une notification est envoyée à l'administrateur/responsable concerné (voir `../11_Notifications/01_Systeme_Notifications.md` - _à créer_).

## 2. Validation des Congés/Absences par l'Administrateur

### Interface de Validation

- Les administrateurs (rôle spécifique) accèdent à une interface listant les demandes en attente.
- Pour chaque demande, afficher :
  - Nom du demandeur.
  - Type de congé, dates, motif.
  - Solde de jours du demandeur (si applicable).
  - Nombre d'autres personnes (du même corps de métier ou service) déjà en congé sur la période demandée.
  - Impact potentiel sur la couverture de service ou le planning (si des pré-calculs sont possibles).
- Options pour l'administrateur :
  - **Approuver** la demande.
  - **Refuser** la demande (avec commentaire obligatoire expliquant le motif).
  - Modifier la demande (avec accord du demandeur, ex: ajuster les dates).

### Critères de Validation (Exemples issus de `MATHILDA`)

- **Politique de l'établissement/service :** Quotas maximum de personnes en congé simultanément, périodes de restriction (ex: forte activité).
- **Ancienneté de la demande :** `MATHILDA` mentionne un système d'acceptation automatique si la demande est faite plus d'un mois à l'avance et si aucun autre personnel du même corps n'est déjà en congé. Cette règle doit être configurable.
- **Équité entre les membres de l'équipe.**
- **Impact sur la continuité du service.**

### Processus de Décision

1.  L'administrateur examine la demande et les informations contextuelles.
2.  L'administrateur prend une décision (Approuver/Refuser).
3.  La demande est mise à jour avec le nouveau statut et le commentaire de l'admin.
4.  Une notification est envoyée au demandeur pour l'informer de la décision.
5.  Si approuvée, le congé est enregistré comme une indisponibilité ferme pour la planification.

## 3. Gestion des Absences Imprévues (Maladie, etc.)

- **Saisie :** Doit pouvoir être saisie rapidement, soit par l'employé lui-même (si possible) soit par un administrateur/collègue.
- **Impact Immédiat :** L'absence doit immédiatement impacter le planning publié.
  - L'affectation de la personne absente doit être clairement marquée comme vacante ou à remplacer.
- **Proposition de Remplacement :**
  - Le système pourrait suggérer des remplaçants potentiels pour les affectations critiques laissées vacantes (voir `../12_Gestion_Remplacements/01_Processus_Remplacement.md` - _à créer_).
  - Alerte aux administrateurs pour gérer le remplacement.

## 4. Gestion des Quotas de Congés

- Le système doit gérer les droits à congés pour les types soumis à quotas (CP, RTT, etc.).
- **Modèle de Données :** `LeaveQuota`, `LeaveBalance`, `LeaveTypeSetting` (pour définir si un type est soumis à quota et le quota annuel par défaut).
- **Initialisation des Droits :** Processus pour créditer les jours en début de période (annuelle).
- **Décompte :** Les jours de congé validés sont décomptés du solde de l'utilisateur.
  - La logique de décompte doit gérer les week-ends, jours fériés, temps partiels (ex: un congé du lundi au vendredi pour un agent à 80% ne travaillant pas le mercredi compte pour 4 jours).
  - Le hook `useLeaveQuota` et le service `QuotaAdvancedService` semblent implémenter cette logique.
- **Gestion des Reports et Ajustements :** Possibilité pour les administrateurs d'ajuster les soldes (report de l'année N-1, crédit/débit exceptionnel).
  - `MATHILDA` mentionnait une table `LeaveQuotaAdjustment` (non présente dans le schéma actuel, mais la fonctionnalité pourrait être couverte par `QuotaTransfer`, `QuotaCarryOver`). Ce point est à clarifier dans la documentation de `mathildanesth`.

## 5. Impact sur la Planification

- Les congés et absences validés sont des **indisponibilités strictes** pour l'algorithme de génération de planning (`../03_Planning_Generation/02_Algorithme_Generation.md`).
- Ils sont affichés clairement sur toutes les vues de planning.
- La détection de conflits (`../03_Planning_Generation/04_Gestion_Conflits.md`) doit empêcher d'affecter une personne en congé.

## Fonctionnalités Complémentaires

- **Calendrier des Congés de l'Équipe :** Vue permettant de visualiser les congés de l'ensemble de l'équipe (avec filtres par service/rôle).
- **Historique des Demandes :** Pour l'utilisateur et l'administrateur.
- **Export des Données de Congés/Absences :** Pour reporting RH.

Ce processus s'appuie sur des composants techniques comme `LeaveForm.tsx`, `useLeaveCalculation`, `useLeaveQuota`, `LeaveService`, et les API routes associées (ex: `/api/leaves`, `/api/leaves/balance`).
