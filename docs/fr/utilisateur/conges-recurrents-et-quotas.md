# Guide utilisateur : Congés récurrents et gestion avancée des quotas

## Table des matières
1. [Introduction](#introduction)
2. [Congés récurrents](#congés-récurrents)
   - [Création d'un congé récurrent](#création-dun-congé-récurrent)
   - [Modification d'une série](#modification-dune-série)
   - [Gestion des exceptions](#gestion-des-exceptions)
   - [Cas pratiques](#cas-pratiques-congés-récurrents)
3. [Gestion avancée des quotas](#gestion-avancée-des-quotas)
   - [Visualisation des soldes](#visualisation-des-soldes)
   - [Transfert de congés](#transfert-de-congés)
   - [Don de jours](#don-de-jours)
   - [Règles d'acquisition](#règles-dacquisition)
   - [Cas pratiques](#cas-pratiques-quotas)
4. [FAQ](#faq)

## Introduction

Ce guide détaille l'utilisation des fonctionnalités avancées du module de congés, spécifiquement la gestion des congés récurrents et l'administration des quotas. Ces fonctionnalités ont été conçues pour optimiser la planification des absences régulières et faciliter la gestion des droits à congés.

## Congés récurrents

Les congés récurrents permettent de créer automatiquement des demandes d'absence répétitives selon un schéma défini, évitant ainsi la saisie manuelle répétée.

### Création d'un congé récurrent

1. Accédez à votre espace personnel > "Mes congés"
2. Cliquez sur "Nouvelle demande"
3. Remplissez les informations de base (dates, type de congé)
4. Cochez l'option "Congé récurrent" pour afficher les options de récurrence
5. Configurez la périodicité :
   - **Fréquence** : quotidienne, hebdomadaire, mensuelle ou annuelle
   - **Intervalle** : tous les X jours/semaines/mois/années
   - **Jours spécifiques** : pour les récurrences hebdomadaires
   - **Fin de récurrence** : jusqu'à une date précise ou après un nombre défini d'occurrences

![Création d'un congé récurrent](../images/conges-recurrents-creation.png)

> **Conseil** : Pour les temps partiels fixes, créez un congé récurrent hebdomadaire en sélectionnant vos jours d'absence habituels.

### Modification d'une série

Lorsque vous modifiez un congé récurrent, le système vous propose trois options :

- **Modifier uniquement cette occurrence** : change uniquement l'instance sélectionnée
- **Modifier cette occurrence et les suivantes** : applique les modifications à partir de l'occurrence sélectionnée
- **Modifier toute la série** : applique les modifications à toutes les occurrences, y compris les passées

![Options de modification](../images/conges-recurrents-modification.png)

### Gestion des exceptions

Pour gérer les exceptions dans une série récurrente :

1. Accédez à la vue détaillée de la série en cliquant sur n'importe quelle occurrence
2. Dans l'onglet "Occurrences", vous pouvez :
   - Supprimer une occurrence spécifique
   - Modifier les dates d'une occurrence particulière
   - Ajouter une occurrence exceptionnelle

### Cas pratiques congés récurrents

#### Temps partiel fixe
**Scénario** : Marie travaille à 80% et est absente tous les vendredis.
**Configuration** :
- Type de congé : Congé annuel
- Récurrence : Hebdomadaire
- Jour : Vendredi
- Fin : Date de fin de contrat ou "Jamais" si CDI

#### Formation régulière
**Scénario** : Jean suit une formation tous les premiers lundis du mois pendant un an.
**Configuration** :
- Type de congé : Formation
- Récurrence : Mensuelle
- Option : Premier lundi du mois
- Fin : Après 12 occurrences

## Gestion avancée des quotas

### Visualisation des soldes

Le tableau de bord des congés offre une vue complète et détaillée de vos soldes :

1. Accédez à "Mes congés" > "Tableau de bord"
2. Consultez la section "Mes quotas" qui présente :
   - Solde actuel par type de congé
   - Historique de consommation
   - Projection des soldes futurs
   - Analyse graphique de l'utilisation des congés

![Tableau de bord des quotas](../images/quotas-tableau-bord.png)

### Transfert de congés

Pour transférer des jours entre différents types de congés (selon les règles en vigueur) :

1. Dans "Mes quotas", cliquez sur "Transfert de jours"
2. Sélectionnez le type de congé source et le type destination
3. Indiquez le nombre de jours à transférer
4. Validez l'opération

> **Note** : Les règles de conversion peuvent s'appliquer (ex : 1 jour de RTT = 1 jour de congé annuel)

### Don de jours

Pour faire don de jours de congés à un collègue :

1. Dans "Mes quotas", cliquez sur "Don de jours"
2. Sélectionnez le bénéficiaire dans la liste
3. Choisissez le type et le nombre de jours à donner
4. Ajoutez un commentaire (optionnel)
5. Validez le don

![Don de jours](../images/don-jours.png)

> **Important** : Conformément à la législation, les dons sont anonymes pour le bénéficiaire.

### Règles d'acquisition

Les droits à congés sont calculés selon plusieurs règles configurables :

- **Acquisition progressive** : X jours par mois travaillé
- **Attribution en bloc** : solde complet disponible en début de période
- **Report automatique** : jours non consommés reportés sur la période suivante
- **Plafonnement** : limitation du cumul de jours

Consultez la page "Règles d'acquisition" pour connaître les paramètres spécifiques à votre organisation.

### Cas pratiques quotas

#### Préparation des congés d'été
**Scénario** : Thomas souhaite vérifier s'il peut poser 3 semaines en août.
**Utilisation** :
1. Consultation du tableau de bord > section "Projection"
2. Vérification du solde prévisionnel pour août
3. Analyse des périodes de tension via le calendrier d'équipe

#### Don de jours pour événement familial
**Scénario** : Sophie souhaite aider un collègue dont l'enfant est gravement malade.
**Utilisation** :
1. Vérification de son solde disponible
2. Utilisation de la fonction "Don de jours"
3. Sélection du collègue et don de 5 jours

## FAQ

**Q : Puis-je modifier une seule occurrence d'un congé récurrent ?**  
R : Oui, lorsque vous modifiez un congé faisant partie d'une série, vous pouvez choisir de modifier uniquement cette occurrence.

**Q : Que se passe-t-il si je pose un congé récurrent sur un jour férié ?**  
R : Par défaut, le système détecte les jours fériés et ne crée pas d'occurrence pour ces dates si l'option "Ignorer les jours fériés" est activée.

**Q : Comment sont calculés mes droits à congés si j'arrive en cours d'année ?**  
R : Le système calcule vos droits au prorata de votre période de présence, selon les règles configurées par votre service RH.

**Q : Puis-je annuler un don de jours ?**  
R : Une fois validé par les RH, un don de jours ne peut plus être annulé. Vérifiez bien votre solde avant de confirmer.

**Q : Comment sont gérés les congés récurrents si mon planning change ?**  
R : Les occurrences futures s'adapteront automatiquement à votre nouveau planning si l'option "Adapter aux changements de planning" est activée dans les paramètres de récurrence. 