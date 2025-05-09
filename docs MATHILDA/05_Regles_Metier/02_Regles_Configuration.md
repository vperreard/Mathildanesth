# Règles de Configuration

Ce document détaille les éléments paramétrables de l'application MATHILDA, permettant son adaptation à différentes structures hospitalières et à l'évolution des besoins de la clinique.

**Objectif :** Permettre une adaptation maximale sans nécessiter de modification du code source.

**Interface d'Administration :** Toutes ces configurations doivent être accessibles et modifiables via une section dédiée de l'interface d'administration (rôle `super_admin` principalement).

## 1. Configuration Générale

*   **Nom de l'établissement :** Nom affiché dans l'application.
*   **Fuseau horaire :** Pour la gestion des dates et heures.
*   **Format de date/heure préféré :** Pour l'affichage.
*   **Langue par défaut :** (Si multilingue envisagé).
*   **Horizon de planification par défaut :** Nombre de jours/semaines affichés/générés par défaut.
*   **Seuil "Dernière Minute" pour congés :** Nombre de semaines avant la date pour considérer un congé comme de dernière minute (impact sur la validation).

## 2. Configuration Structure Organisationnelle

*   **Gestion des Sites :** Créer, modifier, activer/désactiver des sites.
*   **Gestion des Secteurs :** Créer, modifier, activer/désactiver des secteurs au sein d'un site.
    *   Horaires d'ouverture/fermeture par défaut du secteur.
    *   Type d'activité.
*   **Gestion des Salles :** Créer, modifier, activer/désactiver des salles au sein d'un secteur.
    *   Type de salle.
    *   Spécialité associée par défaut.
    *   Statut (active, inactive, urgence).

## 3. Configuration du Personnel

*   **Gestion des Rôles :** (Potentiellement limité pour éviter incohérences) Modifier la description des rôles, ajuster finement les permissions via JSONB si implémenté.
*   **Gestion des Corps de Métier :** Ajouter/modifier des corps de métier (si besoin au-delà de MAR/IADE).
*   **Gestion des Compétences :** Ajouter/modifier/supprimer des compétences techniques.
*   **Gestion des Spécialités Chirurgicales :** Ajouter/modifier/supprimer des spécialités.
    *   **Différenciation Adulte/Pédiatrique :** Le système doit permettre de distinguer clairement une spécialité adulte de sa contrepartie pédiatrique (ex: `ORL Adulte`, `ORL Pédiatrique`).

## 4. Configuration des Types d'Activités

*   **Gestion des Types d'Affectation (`assignment_types`) :**
    *   Ajouter/modifier/désactiver des types (ex: Garde, Astreinte, Bloc Matin...).
    *   Configurer le code, le nom, la description, le rôle applicable, la couleur d'affichage.
*   **Gestion des Types d'Absence/Congé (`leaveType` dans `leaves`) :**
    *   Définir les types de congés possibles (annuel, RTT, maladie...).

## 5. Configuration des Règles de Planification

*   **Règles de Couverture par Secteur :** (Difficile à rendre totalement dynamique) Permettre d'ajuster certains seuils si possible (ex: max salles supervisées MAR en Ophtalmo).
*   **Règles de Supervision :** Définir le nombre maximum de salles supervisables par un MAR (général, par secteur si besoin).
*   **Règles Gardes/Astreintes :**
    *   Durée par défaut d'une garde/astreinte.
    *   Points de pénibilité associés (WE, férié, semaine).
    *   Délai minimum entre deux gardes/astreintes.
    *   Seuil d'alerte pour WE rapprochés.
    *   Configuration du repos post-garde (obligatoire, durée, impact compteur OFF).
*   **Règles Consultations :** Points de pénibilité associés.
*   **Règles IADE Fermeture :** Points de pénibilité, règle anti-répétition (pas 2/semaine).
*   **Système de Points de Pénibilité :**
    *   Activer/Désactiver le système.
    *   Configurer les points attribués pour chaque type d'activité/rôle (via `config_points_penibilite`).
    *   Configurer le seuil d'alerte sur X jours glissants.
*   **Paramètres Algorithme Génération :**
    *   Horizon de génération par défaut.
    *   Possibilité de relâcher certaines contraintes P1 en cas de conflit.
    *   Poids relatifs des objectifs P2/P3 (si l'algorithme le permet).
*   **Règles Validation Congés :**
    *   Seuil d'absents simultanés pour validation auto/admin IADE.
    *   Délai pour acceptation automatique.
*   **Gestion Incompatibilités/Préférences :** Interface pour définir les règles entre utilisateurs, ou entre utilisateur et compétence/spécialité/secteur.

## 6. Configuration des Compteurs

*   **Définition des Compteurs d'Équité :** Quels compteurs suivre pour MAR/IADE (cf. liste dans `01_Regles_Planification.md`).
*   **Mode de Calcul Proratisation :** Choisir entre normalisation (compteur/TTP) ou pondération.
*   **Période d'Équilibre :** Année civile, trimestre...
*   **Objectifs/Cibles :** Possibilité de définir des valeurs cibles annuelles pour certains compteurs.

## 7. Configuration des Imports/Exports

*   Format attendu pour les fichiers CSV.
*   Configuration de l'accès API Google Sheets (si utilisé).
*   Mapping des colonnes pour les imports.

## 8. Configuration des Notifications

*   Activer/Désactiver certains types de notifications.
*   Configurer les templates d'email (si email activé).

_(Cette liste est exhaustive mais certains points peuvent être simplifiés ou regroupés lors de l'implémentation)_

## 1. Configuration Organisationnelle

### 1.1 Structure des Sites

- **Sites** : Possibilité d'ajouter/modifier/supprimer des sites (cliniques, hôpitaux)
  - Nom du site
  - Adresse
  - Contact
  - Statut (actif/inactif)

### 1.2 Structure des Secteurs

Pour chaque site, configuration des secteurs :
- **Secteurs** : Possibilité d'ajouter/modifier/supprimer des secteurs
  - Nom du secteur
  - Description
  - Type d'activité (standard, spécialisé)
  - Règles d'affectation spécifiques (lien vers les règles d'affectation)
  - Horaires d'ouverture (par défaut)

### 1.3 Structure des Salles

Pour chaque secteur, configuration des salles :
- **Salles** : Possibilité d'ajouter/modifier/supprimer des salles
  - Numéro/Identifiant
  - Nom descriptif
  - Type de salle (standard, spécialisée, urgence)
  - Spécialité chirurgicale associée (optionnel, si salle dédiée)
  - Équipement spécifique
  - Statut (active, inactive, réservée)

## 2. Configuration Temporelle

### 2.1 Horaires de Fonctionnement

- **Journée Standard** :
  - Heure de début et fin de la période "matin" (par défaut : 8h-13h)
  - Heure de début et fin de la période "après-midi" (par défaut : 13h30-18h30)

- **Gardes et Astreintes** :
  - Heure de début et fin (par défaut : 8h-8h le lendemain)
  - Définition des jours fériés et spéciaux
  - Points attribués pour chaque type de garde MAR (semaine, weekend, férié)
  - Configuration des types de garde/astreinte IADE (si fonctionnalité activée)

### 2.2 Planning et Calendrier

- **Période de Génération** :
  - Durée du planning généré (semaine, mois)
  - Horizon de planification (à combien de temps à l'avance)
  - Fréquence de régénération/mise à jour

- **Jours Non Travaillés** :
  - Configuration des jours fériés
  - Jours de fermeture spécifiques à certains secteurs/salles

## 3. Configuration des Ressources Humaines

### 3.1 Définition des Rôles

- **Rôles Utilisateurs** :
  - Types de rôles disponibles (ajout/modification/suppression)
  - Permissions associées à chaque rôle
  - Définition des rôles spécifiques (Cadre Santé, Remplaçant, Super Admin)
  - Hiérarchie des rôles

### 3.2 Paramètres du Personnel

- **Données du Personnel** :
  - Champs personnalisables pour la fiche individuelle
  - Association aux spécialités chirurgicales (pour chirurgiens)
  - Association aux compétences (pour MAR/IADE)
  - Compétences et spécialités
  - Contrats et temps de travail

- **Seuils et Quotas** :
  - Nombre maximal d'heures par période
  - Nombre maximal de gardes consécutives
  - Répartition équitable (définition des paramètres)

- **Temps Partiels** :
  - Possibilité de définir un pourcentage de temps de travail pour chaque utilisateur (MAR/IADE).
  - Configuration des jours/demi-journées non travaillés spécifiques aux temps partiels.

- **Compétences** :
  - Création/modification/suppression de la liste des compétences disponibles.

- **Spécialités Chirurgicales** :
  - Création/modification/suppression de la liste des spécialités chirurgicales.

- **Préférences / Interdits** :
  - Interface pour définir des règles du type "Utilisateur X ne travaille jamais avec Chirurgien Y", "Utilisateur Z préfère le secteur A", "Utilisateur W interdit de Pédiatrie".

### 3.3 Gestion des Congés

- **Règles de Validation** :
  - Délai d'anticipation pour validation automatique
  - Seuil de personnel minimal par corps de métier et par jour
  - Priorités (ancienneté, premier arrivé premier servi, etc.)

## 4. Configuration des Algorithmes

### 4.1 Règles d'Affectation

Paramétrisation fine des règles décrites dans le document [Règles de Planification](./01_Regles_Planification.md) :

- **Règles par Secteur** :
  - Nombre maximal de salles par MAR/IADE selon le secteur
  - Règles de supervision (ratios MAR/IADE par secteur)
  - Continuité matin/après-midi (paramétrable par secteur)

- **Règles par Rôle** :
  - Configurations spécifiques aux MARs
  - Configurations spécifiques aux IADEs
  - Activation/désactivation des gardes/astreintes IADE
  - Ajout de nouveaux rôles avec leurs règles

### 4.2 Pondération des Règles

- **Système de Points** :
  - Pondération des différentes contraintes (congés, gardes, personnel min, etc.).
  - Points de priorité pour les requêtes spécifiques validées.
  - Points de fatigue pour les gardes rapprochées (valeur configurable).
  - Points de pénibilité par type d'affectation (supervision, consultation, etc. - valeurs configurables).

- **Équilibrage des Compteurs** :
  - Période d'équilibrage des compteurs horaires (mensuelle/trimestrielle).
  - Seuils de déclenchement des compensations (attribution des OFF).
  - Facteurs de conversion (ex: 1 garde = X heures de compteur - configurable).
  - Paramétrage du comptage du repos compensateur (semaine vs weekend).
  - Prise en compte du temps partiel dans les objectifs d'équilibrage.

## 5. Paramètres d'Interface Utilisateur

### 5.1 Affichage et Navigation

- **Vues par Défaut** :
  - Vue de démarrage par type d'utilisateur
  - Filtres pré-configurés
  - Période d'affichage par défaut

- **Codes Couleurs** :
  - Affectation des couleurs par type d'activité
  - Indicateurs visuels de conflit/alerte
  - Thèmes d'interface

### 5.2 Notifications

- **Système d'Alertes** :
  - Types d'événements déclenchant des notifications
  - Canaux de notification (email, in-app, SMS)
  - Fréquence et regroupement des notifications

## 6. Import/Export et Interfaces Externes

### 6.1 Formats de Données

- **Imports** :
  - Formats acceptés pour l'import des données initiales (utilisateurs, salles...)
  - Format et procédure d'import de la trame chirurgiens (CSV, Excel ? Fréquence ? Manuel/Automatique ?)
  - **Trame Chirurgiens :**
    - Interface de saisie/modification manuelle de la trame (semaines paires/impaires + exceptions).
    - **(Optionnel) Import/Synchro Google Sheets :**
      - Format attendu du fichier Sheets (colonnes, noms).
      - Procédure de lancement manuel de l'import/synchro.
      - Configuration de la fréquence de synchro automatique.
  - Mapping des champs pour l'intégration
  
- **Exports** :
  - Formats disponibles pour l'export des plannings
  - Personnalisation des rapports exportés

### 6.2 Intégrations Externes

- **API Google Sheets** :
  - Paramètres de connexion (si utilisé pour la trame chirurgiens)
  - Fréquence de synchronisation
  - Mapping des champs

- **Autres Systèmes** :
  - Possibilité d'intégration avec d'autres logiciels hospitaliers
  - Paramètres de connexion aux systèmes externes

## 7. Journalisation et Sécurité

### 7.1 Logs et Audit

- **Journalisation** :
  - Niveau de détail des logs
  - Durée de conservation
  - Événements à journaliser

### 7.2 Sécurité et Confidentialité

- **Accès et Authentification** :
  - Politique de mots de passe
  - Durée de session
  - Restriction d'accès par IP/réseau
  
- **Données Sensibles** :
  - Définition des données confidentielles
  - Règles de masquage/anonymisation 

### 7.4 Table `config_points_penibilite`

Stocke la configuration des points attribués par type d'activité/contexte.

### 7.5 Configuration Validation Heures

- **Option Système :**
  - Activer/Désactiver la nécessité de validation des heures déclarées par les MARs.
  - Si activé, définir le(s) rôle(s) habilité(s) à valider (Admin MAR ? Autre ?). 