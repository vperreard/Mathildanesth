# Panneau de Configuration

Cette vue permet aux administrateurs de configurer l'ensemble des paramètres de l'application, notamment l'organisation des sites, secteurs et salles.

## 1. Objectifs

- Permettre la configuration complète de l'application sans intervention technique
- Offrir une interface intuitive pour gérer les sites, secteurs et salles
- Faciliter la réorganisation des secteurs et salles via glisser-déposer
- Visualiser la hiérarchie complète et gérer tous les paramètres

## 2. Accès et Navigation

- **Accès :** Uniquement disponible pour les rôles `admin_mar` et `super_admin`
- **Navigation :** Accessible depuis un bouton "Configuration" ou "Administration" dans le menu principal
- **Structure :** Interface à onglets horizontaux pour les différentes catégories de configuration

## 3. Onglets Principaux

1. **Sites & Organisation**
2. **Utilisateurs & Rôles**
3. **Types d'Affectation**
4. **Paramètres Généraux**
5. **Compétences & Spécialités**
6. **Points de Pénibilité**
7. **Règles & Planification**
8. **Types de Congés**
9. **Notifications**
10. **Périodes Spéciales**
11. **Import/Export**

## 4. Onglet "Sites & Organisation"

Cet onglet est le plus important pour l'organisation géographique des secteurs et des salles.

### 4.1 Structure de l'Écran

- **Panneau Gauche :** Arborescence hiérarchique (Sites > Secteurs > Salles)
- **Panneau Droit :** Formulaire de détails pour l'élément sélectionné
- **Boutons d'Action :**
  - Ajouter (Site/Secteur/Salle selon contexte)
  - Supprimer (l'élément sélectionné)
  - Enregistrer (modifications)

### 4.2 Fonctionnalité de Réorganisation

#### Réorganisation des Secteurs

- L'arborescence permet de **glisser-déposer** les secteurs pour changer leur ordre au sein d'un site
- Un indicateur visuel (ligne bleue) apparaît pour montrer où le secteur sera placé
- L'ordre est immédiatement sauvegardé après un glisser-déposer réussi
- Une notification confirme le changement d'ordre

#### Réorganisation des Salles

- De même, les salles peuvent être **glissées-déposées** :
  - À l'intérieur de leur secteur actuel pour changer l'ordre
  - Vers un autre secteur pour les déplacer
- Des indicateurs visuels distinguent clairement :
  - Réorganisation au sein du même secteur (ligne bleue)
  - Déplacement vers un autre secteur (fond bleu clair sur le secteur cible)

### 4.3 Formulaire de Détails

#### Détails Site

- Nom
- Adresse
- Contact
- Statut (Actif/Inactif)

#### Détails Secteur

- Nom
- Description
- Type d'activité
- Horaires d'ouverture/fermeture par défaut
- Ordre d'affichage (automatiquement mis à jour par glisser-déposer)
- Statut (Actif/Inactif)

#### Détails Salle

- Nom/Numéro
- Description
- Type de salle
- Spécialité associée (sélecteur)
- Équipement
- **Statut :** `ACTIVE` / `INACTIVE` (Sélecteur)
- **Est réservée aux urgences :** Oui / Non (Case à cocher)
- Ordre d'affichage (automatiquement mis à jour par glisser-déposer)

## 5. Interactions

- **Sélection :** Clic sur un élément de l'arborescence pour afficher/éditer ses détails
- **Ajout :** Clic sur "+" à côté du niveau approprié (Site/Secteur/Salle)
- **Suppression :** Sélection + bouton Supprimer (avec confirmation)
- **Réorganisation :**
  - Cliquer et maintenir sur un secteur/salle
  - Faire glisser vers le nouvel emplacement
  - Relâcher pour confirmer
  - Confirmation visuelle du nouvel ordre

## 6. API Utilisées

- `GET /api/v1/config/sites` : Récupérer la liste des sites
- `GET /api/v1/config/sectors` : Récupérer les secteurs (par site)
- `GET /api/v1/config/rooms` : Récupérer les salles (par secteur)
- `PUT /api/v1/config/sectors/reorder` : Réorganiser l'ordre des secteurs
- `PUT /api/v1/config/rooms/reorder` : Réorganiser l'ordre des salles
- `PUT /api/v1/config/rooms/{roomId}` : Déplacer une salle vers un autre secteur
- Autres endpoints CRUD pour sites, secteurs, salles

## 7. Maquette Simplifiée (Wireframe)

```
+---------------------------------------------------------------------------------------------------------------+
| Configuration                                                                                                 |
+-------------------------------------+-----------------------------------+-----------------------------------+
| [Sites & Org.] [Utilisateurs] [Types Affect.] [Paramètres] [Comp. & Spé.] [Points Pénib.] [Règles]         |
+-------------------------------------+-----------------------------------+-----------------------------------+
|                                     |                                                                       |
| ARBORESCENCE                        | DÉTAILS DE L'ÉLÉMENT SÉLECTIONNÉ                                    |
| +---------------------------------+ |                                                                       |
| | + Site Principal                | | [Formulaire du secteur sélectionné]                                 |
| |   |- + Secteur Hyperaseptique   | | Nom: Secteur Hyperaseptique                                        |
| |   |   |- Salle 1                | | Description: [_______________________________________________]      |
| |   |   |- Salle 2                | | Type d'activité: [Standard v]                                      |
| |   |   |- Salle 3                | | Horaire ouverture: [08:00]  Horaire fermeture: [18:30]            |
| |   |   |- Salle 4                | | Statut: [x] Actif                                                 |
| |   |- + Secteur Ophtalmo         | |                                                                     |
| |   |   |- Salle 5                | |                                                                     |
| |   |   |- Salle 6                | |                                                                     |
| |   |   |- Salle 7                | |                                                                     |
| |   |- + Secteur Endoscopie       | |                                                                     |
| |       |- Salle Endo 1           | |                                                                     |
| |       |- Salle Endo 2           | |                                                                     |
| |                                 | |                                                                     |
| | + Site Secondaire               | |                                                                     |
| |   |- + Autre secteur            | |                                                                     |
| |                                 | |                                                                     |
| | [+ Ajouter un site]             | |                                                                     |
| +---------------------------------+ | [Supprimer]                                    [Enregistrer]        |
|                                     |                                                                       |
+-------------------------------------+-----------------------------------------------------------------------+
```

## 8. Gestion des Erreurs

- Validation côté client des champs obligatoires
- Alerte si tentative de suppression d'un élément utilisé ailleurs
- Message d'erreur approprié si la réorganisation par glisser-déposer échoue
- Confirmation visuelle des actions réussies 

## 5. Onglet "Utilisateurs & Rôles"

Cet onglet permet de gérer les utilisateurs et leurs rôles dans le système.

### 5.1 Structure de l'Écran

- **Panneau Gauche :** Liste des utilisateurs avec filtres (par rôle, par statut)
- **Panneau Droit :** Formulaire de détails pour l'utilisateur sélectionné

### 5.2 Formulaire Utilisateur

- **Identité :** Nom, prénom, titre, email, téléphone
- **Compte :** Nom d'utilisateur, statut (actif/inactif/suspendu)
- **Rôle :** Sélection du rôle principal (`mar`, `iade`, `admin_mar`, `admin_iade`, `super_admin`, etc.)
- **Compétences :** Association de compétences et niveaux (débutant, intermédiaire, expert)
- **Spécialités :** Association de spécialités préférées/maîtrisées
- **Compteurs initiaux :** Configuration des compteurs de base (gardes, astreintes, etc.)
- **Temps de travail :** Configuration du prorata (temps plein, temps partiel avec %)
- **Préférences :** Jours préférés, secteurs préférés, indisponibilités récurrentes
- **Interdits :** Associations à éviter avec d'autres personnels

## 6. Onglet "Types d'Affectation"

Cet onglet permet de gérer les différents types d'affectations utilisés dans le planning.

### 6.1 Liste des Types

- Table avec colonnes : Nom, Couleur, Durée par défaut, Points de pénibilité, Statut
- Boutons pour ajouter, modifier, supprimer

### 6.2 Formulaire Type d'Affectation

- **Nom :** Libellé du type (bloc standard, garde, astreinte, formation, etc.)
- **Couleur :** Sélecteur de couleur utilisée dans le planning
- **Durée par défaut :** Horaires typiques (début/fin)
- **Points de pénibilité :** Valeur de base (ajustée ensuite via l'onglet dédié)
- **Comptabilisation :** Configuration de l'impact sur les différents compteurs
- **Contraintes spécifiques :** Règles particulières applicables à ce type

## 7. Onglet "Paramètres Généraux"

### 7.1 Paramètres Système

- **Période de planification :** Durée par défaut pour génération (semaine, mois)
- **Horizon de visibilité :** Combien de temps à l'avance le planning est visible
- **Profondeur d'historique :** Durée de conservation des plannings passés
- **Validation :** Règles de workflow (validation multi-niveaux ou non)

### 7.2 Paramètres Algorithme

- **Mode de génération :** Strict ou souple
- **Priorité des contraintes :** Pondération des différentes règles (P-1, P0, P1, P2, P3)
- **Équité :** Importance relative (faible, moyenne, forte)
- **Temps d'exécution max :** Durée maximale pour la génération
- **Nombre de tentatives :** Itérations maximales avant renonciation

### 7.3 Paramètres Affichage

- **Format date/heure :** Configuration des formats d'affichage
- **Thème :** Choix des couleurs principales de l'application
- **Vue par défaut :** Vue planning initiale (jour, semaine, mois)

## 8. Onglet "Compétences & Spécialités"

### 8.1 Gestion des Compétences

- Table des compétences avec : Nom, Description, Niveaux possibles, Statut
- Formulaire d'ajout/modification
- Association avec types d'affectation (quelles compétences sont requises pour chaque type)

### 8.2 Gestion des Spécialités

- Table des spécialités avec : Nom, Description, Statut
- Formulaire d'ajout/modification
- Association avec salles (quelles spécialités correspondent à quelles salles)

## 9. Onglet "Points de Pénibilité"

### 9.1 Configuration Globale

- Table des coefficients par type d'affectation
- Modulateurs temporels (jour, nuit, week-end, jour férié)
- Valeurs de plafond/plancher pour l'équilibrage

### 9.2 Règles de Calcul

- Formules de calcul pour chaque type de personnel (MAR, IADE)
- Périodicité de réinitialisation (annuelle, trimestrielle, etc.)
- Proratisation selon temps de travail (réglage des coefficients)

## 10. Onglet "Règles & Planification"

### 10.1 Règles de Base

- Nombre minimal/maximal d'affectations consécutives
- Repos obligatoires (durée minimale entre affectations)
- Règles de rotation des gardes/astreintes

### 10.2 Contraintes Métier

- Règles spécifiques par secteur
- Encadrement des IADEs par MARs (ratios)
- Supervision pédiatrique (quels MARs peuvent superviser)
- Règles d'incompatibilité (garde + bloc)

### 10.3 Contraintes Temporelles

- Horaires standards par secteur
- Jours d'ouverture par secteur
- Écarts acceptables par rapport aux horaires standards

## 11. Onglet "Types de Congés"

### 11.1 Configuration des Types

- Table des types de congés : Nom, Couleur, Impact compteurs
- Quotas par défaut (jours annuels)
- Règles de demande (délai minimum avant date souhaitée)
- Workflow de validation

### 11.2 Configuration des Jours Fériés

- Calendrier annuel des jours fériés
- Règles particulières (ponts, etc.)

## 12. Onglet "Notifications"

### 12.1 Modèles de Notifications

- Configuration des modèles de notifications système
- Personnalisation des messages
- Paramètres d'envoi (email, in-app, les deux)

### 12.2 Règles de Déclenchement

- Configuration des événements générant des notifications
- Niveau d'urgence et périodicité des rappels
- Destinataires par défaut selon type d'événement

## 13. Onglet "Périodes Spéciales"

### 13.1 Définition des Périodes

- Configuration des périodes spécifiques (vacances scolaires, congrès, etc.)
- Règles particulières applicables durant ces périodes
- Impact sur les compteurs

### 13.2 Activité Saisonnière

- Configuration de la variation d'activité selon période
- Priorisation des congés selon période
- Ajustement des effectifs requis

## 14. Onglet "Import/Export"

### 14.1 Import de Données

- Interface d'importation des trames chirurgiens (CSV, Excel)
- Importation des utilisateurs (intégration avec annuaire existant)
- Importation de plannings historiques

### 14.2 Export de Données

- Configuration des formats d'export (Excel, PDF, CSV)
- Modèles de rapports personnalisables
- Planification d'exports récurrents 