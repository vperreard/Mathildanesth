# Gestion de l'Historique des Plannings

## 1. Vue d'ensemble

La gestion de l'historique des plannings est une fonctionnalité importante pour plusieurs raisons :
- **Audit et Traçabilité** : Permettre de revoir les plannings passés, qui était affecté où et quand.
- **Analyse et Reporting** : Fournir des données pour des analyses rétrospectives sur l'occupation, la charge de travail, l'équité, etc.
- **Référence** : Servir de base pour la création de nouveaux plannings (bien que le moteur de règles soit le principal guide, l'analyse des schémas passés peut être utile).
- **Gestion des contentieux** : En cas de désaccord ou de question sur une affectation passée.

Mathildanesth doit donc conserver un historique des plannings publiés et permettre leur consultation.

## 2. Ce qui est Historisé

Pour chaque cycle de planning qui a été publié, le système devrait archiver au minimum :

- **Les affectations détaillées** : Utilisateur, type d'affectation, dates/heures précises, lieu, rôle tenu.
- **La période du planning** : Dates de début et de fin du cycle.
- **Date de publication** : Quand ce planning est devenu officiel.
- **Auteur de la publication** : Qui a publié le planning (si pertinent).
- **Version du planning** : Un identifiant de version (ex: "Juillet 2024 - v1", "Juillet 2024 - v1.1" si des modifications majeures ont été republiées).
- **Instantané des règles majeures** (optionnel mais recommandé) : Un résumé ou un lien vers l'ensemble des règles qui étaient actives et ont servi à générer/valider ce planning. Cela aide à comprendre le contexte si les règles évoluent beaucoup avec le temps.
- **Statut final** : Ex: "Publié", "Archivé", "Remplacé par vX.Y".

Les plannings "Brouillon" ou les simulations non validées n'ont pas forcément besoin d'être conservés sur le long terme de la même manière que les plannings publiés, ou alors avec une politique de rétention plus courte.

## 3. Accès à l'Historique

- Une section "Archives Planning" ou "Historique des Plannings" devrait être accessible, principalement pour les `ADMIN` et `PLANNER`.
- Les utilisateurs standards pourraient avoir un accès limité à leurs propres affectations passées via leur profil ou une vue "Mon Historique".

## 4. Fonctionnalités de l'Interface d'Historique

### 4.1. Recherche et Filtrage
- **Par période** : Sélectionner un mois, une année, ou une plage de dates spécifique pour retrouver les plannings correspondants.
- **Par utilisateur** : Voir tous les plannings où un utilisateur spécifique avait des affectations.
- **Par service/unité**.
- **Par mot-clé** (si des descriptions ou notes étaient associées aux plannings).

### 4.2. Visualisation des Plannings Archivés
- **Affichage similaire au planning actif** : Présenter le planning archivé dans la même vue calendaire familière, mais clairement identifié comme étant un archivage (ex: avec un bandeau "Archive", non modifiable).
- **Détail des affectations passées** : Pouvoir cliquer sur une affectation pour voir ses détails, comme on le ferait sur un planning actif.

### 4.3. Comparaison (Fonctionnalité avancée)
- Possibilité de sélectionner deux versions d'un planning pour une même période (si des modifications ont été republiées) et de visualiser les différences.
- Comparer un planning archivé avec les statistiques d'un planning plus récent pour identifier des évolutions.

### 4.4. Export
- Option d'exporter les données d'un planning archivé (ex: au format PDF pour impression, ou CSV/Excel pour analyse externe).

## 5. Politique de Rétention des Données

- L'établissement doit définir combien de temps les historiques de planning doivent être conservés (ex: 1 an, 3 ans, 10 ans), en accord avec les obligations légales et les besoins internes.
- Le système doit permettre aux administrateurs de configurer cette politique ou, à défaut, d'avoir une politique par défaut raisonnable.
- Des mécanismes de purge ou d'anonymisation (plus complexe) des très anciennes données pourraient être envisagés si la volumétrie devient un problème, mais la conservation est généralement privilégiée pour l'audit.

## 6. Sécurité et Intégrité

- Les plannings archivés ne doivent pas être modifiables pour garantir l'intégrité de l'historique.
- L'accès à l'historique doit être contrôlé par des permissions.

La gestion de l'historique, bien que moins visible au quotidien que la génération de planning elle-même, est une fondation importante pour la robustesse et la fiabilité de l'application sur le long terme. 