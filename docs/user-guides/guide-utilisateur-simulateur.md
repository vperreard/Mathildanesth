# Guide Utilisateur : Simulateur de Planning et Moteur de Règles

## Table des matières

1. [Introduction](#introduction)
2. [Guide d'utilisation étape par étape](#guide-dutilisation-étape-par-étape)
   1. [Accès au simulateur](#accès-au-simulateur)
   2. [Configuration de base](#configuration-de-base)
   3. [Configuration avancée des règles](#configuration-avancée-des-règles)
   4. [Génération et simulation](#génération-et-simulation)
   5. [Analyse des résultats](#analyse-des-résultats)
   6. [Application du planning](#application-du-planning)
3. [Configurations optimales](#configurations-optimales)
   1. [Préréglages standards](#préréglages-standards)
   2. [Personnalisation des configurations](#personnalisation-des-configurations)
   3. [Configuration pour l'équité](#configuration-pour-léquité)
   4. [Configuration pour les préférences](#configuration-pour-les-préférences)
   5. [Configuration pour la qualité de vie](#configuration-pour-la-qualité-de-vie)
4. [Métriques et indicateurs](#métriques-et-indicateurs)
   1. [Score d'équité](#score-déquité)
   2. [Score de fatigue](#score-de-fatigue)
   3. [Score de satisfaction](#score-de-satisfaction)
   4. [Violations des règles](#violations-des-règles)
   5. [Répartition des affectations](#répartition-des-affectations)
5. [Résolution des problèmes courants](#résolution-des-problèmes-courants)
   1. [Violations de règles critiques](#violations-de-règles-critiques)
   2. [Équilibrage des gardes](#équilibrage-des-gardes)
   3. [Gestion des préférences contradictoires](#gestion-des-préférences-contradictoires)
   4. [Optimisation des performances](#optimisation-des-performances)
   5. [Résolution des conflits](#résolution-des-conflits)
6. [Glossaire](#glossaire)

## Introduction

Le Simulateur de Planning et le Moteur de Règles constituent un système sophistiqué conçu pour générer, valider et optimiser les plannings du personnel médical. Ce système permet de concilier de multiples contraintes complexes : équité dans la répartition des gardes, respect des préférences personnelles, gestion de la fatigue, et garantie de la couverture médicale nécessaire.

Ce guide vous accompagnera dans l'utilisation complète du simulateur, depuis la configuration initiale jusqu'à l'application finale du planning généré, en passant par l'analyse des résultats et la résolution des problèmes courants.

## Guide d'utilisation étape par étape

### Accès au simulateur

1. **Connexion** : Connectez-vous à l'application avec vos identifiants personnels
2. **Navigation** : Accédez au simulateur depuis le menu principal en cliquant sur "Planning" > "Simulateur multi-planning"
3. **Interface principale** : Familiarisez-vous avec l'interface qui comprend :
   - Panel de configuration (gauche)
   - Visualisation du planning (centre)
   - Métriques et indicateurs (droite)

### Configuration de base

1. **Période de planification** :
   - Sélectionnez la période de génération (3 mois, 4 mois, ou personnalisée)
   - Pour une période personnalisée, utilisez les sélecteurs de date pour définir la date de début et la date de fin

2. **Étapes actives** :
   - Sélectionnez les types d'affectations à générer :
     - Gardes
     - Astreintes
     - Consultations
     - Bloc opératoire

3. **Options générales** :
   - Cochez "Conserver les affectations existantes" pour respecter les assignations déjà validées
   - Définissez le niveau d'optimisation (rapide, standard, approfondi)
   - Activez ou désactivez l'application des préférences personnelles

### Configuration avancée des règles

1. **Règles d'intervalles** :
   - Définissez le nombre minimum de jours entre deux gardes (valeur recommandée : 7)
   - Définissez l'espacement optimal des gardes en jours (valeur recommandée : 21)
   - Configurez le nombre maximum de gardes par mois (valeur par défaut : 3)

2. **Règles de supervision** :
   - Configurez le nombre maximum de salles supervisées par secteur
   - Définissez les règles de compatibilité entre secteurs

3. **Règles d'équité** :
   - Ajustez le poids des gardes de weekend (valeur par défaut : 1.5)
   - Ajustez le poids des gardes lors des jours fériés (valeur par défaut : 2)
   - Activez ou désactivez l'équilibrage par spécialités

4. **Règles de qualité de vie** :
   - Définissez le poids à accorder aux préférences personnelles
   - Activez l'option pour éviter les affectations consécutives
   - Activez l'option de récupération après garde de nuit

### Génération et simulation

1. **Préréglages rapides** :
   - Sélectionnez un préréglage parmi les options disponibles :
     - Priorité à l'équité
     - Priorité aux préférences
     - Priorité à la qualité de vie
     - Optimisation maximale

2. **Pondération personnalisée** :
   - Ajustez les curseurs pour définir les poids relatifs :
     - Poids équité (0.0 - 1.0)
     - Poids préférences (0.0 - 1.0)
     - Poids qualité de vie (0.0 - 1.0)

3. **Lancement de la simulation** :
   - Cliquez sur "Générer une simulation"
   - Nommez votre simulation pour faciliter l'identification
   - Ajoutez une description optionnelle

4. **Génération multiple** :
   - Générez plusieurs simulations avec des paramètres différents
   - Comparez les résultats côte à côte

### Analyse des résultats

1. **Visualisation du planning** :
   - Parcourez le planning généré par date et par type d'affectation
   - Utilisez les filtres pour afficher uniquement certains types d'affectations
   - Survolez les affectations pour voir les détails

2. **Analyse des métriques** :
   - Consultez le tableau de bord des métriques pour chaque simulation
   - Comparez les scores d'équité, de fatigue et de satisfaction
   - Visualisez le nombre et la gravité des violations de règles

3. **Analyse des violations** :
   - Consultez la liste des violations détectées
   - Triez les violations par gravité, type ou personne concernée
   - Accédez aux détails de chaque violation pour comprendre le problème

4. **Comparaison des simulations** :
   - Sélectionnez plusieurs simulations pour les comparer
   - Analysez les différences de métriques entre les simulations
   - Identifiez le meilleur compromis selon vos priorités

### Application du planning

1. **Sélection finale** :
   - Choisissez la simulation qui présente le meilleur équilibre selon vos critères
   - Vérifiez une dernière fois les violations de règles

2. **Validation et application** :
   - Cliquez sur "Appliquer cette simulation"
   - Confirmez votre choix dans la boîte de dialogue
   - Le planning est désormais appliqué et visible pour tout le personnel

3. **Exportation et partage** :
   - Exportez le planning au format PDF, Excel ou pour l'intégration calendrier
   - Partagez le planning avec l'équipe via l'option de notification

## Configurations optimales

### Préréglages standards

Le simulateur propose quatre préréglages standards pour répondre aux besoins les plus courants :

| Préréglage | Description | Cas d'utilisation |
|------------|-------------|-------------------|
| Priorité à l'équité | Favorise une répartition équitable des gardes et astreintes | Période normale sans contraintes particulières |
| Priorité aux préférences | Respecte au maximum les préférences personnelles | Périodes de fêtes ou vacances scolaires |
| Priorité à la qualité de vie | Minimise la fatigue et optimise les temps de repos | Périodes à forte charge de travail |
| Optimisation maximale | Recherche approfondie de la meilleure solution possible | Plannings complexes avec nombreuses contraintes |

### Personnalisation des configurations

Pour une configuration personnalisée optimale, suivez ces principes :

1. **Équilibrez les pondérations** :
   - Évitez les valeurs extrêmes (0.0 ou 1.0) sauf cas très particuliers
   - La somme des trois poids (équité, préférences, qualité de vie) ne doit pas nécessairement être égale à 1, mais gardez-les équilibrés

2. **Adaptez selon la période** :
   - Périodes de vacances : augmentez le poids des préférences
   - Périodes chargées : augmentez le poids de la qualité de vie
   - Périodes normales : maintenez un équilibre avec légère préférence pour l'équité

### Configuration pour l'équité

Configuration optimale pour maximiser l'équité entre les membres de l'équipe :

```
poidsEquite: 0.8
poidsPreference: 0.2
poidsQualiteVie: 0.4

Règles d'équité:
  poidsGardesWeekend: 2.0
  poidsGardesFeries: 2.5
  equilibrageSpecialites: true
```

Cette configuration est recommandée lorsque :
- Des tensions apparaissent concernant la répartition des gardes
- Après une période où certains membres ont été plus sollicités que d'autres
- Pour rééquilibrer après plusieurs mois de planification basée sur les préférences

### Configuration pour les préférences

Configuration optimale pour respecter au maximum les préférences individuelles :

```
poidsEquite: 0.3
poidsPreference: 0.9
poidsQualiteVie: 0.6

Règles de qualité de vie:
  poidsPreferences: 0.9
```

Cette configuration est recommandée pour :
- Les périodes de fêtes (Noël, jour de l'An)
- Les vacances scolaires
- Les périodes avec des événements personnels importants pour l'équipe

### Configuration pour la qualité de vie

Configuration optimale pour réduire la fatigue et améliorer l'équilibre vie professionnelle/vie personnelle :

```
poidsEquite: 0.4
poidsPreference: 0.6
poidsQualiteVie: 0.9

Règles de qualité de vie:
  eviterConsecutifs: true
  recuperationApresGardeNuit: true

Règles d'intervalle:
  minJoursEntreGardes: 10
  minJoursRecommandes: 28

Configuration de fatigue:
  points:
    garde: 40
    astreinte: 15
    supervisionMultiple: 15
    pediatrie: 10
    jour: -20
    weekend: -30
  tauxRecuperation: 12
```

Cette configuration est recommandée lors de :
- Périodes à forte charge de travail
- Après plusieurs semaines intensives
- Lorsque plusieurs membres de l'équipe approchent de leurs limites de fatigue

## Métriques et indicateurs

### Score d'équité

Le score d'équité (0-100) mesure la répartition équitable des affectations entre les membres de l'équipe.

**Calcul** : Basé sur plusieurs facteurs pondérés :
- Écart-type de la distribution des gardes (coefficient Gini)
- Répartition des weekends et jours fériés
- Équilibrage des spécialités et charges de travail

**Interprétation** :
- 90-100 : Répartition parfaitement équitable
- 70-89 : Bonne répartition avec quelques déséquilibres mineurs
- 50-69 : Répartition acceptable avec des déséquilibres notables
- < 50 : Répartition déséquilibrée nécessitant une révision

**Amélioration** :
- Augmentez le poids d'équité dans la configuration
- Vérifiez les contraintes personnelles qui pourraient forcer des déséquilibres
- Assurez-vous que les compteurs historiques sont correctement initialisés

### Score de fatigue

Le score de fatigue (0-100) évalue le niveau de repos et la prévention du surmenage dans le planning.

**Calcul** : Basé sur le système de points de fatigue :
- Addition des points pour chaque type d'affectation
- Soustraction des points pour les jours de repos
- Prise en compte du taux de récupération personnalisé

**Interprétation** :
- 90-100 : Excellent équilibre travail/repos
- 70-89 : Bon équilibre avec quelques pics de charge acceptables
- 50-69 : Charge de travail élevée mais gérable
- < 50 : Risque de surmenage, révision nécessaire

**Amélioration** :
- Augmentez le poids de qualité de vie dans la configuration
- Activez l'option de récupération après garde de nuit
- Augmentez l'espacement minimum entre les gardes

### Score de satisfaction

Le score de satisfaction (0-100) mesure le respect des préférences personnelles.

**Calcul** : Basé sur :
- Taux de respect des préférences explicites
- Évitement des incompatibilités déclarées
- Respect des affinités positives exprimées

**Interprétation** :
- 90-100 : Respect optimal des préférences
- 70-89 : Bon respect avec quelques compromis mineurs
- 50-69 : Compromis significatifs mais acceptables
- < 50 : Nombreuses préférences non respectées

**Amélioration** :
- Augmentez le poids des préférences dans la configuration
- Vérifiez que les préférences sont correctement enregistrées
- Identifiez les préférences contradictoires dans l'équipe

### Violations des règles

Les violations sont classées selon leur gravité :

| Niveau | Description | Action requise |
|--------|-------------|----------------|
| CRITIQUE | Violation majeure rendant le planning inutilisable | Correction immédiate obligatoire |
| MAJEURE | Violation importante affectant significativement la qualité | Correction recommandée |
| MINEURE | Écart aux bonnes pratiques sans impact majeur | Correction optionnelle |

**Types de violations fréquentes** :
- CONSECUTIVE_SHIFTS : Shifts consécutifs sans période de repos suffisante
- WEEKEND_OVERLOAD : Trop de week-ends travaillés consécutifs
- FATIGUE_LIMIT : Niveau de fatigue critique atteint
- EQUITY_VIOLATION : Distribution inéquitable des gardes

**Analyse des violations** :
- Le tableau de violations indique le type, la gravité, la description et les personnes concernées
- Utilisez les filtres pour identifier les modèles récurrents
- Priorisez la résolution des violations critiques et majeures

### Répartition des affectations

L'analyse des affectations fournit une vision claire de la distribution du travail :

**Comptage par type** :
- Nombre de gardes
- Nombre d'astreintes
- Nombre de consultations
- Nombre d'affectations en bloc
- Total des affectations

**Visualisations disponibles** :
- Diagrammes circulaires par type d'affectation
- Histogrammes de répartition par personne
- Calendrier avec code couleur par type d'affectation
- Courbes de fatigue prévisionnelle

**Utilisation optimale** :
- Comparez les répartitions entre différentes simulations
- Identifiez les déséquilibres spécifiques à certains types d'affectations
- Analysez l'évolution dans le temps des charges de travail

## Résolution des problèmes courants

### Violations de règles critiques

**Problème** : Le planning généré contient des violations critiques.

**Solutions** :
1. **Identifier la nature des violations** :
   - Consultez la liste détaillée des violations
   - Regroupez-les par type pour identifier des patterns

2. **Ajuster les paramètres** :
   - Pour les violations d'intervalle : augmentez le nombre minimum de jours entre gardes
   - Pour les violations de fatigue : activez la récupération après garde et augmentez son importance
   - Pour les violations d'équité : augmentez le poids de l'équité et vérifiez les compteurs historiques

3. **Générer une nouvelle simulation** :
   - Avec les paramètres ajustés
   - Utilisez le niveau d'optimisation "approfondi" pour une meilleure résolution des contraintes

4. **En dernier recours** :
   - Identifiez les contraintes irréconciliables
   - Envisagez d'assouplir temporairement certaines règles non critiques
   - Consultez l'équipe pour des solutions acceptables par tous

### Équilibrage des gardes

**Problème** : Déséquilibre persistant dans la répartition des gardes.

**Solutions** :
1. **Vérifier les compteurs historiques** :
   - Assurez-vous que les compteurs de gardes antérieures sont correctement initialisés
   - Vérifiez que le système prend en compte l'historique correctement

2. **Ajuster les paramètres d'équité** :
   - Augmentez significativement le poids de l'équité (0.8 ou plus)
   - Configurez correctement les poids des gardes weekend et jours fériés
   - Activez l'équilibrage par spécialités si pertinent

3. **Analyser les contraintes personnelles** :
   - Identifiez si certaines contraintes personnelles créent des déséquilibres structurels
   - Discutez avec l'équipe de possibles ajustements temporaires
   - Envisagez des compensations pour les personnes systématiquement plus sollicitées

4. **Utiliser le rééquilibrage forcé** :
   - Dans les cas extrêmes, activez l'option de rééquilibrage forcé
   - Cette option donnera priorité absolue à l'équité, même au détriment d'autres critères

### Gestion des préférences contradictoires

**Problème** : Impossibilité de satisfaire toutes les préférences contradictoires.

**Solutions** :
1. **Analyser les conflits de préférences** :
   - Utilisez l'outil d'analyse des préférences pour identifier les contradictions
   - Quantifiez l'impact des conflits sur la génération du planning

2. **Établir des priorités** :
   - Définissez un système clair de priorité entre les préférences
   - Distinguez les préférences "fortes" des préférences "souhaitables"
   - Alternez les priorités sur différentes périodes pour l'équité à long terme

3. **Proposer des compromis** :
   - Générez plusieurs simulations avec différentes priorités
   - Présentez les alternatives à l'équipe
   - Facilitez la discussion pour trouver un consensus acceptable

4. **Rotation des priorités** :
   - Implémentez un système de rotation des priorités de préférences
   - Documentez clairement quelles préférences ont été priorisées et pour qui
   - Planifiez d'avance les rotations futures pour la transparence

### Optimisation des performances

**Problème** : Temps de génération excessif ou qualité insuffisante des plannings.

**Solutions** :
1. **Ajuster le niveau d'optimisation** :
   - Pour des résultats rapides mais acceptables : utilisez le niveau "rapide"
   - Pour un équilibre temps/qualité : utilisez le niveau "standard"
   - Pour la meilleure qualité possible : utilisez le niveau "approfondi"

2. **Réduire la complexité** :
   - Limitez la période de génération (3 mois maximum recommandé)
   - Générez les différents types d'affectations séparément
   - Réduisez temporairement le nombre de contraintes non essentielles

3. **Optimiser par étapes** :
   - Générez d'abord les gardes et astreintes
   - Validez cette couche avant de passer aux consultations
   - Terminez par la planification du bloc opératoire
   - Cette approche réduit la complexité à chaque étape

4. **Utiliser la génération incrémentale** :
   - Générez un mois, validez-le, puis le mois suivant
   - Verrouillez les affectations validées avant de poursuivre
   - Cette approche permet une meilleure maîtrise du processus

### Résolution des conflits

**Problème** : Conflits persistants entre règles différentes ou préférences/contraintes incompatibles.

**Solutions** :
1. **Identifier la nature du conflit** :
   - Utilisez l'outil d'analyse des conflits pour identifier les règles contradictoires
   - Déterminez si le conflit est structurel ou ponctuel

2. **Établir une hiérarchie des règles** :
   - Classez les règles par importance pour votre établissement
   - Configurez la priorité des règles dans le moteur (poids relatifs)
   - Documentez cette hiérarchie pour la transparence

3. **Créer des exceptions temporaires** :
   - Désactivez temporairement certaines règles non critiques
   - Créez des exceptions documentées avec date d'expiration
   - Assurez un suivi rigoureux des exceptions actives

4. **Approche participative** :
   - Présentez les conflits irréconciliables à l'équipe
   - Sollicitez des propositions de résolution
   - Votez sur les compromis acceptables pour tous
   - Documentez les décisions pour référence future

## Glossaire

**Affectation** : Attribution d'un personnel à une tâche spécifique (garde, astreinte, consultation, bloc).

**Astreinte** : Période pendant laquelle le personnel reste disponible sans être présent sur site.

**Configuration de fatigue** : Paramètres définissant l'accumulation et la récupération de fatigue.

**Équité** : Répartition équilibrée des charges de travail entre les membres de l'équipe.

**Garde** : Présence obligatoire sur site pendant une période déterminée, généralement 24h.

**Indicateur** : Mesure quantitative d'un aspect spécifique du planning.

**Métrique** : Valeur calculée reflétant la qualité du planning selon un critère spécifique.

**Moteur de règles** : Système qui évalue le respect des contraintes et règles définies.

**Optimisation** : Processus d'amélioration du planning selon des critères définis.

**Paramètres de génération** : Configuration utilisée pour la création du planning.

**Préréglage** : Ensemble prédéfini de paramètres optimisés pour un objectif spécifique.

**Règle** : Contrainte formelle que le planning doit respecter.

**Secteur** : Regroupement logique de salles opératoires.

**Simulation** : Version provisoire du planning générée pour évaluation.

**Violation** : Non-respect d'une règle définie dans le système. 