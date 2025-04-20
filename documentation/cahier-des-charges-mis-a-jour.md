# Cahier des Charges - Application de Planning pour Équipe d'Anesthésie

## 1. Présentation générale

### 1.1 Contexte
Développement d'une application de gestion des plannings pour une équipe d'anesthésie, inspirée de l'application Momentum (BioSked), mais adaptée aux besoins spécifiques de l'équipe.

### 1.2 Objectifs
- Gérer les plannings des médecins anesthésistes-réanimateurs (MARs) et des infirmiers anesthésistes (IADEs)
- Optimiser la répartition des gardes, astreintes, consultations et affectations au bloc opératoire
- Améliorer le suivi des congés, du temps de travail et des spécialités pratiquées
- Offrir une interface conviviale, accessible et hautement personnalisable sur différents appareils (ordinateur, tablette, smartphone)
- Faciliter la collaboration et la communication entre équipes
- Garantir la conformité aux normes médicales et réglementations

### 1.3 Portée
- 16 MARs et 9 IADEs (évolutif)
- Accessible sur web et mobile (Android/iOS)
- Fonctionnalités prioritaires: gestion des gardes/astreintes et planning du bloc opératoire
- Évolutions prévues pour ajouter des modules complémentaires

## 2. Architecture technique

### 2.1 Architecture globale
L'application sera développée selon une architecture moderne en trois couches :
- **Frontend** : Applications web et mobile, potentiellement en architecture micro-frontends
- **Backend** : API RESTful ou GraphQL
- **Base de données** : Système de gestion de données relationnelles avec extensions temporelles

### 2.2 Stack technologique recommandée

#### Frontend
- **Web** : Next.js (React) avec TypeScript et Tailwind CSS
- **Mobile** : React Native avec TypeScript
- **Visualisation** : Bibliothèques de graphiques (Chart.js, D3.js) pour les statistiques
- **UI Components** : Headless UI ou Radix UI pour l'accessibilité
- **État Global** : Zustand/Jotai ou Redux Toolkit
- **Documentation UI** : Storybook pour composants interactifs

#### Backend
- **Langage/Framework** : Node.js avec Express/NestJS ou Python avec FastAPI
- **API** : RESTful ou GraphQL avec authentification JWT
- **Validation des données** : Zod ou Joi pour TypeScript
- **Intégration externe** : API Google Sheets pour l'import/export des données
- **Functions-as-a-Service** : Pour certaines opérations isolées (serverless)

#### Base de données
- **Principale** : PostgreSQL avec extension TimescaleDB pour données temporelles
- **ORM** : Prisma pour simplifier les interactions avec la base de données
- **Cache** : Redis pour la mise en cache et l'amélioration des performances
- **Recherche** : ElasticSearch pour recherche avancée dans l'historique

#### Déploiement
- **Serveur web** : Hébergement cloud (AWS, Google Cloud, Azure) ou PaaS (Vercel, Netlify)
- **CI/CD** : Pipeline d'intégration/déploiement continu (GitHub Actions, GitLab CI)
- **Conteneurisation** : Docker et Docker Compose pour le développement et déploiement
- **Monitoring** : New Relic ou Datadog pour surveillance des performances

#### Test et Qualité
- **Tests unitaires** : Jest avec React Testing Library
- **Tests E2E** : Cypress ou Playwright
- **Linting et formatting** : ESLint, Prettier avec Husky pour pre-commit hooks
- **Analyse statique** : SonarQube pour détection précoce de problèmes

## 3. Modèle de données

### 3.1 Entités principales

#### Utilisateurs
- **Base** : ID, nom, prénom, email, mot de passe, type (MAR, IADE, Admin), niveau d'accès, date de création
- **Profil MAR** : 
  - Temps de travail (temps plein, mi-temps)
  - Configuration des jours travaillés (tous, alternance semaines paires/impaires, mois alternés, jours spécifiques)
  - Droits aux congés (50j pour temps plein, proportionnel au temps de travail)
  - Spécialités maîtrisées
  - Préférences personnelles et contraintes
- **Profil IADE** : 
  - Temps de travail (35h, 39h, 21h, etc.)
  - Configuration des horaires (journées complètes 8h-18h30, demi-journées 8h-13h)
  - Droits aux congés
  - Compétences spécifiques

#### Chirurgiens
- ID, nom, prénom
- Spécialités (liste détaillée des 15+ spécialités identifiées)
- Statut (actif/inactif)
- Règles de prise en charge spécifiques (pédiatrie, etc.)
- Historique de collaboration avec MARs/IADEs

#### Salles et secteurs
- ID, nom, numéro
- Type (Chirurgie 1-7, 9-12+12bis, Ophtalmo 1-4, Endoscopie 1-4, Césarienne/8)
- Secteur (Hyperaseptique 1-4, Secteur 5-8, Secteur 9-12B, Ophtalmo, Endo)
- Code couleur (par secteur, plus clair l'après-midi)
- Règles de supervision par secteur
- Historique d'utilisation et statistiques d'occupation

#### Planning et affectations
- ID, date, demi-journée (matin/après-midi)
- Utilisateur_id (MAR ou IADE)
- Type_affectation (garde, astreinte, consultation, bloc-anesthésie, bloc-supervision)
- Salle_id (si bloc)
- Chirurgien_id (si applicable)
- Spécialité pratiquée
- Statut (généré automatiquement, validé, modifié manuellement)
- Indicateur situation exceptionnelle
- Historique de modifications avec justifications
- Commentaires et notes

#### Congés et absences
- ID, utilisateur_id
- Date_début, date_fin
- Type (CA, maladie, formation, récupération, etc.)
- Statut (demandé, approuvé, refusé)
- Commentaire
- Décompte (oui/non selon règles)
- Justificatifs (si applicable)
- Impact sur planning généré

#### Compteurs
- ID, utilisateur_id, année
- Congés_pris, congés_restants
- Heures_supplémentaires
- Statistiques spécialités (nombre d'affectations par spécialité)
- Statistiques gardes/astreintes/consultations
- Métriques qualité de vie au travail
- Équité des affectations

#### Trames
- ID, nom, type (bloc, consultation, garde)
- Configuration par semaine (paire/impaire)
- Date_début_validité, date_fin_validité
- Détails (JSON structuré avec configuration complète)
- Historique des modifications

#### Communications et Notifications
- ID, type, contenu, statut
- Destinataires et expéditeurs
- Date de création/lecture
- Priorité et action requise
- Références aux autres entités (planning, congés, etc.)

### 3.2 Relations
- Un utilisateur peut avoir plusieurs affectations
- Un utilisateur peut faire plusieurs demandes de congés
- Une salle peut avoir plusieurs affectations sur différentes dates
- Chaque affectation peut être liée à un chirurgien
- Chaque trame est liée à plusieurs affectations planifiées
- Les communications peuvent être liées à divers éléments du système

## 4. Fonctionnalités détaillées

### 4.1 Gestion des utilisateurs

#### Système d'authentification
- Inscription (réservée à l'administrateur)
- Connexion sécurisée avec 2FA optionnel
- Récupération de mot de passe
- Gestion des sessions
- Niveaux d'accès (admin complet, admin partiel, utilisateur standard)
- Journalisation des actions pour audit

#### Administration des utilisateurs
- Création, modification, désactivation des comptes
- Configuration des profils MAR avec options pour:
  - Temps plein/mi-temps
  - Jours travaillés alternés (semaines paires/impaires)
  - Mois alternés (un mois sur deux)
  - Configurations spécifiques (demi-semaines, jours fixes)
- Configuration des profils IADE avec temps de travail personnalisables (35h, 39h, 21h)
- Import des plannings IADE depuis Excel
- Système de permissions granulaires

#### Gestion des remplaçants
- Ajout manuel par les administrateurs
- Sans accès à l'application
- Prise en compte dans les plannings générés
- Base de données de remplaçants disponibles
- Processus accéléré de contact en cas d'urgence

#### Onboarding et formation
- Parcours d'introduction pour nouveaux utilisateurs
- Documentation contextuelle et aide intégrée
- Tutoriels interactifs pour les fonctionnalités principales
- Mode démonstration/bac à sable pour essais

### 4.2 Gestion des congés

#### Demande de congés
- Interface avec calendrier
- Système de notification (application et push mobile)
- Visualisation des requêtes en attente
- Indication de l'impact sur le planning existant
- Suggestions de dates optimales basées sur la charge d'activité

#### Validation des congés
- Interface d'administration pour approuver/refuser
- Justification du refus (commentaire)
- Notifications aux utilisateurs
- Workflow de validation multi-niveaux si nécessaire
- Priorisation des demandes selon règles prédéfinies

#### Règles de décompte des congés
- Pour les MARs : décompte seulement si jour travaillé (lundi-vendredi, hors fériés)
- 50 jours pour temps plein, proportionnel pour temps partiel
- Suivi des compteurs annuels et reports
- Gestion des situations exceptionnelles et dérogations
- Alertes pour congés non utilisés

### 4.3 Planification des gardes et astreintes

#### Règles de planification
- Un médecin de garde tous les jours + un d'astreinte
- Le MAR de garde doit être OFF le lendemain
- Le MAR d'astreinte peut travailler normalement
- Équité dans la répartition des gardes (selon temps de travail)
- Respect des contraintes temporelles:
  - Idéalement 7 jours entre gardes (min. 3 jours)
  - Max. 3 gardes/30 jours (exceptionnellement 4)
- Prise en compte des préférences personnelles quand possible

#### Interface de planification
- Planification sur 3-5 mois
- Possibilité de définir manuellement certaines gardes (weekends, fériés)
- L'algorithme complète en respectant les règles et les pré-affectations
- Alertes visuelles pour les situations exceptionnelles
- Possibilité pour les MARs d'indiquer des dates d'indisponibilité
- Système de permutation et d'échange entre médecins

#### Gestion des imprévus
- Système d'alerte pour absences de dernière minute
- Identification automatique des remplaçants potentiels
- Procédure d'urgence pour situations critiques
- Historique des remplacements pour équité future

### 4.4 Planification des consultations

#### Règles de planification
- Configuration du nombre de consultations ouvertes par demi-journée
- 2 consultations par médecin temps plein par semaine
- Répartition équitable matin/après-midi
- Limites pour les situations exceptionnelles:
  - Max 3 consultations/semaine
  - Répartition matin/après-midi (1-2 ou 2-1, jamais 3-0)
- Possibilité de fermer des créneaux (vacances scolaires)
- Option pour ne répartir qu'une "couche" et laisser l'autre pour ajustement manuel
- Prise en compte des compétences spécifiques

#### Interface de planification
- Calendrier avec créneaux de consultation
- Options de génération (complète ou partielle)
- Alertes visuelles pour les situations exceptionnelles
- Visualisation de l'historique pour assurer la rotation
- Annotations pour besoins spécifiques

### 4.5 Planification du bloc opératoire

#### Configuration des salles
- 13 salles de chirurgie (1-7, 9-12, 12bis)
- 1 salle de césarienne (8)
- 4 salles d'ophtalmologie (Ophta 1-4)
- 4 salles d'endoscopie (Endo 1-4)
- Codes couleur par secteur:
  - Salles 1-4 (hyperaseptique): Bleu sombre
  - Salles 5-8: Vert
  - Salles 9-12B: Orange
  - Salles ophta 1-4: Rose
  - Salles d'endoscopie: Bleu roi
  - Teintes plus claires pour l'après-midi
- Configuration personnalisable pour évolutions futures

#### Règles de supervision
- MAR peut superviser un nombre limité de salles selon configuration:
  - Règle générale: 2 salles (lui + 1 IADE), exceptionnellement 3
  - Règles par secteur:
    - S1-4: supervision dans le même secteur ou S5 si MAR en S3/S4
    - S6-7: peut superviser l'ophtalmologie ou S5-7
    - S9-12B: supervision dans salles contiguës
    - Ophtalmologie: 3 salles max par personnel
    - Endoscopie: 2 salles par personnel, supervision possible depuis S10-12B
- Alertes automatiques pour situations non conformes
- Journal des dérogations aux règles et leurs justifications

#### Interface de planning bloc
- Vue hebdomadaire avec distinction matin/après-midi
- Import depuis Google Sheets pour disponibilité des chirurgiens
- Option future pour connexion à HM bloc/Planif
- Fermeture manuelle de vacations ou périodes
- Menu contextuel pour affectation manuelle
- Visualisation des supervisions et alertes pour situations exceptionnelles
- Outils de simulation pour tester différents scénarios

### 4.6 Algorithme de génération de planning

#### Étapes de priorité
1. Gardes et astreintes
2. Consultations (complètes ou première couche)
3. Bloc opératoire
4. Vérification de la cohérence et respect des règles
5. Optimisation globale et recherche de la solution optimale

#### Paramètres
- Respect des temps de travail
- Équilibre des spécialités pratiquées
- Respect des règles de supervision
- Prise en compte des affectations manuelles préexistantes
- Prise en compte des indisponibilités déclarées
- Apprentissage des préférences basé sur l'historique
- Évaluation de la qualité de vie et de la fatigue

#### Options de configuration
- Lancement par étapes ou complet
- Possibilité de modifier après génération
- Génération sur période personnalisable
- Paramètres d'optimisation configurables
- Conservation de plusieurs versions pour comparaison

### 4.7 Suivi du temps de travail et statistiques

#### Saisie des horaires
- Interface simple pour déclarer les heures travaillées
- Options prédéfinies (2h-12h par tranches de 30 min)
- Option "Autre" pour horaire personnalisé
- Champ de notes pour commentaires
- Intégration possible avec systèmes de pointage

#### Tableaux de bord statistiques
- Heures réalisées par période/utilisateur
- Congés pris/restants
- Reports d'heures et de congés d'une année sur l'autre
- Statistiques par spécialité:
  - Nombre de vacations par MAR/IADE et par spécialité
  - Nombre de vacations avec chaque chirurgien
  - Nombre de consultations, gardes, astreintes
- Visualisations graphiques personnalisables
- Périodes d'analyse configurables (mois, trimestre, année, personnalisé)
- Analyses de tendances et prédictions
- Indicateurs de qualité de vie au travail

### 4.8 Communication et collaboration

#### Messagerie interne
- Système de messages contextuels liés aux plannings
- Gestion des demandes d'échange de garde ou d'affectation
- Notifications configurables
- Archivage et recherche des communications

#### Commentaires et annotations
- Possibilité d'ajouter des notes sur les affectations
- Journal des modifications avec justifications
- Partage de remarques et conseils sur les interventions
- Bibliothèque de connaissances collaborative

#### Système d'alerte et de notification
- Alertes pour modifications importantes
- Rappels pour validations en attente
- Notifications d'urgence pour remplacements
- Configuration des canaux préférés (email, SMS, push)

### 4.9 Import/Export de données

#### Import
- Plannings IADE depuis Excel
- Disponibilité des chirurgiens depuis Google Sheets
- Future intégration avec HM bloc/Planif
- Import massif via API pour migration de données

#### Export
- Plannings générés en PDF, Excel
- Données statistiques en formats exploitables
- Options de personnalisation des exports
- API pour intégration avec autres systèmes hospitaliers
- Rapports automatisés et tableaux de bord

## 5. Interfaces utilisateur

### 5.1 Application web

#### Tableau de bord
- Vue d'ensemble personnalisée selon profil
- Raccourcis vers fonctionnalités principales
- Notifications et alertes
- Statistiques simplifiées
- Widgets configurables selon préférences
- Indicateurs clés de performance

#### Plannings
- Vue calendrier (jour, semaine, mois)
- Vue planning (hebdomadaire, mensuelle)
- Filtres par type (gardes, consultations, bloc)
- Codes couleur et légendes
- Options d'édition contextuelle
- Zoom et focus sur les périodes d'intérêt
- Visualisation comparative (version actuelle vs proposée)

#### Administration
- Gestion des utilisateurs
- Configuration des règles et paramètres
- Validation des demandes en attente
- Génération des plannings
- Auditabilité des actions et modifications
- Configuration des automatisations et alertes

#### Personnalisation
- Thèmes de couleurs (incluant mode sombre)
- Disposition des éléments
- Préférences d'affichage
- Density options (confortable/compact)
- Raccourcis clavier personnalisables
- Accessibilité (contraste, taille de texte, etc.)

### 5.2 Applications mobiles

#### Fonctionnalités clés
- Consultation des plannings
- Demande de congés
- Déclaration d'heures simplifiée
- Notifications push
- Échanges rapides entre utilisateurs
- Mode hors-ligne pour accès aux informations essentielles

#### Adaptation mobile
- Interface optimisée pour petits écrans
- Navigation simplifiée
- Fonctionnalités essentielles prioritaires
- Gestures intuitifs
- Performance optimisée pour appareils mobiles

### 5.3 Accessibilité

- Conformité WCAG 2.1 AA
- Support lecteurs d'écran
- Navigation au clavier
- Contraste suffisant
- Alternatives textuelles pour éléments visuels
- Tests utilisateurs avec personnes en situation de handicap

## 6. Notifications et alertes

### 6.1 Système de notifications
- Notifications dans l'application
- Notifications push sur mobile
- Notifications par email (optionnel)
- SMS pour situations critiques (optionnel)
- Indicateurs visuels pour requêtes en attente
- Hiérarchisation par niveau d'urgence

### 6.2 Types de notifications
- Validation/refus de congés
- Publication de nouveaux plannings
- Demandes de changement
- Alertes pour situations exceptionnelles
- Rappels de tâches à effectuer
- Communications d'équipe
- Alertes de sous-effectif

### 6.3 Gestion des préférences
- Configuration par type de notification
- Canaux préférés selon importance
- Plages horaires de réception
- Option Ne pas déranger
- Regroupement et résumés périodiques

## 7. Sécurité et performances

### 7.1 Sécurité
- Authentification sécurisée avec option 2FA
- Autorisations basées sur les rôles
- Protection des données sensibles (chiffrement)
- Journalisation des actions importantes
- Audits de sécurité réguliers
- Conformité RGPD et réglementations de santé
- Sessions avec timeout et renouvellement sécurisé

### 7.2 Performance
- Optimisation pour temps de réponse rapide
- Mise en cache des données fréquemment utilisées
- Limitation des requêtes inutiles
- Tests de charge pour garantir la stabilité
- Monitoring proactif des performances
- Stratégies de pagination et chargement progressif
- Optimisations spécifiques mobile (taille des payloads)

### 7.3 Disponibilité et fiabilité
- Architecture haute disponibilité
- Mécanismes de reprise après incident
- Sauvegardes régulières et vérifiées
- Plans de continuité et de reprise d'activité
- Stratégie de déploiement sans interruption de service
- Environnements de pré-production pour tests

## 8. Planning de développement

### 8.1 Phase 1 (1-2 mois) - Fondations
- Mise en place de l'architecture technique
- Développement du système d'authentification
- Création des modèles de données de base
- Interface utilisateur minimale (web uniquement)
- Setup des tests automatisés et CI/CD

### 8.2 Phase 2 (2-3 mois) - Fonctionnalités prioritaires
- Gestion des profils utilisateurs personnalisés
- Système de gestion des congés
- Planification des gardes et astreintes (priorité n°1)
- Import/export de données de base
- Tests d'utilisabilité préliminaires

### 8.3 Phase 3 (3-4 mois) - Fonctionnalités avancées
- Planification du bloc opératoire (priorité n°2)
- Planification des consultations
- Algorithme de génération complet
- Interface web complète
- Système de communication et collaboration

### 8.4 Phase 4 (4-6 mois) - Finalisation
- Applications mobiles
- Système de statistiques avancé
- Personnalisation de l'interface
- Tests utilisateurs et optimisations
- Intégration avec systèmes externes (Google Sheets, futur HM bloc)
- Audit de performance et sécurité

## 9. Livrables

### 9.1 Documentation
- Spécifications techniques détaillées
- Guide de l'utilisateur
- Documentation d'administration
- Documentation technique pour maintenance future
- Documentation d'API pour intégrations tierces

### 9.2 Code source
- Code source complet avec commentaires
- Scripts de déploiement
- Scripts de migration de données
- Tests automatisés
- Outils de développement et CI/CD

### 9.3 Applications
- Application web
- Applications mobiles (Android/iOS)
- Base de données configurée
- API documentée
- Outils d'administration et monitoring

## 10. Évolutions futures potentielles

### 10.1 Intégration directe avec HM bloc/Planif
- Développement d'un connecteur spécifique
- Synchronisation automatique des données
- Résolution des conflits de planification
- Interface unifiée

### 10.2 Intelligence artificielle
- Recommandations pour optimisation des plannings
- Prédiction des problèmes potentiels
- Apprentissage des préférences des utilisateurs
- Détection des patterns de fatigue et stress
- Suggessions proactives pour améliorer l'équilibre travail-vie

### 10.3 Module de gestion des compétences
- Suivi des formations
- Planification basée sur les compétences spécifiques
- Développement professionnel
- Certificats et accréditations
- Planification des formations

### 10.4 Gestion multi-établissements
- Extension pour gérer plusieurs sites hospitaliers
- Coordination inter-sites
- Standardisation avec adaptations locales
- Partage de ressources entre établissements
- Statistiques comparatives

### 10.5 Intégration écosystème médical élargi
- Connexion avec système de gestion hospitalière
- Intégration avec le Dossier Médical Patient
- Interfaçage avec systèmes de pharmacie
- Coordination avec services connexes (réanimation, urgences)
- Planification interdisciplinaire

---

Ce cahier des charges détaillé et amélioré servira de base pour le développement de votre application de planning d'anesthésie. Les phases de développement proposées permettent d'atteindre vos objectifs prioritaires dans un délai de 3 à 6 mois, avec une évolution progressive vers l'ensemble des fonctionnalités souhaitées et une architecture prête pour les évolutions futures.