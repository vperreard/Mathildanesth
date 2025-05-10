# Gestion des Temps Partiels : Principes et Impacts sur la Planification

## 1. Introduction

La gestion du personnel à temps partiel est une composante essentielle d'un système de planification équitable et conforme. Mathildanesth doit prendre en compte les spécificités des contrats à temps partiel à plusieurs niveaux : définition des obligations de service, calcul des droits (congés), répartition de la charge de travail, et application des règles.

Le projet `MATHILDA` identifie la "Gestion des temps partiels" comme une fonctionnalité nécessaire.

## 2. Définition et Configuration du Temps Partiel

- **Niveau Utilisateur** : La quotité de temps de travail est une propriété du profil utilisateur (`User`):
  - Le champ `User.workingHours` (String) dans `prisma/schema.prisma` peut stocker cette information (ex: "80%", "28h/semaine", ou une référence à un cycle de travail spécifique).
  - Il est crucial de définir clairement comment ce champ est interprété (pourcentage d'un temps plein de référence ? nombre d'heures hebdomadaires ? jours travaillés fixes ?).
- **Temps Plein de Référence** : Le système doit connaître la base du temps plein dans l'établissement/service (ex: 35h, 39h) pour calculer correctement les proratas.
- **Modalités du Temps Partiel** :
  - **Jours Fixes Non Travaillés** : Certains temps partiels impliquent des jours de la semaine fixes où l'employé ne travaille pas (ex: jamais le mercredi).
  - **Répartition sur la Semaine** : D'autres peuvent avoir un nombre d'heures réduit réparti différemment chaque semaine.
  - **Cycles Spécifiques** : Certains temps partiels peuvent suivre des cycles pluri-hebdomadaires.
    Mathildanesth doit permettre de configurer ces modalités, au minimum par des règles ou des indisponibilités récurrentes.

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

- Les droits à congés payés annuels (`User.annualLeaveAllowance`) peuvent être proratisés en fonction du temps de travail, selon la législation et les accords d'entreprise.
- Le système de gestion des [Congés et Absences](../02_Gestion_Conges_Absences/01_Processus_Gestion_Conges_Absences.md) doit appliquer ce prorata lors du calcul des droits initiaux.

### 4.2. Jours Fériés

- La gestion des jours fériés pour les temps partiels peut être complexe (si le jour férié tombe un jour habituellement non travaillé, etc.). Le système doit suivre les règles en vigueur.

### 4.3. Compteurs Horaires

- Le [Compteur Horaire](../../09_Compteurs_Suivi_Temps/01_Compteur_Horaire_MAR.md) doit utiliser le temps de travail théorique du temps partiel comme référence pour calculer les soldes (heures en plus/en moins).

## 5. Interface Utilisateur et Visualisation

- Le profil utilisateur doit clairement afficher la quotité de temps de travail.
- Les plannings doivent refléter les indisponibilités liées au temps partiel.
- Les rapports d'équité et les tableaux de bord doivent permettre de prendre en compte ou de filtrer par quotité de temps de travail pour des comparaisons pertinentes.

## 6. Points Clés d'Implémentation

- **Définition Claire des Données `User.workingHours`** : Standardiser le format et l'interprétation de ce champ.
- **Moteur de Règles Adaptable** : Le [Moteur de Règles](../../03_Planning_Generation/01_Moteur_Regles.md) doit pouvoir prendre en compte la quotité de temps partiel dans ses conditions et calculs.
  - Exemple de règle : "Un utilisateur à X% ne peut pas être affecté à plus de Y gardes par mois", où Y est fonction de X.
- **Gestion des Indisponibilités Récurrentes** : Permettre de définir facilement les jours fixes non travaillés pour les temps partiels concernés.

---

La prise en compte adéquate des temps partiels est un gage d'équité et de respect des contrats. Elle complexifie la planification mais est indispensable dans la plupart des organisations de santé.
