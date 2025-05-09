# Vue Planning

Cette vue est l'écran principal de l'application pour la plupart des utilisateurs. Elle affiche le planning des affectations du personnel d'anesthésie sous forme de calendrier interactif.

## 1. Objectif

- Visualiser les affectations (gardes, astreintes, blocs, consultations, OFF) par jour, semaine ou mois.
- Permettre le filtrage et la navigation dans le temps.
- Afficher les informations clés de chaque affectation.
- Permettre des actions contextuelles (voir détails, demander échange - selon permissions).
- Mettre en évidence les conflits ou informations importantes.

## 2. Éléments Principaux

1.  **Barre de Navigation/Filtres (Haut) :**
    *   **Sélecteur de Période :** Boutons "Jour", "Semaine", "Mois".
    *   **Navigation Temporelle :** Flèches "Précédent" / "Suivant", bouton "Aujourd'hui".
    *   **Affichage Période Actuelle :** Indique la date ou la semaine/mois affiché.
    *   **Filtres :**
        *   Menu déroulant "Secteur" (Tous, Hyperaseptique, Ophtalmo, etc.).
        *   Menu déroulant "Rôle" (Tous, MAR, IADE).
        *   Champ de recherche/sélection "Personnel" (permet de voir le planning d'une ou plusieurs personnes spécifiques).
        *   (Admin) Case à cocher "Afficher les conflits".
        *   (Admin) Bouton "Générer Planning" / "Publier Planning".

2.  **Zone Calendrier (Centre) :**
    *   Utilisation de la bibliothèque **FullCalendar**.
    *   **Affichage Jour :** Colonnes pour chaque salle/lieu pertinent, lignes pour les heures.
    *   **Affichage Semaine/Mois :** Grille classique jour/heure ou vue liste.
    *   **Événements :** Chaque affectation est un événement dans le calendrier.

3.  **Légende (Optionnel - Côté ou Bas) :**
    *   Rappel des codes couleurs par type d'affectation (Garde, Astreinte, Bloc, Consult, OFF).
    *   Indicateurs visuels (ex: icône pour IADE volant, bordure rouge pour conflit).

## 3. Données Affichées par Affectation

Chaque bloc d'affectation dans le calendrier doit afficher au minimum :

- **Nom de l'utilisateur** (Prénom Nom)
- **Type d'affectation** (ex: "Bloc", "Garde") - potentiellement via la couleur.
- **Salle/Lieu** (si applicable, ex: "Salle 3", "Consult 1").
- **Heures** (si la vue ne les montre pas déjà clairement).
- **(Optionnel) Chirurgien prévu** dans la salle (information de la trame externe).
- **(Optionnel) Indicateur de supervision** (ex: icône si MAR supervise un IADE).

## 4. Interactions Clés

- **Changer de Vue :** Clic sur les boutons Jour/Semaine/Mois.
- **Naviguer :** Clic sur les flèches ou "Aujourd'hui".
- **Filtrer :** Sélection dans les menus déroulants ou recherche de personnel.
    - Le calendrier se met à jour dynamiquement.
- **Survoler une Affectation :** Affichage d'une infobulle (tooltip) avec plus de détails (horaires précis, commentaire, superviseur éventuel).
- **Cliquer sur une Affectation :**
    - Ouverture d'une modale/panneau latéral affichant **tous les détails** de l'affectation (`Affectations`).
    - Affichage des boutons d'action possibles selon le contexte et les permissions :
        - "Voir profil utilisateur"
        - "Demander un échange" (si c'est sa propre affectation et permission ok)
        - (Admin) "Modifier l'affectation"
        - (Admin) "Supprimer l'affectation"
- **(Admin) Glisser-Déposer (Drag & Drop) :** Permettre de déplacer une affectation pour modifier l'heure ou le jour (avec confirmation et alerte si conflit).
- **(Admin) Cliquer sur un créneau vide :** Possibilité de créer une nouvelle affectation.

## 5. Mise en Évidence

- **Couleurs :** Utiliser les couleurs définies dans `TypesAffectation.defaultColor`.
- **Conflits :** Bordure rouge ou fond différent pour les affectations en conflit (ex: règle violée, manque de personnel).
- **Affectations personnelles :** Légère mise en évidence des affectations de l'utilisateur connecté.
- **IADE Volant/Fermeture :** Indicateur visuel distinct (icône, motif).

## 6. Sources de Données (API Endpoints)

- `GET /api/v1/assignments?dateRangeStart=...&dateRangeEnd=...&sectorId=...&role=...&userId=...` : Pour récupérer les affectations de la période visible selon les filtres.
- `GET /api/v1/users/me` : Pour connaître l'utilisateur connecté et ses permissions.
- `GET /api/v1/users` : Pour la liste du personnel dans le filtre.
- `GET /api/v1/config/sectors` : Pour la liste des secteurs dans le filtre.
- `GET /api/v1/types_affectation` : Pour la légende des couleurs.
- `GET /api/v1/trame_chirurgien?dateRangeStart=...&dateRangeEnd=...` : Pour afficher les chirurgiens prévus.
- (Admin) `POST /api/v1/schedules/generate`
- (Admin) `POST /api/v1/schedules/:date/publish`
- `POST /api/v1/assignments/:id/exchange`
- (Admin) `PUT /api/v1/assignments/:id`
- (Admin) `DELETE /api/v1/assignments/:id`

## 7. Maquette Simplifiée (Wireframe)

### 1.3 Affichage Principal

*   **Grille Temporelle :** Affiche les jours de la période sélectionnée en colonnes et les ressources (salles, secteurs, ou utilisateurs) en lignes.
*   **Ressources (Lignes) :**
    *   Possibilité de grouper par Secteur puis par Salle, ou par Rôle puis par Utilisateur.
    *   **Important : L'ordre d'affichage des Secteurs et des Salles doit respecter l'ordre défini par l'administrateur dans la configuration (`displayOrder`).**
*   **Affectations :** Représentées par des blocs de couleur dans la grille.
    *   La couleur correspond au type d'affectation (configurable).

```
+------------------------------------------------------------------------+
| [Jour|Sem|Mois]  < jj/mm/aaaa >  [Auj.] | Filtres: [Secteur v] [Rôle v] [Personnel v] | [Générer/Publier] |
+------------------------------------------------------------------------+
|                                                                        |
|                      +-------------------------+                       |
|                      |      CALENDRIER         |                       |
|                      |     (FullCalendar)      |                       |
|                      |                         |                       |
|                      | [Affectation 1 (UserA)] |                       |
|                      | [Couleur Type A]        |                       |
|                      | [Salle 1 / 8h-13h]      |                       |
|                      |                         |                       |
|                      | [Affectation 2 (UserB)] |                       |
|                      | [Couleur Type B]        |                       |
|                      | [Garde / 24h]           |                       |
|                      +-------------------------+                       |
|                                                                        |
+------------------------------------------------------------------------+
| Légende: [Type A = Couleur A] [Type B = Couleur B] ...                 |
+------------------------------------------------------------------------+

Modale Détails Affectation (au clic):
+----------------------------------+
| Détails Affectation              |
+----------------------------------+
| Utilisateur: User A              |
| Date: jj/mm/aaaa                 |
| Type: Bloc Matin                 |
| Salle: Salle 1                   |
| Horaire: 08:00 - 13:00           |
| Chirurgien Prévu: Dr. X         |
| Commentaire: ...                 |
+----------------------------------+
| [Demander Échange] [Modifier(A)] |
+----------------------------------+
``` 