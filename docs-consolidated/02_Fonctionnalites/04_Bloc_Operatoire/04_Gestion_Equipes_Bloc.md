# Gestion des Équipes d'Anesthésie au Bloc Opératoire

## 1. Vue d'ensemble

Une fois que l'occupation des salles par les chirurgiens est connue (via la trame chirurgicale), Mathildanesth intervient pour planifier le personnel d'anesthésie nécessaire pour couvrir cette activité. Cela inclut l'affectation des Médecins Anesthésistes-Réanimateurs (MAR) et des Infirmiers Anesthésistes Diplômés d'État (IADE) aux différentes salles et créneaux horaires, en respectant les règles de supervision et les compétences.

## 2. Personnel Concerné et Rôles

Au bloc opératoire, Mathildanesth gère principalement l'affectation de :

- **Médecins Anesthésistes-Réanimateurs (MAR)** :
    - Assurent la supervision d'une ou plusieurs salles.
    - Peuvent être affectés à des tâches spécifiques si nécessaire (ex: une salle complexe nécessitant un MAR dédié en plus du superviseur de secteur).
    - Leurs compétences spécifiques (ex: pédiatrie, ALR, supervision ophtalmo/endo) sont gérées via les champs `canSuperviseOphtalmo` et `canSuperviseEndo` sur le modèle `User` et le modèle `UserSkill`.
- **Infirmiers Anesthésistes Diplômés d'État (IADE)** :
    - Sont généralement affectés à une salle d'opération pour la durée d'un ou plusieurs créneaux.
    - Travaillent sous la supervision d'un MAR.
    - Leurs compétences spécifiques peuvent également être gérées via le modèle `UserSkill`.
    - **Important** : Les trames des IADE définissent uniquement leurs périodes de disponibilité/indisponibilité, mais ne créent pas automatiquement d'affectations spécifiques à des salles. Ces trames servent à indiquer quand l'IADE est disponible pour être affecté à une salle ou quand il est indisponible, mais l'affectation effective à une salle spécifique est réalisée par l'algorithme de génération de planning ou manuellement par l'administrateur.

Les chirurgiens et le personnel de bloc opératoire (IBODE, ASND, brancardiers, etc.) ne sont pas planifiés *par* Mathildanesth, bien que la trame des chirurgiens soit une donnée d'entrée essentielle.

## 3. Affectation aux Salles et Créneaux (Vacations Bloc)

- **Créneaux standards et granularité** : La planification de l'occupation des salles par les chirurgiens se base souvent sur des demi-journées (modèle `BlocRoomAssignment` avec un champ `period` de type Enum `Period`: `MATIN`, `APRES_MIDI`, `JOURNEE_ENTIERE`). Cependant, l'affectation du personnel d'anesthésie (MAR, IADE) à ces créneaux ou salles se fait via le modèle `BlocStaffAssignment`. Ce dernier permet une granularité plus fine grâce aux champs `timeFrom` (String, ex: "08:00") et `timeTo` (String, ex: "12:30"), offrant la flexibilité pour des vacations aux horaires précis.
- **Entités de planification du personnel d'anesthésie** :
    - `BlocRoomAssignment` : Représente l'occupation d'une salle d'opération par une activité chirurgicale pour une période donnée (matin, après-midi, journée). Elle indique le besoin de couverture anesthésique.
    - `BlocStaffAssignment` : Détaille l'affectation d'un membre du personnel d'anesthésie.
        - `userId` : Identifiant de l'utilisateur (MAR ou IADE).
        - `role` : Enum `BlocStaffRole` (`MAR` ou `IADE`).
        - `isSupervisor` : Boolean optionnel, pour marquer explicitement un MAR comme superviseur du créneau/salle.
        - `timeFrom`, `timeTo` : Strings (format "HH:mm") pour définir précisément la plage horaire de l'affectation du personnel.
        - Lié à un `BlocRoomAssignment` pour connecter le personnel à l'occupation de la salle.

## 4. Règles de Supervision et d'Affectation

La planification des équipes d'anesthésie au bloc est fortement contrainte par des règles qui doivent être configurables et respectées.

### 4.1. Configuration des Règles
- Via l'interface d'administration (`/admin/bloc-operatoire`, onglet "Règles de supervision" ou intégré au module général des règles de planification).
- Ces règles peuvent inclure :
    - **Nombre maximum de salles supervisées par un MAR** : Ex: 2 salles en général, exceptionnellement 3 (configurable). Ces règles peuvent être stockées dans le champ `rules` (Json) du modèle `OperatingSector` ou `supervisionRules` (Json) du modèle `OperatingRoom`.
    - **Règles spécifiques par secteur** :
        - Contraintes de supervision géographiques (ex: un MAR doit superviser des salles dans le même secteur ou des secteurs adjacents).
        - Ratios spécifiques MAR/IADE ou nombre d'IADE par salle pour certains secteurs ou types de chirurgie.
        - Exemples de `documentation/regles-planning-documentation.md` : "Salles 1-4 : supervision dans le même secteur", "Salles 6-7 : peuvent superviser l'ophtalmologie", "Ophtalmologie : maximum 3 salles par personnel", "Endoscopie : 2 salles par personnel". Ces détails sont configurables via les champs JSON des modèles concernés ou via le moteur de règles global.
    - **Compétences requises** : Certaines salles ou types d'interventions (déduits de la spécialité de la trame chirurgien) peuvent nécessiter du personnel avec des compétences spécifiques (ex: pédiatrie, anesthésie loco-régionale avancée). Ceci est vérifié grâce aux champs `canSuperviseOphtalmo`, `canSuperviseEndo` sur `User` et le modèle `UserSkill`.

### 4.2. Application des Règles
- Le moteur de génération de planning (décrit dans `../../03_Planning_Generation/01_Moteur_Regles.md`) prend en compte ces règles lors de l'affectation du personnel d'anesthésie aux salles ouvertes.
- Lors des ajustements manuels du planning du bloc, le système doit alerter en cas de violation de ces règles.

## 5. Processus de Planification des Équipes d'Anesthésie

1.  **Entrées** :
    *   Trame d'occupation chirurgicale (salles ouvertes, spécialités).
    *   Liste du personnel d'anesthésie disponible (MAR, IADE) avec leurs compétences, contrats, congés.
    *   Règles de supervision et d'affectation configurées.
2.  **Génération/Proposition** :
    *   Le système affecte les MAR superviseurs aux secteurs/salles nécessitant une couverture.
    *   Le système affecte les IADE aux salles, en respectant les ratios et les besoins.
    *   L'équité (charge de supervision, types de salles) est prise en compte si possible.
3.  **Visualisation et Ajustement** :
    *   Le planning du bloc (`/bloc-operatoire/`) affiche les affectations MAR/IADE par salle et par créneau.
    *   L'interface d'édition (`/bloc-operatoire/edit/[date]`) permet aux planificateurs d'ajouter/modifier/supprimer des superviseurs ou des IADE pour chaque salle et période, comme décrit dans `docs/modules/bloc-operatoire.md`.
    *   Les périodes de supervision pour chaque personne peuvent être définies.

## 6. Gestion des Statuts du Planning du Bloc

Comme pour le planning général, le planning du bloc (modèle `BlocDayPlanning`) peut avoir différents statuts, gérés par l'enum `BlocPlanningStatus`:
- **`DRAFT`** : En cours de création/modification.
- **`VALIDATION_REQUESTED`** : Soumis pour validation.
- **`VALIDATED`** : Approuvé par le responsable.
- **`MODIFIED_AFTER_VALIDATION`** : Modifié après avoir été validé.
- **`LOCKED`** : Verrouillé contre toute modification ultérieure.
- **`ARCHIVED`** : Archivé.

## 7. Spécificités et Points d'Attention

- **Gestion des pauses et relèves** : Comment sont gérées les pauses repas ou les relèves pour les longues interventions ? Ceci doit être clarifié (soit par des affectations spécifiques `BlocStaffAssignment` avec des horaires décalés, soit par des consignes hors outil).
- **Personnel "volant" ou "ressource"** : Existence et gestion d'un MAR ou IADE non affecté à une salle spécifique mais disponible pour aider en cas de besoin ou pour faciliter les pauses. Peut être représenté par une affectation `BlocStaffAssignment` non liée à une `BlocRoomAssignment` spécifique, ou avec une convention de nommage pour la salle/période.
- **Débuts et fins de vacation décalés** : Toutes les salles ouvrent/ferment-elles en même temps ? Le système permet d'affecter du personnel sur des sous-créneaux d'une demi-journée si besoin. Oui, grâce aux champs `timeFrom` et `timeTo` sur `BlocStaffAssignment`. Le document `docs/modules/bloc-operatoire.md` mentionne "Définissez les périodes de supervision pour chaque superviseur", ce qui est cohérent avec cette granularité.

La gestion des équipes au bloc est un point central qui nécessite une bonne articulation entre la configuration des règles, les données d'entrée (trame chirurgien, disponibilités), et des outils de visualisation/édition clairs. 