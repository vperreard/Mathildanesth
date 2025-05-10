# Gestion des Compétences du Personnel

## Introduction

La prise en compte des compétences spécifiques du personnel (MAR, IADE) est essentielle pour assurer la qualité et la sécurité des soins, notamment lors de l'affectation à des postes ou des types d'interventions particuliers. Mathildanesth doit permettre de définir un référentiel de compétences, d'associer ces compétences au personnel, et d'utiliser cette information lors de la planification.
Cette fonctionnalité est identifiée comme "Indispensable V1 (Préférences/Interdits)" dans `MATHILDA`.

## Objectifs

- Définir une liste de compétences pertinentes pour le service d'anesthésie.
- Associer les compétences acquises à chaque membre du personnel.
- Utiliser les compétences comme critère lors de l'affectation (règles d'interdiction ou de préférence).
- Permettre aux administrateurs de gérer ce référentiel et ces associations.

## Composantes de la Fonctionnalité

### 1. Définition du Référentiel de Compétences

- **Interface Administrateur :**
  - Permettre aux administrateurs de créer, modifier, et supprimer des compétences dans un référentiel centralisé.
  - Exemples de compétences (issus de `MATHILDA`) : Pédiatrie, ALR (Anesthésie Loco-Régionale), Thoracique, Neurochirurgie, etc.
- **Propriétés d'une Compétence :**
  - Nom de la compétence (ex: "Anesthésie Pédiatrique Avancée").
  - Code unique.
  - Description optionnelle.
  - Domaine/Catégorie (ex: Type d'anesthésie, Type de patient, Technique spécifique).
  - Niveau de compétence (Optionnel, si une granularité plus fine est souhaitée : ex: Novice, Confirmé, Expert). Pour une V1, une simple possession de la compétence peut suffire.

### 2. Association des Compétences au Personnel

- **Interface d'Administration des Profils Utilisateurs (`../../01_Utilisateurs_Profils/01_Modele_Utilisateur.md`) :**
  - Dans le profil de chaque utilisateur (MAR, IADE), l'administrateur doit pouvoir associer les compétences que la personne possède.
  - Possibilité d'indiquer une date d'acquisition ou de validité (optionnel, pour compétences nécessitant revalidation périodique).
- **Modèle de Données :**
  - Table `Skill` pour le référentiel.
  - Table de liaison `UserSkill` (ou similaire) pour associer `User` et `Skill`, potentiellement avec des attributs supplémentaires (niveau, date d'obtention).

### 3. Utilisation des Compétences dans la Planification

L'information sur les compétences est cruciale pour le moteur de règles (`../03_Planning_Generation/01_Moteur_Regles.md`) et l'algorithme de génération (`../03_Planning_Generation/02_Algorithme_Generation.md`).

- **Configuration des Règles Associées aux Compétences (`MATHILDA`) :**
  - **Interdit :** Le personnel sans la compétence X ne PEUT PAS être affecté à une salle, un secteur, ou un type d'intervention nécessitant la compétence X. (Ex: Pas d'affectation en anesthésie pédiatrique si la compétence "Pédiatrie" n'est pas validée pour la personne).
  - **Préférence :** L'algorithme TENTERA en priorité d'affecter du personnel avec la compétence X à une salle/vacation nécessitant X. (Ex: Préférer un IADE formé ALR pour une salle où des ALR sont prévues).
  - **Requis :** Un certain nombre de personnes avec la compétence X doivent être présentes dans tel secteur/salle.
- **Association entre Compétence Requise et Contexte :**
  - Les besoins en compétences peuvent être définis au niveau :
    - D'un **type d'affectation** (ex: une garde en réanimation pédiatrique requiert la compétence X).
    - D'une **salle d'opération** (ex: la salle de neurochirurgie requiert du personnel avec compétence Y).
    - D'un **secteur opératoire**.
    - D'une **spécialité chirurgicale** (issue de la trame chirurgiens - `../07_Gestion_Affectations/03_Trame_Chirurgiens.md`).
- **Impact sur l'Affectation :**
  - L'algorithme de génération filtre les candidats possibles pour une affectation en fonction des compétences requises.
  - Les règles de compétence sont vérifiées lors des modifications manuelles du planning pour éviter des affectations inappropriées.
  - Les conflits de compétences (`../03_Planning_Generation/04_Gestion_Conflits.md`) sont signalés si une affectation ne respecte pas ces règles.

## Interface Utilisateur

- **Pour les Administrateurs :**
  - CRUD pour le référentiel de compétences.
  - Assignation des compétences aux utilisateurs.
  - Configuration des compétences requises par salle/secteur/type d'intervention.
- **Pour Tous les Utilisateurs (Optionnel) :**
  - Visualisation de leurs propres compétences enregistrées dans leur profil.
  - Potentiellement, voir les compétences requises pour certaines affectations sur le planning.

## Conclusion

La gestion des compétences est un levier important pour la sécurité et la qualité des soins. En l'intégrant au processus de planification, Mathildanesth s'assure que le bon personnel, avec les bonnes compétences, est affecté au bon endroit et au bon moment. La distinction entre règles d'interdiction et règles de préférence offre la flexibilité nécessaire pour gérer des situations variées.
