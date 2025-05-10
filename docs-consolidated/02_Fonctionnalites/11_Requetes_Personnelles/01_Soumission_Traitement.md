# Soumission et Traitement des Requêtes Personnelles

## 1. Introduction

Mathildanesth permet aux utilisateurs de soumettre des requêtes personnelles, aussi appelées desiderata ou contraintes ponctuelles, afin d'exprimer des préférences ou des besoins spécifiques concernant leur planning. Le système offre un processus structuré pour la soumission, la prise en compte et le traitement de ces requêtes.

Le projet `MATHILDA` mentionne la gestion des "Requêtes spécifiques (validation, impact)". Le modèle `UserRequest` dans `prisma/schema.prisma` de `mathildanesth` fournit une base solide pour cette fonctionnalité.

## 2. Objectifs de la Gestion des Requêtes Personnelles

- **Prise en Compte des Préférences** : Offrir aux utilisateurs un moyen formalisé d'exprimer leurs souhaits ou contraintes, augmentant la satisfaction et la flexibilité perçue.
- **Amélioration de la Qualité des Plannings** : Si les requêtes pertinentes sont intégrées, cela peut mener à des plannings mieux acceptés.
- **Aide à la Décision pour les Planificateurs** : Fournir aux planificateurs une vue centralisée des requêtes à considérer lors de l'élaboration des plannings.
- **Traçabilité** : Conserver un historique des requêtes soumises et des décisions prises.

## 3. Modèle de Données : `UserRequest`

Le modèle `UserRequest` (`prisma/schema.prisma`) est clé :

- `id` : Identifiant unique.
- `userId` : L'utilisateur soumettant la requête.
- `type` (String) : Catégorie de la requête. Exemples de valeurs possibles :
  - `DESIDERATA_OFF` : Souhait d'un jour ou créneau de repos.
  - `CONTRAINTE_HORAIRE` : Impossibilité de travailler avant/après une certaine heure un jour donné.
  - `PREFERENCE_AFFECTATION` : Souhait d'être (ou de ne pas être) affecté à un certain type de tâche, salle, ou avec un collègue particulier ce jour-là.
  - `AUTRE` : Pour les requêtes ne rentrant pas dans les catégories prédéfinies.
- `date` (DateTime, optionnel) : Date principale concernée par la requête.
- `startDate`, `endDate` (DateTime, optionnel) : Période concernée si la requête s'étend sur plusieurs jours ou un intervalle précis.
- `description` (String) : Contenu détaillé de la requête, explication du souhait ou de la contrainte.
- `status` (String) : État de la requête. Exemples :
  - `PENDING` : Requête soumise, en attente de traitement.
  - `CONSIDERED` : Requête vue et prise en compte par le planificateur (sera évaluée lors de la génération).
  - `APPROVED` / `IMPLEMENTED` : Requête acceptée et intégrée dans le planning.
  - `REJECTED` : Requête refusée (avec motif si possible).
  - `PARTIALLY_APPROVED` : Acceptée en partie.
- `adminNotes` (String, optionnel) : Commentaires du planificateur/administrateur concernant la requête.
- `createdAt`, `updatedAt`.

## 4. Processus de Soumission et Traitement

### 4.1. Soumission par l'Utilisateur

1.  **Interface de Soumission** :
    - Un formulaire dédié permet à l'utilisateur de créer une nouvelle requête.
    - Accessible depuis son espace personnel ou directement depuis le planning.
2.  **Informations à Fournir** :
    - Sélection du type de requête.
    - Spécification de la date ou période concernée.
    - Description claire du souhait ou de la contrainte.
3.  **Soumission** : La `UserRequest` est créée avec le statut `PENDING`.

### 4.2. Notification et Prise en Compte par le Planificateur

1.  **Notification** : Le(s) planificateur(s) ou administrateur(s) désigné(s) sont notifiés des nouvelles requêtes ou via un tableau de bord des requêtes en attente.
2.  **Examen des Requêtes** :
    - Le planificateur consulte la liste des requêtes, leur description, et les dates concernées.
    - Il peut mettre à jour le statut en `CONSIDERED` pour indiquer que la requête sera évaluée.

### 4.3. Intégration dans le Processus de Planification

- **Prise en Compte par l'Algorithme** : Idéalement, l'algorithme de génération de planning (`../../03_Planning_Generation/02_Algorithme_Generation.md`) devrait pouvoir lire les requêtes (surtout les `DESIDERATA_OFF` et `CONTRAINTE_HORAIRE` approuvées ou considérées) comme des contraintes souples ou des objectifs à satisfaire.
  - Les requêtes pourraient avoir un "poids" ou un coût de non-satisfaction dans la fonction d'optimisation de l'algorithme.
- **Examen Manuel par le Planificateur** : Lors de l'élaboration ou de l'ajustement manuel du planning, le planificateur consulte les requêtes pertinentes pour la période et tente de les satisfaire au mieux.

### 4.4. Décision et Mise à Jour du Statut

Après l'élaboration du planning (ou pendant) :

1.  **Décision** : Le planificateur décide si la requête peut être satisfaite, partiellement satisfaite, ou non.
2.  **Mise à Jour du Statut** : Le statut de la `UserRequest` est mis à jour (`APPROVED`, `IMPLEMENTED`, `REJECTED`, `PARTIALLY_APPROVED`).
3.  **Notes Administrateur** : Le champ `adminNotes` est utilisé pour expliquer la décision, surtout en cas de refus ou d'approbation partielle.

### 4.5. Notification à l'Utilisateur

- L'utilisateur est notifié de la décision concernant sa requête et des éventuelles notes du planificateur.
- Le planning publié reflète (ou non) la prise en compte de la requête.

## 5. Interface Utilisateur

- **Pour l'Utilisateur** :
  - Formulaire de soumission clair.
  - Liste de ses requêtes avec leur statut actuel.
  - Notifications sur les changements de statut.
- **Pour le Planificateur/Administrateur** :
  - Tableau de bord des requêtes (filtrable par date, statut, utilisateur, type).
  - Accès facile aux requêtes lors de la consultation/modification du planning.
  - Outils pour mettre à jour rapidement le statut des requêtes.

## 6. Types de Requêtes et Exemples

- **`DESIDERATA_OFF`** : "Je souhaiterais avoir mon mercredi après-midi de libre pour un rdv médical."
- **`CONTRAINTE_HORAIRE`** : "Je ne peux pas commencer avant 9h le mardi X en raison de la garde de mes enfants."
- **`PREFERENCE_AFFECTATION`** : "Si possible, j'aimerais éviter d'être de garde le week-end de Pâques car j'ai de la famille.", "Je préférerais être affecté en secteur pédiatrique cette semaine si une place est disponible."

## 7. Configuration

- Définir les `type` de requêtes disponibles dans le système.
- Configurer les workflows de notification et de validation.
- Paramétrer comment l'algorithme de planification tient compte des requêtes (poids, coût).

---

La gestion des requêtes personnelles est un moyen important d'humaniser le processus de planification et d'améliorer l'engagement du personnel. Un système transparent et réactif pour leur traitement est donc un atout pour Mathildanesth.
