# Journal d'Activité et Historique des Modifications (Audit Log)

## 1. Introduction

La traçabilité des actions et des modifications de données est essentielle dans un système de planification aussi critique que Mathildanesth. Elle permet de comprendre l'évolution des plannings, d'identifier les auteurs de changements, de déboguer des problèmes et de répondre à des besoins d'audit.

Mathildanesth intègre un service d'audit pour la journalisation des actions sensibles, s'appuyant sur le modèle `AuditLog` (`prisma/schema.prisma`). Cette fonctionnalité est considérée comme complétée (`docs/technique/NEXT_STEPS.md`). Le projet `MATHILDA` listait également un "Journal d'activité/Historique" comme indispensable V1.

## 2. Objectifs de l'Audit Log

- **Traçabilité** : Savoir qui a fait quoi, quand, et sur quelle donnée.
- **Sécurité** : Dissuader les modifications non autorisées et aider à investiguer les incidents de sécurité.
- **Débogage** : Comprendre la séquence d'événements ayant mené à une situation problématique.
- **Reddition de Comptes (Accountability)** : Responsabiliser les utilisateurs pour leurs actions dans le système.
- **Support à la Décision** : Analyser l'historique des modifications pour comprendre les dynamiques de planification.
- **Conformité** : Répondre à d'éventuelles exigences réglementaires en matière de suivi des modifications de données sensibles.

## 3. Modèle de Données : `AuditLog`

Le modèle `AuditLog` dans `prisma/schema.prisma` est conçu pour stocker ces informations :

- **`id`** (String) : Identifiant unique de l'entrée de log (généré comme CUID).
- **`timestamp`** (DateTime) : Date et heure de l'action.
- **`userId`** (Int, optionnel) : Identifiant de l'utilisateur ayant effectué l'action. Lié au modèle `User`.
- **`action`** (String) : Description de l'action effectuée. Ces actions sont souvent standardisées sous forme de codes (ex: "CREATE_USER", "UPDATE_ASSIGNMENT", "APPROVE_LEAVE").
- **`entityType`** (String) : Nom de l'entité/modèle de données concerné (ex: "User", "Assignment", "Leave", "Rule").
- **`entityId`** (String) : Identifiant de l'instance spécifique de l'entité concernée.
- **`details`** (String, optionnel) : Informations supplémentaires sur l'action, stockées sous forme de chaîne JSON. Peut contenir les valeurs avant/après modification, les paramètres utilisés, ou un message descriptif plus long.
  - Exemple pour un `UPDATE` : `"{ \"oldValues\": { \"status\": \"PENDING\" }, \"newValues\": { \"status\": \"APPROVED\" } }"`
- Le champ `ipAddress` (pour l'adresse IP de l'utilisateur) est une suggestion d'amélioration pour renforcer la sécurité mais n'est pas présent dans le modèle actuel.

## 4. Actions Journalisées (Exemples)

Idéalement, un large éventail d'actions sensibles devrait être journalisé. Les services d'audit existants dans Mathildanesth (comme `src/lib/auditService.ts`, `src/modules/leaves/services/AuditService.ts`, `src/services/AuditService.ts`) définissent déjà plusieurs types d'actions concrètes. Par exemple :

- **Gestion des Utilisateurs** (correspondant à des actions comme `USER_CREATED`, `USER_UPDATED`, `USER_DELETED` dans `src/services/AuditService.ts`) :
  - Création, modification (rôle, statut), suppression d'utilisateurs.
  - Changement de mot de passe (par l'admin ou l'utilisateur).
- **Connexions** :
  - Le modèle `LoginLog` est spécifique pour cela, mais des actions comme `USER_LOGIN`, `USER_LOGOUT` sont aussi définies dans `src/services/AuditService.ts`.
- **Gestion des Congés (`Leave`)** (correspondant à des actions comme `LEAVE_CREATED`, `LEAVE_APPROVED`, `LEAVE_REJECTED` dans `src/modules/leaves/services/AuditService.ts` et `src/services/AuditService.ts`) :
  - Soumission, approbation, rejet, annulation d'une demande de congé.
  - Modification des quotas de congés.
- **Gestion des Affectations (`Assignment`)** :
  - Création, modification, suppression d'affectations (manuelle ou par l'algorithme).
  - Échanges d'affectations (`AssignmentSwapRequest`) : création de la demande, acceptation, rejet, approbation finale.
- **Génération de Planning** :
  - Lancement de la génération automatique.
  - Publication d'un planning.
- **Gestion des Règles (`Rule`, `PlanningRule`)** :
  - Création, modification, activation/désactivation d'une règle.
- **Gestion des Trames (`TrameAffectation`)** :
  - Création, modification, duplication, exportation d'une trame.
- **Configuration du Système** (correspondant à des actions comme `SETTING_UPDATED` dans `src/services/AuditService.ts`):
  - Modification de paramètres importants (ex: types de congés, configuration du bloc opératoire).
- **Actions d'Administration Générales**.
- **Export de données** (ex: `EXPORT_DATA` dans `src/modules/leaves/services/AuditService.ts`).

## 5. Interface de Consultation de l'Audit Log

- **Accès Restreint** : Généralement réservé aux administrateurs système ou à des rôles spécifiques avec des besoins d'audit.
- **Fonctionnalités de l'Interface** :
  - Affichage chronologique des entrées de log.
  - **Filtrage** :
    - Par utilisateur (`userId`).
    - Par type d'action (`action`).
    - Par entité concernée (`entityType`).
    - Par identifiant d'entité (`entityId`) pour voir tout l'historique d'un objet spécifique.
    - Par période (date de début, date de fin).
  - **Recherche** par mots-clés dans le champ `details`.
  - **Pagination** pour gérer de grands volumes de logs.
  - **Visualisation des Détails** : Affichage formaté du contenu du champ `details` (JSON).
- **Export (Optionnel)** : Possibilité d'exporter les résultats filtrés (ex: CSV) pour une analyse externe.

## 6. Service d'Audit (`AuditService`)

Un service centralisé (`AuditService.ts` mentionné comme complété dans `docs/technique/NEXT_STEPS.md`) est responsable de :

- Fournir une méthode simple pour les autres services/modules afin d'enregistrer des événements d'audit.
  - Exemple : `auditService.logAction(userId, action, entityType, entityId, details)`.
- Gérer l'écriture des logs dans la base de données (`AuditLog`).

## 7. Bonnes Pratiques et Considérations

- **Granularité** : Choisir le bon niveau de détail pour les logs. Trop de logs peuvent être difficiles à gérer, pas assez peuvent manquer d'informations cruciales.
- **Performance** : L'écriture des logs ne doit pas impacter significativement les performances des opérations principales.
- **Sécurité des Logs** : Protéger l'accès aux logs eux-mêmes.
- **Rétention des Logs** : Définir une politique de rétention (combien de temps les logs sont conservés) en fonction des besoins et des contraintes de stockage.
- **Lisibilité** : Utiliser des noms d'actions (`action`) et d'entités (`entityType`) clairs et cohérents.

---

Le système d'historisation et d'audit est un composant fondamental pour la gouvernance, la sécurité et la maintenance de Mathildanesth. Son implémentation via le modèle `AuditLog` et un service dédié constitue une base solide.
