# Guide de Test du Système de Validation des Dates

Ce document présente les scénarios de test recommandés pour valider le bon fonctionnement du système de validation des dates. Chaque scénario couvre un aspect spécifique du système et doit être testé par les équipes internes avant toute mise en production.

## Prérequis

- Accès à l'environnement de démonstration (`DateValidationDemo.tsx`)
- Compte utilisateur avec les droits appropriés
- Connaissance des règles métier concernant les congés et gardes

## Scénarios de Test

### 1. Demandes de Congés

#### 1.1 Validation des demandes de congés standard

**Objectif**: Vérifier que les demandes de congés respectant toutes les règles sont acceptées.

**Étapes**:
1. Sélectionner un utilisateur (ex: "user123")
2. Choisir une date de début à au moins 3 jours dans le futur
3. Choisir une date de fin (durée totale < quota disponible)
4. Cliquer sur "Valider congés"

**Résultat attendu**: La demande est validée sans erreurs.

#### 1.2 Rejet des demandes excédant le quota

**Objectif**: Vérifier que les demandes dépassant le quota disponible sont rejetées.

**Étapes**:
1. Sélectionner le scénario "Quota faible" (22 jours déjà utilisés sur 25 disponibles)
2. Choisir une date de début valide
3. Choisir une date de fin (durée totale > 3 jours)
4. Cliquer sur "Valider congés"

**Résultat attendu**: La demande est rejetée avec un message d'erreur indiquant que le quota est dépassé.

#### 1.3 Rejet des demandes sans préavis suffisant

**Objectif**: Vérifier que les demandes sans préavis minimum sont rejetées.

**Étapes**:
1. Choisir une date de début à moins de 3 jours dans le futur
2. Choisir une date de fin valide
3. Cliquer sur "Valider congés"

**Résultat attendu**: La demande est rejetée avec un message d'erreur indiquant que le préavis minimum n'est pas respecté.

#### 1.4 Rejet des demandes pendant les périodes bloquées

**Objectif**: Vérifier que les demandes pendant les périodes bloquées sont rejetées.

**Étapes**:
1. Sélectionner le scénario "Période bloquée"
2. Cliquer sur "Valider congés"

**Résultat attendu**: La demande est rejetée avec un message d'erreur indiquant que la période chevauche une période bloquée.

#### 1.5 Rejet des demandes avec conflit

**Objectif**: Vérifier que les demandes en conflit avec d'autres événements sont rejetées.

**Étapes**:
1. Sélectionner le scénario "Conflit"
2. Cliquer sur "Valider congés"

**Résultat attendu**: La demande est rejetée avec un message d'erreur indiquant un conflit avec un événement existant.

### 2. Affectations de Garde

#### 2.1 Validation des affectations de garde standard

**Objectif**: Vérifier que les affectations de garde respectant toutes les règles sont acceptées.

**Étapes**:
1. Sélectionner un utilisateur (ex: "user123")
2. Sélectionner un type de garde (ex: "jour")
3. Choisir une date qui n'est pas en conflit avec d'autres événements
4. Cliquer sur "Valider garde"

**Résultat attendu**: L'affectation est validée sans erreurs.

#### 2.2 Rejet des affectations pendant les périodes de repos

**Objectif**: Vérifier que les affectations pendant les périodes de repos obligatoire sont rejetées.

**Étapes**:
1. Sélectionner le scénario "Période de repos"
2. Cliquer sur "Valider garde"

**Résultat attendu**: L'affectation est rejetée avec un message d'erreur indiquant que la période de repos obligatoire doit être respectée.

#### 2.3 Rejet des affectations avec conflit

**Objectif**: Vérifier que les affectations en conflit avec d'autres événements sont rejetées.

**Étapes**:
1. Sélectionner un utilisateur (ex: "user123")
2. Choisir une date où l'utilisateur a déjà un événement (ex: le jour 5)
3. Cliquer sur "Détecter conflits" puis "Valider garde"

**Résultat attendu**: L'affectation est rejetée avec un message d'erreur indiquant un conflit.

### 3. Détection de Conflits

#### 3.1 Détection des conflits avec événements existants

**Objectif**: Vérifier que les conflits avec des événements existants sont correctement détectés.

**Étapes**:
1. Sélectionner un utilisateur (ex: "user123")
2. Choisir une date où l'utilisateur a déjà un événement (ex: le jour 5)
3. Cliquer sur "Détecter conflits"

**Résultat attendu**: Un conflit est détecté et affiché dans la section "Conflits détectés".

#### 3.2 Pas de conflit avec événements d'autres utilisateurs

**Objectif**: Vérifier que les événements d'autres utilisateurs ne génèrent pas de conflits.

**Étapes**:
1. Sélectionner un utilisateur (ex: "user123")
2. Choisir une date où seul un autre utilisateur a un événement (ex: le jour 9)
3. Cliquer sur "Détecter conflits"

**Résultat attendu**: Aucun conflit n'est détecté.

### 4. Calculs de Durée

#### 4.1 Calcul correct des jours ouvrables

**Objectif**: Vérifier que le calcul des jours ouvrables est correct.

**Étapes**:
1. Sélectionner une période incluant des weekends et jours fériés (ex: du lundi au lundi suivant)
2. Cliquer sur "Valider congés"

**Résultat attendu**: Le nombre de jours ouvrables affiché est correct (exclut les weekends et jours fériés).

#### 4.2 Calcul correct du solde de jours

**Objectif**: Vérifier que le calcul du solde de jours est correct.

**Étapes**:
1. Sélectionner le scénario "Par défaut" (10 jours utilisés sur 25)
2. Choisir une période de 5 jours
3. Cliquer sur "Valider congés"

**Résultat attendu**: Le solde de jours restants affiché est de 10 jours (25 - 10 - 5).

## Cas Limites et Tests de Robustesse

### 5.1 Validation avec des dates nulles

**Objectif**: Vérifier que le système gère correctement les dates nulles.

**Étapes**:
1. Laisser les champs de date vides
2. Cliquer sur "Valider congés" ou "Valider garde"

**Résultat attendu**: Une erreur indiquant que les dates sont requises est affichée.

### 5.2 Validation avec des dates incohérentes

**Objectif**: Vérifier que le système rejette les plages de dates incohérentes.

**Étapes**:
1. Choisir une date de fin antérieure à la date de début
2. Cliquer sur "Valider congés"

**Résultat attendu**: Une erreur indiquant que la date de début doit être antérieure à la date de fin est affichée.

### 5.3 Robustesse aux changements d'utilisateur

**Objectif**: Vérifier que le système réinitialise correctement les erreurs lors du changement d'utilisateur.

**Étapes**:
1. Générer une erreur de validation pour l'utilisateur actuel
2. Changer d'utilisateur
3. Observer si les erreurs sont réinitialisées

**Résultat attendu**: Les erreurs sont réinitialisées lors du changement d'utilisateur.

### 5.4 Transition entre différents types de validation

**Objectif**: Vérifier que le système gère correctement les transitions entre types de validation.

**Étapes**:
1. Valider une demande de congés
2. Sans réinitialiser, valider une affectation de garde avec les mêmes dates
3. Observer le comportement

**Résultat attendu**: Chaque validation est indépendante et affiche les erreurs appropriées.

## Rapport de Test

Pour chaque scénario testé, veuillez documenter:

- Numéro et nom du scénario
- Date du test
- Résultat (Succès/Échec)
- Description des problèmes rencontrés le cas échéant
- Captures d'écran si pertinent

Utilisez le modèle suivant:

```
Scénario: [Numéro et nom]
Date du test: [JJ/MM/AAAA]
Résultat: [Succès/Échec]
Problèmes: [Description ou "Aucun"]
Notes: [Observations supplémentaires]
```

Envoyez les rapports de test à l'équipe de développement à l'adresse: dev-team@mathildanesth.fr 