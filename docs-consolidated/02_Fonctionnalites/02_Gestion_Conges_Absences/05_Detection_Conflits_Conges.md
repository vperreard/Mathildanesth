# Détection des Conflits de Congés

## 1. Vue d'ensemble

Lorsqu'un utilisateur soumet une demande de congé ou lorsqu'un administrateur la valide, le système doit pouvoir détecter les conflits potentiels. Ces conflits peuvent être liés au non-respect des quotas d'absences, à des chevauchements avec des affectations critiques non déplaçables, ou à d'autres règles métier.

La détection proactive des conflits aide à maintenir la couverture des services et à anticiper les problèmes de planification.

## 2. Types de Conflits Détectés

Le système de détection de conflits pour les congés devrait identifier au minimum les situations suivantes :

### 2.1. Dépassement de Quota d'Absences Simultanées
- **Description** : Le nombre d'employés du même service/rôle (`ProfessionalRole`) ou d'une compétence clé demandant un congé sur la même période dépasse le seuil autorisé (quota collectif).
- **Exemple** : Si le quota est de 2 MARs maximum en congé simultanément, une 3ème demande pour la même période lèvera un conflit.
- **Référence** : Voir `04_Quota_Management_Soldes.md` pour la gestion des quotas.

### 2.2. Conflit avec des Périodes de Restriction
- **Description** : La demande de congé tombe pendant une période où les congés sont interdits ou fortement limités (ex: période de très haute activité, inventaire, obligation de service minimum spécifique).
- **Configuration** : Ces "blackout periods" sont configurables par les administrateurs (voir `01_Validation_Dates.md`).

### 2.3. Non-Respect du Délai de Prévenance
- **Description** : La demande est soumise trop tard par rapport à la date de début du congé, enfreignant une règle de délai minimum (configurable par type de congé).
- **Exemple** : Demander un congé annuel la veille pour le lendemain si la règle exige 15 jours de prévenance.

### 2.4. Solde de Congés Insuffisant
- **Description** : L'utilisateur ne dispose pas d'assez de jours dans son solde pour le type de congé demandé.
- **Référence** : Voir `04_Quota_Management_Soldes.md`.

### 2.5. Conflit avec une Affectation Critique Existante (si applicable avant validation)
- **Description** : (Plus rare au moment de la demande, mais possible) Si l'utilisateur a déjà une affectation planifiée non modifiable (ex: une garde confirmée et non échangeable) qui chevauche la période de congé demandée.
- *Note : Généralement, les congés validés priment et annulent/requièrent le remplacement des affectations, mais la détection peut informer de l'impact.*

### 2.6. Demandes Multiples de la Même Personne en Conflit
- **Description** : Un utilisateur a déjà une demande de congé en attente ou validée qui chevauche la nouvelle demande.

## 3. Mécanisme de Détection

### 3.1. Intégration avec `useDateValidation` et `useConflictDetection`
- Comme mentionné dans `01_Validation_Dates.md`, le hook `useDateValidation` peut être le premier niveau de vérification (dates valides, hors périodes bloquées).
- Un hook ou service `useConflictDetection` (ou une logique serveur équivalente) est ensuite invoqué pour les vérifications plus complexes impliquant les quotas, les soldes et les autres demandes/affectations.

### 3.2. Points de Déclenchement
- **Lors de la saisie par l'utilisateur** : Un premier niveau de feedback peut être donné (ex: "Attention, 2 MARs sont déjà en congé à cette date").
- **Avant la soumission par l'utilisateur** : Une vérification plus complète est effectuée.
- **Lors du traitement par le validateur** : Le validateur voit clairement les conflits potentiels avant de prendre sa décision.

## 4. Présentation des Conflits

- **Messages Clairs** : Les conflits doivent être présentés à l'utilisateur et/ou au validateur avec des messages explicites.
    - Ex: "Quota de 2 MARs absents atteint pour cette période."
    - Ex: "Solde de Congés Annuels insuffisant (Requis: 5 jours, Disponible: 3 jours)."
    - Lors de la demande : Le système peut avertir si la période est déjà tendue (ex: approche du quota) ou si la demande ne respecte pas le délai de prévenance.
    - Lors de la validation : Si un seuil critique est dépassé (ex: quota d'absents dépassé rendant la couverture impossible), la validation peut être bloquée avec un message explicatif clair pour le manager.
- **Sévérité du Conflit (Optionnel)** : Différencier les avertissements (conflits contournables ou informatifs) des erreurs bloquantes.
    - Un dépassement de quota peut être bloquant.
    - Un simple chevauchement avec une affectation standard (qui sera annulée) est un avertissement.
- **Aide à la Résolution** : Si possible, suggérer des alternatives (ex: "Essayez de décaler votre demande d'une semaine").

## 5. Configuration des Règles de Conflit

- Les seuils de quotas, les délais de prévenance, et les périodes de restriction doivent être configurables par les administrateurs.
- Possibilité de définir des règles de conflit spécifiques par type de congé ou par `ProfessionalRole`.

## 6. Impact sur le Workflow de Validation

- Un conflit bloquant peut empêcher la soumission de la demande ou sa validation directe.
- Un validateur peut avoir la possibilité de "forcer" la validation malgré certains avertissements, en fournissant une justification (avec audit de cette action).

Une détection efficace des conflits est primordiale pour maintenir l'équilibre entre les souhaits des employés et les impératifs de l'organisation. 