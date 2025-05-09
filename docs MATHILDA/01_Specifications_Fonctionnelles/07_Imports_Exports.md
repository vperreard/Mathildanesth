# 7. Imports et Exports

Pour faciliter l'intégration avec d'autres systèmes et permettre aux utilisateurs de manipuler les données, MATHILDA proposera des fonctionnalités d'import et d'export.

## 7.1 Exports

Les fonctionnalités d'export suivantes sont prévues :

*   **Export du Planning :**
    *   **Formats :** PDF, CSV, iCal (.ics).
    *   **Contenu (configurable) :**
        *   Période (semaine, mois, personnalisé).
        *   Utilisateurs (tous, par rôle, sélection).
        *   Niveau de détail (vue globale, détail par salle/personne).
        *   Possibilité d'inclure/exclure les congés, les notes.
    *   **Accès :** Accessible à tous les utilisateurs connectés pour leur propre planning ou le planning global (selon droits), administrateurs pour exports complets.
*   **Export des Compteurs Utilisateurs :**
    *   **Format :** CSV.
    *   **Contenu :** Compteurs d'équité (gardes, WE, fériés, etc.), compteurs horaires, soldes de congés, sur une période donnée.
    *   **Accès :** Administrateurs, et chaque utilisateur pour ses propres compteurs.
*   **Export des Utilisateurs :**
    *   **Format :** CSV.
    *   **Contenu :** Liste des utilisateurs avec leurs informations principales (nom, prénom, email, rôle, temps travail).
    *   **Accès :** Administrateurs.

## 7.2 Imports

Les fonctionnalités d'import suivantes sont envisagées (à prioriser) :

*   **Import de la Trame Chirurgien :**
    *   **Format :** CSV (séparateur virgule `,`, encodage UTF-8, avec ligne d'en-tête).
    *   **Contenu :** Occupation prévisionnelle des salles par les chirurgiens (Chirurgien ID/Nom, Salle ID/Nom, Date, Créneau Matin/Après-midi, Spécialité optionnelle).
    *   **Fonctionnement :** Permettre de mettre à jour la trame existante ou d'ajouter de nouvelles entrées. Gestion des erreurs (format invalide, chirurgien/salle inconnu).
    *   **Accès :** Administrateurs, Secrétaire.
*   **Import des Absences/Congés :**
    *   **Format :** CSV.
    *   **Contenu :** Liste des absences ou congés pré-validés (Utilisateur ID/Nom, Date début, Date fin, Type absence/congé, Motif optionnel).
    *   **Fonctionnement :** Utile pour intégrer des données d'un système RH externe. Création des enregistrements dans la table `leaves` ou une table dédiée aux absences importées.
    *   **Accès :** Administrateurs.
*   **Import Initial des Utilisateurs :**
    *   **Format :** CSV.
    *   **Contenu :** Pour faciliter la mise en place initiale.
    *   **Accès :** Super Administrateur.

## 7.3 Considérations Techniques

*   Les imports/exports devront être gérés côté backend via des endpoints API dédiés.
*   Pour les imports, une validation robuste des données est essentielle, avec un retour clair à l'utilisateur sur les succès et les erreurs (ex: rapport d'import).
*   Les opérations d'import/export volumineuses devront être traitées de manière asynchrone (tâches en arrière-plan) pour ne pas bloquer l'interface utilisateur. 