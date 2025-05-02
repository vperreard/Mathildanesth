# Règles d'affectation médicale dans Mathildanesth

Ce document explique les règles métier concernant l'affectation des médecins anesthésistes aux différentes activités (gardes, astreintes, consultations, bloc opératoire) dans le système Mathildanesth.

## Règles générales

### Gardes

- Un médecin de garde assure une présence continue (généralement 24h, de 8h à 8h le lendemain)
- **Un seul médecin est de garde** par jour sur une même tranche horaire
- La garde est **incompatible avec toute autre affectation** le même jour
- Un médecin ne peut pas faire deux gardes consécutives (sauf exception extraordinaire qui ne doit pas être proposée par l'algorithme de génération)
- Un repos après garde est obligatoire

### Astreintes

- L'astreinte est **compatible avec d'autres affectations** le même jour (consultations, bloc)
- L'astreinte est **incompatible** avec les gardes et le repos après garde
- L'astreinte **ne compte pas comme cumul d'affectation** (ce n'est pas une activité sur place mais une disponibilité)

### Consultations

- Un médecin peut être en consultation soit le matin, soit l'après-midi (pas les deux)
- La consultation est **incompatible avec le bloc opératoire sur le même créneau** (matin ou après-midi)
- Possibilité de faire bloc le matin et consultation l'après-midi, ou inversement

### Bloc opératoire

- Être affecté au bloc compte pour une affectation
- Un médecin anesthésiste au bloc peut :
  - Faire l'anesthésie dans une salle
  - Superviser une salle où un IADE (Infirmier Anesthésiste) fait l'anesthésie
  - Combiner les deux rôles

- **Règles de supervision** :
  - Un médecin faisant l'anesthésie dans une salle peut superviser une autre salle du même secteur (idéalement contiguë)
  - Exceptionnellement, un médecin peut superviser une 3ème salle
  - Dans le cas d'une supervision de 3 salles, il est préférable que le médecin se consacre uniquement à la supervision (sans faire lui-même d'anesthésie)

## Spécificités par secteur

### Secteurs opératoires

- Les secteurs opératoires peuvent avoir des règles spécifiques de supervision
- Un médecin ne peut superviser que des salles appartenant au même secteur
- La supervision entre secteurs différents n'est possible que si explicitement autorisée dans les règles de compatibilité

### Compatibilité des secteurs

Les règles de compatibilité déterminent quels secteurs peuvent être supervisés ensemble :

- Standard : uniquement avec standard
- Ophtalmologie : compatible avec standard
- Endoscopie : uniquement avec endoscopie

## Limitations et contraintes

### Nombre maximum de salles supervisées

Le nombre maximum de salles qu'un médecin peut superviser dépend du secteur :
- Standard : 2 salles
- Ophtalmologie : 3 salles
- Endoscopie : 2 salles

En cas exceptionnel, la limite peut être portée à 3 salles maximum.

### Temps de repos

- Un temps de repos minimal est obligatoire entre deux affectations (particulièrement après une garde)
- La durée recommandée entre deux gardes est de 7 jours minimum (peut être paramétré différemment)

## Équité et répartition

- L'algorithme de génération doit assurer une répartition équitable des gardes/astreintes
- Les gardes de weekend et jours fériés ont un poids plus important dans le calcul d'équité
- Les préférences personnelles des médecins sont prises en compte dans la mesure du possible

---

Ces règles sont implémentées dans le service `PlanningGeneratorService` pour générer les plannings dans le respect des contraintes métier. Elles peuvent être paramétrées via l'objet `RulesConfiguration` qui permet d'adapter les contraintes aux besoins spécifiques de l'établissement. 