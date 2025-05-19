# Publication des Plannings et Notifications

## 1. Vue d'ensemble

Une fois qu'un planning a été généré, ajusté et validé par les planificateurs, l'étape suivante est sa publication. La publication rend le planning officiel et accessible aux utilisateurs concernés. Elle s'accompagne généralement d'un système de notifications pour informer les équipes des mises à jour.

## 2. Processus de Publication

### 2.1. Déclenchement
- La publication est généralement une action manuelle initiée par un `ADMIN` ou un `PLANNER` depuis l'interface de gestion des plannings.
- Elle est typiquement effectuée après la phase de validation et d'ajustements manuels.
- Un bouton "Publier le planning" ou similaire est présent.

### 2.2. Actions Techniques lors de la Publication
- Le statut du planning passe de "Brouillon" ou "En validation" à "Publié" ou "Actif".
- Le planning publié devient la version de référence consultable par les utilisateurs finaux.
- L'ancienne version publiée (si existante) est archivée pour historisation (voir `05_Gestion_Historique_Plannings.md`).
- Un instantané (snapshot) du planning et des règles appliquées à ce moment-là peut être conservé pour audit.

### 2.3. Options de Publication
- **Publication immédiate** : Le planning devient visible instantanément.
- **Publication programmée** (fonctionnalité avancée) : Choisir une date et une heure à laquelle le planning deviendra automatiquement visible. Utile pour coordonner la communication.

## 3. Système de Notifications

Un système de notifications efficace est crucial pour s'assurer que tous les utilisateurs sont informés des nouveaux plannings ou des modifications importantes.

### 3.1. Types de Notifications
- **Notification de nouveau planning publié** : Informe qu'un planning pour une période future est disponible.
- **Notification de modification de planning** : Si des changements significatifs sont apportés à un planning déjà publié (ex: changement d'affectation pour un utilisateur), une notification ciblée est envoyée.
- **Rappels d'affectations** (optionnel) : Rappels envoyés aux utilisateurs un peu avant leurs affectations planifiées (ex: la veille pour le lendemain).

### 3.2. Canaux de Notification
Mathildanesth devrait supporter plusieurs canaux pour atteindre les utilisateurs :
- **Notifications in-app** : Un centre de notifications intégré à l'application (icône cloche, badge) où les messages s'accumulent.
- **Email** : Envoi d'un email récapitulatif ou détaillé.
- **Notifications push mobiles** (si une application mobile Mathildanesth existe ou est prévue).
- **SMS** (pour des alertes critiques ou si configuré par l'utilisateur et l'établissement).

### 3.3. Configuration des Notifications
- **Administrateurs** :
    - Peuvent configurer les modèles de messages pour chaque type de notification.
    - Peuvent définir les canaux activés par défaut.
    - Peuvent choisir si les notifications de modification sont envoyées pour des changements mineurs ou uniquement majeurs.
- **Utilisateurs** :
    - Peuvent personnaliser leurs préférences de notification (ex: choisir de recevoir des emails en plus des notifications in-app, désactiver certains types de rappels non essentiels).
    - Peuvent définir des plages de "Ne pas déranger".

### 3.4. Contenu des Notifications
- **Clair et concis** : L'information essentielle doit être immédiatement visible.
- **Pertinent** : L'utilisateur ne doit recevoir que les informations qui le concernent directement.
- **Liens directs** : Inclure des liens pour accéder directement à la section concernée du planning dans l'application.
    - Exemple pour un nouveau planning : "Le planning pour la semaine du JJ/MM au JJ/MM est maintenant disponible. [Voir le planning]"
    - Exemple pour une modification : "Votre affectation du JJ/MM a été modifiée. Vous êtes maintenant affecté à [Nouvelle Affectation] de HH:MM à HH:MM. [Voir détails]"

### 3.5. Ciblage des Notifications
- **Notifications de nouveau planning** : Peuvent être envoyées à tous les utilisateurs des services concernés par le planning, ou à des listes de diffusion spécifiques.
- **Notifications de modification** : Principalement envoyées aux utilisateurs directement impactés par le changement. Leurs superviseurs ou les planificateurs peuvent aussi être en copie.

## 4. Confirmation de Lecture (Optionnel)

- Pour des informations très critiques, le système pourrait demander une confirmation de lecture de la notification par l'utilisateur.
- Cela peut être utile pour s'assurer que les changements importants ont bien été vus, notamment pour des modifications de dernière minute.

## 5. Gestion des Erreurs de Notification

- Le système doit journaliser l'envoi des notifications et les éventuelles erreurs (ex: adresse email invalide).
- Des alertes peuvent être envoyées aux administrateurs si un grand nombre de notifications échouent.

Une bonne gestion de la publication et des notifications contribue grandement à l'adoption de l'outil et à la fluidité de la communication au sein des équipes. 