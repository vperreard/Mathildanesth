# Journal d'Activité, Historique et Audit

## Introduction

La traçabilité des actions et des modifications, ainsi que la conservation d'un historique des données clés, sont fondamentales pour la gestion, l'analyse et la sécurité d'une application comme Mathildanesth. Ce document décrit les besoins en matière de journal d'activité, d'historisation des plannings et d'audit.
`MATHILDA` fait référence à ces aspects dans "5. Journal d'Activité et Historique" et "06_Historique_Audit.md" de ses spécifications fonctionnelles secondaires.
La roadmap de `mathildanesth` mentionne également un "Service d'audit pour journalisation des actions sensibles".

## Objectifs

- **Traçabilité :** Savoir qui a fait quoi et quand, en particulier pour les modifications de planning et les actions administratives.
- **Analyse Rétrospective :** Permettre de consulter les états antérieurs des plannings.
- **Reddition de Comptes :** Fournir des éléments en cas de besoin de vérification ou de justification.
- **Débogage et Support :** Aider à comprendre comment une situation donnée s'est produite.
- **Sécurité :** Dissuader les actions inappropriées et identifier les accès ou modifications non autorisés.

## Composantes de la Fonctionnalité

### 1. Journal des Modifications du Planning

- **Granularité :** Suivi chronologique de toutes les modifications apportées aux plannings.
  - Création, modification, suppression d'affectations.
  - Changements de statut d'une affectation.
  - Modifications manuelles par les administrateurs.
- **Informations à Enregistrer pour Chaque Modification :**
  - Date et heure de la modification.
  - Utilisateur auteur de la modification (`userId`).
  - Type de modification (ex: `CREATE_ASSIGNMENT`, `UPDATE_ASSIGNMENT_USER`, `DELETE_ASSIGNMENT`).
  - Détails de la modification : affectation concernée, valeurs avant/après.
  - Commentaire ou justification associé(e) au changement (si applicable, ex: lors d'un forçage de règle).
- **Interface de Consultation :**
  - Possibilité de visualiser l'historique des changements pour un planning, une affectation, ou un utilisateur spécifique.
  - Filtres par date, type d'action, utilisateur.

### 2. Historique des Versions du Planning

- **Archivage des Plannings :**
  - Sauvegarde régulière des versions majeures des plannings (ex: planning publié pour la semaine S, planning après modifications importantes).
  - Permet de revenir à une version antérieure en cas de problème majeur (rollback prudent).
- **Comparaison entre Versions (Optionnel - Avancé) :**
  - Outil permettant de visualiser les différences entre deux versions d'un planning (prévu vs. réalisé, ou deux versions successives).
- **Accès aux Plannings Passés :**
  - Possibilité de consulter les plannings des périodes précédentes tels qu'ils étaient au moment de leur validité.

### 3. Journal d'Audit des Actions (Audit Trail)

Ce journal est plus large que le simple historique des modifications du planning et couvre les actions sensibles dans l'ensemble de l'application.

- **Actions à Tracer (Exemples) :**
  - Connexions et tentatives de connexion (succès/échec).
  - Modifications des droits utilisateurs et des rôles (`Role`, `UserRole`).
  - Changements de configuration critiques de l'application (ex: modification des règles de planification globales, paramètres des types de congés).
  - Validations et refus de demandes (congés, échanges, requêtes spécifiques).
  - Opérations d'import/export de données sensibles.
  - Actions d'administration sur les données (ex: suppression d'un utilisateur, modification majeure d'un profil).
- **Informations à Enregistrer :** Similaires au journal des modifications (qui, quoi, quand, résultat).
- **Sécurité et Intégrité du Journal d'Audit :**
  - Le journal d'audit doit être protégé contre les modifications non autorisées.
  - Archivage sécurisé et potentiellement exportable pour des raisons légales ou de conformité.
- **Consultation :** Interface sécurisée réservée aux administrateurs système pour consulter et analyser le journal d'audit.
  - Le service `AuditService` mentionné dans la roadmap de `mathildanesth` est probablement destiné à cette fonction.

## Points Clés d'Implémentation

- **Modèles de Données :**
  - `PlanningModificationLog` ou `AssignmentHistory`.
  - `PlanningVersion` (pour l'archivage des plannings).
  - `AuditLog` ou `ActivityLog` (pour le journal d'audit général).
  - Le modèle `AuditLog` existe déjà dans `prisma/schema.prisma` avec `userId`, `action`, `details`, `timestamp`, `targetEntity`, `targetId`.
- **Performance :** L'enregistrement intensif de logs ne doit pas impacter significativement les performances de l'application. Des écritures asynchrones ou des files d'attente peuvent être envisagées.
- **Stockage et Rétention :** Définir des politiques de stockage et de durée de conservation pour ces logs, en fonction des besoins et des contraintes (légales, volumétrie).
- **Exploitabilité :** Les logs doivent être facilement interrogeables et compréhensibles.

## Conclusion

Un système complet d'historisation et d'audit est indispensable pour une application gérant des données aussi sensibles et critiques que la planification du personnel médical. Il renforce la confiance, facilite la résolution de problèmes et assure la conformité. L'existence d'un `AuditService` et d'un modèle `AuditLog` dans `mathildanesth` est une bonne base.
