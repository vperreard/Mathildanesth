# Maquettes Gestion Congés et Échanges

Ce document présente les maquettes détaillées de l'interface de gestion des congés et des échanges d'affectations.

## 1. Vue Gestion des Congés (Utilisateur Standard)

```
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  MATHILDA                [Utilisateur: Dr Martin]        [Notifications (3)]        [Menu ▼]   [Déconnexion] |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  [Tableau de bord]  [Planning]  [Mes Congés]  [Mes Échanges]  [Mes Compteurs]                               |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  MES CONGÉS                                           [+ Nouvelle Demande]                                   |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|  SOLDES ET COMPTEURS                                                                                         |
|                                                                                                              |
|  Congés annuels: 20 jours restants (sur 25)                                                                 |
|  RTT: 12 jours restants (sur 15)                                                                            |
|  Formation: 5 jours restants (sur 5)                                                                         |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  Filtres: [Tous les types ▼]  [Tous les statuts ▼]  [Cette année ▼]  [Recherche...]                         |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  DEMANDES EN COURS                                                                                          |
|                                                                                                              |
|  +----------+--------------+----------------+---------------+------------------+---------------------------+ |
|  | Période  | Type         | Durée          | Statut        | Date demande     | Actions                   | |
|  +----------+--------------+----------------+---------------+------------------+---------------------------+ |
|  | 14-18/08 | Congé annuel | 5 jours        | En attente    | 05/06/2023       | [Voir] [Modifier] [❌]    | |
|  | 2023     |              |                |               |                  |                           | |
|  +----------+--------------+----------------+---------------+------------------+---------------------------+ |
|  | 24/07    | Formation    | 1 jour         | En attente    | 01/06/2023       | [Voir] [Modifier] [❌]    | |
|  | 2023     |              |                |               |                  |                           | |
|  +----------+--------------+----------------+---------------+------------------+---------------------------+ |
|                                                                                                              |
|  HISTORIQUE DES DEMANDES                                                                                    |
|                                                                                                              |
|  +----------+--------------+----------------+---------------+------------------+---------------------------+ |
|  | Période  | Type         | Durée          | Statut        | Date réponse     | Actions                   | |
|  +----------+--------------+----------------+---------------+------------------+---------------------------+ |
|  | 01-05/05 | RTT          | 5 jours        | Acceptée      | 15/04/2023       | [Voir]                    | |
|  | 2023     |              |                |               |                  |                           | |
|  +----------+--------------+----------------+---------------+------------------+---------------------------+ |
|  | 10-14/04 | Congé annuel | 5 jours        | Refusée       | 01/04/2023       | [Voir] [Recréer]          | |
|  | 2023     |              |                | (Voir motif)  |                  |                           | |
|  +----------+--------------+----------------+---------------+------------------+---------------------------+ |
|  | 17/03    | Formation    | 1 jour         | Acceptée      | 01/03/2023       | [Voir]                    | |
|  | 2023     |              |                |               |                  |                           | |
|  +----------+--------------+----------------+---------------+------------------+---------------------------+ |
|                                                                                                              |
|  [< Précédent]                                                              [Suivant >]                      |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
```

## 2. Formulaire de Demande de Congé (Modal)

```
+--------------------------------------------------+
| Nouvelle Demande de Congé                   [X]  |
+--------------------------------------------------+
|                                                  |
| Type de congé*:                                 |
| [Congé annuel ▼]                               |
|                                                  |
| Dates*:                                         |
| Du: [14/08/2023]     Au: [18/08/2023]          |
|                                                  |
| Durée calculée: 5 jours                         |
|                                                  |
| Commentaire:                                     |
| [                                              ] |
| [                                              ] |
|                                                  |
| Solde disponible: 20 jours                      |
| Solde restant après cette demande: 15 jours     |
|                                                  |
| Impact planning: [Vérifier]                     |
|                                                  |
+--------------------------------------------------+
|  [Annuler]                        [Soumettre]    |
+--------------------------------------------------+
```

## 3. Vue de Vérification d'Impact (Modal)

```
+--------------------------------------------------+
| Impact sur le Planning                      [X]  |
+--------------------------------------------------+
|                                                  |
| Période: 14/08/2023 - 18/08/2023                |
|                                                  |
| Conflits/Alertes:                               |
|                                                  |
| ⚠️ 14/08: Vous êtes programmé en Salle 2         |
| ⚠️ 15/08: Vous êtes programmé en Salle 3         |
| ✅ 16/08: Aucun conflit                          |
| ✅ 17/08: Aucun conflit                          |
| ✅ 18/08: Aucun conflit                          |
|                                                  |
| Impact sur l'équipe:                            |
| - Dr Dubois sera seul sur le secteur le 14/08   |
| - Période de forte activité chirurgicale         |
|                                                  |
| Souhaitez-vous soumettre la demande malgré      |
| les conflits identifiés?                        |
|                                                  |
+--------------------------------------------------+
|  [Modifier les dates]         [Soumettre quand même] |
+--------------------------------------------------+
```

## 4. Vue Détaillée d'une Demande (Modal)

```
+--------------------------------------------------+
| Détails de la Demande                       [X]  |
+--------------------------------------------------+
|                                                  |
| Type: Congé annuel                              |
| Période: 14/08/2023 - 18/08/2023                |
| Durée: 5 jours                                  |
| Statut: En attente                              |
|                                                  |
| Soumise le: 05/06/2023                          |
| Par: Dr Martin                                  |
|                                                  |
| Commentaire demandeur:                          |
| Vacances d'été en famille                        |
|                                                  |
| Historique:                                      |
| - 05/06/2023: Création de la demande            |
| - 05/06/2023: Envoi notification admin          |
|                                                  |
+--------------------------------------------------+
|  [Fermer]         [Modifier]         [Annuler]   |
+--------------------------------------------------+
```

## 5. Vue Gestion des Congés (Admin)

```
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  MATHILDA                [Utilisateur: Admin]           [Notifications (12)]       [Menu ▼]   [Déconnexion]  |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  [Tableau de bord]  [Planning]  [Gestion Congés]  [Gestion Utilisateurs]  [Configuration]                  |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  GESTION DES CONGÉS                                                                                          |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  Filtres: [Tous les types ▼]  [En attente ▼]  [Ce mois ▼]  [Tous utilisateurs ▼]  [Recherche...]           |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|  DEMANDES EN ATTENTE (12)                                                                           [Export] |
|                                                                                                              |
|  +----------+-------------+--------------+----------------+----------------+---------------------------+     |
|  | Période  | Demandeur   | Type         | Durée          | Date demande   | Actions                   |     |
|  +----------+-------------+--------------+----------------+----------------+---------------------------+     |
|  | 14-18/08 | Dr Martin   | Congé annuel | 5 jours        | 05/06/2023     | [Voir] [✓] [✗] [🕒]       |     |
|  | 2023     |             |              |                |                |                           |     |
|  +----------+-------------+--------------+----------------+----------------+---------------------------+     |
|  | 24/07    | Dr Martin   | Formation    | 1 jour         | 01/06/2023     | [Voir] [✓] [✗] [🕒]       |     |
|  | 2023     |             |              |                |                |                           |     |
|  +----------+-------------+--------------+----------------+----------------+---------------------------+     |
|  | 07-11/08 | Dr Dubois   | RTT          | 5 jours        | 04/06/2023     | [Voir] [✓] [✗] [🕒]       |     |
|  | 2023     |             |              |                |                |                           |     |
|  +----------+-------------+--------------+----------------+----------------+---------------------------+     |
|  | 21-25/08 | Dr Petit    | Congé annuel | 5 jours        | 02/06/2023     | [Voir] [✓] [✗] [🕒]       |     |
|  | 2023     |             |              |                |                |                           |     |
|  +----------+-------------+--------------+----------------+----------------+---------------------------+     |
|                                                                                                              |
|  [Vue Calendrier] [Vue Liste]                                            [< Précédent] [Suivant >]          |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
```

## 6. Vue Calendrier des Congés (Admin)

```
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  MATHILDA                [Utilisateur: Admin]           [Notifications (12)]       [Menu ▼]   [Déconnexion]  |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  GESTION DES CONGÉS - VUE CALENDRIER                                                                        |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  [< Mois Préc.]  AOÛT 2023  [Mois Suiv. >]   Filtres: [Tous les types ▼]  [Tous statuts ▼]                 |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|     Lun     |    Mar     |    Mer     |    Jeu     |    Ven     |    Sam     |    Dim     |                 |
+------------+------------+------------+------------+------------+------------+------------+-----------------+
|            |     1      |     2      |     3      |     4      |     5      |     6      |                 |
|            |            |            |            |            |            |            |                 |
|            |            |            |            |            |            |            |                 |
+------------+------------+------------+------------+------------+------------+------------+ Légende:        |
|     7      |     8      |     9      |    10      |    11      |    12      |    13      |                 |
|  Dr Dubois |  Dr Dubois |  Dr Dubois |  Dr Dubois |  Dr Dubois |            |            | ■ Congé annuel |
|    RTT     |    RTT     |    RTT     |    RTT     |    RTT     |            |            |                 |
|  En attente|  En attente|  En attente|  En attente|  En attente|            |            | ■ RTT          |
+------------+------------+------------+------------+------------+------------+------------+                 |
|    14      |    15      |    16      |    17      |    18      |    19      |    20      | ■ Formation    |
|  Dr Martin |  Dr Martin |  Dr Martin |  Dr Martin |  Dr Martin |            |            |                 |
|  Congé ann.|  Congé ann.|  Congé ann.|  Congé ann.|  Congé ann.|            |            | ⬤ En attente   |
|  En attente|  En attente|  En attente|  En attente|  En attente|            |            |                 |
+------------+------------+------------+------------+------------+------------+------------+ ⬤ Accepté      |
|    21      |    22      |    23      |    24      |    25      |    26      |    27      |                 |
|  Dr Petit  |  Dr Petit  |  Dr Petit  |  Dr Petit  |  Dr Petit  |            |            | ⬤ Refusé       |
|  Congé ann.|  Congé ann.|  Congé ann.|  Congé ann.|  Congé ann.|            |            |                 |
|  En attente|  En attente|  En attente|  En attente|  En attente|            |            |                 |
+------------+------------+------------+------------+------------+------------+------------+-----------------+
|    28      |    29      |    30      |    31      |            |            |            | Conflits:       |
|            |            |            |            |            |            |            |                 |
|            |            |            |            |            |            |            | ! Sous-effectif |
|            |            |            |            |            |            |            |                 |
+------------+------------+------------+------------+------------+------------+------------+ ! Chevauchement |
```

## 7. Vue Traitement d'une Demande (Admin) (Modal)

```
+--------------------------------------------------+
| Traitement de Demande                       [X]  |
+--------------------------------------------------+
|                                                  |
| Demandeur: Dr Martin                            |
| Type: Congé annuel                              |
| Période: 14/08/2023 - 18/08/2023                |
| Durée: 5 jours                                  |
| Commentaire: Vacances d'été en famille           |
|                                                  |
| Analyse d'impact:                               |
|                                                  |
| ⚠️ Conflit planning: Dr Martin est affecté       |
|    - 14/08: Salle 2 (08:30-16:30)               |
|    - 15/08: Salle 3 (08:30-16:30)               |
|                                                  |
| ⚠️ Personnel disponible:                         |
|    - 14/08: 3 MARs sur 5 (60%)                  |
|    - 15/08: 2 MARs sur 5 (40%) ⚠️ Critique      |
|                                                  |
| ℹ️ Autres congés sur cette période:             |
|    - Dr Dubois: 07-11/08 (RTT, en attente)      |
|    - Dr Petit: 21-25/08 (Congé, en attente)     |
|                                                  |
| Décision:                                        |
| ◯ Accepter                                      |
| ◯ Refuser                                       |
| ◯ Reporter/Proposer alternative                 |
|                                                  |
| Motif/Commentaire:                              |
| [                                              ] |
| [                                              ] |
|                                                  |
+--------------------------------------------------+
|    [Voir Planning]    [Annuler]    [Valider]     |
+--------------------------------------------------+
```

## 8. Vue Mes Échanges (Utilisateur Standard)

```
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  MATHILDA                [Utilisateur: Dr Martin]        [Notifications (3)]        [Menu ▼]   [Déconnexion] |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  [Tableau de bord]  [Planning]  [Mes Congés]  [Mes Échanges]  [Mes Compteurs]                               |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  MES ÉCHANGES                                       [+ Proposer un Échange]                                  |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  Filtres: [Tous ▼]  [En attente ▼]  [Ce mois ▼]  [Recherche...]                                            |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  PROPOSITIONS ENVOYÉES                                                                                      |
|                                                                                                              |
|  +----------+----------------+------------+---------------+------------------+---------------------------+   |
|  | Date     | Affectation    | Destinataire | Statut        | Dernière action  | Actions                   |   |
|  +----------+----------------+------------+---------------+------------------+---------------------------+   |
|  | 15/06/23 | Garde 21/06    | Dr Dubois   | En attente    | 15/06/2023       | [Voir] [Annuler]          |   |
|  |          | (16:30-08:30)  |            | (de réponse)  | (envoi)          |                           |   |
|  +----------+----------------+------------+---------------+------------------+---------------------------+   |
|  | 10/06/23 | Salle 2 14/06  | Dr Petit    | Refusée       | 11/06/2023       | [Voir]                    |   |
|  |          | (08:30-16:30)  |            |               | (refus)          |                           |   |
|  +----------+----------------+------------+---------------+------------------+---------------------------+   |
|                                                                                                              |
|  PROPOSITIONS REÇUES                                                                                        |
|                                                                                                              |
|  +----------+----------------+------------+---------------+------------------+---------------------------+   |
|  | Date     | Affectation    | Expéditeur  | Statut        | Dernière action  | Actions                   |   |
|  +----------+----------------+------------+---------------+------------------+---------------------------+   |
|  | 16/06/23 | Salle 3 20/06  | Dr Petit    | En attente    | 16/06/2023       | [Voir] [Accepter] [Refuser] |
|  |          | (08:30-16:30)  |            | (de réponse)  | (réception)      |                           |   |
|  +----------+----------------+------------+---------------+------------------+---------------------------+   |
|  | 12/06/23 | Salle 1 17/06  | Dr Dupont   | Acceptée      | 13/06/2023       | [Voir]                    |   |
|  |          | (08:30-16:30)  |            | (par admin)   | (acceptation admin) |                        |   |
|  +----------+----------------+------------+---------------+------------------+---------------------------+   |
|                                                                                                              |
|  [< Précédent]                                                              [Suivant >]                      |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
```

## 9. Formulaire de Proposition d'Échange (Modal)

```
+--------------------------------------------------+
| Proposer un Échange                         [X]  |
+--------------------------------------------------+
|                                                  |
| Votre affectation à échanger*:                  |
| [Sélectionner... ▼]                             |
|                                                  |
| ✓ Garde 21/06/2023 (16:30-08:30)                |
|                                                  |
| Destinataire*:                                  |
| [Dr Dubois ▼]                                   |
|                                                  |
| Suggérer une affectation en échange (optionnel): |
| [Sélectionner... ▼]                             |
|                                                  |
| Commentaire:                                     |
| [                                              ] |
| [                                              ] |
|                                                  |
| Note: La proposition sera soumise à validation   |
| par un administrateur après acceptation.         |
|                                                  |
+--------------------------------------------------+
|  [Annuler]                        [Proposer]     |
+--------------------------------------------------+
```

## 10. Détails d'un Échange (Modal)

```
+--------------------------------------------------+
| Détails de l'Échange                        [X]  |
+--------------------------------------------------+
|                                                  |
| Type: Proposition d'échange envoyée             |
| Date proposition: 15/06/2023                    |
|                                                  |
| Affectation proposée:                           |
| - Garde du 21/06/2023 (16:30-08:30)             |
| - Actuellement assignée à: Dr Martin            |
|                                                  |
| Destinataire: Dr Dubois                         |
|                                                  |
| Affectation suggérée en échange: Aucune         |
|                                                  |
| Commentaire:                                     |
| "Je dois assister à un événement familial ce     |
| soir-là. Merci de considérer cet échange."       |
|                                                  |
| Statut: En attente de réponse                   |
|                                                  |
| Historique:                                      |
| - 15/06/2023: Création de la proposition        |
| - 15/06/2023: Notification envoyée à Dr Dubois  |
|                                                  |
+--------------------------------------------------+
|  [Fermer]                         [Annuler]      |
+--------------------------------------------------+
```

## 11. Gestion des Échanges (Admin)

```
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  MATHILDA                [Utilisateur: Admin]           [Notifications (12)]       [Menu ▼]   [Déconnexion]  |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  [Tableau de bord]  [Planning]  [Gestion Congés]  [Gestion Échanges]  [Configuration]                      |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  GESTION DES ÉCHANGES                                                                                        |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|                                                                                                              |
|  Filtres: [À valider ▼]  [Ce mois ▼]  [Tous utilisateurs ▼]  [Recherche...]                                |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
|  ÉCHANGES À VALIDER (3)                                                                             [Export] |
|                                                                                                              |
|  +----------+----------------+-------------+-------------+------------------+---------------------------+    |
|  | Date     | Affectation    | De          | Vers        | Statut           | Actions                   |    |
|  +----------+----------------+-------------+-------------+------------------+---------------------------+    |
|  | 15/06/23 | Garde 21/06    | Dr Martin   | Dr Dubois   | Accepté par les  | [Voir] [✓] [✗]           |    |
|  |          | (16:30-08:30)  |             |             | deux parties     |                           |    |
|  +----------+----------------+-------------+-------------+------------------+---------------------------+    |
|  | 14/06/23 | Salle 3 22/06  | Dr Petit    | Dr Dupont   | Accepté par les  | [Voir] [✓] [✗]           |    |
|  |          | (08:30-16:30)  |             |             | deux parties     |                           |    |
|  +----------+----------------+-------------+-------------+------------------+---------------------------+    |
|  | 13/06/23 | Garde 25/06    | Dr Dubois   | Dr Leroy    | Accepté par les  | [Voir] [✓] [✗]           |    |
|  |          | (16:30-08:30)  |             |             | deux parties     |                           |    |
|  +----------+----------------+-------------+-------------+------------------+---------------------------+    |
|                                                                                                              |
|  HISTORIQUE DES ÉCHANGES                                                                                    |
|                                                                                                              |
|  +----------+----------------+-------------+-------------+------------------+---------------------------+    |
|  | Date     | Affectation    | De          | Vers        | Statut           | Actions                   |    |
|  +----------+----------------+-------------+-------------+------------------+---------------------------+    |
|  | 12/06/23 | Salle 1 17/06  | Dr Dupont   | Dr Martin   | Validé           | [Voir]                    |    |
|  |          | (08:30-16:30)  |             |             |                  |                           |    |
|  +----------+----------------+-------------+-------------+------------------+---------------------------+    |
|  | 10/06/23 | Salle 2 14/06  | Dr Martin   | Dr Petit    | Refusé par       | [Voir]                    |    |
|  |          | (08:30-16:30)  |             |             | destinataire     |                           |    |
|  +----------+----------------+-------------+-------------+------------------+---------------------------+    |
|                                                                                                              |
|  [< Précédent]                                                             [Suivant >]                       |
|                                                                                                              |
+--------------------------------------------------------------------------------------------------------------+
```

## 12. Validation d'un Échange (Admin) (Modal)

```
+--------------------------------------------------+
| Validation d'Échange                        [X]  |
+--------------------------------------------------+
|                                                  |
| Date proposition: 15/06/2023                    |
|                                                  |
| Affectation initiale:                           |
| - Garde du 21/06/2023 (16:30-08:30)             |
| - Actuellement assignée à: Dr Martin            |
|                                                  |
| Nouvelle assignation:                           |
| - Dr Dubois                                     |
|                                                  |
| Statut: Accepté par les deux parties            |
|                                                  |
| Analyse d'impact:                               |
|                                                  |
| ✅ Dr Dubois est disponible le 21/06             |
| ✅ Dr Dubois a les compétences requises          |
| ⚠️ Dr Dubois sera de garde 2 fois cette semaine  |
| ✅ Dr Martin n'a pas d'autre affectation         |
|    en conflit suite à cet échange               |
|                                                  |
| Historique:                                      |
| - 15/06/2023: Proposition par Dr Martin         |
| - 16/06/2023: Acceptation par Dr Dubois         |
| - 16/06/2023: En attente validation admin       |
|                                                  |
| Décision:                                        |
| ◯ Valider l'échange                             |
| ◯ Refuser l'échange                             |
|                                                  |
| Commentaire:                                     |
| [                                              ] |
|                                                  |
+--------------------------------------------------+
|    [Voir Planning]    [Annuler]    [Confirmer]   |
+--------------------------------------------------+
```

## 13. Design Responsive

Les interfaces s'adapteront aux différents types d'appareils:

### 13.1 Version Mobile (Smartphones)

- Les tableaux se transformeront en cartes empilées
- Les filtres seront accessibles via un bouton "Filtres" ouvrant un panneau dédié
- Les actions seront accessibles via un menu contextuel (3 points)
- Navigation simplifiée avec menu hamburger

### 13.2 Version Tablette

- Affichage en colonnes adaptées à la largeur de l'écran
- Possibilité de faire défiler horizontalement les tableaux larges
- Maintien de la plupart des fonctionnalités de la version desktop 