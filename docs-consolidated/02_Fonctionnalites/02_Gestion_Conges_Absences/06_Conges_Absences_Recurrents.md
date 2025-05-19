# Congés et Absences Récurrents

## 1. Vue d'ensemble

Certains types de congés ou d'absences peuvent survenir de manière régulière et prévisible. Par exemple, un employé à temps partiel peut être systématiquement absent un jour fixe par semaine, ou un employé peut avoir une formation récurrente. Mathildanesth doit permettre de configurer ces récurrences pour simplifier la gestion et assurer leur prise en compte automatique dans la planification.

Cette fonctionnalité est distincte des "trames d'affectations" (qui concernent des activités planifiées) mais peut s'inspirer de mécanismes similaires pour définir la récurrence.

## 2. Cas d'Usage Typiques

- **Jours fixes non travaillés (temps partiel)** : Un employé à 80% ne travaille pas le mercredi.
- **Formation récurrente** : Un utilisateur suit une formation tous les premiers lundis du mois.
- **RTT ou jour de récupération fixe** : Un RTT planifié systématiquement un vendredi sur deux.
- **Activité syndicale régulière**.
- **Consultations externes régulières pour un praticien** (si celles-ci sont considérées comme une absence du planning principal).

## 3. Configuration d'une Absence Récurrente

### 3.1. Interface de Configuration

Accessible aux administrateurs/planificateurs, et potentiellement à l'utilisateur pour certains types d'absences récurrentes (ex: jour de temps partiel) si le profil le permet.

- **Champs de Configuration** :
    - **Utilisateur concerné**.
    - **Type de congé/absence** (lien vers `LeaveType`, ex: "Jour Non Travaillé Temps Partiel", "Formation Continue").
    - **Motif/Description**.
    - **Date de début de la récurrence**.
    - **Date de fin de la récurrence** (peut être indéfinie).
    - **Règle de Récurrence** :
        - **Hebdomadaire** : Choisir le(s) jour(s) de la semaine (Lundi, Mardi...). Spécifier si c'est toutes les semaines, toutes les 2 semaines, etc. (semaine paire/impaire si applicable).
        - **Mensuelle** : Choisir le quantième du mois (ex: le 15 de chaque mois) ou un jour spécifique (ex: le deuxième mardi de chaque mois).
        - **Annuelle** : Un jour spécifique chaque année (moins courant pour les absences, plus pour les anniversaires ou événements fixes).
    - **Période de la journée** (Optionnel) : Matin, Après-midi, Journée entière.
    - **Confirmation automatique** : Indiquer si ces absences récurrentes doivent être automatiquement créées dans le planning sans validation supplémentaire, ou si elles génèrent des "demandes pré-approuvées" que l'admin valide en lot.

### 3.2. Modèle de Données (Suggestion)

```typescript
interface RecurringLeave {
  id: string; // UUID
  userId: string;
  leaveTypeId: string;
  title?: string; // Ex: "Mercredi off (80%)"
  notes?: string;
  startDate: Date; // Date de début de la première occurrence
  endDate?: Date;   // Date de fin de la dernière occurrence (si applicable)
  
  // Règle de récurrence (basée sur iCalendar RRULE par exemple, ou structure custom)
  recurrenceRule: string; // Ex: "FREQ=WEEKLY;BYDAY=WE;INTERVAL=1" ou un JSON structuré
  
  durationDays?: number; // Si c'est toujours X jours
  isFullDay: boolean;
  period?: 'MORNING' | 'AFTERNOON'; // Si pas journée entière
  
  autoConfirm: boolean; // Si les instances sont auto-validées
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Instance d'une absence récurrente, pourrait être une entrée dans la table `Absence`
// avec un lien vers `RecurringLeave.id`
interface AbsenceInstanceFromRecurring {
  // ... champs d'une Absence normale ...
  recurringLeaveId?: string; 
  instanceDate: Date; // Date de cette occurrence spécifique
}
```

## 4. Génération des Instances d'Absence

- Un processus (automatisé, ex: batch nocturne, ou déclenché manuellement) parcourt les configurations d'absences récurrentes actives.
- Pour la période de planification à venir (ex: les 3 prochains mois), le système génère les instances d'absence individuelles.
- Ces instances sont enregistrées (potentiellement dans la même table que les absences ponctuelles, avec une référence à la règle de récurrence d'origine).
- Si `autoConfirm` est vrai, ces absences sont directement considérées comme validées et impactent le planning.
- Sinon, elles peuvent apparaître dans un tableau de bord pour validation groupée par un administrateur.

## 5. Visualisation

- Les absences récurrentes configurées sont visibles dans une section d'administration dédiée.
- Les instances générées apparaissent sur le planning de l'utilisateur et sur les vues globales comme n'importe quelle autre absence validée.

## 6. Modification et Suppression

- **Modification de la Règle de Récurrence** : Si la règle change (ex: un employé à temps partiel change son jour off), l'administrateur modifie la configuration `RecurringLeave`.
    - Le système doit alors proposer de mettre à jour les instances futures déjà générées (supprimer les anciennes, créer les nouvelles) ou seulement appliquer le changement pour les nouvelles instances à partir d'une certaine date.
- **Suppression de la Récurrence** : Met fin à la génération d'instances futures. Les instances passées restent (pour l'historique). Option pour supprimer les instances futures déjà générées.
- **Exception Ponctuelle** : Un utilisateur doit pouvoir annuler/modifier une SEULE instance de son absence récurrente (ex: exceptionnellement, il travaille son mercredi off). Cela doit se faire sur l'instance d'absence spécifique, sans modifier la règle de récurrence globale.

## 7. Intégration

- **Moteur de Planification** : Les instances d'absences récurrentes validées sont des indisponibilités prises en compte.
- **Calcul des Droits/Soldes** : Le type d'absence récurrente détermine si elle est décomptée d'un solde (ex: un RTT récurrent sera décompté, un jour non travaillé pour temps partiel ne l'est généralement pas d'un solde de congé payé mais d'un calcul de temps de travail).
- **Détection de Conflits** : La génération d'une instance d'absence récurrente peut être soumise à des règles de conflit (ex: si cela crée un manque critique de personnel ce jour-là, une alerte est levée).

La gestion des absences récurrentes fiabilise la planification à long terme et réduit la charge de saisie manuelle pour des absences prévisibles. 