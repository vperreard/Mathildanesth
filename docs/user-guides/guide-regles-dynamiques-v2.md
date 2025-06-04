# Guide Utilisateur - Module de Règles Dynamiques V2

## Vue d'ensemble

Le module de règles dynamiques V2 permet de créer, gérer et appliquer des règles métier complexes pour la génération et validation des plannings. Ce système offre une interface intuitive pour définir des conditions et actions sans programmation.

## Accès au module

1. Connectez-vous avec un compte administrateur
2. Accédez à **Administration** > **Règles de Planning**
3. URL directe : `/admin/planning-rules`

## Interface principale

### 1. Liste des règles

L'écran principal affiche toutes les règles existantes avec :
- **Nom et description** de la règle
- **Statut** : Brouillon, Actif, Inactif
- **Version** actuelle
- **Priorité** (1-100, 100 étant la plus haute)
- **Métriques** : taux d'application et violations
- **Actions** : Éditer, Dupliquer, Archiver

### 2. Filtres et recherche

- **Filtrer par statut** : Toutes, Actives, Brouillons, Inactives
- **Filtrer par type** : Validation, Génération, Transformation
- **Recherche** par nom ou description
- **Tri** par priorité, date de création, performance

## Création d'une règle

### Étape 1 : Informations de base

1. Cliquez sur **Nouvelle règle**
2. Remplissez :
   - **Nom** : Identifiant unique et descriptif
   - **Description** : Explication détaillée de l'objectif
   - **Type** : 
     - *Validation* : Vérifie la conformité
     - *Génération* : Crée des affectations
     - *Transformation* : Modifie des données existantes
   - **Priorité** : 1-100 (les règles de priorité haute s'exécutent en premier)

### Étape 2 : Définir les conditions

Les conditions déterminent quand la règle s'applique.

#### Types de conditions disponibles :

**1. Conditions temporelles**
- Jour de la semaine (ex: Lundi, Mardi...)
- Période (ex: Matin, Après-midi, Nuit)
- Date spécifique ou plage de dates
- Jours fériés

**2. Conditions sur les ressources**
- Spécialité du praticien
- Niveau d'expérience (Junior, Senior)
- Compétences spécifiques
- Disponibilité

**3. Conditions sur les salles**
- Type de salle (ex: Cardiologie, Endoscopie)
- Capacité requise
- Équipements nécessaires

**4. Conditions de charge**
- Nombre minimum/maximum de praticiens
- Ratio par spécialité
- Couverture des urgences

#### Opérateurs logiques :
- **ET** : Toutes les conditions doivent être vraies
- **OU** : Au moins une condition doit être vraie
- **NON** : Inverse la condition

### Étape 3 : Définir les actions

Les actions sont exécutées quand les conditions sont remplies.

#### Types d'actions :

**1. Affectation**
- Assigner un praticien à une salle
- Créer une garde
- Définir un remplacement

**2. Validation**
- Bloquer une affectation invalide
- Générer une alerte
- Demander une confirmation

**3. Notification**
- Envoyer un email
- Créer une notification dans l'application
- Générer un rapport

### Étape 4 : Aperçu et test

1. **Aperçu en temps réel** : Visualisez l'impact de votre règle
2. **Mode simulation** : Testez sur des données réelles sans appliquer
3. **Détection de conflits** : Identifie les incompatibilités avec d'autres règles

## Gestion des conflits

### Types de conflits détectés :

1. **Chevauchement de conditions** : Deux règles s'appliquent au même contexte
2. **Actions contradictoires** : Les actions s'annulent mutuellement
3. **Conflits de ressources** : Affectation multiple d'une même ressource
4. **Conflits temporels** : Incompatibilité d'horaires

### Stratégies de résolution :

- **Priorité** : La règle de priorité haute l'emporte
- **Chronologique** : La règle la plus récente s'applique
- **Manuelle** : L'administrateur choisit
- **Combinaison** : Fusion des actions compatibles

## Modèles de règles

### Utilisation des modèles :

1. Accédez à l'onglet **Modèles**
2. Parcourez les modèles par catégorie :
   - Couverture minimale
   - Équilibrage des charges
   - Règles de sécurité
   - Optimisation des ressources
3. Cliquez sur **Utiliser ce modèle**
4. Personnalisez selon vos besoins

### Modèles recommandés :

- **Garde minimale week-end** : Assure la présence d'au moins 2 seniors
- **Rotation équitable** : Distribue équitablement les gardes
- **Compétences critiques** : Garantit la présence de spécialistes
- **Repos réglementaire** : Respecte les temps de repos obligatoires

## Surveillance et métriques

### Tableau de bord des performances :

- **Taux d'application** : Pourcentage de fois où la règle s'applique
- **Violations détectées** : Nombre de conflits identifiés
- **Impact** : Nombre d'affectations modifiées
- **Temps d'exécution** : Performance de la règle

### Alertes automatiques :

- Règle jamais appliquée après 30 jours
- Taux de violation > 20%
- Performance dégradée
- Conflits récurrents

## Historique et versioning

### Gestion des versions :

1. Chaque modification crée une nouvelle version
2. Accédez à l'historique via **Voir l'historique**
3. Comparez les versions côte à côte
4. Restaurez une version antérieure si nécessaire

### Traçabilité :

- Auteur de chaque modification
- Date et heure précises
- Commentaire de modification
- Diff des changements

## Bonnes pratiques

### 1. Conception de règles efficaces

- **Simplicité** : Une règle = un objectif clair
- **Testabilité** : Toujours tester en simulation d'abord
- **Documentation** : Description détaillée du "pourquoi"
- **Maintenance** : Réviser régulièrement les règles inutilisées

### 2. Organisation

- Utilisez des **conventions de nommage** cohérentes
- Groupez les règles par **domaine fonctionnel**
- Définissez des **priorités logiques**
- Documentez les **dépendances** entre règles

### 3. Performance

- Évitez les conditions trop complexes
- Limitez le nombre de règles actives
- Utilisez les index appropriés
- Surveillez les métriques de performance

## Cas d'usage courants

### 1. Assurer une couverture minimale

```
Condition : Type de jour = "Week-end"
Action : Assigner minimum 2 seniors par période
```

### 2. Équilibrer la charge de travail

```
Condition : Charge praticien > 40h/semaine
Action : Bloquer nouvelles affectations + Notifier coordinateur
```

### 3. Respecter les compétences

```
Condition : Salle = "Neurochirurgie"
Action : Requérir certification neurochirurgie
```

### 4. Gérer les remplacements

```
Condition : Absence imprévue détectée
Action : Proposer remplaçants disponibles par ordre de préférence
```

## Dépannage

### Problèmes fréquents :

**1. Ma règle ne s'applique jamais**
- Vérifiez les conditions (trop restrictives ?)
- Consultez les logs d'exécution
- Testez en mode simulation

**2. Conflits récurrents**
- Identifiez les règles en conflit
- Ajustez les priorités
- Considérez la fusion des règles

**3. Performance dégradée**
- Simplifiez les conditions complexes
- Réduisez le nombre de règles actives
- Contactez l'équipe technique

### Support

Pour toute question ou assistance :
- Documentation technique : `/docs/technical/regles-planning-documentation.md`
- Email support : support@mathildanesth.fr
- Formation : Sessions mensuelles pour administrateurs

## Raccourcis clavier

- `Ctrl/Cmd + S` : Sauvegarder la règle
- `Ctrl/Cmd + T` : Tester en simulation
- `Ctrl/Cmd + D` : Dupliquer la règle
- `Esc` : Annuler les modifications

---

*Dernière mise à jour : Janvier 2025 - Version 2.0*