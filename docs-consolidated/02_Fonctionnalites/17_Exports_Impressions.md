# Exportation et Impression des Plannings

## Introduction

Bien que Mathildanesth soit une application web conçue pour une consultation et une interaction en ligne, la possibilité d'exporter et d'imprimer les plannings reste une fonctionnalité importante pour de nombreux cas d'usage (affichage mural, distribution à du personnel n'ayant pas un accès constant à l'application, archivage physique, etc.).
`MATHILDA` mentionne l'export et l'impression comme une fonctionnalité principale.

## Objectifs

- Permettre l'export des vues de planning dans des formats courants.
- Fournir une version optimisée pour l'impression des plannings.
- Offrir des options de configuration pour le contenu exporté/imprimé.

## Formats d'Exportation

Le système devrait supporter l'exportation dans les formats suivants :

### 1. PDF (Portable Document Format)

- **Idéal pour l'impression et le partage de documents figés.**
- L'export PDF doit viser à reproduire le plus fidèlement possible la vue de planning affichée à l'écran, mais optimisée pour le format page (A4/Letter, paysage/portrait).
- **Options d'Export PDF :**
  - Choix de la période à exporter (jour, semaine, mois).
  - Choix de la vue (par personnel, par salle/secteur).
  - Inclusion optionnelle des filtres actifs au moment de l'export.
  - Option pour inclure/exclure les commentaires journaliers.
  - Possibilité d'ajouter un en-tête/pied de page personnalisé (nom du service, date d'export, etc.).

### 2. CSV (Comma-Separated Values) / Excel (XLSX)

- **Idéal pour l'export de données brutes en vue d'une analyse externe ou d'une intégration avec d'autres outils.**
- **Contenu de l'Export CSV/Excel :**
  - Liste des affectations pour la période sélectionnée.
  - Champs typiques : Date, Heure de début, Heure de fin, Utilisateur (Nom, Prénom, Rôle), Type d'affectation, Lieu (Salle/Secteur), Commentaires sur l'affectation (si existent).
- **Options d'Export :**
  - Choix de la période.
  - Possibilité d'appliquer des filtres (personnel, rôle, type d'affectation) avant l'export.

## Fonctionnalité d'Impression

- **Bouton "Imprimer" :** Directement accessible depuis les vues de planning.
- **Optimisation pour l'Impression :**
  - Utilisation de styles CSS spécifiques pour l'impression (`@media print`).
  - Suppression des éléments d'interface non pertinents pour la version papier (boutons de navigation, menus, etc.).
  - Mise en page adaptée au format papier (gestion des sauts de page, optimisation des couleurs pour l'impression noir et blanc ou couleur).
  - Ajustement de la taille des polices pour la lisibilité.
- **Aperçu avant Impression :** Le navigateur gère généralement cette fonctionnalité, mais le design doit s'y prêter.
- **Options d'Impression (via dialogue d'impression du navigateur) :**
  - Choix de l'imprimante.
  - Orientation (paysage souvent préférable pour les plannings).
  - Nombre de copies.
  - Mise à l'échelle.

## Points Clés d'Implémentation

- **Génération PDF Côté Client ou Serveur :**
  - **Côté Client :** Des bibliothèques JavaScript comme `jsPDF`, `html2pdf.js` peuvent convertir le contenu HTML/CSS du planning en PDF. Avantage : moins de charge serveur. Inconvénient : peut être moins précis pour des mises en page complexes et dépendant des capacités du navigateur.
  - **Côté Serveur :** Des bibliothèques comme Puppeteer (Node.js) peuvent générer des PDF très fidèles à partir d'une page web. Avantage : contrôle total, haute fidélité. Inconvénient : charge serveur plus importante.
- **Génération CSV/Excel :** Peut se faire côté client (pour de petits volumes) ou côté serveur (pour de plus grands volumes ou pour des raisons de sécurité/formatage avancé).
- **Considérations de Performance :** La génération de PDF ou d'exports de données volumineux peut prendre du temps. Des indicateurs de progression ou des opérations en arrière-plan peuvent être nécessaires.
- **Respect des Filtres :** L'export/impression doit refléter l'état actuel de la vue de l'utilisateur, y compris les filtres appliqués, sauf si l'option de les ignorer est donnée.

## Conclusion

Bien que la consultation en ligne soit privilégiée, les fonctionnalités d'exportation et d'impression des plannings sont des compléments utiles qui répondent à des besoins concrets des utilisateurs. Une implémentation soignée garantira que les documents produits sont lisibles, pertinents et fidèles à l'information affichée dans l'application.
