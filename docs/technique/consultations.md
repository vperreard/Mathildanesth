# Modélisation des Consultations dans Mathildanesth

## Contexte

Les consultations médicales représentent un type d'activité spécifique pour le personnel médical, qui diffère des activités de bloc opératoire ou des gardes/astreintes. Contrairement au bloc opératoire qui est lié à un lieu physique (une salle), les consultations sont considérées comme des affectations temporelles, divisées en créneaux matin et après-midi.

## Approche retenue

Nous avons fait le choix de modéliser les consultations comme un type d'affectation spécifique, similaire à un autre type d'activité comme les gardes et astreintes. Les consultations peuvent être attribuées individuellement à plusieurs médecins sur le même créneau horaire, chacun ayant sa propre "ligne" d'affectation.

## Modèle de données

### 1. Schema Prisma

Nous utilisons le modèle `Assignment` existant, avec les spécificités suivantes pour les consultations :

```prisma
model Assignment {
  // ... autres champs existants
  type          String // Valeur "CONSULTATION" pour ce cas d'usage
  period        Period? // MATIN, APRES_MIDI ou JOURNEE_ENTIERE
  // ... autres champs existants
}

enum Period {
  MATIN
  APRES_MIDI
  JOURNEE_ENTIERE
}
```

### 2. Types d'activités

Un type d'activité "CONSULTATION" est défini dans le modèle `ActivityType` :

```prisma
model ActivityType {
  // ... autres champs existants
  name          String           // Ex: "Consultation Anesthésie"
  code          String           // Ex: "CONSULT_ANESTH"
  category      ActivityCategory // Valeur "CONSULTATION"
  // ... autres champs existants
}

enum ActivityCategory {
  BLOC_OPERATOIRE
  CONSULTATION
  GARDE
  ASTREINTE
  // ... autres valeurs
}
```

## Caractéristiques principales

1. **Indépendance du lieu** : Les consultations ne sont pas obligatoirement liées à un lieu physique spécifique (contrairement au bloc opératoire)
2. **Créneaux temporels** : Division en périodes MATIN et APRES_MIDI, ou éventuellement JOURNEE_ENTIERE
3. **Affectations individuelles** : Chaque médecin a sa propre affectation de consultation, même si plusieurs consultations peuvent avoir lieu sur le même créneau
4. **Intégration dans le planning existant** : Les consultations s'intègrent dans le planning global avec les autres types d'activités

## Avantages de cette approche

- **Simplicité** : Réutilisation du modèle d'affectation existant sans nécessiter de structure complexe
- **Flexibilité** : Possibilité d'avoir un nombre illimité de consultations simultanées sur le même créneau
- **Cohérence** : Toutes les activités médicales sont modélisées comme des affectations, facilitant la visualisation globale des plannings

## Implémentation technique

Pour implémenter des consultations, vous pouvez utiliser le modèle `Assignment` avec les caractéristiques suivantes :
- `type` = "CONSULTATION"
- `period` = "MATIN", "APRES_MIDI" ou "JOURNEE_ENTIERE"
- `userId` = ID du médecin
- `date` = Date de la consultation

### Exemple de code

```javascript
// Créer une consultation du matin pour un médecin
await prisma.assignment.create({
  data: {
    date: new Date('2025-05-25'),
    userId: 1,
    type: 'CONSULTATION',
    period: 'MATIN',
    notes: 'Consultation programmée',
    heureDebut: '08:30',
    heureFin: '12:30',
    statut: 'PREVU'
  }
});
```

## Considérations pour l'interface utilisateur

Dans l'interface, les consultations devraient :
1. Être clairement identifiables comme distinctes des activités de bloc
2. Être regroupées par créneau (matin/après-midi) dans les vues de planning
3. Permettre une visualisation du nombre de médecins en consultation simultanément
4. Offrir la possibilité de filtrer par type de consultation ou par médecin

## Évolutions futures possibles

- Ajout de sous-types de consultations (pré-opératoire, suivi, etc.)
- Possibilité de définir des quotas (nombre maximum de consultations simultanées)
- Intégration d'indicateurs de charge (nombre de patients prévus)
- Statistiques sur l'activité de consultation par médecin ou par période 