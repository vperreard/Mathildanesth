# Gestion des Absences Imprévues

## 1. Vue d'ensemble

Les absences imprévues (maladie, événement familial soudain, etc.) sont une réalité dans la gestion du personnel. Mathildanesth doit permettre une saisie rapide de ces absences et aider à gérer leur impact sur le planning déjà établi ou en cours.

## 2. Saisie Rapide d'une Absence Imprévue

### 2.1. Accès à la Fonctionnalité

- Un accès rapide, potentiellement depuis le tableau de bord principal ou une section "Urgences Planning", doit être disponible pour les administrateurs/planificateurs.

### 2.2. Interface de Saisie Simplifiée

- **Champs Essentiels** :
    - Utilisateur concerné (sélection rapide depuis la liste du personnel).
    - Date de début de l'absence (par défaut, aujourd'hui).
    - Heure de début (si pertinent, ex: absence en cours de journée).
    - Date de fin prévisionnelle (si connue, sinon peut être laissée ouverte ou par défaut à la fin de la journée).
    - Type d'absence (Maladie, Absence Autorisée Urgente, etc.).
    - Motif succinct (optionnel mais recommandé).
- **Automatisation** :
    - Le système doit pouvoir calculer automatiquement la durée si les dates/heures de début et fin sont fournies.
    - Le statut de l'absence est par défaut "Confirmée" ou "En cours".

### 2.3. Impact Immédiat (configurable)

- Une fois l'absence imprévue saisie, l'utilisateur concerné devient immédiatement indisponible sur le planning pour la période indiquée.
- Les affectations existantes de cet utilisateur sur la période de l'absence sont signalées comme "À remplacer" ou "Non couvert".

## 3. Visualisation et Suivi des Absences Imprévues

### 3.1. Tableau de Bord des Absences

- Une section du tableau de bord des absences (voir `documentation/affectations-habituelles-absences.md` pour l'idée générale) doit mettre en évidence les absences imprévues récentes ou en cours.
- **Indicateurs Clés** :
    - Nombre d'absents imprévus aujourd'hui/cette semaine.
    - Liste des personnes absentes (imprévu) avec dates et motifs.
    - Alertes si des postes critiques ne sont plus couverts.

### 3.2. Vue Planning

- Sur les vues de planning (journalier, hebdomadaire), les absences imprévues doivent être clairement visibles (ex: couleur spécifique, icône).
- Les créneaux non couverts suite à une absence imprévue doivent être mis en évidence.

## 4. Gestion des Remplacements et Ajustements

### 4.1. Identification des Besoins de Remplacement

- Le système doit aider à identifier rapidement les affectations qui nécessitent un remplacement suite à une absence imprévue.
    - Priorisation des affectations critiques (ex: garde, salle unique pour une spécialité).

### 4.2. Aide à la Recherche de Remplaçants

- **Suggestion de Personnel Disponible** : En fonction des disponibilités, compétences, et règles (temps de repos, etc.), le système peut suggérer une liste de remplaçants potentiels.
- **Contact Facilité** : Intégration avec des outils de communication interne ou affichage des numéros de contact.

### 4.3. Modification du Planning

- Interface de modification du planning permettant de réaffecter rapidement un utilisateur disponible sur le créneau libéré.
- Historisation de ces changements manuels dus à une absence imprévue.

## 5. Notifications

- **Notification aux Responsables** : Les administrateurs/planificateurs sont notifiés lors de la saisie d'une absence imprévue impactant le planning du jour ou des jours suivants immédiats.
- **Notification à l'Équipe (configurable)** : Possibilité de notifier les membres de l'équipe concernée par l'absence et les modifications de planning qui en découlent.

## 6. Distinction avec les Congés Planifiés

Il est important de distinguer les absences imprévues des congés planifiés :
- **Workflow de validation** : Les absences imprévues ne passent généralement pas par le même workflow de demande/validation que les congés.
- **Impact sur les quotas/soldes** : Le traitement pour les compteurs de jours (maladie vs congés payés) est différent.
- **Prévisibilité** : Les absences imprévues, par nature, ne peuvent pas être anticipées de la même manière dans la planification à long terme.

Le module de gestion des absences imprévues est donc crucial pour la réactivité et la robustesse de la planification face aux aléas quotidiens. 