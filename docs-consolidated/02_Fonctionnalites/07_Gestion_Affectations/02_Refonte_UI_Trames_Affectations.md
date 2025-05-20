# Refonte UI des Trames et Affectations

## 1. État des lieux et problématiques actuelles

L'interface actuelle de gestion des trames et affectations présente plusieurs difficultés :

- **Manque d'intuitivité** : Les formulaires contiennent de nombreux champs dont la fonction n'est pas claire
- **Visualisation limitée** : Absence de représentation visuelle claire des patterns d'affectation
- **Gestion des variations complexe** : Difficultés pour configurer les semaines paires/impaires ou périodes spécifiques
- **Gestion des gardes et astreintes peu claire** : Ambiguïté sur la gestion des gardes 24h et leur visualisation
- **Complexité de configuration des rôles au bloc** : Interface ne rendant pas évident la différence entre anesthésie et supervision

## 2. Propositions d'amélioration

### A. Refonte de l'interface des trames et affectations

#### 1. Vue calendrier avec trames

- **Représentation visuelle en grille** :
  - Salles/postes en lignes
  - Jours/périodes en colonnes
  - Visualisation hebdomadaire claire
- **Code couleur explicite** :
  - Rouge : Salles fermées
  - Vert : Salles ouvertes avec affectations complètes
  - Orange : Salles ouvertes en attente d'affectation
  - Nuances pour différencier types d'activité (gardes, bloc, consultations)
- **Fonctionnalités de glisser-déposer** :
  - Affecter rapidement le personnel
  - Étendre/réduire les affectations (ex: passer de matin à journée complète)
  - Activer/désactiver des affectations en bloc

#### 2. Simplification de la création des trames

- **Assistant de création en étapes** :
  1. Définir la période et le type (semaines paires/impaires/toutes)
  2. Configurer les salles ouvertes/fermées par défaut
  3. Affecter le personnel habituel
- **Duplication de trames existantes** avec personnalisation
- **Templates prédéfinis** pour accélérer la création de nouvelles trames

#### 3. Gestion distincte des gardes/astreintes

- **Interface dédiée** pour la configuration des gardes et astreintes
- **Visualisation claire** de l'état "journée complète"
- **Représentation automatique** du repos post-garde
- **Distinction visuelle** gardes vs affectations journée complète bloc

### B. Améliorations techniques

#### 1. Récupération automatique des vacances scolaires

- **Intégration d'API** pour les vacances scolaires françaises :
  - [data.education.gouv.fr](https://data.education.gouv.fr/explore/dataset/fr-en-calendrier-scolaire/api/)
  - Solutions tierces comme [jours-feries-france](https://github.com/commentgenerator/jours-feries-france)
- **Configuration des zones** (A, B, C) selon l'établissement

#### 2. Simplification des modèles d'affectation

- **Clarification des types d'affectation** :
  ```typescript
  enum AffectationType {
    GARDE_24H,
    ASTREINTE_24H,
    BLOC_VACATION,
    CONSULTATION,
    // etc.
  }
  ```
- **Gestion améliorée des rôles** :
  ```typescript
  enum RoleAffectation {
    ANESTHESIE,
    SUPERVISION,
    CHIRURGIE,
    // etc.
  }
  ```

#### 3. Actions contextuelles et modifications rapides

- **Menu contextuel sur clic droit** :
  - Étendre à la journée complète
  - Copier/coller une affectation
  - Remplacer le personnel
- **Modifications multiples** (sélection de plusieurs cases)

### C. Gestion intuitive des variations

#### 1. Panel de variations dédié

- **Interface séparée** pour créer/gérer les variations
- **Options pour** :
  - Vacances scolaires (avec récupération automatique)
  - Périodes spécifiques (été, hiver)
  - Jours spéciaux

#### 2. Prévisualisation des variations

- **Vue avant/après** pour comprendre l'impact
- **Simulation rapide** du planning avec/sans variations

#### 3. Templates de variations

- **Création de configurations types** réutilisables
- **Exemple** : "Configuration été" avec fermeture de certaines salles

## 3. Interface spécifique pour les chirurgiens au bloc

Pour répondre au besoin spécifique de gestion des 70 chirurgiens sur 21 salles :

### 1. Interface "Planning chirurgiens"

- **Grille visuelle** :
  - Salles en lignes
  - Jours en colonnes (subdivisés en matin/après-midi)
- **Chaque case cliquable/éditable** avec :
  - Statut : Ouvert/Fermé
  - Chirurgien assigné (sélection rapide)
  - Options d'étendre à la journée complète

### 2. Manipulations rapides

- **Glisser-déposer** depuis une liste de chirurgiens
- **Menu contextuel** (clic droit) pour :
  - Étendre à la journée complète
  - Fermer la salle pour une période
  - Copier/coller les affectations
- **Sélection multiple** pour modifications en bloc

### 3. Vues différenciées

- **Vue "Trame"** : configuration du modèle récurrent
- **Vue "Semaine courante"** : modifications spécifiques pour une période donnée
- **Différenciation visuelle** des modifications par rapport à la trame de base

## 4. Simplification des formulaires

### 1. TrameModele

- **Nom** : nom simple de la trame
- **Description** : description optionnelle
- **Type de semaine** : sélection visuelle Paire/Impaire/Toutes
- **Période de validité** : dates début/fin avec calendrier intuitif
- **Jours actifs** : sélection graphique des jours de la semaine

### 2. AffectationModele

- **Type d'activité** : sélection avec icônes explicites
- **Période** : représentation visuelle (matin/après-midi/journée)
- **Localisation** : sélection intuitive de salle/secteur
- **Personnel** : interface d'ajout avec rôles clairement définis
- **Priorité** : slider visuel plutôt que champ numérique

## 5. Prochaines étapes d'implémentation

1. **Conception des maquettes UI** pour les nouvelles interfaces
2. **Prototype fonctionnel** pour la vue calendrier et le glisser-déposer
3. **Ajustements des modèles de données** pour supporter les nouvelles fonctionnalités
4. **Développement des APIs** nécessaires aux nouvelles interfaces
5. **Intégration de l'API des vacances scolaires**
6. **Tests utilisateurs** avec personnels médicaux pour validation ergonomique
