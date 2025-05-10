# Processus de Gestion des Remplacements

## 1. Introduction

La gestion des remplacements est une fonctionnalité critique pour assurer la continuité des soins face aux absences imprévues (maladie soudaine, urgence personnelle) ou aux besoins de dernière minute. Mathildanesth vise à fournir un processus structuré pour identifier les besoins de remplacement, trouver des remplaçants potentiels, et formaliser le remplacement.

La roadmap (`documentation/roadmap-dev-updated.md`) indique en Phase 2 (P1) le "Développement d'un système de **remplacements** / gestion des imprévus". `docs/technique/NEXT_STEPS.md` mentionne également un "Système de remplacements et gestion des imprévus" comme objectif à moyen terme, avec une interface dédiée, un workflow de notification, et un système de proposition automatique.

## 2. Objectifs

- **Réactivité** : Permettre de trouver rapidement une solution en cas d'absence imprévue.
- **Maintien de la Couverture** : S'assurer que les postes critiques sont toujours couverts.
- **Équité** : Proposer les remplacements de manière équitable (si possible, éviter de solliciter toujours les mêmes personnes).
- **Respect des Règles** : Vérifier que le remplaçant est éligible (compétences, temps de travail, repos) pour le poste.
- **Traçabilité** : Conserver un historique des remplacements effectués.

## 3. Scénarios Déclenchant un Besoin de Remplacement

- **Absence Imprévue** : Un utilisateur se déclare absent à la dernière minute (ex: congé maladie).
- **Retrait d'une Affectation** : Un planificateur doit retirer une affectation à un utilisateur pour une raison quelconque, créant un vide.
- **Augmentation Soudaine des Besoins** : Rarement, un besoin non anticipé de personnel supplémentaire.

## 4. Processus Envisagé pour la Gestion d'un Remplacement

### 4.1. Identification du Besoin

1.  **Signalement** : Une absence est enregistrée, ou une affectation devient vacante dans le planning.
2.  **Alerte au Planificateur** : Le système notifie le(s) planificateur(s) du poste non couvert nécessitant un remplacement.

### 4.2. Recherche d'un Remplaçant

Le planificateur (ou le système) initie la recherche.

1.  **Consultation des Disponibilités** :
    - Vérifier les utilisateurs qui ne sont pas déjà affectés, pas en congé, et qui ont le profil/compétences requis.
2.  **Système de Proposition Automatique (Objectif Moyen Terme)** :
    - L'algorithme pourrait suggérer une liste de remplaçants potentiels, classés selon des critères :
      - Compétences adéquates.
      - Respect des règles de temps de travail et de repos si le remplacement est accepté.
      - Équité (ex: ceux ayant fait le moins d'heures supplémentaires ou de remplacements récemment).
      - Volontariat (si un système de volontariat pour remplacements existe).
3.  **Sollicitation Manuelle ou Via Système** :
    - Le planificateur contacte les remplaçants potentiels.
    - Idéalement, le système permet d'envoyer une "demande de remplacement" via des [Notifications](./../12_Notifications_Alertes/01_Systeme_Notifications.md) aux utilisateurs sélectionnés.

### 4.3. Acceptation et Validation du Remplacement

1.  **Acceptation par le Remplaçant** : Un utilisateur accepte de prendre le poste.
2.  **Validation par le Système** : Avant de finaliser, le système re-vérifie que l'affectation du remplaçant respecte toutes les règles (conflits, temps de travail, compétences, etc.).
3.  **Validation par le Planificateur (si nécessaire)** : Le planificateur confirme le remplacement.

### 4.4. Mise à Jour du Planning

- L'affectation initiale (de la personne absente) est marquée comme annulée ou modifiée.
- Une nouvelle affectation est créée pour le remplaçant.
- Les compteurs de temps de travail et autres indicateurs sont mis à jour pour les deux personnes.

### 4.5. Notification

- Le remplaçant est notifié de sa nouvelle affectation.
- La personne initialement prévue (si applicable et si ce n'est pas elle qui a initié l'absence) peut être notifiée que son affectation a été couverte.
- Les équipes concernées peuvent être informées du changement.

## 5. Interface Utilisateur (Concepts)

- **Tableau de Bord des Remplacements (pour planificateurs)** :
  - Liste des postes nécessitant un remplacement.
  - Suggestions de remplaçants.
  - Outils pour contacter et assigner les remplaçants.
- **Interface pour les Utilisateurs** :
  - Possibilité de se porter volontaire pour des remplacements (si cette fonctionnalité est implémentée).
  - Notifications pour les demandes de remplacement les concernant.
  - Visualisation claire des changements dans leur planning personnel.

## 6. Interaction avec d'Autres Modules

- **Gestion des Congés et Absences** : Une absence validée peut déclencher automatiquement un besoin de remplacement.
- **Planning** : Le module de planning affiche les postes vacants et les affectations mises à jour.
- **Moteur de Règles** : Valide l'adéquation du remplaçant.
- **Notifications** : Communique les demandes et confirmations.
- **Compteurs Horaires** : Met à jour les temps de travail.

## 7. Modélisation des Données (Considérations)

- Actuellement, il n'y a pas de modèle `ReplacementRequest` dédié dans `prisma/schema.prisma`.
- Le processus pourrait s'appuyer sur :
  - La modification du `userId` sur un `Assignment` existant.
  - La création d'un nouvel `Assignment` pour le remplaçant et l'annulation/modification de l'original.
  - Le modèle `SwapRequest` gère les échanges initiés par les utilisateurs eux-mêmes, ce qui est une forme de remplacement.
- Pour un suivi plus fin, un modèle spécifique pourrait tracer l'origine de la demande de remplacement, les personnes sollicitées, et le remplaçant final.

## 8. Points Clés

- **Rapidité et Efficacité** : Le processus doit être rapide pour minimiser les périodes non couvertes.
- **Fiabilité des Informations** : Les disponibilités et compétences des remplaçants potentiels doivent être à jour.
- **Communication Claire** : Tous les acteurs doivent être informés des changements.

---

Un système de gestion des remplacements robuste est essentiel pour la résilience opérationnelle du service. L'approche par étapes, commençant par des outils pour le planificateur et évoluant vers des suggestions automatiques, semble pragmatique.
