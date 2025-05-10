# Types d'Affectations et Règles Métier Associées

## Introduction

Ce document détaille les différents types d'affectations gérés par Mathildanesth, basés sur l'énumération `ShiftType` (définie dans `src/types/common.ts` et documentée dans `docs/technical/codebase-overview.md`), et les principales règles métier qui leur sont associées. Ces règles s'inspirent des pratiques établies dans `mathildanesth` (notamment `docs/technique/REGLES_AFFECTATION.md`) et sont enrichies par les réflexions du projet `MATHILDA`.

**Important** : La majorité des paramètres numériques mentionnés (durées, nombre maximum, etc.) doivent être **configurables par les administrateurs via l'interface de l'application** et stockés en base de données, afin de permettre une adaptation aux besoins spécifiques de l'établissement.

## 1. Gardes

Les gardes impliquent une présence continue sur site.

### 1.1. Garde de Jour (`ShiftType.JOUR`)

- **Description** : Garde en journée (période standard).
- **Durée typique** : Configurable (ex: 10-12 heures).
- **Règles spécifiques** :
  - Un seul médecin de ce type de garde par jour/tranche horaire (configurable).
  - Incompatible avec d'autres affectations sur la même plage horaire.
  - Doit être suivie d'une période de repos (voir section Repos Post-Affectation).

### 1.2. Garde de Nuit (`ShiftType.NUIT`)

- **Description** : Garde de nuit.
- **Durée typique** : Configurable (ex: 12-14 heures).
- **Règles spécifiques** :
  - Un seul médecin de ce type de garde par nuit (configurable).
  - Incompatible avec d'autres affectations.
  - Repos post-garde obligatoire (durée configurable, ex: 11h minimum).
  - Limite sur le nombre de gardes de nuit consécutives (configurable, ex: max 2-3).
  - Peut avoir une pondération de pénibilité supérieure pour les calculs d'équité.

### 1.3. Garde de 24h (`ShiftType.GARDE_24H`)

- **Description** : Garde continue sur 24 heures (ex: 8h J1 à 8h J2).
- **Durée typique** : 24 heures.
- **Règles spécifiques** :
  - Un seul médecin de ce type de garde (configurable).
  - Incompatible avec toute autre affectation pendant la garde et immédiatement avant/après.
  - Repos post-garde obligatoire et conséquent (configurable, ex: 24h ou 36h).
  - Fréquence limitée par médecin (configurable, ex: pas plus de X par mois).
  - Pondération de pénibilité très élevée.

### 1.4. Garde de Weekend (`ShiftType.GARDE_WEEKEND`)

- **Description** : Garde spécifique couvrant une période du weekend (ex: samedi 8h au lundi 8h, ou par tranches de 24h).
- **Durée typique** : Variable selon la configuration (ex: 24h, 48h).
- **Règles spécifiques** :
  - Similaire aux gardes de 24h si la durée est équivalente.
  - Repos post-garde adapté à la durée.
  - Prise en compte spécifique dans les compteurs d'équité pour les weekends.
  - Pondération de pénibilité élevée.

### 1.5. Garde d'Urgence (`ShiftType.URGENCE`)

- **Description** : Garde spécifique pour les urgences, potentiellement avec des horaires variables ou déclenchée par un besoin.
- **Durée typique** : Configurable (ex: 12h).
- **Règles spécifiques** :
  - Peut avoir des règles d'activation et de compatibilité spécifiques.
  - À définir plus précisément selon les besoins de l'établissement.

## 2. Astreintes

Les astreintes impliquent une disponibilité pour intervention, sans présence continue obligatoire sur site.

### 2.1. Astreinte Générique (`ShiftType.ASTREINTE`)

- **Description** : Disponibilité pour intervention.
- **Durée typique** : Souvent 24h, mais configurable.
- **Règles spécifiques** :
  - Compatible avec certaines autres affectations (ex: consultations, travail administratif) si configuré.
  - Incompatible avec les gardes sur site et le repos post-garde.
  - Ne compte généralement pas comme une affectation "lourde" dans les cumuls de charge de travail (sauf si déclenchée fréquemment).
  - Règles sur le temps d'intervention et la compensation si appelée.

### 2.2. Astreinte de Semaine (`ShiftType.ASTREINTE_SEMAINE`)

- **Description** : Astreinte spécifique aux jours de semaine.
- **Durée typique** : Configurable (ex: soirée et nuit).
- **Règles spécifiques** : Similaires à l'astreinte générique, potentiellement avec des règles de compatibilité différentes.

### 2.3. Astreinte de Weekend (`ShiftType.ASTREINTE_WEEKEND`)

- **Description** : Astreinte spécifique au weekend.
- **Durée typique** : Configurable (ex: 24h ou 48h couvrant le weekend).
- **Règles spécifiques** :
  - Prise en compte spécifique dans les compteurs d'équité pour les weekends.
  - Peut avoir des règles de déclenchement et de compensation différentes.

## 3. Vacations / Consultations

Activité programmée sur des demi-journées.

### 3.1. Vacation Matin (`ShiftType.MATIN`)

- **Description** : Activité de consultation ou autre en matinée (ex: 8h-13h).
- **Durée typique** : 4-5 heures.
- **Règles spécifiques** :
  - Un médecin peut être en consultation le matin.
  - Incompatible avec une affectation au bloc opératoire sur le même créneau horaire.
  - Compatible avec une affectation bloc l'après-midi (ou astreinte si configuré).

### 3.2. Vacation Après-Midi (`ShiftType.APRES_MIDI`)

- **Description** : Activité de consultation ou autre en après-midi (ex: 13h30-18h30).
- **Durée typique** : 4-5 heures.
- **Règles spécifiques** :
  - Un médecin peut être en consultation l'après-midi.
  - Incompatible avec une affectation au bloc opératoire sur le même créneau horaire.
  - Compatible avec une affectation bloc le matin (ou astreinte si configuré).

### 3.3. Consultation (`ShiftType.CONSULTATION`)

- **Description** : Type générique pour consultation, peut être utilisé si MATIN/APRES_MIDI n'est pas assez spécifique.
- **Règles spécifiques** :
  - Un médecin ne peut généralement pas faire consultation matin ET après-midi le même jour (configurable).

## 4. Bloc Opératoire

Affectation au bloc opératoire, qui peut inclure l'anesthésie directe ou la supervision. Les règles détaillées de supervision sont dans `02_Fonctionnalites/04_Bloc_Operatoire/02_Regles_Supervision.md`.

- **Description** : Présence et activité au sein du bloc opératoire.
- **Règles spécifiques** :
  - Compte comme une affectation pour la demi-journée ou journée.
  - Compatibilité avec d'autres types d'affectations (ex: consultation sur l'autre demi-journée) est configurable.

## 5. Règles Transverses Importantes (Configurables)

### 5.1. Repos Post-Affectation

- **Principe** : Un repos suffisant doit suivre certaines affectations intenses.
- **Configuration** :
  - Durée minimale de repos après chaque `ShiftType` pertinent (surtout NUIT, GARDE_24H, GARDE_WEEKEND).
  - Le système doit empêcher toute affectation pendant cette période de repos.

### 5.2. Enchaînements et Séquences

- **Principe** : Limiter les séquences d'affectations fatigantes.
- **Configuration** :
  - Nombre maximum d'un certain `ShiftType` consécutif (ex: max 2 gardes de nuit).
  - Intervalle minimal entre deux affectations du même type pénible (ex: 7 jours minimum entre deux gardes de 24h, configurable).
  - Interdiction de certains enchaînements (ex: pas de garde de jour immédiatement après une garde de nuit terminée le matin même).

### 5.3. Incompatibilités entre Types d'Affectations

- **Principe** : Définir quelles affectations ne peuvent pas avoir lieu simultanément ou se suivre de trop près pour un même utilisateur.
- **Exemples (déjà mentionnés mais à centraliser comme configurables)** :
  - Garde vs. autre affectation le même jour.
  - Astreinte vs. Garde / Repos post-garde.
  - Consultation vs. Bloc sur le même créneau.
- **Configuration** : Une matrice de compatibilité/incompatibilité entre `ShiftType` pourrait être envisagée pour une configuration fine.

### 5.4. Périodes Spéciales (Jours Fériés, Ponts)

- **Principe** : Les affectations durant ces périodes peuvent avoir des règles spécifiques ou une pondération différente pour l'équité.
- **Configuration** :
  - Liste des jours fériés (annuellement configurable).
  - Règles spécifiques pour les ponts (ex: priorité pour ceux ayant travaillé le férié).
  - Pondération accrue pour l'équité (voir `05_Equite_Qualite_Vie.md`).

## Conclusion

La définition précise de ces types d'affectations et des règles associées, tout en garantissant leur configurabilité, est essentielle pour la pertinence et l'efficacité de l'outil de planification Mathildanesth. Cette documentation servira de référence pour l'implémentation et l'évolution de ces règles au sein du moteur de règles et de l'algorithme de génération.
