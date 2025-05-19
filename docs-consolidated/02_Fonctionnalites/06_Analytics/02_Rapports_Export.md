# Rapports Standards et Exports de Données

## 1. Vue d'ensemble

Au-delà des tableaux de bord dynamiques pour la visualisation quotidienne, Mathildanesth doit permettre la génération de rapports plus formels et l'export de données brutes pour des analyses approfondies, des audits, ou pour l'intégration avec d'autres systèmes (ex: paie, contrôle de gestion).

La section 1.3 "Exportation et Impression" de `docs MATHILDA/01_Specifications_Fonctionnelles/02_Fonctionnalites_Principales.md` mentionne déjà l'export du planning en PDF/Excel et la génération de rapports personnalisés.

## 2. Objectifs

- **Fournir des synthèses structurées** : Offrir des rapports pré-définis sur des aspects clés de la planification et de l'activité.
- **Permettre des analyses externes** : Exporter les données dans des formats standards pour utilisation dans des tableurs ou des outils de Business Intelligence.
- **Répondre aux besoins d'audit et de justification** : Générer des documents officiels sur les affectations, les heures, les congés.
- **Faciliter la communication papier** : Offrir des versions imprimables claires des plannings et rapports.

## 3. Types de Rapports Standards Envisageables

Le système pourrait proposer une bibliothèque de rapports standards, accessibles via une section "Rapports" :

### 3.1. Rapports sur le Planning et les Affectations
- **Planning individuel détaillé** : Pour un utilisateur et une période donnée, liste de toutes ses affectations, heures, lieux. (Format PDF imprimable).
- **Planning d'équipe/service** : Vue consolidée des affectations pour une équipe ou un service sur une période. (Format PDF/Excel).
- **Rapport des gardes et astreintes** : Liste des gardes et astreintes par utilisateur sur une période, avec totaux. Utile pour le suivi de l'équité et la rémunération.
- **Rapport de couverture des besoins** : Comparaison entre les besoins en personnel définis et les affectations réelles, mettant en évidence les manques ou sureffectifs.

### 3.2. Rapports sur les Absences et Congés
- **État des congés par utilisateur/service** : Solde de jours, jours pris, jours validés, sur une période.
- **Rapport d'absentéisme** : Taux d'absentéisme par service, par type d'absence, sur une période.
- **Liste des demandes de congés** (avec leur statut) pour une période.

### 3.3. Rapports sur les Compteurs et l'Activité
- **Rapport des compteurs horaires individuels/collectifs** (pour les MARs par exemple) : Heures théoriques, heures réalisées, solde.
- **Synthèse d'activité du bloc opératoire** : Nombre de vacations d'anesthésie par salle/secteur, taux d'occupation planifié (voir aussi `04_Bloc_Operatoire/05_Statistiques_Utilisation_Bloc.md` pour des statistiques plus poussées).

### 3.4. Rapports d'Administration et d'Audit
- **Journal des modifications de planning** (avancé) : Qui a modifié quoi, quand (si cette traçabilité est fine).
- **Liste des utilisateurs et de leurs droits**.
- **Rapport d'utilisation des règles de planification** : Quelles règles ont été les plus souvent appliquées ou violées (si pertinent).

## 4. Fonctionnalités d'Exportation de Données

- **Export au format CSV/Excel** :
    - Pour la plupart des listes de données (utilisateurs, affectations, demandes de congés, etc.).
    - Permettre à l'utilisateur de choisir les champs à exporter (avancé) ou proposer des exports types.
- **Export au format PDF** :
    - Principalement pour les rapports formatés et les plannings destinés à l'impression ou à l'archivage officiel.
    - Soigner la mise en page pour la lisibilité.
- **API d'export (avancé)** : Pour des besoins d'intégration automatisée avec d'autres systèmes, une API sécurisée pourrait permettre d'extraire des données spécifiques.

## 5. Options de Personnalisation et de Génération

- **Sélection de la période** : La plupart des rapports et exports seraient paramétrables par plage de dates.
- **Filtres spécifiques au rapport** : Ex: filtrer par service, par rôle, par type d'affectation, par statut de demande.
- **Génération en arrière-plan** : Pour les rapports volumineux ou les exports de grandes quantités de données, la génération pourrait se faire en tâche de fond, avec une notification à l'utilisateur lorsque le fichier est prêt à être téléchargé.
- **Sauvegarde des paramètres de rapport** (optionnel) : Si un utilisateur génère fréquemment le même rapport avec les mêmes filtres, il pourrait sauvegarder ces paramètres.

## 6. Interface Utilisateur

- **Section "Rapports" ou "Exports"** clairement identifiée.
- Liste des rapports disponibles, regroupés par catégorie.
- Interface simple pour sélectionner les paramètres et lancer la génération/exportation.
- Accès aux fichiers générés via un centre de téléchargement ou des liens directs.

## 7. Sécurité et Permissions

- L'accès aux différents rapports et fonctionnalités d'export doit être contrôlé par le système de rôles et permissions.
- Certaines données sensibles (ex: détails des compteurs horaires de tous les utilisateurs) ne seraient accessibles qu'aux administrateurs ou responsables habilités.

La capacité à extraire et à formater les données de manière utile est cruciale pour l'exploitation pleine et entière des informations gérées par Mathildanesth. 