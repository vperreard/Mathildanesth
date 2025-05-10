# Équité et Qualité de Vie dans la Planification

## Introduction

Un objectif fondamental de Mathildanesth est de produire des plannings qui ne sont pas seulement opérationnellement viables, mais aussi équitables pour le personnel et respectueux de leur qualité de vie au travail (QVT). Ce document détaille les principes, métriques et mécanismes utilisés pour atteindre cet objectif, en s'appuyant sur les fonctionnalités de `mathildanesth` et les concepts d'équité de `MATHILDA`.

**Important** : De nombreux seuils et pondérations mentionnés ici doivent être **configurables par les administrateurs** via l'interface de l'application pour s'adapter aux politiques spécifiques de l'établissement.

## Principes Directeurs

1.  **Répartition équilibrée des tâches pénibles** : Assurer que les gardes (nuit, weekend, 24h), astreintes et autres affectations contraignantes sont distribuées de manière juste sur l'ensemble du personnel éligible.
2.  **Respect des rythmes biologiques et du repos** : Minimiser la fatigue en appliquant des règles de repos strictes et en évitant les enchaînements délétères.
3.  **Prise en compte des préférences individuelles** : Autant que possible, tenir compte des souhaits et contraintes personnelles des médecins, tant que cela ne compromet pas l'équité globale ou la couverture des besoins.
4.  **Transparence et objectivité** : Utiliser des métriques claires et des règles objectives pour la construction et l'évaluation des plannings.

## Métriques de Suivi et d'Évaluation (Issues de `mathildanesth`)

L'algorithme de génération de planning de `mathildanesth` utilise (ou prévoit d'utiliser) les métriques suivantes pour évaluer la qualité d'un planning sous l'angle de l'équité et de la QVT (voir `docs-consolidated/.../02_Algorithme_Generation.md`) :

- **`equityScore`**: Score global d'équité (0-100).
- **`satisfactionScore`**: Score de satisfaction des préférences utilisateurs (0-100).
- **`workloadBalance`**: Indicateur d'équilibre de la charge de travail globale (0-100).
- **`gardesDistribution`**: Métriques de distribution des gardes.
  - `gini`: Indice de Gini mesurant l'inégalité (0 = parfaite égalité).
  - `stdDev`: Écart-type normalisé de la distribution des gardes.
- **`specialtiesDistribution`**: Métriques de distribution des spécialités.
  - `shannon`: Entropie de Shannon pour la diversité des spécialités pratiquées.
  - `balanceScore`: Score d'équilibre dans la pratique des différentes spécialités.
- **`fatigueScore`** (mentionné dans `algo-technique-final.md` de `mathildanesth`): Indicateur de charge de travail cumulée et de fatigue.

## Critères et Compteurs Spécifiques pour l'Équité et la QVT (Inspirés de `MATHILDA` et `mathildanesth`)

Pour alimenter ces métriques et guider l'algorithme, les compteurs et critères suivants doivent être suivis et gérés. Beaucoup de ces éléments doivent être **configurables** (seuils, périodes de calcul).

### 1. Compteurs d'Affectations Pénibles (par utilisateur, par période configurable - ex: mois, trimestre, année)

- **Nombre total de gardes**.
- **Nombre de gardes de nuit (`ShiftType.NUIT`)**.
- **Nombre de gardes de 24h (`ShiftType.GARDE_24H`)**.
- **Nombre de gardes de weekend (`ShiftType.GARDE_WEEKEND`)** : décompte par weekend ou par tranche de 24h.
- **Nombre de jours fériés travaillés** (en garde ou astreinte).
- **Nombre total d'astreintes**.
- **Nombre d'astreintes de weekend (`ShiftType.ASTREINTE_WEEKEND`)**.
- **Nombre d'astreintes de semaine/nuit (`ShiftType.ASTREINTE_SEMAINE`)**.

  _Règle associée (configurable)_ : Définir des plafonds maximum pour ces compteurs sur des périodes données pour chaque utilisateur ou type de profil.

### 2. Pondération de la Pénibilité

- **Principe** : Certaines affectations sont plus pénibles que d'autres et doivent peser plus lourd dans les calculs d'équité.
- **Configuration** : Attribuer des poids (facteurs de multiplication) configurables aux différents `ShiftType` :
  - Ex: Garde de Nuit = 1.5 points, Garde de Weekend = 1.8 points, Garde de Jour Férié = 2.0 points, Garde de 24h = 2.5 points.
  - L'algorithme utilisera ces points pondérés pour évaluer l'`equityScore` et le `workloadBalance`.

### 3. Équité sur les Périodes Spéciales

- **Weekends** :
  - _Règle (configurable)_ : Nombre maximum de weekends (complets ou partiels) de garde/astreinte par utilisateur par mois/trimestre.
  - _Principe_ : Assurer une rotation équitable sur les weekends.
- **Jours Fériés** :
  - _Règle (configurable)_ : Assurer une rotation sur les jours fériés d'une année sur l'autre ou sur une période donnée.
  - _Principe_ : Éviter que les mêmes personnes soient systématiquement affectées aux jours fériés les plus demandés.
- **Ponts et Périodes de Vacances Scolaires** :
  - _Règle (configurable)_ : Mécanismes pour équilibrer l'accès à ces périodes (ex: priorité alternée, système de points).

### 4. Qualité de Vie et Rythmes de Travail

- **Séquences de travail et repos** (voir aussi `00_Types_Affectations_Regles_Metier.md`) :
  - _Règle (configurable)_ : Nombre maximum de jours de travail consécutifs.
  - _Règle (configurable)_ : Minimisation des séquences travail-repos-travail courtes (ex: éviter un seul jour de repos entre deux longues séries de travail).
  - _Principe_ : Respecter des durées minimales de repos entre les affectations et après des séries d'affectations.
- **Alternance des types d'affectations** :
  - _Principe_ : Éviter la concentration excessive d'un même type d'affectation pénible sur une courte période (ex: trop de gardes de nuit enchaînées, même si le repos réglementaire est respecté entre chaque).
  - _Règle (configurable)_ : Définir des limites sur la densité de certains `ShiftType`.
- **Prévisibilité du planning** :
  - _Principe_ : Publier les plannings suffisamment à l'avance (configurable).
  - _Principe_ : Limiter les modifications de dernière minute (sauf urgence).

### 5. Prise en Compte des Préférences et Contraintes Utilisateurs

- **Préférences (`UserPreferences`)** : Le modèle utilisateur de `mathildanesth` prévoit déjà la gestion des préférences.
  - **Types de préférences** : Jours/horaires préférés/à éviter, types d'affectations préférés/à éviter, coéquipiers préférés/à éviter, etc.
  - **Intégration** : L'algorithme doit tenter de satisfaire ces préférences. Le `satisfactionScore` mesure ce succès. Les préférences peuvent influencer le score d'un candidat pour une affectation.
  - **Pondération (configurable)** : Un poids peut être attribué à l'importance du respect des préférences dans le score global du planning.
- **Demandes Spécifiques / Souhaits** :
  - _Principe_ : Permettre aux utilisateurs de soumettre des demandes ponctuelles (ex: "jour OFF souhaité pour événement familial").
  - _Gestion_ : Ces demandes doivent être tracées et, si possible, honorées, en évaluant leur impact sur l'équité globale.
- **Contraintes Fortes** : Certaines contraintes utilisateurs (ex: médicales, temps partiel imposé) doivent être traitées comme des règles dures.

## Implémentation dans l'Algorithme et le Moteur de Règles

- **Moteur de Règles** : Beaucoup de ces critères d'équité et de QVT peuvent être traduits en règles configurables (ex: "Ne pas affecter un utilisateur à plus de X gardes de weekend par trimestre"). Le moteur de règles évaluera ces contraintes.
- **Algorithme de Génération** :
  - Utilisera les compteurs d'équité pour guider la sélection des candidats (ex: prioriser celui qui a le moins de points de pénibilité ou le moins de gardes de weekend).
  - Intégrera les scores de QVT et de satisfaction des préférences dans sa fonction d'évaluation des plannings potentiels.
  - Visera à optimiser un score composite qui équilibre les besoins opérationnels, l'équité, la QVT et le respect des préférences.

## Conclusion

La prise en compte de l'équité et de la qualité de vie est un processus continu qui nécessite des outils de configuration flexibles, des métriques claires et un algorithme capable de jongler avec de multiples objectifs. En combinant les bases solides de `mathildanesth` avec la richesse des critères de `MATHILDA`, Mathildanesth vise à être un outil de planification avancé et humain.
