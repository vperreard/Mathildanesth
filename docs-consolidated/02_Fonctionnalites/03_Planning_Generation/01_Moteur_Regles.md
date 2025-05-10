# Moteur de Règles pour la Génération de Planning

## 1. Introduction

Le moteur de règles est un composant essentiel de Mathildanesth, permettant d'automatiser la génération de plannings équitables et conformes aux contraintes légales, organisationnelles et individuelles. Ce document décrit l'architecture, le fonctionnement et les types de règles gérées par ce moteur.

Le développement d'un module de "règles dynamiques" est une priorité haute, avec un MVP déjà en cours ou complété pour certains aspects (interface d'administration CRUD, moteur pour règles de base) comme indiqué dans `docs/technique/NEXT_STEPS.md` et `documentation/roadmap-dev-updated.md`.

## 2. Objectifs du Moteur de Règles

- **Automatisation** : Réduire la charge de travail manuelle de création des plannings.
- **Équité** : Assurer une répartition équilibrée des gardes, astreintes, et types de postes entre les utilisateurs.
- **Conformité** : Garantir le respect des réglementations (temps de travail, repos obligatoire) et des accords locaux.
- **Flexibilité** : Permettre la configuration et l'ajustement des règles sans modification du code source.
- **Transparence** : Fournir un retour sur les règles appliquées et les éventuelles violations lors de la génération ou de la modification manuelle des plannings.

## 3. Architecture et Composants

Le moteur de règles s'articule autour de plusieurs éléments clés :

### 3.1. Définition des Règles

Les règles sont stockées en base de données (modèle `Rule` dans `prisma/schema.prisma`) et peuvent être gérées via une interface d'administration (`src/app/admin/schedule-rules/page.tsx`, `src/modules/dynamicRules/components/RuleForm.tsx`).

Chaque règle possède typiquement les attributs suivants :

- **`id`** : Identifiant unique.
- **`name`** : Nom descriptif de la règle.
- **`description`** : Explication détaillée de la règle.
- **`type`** (Enum `RuleType`) : Catégorie de la règle (ex: `WORK_HOURS`, `REST_PERIOD`, `SKILL_REQUIREMENT`, `FAIRNESS`).
- **`priority`** (Enum `RulePriority` ou numérique) : Ordre d'importance de la règle (ex: `BLOCKING`, `WARNING`, `INFO`). Une règle bloquante ne peut être violée, tandis qu'une règle de type avertissement peut l'être mais générera une alerte.
- **`isActive`** (Boolean) : Permet d'activer ou de désactiver une règle.
- **`validFrom`, `validTo`** (DateTime) : Période de validité de la règle.
- **`configuration`** (Json) : Paramètres spécifiques à la règle (ex: nombre d'heures maximum par semaine, compétence requise pour un poste, nombre de week-ends de garde maximum par mois).
- **`scope`** (optionnel) : À quels utilisateurs, rôles professionnels, services ou sites la règle s'applique-t-elle ?

### 3.2. Moteur d'Évaluation (Rule Engine Service)

Un service dédié (`RuleEngineService` mentionné dans `documentation/roadmap-dev-updated.md`) est responsable de :

- Charger les règles actives applicables à un contexte de planification donné.
- Évaluer un planning (ou une partie de planning) par rapport à ces règles.
- Identifier les violations de règles.
- Calculer un score de qualité ou de pénalité pour un planning.

`docs/technique/NEXT_STEPS.md` mentionne un "Moteur pour règles de base" pour le MVP du module de règles dynamiques, et un "Moteur de règles avancé" comme prochaine étape, incluant la validation des règles, la détection de conflits entre règles et un mécanisme d'application avec journalisation.

### 3.3. Interface d'Administration des Règles

Une interface (`src/app/admin/schedule-rules/`, `src/modules/dynamicRules/components/RuleList.tsx`, `src/modules/dynamicRules/components/RuleForm.tsx`) permet aux administrateurs de :

- Créer, lire, mettre à jour et supprimer (CRUD) des règles.
- Définir les paramètres et la portée de chaque règle.
- Activer/désactiver des règles.
- Potentiellement, tester l'impact d'une règle sur un planning existant.
  `docs/technique/NEXT_STEPS.md` indique qu'un éditeur visuel simple pour Conditions/Actions dans `RuleForm` est une prochaine étape pour le moteur de règles avancé.

### 3.4. Intégration avec le Générateur de Planning

Le moteur de règles est étroitement intégré à l'algorithme de génération de planning (`RuleBasedPlanningGeneratorService` mentionné dans `documentation/roadmap-dev-updated.md`).

- L'algorithme utilise le moteur de règles pour guider ses choix et s'assurer que le planning généré est conforme.
- Il peut tenter de minimiser les violations des règles non bloquantes.

### 3.5. Feedback Utilisateur

- Lors de la génération ou de la modification manuelle d'un planning, les violations de règles sont signalées à l'utilisateur.
- Le composant `RuleViolationIndicator.tsx` (`docs/technical/codebase-overview.md`) est probablement utilisé pour cet affichage.
- Des explications claires sur les règles violées et les raisons sont fournies.

## 4. Types de Règles Gérées

Le moteur de règles est conçu pour gérer une variété de contraintes :

### 4.1. Règles Légales et Réglementaires

- Temps de travail maximum (journalier, hebdomadaire, mensuel).
- Périodes de repos minimum obligatoires (entre deux gardes, repos hebdomadaire).
- Nombre maximum de gardes/astreintes consécutives.

### 4.2. Règles Organisationnelles

- Couverture minimale en personnel par service/poste/compétence à tout moment.
- Ratio de supervision (ex: un MAR pour X salles au bloc opératoire).
- Rotation équitable des postes (ex: alternance jour/nuit).
- Contraintes spécifiques aux week-ends et jours fériés.

### 4.3. Règles d'Équité

- Répartition équilibrée du nombre total de gardes, d'astreintes, de week-ends travaillés sur une période donnée.
- Prise en compte des demandes et indisponibilités des utilisateurs.
- Éviter les enchaînements de postes pénibles.

### 4.4. Règles de Compétences

- Assigner uniquement du personnel possédant les compétences requises pour un poste ou une activité spécifique.

### 4.5. Préférences Utilisateurs (Règles Souples)

- Prendre en compte les préférences des utilisateurs (jours de repos souhaités, types de gardes préférés) comme des règles de faible priorité, si possible.

## 5. Processus d'Évaluation des Règles

1.  **Collecte des Données** : Récupération des informations sur les utilisateurs (contrats, compétences, indisponibilités, congés), les postes à pourvoir, et les règles actives.
2.  **Itération** : Pour chaque affectation potentielle ou existante dans le planning :
    a. Le moteur de règles évalue si l'affectation viole une ou plusieurs règles.
    b. Les violations sont enregistrées avec leur niveau de sévérité.
3.  **Score Global** : Un score peut être calculé pour évaluer la qualité globale du planning par rapport aux règles.

## 6. Gestion des Conflits de Règles

Une prochaine étape pour le moteur de règles avancé est la "Détection de conflits entre règles" (`docs/technique/NEXT_STEPS.md`). Cela impliquerait :

- Identifier si certaines règles sont contradictoires entre elles.
- Fournir des outils pour aider les administrateurs à résoudre ces conflits (ex: en ajustant les priorités ou les paramètres des règles).

## 7. Journalisation et Audit

Le "Mécanisme d'application avec journalisation" est prévu (`docs/technique/NEXT_STEPS.md`).

- Toutes les applications de règles et les violations détectées lors de la génération de planning devraient être journalisées.
- Cela permet de comprendre pourquoi un planning a été généré d'une certaine manière et de tracer les décisions prises par l'algorithme.

---

Un moteur de règles puissant et configurable est fondamental pour l'efficacité et l'acceptation de Mathildanesth. Son développement itératif, en commençant par des règles de base et en évoluant vers un système plus avancé, est une approche pragmatique.
