# Modèle de Données Mis à Jour

## Entité UTILISATEUR
- **id**: int (PK)
- **nom**: string
- **prenom**: string
- **login**: string
- **email**: string
- **alias**: string
- **phoneNumber**: string
- **mot_de_passe**: string
- **type**: enum (MAR, IADE, Admin)
- **niveau_acces**: enum (Admin complet, Admin partiel, Utilisateur)
- **tempsPartiel**: boolean
- **pourcentageTempsPartiel**: float
- **workPattern**: enum (FULL_TIME, ALTERNATING_WEEKS, ALTERNATING_MONTHS, SPECIFIC_DAYS)
- **workOnMonthType**: enum (EVEN, ODD, ALL)
- **joursTravaillesSemainePaire**: json (Array of days)
- **joursTravaillesSemaineImpaire**: json (Array of days)
- **dateEntree**: date
- **dateSortie**: date
- **actif**: boolean
- **mustChangePassword**: boolean
- **droits_conges**: int
- **date_creation**: date
- Relations:
  - UTILISATEUR --o{ AFFECTATION : a
  - UTILISATEUR --o{ CONGE : demande

## Entité CHIRURGIEN
- **id**: int (PK)
- **nom**: string
- **prenom**: string
- **email**: string
- **phoneNumber**: string
- **status**: enum (ACTIF, INACTIF)
- **googleSheetName**: string
- **userId**: int (FK, Optionnel)
- Relations:
  - CHIRURGIEN --o{ AFFECTATION : intervient_dans

## Entité SPECIALITE
- **id**: int (PK)
- **name**: string
- **isPediatric**: boolean
- Relations:
  - SPECIALITE --o{ CHIRURGIEN : pratique

## Entité SALLE
- **id**: int (PK)
- **nom**: string
- **numero**: int
- **type**: enum (Chirurgie, Ophtalmo, Endoscopie, Césarienne)
- **secteur**: string (Hyperaseptique, 5-8, 9-12B, etc.)
- **code_couleur**: string
- **regles_supervision**: json (Règles spécifiques au secteur)
- Relations:
  - SALLE --o{ AFFECTATION : lieu_de

## Entité AFFECTATION
- **id**: int (PK)
- **utilisateur_id**: int (FK)
- **salle_id**: int (FK, Si bloc)
- **chirurgien_id**: int (FK, Si applicable)
- **date**: date
- **demi_journee**: enum (Matin, Après-midi)
- **type**: enum (Garde, Astreinte, Consultation, Bloc-anesthésie, Bloc-supervision)
- **specialite**: string (Spécialité pratiquée)
- **statut**: enum (Généré auto, Validé, Modifié manuellement)
- **situation_exceptionnelle**: boolean
- **commentaire**: string
- **createdAt**: datetime
- **updatedAt**: datetime

## Entité CONGE
- **id**: int (PK)
- **utilisateur_id**: int (FK)
- **date_debut**: date
- **date_fin**: date
- **type**: enum (CA, Maladie, Formation, Récupération)
- **statut**: enum (Demandé, Approuvé, Refusé)
- **commentaire**: string
- **decompte**: boolean (Oui/Non selon règles)
- **justificatif**: string (Chemin du fichier si applicable)

## Entité COMPTEUR
- **id**: int (PK)
- **utilisateur_id**: int (FK)
- **annee**: int
- **conges_pris**: int
- **conges_restants**: int
- **heures_supplementaires**: int
- **stats_specialites**: json (Nombre d'affectations par spécialité)
- **stats_gardes**: json (Statistiques gardes/astreintes/consultations)
- Relations:
  - COMPTEUR --|| UTILISATEUR : appartient_a

## Entité TRAME
- **id**: int (PK)
- **nom**: string
- **type**: enum (Bloc, Consultation, Garde)
- **configuration**: enum (Semaine paire/impaire)
- **date_debut_validite**: date
- **date_fin_validite**: date
- **details**: json (Configuration complète structurée)
- Relations:
  - TRAME --o{ AFFECTATION : genere

## Entité NOTIFICATION
- **id**: int (PK)
- **utilisateur_id**: int (FK)
- **date_creation**: date
- **type**: enum (Validation congé, Refus congé, Nouveau planning, Demande changement)
- **message**: string
- **lue**: boolean
- **priority**: int
- **action_requise**: string
- Relations:
  - NOTIFICATION --o{ UTILISATEUR : destinee_a

## Entité PLANNING_RULE (Nouveau)
- **id**: int (PK)
- **category**: string (GARDE, CONSULTATION, BLOC, SUPERVISION)
- **name**: string
- **description**: string
- **isActive**: boolean
- **priority**: int
- **conditionJSON**: json
- **parameterJSON**: json
- **createdAt**: datetime
- **updatedAt**: datetime

## Entité OPERATING_ROOM_CONFIG (Nouveau)
- **id**: int (PK)
- **name**: string
- **number**: string
- **sector**: string
- **colorCode**: string
- **isActive**: boolean
- **supervisionRules**: json
- **createdAt**: datetime
- **updatedAt**: datetime