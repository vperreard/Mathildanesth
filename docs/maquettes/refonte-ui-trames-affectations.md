# Maquettes pour la Refonte UI des Trames et Affectations

## Inspiration : Planning Hebdomadaire Existant

En analysant l'UI existante du planning hebdomadaire (`/planning/hebdomadaire`), nous pouvons identifier plusieurs éléments bien conçus à réutiliser :

1. **Structure en grille** avec les jours en colonnes et les salles/postes en lignes
2. **Code couleur intuitif** pour différencier les types d'affectation
3. **Fonctionnalités de glisser-déposer** déjà présentes avec `react-beautiful-dnd`
4. **Gestion des règles et violations** pour la validation des affectations

## 1. Vue Calendrier des Trames

### Maquette 1.1 : Vue Principale de la Trame

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Trame : [Nom de la Trame] ▼                                                 │
├─────────┬──────────────────┬──────────────────┬──────────────────┬──────────┤
│         │     LUNDI        │      MARDI       │    MERCREDI      │  JEUDI   │
├─────────┼─────────┬────────┼─────────┬────────┼─────────┬────────┼──────────┤
│         │  MATIN  │ AP-MIDI│  MATIN  │ AP-MIDI│  MATIN  │ AP-MIDI│   ...    │
├─────────┼─────────┼────────┼─────────┼────────┼─────────┼────────┼──────────┤
│ Salle 1 │  [MAR]  │ [MAR]  │ [FERMÉ] │ [FERMÉ]│  [MAR]  │ [MAR]  │   ...    │
│         │ [CHIR]  │ [CHIR] │         │        │  [CHIR] │ [CHIR] │          │
│         │ [IADE]  │ [IADE] │         │        │  [IADE] │ [IADE] │          │
├─────────┼─────────┼────────┼─────────┼────────┼─────────┼────────┼──────────┤
│ Salle 2 │  [MAR]  │ [MAR]  │  [MAR]  │ [MAR]  │  [MAR]  │ [MAR]  │   ...    │
│         │         │        │  [CHIR] │ [CHIR] │         │        │          │
│         │         │        │  [IADE] │ [IADE] │         │        │          │
├─────────┼─────────┼────────┼─────────┼────────┼─────────┼────────┼──────────┤
│   ...   │   ...   │  ...   │   ...   │  ...   │   ...   │  ...   │   ...    │
└─────────┴─────────┴────────┴─────────┴────────┴─────────┴────────┴──────────┘
```

### Maquette 1.2 : Options de Vue et Filtres

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Filtres: □ Toutes semaines ☑ Semaines paires ☐ Semaines impaires           │
│          ☑ Afficher personnel habituel                                      │
│          ☐ Mode compact                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Interface de Création/Édition des Trames

### Maquette 2.1 : Assistant en Étapes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Étape 1/3 : Définition de la Trame                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Nom de la trame : [_____________________________________________]           │
│ Description     : [_____________________________________________]           │
│                                                                             │
│ Site            : [Site Principal ▼]                                        │
│                                                                             │
│ Type de semaine : ○ Toutes semaines ● Semaines paires ○ Semaines impaires  │
│                                                                             │
│ Période validité: Du [01/06/2025] au [31/12/2025]                          │
│                                                                             │
│ Jours actifs    : ☑ Lun ☑ Mar ☑ Mer ☑ Jeu ☑ Ven ☐ Sam ☐ Dim               │
│                                                                             │
│                    [Annuler]       [Suivant →]                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Maquette 2.2 : Configuration des Salles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Étape 2/3 : Configuration des Salles                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Configuration par défaut : ● Ouvertes ○ Fermées                             │
│                                                                             │
│ ┌────────────────────────────────────────────────────────────────────────┐  │
│ │ Salles                             │ Statut                            │  │
│ ├──────────────────────────────────────────────────────────────────────┬─┤  │
│ │ ☑ Salle 1                          │ [Ouverte ▼]                     │+│  │
│ │ ☑ Salle 2                          │ [Ouverte ▼]                     │ │  │
│ │ ☐ Salle 3                          │ [Fermée ▼]                      │-│  │
│ │ ☑ Salle 4                          │ [Ouverte ▼]                     │ │  │
│ └────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ Variations (jours spécifiques) :                                            │
│ [+ Ajouter une variation]                                                   │
│                                                                             │
│                    [← Précédent]     [Suivant →]                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Maquette 2.3 : Affectation du Personnel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Étape 3/3 : Affectation du Personnel                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌───────┬─────────────────────────────────────────────────────────────────┐ │
│ │ Salle │ Lundi                  │ Mardi                  │ ...           │ │
│ │       │ Matin    │ Après-midi  │ Matin    │ Après-midi  │               │ │
│ ├───────┼──────────┼─────────────┼──────────┼─────────────┼───────────────┤ │
│ │ S1    │ MAR: [__▼] MAR: [__▼]  │ MAR: [__▼] MAR: [__▼]  │               │ │
│ │       │ CHIR:[__▼] CHIR:[__▼]  │ CHIR:[__▼] CHIR:[__▼]  │               │ │
│ │       │ IADE:[__▼] IADE:[__▼]  │ IADE:[__▼] IADE:[__▼]  │               │ │
│ ├───────┼──────────┼─────────────┼──────────┼─────────────┼───────────────┤ │
│ │ S2    │ MAR: [__▼] MAR: [__▼]  │ MAR: [__▼] MAR: [__▼]  │               │ │
│ │       │ CHIR:[__▼] CHIR:[__▼]  │ CHIR:[__▼] CHIR:[__▼]  │               │ │
│ │       │ IADE:[__▼] IADE:[__▼]  │ IADE:[__▼] IADE:[__▼]  │               │ │
│ └───────┴──────────┴─────────────┴──────────┴─────────────┴───────────────┘ │
│                                                                             │
│                    [← Précédent]     [Enregistrer]                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3. Interface de Gestion des Gardes et Astreintes

### Maquette 3.1 : Vue Spécifique Gardes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Affectations : [Gardes ▼]     Semaine : [12/05/2025-18/05/2025 ▼]           │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────┬───────────┬───────────┬───────────┬───────────┬───────────┬───┐ │
│ │ Personnel │   Lundi   │   Mardi   │ Mercredi  │  Jeudi    │ Vendredi  │...│ │
│ ├───────────┼───────────┼───────────┼───────────┼───────────┼───────────┼───┤ │
│ │ Garde 1   │ Dr Martin │ Dr Dupont │ Dr Martin │ Dr Mercier│ Dr Petit  │...│ │
│ │ sénior    │  [24h]    │   [24h]   │   [24h]   │   [24h]   │   [24h]   │   │ │
│ ├───────────┼───────────┼───────────┼───────────┼───────────┼───────────┼───┤ │
│ │ Garde 1   │ Dr Klein  │ Dr Robert │ Dr Lambert│ Dr Thomas │ Dr Dubois │...│ │
│ │ junior    │  [24h]    │   [24h]   │   [24h]   │   [24h]   │   [24h]   │   │ │
│ ├───────────┼───────────┼───────────┼───────────┼───────────┼───────────┼───┤ │
│ │ Astreinte │ Dr Bernard│ Dr Leroy  │ Dr Moreau │ Dr Simon  │ Dr Laurent│...│ │
│ │ SSPI      │  [24h]    │   [24h]   │   [24h]   │   [24h]   │   [24h]   │   │ │
│ ├───────────┼───────────┼───────────┼───────────┼───────────┼───────────┼───┤ │
│ │   ...     │    ...    │    ...    │    ...    │    ...    │    ...    │...│ │
│ └───────────┴───────────┴───────────┴───────────┴───────────┴───────────┴───┘ │
│                                                                             │
│ Légende: [24h] Garde 24h   [R] Repos post-garde                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 4. Interface pour les Chirurgiens au Bloc

### Maquette 4.1 : Vue Chirurgiens/Salles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Vue Chirurgiens │ Semaine : 25 (17/06/2025 - 21/06/2025)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────┬───────────┬───────────┬───────────┬───────────┬───────────────┐ │
│ │ Salle     │   Lundi   │   Mardi   │ Mercredi  │  Jeudi    │ Vendredi      │ │
│ │           │ AM │ PM   │ AM │ PM   │ AM │ PM   │ AM │ PM   │ AM  │ PM      │ │
│ ├───────────┼────┼──────┼────┼──────┼────┼──────┼────┼──────┼─────┼─────────┤ │
│ │ Salle 1   │ Dr │ Dr   │ Dr │ Dr   │ Dr │ Dr   │ Dr │ Dr   │ Dr  │ Dr      │ │
│ │ (Ortho)   │ A  │ A    │ B  │ B    │ C  │ C    │ A  │ A    │ B   │ B       │ │
│ ├───────────┼────┼──────┼────┼──────┼────┼──────┼────┼──────┼─────┼─────────┤ │
│ │ Salle 2   │ Dr │ Dr   │ Dr │ Dr   │ Dr │ Dr   │ Dr │ Dr   │ Dr  │ Dr      │ │
│ │ (Digestif)│ X  │ X    │ Y  │ Y    │ X  │ X    │ Z  │ Z    │ Y   │ Y       │ │
│ ├───────────┼────┼──────┼────┼──────┼────┼──────┼────┼──────┼─────┼─────────┤ │
│ │   ...     │ .. │ ..   │ .. │ ..   │ .. │ ..   │ .. │ ..   │ ..  │ ..      │ │
│ └───────────┴────┴──────┴────┴──────┴────┴──────┴────┴──────┴─────┴─────────┘ │
│                                                                             │
│ Actions: [+ Ajouter] [✏ Éditer] [🔄 Rafraîchir] [💾 Enregistrer]            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 5. Variations et Périodes Spécifiques

### Maquette 5.1 : Configuration des Variations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Variations pour la Trame "Bloc Orthopédie" (Semaines paires)                │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │ Nom           │ Type          │ Période                │ Action       │   │
│ ├───────────────┼───────────────┼──────────────────────┬┼──────────────┤   │
│ │ Été 2025      │ Jours fixes   │ 01/07/2025-31/08/2025││ [Éditer] [✖] │   │
│ │ Noël 2025     │ Vacances scol.│ Zone C - Hiver       ││ [Éditer] [✖] │   │
│ │ Fermeture S1  │ Jours semaine │ Tous les vendredis   ││ [Éditer] [✖] │   │
│ └───────────────┴───────────────┴──────────────────────┴┴──────────────┘   │
│                                                                             │
│ [+ Ajouter une variation]      [Prévisualiser l'impact]                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 6. Menu Contextuel et Actions Rapides

### Maquette 6.1 : Menu Contextuel sur Affectation

```
┌─────────────────────────────────────────────────────────┐
│ Dr Dupont - Salle 1 - Lundi matin                       │
├─────────────────────────────────────────────────────────┤
│ ✓ Étendre à la journée complète                         │
│ ✓ Copier l'affectation                                  │
│ ✓ Coller l'affectation                                  │
│ ─────────────────────────────────────────────────────── │
│ ✓ Remplacer par...                                      │
│ ✓ Fermer la salle                                       │
│ ✓ Modifier le rôle (Anesthésie → Supervision)           │
│ ─────────────────────────────────────────────────────── │
│ ✓ Appliquer à toutes les semaines du même type          │
│ ✓ Créer une règle pour cette personne                   │
└─────────────────────────────────────────────────────────┘
```

## 7. Code Couleur et Légende

```
┌─────────────────────────────────────────────────────────┐
│ Légende                                                 │
├─────────────────────────────────────────────────────────┤
│ ■ Vert        : Salle ouverte, affectation complète     │
│ ■ Orange      : Salle ouverte, affectation incomplète   │
│ ■ Rouge       : Salle fermée                            │
│ ■ Bleu clair  : Vacation matin                          │
│ ■ Jaune       : Vacation après-midi                     │
│ ■ Violet      : Vacation journée entière                │
│ ■ Gris        : Repos post-garde                        │
└─────────────────────────────────────────────────────────┘
```

## Notes d'implémentation

1. Réutiliser l'infrastructure de glisser-déposer existante (`react-beautiful-dnd`)
2. S'appuyer sur les composants UI existants (buttons, cards, dialog, badge)
3. Adapter le système de validation des règles pour les trames et affectations
4. Intégrer la visualisation en calendrier en reprenant le code de la vue hebdomadaire
5. Développer de nouveaux composants pour l'assistant en étapes et les variations
</rewritten_file> 