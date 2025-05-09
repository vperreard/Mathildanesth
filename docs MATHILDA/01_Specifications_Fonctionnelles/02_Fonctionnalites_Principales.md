# Fonctionnalités Principales

Ce document décrit les fonctionnalités essentielles de l'application MATHILDA, centrées sur la planification et la gestion des affectations du personnel d'anesthésie.

**IMPORTANT : Cette application ne gère PAS les données médicales nominatives (patients, interventions chirurgicales spécifiques).** Elle se concentre sur l'affectation du personnel (MAR, IADE, Chirurgiens) aux créneaux horaires et aux salles/secteurs.

## 1. Gestion des Plannings

### 1.1 Visualisation des Plannings

- Affichage des plannings par jour, semaine ou mois
- Filtrages multiples (par secteur, par rôle, par personnel)
- Différenciation visuelle des types d'affectation (garde, astreinte, bloc, consultation)
- Vue personnelle (mes affectations) et vue globale (selon droits)
- Indication des conflits et alertes

### 1.2 Génération de Planning

- Génération automatique selon les règles d'affectation configurées (voir [Règles de Planification](../05_Regles_Metier/01_Regles_Planification.md#41-ordre-de-priorité-des-contraintes)).
- Prise en compte des contraintes temporelles (gardes, congés, etc.) et des temps partiels.
- Optimisation selon les requêtes spécifiques validées, l'équité (gardes, consultations, temps OFF) et les compteurs (horaire, pénibilité).
- **Fonctionnalité de Pré-Planning :** Interface permettant à l'admin d'anticiper les besoins en personnel pour une période future (jour/semaine) en se basant sur la **trame des chirurgiens prévus** (salles ouvertes/occupées par spécialité) et les absences/congés connus du personnel d'anesthésie, ainsi que les **consultations ouvertes/fermées** pour la période.
  - **Objectif 1 : Compter les besoins.** L'outil doit calculer et afficher le nombre minimum de MAR/IADE requis par secteur/créneau.
  - **Objectif 2 : Identifier les tensions.** Comparer les besoins aux effectifs prévus (personnel présent moins congés/absences) et signaler les manques ou sureffectifs.
  - **Objectif 3 : Simuler une ébauche.** Tenter une affectation très simplifiée pour visualiser les points de blocage majeurs.
  - **Objectif 4 : Suggérer des actions.** En cas de déséquilibre détecté, proposer des pistes (ex: "Déplacer l'IADE volant du Jeudi au Mercredi ?", "Fermer une consultation le Mardi AM ?", "Alerte : Manque 1 MAR Lundi Matin - Prévoir remplaçant ?").
- Possibilité d'ajustement manuel par les administrateurs après génération (voir [Règles de Planification](../05_Regles_Metier/01_Regles_Planification.md#43-gestion-manuelle-post-génération-et-conflits)).
  - Interface permettant d'interchanger deux personnes, déplacer une affectation, forcer une affectation (avec alerte et justification si violation de règle).
- En cas d'impossibilité de générer un planning complet, le système laisse les affectations vides et signale les problèmes (voir [Règles de Planification](../05_Regles_Metier/01_Regles_Planification.md#42-gestion-de-labsence-de-solution)).
- Historisation des modifications manuelles et des versions du planning.

### 1.3 Exportation et Impression

- Export du planning en PDF, Excel
- Génération de rapports personnalisés
- Version imprimable optimisée

## 2. Gestion des Affectations

### 2.1 Structure Temporelle des Affectations

Les différents types d'affectations temporelles gérées par l'application :

- **Gardes MAR** : 
  - Durée : 24h (de 8h à 8h le lendemain)
  - Fréquence : 7j/7
  - Personnel : un MAR obligatoirement affecté
  - Statut post-garde : OFF automatique le lendemain (aucune affectation possible)

- **Astreintes MAR** : 
  - Durée : 24h (de 8h à 8h le lendemain)
  - Fréquence : 7j/7
  - Personnel : un MAR obligatoirement affecté, différent de celui de garde
  - Compatibilité : cumulable avec d'autres affectations (sauf garde)

- **Vacations bloc** : 
  - Période : du lundi au vendredi
  - Créneaux : matin (8h-13h) et après-midi (13h30-18h30)
  - Personnel : MARs et IADEs selon règles sectorielles

- **Consultations MAR** : 
  - Période : du lundi au vendredi
  - Créneaux : matin (8h-13h) et après-midi (13h30-18h30)
  - Personnel : MARs uniquement
  - Compatibilité : incompatible avec garde ou bloc

- **(Potentiel) Gardes IADE** : Structure similaire aux gardes MAR, mais pour IADE (configurable, non utilisé V1).
- **(Potentiel) Astreintes IADE** : Structure similaire aux astreintes MAR, mais pour IADE (configurable, non utilisé V1).

### 2.2 Structure Géographique des Affectations

Organisation spatiale gérée par l'application :

- **Sites** : différentes cliniques/hôpitaux (prévu pour extension future, actuellement un seul site)
- **Secteurs** : divisions au sein d'un site avec des règles spécifiques
- **Salles** : espaces individuels d'intervention au sein d'un secteur. Les statuts `active`/`inactive`/`réservée` sont gérés. Les statuts temporaires (nettoyage, maintenance) ne sont pas gérés par l'application.

- **Intégration des données Chirurgiens (Trame externe) :**
  - L'affectation des chirurgiens aux salles et aux créneaux **n'est PAS gérée** par l'algorithme de planification d'anesthésie. Elle provient d'une trame externe.
  - **Configuration Initiale :** L'administrateur doit pouvoir saisir manuellement la trame de base (semaines paires/impaires) via une interface dédiée dans l'application (Chirurgien, Demi-journée, Salle, Spécialité).
  - **Mise à jour (Optionnelle via Google Sheets) :**
    - Possibilité de configurer une synchronisation avec un fichier Google Sheets.
    - Lancement manuel de la mise à jour par l'admin.
    - Option de mise à jour automatique périodique (fréquence configurable, ex: tous les 7 jours).
    - L'application lit les informations depuis Sheets (lecture seule).
  - Cette trame (spécifique semaines paires/impaires ou exceptions ponctuelles) contient : Chirurgien, Demi-journée, Salle attribuée, Spécialité.
  - Ces informations sont utilisées :
    - Par l'outil de pré-planning.
    - Comme **donnée d'entrée** pour l'algorithme d'affectation MAR/IADE.
    - Pour l'affichage contextuel dans le planning d'anesthésie (voir qui opère où).
  - Des modifications manuelles de cette trame (changement de salle pour un chirurgien) peuvent être suggérées par l'admin si cela résout un conflit d'anesthésie, mais doivent être appliquées *en dehors* de MATHILDA ou via une fonction d'import dédiée.

- **Gestion du Matériel Spécifique (Mobile) :** Hors scope de l'application. La disponibilité du matériel mobile n'est pas une contrainte gérée par l'algorithme.

Les secteurs actuellement configurés (5 dans le site d'anesthésie) :
- Hyperaseptique : salles 1 à 4
- Intermédiaire : salles 5 à 8
  - *Note : la salle 8 est réservée aux césariennes d'urgence, ne doit pas apparaître sur le planning standard*
- Septique : salles 9 à 12 et 12BIS (pas de salle 13)
- Ophtalmo : salles 14 à 17
- Endoscopies : salles endo 1 à endo 4

## 3. Gestion des Absences et Congés

### 3.1 Demande de Congés

- Interface de saisie des demandes de congés avec dates et motifs
- Visualisation des congés déjà accordés pour la période
- Notification automatique à l'administrateur concerné
- Système d'acceptation automatique sous conditions :
  - Demande faite plus d'un mois à l'avance
  - Aucun autre personnel du même corps de métier déjà en congé

### 3.2 Validation des Congés

- Interface administrateur pour visualiser les demandes en attente
- Indication du nombre de personnes déjà en congé par date
- Système de validation/refus avec commentaire
- Notification au demandeur de la décision

### 3.3 Gestion des Absences Imprévues

- Saisie des absences de dernière minute (maladie, etc.)
- Impact automatique sur le planning
- Proposition de remplacement pour les affectations critiques

## 4. Échanges d'Affectations

### 4.1 Demande d'Échange

- Interface pour visualiser ses affectations et demander un échange
- Filtrage automatique des échanges possibles selon les règles de compatibilité
- Pour les gardes : proposition des jours/personnes compatibles
- Envoi de la demande à la personne concernée

### 4.2 Validation d'Échange

- Notification de demande d'échange reçue
- Interface d'acceptation/refus avec commentaire
- Notification à l'administrateur pour information
- Mise à jour automatique du planning après acceptation

## 5. Compteur Horaire

### 5.1 Saisie des Heures

- Interface de déclaration des heures effectuées (pour les MARs).
- Formulaire simple, potentiellement pré-rempli basé sur le planning théorique (configurable).
- L'administrateur doit pouvoir modifier les heures déclarées.
- Calcul automatique basé sur les affectations réalisées.
- Comptabilisation spécifique des gardes (valeur configurable, par défaut 12h/garde).

### 5.2 Visualisation des Compteurs

- Affichage personnel de son compteur d'heures
- Visualisation des tendances (avance/retard)
- Pour les administrateurs : vue globale des compteurs de l'équipe

### 5.3 Impact sur la Planification

- Pris en compte dans l'équilibrage du temps OFF (voir [Règles de Planification](../05_Regles_Metier/01_Regles_Planification.md#33-règles-pour-le-compteur-horaire-mars)).
- Équilibrage automatique sur la période configurée.

## 6. Gestion des Temps Partiels

- Le temps de travail (ex: 80%, 50%) est configurable par administrateur pour chaque utilisateur MAR et IADE.
- L'application prend en compte ce paramètre pour la génération des plannings, la répartition équitable des tâches (gardes, consultations, fermetures), l'équilibrage du temps OFF et le calcul des compteurs.
- Les jours/demi-journées non travaillés liés au temps partiel sont visualisables sur le planning.

## 7. Requêtes Spécifiques

### 7.1 Saisie des Requêtes

Interface permettant aux utilisateurs de soumettre des demandes spécifiques :
- Être dans la même salle qu'un chirurgien particulier
- Être en consultation un jour précis
- Être de garde tel jour
- Autres préférences d'affectation

### 7.2 Traitement des Requêtes

- Interface administrateur pour la gestion des requêtes.
- Système de priorisation des requêtes (validée vs non validée).
- Prise en compte lors de la génération automatique du planning (voir [Règles de Planification](../05_Regles_Metier/01_Regles_Planification.md#41-ordre-de-priorité-des-contraintes)). 