# Suivi en Temps Réel du Bloc Opératoire (Perspective Anesthésie)

## 1. Vue d'ensemble et Positionnement

Le suivi en temps réel de l'activité du bloc opératoire est une fonctionnalité avancée qui vise à donner une visibilité sur le déroulement effectif des opérations par rapport à ce qui était planifié. Pour Mathildanesth, dont le cœur est la planification du personnel d'anesthésie, un tel suivi se concentrerait sur l'adéquation entre le personnel affecté et l'activité réelle, ainsi que sur la gestion des imprévus impactant ce personnel.

Il est important de noter que les fonctionnalités de suivi en temps réel très détaillées (ex: suivi patient par patient, avancement précis d'une intervention, gestion des flux logistiques du bloc) relèvent typiquement de systèmes dédiés à la gestion de bloc opératoire (souvent interfacés avec le Dossier Patient Informatisé). Ce document décrit ce que pourrait être un suivi temps réel pertinent du point de vue de la gestion du personnel d'anesthésie dans Mathildanesth, en gardant à l'esprit que certaines de ces capacités sont identifiées comme des "développements futurs" dans la documentation existante (`docs/modules/bloc-operatoire.md`).

## 2. Objectifs du Suivi en Temps Réel pour la Planification Anesthésie

- **Visibilité sur l'occupation réelle des salles** : Savoir si les salles planifiées sont effectivement ouvertes et si des salles supplémentaires ont dû ouvrir en urgence.
- **Suivi de la présence du personnel d'anesthésie** : Confirmer que le personnel planifié est bien présent et affecté comme prévu.
- **Gestion des aléas et des urgences** :
    - Identifier rapidement l'impact d'une absence imprévue d'un MAR ou IADE.
    - Aider à la réaffectation du personnel en cas de besoin urgent dans une salle.
    - Visualiser l'impact d'un retard important ou d'une annulation d'intervention sur la charge de travail du personnel d'anesthésie.
- **Optimisation des ressources en cours de journée** : Si une salle se libère plus tôt que prévu, identifier si le personnel peut être redéployé.

## 3. Fonctionnalités Envisageables (Conceptuelles / Futures)

### 3.1. Tableau de Bord Dynamique du Bloc
- **Vue synthétique des salles** :
    - Statut de chaque salle (ex: Planifiée, En cours, En attente de nettoyage, Fermée, Urgence).
    - Personnel d'anesthésie (MAR superviseur, IADE) actuellement affecté à chaque salle active.
    - Heure de début prévue vs. heure de début réelle (si cette information peut être capturée).
    - Potentiellement, nom du chirurgien et type d'intervention (générique) en cours.
- **Alertes visuelles** :
    - Salle en retard / en avance significative.
    - Absence non couverte de personnel d'anesthésie.
    - Conflit de supervision.

### 3.2. Capture d'Événements Clés (Interface Manuelle ou Intégration)
Pour alimenter un suivi temps réel, des événements doivent être saisis. Cela pourrait se faire via :
- **Interface manuelle simple dans Mathildanesth** : Permettant à un coordinateur de bloc ou un planificateur de mettre à jour le statut d'une salle ou de signaler un événement majeur (ex: "Salle 3 - Début intervention à 9h15", "Salle 5 - Fin intervention à 12h30", "Urgence en Salle 2").
- **Intégration avec un système de gestion de bloc tiers** : Si un tel système existe et capture ces informations, Mathildanesth pourrait les récupérer via une interface pour mettre à jour sa vue.

### 3.3. Aide à la Décision pour les Réaffectations
- Si un besoin de personnel supplémentaire se manifeste (ex: ouverture de salle d'urgence, absence) :
    - Le système pourrait aider à identifier le personnel "disponible" ou le moins contraint (ex: MAR supervisant une seule autre salle, IADE sur une intervention se terminant bientôt).
    - Visualisation des compétences pour s'assurer que le personnel redéployé est qualifié.

### 3.4. Communication Facilitée
- En cas de changement majeur, faciliter la notification au personnel concerné (potentiellement via les mécanismes décrits dans `../../03_Planning_Generation/04_Publication_Notifications.md` mais adaptés à l'urgence).

## 4. Défis et Prérequis

- **Saisie des données** : La fiabilité d'un suivi temps réel dépend de la qualité et de la fraîcheur des données saisies. Une saisie manuelle peut être chronophage et sujette à oublis.
- **Intégration SIH** : Une intégration poussée avec d'autres systèmes hospitaliers est souvent nécessaire pour un suivi temps réel complet, ce qui représente un défi technique et organisationnel important.
- **Définition du périmètre** : Clarifier quelles informations sont gérées dans Mathildanesth versus d'autres outils pour éviter les doublons et les incohérences.

## 5. Lien avec la Planification a Posteriori

Les données collectées lors du suivi en temps réel (heures de début/fin réelles, aléas) peuvent être précieuses pour :
- L'analyse statistique de l'utilisation du bloc (voir `06_Statistiques_Utilisation_Bloc.md`).
- L'amélioration continue des modèles de planification et des règles (ex: ajuster les durées types des créneaux si des dérives systématiques sont observées).

En conclusion, bien qu'un suivi temps réel complet du bloc soit une entreprise majeure, des fonctionnalités ciblées axées sur la visibilité du personnel d'anesthésie et l'aide à la gestion des imprévus pourraient apporter une valeur ajoutée significative à Mathildanesth, même si elles sont considérées comme des évolutions futures. 