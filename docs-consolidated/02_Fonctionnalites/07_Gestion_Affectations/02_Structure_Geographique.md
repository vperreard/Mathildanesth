# Modélisation de la Structure Géographique pour les Affectations

## 1. Introduction

Pour une planification précise, Mathildanesth doit pouvoir modéliser la structure géographique et organisationnelle des lieux où le personnel est affecté. Cela inclut les sites hospitaliers, les départements ou services, et des lieux plus spécifiques comme les salles d'opération, les unités de consultation, ou les services de soins.

Le schéma Prisma (`prisma/schema.prisma`) définit plusieurs modèles clés pour cette structuration : `Site`, `Department`, et `Location`.

## 2. Modèle `Site`

Le modèle `Site` représente une entité géographique de haut niveau, typiquement un hôpital ou un campus.

- **Champs Principaux (`prisma/schema.prisma`)** :

  - `id` (String) : Identifiant unique.
  - `name` (String) : Nom du site (ex: "Hôpital Central VilleX", "Clinique du Parc").
  - `address` (String, optionnel) : Adresse physique du site.
  - `isActive` (Boolean) : Si le site est actuellement en opération.
  - `departments` (Relation vers `Department[]`) : Liste des départements appartenant à ce site.
  - `operatingSectors` (Relation vers `OperatingSector[]`) : Secteurs opératoires liés à ce site.
  - `users` (Relation vers `User[]`) : Utilisateurs pouvant être rattachés à un ou plusieurs sites.

- **Utilisation** :
  - Permet de filtrer les plannings et les ressources par site dans les organisations multi-établissements.
  - Peut influencer les règles de déplacement ou les temps de trajet (non géré nativement mais pourrait être une extension).
  - Les secteurs opératoires ([`OperatingSector`](../04_Bloc_Operatoire/01_Configuration_Salles_Secteurs.md)) peuvent être liés à un site.

## 3. Modèle `Department` (Service/Unité)

Le modèle `Department` représente une division organisationnelle au sein d'un site, comme un service clinique ou une unité fonctionnelle.

- **Champs Principaux (`prisma/schema.prisma`)** :

  - `id` (String) : Identifiant unique.
  - `name` (String) : Nom du département (ex: "Service d'Anesthésie-Réanimation", "Chirurgie Cardiaque", "Consultations Externes").
  - `description` (String, optionnel).
  - `siteId` (String, optionnel) : Lien vers le `Site` parent.
  - `isActive` (Boolean).
  - `users` (Relation vers `User[]`) : Utilisateurs appartenant à ce département.

- **Utilisation** :
  - Permet d'organiser le personnel et les affectations par service.
  - Les règles de planification ou les besoins de couverture peuvent être spécifiques à un département.
  - Les utilisateurs (`User.departmentId`) sont souvent rattachés à un département principal.

## 4. Modèle `Location` (Lieu Spécifique)

Le modèle `Location` permet de définir des lieux plus granulaires où des affectations peuvent prendre place. Il est plus générique que `OperatingRoom` (qui est spécifique au bloc).

- **Champs Principaux (`prisma/schema.prisma`)** :

  - `id` (Int) : Identifiant unique.
  - `name` (String) : Nom du lieu (ex: "Salle de réveil Bloc A", "Unité de Soins Intensifs Polyvalents", "Box de consultation N°3", "Amphithéâtre Formation").
  - `sector` (String, optionnel) : Un moyen de sous-catégoriser le lieu, potentiellement un nom de secteur informel ou une zone au sein d'un département.
  - `isActive` (Boolean).
  - `assignments` (Relation vers `Assignment[]`) : Affectations ayant lieu dans ce lieu.
  - `duties`, `onCalls`, `regularAssignments` : Autres types d'affectations pouvant y être liées.

- **Utilisation** :
  - Préciser le lieu exact d'une affectation hors bloc opératoire (ex: une consultation, une réunion, une garde dans un service spécifique).
  - Le modèle `Assignment` possède un champ `locationId` pour lier une affectation à une `Location`.
  - Peut être utilisé en complément de `OperatingRoom` ou pour des lieux qui ne sont pas des salles d'opération (ex: SSPI, bureaux, etc.).

## 5. Configuration et Administration

- Des interfaces d'administration sont nécessaires pour gérer les sites, les départements et les lieux spécifiques.
  - CRUD pour chaque entité.
  - Gestion des relations (ex: assigner un département à un site, lier des utilisateurs à des départements/sites).
- La cohérence de cette structure est importante pour que les filtres et les règles basées sur la localisation fonctionnent correctement.

## 6. Interaction avec la Planification

- **Filtrage des Vues** : Les utilisateurs peuvent filtrer les plannings par site, département ou lieu.
- **Affectation des Ressources** : L'algorithme de planification prend en compte la localisation des besoins et la localisation possible du personnel (si des contraintes de mobilité existent ou si le personnel est rattaché à des lieux spécifiques).
- **Règles Basées sur la Localisation** : Certaines règles de planification peuvent être spécifiques à un site (ex: règles de repos différentes), un département (besoins de couverture spécifiques) ou un lieu (compétences requises pour travailler en SSPI).

---

Une modélisation claire de la structure géographique et organisationnelle permet à Mathildanesth de gérer des contextes variés, des petits services mono-site aux grands groupes hospitaliers multi-sites, et d'assurer que les bonnes personnes sont affectées au bon endroit.
