# Profils Utilisateurs

Ce document décrit les différents profils utilisateurs de l'application MATHILDA, leurs rôles et les actions qu'ils sont autorisés à effectuer.

## Types d'Utilisateurs

L'application MATHILDA distingue sept types d'utilisateurs principaux, avec des rôles et permissions spécifiques.

### 1. Administrateur MAR

L'administrateur MAR est un Médecin Anesthésiste Réanimateur disposant des droits les plus étendus sur l'application.

**Permissions :**
- Configuration complète du système et des paramètres de l'application
- Gestion de tous les utilisateurs (création, modification, désactivation), y compris la gestion de la liste des chirurgiens et de leurs informations.
- Gestion de tous les utilisateurs (création, modification, désactivation)
- Validation de toutes les requêtes (congés, échanges, demandes spécifiques)
- Génération manuelle et automatique des plannings
- Modification de tous les plannings (MARs, IADEs, etc.)
- Accès à toutes les statistiques et compteurs (heures, gardes, congés)
- Gestion des règles d'affectation et des contraintes
- Configuration des secteurs et des salles

### 2. Administrateur IADE

L'administrateur IADE est un Infirmier Anesthésiste Diplômé d'État disposant de droits étendus mais limités à la gestion des IADEs.

**Permissions :**
- Validation des congés des IADEs
- Gestion des requêtes spécifiques des IADEs
- Modification des affectations des IADEs uniquement (échanges, déplacements)
- Accès aux statistiques relatives aux IADEs
- AUCUN droit sur les MARs, chirurgiens ou secrétaires

### 3. MAR (Médecin Anesthésiste Réanimateur)

Utilisateur standard avec des permissions centrées sur ses propres affectations.

**Permissions :**
- Visualisation de son planning personnel et celui des autres MARs
- Déclaration des heures effectuées dans le compteur horaire
- Demandes de congés ou d'absences
- Saisie de requêtes spécifiques (préférences d'affectation)
- Demandes d'échange d'affectation avec d'autres MARs
- Visualisation des gardes et astreintes
- Consultation de son compteur horaire personnel

### 4. IADE (Infirmier Anesthésiste Diplômé d'État)

Utilisateur standard avec des permissions adaptées à son rôle.

**Permissions :**
- Visualisation de son planning personnel et celui des autres IADEs
- Demandes de congés ou d'absences
- Saisie de requêtes spécifiques (préférences d'affectation)
- Demandes d'échange d'affectation avec d'autres IADEs
- Indication des disponibilités pour le rôle d'IADE "volant"

### 5. Chirurgien

Utilisateur avec des permissions limitées à la consultation et à l'intégration de ses absences.

**Permissions :**
- Visualisation de son planning personnel
- Déclaration des absences et indisponibilités
- Consultation des affectations des MARs et IADEs pour ses interventions

*Note : L'intégration des absences des chirurgiens pourra se faire via l'API Google Sheets pour exploiter le fichier collaboratif existant.*

### 6. Secrétaire Médicale

Utilisateur avec des permissions de consultation et de saisie administrative.

**Permissions :**
- Accès en lecture aux plannings
- Saisie administrative (sans modification des plannings)
- Génération de rapports et d'exports

### 7. Autres Utilisateurs Futurs

L'application prévoit l'extension à d'autres corps de métier :
- Radiologue
- Manipulateur radio

**Permissions :** À définir lors de l'intégration de ces profils. *(Note : Cette extension est considérée comme très secondaire et hors scope pour la V1. Elle impliquerait la gestion de sites/salles spécifiques à l'imagerie et de personnel dédié, sans lien avec les patients/interventions d'anesthésie).*

### 8. Cadre de Santé

Profil potentiel avec des droits limités.

**Permissions potentielles (lecture seule) :**
- Consultation des plannings généraux (MAR/IADE)
- Consultation des statistiques d'occupation et d'activité

### 9. Remplaçant (MAR ou IADE)

Profil spécifique pour le personnel externe intervenant ponctuellement.

**Permissions :**
- Consultation de son propre planning lorsqu'affecté.
- **(Souhaitable)** Interface pour renseigner ses disponibilités futures.
- Appartient au corps de métier `MAR` ou `IADE` pour l'affectation.
- Exclu des statistiques globales d'équité (gardes, consultations, etc.).

### 10. Super Administrateur

Profil avec les droits ultimes, potentiellement pour la maintenance technique ou des configurations très sensibles.

**Permissions :** À définir si un besoin spécifique émerge au-delà des droits de l'Administrateur MAR.

## Restrictions d'Accès

Des règles strictes de confidentialité et de séparation des droits sont appliquées :

1. **Cloisonnement par corps de métier :**
   - Chaque corps de métier ne voit que les informations de son propre groupe
   - Exceptions : les administrateurs peuvent voir les informations des groupes qu'ils administrent

2. **Limitation des droits d'administration :**
   - Les administrateurs ne peuvent gérer que leur propre corps de métier
   - Exception : l'administrateur MAR qui peut gérer l'ensemble du système

3. **Confidentialité des données personnelles :**
   - Les compteurs horaires personnels ne sont visibles que par la personne concernée et les administrateurs
   - Les demandes de congés et leurs motifs ne sont visibles que par la personne concernée et les administrateurs

## Système d'Authentification

L'accès à l'application nécessite une authentification sécurisée :
- Identifiant unique (email professionnel)
- Mot de passe fort
- Sessions limitées dans le temps
- Déconnexion automatique après inactivité

## Références Croisées

### Liens avec les Règles Métier

Les profils utilisateurs sont soumis aux règles métier détaillées dans :
- [Règles de Planification](../05_Regles_Metier/01_Regles_Planification.md) - Notamment les règles d'affectation par rôle (section 2)
- [Règles de Configuration](../05_Regles_Metier/02_Regles_Configuration.md) - Notamment la configuration des ressources humaines (section 3)

### Liens avec les Fonctionnalités

Les fonctionnalités disponibles pour chaque profil sont détaillées dans :
- [Fonctionnalités Principales](./02_Fonctionnalites_Principales.md) - Notamment la gestion des plannings, affectations, absences et requêtes
- [Fonctionnalités Secondaires](./03_Fonctionnalites_Secondaires.md) - Notamment le tableau de bord, statistiques et outils d'administration

## Ajout des Spécialités Chirurgicales et Compétences

### Spécialités Chirurgicales

- Les chirurgiens peuvent être associés à une ou plusieurs spécialités (configurable par l'admin MAR).
- Les spécialités sont utilisées pour :
  - Les statistiques d'activité.
  - La configuration de règles spécifiques (ex: certaines salles réservées à une spécialité, préférences/interdits d'affectation MAR/IADE).
- Le filtrage du planning par spécialité n'est pas une priorité.

### Compétences MAR/IADE

- Les MAR et IADE peuvent se voir attribuer des compétences spécifiques (ex: Pédiatrie, ALR) par les administrateurs.
- Ces compétences sont utilisées comme **préférences** ou **interdits** lors de la génération du planning (configurable).
  - Ex: Interdire l'affectation d'un personnel sans la compétence "Pédiatrie" à une salle pédiatrique.
  - Ex: Préférer un personnel avec la compétence "ALR" pour une salle donnée si possible. 