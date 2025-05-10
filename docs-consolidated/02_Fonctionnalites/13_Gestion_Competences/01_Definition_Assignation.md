# Définition et Assignation des Compétences

## 1. Introduction

La gestion des compétences est cruciale dans un environnement médical pour s'assurer que le personnel affecté aux différentes tâches et postes possède les qualifications et l'expérience requises. Mathildanesth intègre des mécanismes pour définir et prendre en compte les compétences, notamment via le concept de spécialités.

## 2. Objectifs de la Gestion des Compétences

- **Sécurité des Soins** : Garantir que seules les personnes compétentes réalisent certaines tâches ou occupent certains postes.
- **Optimisation de la Planification** : Affecter le personnel en fonction de leurs compétences spécifiques, en particulier pour les activités spécialisées (ex: anesthésie pédiatrique, neurochirurgie).
- **Développement Professionnel** : Potentiellement, suivre l'acquisition de nouvelles compétences par le personnel (hors scope MVP mais une extension possible).
- **Flexibilité** : Permettre une configuration des compétences requises pour différents types d'affectations ou de salles.

## 3. Modèle de Données Principal : `Specialty`

Actuellement, la notion de compétence est principalement gérée à travers le modèle `Specialty` (`prisma/schema.prisma`), particulièrement pertinent pour les rôles médicaux et chirurgicaux.

- **Champs du Modèle `Specialty`** :
  - `id` (Int) : Identifiant unique.
  - `name` (String) : Nom de la spécialité (ex: "Anesthésie Pédiatrique", "Orthopédie", "Cardiologie Interventionnelle").
  - `isPediatric` (Boolean) : Indique si la spécialité concerne la pédiatrie.
- **Relations** :
  - `Assignment[]` : Les affectations peuvent être liées à une spécialité.
  - `Surgeon[]` : Les chirurgiens (et donc les utilisateurs `User` ayant un profil `Surgeon`) peuvent être associés à une ou plusieurs spécialités.

Le module de Trames (`EditActivityModal.tsx`) se connecte à l'API `/api/specialties` pour utiliser les données réelles des spécialités lors de la configuration des activités de bloc opératoire.

## 4. Assignation des Compétences (Spécialités) aux Utilisateurs

- **Profil Chirurgien (`Surgeon`)** : Les utilisateurs ayant un profil `Surgeon` peuvent se voir assigner des spécialités. Cette assignation se fait probablement via une interface d'administration des utilisateurs/chirurgiens.
- **Autres Rôles Professionnels** : Pour les rôles comme MAR ou IADE, la notion de "spécialité" peut aussi s'appliquer pour des sur-spécialisations (ex: IADE en anesthésie pédiatrique). Le système actuel via `Specialty` pourrait être étendu ou un mécanisme de taggage de compétences plus générique pourrait être envisagé pour une granularité plus fine si nécessaire.

## 5. Utilisation des Compétences dans la Planification

- **Adéquation Poste/Profil** : L'[Algorithme de Génération de Planning](../../03_Planning_Generation/02_Algorithme_Generation.md) et le [Moteur de Règles](../../03_Planning_Generation/01_Moteur_Regles.md) doivent pouvoir prendre en compte les compétences/spécialités requises pour un poste ou une salle donnée et les comparer aux compétences de l'utilisateur.
  - Exemple : Si une salle de bloc est réservée pour de la chirurgie pédiatrique, seuls les MAR/IADE ayant la compétence/spécialité "Anesthésie Pédiatrique" devraient y être affectés en priorité.
- **Règles de Compétences** : Des règles spécifiques peuvent être définies :
  - "Au moins un MAR avec spécialité X doit être présent si une intervention de type Y a lieu."
  - "La salle Z nécessite du personnel ayant la compétence W."
- **Trames de Planning** : Lors de la création de [Trames de Bloc Opératoire](../../../modules/templates/components/BlocPlanningTemplateEditor.md), la spécialité chirurgicale prévue pour une salle informe directement des besoins en compétences anesthésiques.

## 6. Interface d'Administration des Compétences/Spécialités

- **Gestion des Spécialités** :
  - Une interface d'administration (potentiellement sous `/admin/specialties/` ou intégrée dans la configuration générale) permet de créer, lire, mettre à jour et supprimer (CRUD) les spécialités.
- **Assignation aux Utilisateurs** :
  - L'interface de gestion des utilisateurs/profils permet d'associer les spécialités aux personnes concernées.

## 7. Évolutions Possibles

- **Modèle `Skill` Générique** : Pour des compétences non directement liées à une "spécialité" médicale (ex: "Formation aux nouveaux équipements", "Référent douleur"), un modèle `Skill` plus général pourrait être introduit, avec une table de liaison `UserSkill`.
- **Niveaux de Compétence** : Introduction de niveaux (ex: Débutant, Confirmé, Expert) pour chaque compétence.
- **Date d'Acquisition/Expiration** : Suivi de la validité des compétences.
- **Auto-Déclaration et Validation** : Processus où les utilisateurs peuvent déclarer des compétences, soumises à validation.

## 8. Impact sur les Modules

- **Utilisateurs et Profils** : Stockage des compétences assignées.
- **Planning (Génération et Manuel)** : Prise en compte des compétences pour les affectations.
- **Moteur de Règles** : Définition et application de règles basées sur les compétences.
- **Bloc Opératoire** : Association forte entre spécialités chirurgicales, salles, et compétences du personnel d'anesthésie.

---

Une gestion claire des compétences, en commençant par les spécialités, est un atout pour la qualité et la sécurité de la planification des soins dans Mathildanesth. L'infrastructure actuelle avec `Specialty` fournit une bonne base.
