# Algorithme de Génération Automatique de Planning

## 1. Introduction

L'algorithme de génération automatique de planning est au cœur de la fonctionnalité de planification de Mathildanesth. Son objectif est de produire des plannings optimisés, équitables et conformes aux règles établies, tout en minimisant les interventions manuelles. Ce document décrit les principes de fonctionnement, les données d'entrée, les sorties attendues et les interactions avec le moteur de règles.

Le "Service de génération de planning" de `mathildanesth` est marqué comme complété dans `docs/technique/NEXT_STEPS.md`, avec des améliorations telles que la gestion des gardes consécutives et des shifts multiples. L'intégration avec les règles dynamiques est également un aspect clé (`RuleBasedPlanningGeneratorService` et `docs/technique/NEXT_STEPS.md` section "Intégration avec l'algorithme de génération").

## 2. Objectifs de l'Algorithme

- **Couverture des Besoins** : Assurer que tous les postes et services requis sont couverts par du personnel qualifié.
- **Respect des Règles** : Intégrer et respecter au maximum les règles définies dans le [Moteur de Règles](./01_Moteur_Regles.md) (légales, organisationnelles, d'équité, de compétences).
- **Équité** : Répartir de manière équitable les charges de travail, les gardes, les week-ends, et les types de postes pénibles entre les utilisateurs éligibles.
- **Optimisation** : Rechercher des solutions de planning qui optimisent certains critères (ex: minimiser les changements d'affectation, maximiser la satisfaction des préférences utilisateurs si possible).
- **Rapidité** : Générer des plannings dans un délai raisonnable.
- **Flexibilité** : Pouvoir s'adapter à différents contextes et configurations (ex: plannings pour différents services, périodes variables).

## 3. Données d'Entrée pour la Génération

L'algorithme nécessite un ensemble complet de données pour fonctionner efficacement :

- **Période de Planification** : Dates de début et de fin pour lesquelles le planning doit être généré.
- **Utilisateurs** :
  - Liste des utilisateurs éligibles pour la planification.
  - Profils utilisateurs : rôles professionnels, compétences, contrats (temps plein/partiel, jours spécifiques), dates d'entrée/sortie.
  - Congés et absences approuvés.
  - Indisponibilités déclarées.
  - Préférences (si prises en compte).
  - Compteurs existants (heures travaillées, nombre de gardes effectuées, etc.) pour assurer l'équité sur la durée.
- **Besoins de Couverture (Demande)** :
  - Définition des postes à pourvoir (ex: MAR de garde, IADE au bloc, consultation X).
  - Nombre de personnes requises pour chaque poste et pour chaque créneau horaire.
  - Compétences spécifiques requises pour certains postes.
  - Peut provenir de trames de planning pré-configurées.
- **Règles Actives** :
  - Ensemble des règles (légales, organisationnelles, d'équité) fournies par le [Moteur de Règles](./01_Moteur_Regles.md).
- **Planning Existant (Optionnel)** :
  - Possibilité de partir d'un planning partiellement rempli ou d'un planning précédent pour assurer une continuité.

## 4. Processus Général de Génération (Conceptuel)

Bien que les détails spécifiques de l'implémentation puissent varier, un algorithme de génération de planning suit généralement des étapes conceptuelles comme :

1.  **Initialisation** : Chargement des données d'entrée (utilisateurs, besoins, règles, période).
2.  **Pré-traitement** :
    - Filtrage des utilisateurs non disponibles (congés, indisponibilités).
    - Identification des contraintes les plus fortes.
3.  **Construction / Affectation Itérative** :
    - L'algorithme tente d'affecter des utilisateurs aux postes vacants, créneau par créneau ou poste par poste.
    - À chaque tentative d'affectation, il consulte le moteur de règles pour vérifier la validité et l'impact de cette affectation.
    - Des stratégies heuristiques, des techniques de recherche (backtracking, recherche locale), ou des approches basées sur des solveurs de contraintes (CSP) peuvent être utilisées.
    - Prise en compte de l'équité en consultant les compteurs et l'historique des affectations.
    - Gestion des spécificités comme les gardes consécutives ou les shifts multiples dans une journée (`docs/technique/NEXT_STEPS.md`).
4.  **Optimisation (Optionnelle)** : Une fois une solution initiale trouvée, une phase d'optimisation peut chercher à améliorer le planning (ex: réduire le nombre de changements, mieux satisfaire les préférences).
5.  **Validation Finale** : Le planning généré est à nouveau validé par le moteur de règles pour identifier les éventuelles violations restantes (surtout pour les règles non bloquantes).

## 5. Interaction avec le Moteur de Règles

- **Validation Continue** : L'algorithme interroge le moteur de règles fréquemment pour s'assurer que les affectations envisagées ou réalisées sont conformes.
- **Guidage par les Règles** : Les règles, en particulier celles de priorité élevée (bloquantes), guident les décisions de l'algorithme.
- **Gestion des Violations** : Si des règles non bloquantes sont violées, l'algorithme peut tenter de les minimiser ou le signaler pour une révision manuelle.
- `docs/technique/NEXT_STEPS.md` mentionne que l'intégration des règles dynamiques avec l'algorithme inclut la "Prise en compte des règles dynamiques lors de la génération" et le "Feedback visuel sur le respect des règles".

## 6. Sorties de l'Algorithme

- **Planning Généré** : Un ensemble d'affectations (utilisateur, poste, date/heure de début, date/heure de fin).
- **Rapport de Génération** :
  - Liste des éventuelles violations de règles (avec leur sévérité).
  - Statistiques sur le planning (taux de couverture, répartition des gardes, etc.).
  - Indicateurs d'équité.
- **Alertes** : Pour les situations où aucune solution satisfaisante n'a pu être trouvée pour certains postes ou contraintes.

## 7. Paramètres de Génération et Ajustements Manuels

- L'interface utilisateur peut permettre de lancer la génération avec certains paramètres (ex: prioriser certaines règles, se concentrer sur une période ou un service spécifique).
- Après la génération, une interface de validation et de modification manuelle (`docs/technique/NEXT_STEPS.md` mentionne cela comme une priorité moyenne) est essentielle pour que les planificateurs puissent ajuster le planning si nécessaire.

## 8. Évolutivité et Performance

- L'algorithme doit être conçu pour gérer un nombre croissant d'utilisateurs, de règles et de postes sans dégradation prohibitive des performances.
- Des optimisations peuvent inclure la parallélisation de certaines tâches, des techniques de mise en cache, ou la simplification des modèles de données pour les calculs intensifs.

## 9. Améliorations Futures (Plan d'Action à Long Terme - `docs/technique/NEXT_STEPS.md`)

- **Algorithme avancé de génération des plannings** :
  - Optimisation multi-objectifs.
  - Apprentissage des préférences implicites.
  - Améliorations basées sur le feedback utilisateur.

---

La conception d'un algorithme de génération de planning est un défi complexe qui nécessite un équilibre entre la satisfaction des contraintes, l'optimisation des ressources, et la performance. L'approche itérative de `mathildanesth`, commençant par une base solide et intégrant progressivement des règles et des fonctionnalités plus avancées, est judicieuse.
