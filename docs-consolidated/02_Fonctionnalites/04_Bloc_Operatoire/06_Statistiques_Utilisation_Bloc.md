# Statistiques d'Utilisation du Bloc Opératoire (Perspective Anesthésie)

## 1. Vue d'ensemble

L'analyse statistique de l'utilisation du bloc opératoire est essentielle pour comprendre les performances passées, identifier les tendances, optimiser l'allocation des ressources et prendre des décisions éclairées pour l'avenir. Du point de vue de Mathildanesth, ces statistiques se concentrent sur l'activité du personnel d'anesthésie, l'occupation des salles par les équipes d'anesthésie, et l'adéquation des ressources planifiées par rapport aux besoins dérivés de l'activité chirurgicale.

Cette fonctionnalité, notamment un "Tableau de bord avec statistiques d'occupation des salles", est envisagée comme un développement futur (`docs/modules/bloc-operatoire.md`). Ce document décrit les types de statistiques qui seraient pertinentes.

## 2. Objectifs des Statistiques d'Utilisation du Bloc

- **Mesurer l'efficience** : Évaluer le taux d'occupation des salles par les équipes d'anesthésie, le temps d'activité moyen par salle.
- **Analyser la charge de travail** : Comprendre comment la charge de travail (supervision, nombre de salles gérées) est répartie entre le personnel d'anesthésie.
- **Évaluer l'adéquation des ressources** : Comparer le personnel planifié au personnel qui aurait été théoriquement nécessaire selon l'activité.
- **Identifier les goulots d'étranglement ou les sous-utilisations** : Mettre en lumière des salles ou des créneaux chroniquement surchargés ou sous-utilisés du point de vue de la couverture anesthésique.
- **Suivre l'équité rétrospectivement** : Analyser la répartition des types de salles ou des supervisions complexes entre les différents MAR.
- **Aider à la planification stratégique** : Fournir des données pour ajuster les effectifs, les trames de base, ou les règles de planification.

## 3. Types de Données Nécessaires pour les Statistiques

Pour générer des statistiques pertinentes, Mathildanesth aurait besoin de s'appuyer sur :

- **Historique des plannings du bloc** : Qui était affecté (MAR, IADE), à quelle salle, pour quels créneaux.
- **Trame chirurgicale historique** : Quelles salles étaient prévues pour être ouvertes (avec quel chirurgien/spécialité).
- **Données de suivi en temps réel (si disponibles)** : Heures de début/fin réelles des occupations de salle, annulations, ajouts d'urgence. (Voir `05_Suivi_Temps_Reel.md`). Sans ces données réelles, les statistiques se baseront sur le planifié.
- **Configuration des salles et secteurs**.

## 4. Exemples de Statistiques et Indicateurs Clés (KPIs)

### 4.1. Statistiques d'Occupation des Salles (par les équipes d'anesthésie)
- **Taux d'occupation des salles planifiées** : Pourcentage de temps où une salle ouverte (selon trame chirurgien) a effectivement eu une équipe d'anesthésie planifiée.
- **Nombre moyen d'heures d'anesthésie par salle par jour/semaine**.
- **Répartition de l'activité par secteur du bloc**.
- **Utilisation des salles par jour de la semaine / créneau horaire**.

### 4.2. Statistiques sur le Personnel d'Anesthésie
- **Nombre moyen de salles supervisées simultanément par MAR**.
- **Temps total de supervision par MAR sur une période**.
- **Répartition des MAR/IADE par secteur ou type de salle/chirurgie**.
- **Heures planifiées au bloc par MAR/IADE**.
- **Analyse des remplacements ou modifications de dernière minute au bloc** (si les données le permettent).

### 4.3. Statistiques d'Adéquation et de Performance
- **Écart entre le nombre de salles ouvertes par les chirurgiens et le nombre de salles couvertes par l'anesthésie** (devrait être proche de zéro).
- **Nombre de fois où les règles de supervision ont été outrepassées** (si des exceptions sont tracées).
- **Tendances d'évolution de ces indicateurs** sur plusieurs mois/années.

### 4.4. Statistiques sur la Trame Chirurgicale (Vue Anesthésie)
- **Nombre de créneaux chirurgicaux prévus par spécialité/chirurgien** (pour comprendre la demande induite sur l'anesthésie).
- **Stabilité de la trame chirurgicale** (si des versions successives sont historisées).

## 5. Présentation des Statistiques

- **Tableaux de bord dédiés** : Une section "Statistiques" ou "Analytics" dans Mathildanesth.
- **Graphiques et visualisations** : Diagrammes à barres, courbes de tendance, camemberts pour une compréhension rapide.
- **Filtres personnalisables** :
    - Plage de dates.
    - Par secteur, par salle.
    - Par rôle (MAR, IADE), par utilisateur spécifique.
- **Options d'export** : En PDF pour des rapports, en CSV/Excel pour des analyses plus poussées.

## 6. Confidentialité et Accès

- L'accès aux statistiques détaillées, notamment celles concernant le personnel, devrait être réservé aux administrateurs et planificateurs autorisés.
- Des vues agrégées et anonymisées pourraient être disponibles plus largement si pertinent.

L'implémentation d'un module de statistiques robuste transformerait Mathildanesth d'un simple outil de planification en un véritable outil d'aide à la décision et d'amélioration continue pour la gestion des ressources d'anesthésie au bloc opératoire. 