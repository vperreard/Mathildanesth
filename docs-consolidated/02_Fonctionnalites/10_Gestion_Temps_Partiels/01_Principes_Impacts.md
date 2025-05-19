# Gestion des Temps Partiels : Principes et Impacts sur la Planification

## 1. Introduction

La gestion du personnel à temps partiel est une composante essentielle d'un système de planification équitable et conforme. Mathildanesth doit prendre en compte les spécificités des contrats à temps partiel à plusieurs niveaux : définition des obligations de service, calcul des droits (congés), répartition de la charge de travail, et application des règles.

Le projet `MATHILDA` identifie la "Gestion des temps partiels" comme une fonctionnalité nécessaire.

## 2. Définition et Configuration du Temps Partiel

- **Niveau Utilisateur** : La quotité et les modalités du temps de travail sont des propriétés du profil utilisateur (`User` dans `prisma/schema.prisma`):
  - `tempsPartiel` (Boolean) : Indique si l'utilisateur est à temps partiel.
  - `pourcentageTempsPartiel` (Float, optionnel) : Si `tempsPartiel` est vrai, ce champ stocke la quotité (ex: 0.8 pour un 80%).
  - `workPattern` (Enum `WorkPatternType`) : Définit le modèle de travail :
    - `FULL_TIME` : Temps plein standard 
    - `FULL_TIME_WITH_FIXED_OFF_DAY` : **Temps plein avec jour(s) fixe(s) non travaillé(s)** (ex: MAR à temps plein travaillant 4 jours/semaine)
    - `ALTERNATING_WEEKS` : Alternance de semaines avec configurations différentes
    - `SPECIFIC_DAYS` : Jours spécifiques fixes (temps partiel ou autre organisation)
  - `joursTravaillesSemaineImpaire` et `joursTravaillesSemainePaire` (Json) : Pour les utilisateurs en `SPECIFIC_DAYS`, `ALTERNATING_WEEKS` ou `FULL_TIME_WITH_FIXED_OFF_DAY`, ces champs listent les jours travaillés de la semaine.

- **Cas spécifique des médecins à temps plein avec jours fixes non travaillés** : Il est important de noter que certains médecins (notamment les MARS) peuvent être considérés à temps plein mais travailler sur 4 jours par semaine, avec un jour fixe non travaillé. Cette configuration utilise `workPattern: FULL_TIME_WITH_FIXED_OFF_DAY` et les champs `joursTravaillesSemaineImpaire/Paire`, sans pour autant activer le flag `tempsPartiel`.

- **Temps Plein de Référence** : Le système doit connaître la base du temps plein dans l'établissement/service (ex: 35h, 39h hebdomadaires, ou un nombre d'heures annuelles) pour calculer correctement les obligations des temps partiels (ex: un 80% sur base 39h). Cette base de référence est une configuration générale du système ou du site/département.

- **Modalités du Temps Partiel via `workPattern` et jours spécifiques** :
  - **Jours Fixes Non Travaillés** : Peut être géré via `workPattern: SPECIFIC_DAYS` ou `workPattern: FULL_TIME_WITH_FIXED_OFF_DAY` et la configuration des `joursTravaillesSemainePaire/Impaire`, ou par la création d'[Indisponibilités Récurrentes](../../../modules/unavailability/types/index.ts) (à vérifier si un tel module existe et comment il s'intègre).
  - **Répartition sur la Semaine/Cycle** : Le `workPattern` (ex: `ALTERNATING_WEEKS`) et les jours spécifiques permettent de définir comment le volume horaire réduit est réparti.

## 3. Impact sur la Planification

### 3.1. Obligations de Service Réduites

- **Nombre d'Heures à Planifier** : L'algorithme de planification et les planificateurs doivent viser à atteindre la cible horaire de l'employé à temps partiel sur la période de référence (semaine, mois).
- **Nombre de Gardes/Astreintes** : Les obligations en termes de gardes, astreintes, et travail de week-end sont généralement proratisées en fonction de la quotité de temps de travail. Des règles spécifiques doivent pouvoir être appliquées.

### 3.2. Disponibilité pour les Affectations

- Si le temps partiel inclut des jours fixes non travaillés, l'utilisateur doit être marqué comme indisponible ces jours-là.
- Le système doit empêcher l'affectation sur ces jours d'indisponibilité, sauf dérogation explicite (heures complémentaires/supplémentaires).

### 3.3. Équité dans la Répartition

- L'équilibrage de la charge de travail ([`../03_Planning_Generation/03_Equilibrage_Optimisation.md`](../../03_Planning_Generation/03_Equilibrage_Optimisation.md)) doit tenir compte de la quotité de temps partiel pour comparer équitablement les utilisateurs.
  - Exemple : Un utilisateur à 80% ne devrait pas effectuer le même nombre absolu de gardes de week-end qu'un utilisateur à 100%, mais viser 80% de la moyenne du groupe à temps plein.
- Les compteurs d'équité doivent être normalisés ou interprétés en fonction du temps de travail.

## 4. Impact sur les Droits et Compteurs

### 4.1. Droits à Congés

- Les droits à congés payés annuels et autres types de congés sont gérés via le modèle `LeaveBalance` (champs `initial`, `used`, `remaining` pour un `userId`, `leaveType` et `year` donnés).
- La proratisation des droits initiaux en fonction du temps de travail (défini par `tempsPartiel`, `pourcentageTempsPartiel` sur le modèle `User`) doit être appliquée lors de la création ou de la mise à jour annuelle des enregistrements `LeaveBalance`.
- Le système de gestion des [Congés et Absences](../02_Gestion_Conges_Absences/01_Processus_Gestion_Conges_Absences.md) doit utiliser ces soldes proratisés.

### 4.2. Jours Fériés

- La gestion des jours fériés pour les temps partiels peut être complexe (si le jour férié tombe un jour habituellement non travaillé, etc.). Le système doit suivre les règles en vigueur.

### 4.3. Compteurs Horaires

- Le [Compteur Horaire](../../09_Compteurs_Suivi_Temps/01_Compteur_Horaire_MAR.md) doit utiliser le temps de travail théorique du temps partiel comme référence pour calculer les soldes (heures en plus/en moins).

## 5. Interface Utilisateur et Visualisation

- Le profil utilisateur doit clairement afficher la quotité de temps de travail.
- Les plannings doivent refléter les indisponibilités liées au temps partiel.
- Les rapports d'équité et les tableaux de bord doivent permettre de prendre en compte ou de filtrer par quotité de temps de travail pour des comparaisons pertinentes.

## 6. Points Clés d'Implémentation

- **Configuration Claire des Modalités de Temps Partiel sur `User`** : S'assurer que les champs `tempsPartiel`, `pourcentageTempsPartiel`, `workPattern`, et `joursTravaillesSemainePaire/Impaire` sont utilisés de manière cohérente pour définir les obligations et disponibilités.
- **Définition d'un Temps Plein de Référence** : Paramètre système ou par entité (site/département) nécessaire pour interpréter les `pourcentageTempsPartiel`.
- **Moteur de Règles Adaptable** : Le [Moteur de Règles](../../03_Planning_Generation/01_Moteur_Regles.md) doit pouvoir prendre en compte les informations de temps partiel du modèle `User` dans ses conditions et calculs.
- **Gestion des Indisponibilités Récurrentes** : Permettre de définir facilement les jours fixes non travaillés pour les temps partiels concernés.

---

La prise en compte adéquate des temps partiels est un gage d'équité et de respect des contrats. Elle complexifie la planification mais est indispensable dans la plupart des organisations de santé.
