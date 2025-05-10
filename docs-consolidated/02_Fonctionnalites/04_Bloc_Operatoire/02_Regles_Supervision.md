# Règles de Supervision

## 1. Vue d'ensemble

Les règles de supervision constituent un élément critique pour la planification du bloc opératoire. Elles définissent les conditions dans lesquelles les médecins anesthésistes (MARs) peuvent superviser plusieurs salles simultanément, en fonction de nombreux facteurs : secteur, spécialité, niveau d'expérience et configuration d'équipe.

## 2. Principes des règles de supervision

Les principes fondamentaux qui guident la supervision au bloc opératoire sont :

1. **Sécurité patient** : Garantir une prise en charge anesthésique optimale
2. **Respect des compétences** : Assurer que les superviseurs ont l'expertise nécessaire
3. **Viabilité opérationnelle** : Permettre une organisation efficace des ressources
4. **Flexibilité contrôlée** : Adapter les règles selon les besoins avec des garde-fous

## 3. Modèle de Données et Stockage des Règles

Les règles de supervision peuvent être stockées de plusieurs manières, combinant des configurations globales et des spécificités par salle ou secteur.

- **Configuration Générale des Règles** : Les règles fondamentales de supervision, notamment celles qui pourraient s'appliquer à plusieurs secteurs ou avoir une portée globale, peuvent être gérées via le [Moteur de Règles général](../../03_Planning_Generation/01_Moteur_Regles.md). Cela permet une gestion centralisée et l'utilisation de l'interface d'administration des règles (`src/app/admin/schedule-rules/`).

- **Règles Spécifiques par Salle/Secteur** :
  - Le modèle `OperatingRoom` dans `prisma/schema.prisma` dispose d'un champ **`supervisionRules` (Json)**. Ce champ est idéal pour stocker des paramètres de supervision spécifiques à une salle donnée (ex: nombre max de salles par MAR pour cette salle précise si elle a des particularités, compétences spécifiques requises pour opérer dans cette salle).
  - De même, le modèle `OperatingSector` pourrait être étendu pour inclure un champ similaire si des règles s'appliquent uniformément à tout un secteur mais diffèrent d'autres secteurs.
  - L'interface d'administration du bloc opératoire (`src/app/admin/bloc-operatoire/regles-supervision/page.tsx` ou via `OperatingRoomsConfigPanel.tsx`) permettrait de gérer ces configurations JSON spécifiques.

L'exemple de code TypeScript ci-dessous illustre une conceptualisation des règles et configurations, qui pourrait être alimentée par ces différentes sources :

```typescript
// Règle de supervision par secteur
interface SupervisionRule {
  id: string;
  sectorId: string;
  name: string;
  description?: string;

  // Paramètres de supervision
  maxRoomsPerMAR: number; // Nombre maximum de salles par MAR en temps normal
  maxRoomsExceptional: number; // Nombre maximum en situation exceptionnelle
  requiresSpecialty: boolean; // Nécessite une spécialité spécifique
  internalSupervisionAllowed: boolean; // Permet supervision interne (sans présence physique)

  // Contraintes par spécialité
  specialtyRequirements: Record<string, boolean>; // Spécialités requérant expertise

  // Méta-information
  priority: number; // Priorité pour résolution de conflits
  isActive: boolean; // Règle active ou non
  createdAt: Date;
  updatedAt: Date;
}

// Configuration de supervision pour une journée/salle
interface SupervisionConfiguration {
  date: Date;
  sectorId: string;
  roomIds: string[];
  supervisorId: string;
  isExceptional: boolean;
  justification?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 4. Fonctionnalités Implémentées

### Configuration des règles de supervision

L'administrateur peut configurer des règles spécifiques à chaque secteur via une interface dédiée :

- **Définition du nombre maximum de salles** par superviseur
- **Configuration des cas exceptionnels** avec justification obligatoire
- **Spécification des contraintes par spécialité**
- **Activation/désactivation** des règles selon les besoins

### Validation des configurations

Le système vérifie automatiquement la validité des configurations de supervision :

```typescript
// Service de validation
export class SupervisionValidator {
  // Valide une configuration de supervision pour une journée
  validateDaySupervision(
    date: Date,
    sectorId: string,
    roomIds: string[],
    supervisorId: string,
    isExceptional: boolean = false
  ): ValidationResult {
    // Récupérer la règle applicable pour ce secteur
    const rule = this.getRuleForSector(sectorId);

    if (!rule) {
      return {
        isValid: false,
        errors: [
          {
            code: 'NO_RULE_FOUND',
            message: `Aucune règle de supervision définie pour le secteur ${sectorId}`,
          },
        ],
      };
    }

    // Vérifier le nombre de salles
    const maxRooms = isExceptional ? rule.maxRoomsExceptional : rule.maxRoomsPerMAR;

    if (roomIds.length > maxRooms) {
      return {
        isValid: false,
        errors: [
          {
            code: 'TOO_MANY_ROOMS',
            message: `Le nombre maximum de salles autorisé est de ${maxRooms} (${roomIds.length} demandées)`,
          },
        ],
      };
    }

    // Vérifier les spécialités si requis
    if (rule.requiresSpecialty) {
      const supervisor = this.userService.getUserById(supervisorId);
      const roomsWithSpecialties = this.roomService.getRoomsWithSpecialties(roomIds);

      for (const room of roomsWithSpecialties) {
        if (
          room.specialties.some(s => rule.specialtyRequirements[s]) &&
          !supervisor.specialties.includes(room.specialty)
        ) {
          return {
            isValid: false,
            errors: [
              {
                code: 'SPECIALTY_REQUIRED',
                message: `La supervision de la salle ${room.name} nécessite la spécialité ${room.specialty} que le superviseur ne possède pas`,
              },
            ],
          };
        }
      }
    }

    return { isValid: true };
  }

  // Valide toute la configuration de supervision d'un planning
  validatePlanningSupervision(planningId: string): PlanningValidationResult {
    const planning = this.planningService.getPlanningById(planningId);
    const validationResults: RoomValidationResult[] = [];

    for (const day of planning.days) {
      for (const sector of day.sectors) {
        // Regrouper les salles par superviseur
        const supervisorRooms: Record<string, string[]> = {};

        for (const room of sector.rooms) {
          if (room.supervisorId) {
            if (!supervisorRooms[room.supervisorId]) {
              supervisorRooms[room.supervisorId] = [];
            }
            supervisorRooms[room.supervisorId].push(room.id);
          }
        }

        // Valider chaque configuration de supervision
        for (const [supervisorId, roomIds] of Object.entries(supervisorRooms)) {
          const result = this.validateDaySupervision(
            day.date,
            sector.id,
            roomIds,
            supervisorId,
            sector.isExceptional
          );

          if (!result.isValid) {
            validationResults.push({
              date: day.date,
              sectorId: sector.id,
              supervisorId,
              roomIds,
              isValid: false,
              errors: result.errors,
            });
          }
        }
      }
    }

    return {
      isValid: validationResults.length === 0,
      validationResults,
    };
  }
}
```

### Application dans le planning hebdomadaire

Les règles de supervision sont activement appliquées dans l'interface de planning hebdomadaire (`src/app/planning/hebdomadaire/page.tsx` et `src/app/bloc-operatoire/planning/`).

## 5. Exemples de Règles Spécifiques par Secteur (issues de la configuration JSON ou du moteur de règles)

Les règles de supervision varient selon les secteurs et reflètent les pratiques médicales. Ces exemples illustrent des configurations typiques :

### Secteur Hyperaseptique (Salles 1-4)

- **Maximum 2 salles** par MAR
- **Supervision interne non autorisée**
- **Expertise requise** pour chirurgies complexes
- **Maximum exceptionnel : 3 salles** avec validation chef de service

### Secteur Standard (Salles 5-8)

- **Maximum 3 salles** par MAR
- **Supervision interne autorisée** pour certaines interventions
- **Limitation à 2 salles** pour interventions de plus de 3h
- **Maximum exceptionnel : 4 salles** avec double validation

### Secteur Ophtalmo

- **Maximum 4 salles** par MAR
- **Supervision interne autorisée**
- **Expertise spécifique requise**
- **Maximum exceptionnel : 5 salles**

### Secteur Endoscopie

- **Maximum 4 salles** par MAR avec IADE expérimenté
- **Maximum 3 salles** sinon
- **Supervision interne préférentielle**
- **Maximum exceptionnel : 5 salles**

## 6. Interface d'administration

Une interface dédiée (`src/app/admin/bloc-operatoire/regles-supervision/page.tsx`) permet la configuration des règles de supervision spécifiques au bloc. Pour les règles plus générales, l'interface du [Moteur de Règles](../../03_Planning_Generation/01_Moteur_Regles.md) est utilisée.

- **Page d'administration spécifique bloc** : `/admin/bloc-operatoire/regles-supervision`

## 7. État actuel et perspectives

### Implémentation actuelle

- **Statut** : Implémenté (V1)
- **Localisation** :
  - `src/app/admin/bloc-operatoire/regles-supervision/page.tsx`
  - `src/services/supervisionRuleService.ts`
  - `src/modules/planning/bloc-operatoire/SupervisionValidator.ts`

### Prochaines étapes

1. **Règles dynamiques avancées**

   - Intégration plus poussée avec le [Moteur de Règles général](../../03_Planning_Generation/01_Moteur_Regles.md)
   - Configuration temporelle (règles spécifiques à certaines périodes)
   - Règles conditionnelles basées sur l'expérience des IADEs

2. **Analyse d'impact**

   - Simulation des changements de règles
   - Visualisation de l'impact sur la planification
   - Historique comparatif

3. **Interface optimisée**

   - Formulaire plus intuitif
   - Assistants de configuration
   - Suggestions basées sur les statistiques

4. **Pilotage par données**
   - Utilisation des données historiques pour affiner les règles
   - Détection automatique des situations exceptionnelles fréquentes
   - Recommandations d'optimisation
