# Gestion des Conflits de Planning

## 1. Introduction

La génération d'un planning parfait, respectant toutes les règles et préférences sans aucun conflit, est souvent impossible en pratique, surtout dans des environnements complexes avec de nombreuses contraintes. Mathildanesth intègre donc des mécanismes robustes pour identifier, signaler, et aider à la résolution des conflits de planning. Ce document détaille ces aspects.

## 2. Types de Conflits Gérés

Le système est conçu pour détecter divers types de conflits :

### 2.1. Conflits de Règles Pures

- **Violations de Règles Bloquantes** : Non-respect d'une règle légale (ex: dépassement du temps de travail maximum, repos insuffisant) ou d'une règle organisationnelle jugée critique.
- **Violations de Règles Souples (Avertissements/Infos)** : Non-respect de règles moins critiques, de préférences, ou de recommandations d'équité.
- Le [Moteur de Règles](./01_Moteur_Regles.md) est responsable de l'identification de ces violations.

### 2.2. Conflits de Disponibilité

- **Double Affectation** : Une personne est affectée à deux postes incompatibles sur la même période.
- **Affectation pendant un Congé/Absence** : Tentative d'affecter une personne alors qu'elle est en congé ou absente.
- **Affectation pendant une Indisponibilité** : Tentative d'affecter une personne sur un créneau où elle s'est déclarée indisponible.
- La détection de ces conflits est notamment gérée par des hooks comme `useConflictDetection.ts` pour les congés, et doit être étendue à la planification générale.

### 2.3. Conflits de Couverture des Besoins

- **Poste Non Couvert** : Un poste requis n'a pu être pourvu par personne de qualifié.
- **Sous-Effectif** : Nombre insuffisant de personnel pour un service, un secteur ou un type de compétence donné à un moment T.
- **Sur-Effectif Injustifié** : Plus de personnel affecté que nécessaire (moins courant mais possible).

### 2.4. Conflits de Compétences

- Une personne affectée à un poste ne possède pas les compétences requises (ex: affecter un IADE non formé à une spécialité pédiatrique si une compétence spécifique est requise).

### 2.5. Conflits entre Règles

- Une étape avancée du moteur de règles est la "Détection de conflits entre règles" (`docs/technique/NEXT_STEPS.md`), où deux règles actives sont intrinsèquement contradictoires, rendant impossible leur respect simultané.

## 3. Identification et Signalement des Conflits

### 3.1. Pendant la Saisie Manuelle / Modification

- **Validation Instantanée** : Lors de la création ou de la modification manuelle d'une affectation, le système devrait idéalement vérifier les conflits en temps réel et alerter l'utilisateur immédiatement.
- Des composants comme `LeaveConflictAlert.tsx` existent pour les congés et un mécanisme similaire (`RuleViolationIndicator.tsx`) est prévu pour les règles de planning.

### 3.2. Lors de la Génération Automatique

- L'[Algorithme de Génération](./02_Algorithme_Generation.md) identifie les conflits qu'il ne peut résoudre ou les règles souples qu'il doit violer.
- Un rapport de génération liste ces conflits.

### 3.3. Visualisation dans les Plannings

- Les affectations conflictuelles sont clairement identifiées visuellement dans les différentes vues de planning (ex: par des couleurs spécifiques, des icônes d'alerte).
- Un survol ou un clic sur l'élément conflictuel affiche les détails du ou des conflits.

## 4. Aide à la Résolution des Conflits

Identifier les conflits est la première étape ; aider à les résoudre est crucial.

- **Messages d'Erreur Clairs** : Expliquer précisément quelle règle est violée ou quel est le nature du conflit.
- **Suggestions de Résolution** :
  - Le système de gestion des congés de `mathildanesth` inclut des "Recommandations automatiques pour résolution des conflits" (`docs/technique/NEXT_STEPS.md`).
  - Pour la planification générale, cela pourrait inclure :
    - Proposer des remplacements possibles pour un poste non couvert.
    - Suggérer de décaler une affectation.
    - Indiquer quel utilisateur serait le plus "approprié" pour prendre un poste supplémentaire afin de respecter l'équité.
- **Priorisation des Conflits** : Aider l'utilisateur à se concentrer sur les conflits les plus critiques (ex: violations de règles bloquantes vs. préférences non satisfaites).
- **Simulation d'Impact** : Permettre de tester l'effet d'une modification avant de l'appliquer (voir si cela résout un conflit mais en crée d'autres).

## 5. Niveaux de Sévérité et Actions

Les conflits peuvent avoir différents niveaux de sévérité, influençant les actions possibles :

- **Bloquant** : Le planning ne peut être validé/publié dans cet état. Une résolution est impérative.
- **Avertissement (Warning)** : Le planning peut être utilisé, mais le conflit doit être noté et potentiellement adressé. L'utilisateur peut choisir d'accepter le planning "en l'état".
- **Information (Info)** : Conflit mineur ou non-respect d'une préférence, fourni à titre indicatif.

## 6. Workflow de Résolution Manuelle

Pour les conflits que l'algorithme ne peut résoudre :

1.  **Identification** : Le planificateur consulte la liste des conflits ou les repère visuellement sur le planning.
2.  **Analyse** : Compréhension de la nature du conflit grâce aux informations fournies.
3.  **Actions de Correction** : Le planificateur effectue des modifications manuelles (déplacer des affectations, appeler du personnel, négocier des échanges).
4.  **Re-validation** : Après modification, le système re-valide la section impactée du planning pour confirmer la résolution du conflit et s'assurer qu'aucun nouveau conflit majeur n'a été introduit.

## 7. Journalisation

- Tous les conflits détectés, qu'ils soient résolus automatiquement ou manuellement, devraient être journalisés.
- L'historique des modifications apportées pour résoudre des conflits est également tracé (`AuditLog`).

---

Une gestion efficace des conflits est indispensable pour produire des plannings réalisables et acceptés. Elle repose sur une détection précise, une communication claire à l'utilisateur, et des outils d'aide à la décision pertinents.
