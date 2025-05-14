# Guide Utilisateur : Gestion des Compétences

Ce guide explique comment gérer et utiliser la fonctionnalité de compétences des utilisateurs dans Mathildanesth.

## Table des Matières

- [Pour les Administrateurs](#pour-les-administrateurs)
  - [Accéder à la Page de Gestion des Compétences](#accéder-à-la-page-de-gestion-des-compétences)
  - [Créer une Nouvelle Compétence](#créer-une-nouvelle-compétence)
  - [Modifier une Compétence Existante](#modifier-une-compétence-existante)
  - [Supprimer une Compétence](#supprimer-une-compétence)
  - [Assigner/Retirer des Compétences via le Formulaire Utilisateur](#assignerretirer-des-compétences-via-le-formulaire-utilisateur)
- [Pour les Utilisateurs (Anesthésistes)](#pour-les-utilisateurs-anesthésistes)
  - [Consulter Ses Compétences](#consulter-ses-compétences)

---

## Pour les Administrateurs

Les administrateurs (rôles `ADMIN_TOTAL` ou `ADMIN_PARTIEL`) ont les pleins droits pour gérer le référentiel de compétences et les assigner aux utilisateurs.

### Accéder à la Page de Gestion des Compétences

1.  Connectez-vous avec un compte administrateur.
2.  Dans le menu de navigation principal, allez dans la section "Administration" ou "Paramètres" (selon l'organisation de votre menu).
3.  Cliquez sur le lien "Gestion des Compétences" ou "Compétences".
    *Page concernée : `/admin/skills`*

### Créer une Nouvelle Compétence

Sur la page de gestion des compétences :

1.  Cliquez sur le bouton "Nouvelle Compétence".
2.  Une fenêtre modale (dialogue) apparaîtra.
3.  Remplissez les champs suivants :
    *   **Nom de la compétence** (obligatoire) : Un nom clair et concis (ex: "Intubation Difficile", "ALR Échoguidée").
    *   **Description** (optionnel) : Fournissez plus de détails sur ce que la compétence implique.
4.  Cliquez sur "Enregistrer".

La nouvelle compétence sera ajoutée à la liste.

### Modifier une Compétence Existante

Sur la page de gestion des compétences :

1.  Trouvez la compétence que vous souhaitez modifier dans la liste.
2.  Cliquez sur l'icône "Modifier" (souvent un crayon) à côté de la compétence.
3.  Une fenêtre modale apparaîtra avec les informations actuelles de la compétence.
4.  Modifiez le nom et/ou la description selon vos besoins.
5.  Cliquez sur "Enregistrer les modifications".

### Supprimer une Compétence

La suppression d'une compétence la retire du référentiel et la désassigne automatiquement de tous les utilisateurs qui la possédaient.

Sur la page de gestion des compétences :

1.  Trouvez la compétence que vous souhaitez supprimer.
2.  Cliquez sur l'icône "Supprimer" (souvent une corbeille) à côté de la compétence.
3.  Une demande de confirmation apparaîtra.
4.  Confirmez la suppression.

**Attention** : Cette action est irréversible.

### Assigner/Retirer des Compétences via le Formulaire Utilisateur

Lors de la création ou de la modification d'un utilisateur :

1.  Accédez à la page de gestion des utilisateurs (ex: `/utilisateurs`).
2.  Cliquez pour créer un nouvel utilisateur ou modifier un utilisateur existant.
3.  Dans le formulaire utilisateur, une section "Compétences" sera disponible.
4.  Cette section listera toutes les compétences disponibles dans le référentiel.
5.  Cochez les cases à côté des compétences que vous souhaitez assigner à l'utilisateur.
6.  Décochez les cases pour retirer des compétences précédemment assignées.
7.  Enregistrez le formulaire utilisateur.

Les compétences sélectionnées seront (dés)assignées à l'utilisateur.
*Page concernée : `/utilisateurs` (via le `UserForm.tsx`)*

---

## Pour les Utilisateurs (Anesthésistes)

Chaque utilisateur peut consulter les compétences qui lui ont été assignées.

### Consulter Ses Compétences

1.  Connectez-vous à votre compte Mathildanesth.
2.  Accédez à votre page de profil.
    *Page concernée : `/profil`*
3.  Une section "Mes Compétences" affichera la liste des compétences qui vous sont attribuées, avec leur nom et éventuellement leur description.

Si vous pensez qu'une compétence devrait vous être attribuée ou retirée, veuillez contacter un administrateur. 