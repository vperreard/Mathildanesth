# Gestion des Quotas et Soldes de Congés

## 1. Vue d'ensemble

La gestion des quotas et des soldes de congés est essentielle pour assurer une répartition équitable des droits à absence et pour que les utilisateurs et les gestionnaires aient une visibilité claire sur les jours restants. Ce module s'intègre étroitement avec les demandes de congés et la paie (bien que Mathildanesth ne gère pas directement la paie, il fournit les informations nécessaires).

## 2. Types de Congés et Compteurs Associés

Le système doit pouvoir gérer plusieurs types de congés, chacun pouvant être associé à un compteur de solde spécifique pour chaque utilisateur. Exemples :

- **Congés Annuels (CA)**
- **Récupération du Temps de Travail (RTT)**
- **Congés pour Ancienneté**
- **Congés pour Événements Familiaux**
- **Compte Épargne Temps (CET)** (si applicable)
- **Congés Formation**

Certains types d'absences, comme les congés maladie ou les absences non payées, n'entrent pas dans les mêmes logiques de solde mais doivent être tracés.

## 3. Modèle de Données (`LeaveBalance` et `LeaveType`)

### 3.1. `LeaveType` (Type de Congé/Absence)

Un modèle (ou une configuration) `LeaveType` définit les caractéristiques de chaque type de congé :
- `id` : Identifiant unique.
- `name` : Nom du type de congé (ex: "Congés Annuels Payés").
- `code` : Code court (ex: "CA").
- `description` : Description.
- `trackedInBalance` (Boolean) : Indique si ce type de congé est décompté d'un solde (ex: `true` pour CA, `false` pour Maladie).
- `requiresApproval` (Boolean) : Si une demande de ce type nécessite une validation.
- `allowNegativeBalance` (Boolean) : Si le solde peut devenir négatif (rarement).
- `accrualPolicyId` (Optionnel) : Lien vers une politique d'acquisition de droits (ex: 2.08 jours de CA par mois).
- `maxDaysPerRequest` (Optionnel, Int) : Nombre maximum de jours pour une seule demande de ce type.
- `minNoticeDays` (Optionnel, Int) : Délai de prévenance minimum pour demander ce type de congé.

### 3.2. `LeaveBalance` (Solde de Congé Utilisateur)

Le modèle `LeaveBalance` (mentionné dans `01_Modele_Utilisateur.md`) stocke le solde pour un utilisateur et un type de congé donné :
- `id` : Identifiant unique.
- `userId` : Lien vers l'utilisateur.
- `leaveTypeId` : Lien vers le type de congé.
- `year` (Int) : Année de référence du solde (ex: 2023, 2024) pour les soldes annuels.
- `balance` (Float) : Nombre de jours/heures restants.
- `accrued` (Float) : Nombre de jours/heures acquis pour la période/année.
- `used` (Float) : Nombre de jours/heures utilisés.
- `lastUpdatedAt` (DateTime) : Dernière mise à jour du solde.

## 4. Acquisition des Droits à Congé

### 4.1. Politiques d'Acquisition

- Le système doit permettre de configurer comment les droits à congé sont acquis :
    - **Annuellement** : Un nombre fixe de jours crédité au début d'une période (ex: 25 jours de CA au 1er janvier).
    - **Mensuellement** : Un nombre fixe de jours crédités chaque mois (ex: 2.08 jours de CA).
    - **Basé sur le temps travaillé** : Pour certains types de RTT.
    - **Manuel** : Crédit manuel par un administrateur.
- Ces politiques peuvent dépendre du `ProfessionalRole`, de l'ancienneté, du temps de travail (% temps partiel).

### 4.2. Processus d'Actualisation des Soldes

- Un processus (automatisé ou manuel par un admin) met à jour les soldes en fonction des politiques d'acquisition.
- Par exemple, au début de chaque mois, créditer les jours de CA/RTT acquis.

## 5. Décompte des Congés Pris

- Lorsqu'un congé est validé et pris, le nombre de jours/heures correspondant est décompté du solde de l'utilisateur pour le type de congé approprié.
- La méthode de décompte (jours ouvrés, jours ouvrables, heures) doit être configurable par type de congé et/ou par politique d'établissement.
- Gestion des demi-journées : une demi-journée décompte 0.5 jour.

## 6. Gestion des Quotas Collectifs

Indépendamment des soldes individuels, des quotas collectifs peuvent être définis pour limiter le nombre total d'absents simultanés :

- **Par Service/Unité** : Ex: Pas plus de 2 IADEs absents en même temps dans le service de chirurgie A.
- **Par `ProfessionalRole`** : Ex: Pas plus de 3 MARs absents simultanément sur l'ensemble du site.
- **Par Période** : Les quotas peuvent varier selon les périodes de l'année (plus stricts en été ou pendant les vacances scolaires).
- Ces quotas sont vérifiés lors de la validation des demandes de congés (voir `02_Demandes_Conges.md` et `05_Detection_Conflits_Conges.md`).

## 7. Visualisation des Soldes et Quotas

### 7.1. Pour l'Utilisateur

- Accès à ses propres soldes de congés par type.
- Historique des jours acquis, pris, et restants.

### 7.2. Pour l'Administrateur/Planificateur

- Vue d'ensemble des soldes de tous les utilisateurs de son scope.
- Outils pour ajuster manuellement les soldes (avec audit trail).
- Configuration et visualisation des quotas collectifs.
- Rapports sur l'utilisation des congés, les soldes restants, etc.

## 8. Report de Congés et Péremption

- **Politiques de Report** : Le système doit pouvoir gérer si les congés non pris une année peuvent être reportés sur l'année suivante, et dans quelles limites (nombre de jours, date limite de prise).
- **Péremption** : Dates auxquelles les congés non pris sont perdus.
- Des notifications peuvent être envoyées aux utilisateurs avant la date de péremption de leurs congés.

## 9. Intégration

- **Module de Demande de Congés** : Le solde est vérifié lors de la demande.
- **Moteur de Planification** : Les absences validées impactent la disponibilité.
- **Export Paie** : Le système doit pouvoir exporter les données de congés pris pour traitement par le système de paie.

La gestion des quotas et des soldes est un aspect complexe mais fondamental pour une gestion RH transparente et équitable au sein de Mathildanesth. 