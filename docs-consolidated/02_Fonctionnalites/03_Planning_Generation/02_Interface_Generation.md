# Interface de Génération de Planning

## 1. Vue d'ensemble

L'interface de génération de planning est l'outil central permettant aux planificateurs de lancer, configurer, et superviser la création automatique des plannings. Elle doit être à la fois puissante pour offrir toutes les options nécessaires, et intuitive pour une prise en main rapide.

L'objectif est de guider l'utilisateur à travers les étapes de configuration du cycle de génération, de lui donner une visibilité sur le processus, et de lui permettre d'intervenir si besoin.

## 2. Accès à l'Interface

- L'interface de génération est accessible via un menu dédié, généralement réservé aux utilisateurs avec les rôles `ADMIN` ou `PLANNER`.
- Elle pourrait se trouver dans une section "Planning" > "Générer un nouveau planning" ou "Cycles de Génération".

## 3. Paramètres de Génération Principaux

Avant de lancer une génération, le planificateur doit pouvoir configurer plusieurs paramètres essentiels :

### 3.1. Période Concernée
- **Date de début et Date de fin** : Sélection de la plage de dates pour laquelle le planning doit être généré (ex: du 01/07/2024 au 31/07/2024).
- **Type de période pré-sélectionnable** : Options pour "Semaine prochaine", "Mois prochain", "Trimestre prochain", etc.

### 3.2. Population Cible
- **Services/Unités** : Sélection des services ou unités organisationnelles concernés par cette génération.
- **Rôles Professionnels** : Possibilité de générer le planning pour tous les rôles ou de cibler des rôles spécifiques (ex: générer d'abord les gardes des MARs, puis les affectations des IADEs).
- **Utilisateurs spécifiques** : Option pour inclure/exclure certains individus si nécessaire (pour des cas très particuliers).

### 3.3. Scénario de Règles à Appliquer
- **Jeu de règles actif** : Si plusieurs configurations de règles existent (ex: "Règles standard", "Règles période estivale", "Règles COVID"), le planificateur choisit celui à utiliser.
- **Option de prévisualisation des règles** : Un lien ou un modal pour revoir rapidement les principales règles qui seront appliquées.

### 3.4. Mode de Génération
- **Génération complète** : Le système tente de remplir toutes les affectations pour la période et la population données.
- **Génération partielle/incrémentale** (fonctionnalité avancée) : Ne générer que certaines couches du planning (ex: uniquement les gardes) ou compléter un planning existant.
- **Simulation** : Lancer la génération sans sauvegarder immédiatement les résultats, pour évaluer la qualité et les conflits potentiels.

## 4. Lancement et Suivi de la Génération

- **Bouton "Lancer la Génération"** : Clairement identifiable.
- **Indicateur de progression** : Une barre de progression, un message de statut (ex: "Étape 1/5 : Placement des gardes..."), et un temps estimé restant si possible.
- **Journal des opérations (log)** : Affichage en temps réel (ou quasi-réel) des principales actions du moteur, des règles appliquées, et des décisions prises. Cela aide à la transparence.
- **Possibilité d'interruption** : Un bouton pour annuler le processus de génération en cours (avec confirmation).

## 5. Visualisation des Résultats Préliminaires

Une fois la génération terminée (ou en mode simulation) :

- **Affichage du planning proposé** : Dans une vue calendaire similaire à la consultation de planning habituelle.
- **Mise en évidence des conflits et problèmes** :
    - Les affectations qui violent des règles (surtout les règles souples, car les dures devraient être évitées par le moteur ou clairement identifiées comme des échecs partiels) ou les besoins non couverts sont clairement signalés visuellement (couleurs, icônes, annotations).
    - En cas d'échec de génération pour certains jours, utilisateurs ou affectations, l'interface doit clairement indiquer les éléments posant problème (ex: "Impossible de planifier Dr. Untel le Lundi 5 en raison de la règle X et de l'indisponibilité Y").
    - Le journal des opérations peut lister les règles spécifiques violées et les raisons des échecs.
- **Statistiques clés** : Affichage d'un résumé : 
    - Taux de couverture des besoins.
    - Nombre de violations de règles (par type/priorité).
    - Indicateurs d'équité (ex: moyenne des gardes par personne, écart-type).
    - Potentiel score global du planning.

## 6. Options Post-Génération (avant validation)

Depuis cette interface, avant de valider et publier le planning :

- **Accepter le planning** : Sauvegarde le planning généré comme version de travail.
- **Relancer avec des paramètres ajustés** : Si le résultat n'est pas satisfaisant, retour facile à l'étape de configuration.
- **Passer en mode d'ajustement manuel** : Ouvrir le planning dans l'interface d'édition pour des modifications manuelles (voir `03_Validation_Manuelle_Ajustements.md`). En cas d'échec partiel de la génération, c'est souvent l'étape suivante pour résoudre les problèmes identifiés.
- **Sauvegarder comme brouillon/scénario** : Conserver cette proposition de planning sans qu'elle devienne la version active, pour comparaison ultérieure.

## 7. Ergonomie et Aide Utilisateur

- **Info-bulles et aides contextuelles** pour chaque paramètre.
- **Messages clairs** en cas d'erreur ou de problème.
- **Design épuré** pour ne pas surcharger l'utilisateur malgré la densité des options.

Cette interface est un point de contrôle critique et doit équilibrer la richesse fonctionnelle avec la simplicité d'utilisation. 