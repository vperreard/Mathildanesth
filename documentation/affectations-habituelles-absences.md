# Documentation des Modules d'Affectations Habituelles et de Gestion des Absences

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Module d'Affectations Habituelles](#module-daffectations-habituelles)
   - [Planning de bloc opératoire préétabli](#planning-de-bloc-opératoire-préétabli)
   - [Affectations récurrentes du personnel médical](#affectations-récurrentes-du-personnel-médical)
   - [Modèle de données](#modèle-de-données-affectations-habituelles)
   - [Algorithme d'application](#algorithme-dapplication-des-trames)
3. [Module de Gestion des Absences](#module-de-gestion-des-absences)
   - [Tableau de bord des absences](#tableau-de-bord-des-absences)
   - [Saisie rapide d'absences](#saisie-rapide-dabsences)
   - [Import/Export](#importexport-des-absences)
   - [Modèle de données](#modèle-de-données-absences)
4. [Intégration avec le système existant](#intégration-avec-le-système-existant)
5. [Interface utilisateur](#interface-utilisateur)
6. [Considérations techniques](#considérations-techniques)

## Vue d'ensemble

Les modules d'Affectations Habituelles et de Gestion des Absences sont conçus pour faciliter la planification récurrente et la gestion des indisponibilités du personnel médical. Ces fonctionnalités permettent de:

- Définir des trames d'affectations préétablies pour le bloc opératoire et autres services
- Automatiser l'application de ces trames lors de la génération des plannings
- Gérer efficacement les absences prévues du personnel médical
- Prendre en compte ces absences lors de la génération automatique des plannings

Ces modules s'intègrent pleinement avec le système de règles et l'algorithme de génération de planning existants.

## Module d'Affectations Habituelles

### Planning de bloc opératoire préétabli

Le module de planning de bloc opératoire préétabli permet de définir et gérer les vacations fixes par chirurgien, organisées par demi-journée et par semaine (paire/impaire).

#### Fonctionnalités principales:
- Définition des vacations fixes par chirurgien, jour et demi-journée
- Distinction entre semaines paires et impaires
- Interface calendaire pour visualisation hebdomadaire
- Copier/coller de motifs entre chirurgiens ou périodes
- Duplication rapide de configurations
- Gestion des périodes de validité des trames
- Définition des spécialités associées aux vacations

#### Interface:
- Vue calendaire avec distinction visuelle des semaines paires/impaires
- Attribution par "drag & drop" des chirurgiens aux créneaux
- Filtres par chirurgien, spécialité, et période
- Visualisation compacte de l'ensemble du planning

### Affectations récurrentes du personnel médical

Ce module permet de définir les affectations habituelles pour tout le personnel médical (MAR, IADE, etc.), sur une base récurrente.

#### Fonctionnalités principales:
- Configuration des affectations récurrentes par personne
- Définition de règles par jour de semaine et période (matin/après-midi)
- Distinction entre semaines paires/impaires
- Spécification du type d'affectation (garde, bloc, consultation, etc.)
- Définition de périodes de validité
- Gestion des exceptions

#### Interface:
- Vue par personne ou par service
- Modèles prédéfinis d'affectations habituelles
- Système de priorités en cas de conflits
- Indicateurs visuels pour repérer rapidement les affectations

### Modèle de données Affectations Habituelles

```typescript
interface AffectationHabituelle {
  id: number;
  userId: number;         // ID de l'utilisateur concerné (null pour chirurgien)
  chirurgienId?: number;  // ID du chirurgien si applicable
  jour: 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi' | 'dimanche';
  periode: 'matin' | 'apres-midi';
  typeSemaine: 'toutes' | 'paire' | 'impaire';
  dateDebut: Date;        // Date de début de validité
  dateFin?: Date;         // Date de fin de validité (optionnel)
  typeAffectation: string; // 'bloc', 'garde', 'astreinte', 'cs', etc.
  salleId?: number;       // ID de la salle si applicable
  specialite?: string;    // Spécialité concernée si applicable
  priorite: number;       // Niveau de priorité (1-10)
  details: {
    service?: string;     // Service concerné
    salle?: string;       // Numéro/nom de salle
    commentaire?: string; // Notes additionnelles
    duree?: number;       // Durée spécifique si nécessaire
  };
  createdAt: Date;
  updatedAt: Date;
}

// Modèle pour les trames de planning
interface TramePlanning {
  id: number;
  nom: string;
  description?: string;
  dateDebut: Date;
  dateFin?: Date;
  isActive: boolean;
  affectationsHabituelles: AffectationHabituelle[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Algorithme d'application des trames

L'algorithme d'application des trames fonctionne en plusieurs étapes:

1. **Collecte des données**:
   - Récupération des trames actives pour la période concernée
   - Vérification des absences sur la période
   - Récupération des contraintes et règles applicables

2. **Filtrage**:
   - Exclusion des affectations pour les personnes absentes
   - Résolution des conflits selon les priorités définies
   - Application des règles de compatibilité

3. **Génération**:
   - Création des affectations selon les trames
   - Ajout des métadonnées (source: "trame", priorité, etc.)
   - Validation par le moteur de règles

4. **Ajustement**:
   - Identification des conflits subsistants
   - Proposition d'alternatives
   - Interface de validation manuelle

## Module de Gestion des Absences

### Tableau de bord des absences

Ce module fournit une vue d'ensemble complète des absences planifiées.

#### Fonctionnalités principales:
- Vue calendaire mensuelle avec code couleur par type d'absence
- Filtres par service, spécialité, et personne
- Indicateurs pour les périodes de forte tension
- Superposition avec le planning préétabli
- Alertes pour les périodes critiques

#### Interface:
- Calendrier mensuel avec vue synthétique
- Vue détaillée par jour ou semaine
- Légende des codes couleur par type d'absence
- Statistiques sur les absences par période

### Saisie rapide d'absences

Interface optimisée pour la saisie efficace des absences.

#### Fonctionnalités principales:
- Formulaire simplifié (personne, dates, motif)
- Mode lot pour saisies multiples
- Modèles préenregistrés pour absences récurrentes
- Validation automatique selon les règles définies
- Notification des personnes impactées

#### Interface:
- Formulaire intuitif avec auto-complétion
- Sélection rapide de dates par calendrier
- Vue d'aperçu des impacts sur le planning
- Confirmation visuelle des saisies

### Import/Export des absences

Fonctionnalités d'import/export pour faciliter la gestion des absences en masse.

#### Fonctionnalités principales:
- Import depuis Google Sheets (prévu ultérieurement)
- Export au format Excel/CSV
- Modèles d'import/export configurables
- Validation des données importées
- Gestion des erreurs et conflits

#### Interface:
- Assistant d'import guidé
- Prévisualisation des données avant import
- Rapport de validation post-import
- Options de configuration des exports

### Modèle de données Absences

```typescript
interface Absence {
  id: number;
  userId: number;         // ID de l'utilisateur concerné
  chirurgienId?: number;  // ID du chirurgien si applicable
  dateDebut: Date;        // Premier jour d'absence
  dateFin: Date;          // Dernier jour d'absence
  type: 'conge' | 'maladie' | 'formation' | 'autre';
  typeDetail?: string;    // Détail du type si 'autre'
  impactPlanning: boolean; // Si l'absence impacte le planning
  priorite: number;       // Niveau de priorité (1-10)
  commentaire?: string;   // Notes additionnelles
  statut: 'demande' | 'validee' | 'refusee';
  validePar?: number;     // ID de l'utilisateur validant
  notifier: boolean;      // Si notification aux collègues
  sourceImport?: string;  // Source si importée
  documents?: string[];   // Liens vers justificatifs
  createdAt: Date;
  updatedAt: Date;
}
```

## Intégration avec le système existant

Les modules d'Affectations Habituelles et de Gestion des Absences s'intègrent avec les composants existants:

### Intégration avec le moteur de règles:
- Les affectations habituelles sont soumises aux règles de compatibilité
- Les absences sont prises en compte dans la génération de planning
- Extension des règles pour gérer les cas spécifiques aux trames

### Intégration avec le système de notifications:
- Notification des personnes impactées par une modification
- Alertes sur les conflits identifiés
- Rappels pour la confirmation des absences/affectations

### Intégration avec les statistiques:
- Analyse de la répartition des affectations habituelles
- Suivi des absences par période et par personne
- Impact des absences sur la génération de planning

## Interface utilisateur

### Navigation et accès:
- Accès depuis le menu principal, section "Configuration"
- Sous-sections "Affectations habituelles" et "Gestion des absences"
- Permissions d'accès configurables par profil

### Ergonomie et expérience utilisateur:
- Interface intuitive avec aide contextuelle
- Système de validation visuelle des actions
- Feedback immédiat lors des saisies
- Mode mobile optimisé pour les saisies rapides

### Cohérence visuelle:
- Codes couleur cohérents avec le reste de l'application
- Iconographie explicite pour les différents types
- Mise en page adaptative selon les dispositifs

## Considérations techniques

### Performance:
- Mise en cache des trames fréquemment utilisées
- Optimisation des requêtes pour les vues calendaires
- Traitement par lots pour les imports massifs

### Sécurité:
- Validation des données entrantes
- Protection contre les modifications non autorisées
- Journalisation des actions sensibles

### Évolutivité:
- Architecture modulaire extensible
- API documentée pour intégrations futures
- Tests automatisés pour assurer la stabilité

---

*Ce document sera mis à jour régulièrement au fur et à mesure du développement de ces fonctionnalités.* 