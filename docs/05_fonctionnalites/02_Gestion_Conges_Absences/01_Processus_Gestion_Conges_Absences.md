# Processus de Gestion des Congés et Absences

## 1. Introduction

La gestion des congés et des absences est une fonctionnalité centrale de Mathildanesth. Elle permet aux utilisateurs de soumettre des demandes, aux responsables de les valider, et au système de gérer les quotas, de détecter les conflits et d'assurer une couverture de service adéquate. Ce document décrit le processus global et les fonctionnalités associées.

Le module de gestion des congés dans `mathildanesth` est considéré comme complété (`docs/technique/NEXT_STEPS.md`) et inclut la validation, la gestion des quotas, les notifications, la détection de conflits et des recommandations de résolution.

## 2. Types de Congés et d'Absences

Le système gère différents types de congés et d'absences, configurables par les administrateurs (voir `LeaveTypeSetting` dans `prisma/schema.prisma` et le fichier `docs-consolidated/01_Architecture_Generale/../administration/03_Gestion_Types_Conges.md` - _à créer_).

Exemples courants :

- Congés Annuels (CA)
- Récupération du Temps de Travail (RTT)
- Congé Maladie (CM)
- Congé Maternité/Paternité
- Congé Sans Solde (CSS)
- Formation
- Participation à un congrès

Chaque type de congé peut avoir des règles spécifiques associées (ex: impact sur les quotas, nécessité de justificatif, délai de soumission).

## 3. Soumission d'une Demande de Congé/Absence

Les utilisateurs peuvent soumettre leurs demandes via une interface dédiée (`src/app/leaves/new/` ou via le module `src/modules/leaves/components/LeaveRequestForm.tsx`).

- **Informations Requises** :
  - Type de congé/absence.
  - Date de début et date de fin (avec heures si applicable, par exemple pour des demi-journées).
  - Motif/Commentaire (optionnel ou obligatoire selon le type).
- **Validation des Dates** : Le système effectue une validation initiale des dates (voir le document dédié aux aspects techniques de la validation des dates).
- **Détection Précoce des Conflits** : Lors de la saisie, le système peut indiquer des conflits potentiels avec d'autres absences ou des besoins de service, en s'appuyant sur des mécanismes de détection dédiés.
- **Calcul Prévisionnel des Jours Décomptés** : Le nombre de jours qui seront décomptés du quota peut être affiché.
- **Congés Récurrents** : Le système supporte la demande de congés récurrents (ex: tous les lundis pendant X semaines). Le modèle `Leave` inclut des champs comme `isRecurring` et `recurrencePattern`.
  - La finalisation du module de gestion des congés récurrents est une priorité (`docs/technique/NEXT_STEPS.md`).

## 4. Processus de Validation

Une fois soumise, une demande suit un workflow de validation.

- **Notification aux Responsables** : Les responsables désignés (planificateurs, chefs de service) sont notifiés d'une nouvelle demande.
- **Examen de la Demande** :
  - Vérification des informations.
  - Analyse des impacts sur le planning et la couverture de service.
  - Consultation des soldes de congés de l'utilisateur.
- **Décision** :
  - **Approuver** : La demande est validée. Le planning est mis à jour, les quotas sont impactés.
  - **Rejeter** : La demande est refusée, avec généralement un motif à fournir.
  - **Demander Modification** : Le responsable peut demander à l'utilisateur de modifier sa demande.
- **Notification à l'Utilisateur** : L'utilisateur est informé de la décision.
- **Historique et Suivi** : Toutes les étapes du processus sont tracées (`AuditLog`).

## 5. Gestion des Quotas

Le système gère les quotas de congés pour chaque utilisateur.

- **Attribution Initiale** : Les quotas sont attribués en début de période (ex: annuellement) en fonction du type de contrat, du temps de travail, et des règles de l'établissement.
- **Décompte Automatique** : Lorsqu'un congé est approuvé, les jours correspondants sont décomptés du solde de l'utilisateur.
  - Des hooks spécifiques sont utilisés pour ces calculs.
- **Consultation des Soldes** : Les utilisateurs peuvent consulter leurs soldes de congés restants.
- **Gestion Avancée (potentiel - voir `documentation/roadmap-dev-updated.md` Phase 4)** :
  - Transfert de quotas entre types de congés.
  - Report de congés d'une période à l'autre.

## 6. Détection et Gestion des Conflits

Un aspect crucial est la détection et la gestion des conflits, s'appuyant sur des hooks dédiés et des composants d'alerte spécifiques.

- **Types de Conflits Détectés** :
  - Demande de l'utilisateur avec ses propres absences/affectations existantes.
  - Nombre insuffisant de personnel d'un certain rôle/compétence sur une période donnée.
  - Dépassement des seuils maximum d'absents simultanés par service/équipe.
  - Non-respect des règles de planning (ex: pas de congé avant une garde).
- **Niveaux de Sévérité des Conflits** : Bloquant, Avertissement, Information.
- **Alertes et Visualisation** :
  - Les conflits sont signalés lors de la demande et de la validation, potentiellement via des composants d'alerte spécifiques.
  - Un tableau de bord des conflits peut exister pour une analyse globale.
- **Aide à la Résolution** : Le système peut proposer des recommandations pour résoudre les conflits (mentionné comme complété dans `docs/technique/NEXT_STEPS.md`).

## 7. Interaction avec le Planning

- Les congés approuvés sont automatiquement intégrés dans les différentes vues du planning.
- Ils sont pris en compte par l'algorithme de génération de planning comme des indisponibilités.

## 8. Annulation et Modification

- **Par l'Utilisateur** : Un utilisateur peut demander l'annulation ou la modification d'un congé déjà approuvé (soumis à validation).
- **Par le Responsable** : Dans certains cas, un responsable peut avoir besoin d'annuler ou de modifier un congé (avec notification et justification).

## 9. Interface d'Administration

Les administrateurs disposent d'outils pour :

- Configurer les types de congés et leurs règles.
- Gérer les quotas globaux et individuels (ajustements manuels si nécessaire).
- Consulter l'historique des demandes et des validations.
- Gérer les workflows de validation.

---

Ce processus vise à simplifier la gestion des congés tout en garantissant l'équité et la continuité du service.
