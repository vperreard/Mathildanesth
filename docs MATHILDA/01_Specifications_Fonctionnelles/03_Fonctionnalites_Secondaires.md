# Fonctionnalités Secondaires

Ce document décrit les fonctionnalités complémentaires de l'application MATHILDA qui, bien que non essentielles au fonctionnement principal, apportent une valeur ajoutée significative à l'expérience utilisateur et à la gestion du bloc opératoire.

## 1. Tableau de Bord et Statistiques

### 1.1 Tableau de Bord Personnel

- Affichage personnalisé des indicateurs clés pour chaque utilisateur
- Résumé des affectations à venir et des demandes en cours
- Alertes sur les changements récents affectant l'utilisateur
- Compteurs personnels (heures, gardes, consultations)

### 1.2 Statistiques d'Activité (Indispensables V1)

- **Pour Admins MAR :**
  - Suivi du temps de travail de chaque MAR (vs théorique/temps partiel).
  - Décompte des congés pris/restants par MAR.
  - Décompte des gardes (semaine/WE/férié) et consultations par MAR (avec prorata temps de travail).
- **Pour MAR standard :**
  - Accès à ses propres statistiques (temps travail, congés, gardes, consultations).
- Export simple des données brutes possible.

### 1.3 Suivi des Compteurs

- Tableaux comparatifs des compteurs horaires entre membres de l'équipe
- Historique des compteurs sur différentes périodes
- Projection des tendances (avance/retard) sur les mois à venir

### 1.4 Statistiques Avancées (Post V1)

- Analyse de la répartition des affectations par secteur, spécialité, chirurgien.
- Suivi des taux d'occupation des salles.
- Comparaison des affectations entre MARs (proratisé).
- Visualisation graphique des tendances d'activité.

## 2. Système de Notification (Indispensable V1)

### 2.1 Notifications In-App / Smartphone

- Centre de notifications dans l'application.
- Notification push sur smartphone (via navigateur ou future app mobile).
- Marquage des notifications lues/non lues.
- **Événements déclencheurs indispensables :**
  - Publication d'un nouveau planning.
  - Validation ou refus d'une demande de congé.
  - Réception d'une demande d'échange.
  - Acceptation ou refus d'un échange proposé.
  - Modification d'une affectation personnelle.

### 2.2 Notifications Par Email (Post V1)

- Configuration des types d'événements déclenchant un email.
- Personnalisation des modèles d'emails.
- Fréquence des récapitulatifs (quotidien, hebdomadaire).

### 2.3 Alertes Critiques

- Notification immédiate pour les changements urgents (ex: remplacement de dernière minute).
- Alertes en cas de conflit ou d'incohérence dans le planning.
- Système de confirmation de lecture pour les informations critiques.

## 3. Gestion des Compétences (Indispensable V1 - Préférences/Interdits)

- Interface administrateur pour définir une liste de compétences (ex: Pédiatrie, ALR, Thoracique).
- Possibilité d'associer des compétences aux MARs et IADEs dans leur profil.
- Configuration des règles associées aux compétences :
  - **Interdit :** Le personnel sans la compétence X ne PEUT PAS être affecté à une salle/vacation nécessitant X.
  - **Préférence :** L'algorithme TENTERA d'affecter du personnel avec la compétence X à une salle/vacation nécessitant X.
- Association possible entre compétence requise et type de salle/secteur/spécialité chirurgicale.

## 4. Personnalisation de l'Interface

### 4.1 Préférences Utilisateur

- Choix de la vue par défaut (jour/semaine/mois)
- Paramètres d'affichage personnalisés (couleurs, filtres)
- Définition des raccourcis personnels

### 4.2 Filtres Avancés

- Création de filtres personnalisés complexes
- Enregistrement des filtres fréquemment utilisés
- Partage de filtres entre utilisateurs

### 4.3 Thèmes et Accessibilité

- Thème clair/sombre
- Options d'accessibilité (taille du texte, contraste)
- Mode d'affichage optimisé pour appareils mobiles

## 5. Journal d'Activité et Historique

### 5.1 Journal des Modifications

- Suivi chronologique des modifications du planning
- Identification des auteurs des modifications
- Commentaires associés aux changements

### 5.2 Historique des Plannings

- Archivage des plannings passés
- Comparaison entre versions du planning (prévu vs. réalisé)
- Extraction de données historiques pour analyse

### 5.3 Audit des Actions

- Journal complet des actions administratives
- Traçabilité des validations et refus
- Archivage sécurisé pour des raisons légales et organisationnelles

## 6. Communication Interne (Indispensable V1 - Commentaires Journaliers)

- Fonctionnalité permettant d'ajouter des commentaires textuels libres associés à une **journée spécifiques** du planning.
- **Qui peut commenter :** Configurable (par défaut : tous les utilisateurs connectés MAR/IADE/Admin).
- Visible par tous les utilisateurs ayant accès au planning de cette journée.
- **Historique :** Les commentaires précédents pour une même journée restent visibles (ordre chronologique ou autre).
- Utile pour noter des informations générales (réunion, événement spécial, visiteur, rappel important, absence courte durée prévue).

## 7. Gestion des Remplaçants (Souhaitable V1 - Gestion Disponibilités)

- Interface dédiée pour les utilisateurs avec le rôle `Remplaçant`.
- Calendrier simple permettant au remplaçant d'indiquer ses jours/demi-journées de disponibilité.
- L'administrateur peut consulter ces disponibilités lors de la recherche de remplacement.

## 8. Gestion Documentaire

- **Pour la conception (V1) :** La documentation actuelle (fichiers Markdown) sert de base. Un fichier récapitulatif de la structure sera créé (voir `docs/00_Structure_Projet.md`).
- **Pour l'utilisateur final (Post V1) :** Fonctionnalités de stockage de documents, base de connaissances, annotations, etc. ne sont pas prioritaires pour la première version.

### 8.1 Bibliothèque de Documents (Post V1)

- Stockage de documents liés à l'organisation du bloc
- Procédures opératoires standardisées
- Notes et mémos partagés

### 8.2 Base de Connaissances

- FAQ et guides utilisateurs
- Documentation des règles et pratiques spécifiques
- Tutoriels interactifs pour les nouveaux utilisateurs

### 8.3 Annotations et Commentaires

- Possibilité d'ajouter des notes contextuelles au planning
- Commentaires associés à des affectations spécifiques
- Partage d'informations entre équipes

## 9. Intégrations Externes

### 9.1 Calendriers Externes

- Synchronisation avec Google Calendar, Outlook, etc.
- Export iCal pour intégration avec d'autres applications
- Notifications intégrées aux calendriers personnels

### 9.2 Outils de Communication

- Intégration avec des systèmes de messagerie
- Possibilité d'envoyer des notifications par SMS
- Partage facile du planning vers d'autres plateformes

### 9.3 Systèmes Hospitaliers

- Liens vers le système d'information hospitalier
- Interface avec le logiciel de gestion des patients
- Récupération automatique des données de programmation opératoire

### 9.1 Synchronisation Calendriers Personnels (P3/P4)

- Fonctionnalité permettant aux utilisateurs (MAR/IADE) d'exporter leur planning MATHILDA vers leur calendrier personnel (Google Calendar, Outlook, iCal).
- Export en lecture seule.
- Mise à jour automatique ou manuelle.

## 10. Version Mobile (Indispensable V1 - via Navigateur)

### 10.1 Interface Web Responsive

- L'application web doit être conçue en *responsive design* pour être consultable et utilisable sur smartphone via le navigateur.
- **Fonctionnalités Utilisateur (MAR/IADE) :** Toutes les fonctionnalités accessibles sur ordinateur doivent l'être sur mobile (consultation planning, demandes congés/échanges, notifications).
- **Fonctionnalités Admin (Admin MAR/IADE) :** Peuvent être optimisées pour ordinateur et moins prioritaires sur mobile pour la V1.

### 10.2 Application Mobile Dédiée (Post V1)

- Version allégée pour consultation sur smartphone
- Fonctionnalités essentielles accessibles hors-ligne
- Synchronisation automatique lors de la reconnexion

### 10.3 Fonctionnalités Mobiles Spécifiques

- Notifications push
- Visualisation simplifiée adaptée aux petits écrans
- Possibilité de répondre rapidement aux demandes d'échange

## 11. Outils d'Administration Avancés

### 11.1 Console d'Administration

- Interface dédiée aux administrateurs
- Gestion centralisée des paramètres
- Tableaux de bord d'administration

### 11.2 Gestion de la Configuration

- Interface graphique pour modification des règles d'affectation
- Tests de cohérence après modification des règles
- Gestion des versions de configuration

### 11.3 Outils de Diagnostic

- Vérification de l'intégrité des données
- Détection des incohérences dans le planning
- Logs détaillés pour résolution des problèmes

### 11.4 Validation des Heures Déclarées (Optionnel)

- Si l'option est activée dans la configuration :
  - Interface pour les administrateurs désignés permettant de visualiser les heures déclarées par les MARs en attente de validation.
  - Possibilité de valider en lot ou individuellement.
  - Possibilité de modifier une déclaration avant validation.
  - Seules les heures validées sont prises en compte pour les compteurs officiels et l'équilibrage. 