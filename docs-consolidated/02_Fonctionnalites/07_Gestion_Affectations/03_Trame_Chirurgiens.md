# Trame des Chirurgiens et Besoins en Anesthésie

## 1. Introduction

La "trame des chirurgiens" est un planning prévisionnel indiquant quels chirurgiens opèrent, dans quelles salles, et potentiellement pour quels types d'interventions, sur une période donnée. Bien que Mathildanesth soit centré sur la planification du personnel d'anesthésie, comprendre ou intégrer cette trame chirurgicale est crucial pour anticiper les besoins en anesthésistes (MAR et IADE) et optimiser leur affectation au bloc opératoire.

Le projet `MATHILDA` mentionnait une "Trame des Chirurgiens (Format Excel ou importable)" comme une donnée d'entrée importante.

## 2. Objectifs de la Gestion de la Trame Chirurgiens

Dans le contexte de Mathildanesth, la trame chirurgiens sert principalement à :

- **Anticiper la Charge de Travail Anesthésique** : Estimer le nombre de salles actives et les besoins en personnel d'anesthésie en fonction des spécialités chirurgicales et du volume opératoire prévu.
- **Pré-assigner des Spécialités aux Salles** : Si la trame indique qu'un chirurgien d'une spécialité X opère dans la salle Y, cela informe sur le type de compétence anesthésique requise.
- **Faciliter la Création des Trames de Bloc Anesthésie** : La trame des anesthésistes peut être construite en regard de la trame des chirurgiens pour assurer une couverture adéquate.
- **Identifier les Périodes de Forte/Faible Activité Chirurgicale** : Permet d'ajuster les ressources d'anesthésie en conséquence.

## 3. Informations Clés d'une Trame Chirurgiens

Une trame chirurgiens utile pour Mathildanesth contiendrait typiquement :

- **Date**
- **Salle d'Opération**
- **Créneau Horaire** (Matin, Après-midi, Journée complète)
- **Chirurgien Principal** (Nom)
- **Spécialité Chirurgicale Principale** (ex: Orthopédie, Viscéral, Urologie, Gynécologie)
  - L'API `/api/specialties` et le modèle `Specialty` dans `prisma/schema.prisma` de `mathildanesth` permettent de gérer ces spécialités.
  - Le composant `EditActivityModal.tsx` dans les trames de bloc de `mathildanesth` se connecte à cette API.
- **Type d'Intervention Prévu (Optionnel)** : Si disponible, peut affiner l'estimation du besoin en anesthésie (durée, complexité).
- **Besoin en Anesthésiste Spécifique (Rare)** : Si un chirurgien a une préférence ou une exigence pour un anesthésiste particulier (à gérer avec précaution pour l'équité).

## 4. Intégration dans Mathildanesth

Plusieurs niveaux d'intégration sont possibles :

### 4.1. Import Manuel/Semi-Automatique (Approche `MATHILDA`)

- **Format** : Fichier Excel, CSV, ou un format structuré simple.
- **Processus** : Les administrateurs ou planificateurs importent régulièrement la trame des chirurgiens dans Mathildanesth.
- **Utilisation** : Le système parse le fichier et utilise les informations pour :
  - Afficher une vue de la trame chirurgiens (lecture seule).
  - Pré-remplir des besoins dans l'outil de création de trames de bloc pour l'anesthésie.
  - Fournir des indicateurs de charge prévisionnelle.

### 4.2. Affichage Informatif dans le Planning Anesthésie

- Lors de la planification des anesthésistes pour le bloc, afficher en parallèle (si importée) la trame des chirurgiens pour la même période et les mêmes salles.
- Cela aide le planificateur anesthésie à visualiser directement les besoins induits.

### 4.3. Interface de Saisie Manuelle (Alternative ou Complément)

- Si un import n'est pas possible, une interface simple pourrait permettre de saisir manuellement les grandes lignes de la trame chirurgiens (quelle spécialité occupe quelle salle à quel moment).

### 4.4. Pas d'Intégration Directe (Gestion Externe)

- Dans le cas le plus simple, Mathildanesth ne gère pas du tout la trame chirurgiens. Les planificateurs anesthésie la consultent en externe (ex: autre logiciel, document papier/Excel) et en déduisent manuellement les besoins à configurer dans Mathildanesth (via les trames de bloc anesthésie ou les affectations directes).

## 5. Modélisation des Données (Considérations si intégration)

Si une intégration plus poussée était envisagée, il faudrait :

- Un modèle de données pour stocker les affectations des chirurgiens (ex: `SurgicalActivity` avec des liens vers `OperatingRoom`, `Specialty`, `Surgeon` (si le modèle `Surgeon` de `mathildanesth` est utilisé ou étendu pour les chirurgiens externes), date, créneau).
- Le modèle `Surgeon` de `mathildanesth` (`prisma/schema.prisma`) existe déjà et est lié à `User`. Il pourrait être utilisé si les chirurgiens ont des comptes utilisateurs, ou servir de référentiel de chirurgiens même sans compte.
  - Il contient des champs `nom`, `prenom`, `email`, `specialties`.
  - Le champ `googleSheetName` pourrait être un vestige ou une piste pour l'import depuis Google Sheets.
- Des API pour gérer ces données.

Actuellement, `mathildanesth` semble se concentrer sur la gestion des spécialités chirurgicales comme information à associer aux activités du bloc anesthésie, plutôt que sur la gestion complète d'un planning détaillé des chirurgiens.

## 6. Impact sur la Planification Anesthésie

- **Définition des Besoins** : Aide à déterminer combien de MARs et d'IADEs sont nécessaires par salle/secteur.
- **Compétences Requises** : La spécialité chirurgicale influence les compétences anesthésiques souhaitées ou requises.
- **Création des Trames de Bloc Anesthésie** : La trame des chirurgiens sert de base pour construire la trame des affectations du personnel d'anesthésie.

---

Bien que la gestion détaillée du planning des chirurgiens soit hors du périmètre direct de Mathildanesth, la prise en compte de la trame chirurgiens (au minimum par import ou comme référence externe) est essentielle pour une planification efficace et réactive des ressources d'anesthésie.
