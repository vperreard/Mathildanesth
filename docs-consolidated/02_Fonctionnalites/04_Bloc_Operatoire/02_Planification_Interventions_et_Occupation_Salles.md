# Planification des Interventions et Occupation des Salles

## 1. Positionnement de Mathildanesth

Il est crucial de comprendre que Mathildanesth, dans sa version actuelle et ses objectifs principaux, **ne gère pas la planification détaillée des interventions chirurgicales patient par patient.** Elle ne stocke ni ne traite les données médicales nominatives des patients ou les détails spécifiques de chaque opération (type exact d'intervention, durée prévue, matériel spécifique patient).

**Mathildanesth se concentre sur la planification du personnel d'anesthésie (Médecins Anesthésistes-Réanimateurs - MAR, Infirmiers Anesthésistes Diplômés d'État - IADE) en fonction de l'occupation des salles d'opération et des créneaux opératoires définis par la trame chirurgicale.**

La gestion fine du programme opératoire (liste des patients, ordre de passage, détails chirurgicaux) est supposée être gérée par un autre système d'information hospitalier (SIH) ou un logiciel de gestion de bloc opératoire dédié (qui peut être la source de la "trame chirurgien").

## 2. Notion de "Créneau Opératoire Occupé"

Du point de vue de Mathildanesth, la "planification des interventions" se traduit par la connaissance des **créneaux horaires pendant lesquels une salle d'opération est prévue pour être utilisée par un chirurgien (et donc nécessite une couverture anesthésique).**

Cette information provient de la **Trame d'Occupation Chirurgicale** (décrite dans `01_Configuration_Salles_Equipements.md#4-intégration-de-la-trame-doccupation-chirurgicale`).

Pour Mathildanesth, un créneau opératoire est défini par :
- Une **salle d'opération**
- Une **demi-journée** (ex: Lundi Matin, Lundi Après-midi)
- Le **chirurgien** prévu (information de la trame)
- La **spécialité principale** de l'activité chirurgicale prévue (information de la trame)

L'application ne gère pas le découpage d'une demi-journée en plusieurs interventions successives avec des durées variables. Elle considère la demi-journée comme un bloc d'occupation pour la planification de l'équipe d'anesthésie.

## 3. Impact sur la Planification Anesthésie

- **Besoin en personnel** : Lorsqu'une salle est marquée comme occupée par un chirurgien pour une demi-journée, Mathildanesth sait qu'il faut y affecter le personnel d'anesthésie requis (ex: 1 MAR superviseur, 1 IADE par salle ou selon les règles de supervision).
- **Affichage** : Le planning d'anesthésie peut afficher le nom du chirurgien et/ou la spécialité pour les créneaux concernés, fournissant un contexte utile au personnel d'anesthésie.
- **Absence de gestion des urgences intra-bloc** : La gestion dynamique des urgences qui surviennent et qui pourraient nécessiter de déprogrammer/reprogrammer des interventions patient n'est pas directement gérée. Mathildanesth gère l'affectation du personnel sur la base des salles *prévues* comme ouvertes. La réorganisation du personnel en cas d'urgence majeure relève de la communication et de la décision humaine, l'outil pouvant aider à identifier du personnel potentiellement redéployable.

## 4. Fonctionnalités Non Couvertes (ou relevant d'un autre système)

- Prise de rendez-vous opératoire pour les patients.
- Gestion des listes d'attente de patients.
- Planification de l'ordre de passage des patients au sein d'une demi-journée.
- Estimation et suivi des durées d'intervention réelles.
- Gestion des consentements, des dossiers patients.
- Traçabilité du matériel spécifique utilisé par intervention.

## 5. Évolutions Futures Possibles (Tel que mentionné dans `docs/modules/bloc-operatoire.md`)

Bien que non central actuellement, des évolutions futures pourraient envisager une intégration plus poussée avec un système de gestion des interventions. Cela pourrait inclure :

- **Gestion des interventions chirurgicales avec durée et équipe chirurgicale détaillée** : Pour affiner les besoins de présence anesthésique.
- **Gestion des urgences et reprogrammations** : Pour une adaptation plus dynamique du planning d'anesthésie.

Cependant, ces évolutions représenteraient une extension significative du périmètre fonctionnel actuel de Mathildanesth, se rapprochant d'un système de gestion de bloc plus complet, et nécessiteraient une réflexion approfondie sur la gestion des données patient et les intégrations SIH.

Pour l'heure, la "planification des interventions" dans Mathildanesth se limite à la connaissance des créneaux d'occupation des salles par les équipes chirurgicales, servant de base à la planification des équipes d'anesthésie. 