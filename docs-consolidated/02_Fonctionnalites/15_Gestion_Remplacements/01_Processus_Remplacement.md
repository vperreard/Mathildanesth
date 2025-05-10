# Gestion des Remplacements et Imprévus

## Introduction

Les absences imprévues (maladie, urgence personnelle) sont inévitables et nécessitent une réorganisation rapide du planning pour assurer la continuité des soins. Mathildanesth doit aider les administrateurs à gérer ces situations en facilitant la recherche et l'affectation de remplaçants.
La fonctionnalité de "Gestion des Remplaçants (Souhaitable V1 - Gestion Disponibilités)" est mentionnée dans `MATHILDA`.

## Objectifs

- Identifier rapidement les besoins de remplacement suite à une absence imprévue.
- Faciliter la recherche de personnel disponible et compétent pour assurer le remplacement.
- Permettre aux remplaçants (internes ou externes) de signaler leurs disponibilités.
- Mettre à jour le planning avec l'affectation du remplaçant.

## Workflow de Gestion d'un Remplacement

### 1. Signalement de l'Absence Imprévue

- Voir `../02_Gestion_Conges/01_Processus_Gestion_Conges_Absences.md` (section "Gestion des Absences Imprévues").
- L'absence est saisie, l'affectation initiale de la personne absente est marquée comme "vacante" ou "à remplacer".
- Notification aux administrateurs du besoin de remplacement.

### 2. Identification des Besoins de Remplacement

- L'administrateur visualise sur le planning les créneaux/affectations nécessitant un remplacement.
- Le système met en évidence les postes critiques non couverts.

### 3. Recherche d'un Remplaçant

Plusieurs stratégies peuvent être combinées :

**A. Personnel Interne (Volontariat ou Sollicitation)**

- **Appel à Volontaires :**
  - Possibilité de diffuser une notification à un groupe de personnel éligible (ex: "Besoin d'un MAR pour la garde de demain soir, merci de vous manifester si disponible").
- **Sollicitation Directe par l'Administrateur :**
  - L'administrateur consulte le planning pour identifier du personnel potentiellement disponible (ex: personnel en repos, personnel avec une charge de travail plus légère ce jour-là).
  - Le système pourrait aider en listant les personnes :
    - Ayant les compétences requises.
    - Ne tombant pas en infraction avec les règles de repos si elles prennent le poste.
    - N'ayant pas de contre-indication (temps partiel, etc.).

**B. Gestion des Disponibilités des Remplaçants (Fonctionnalité `MATHILDA`)**

- **Interface pour Remplaçants :**
  - Des utilisateurs avec un rôle spécifique `Remplaçant` (qu'ils soient internes à l'équipe habituelle ou des vacataires externes) peuvent accéder à un calendrier simple.
  - Sur ce calendrier, ils indiquent leurs jours/demi-journées de disponibilité pour effectuer des remplacements.
- **Consultation par l'Administrateur :**
  - Lorsqu'un besoin de remplacement survient, l'administrateur peut consulter cette liste/calendrier de disponibilités des remplaçants.
  - Filtrer par compétences si nécessaire.

### 4. Affectation du Remplaçant

- Une fois un remplaçant trouvé et son accord obtenu :
  - L'administrateur modifie le planning pour affecter le remplaçant au poste vacant.
  - Le système vérifie que l'affectation du remplaçant respecte les règles (compétences, repos, etc.).
  - L'affectation initiale de la personne absente est formellement annulée ou marquée comme "remplacée par X".
- Notification au remplaçant et aux équipes concernées du changement de planning.

### 5. Suivi et Traçabilité

- Toutes les opérations de remplacement (qui a été remplacé, par qui, quand) doivent être historisées.
- Impact sur les compteurs horaires et de gardes du remplaçant.

## Points Clés d'Implémentation

- **Rôle `Remplaçant` :** Si des vacataires externes sont gérés, un rôle utilisateur avec des droits limités (accès au calendrier de disponibilités, notifications de besoins) est nécessaire.
- **Critères de Suggestion de Remplaçants :** L'intelligence du système pour suggérer des remplaçants pertinents (compétences, respect des règles, coût si applicable) est un plus.
- **Communication Rapide :** Les notifications doivent être quasi instantanées pour ce type de situation.
- **Gestion des Astreintes :** En cas d'absence, la personne d'astreinte peut être la première sollicitée selon les protocoles du service.

## Conclusion

La gestion des remplacements est un aspect souvent stressant de la gestion de planning. En fournissant des outils pour identifier les besoins, visualiser les disponibilités et contacter rapidement des remplaçants potentiels, Mathildanesth peut grandement simplifier ce processus et aider à maintenir la continuité et la sécurité des soins.
