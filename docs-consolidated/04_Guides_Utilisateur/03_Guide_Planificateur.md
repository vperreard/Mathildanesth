# Guide du Planificateur Mathildanesth

Ce guide est destiné aux utilisateurs ayant un rôle de Planificateur (ou un rôle d'Administrateur effectuant des tâches de planification) dans Mathildanesth. Il décrit les fonctionnalités clés pour la création, la gestion et la publication des plannings.

## 1. Introduction au Rôle de Planificateur

En tant que planificateur, votre rôle principal est d'assurer une couverture adéquate des besoins du service en personnel, tout en respectant les règles métier, les contraintes légales, et en veillant à l'équité entre les membres de l'équipe. Vous êtes au cœur de l'utilisation de Mathildanesth pour organiser l'activité.

Vos tâches principales incluent :
- La préparation des données pour la génération de planning (vérification des congés, indisponibilités, besoins spécifiques).
- Le lancement et la supervision de la génération automatique des plannings.
- L'ajustement manuel des plannings générés pour résoudre des conflits ou optimiser les affectations.
- La gestion des demandes d'échanges et des remplacements.
- La publication des plannings pour le personnel.
- Le suivi de l'adéquation entre le planning prévisionnel et les besoins réels.

## 2. Préparation avant la Planification

Avant de générer un nouveau planning, plusieurs étapes de préparation sont recommandées :

### 2.1. Vérification des Données de Base
- **Utilisateurs** : Assurez-vous que la liste des utilisateurs est à jour, avec les bons rôles, temps de travail, compétences et affectations de site.
- **Congés et Absences** : Vérifiez que tous les congés approuvés et les absences prévues pour la période de planification sont correctement saisis et validés dans le système. Ceci est crucial car ils servent d'entrées directes pour l'algorithme.
- **Indisponibilités Personnelles** : Prenez en compte les indisponibilités récurrentes ou ponctuelles déclarées par le personnel.
- **Besoins Spécifiques** : Notez les besoins particuliers pour la période (ex: renfort nécessaire pour une activité exceptionnelle, fermeture de salles).

### 2.2. Configuration des Règles
- En collaboration avec l'Administrateur (ou si vous avez les droits), vérifiez que les [Règles de Planification](../02_Fonctionnalites/03_Planning_Generation/01_Moteur_Regles.md) actives sont celles souhaitées pour la période à planifier.

### 2.3. Gestion des Trames de Planning
- Si votre établissement utilise des [Trames Modèles](../02_Fonctionnalites/07_Gestion_Affectations/03_Trame_Chirurgiens.md) (par exemple pour la trame chirurgiens ou des activités récurrentes), assurez-vous qu'elles sont à jour et actives.

## 3. Génération du Planning

Mathildanesth vise à automatiser une grande partie du processus de génération.

### 3.1. Lancer la Génération Automatique
1.  Accédez à la section **"Planning" > "Génération de Planning"** (ou nom similaire).
2.  Sélectionnez la **période** pour laquelle vous souhaitez générer le planning.
3.  Choisissez le **site** ou le **service** concerné si applicable.
4.  Configurez les **options de génération** :
    -   Mode de génération (ex: par couches successives, complet, optimisation d'un planning existant).
    -   Priorisation de certaines règles ou objectifs (si l'interface le permet).
5.  Lancez la génération. Ce processus peut prendre du temps en fonction de la complexité et de la période.

### 3.2. Suivi et Validation des Propositions
-   Une fois la génération terminée, le système présentera une ou plusieurs propositions de planning.
-   Examinez attentivement les plannings proposés :
    -   Vérifiez la couverture des besoins.
    -   Analysez les **alertes et commentaires** générés par le système (conflits de règles souples, avertissements d'équité, etc.).
    -   Utilisez les outils de visualisation pour évaluer la répartition des tâches, des gardes, des week-ends.
-   Le système peut proposer un [Score d'Évaluation](../02_Fonctionnalites/03_Planning_Generation/03_Scoring_Evaluation.md) pour chaque proposition.

## 4. Ajustements Manuels et Optimisation

Même avec un algorithme performant, des ajustements manuels sont souvent nécessaires.

### 4.1. Interface de Planification Manuelle
-   Utilisez l'interface de planning (souvent une grille hebdomadaire ou mensuelle avec fonction de glisser-déposer) pour :
    -   Modifier des affectations existantes (changer une personne, un horaire, une salle).
    -   Ajouter manuellement des affectations.
    -   Supprimer des affectations.
-   Le système devrait continuer à vérifier les règles et à signaler les conflits lors des modifications manuelles.

### 4.2. Gestion des Conflits
-   Lorsque des conflits sont signalés, analysez leur nature et leur sévérité.
-   Cherchez des solutions pour les résoudre (ex: déplacer une affectation, trouver un remplaçant, discuter avec les personnes concernées).

## 5. Gestion des Échanges et des Remplacements

### 5.1. Demandes d'Échange d'Affectations
-   Les utilisateurs peuvent soumettre des [Demandes d'Échange](../02_Fonctionnalites/08_Echanges_Affectations/01_Processus_Echange.md).
-   En tant que planificateur, vous devrez peut-être valider ces échanges pour vous assurer qu'ils ne créent pas de nouveaux problèmes et respectent les règles et l'équité.

### 5.2. Gestion des Remplacements
-   En cas d'absence imprévue, vous devrez trouver un [Remplaçant](../02_Fonctionnalites/15_Gestion_Remplacements/01_Processus_Remplacement.md).
-   L'application peut vous aider à identifier les personnes disponibles et compétentes.

## 6. Publication du Planning

-   Une fois que vous êtes satisfait du planning (généré et/ou ajusté manuellement) :
    1.  Effectuez une dernière vérification globale.
    2.  Recherchez une action du type **"Publier le Planning"**.
    3.  Confirmez la publication.
-   Une fois publié, le planning devient visible pour l'ensemble du personnel concerné.
-   Des [Notifications](../02_Fonctionnalites/12_Notifications_Alertes/01_Systeme_Notifications.md) sont généralement envoyées pour informer de la publication ou des modifications importantes.

## 7. Suivi et Analyse Post-Publication

-   **Suivi des Indicateurs** : Utilisez les [Tableaux de Bord et Statistiques](../02_Fonctionnalites/06_Analytics/01_Tableau_Bord_Statistiques.md) pour suivre l'équité, le temps de travail, l'occupation des salles, etc.
-   **Recueil des Retours** : Soyez à l'écoute des retours du personnel concernant le planning.
-   **Adaptation Continue** : Utilisez ces informations pour affiner les règles et améliorer les prochains cycles de planification.

## 8. Cas Spécifiques : Planning du Bloc Opératoire

La planification du personnel d'anesthésie au bloc opératoire implique des spécificités :
-   **Synchronisation avec la Trame Chirurgicale** : Le planning des anesthésistes dépend de l'occupation des salles par les chirurgiens.
-   **Règles de Supervision** : Application des [Règles de Supervision du Bloc](../02_Fonctionnalites/04_Bloc_Operatoire/03_Regles_Supervision_Bloc.md).
-   **Gestion des Équipes MAR/IADE** par salle.
-   (Voir la section [Bloc Opératoire](../02_Fonctionnalites/04_Bloc_Operatoire/) pour plus de détails).

## 9. Bonnes Pratiques pour Planificateurs

-   **Anticipation** : Commencez le processus de planification suffisamment à l'avance.
-   **Rigueur** : Soyez méticuleux dans la vérification des données et des plannings.
-   **Communication** : Communiquez clairement avec les équipes, en particulier en cas de changements ou de difficultés.
-   **Flexibilité et Réactivité** : Soyez prêt à ajuster les plannings en fonction des imprévus.
-   **Collaboration** : Travaillez en étroite collaboration avec les administrateurs pour la configuration des règles et avec les responsables de service pour les besoins spécifiques.

---

Ce guide vous donne les clés pour utiliser efficacement Mathildanesth en tant que planificateur. La maîtrise de ces outils et processus contribuera à une organisation optimale et équitable du travail au sein de votre service. 