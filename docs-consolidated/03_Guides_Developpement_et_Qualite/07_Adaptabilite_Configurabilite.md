# Adaptabilité et Configurabilité

L'adaptabilité et la configurabilité de Mathildanesth sont des qualités essentielles pour permettre son déploiement et son utilisation efficace dans divers environnements hospitaliers, chacun ayant potentiellement des règles de gestion, des structures organisationnelles, et des préférences de fonctionnement spécifiques.

## 1. Objectifs de l'Adaptabilité

- **Répondre aux Besoins Spécifiques** : Permettre aux établissements de santé d'ajuster le comportement de l'application pour qu'il corresponde à leurs processus internes sans nécessiter de modifications du code source.
- **Faciliter l'Évolution** : Permettre à l'application de s'adapter aux changements d'organisation ou de réglementation au fil du temps.
- **Autonomie des Administrateurs** : Donner aux administrateurs fonctionnels la capacité de gérer une grande partie de la configuration du système via une interface dédiée.

## 2. Domaines Clés de Configurabilité

De nombreux aspects de Mathildanesth sont conçus pour être configurables. Les sections fonctionnelles de cette documentation (`02_Fonctionnalites`) décrivent en détail les paramètres spécifiques à chaque module. Voici un rappel des principaux domaines où la configurabilité est cruciale :

### 2.1. Règles de Planification et Contraintes Métier
- C'est l'un des domaines les plus importants pour l'adaptabilité.
- **Types de Règles** : Définition et configuration des règles dures (inviolables) et souples (préférences, avertissements) pour la génération de planning (voir `02_Fonctionnalites/03_Planning_Generation/01_Moteur_Regles.md`).
- **Paramètres des Règles** : Valeurs numériques (ex: nombre maximum de gardes consécutives), conditions logiques, priorités entre règles.
- **Activation/Désactivation** : Possibilité d'activer ou de désactiver des règles spécifiques.
- **Scénarios de Règles** : Gestion de plusieurs jeux de règles pour différentes périodes ou contextes (ex: été, hiver, crise sanitaire).

### 2.2. Organisation et Structure
- **Sites et Départements** : Définition des sites hospitaliers, des départements/services (voir `02_Fonctionnalites/07_Gestion_Affectations/02_Structure_Geographique.md`).
- **Secteurs et Salles d'Opération** : Configuration des secteurs du bloc opératoire, des salles, de leurs caractéristiques et types (voir `02_Fonctionnalites/04_Bloc_Operatoire/01_Configuration_Salles_Equipements.md`).
- **Rôles Professionnels (`ProfessionalRole`)** : Définition des rôles utilisateurs au sein de l'application, qui peuvent être utilisés pour cibler des règles ou des affectations.

### 2.3. Types d'Activités et d'Affectations
- **Types d'Affectation (`ActivityType`)** : Création et personnalisation des différents types d'activités planifiables (gardes, astreintes, consultations, bloc, formation, etc.), avec leurs codes, couleurs, et catégories (voir `02_Fonctionnalites/07_Gestion_Affectations/01_Types_Affectations.md`).

### 2.4. Gestion des Congés et Absences
- **Types de Congés (`LeaveType`)** : Définition des différents types de congés (annuel, RTT, maladie, formation, etc.) avec leurs propres règles (ex: délai de prévenance, impact sur les quotas).
- **Quotas de Congés** : Configuration des quotas individuels et collectifs (voir `02_Fonctionnalites/02_Gestion_Conges_Absences/04_Quota_Management_Soldes.md`).
- **Périodes de Restriction** : Définition de périodes où les congés sont limités ou interdits.

### 2.5. Compteurs et Suivi du Temps
- **Configuration des Compteurs** : Définition des compteurs à suivre pour l'équité ou le temps de travail (ex: nombre de week-ends, nuits, heures effectuées), et potentiellement leurs cibles ou seuils.
- **Règles de Calcul** : Modalités de calcul de ces compteurs (ex: comment une garde de nuit de week-end incrémente différents compteurs).

### 2.6. Notifications
- **Types de Notifications** : Personnalisation des événements déclenchant des notifications.
- **Canaux de Notification** : Choix des canaux (in-app, email) pour différents types de notifications.
- **Modèles de Messages (Optionnel)** : Possibilité pour les administrateurs de personnaliser certains modèles de messages de notification.

### 2.7. Types de Requêtes Personnelles (`RequestType`)
- Configuration des différentes catégories de requêtes que les utilisateurs peuvent soumettre (voir `02_Fonctionnalites/11_Requetes_Personnelles/01_Soumission_Traitement.md`).

## 3. Interface d'Administration

- Une section d'administration centralisée et conviviale est indispensable pour permettre aux utilisateurs habilités (administrateurs fonctionnels, super-utilisateurs) de gérer tous ces paramètres de configuration sans intervention technique.
- L'interface doit être claire, fournir des aides contextuelles, et valider les entrées pour éviter les configurations erronées.

## 4. Implémentation Technique de la Configurabilité

- **Stockage en Base de Données** : La plupart des paramètres de configuration sont stockés dans des tables dédiées de la base de données (ex: `Rule`, `ActivityType`, `LeaveType`, `Site`, `OperatingRoom`, etc.).
- **Modèles Prisma Flexibles** : Le schéma Prisma est conçu pour supporter cette configurabilité (champs optionnels, relations, types énumérés quand pertinent, champs JSON pour des configurations plus complexes).
- **Moteur de Règles Dynamique** : Le moteur de génération de planning doit pouvoir charger et interpréter dynamiquement les règles configurées.
- **Mécanismes de Cache** : Les configurations fréquemment accédées peuvent être mises en cache pour améliorer les performances, avec une invalidation appropriée lors des modifications.

L'accent mis sur l'adaptabilité et la configurabilité vise à rendre Mathildanesth pérenne et capable de répondre aux besoins variés et évolutifs des établissements de santé qu'il dessert. 