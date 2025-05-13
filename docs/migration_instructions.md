# Instructions de Migration et d'Intégration

Ce document détaille les étapes à suivre pour implémenter les améliorations du service `BlocPlanningService` et résoudre les problèmes de typage.

## 1. Migration Prisma

### Étape 1: Ajouter les nouveaux champs au schéma Prisma

Modifiez le fichier `prisma/schema.prisma` pour ajouter les champs suivants :

```prisma
model OperatingSector {
  // ... champs existants
  category String?
  // ... autres champs
}

model OperatingRoom {
  // ... champs existants
  type String?
  // ... autres champs
}
```

### Étape 2: Créer et appliquer la migration

```bash
# Option 1: Si vous souhaitez utiliser notre SQL personnalisé
npx prisma migrate dev --create-only --name add_sector_category_and_room_type
# Puis éditez le fichier de migration généré et remplacez-le par notre SQL
# Puis exécutez:
npx prisma migrate dev

# Option 2: Migration automatique
npx prisma migrate dev --name add_sector_category_and_room_type
```

### Étape 3: Génération du client Prisma

```bash
npx prisma generate
```

## 2. Configuration des Tests

### Étape 1: Assurez-vous que Jest est correctement configuré

Modifiez `jest.config.js` pour inclure les tests des modules bloc-operatoire :

```js
// Dans la section moduleNameMapper:
'^@/modules/planning/bloc-operatoire/(.*)$': '<rootDir>/src/modules/planning/bloc-operatoire/$1',
```

### Étape 2: Exécuter les tests

```bash
npm run test -- --testPathPattern=src/modules/planning/bloc-operatoire
```

## 3. Utilisation dans l'Application

### API pour les Types de Secteurs et de Salles

Ajoutez des valeurs constantes pour les types de secteur et de salle :

```typescript
// src/modules/planning/bloc-operatoire/constants/sectorTypes.ts
export const SECTOR_TYPES = {
  STANDARD: 'STANDARD',
  HYPERASEPTIQUE: 'HYPERASEPTIQUE',
  OPHTALMOLOGIE: 'OPHTALMOLOGIE',
  ENDOSCOPIE: 'ENDOSCOPIE'
};

// src/modules/planning/bloc-operatoire/constants/roomTypes.ts
export const ROOM_TYPES = {
  STANDARD: 'STANDARD',
  FIV: 'FIV',
  CONSULTATION: 'CONSULTATION'
};
```

### Interface d'Administration pour les Catégories et Types

Dans le panneau d'administration des secteurs et salles, ajoutez des sélecteurs pour les catégories et types :

```jsx
// Exemple pour l'édition d'un secteur
<FormControl>
  <FormLabel>Catégorie du secteur</FormLabel>
  <Select
    value={sectorData.category || 'STANDARD'}
    onChange={(e) => setSectorData({...sectorData, category: e.target.value})}
  >
    <option value="STANDARD">Standard</option>
    <option value="HYPERASEPTIQUE">Hyperaseptique</option>
    <option value="OPHTALMOLOGIE">Ophtalmologie</option>
    <option value="ENDOSCOPIE">Endoscopie</option>
  </Select>
</FormControl>

// Exemple pour l'édition d'une salle
<FormControl>
  <FormLabel>Type de salle</FormLabel>
  <Select
    value={roomData.type || 'STANDARD'}
    onChange={(e) => setRoomData({...roomData, type: e.target.value})}
  >
    <option value="STANDARD">Standard</option>
    <option value="FIV">FIV</option>
    <option value="CONSULTATION">Consultation</option>
  </Select>
</FormControl>
```

## 4. Configuration des Règles de Secteur

### Via l'Interface Utilisateur

Ajoutez une section dans l'interface d'administration des secteurs pour configurer les règles JSON :

```jsx
<FormControl>
  <FormLabel>Configuration avancée</FormLabel>
  <Accordion>
    <AccordionItem>
      <AccordionButton>Règles de contiguïté</AccordionButton>
      <AccordionPanel>
        <Switch
          isChecked={sectorRules.requireContiguousRooms}
          onChange={() => setSectorRules({
            ...sectorRules,
            requireContiguousRooms: !sectorRules.requireContiguousRooms
          })}
        >
          Exiger des salles contiguës
        </Switch>
        
        {/* Interface pour configurer contiguityMap */}
        {/* ... */}
      </AccordionPanel>
    </AccordionItem>
    
    <AccordionItem>
      <AccordionButton>Règles spécifiques</AccordionButton>
      <AccordionPanel>
        <FormControl>
          <FormLabel>Nombre minimum d'IADEs par salle</FormLabel>
          <NumberInput
            value={sectorRules.minIADEPerRoom || 0}
            onChange={(valueString) => setSectorRules({
              ...sectorRules,
              minIADEPerRoom: parseInt(valueString) || 0
            })}
            min={0}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>
      </AccordionPanel>
    </AccordionItem>
  </Accordion>
</FormControl>
```

## 5. Prochaines Étapes

1. Compléter l'implémentation de `createOrUpdateBlocDayPlanningsFromTrames`
2. Implémenter la gestion des différents types d'affectation (BLOC, CONSULTATION, GARDE, ASTREINTE)
3. Écrire des tests unitaires pour toutes les règles de validation (R1-R8)
4. Développer les endpoints API pour les opérations CRUD sur `BlocDayPlanning`
5. Optimiser les requêtes Prisma pour réduire le nombre d'appels à la base de données

## 6. Résolution des Problèmes Connus

### Erreurs de Linter sur `sector.rules`

Après l'application du parser, si des erreurs de linter persistent concernant l'accès aux propriétés de `sector.rules`, vérifiez que :

1. Le module `sectorRulesParser.ts` est correctement importé
2. La fonction `getSectorRules` est utilisée avant d'accéder à une propriété
3. Le typage de retour de `getSectorRules` est correct

### Absence de Typages pour les Nouveaux Champs

Si TypeScript ne reconnaît pas les nouveaux champs `category` et `type` :

1. Vérifiez que `prisma generate` a bien été exécuté après la migration
2. Assurez-vous que les imports de Prisma Client sont à jour
3. Si nécessaire, redémarrez l'IDE/le serveur TypeScript 

# Instructions de Migration pour les Types de Secteurs et Salles

Ce document décrit les étapes nécessaires pour mettre en œuvre la migration des types de secteurs et de salles dans l'application.

## 1. Migration de la Base de Données

### Étape 1: Exécution de la Migration Prisma

Une migration Prisma a déjà été créée pour ajouter les champs suivants :
- `category` dans le modèle `OperatingSector`
- `type` dans le modèle `OperatingRoom`

Pour appliquer cette migration :

```bash
npx prisma migrate dev
```

### Étape 2: Mise à jour du Client Prisma

Assurez-vous que le client Prisma est régénéré après la migration :

```bash
npx prisma generate
```

## 2. Configuration des Constants

### Étape 1: Constants pour les Types de Secteurs et Salles

Les fichiers de constantes ont été créés dans le répertoire suivant :
- `src/modules/planning/bloc-operatoire/constants/`

Ces fichiers définissent :
- `SECTOR_CATEGORY_TYPES` : Types de secteurs (STANDARD, HYPERASEPTIQUE, OPHTALMOLOGIE, ENDOSCOPIE)
- `ROOM_TYPES` : Types de salles (STANDARD, FIV, CONSULTATION)

### Étape 2: Tests Unitaires pour le Parser de Règles

Un test unitaire a été créé pour vérifier que le parser de règles de secteur fonctionne correctement :
- `src/modules/planning/bloc-operatoire/utils/sectorRulesParser.test.ts`

Pour exécuter ce test :

```bash
npm run test -- src/modules/planning/bloc-operatoire/utils/sectorRulesParser.test.ts
```

## 3. Mise à jour de l'Interface Utilisateur

### Étape 1: Formulaire des Secteurs

Le formulaire de création/édition des secteurs a été mis à jour pour inclure un sélecteur de catégorie :
- `src/app/parametres/configuration/SectorsConfigPanel.tsx`

### Étape 2: Formulaire des Salles

Le formulaire de création/édition des salles a été mis à jour pour inclure un sélecteur de type de salle :
- `src/app/parametres/configuration/OperatingRoomsConfigPanel.tsx`

## 4. Mise à jour des Services

### Étape 1: Parser de Règles de Secteur

Un module a été créé pour extraire les propriétés de `sector.rules` de manière typée et sécurisée :
- `src/modules/planning/bloc-operatoire/utils/sectorRulesParser.ts`

### Étape 2: Service de Planning du Bloc Opératoire

Le service de planning du bloc opératoire a été mis à jour pour utiliser les nouveaux champs :
- `src/modules/planning/bloc-operatoire/services/blocPlanningService.ts`

### Étape 3: Modification des Contrôleurs API

Étapes à suivre pour mettre à jour les API :

1. Mettez à jour les routes API pour les secteurs :
   - `src/app/api/sectors/route.ts`
   - `src/app/api/sectors/[id]/route.ts`

2. Mettez à jour les routes API pour les salles :
   - `src/app/api/operating-rooms/route.ts`
   - `src/app/api/operating-rooms/[id]/route.ts`

## 5. Tests et Validation

### Étape 1: Tests Fonctionnels

Vérifiez les fonctionnalités suivantes :

1. Création/édition de secteurs avec catégorie
2. Création/édition de salles avec type
3. Filtrage des salles par type
4. Validation des règles de supervision par catégorie de secteur

### Étape 2: Migration des Données Existantes

Pour les données existantes, un script de migration peut être nécessaire pour :
1. Analyser les noms de secteurs existants et déterminer leur catégorie
2. Analyser les noms de salles existantes et déterminer leur type
3. Mettre à jour les enregistrements en base de données

## 6. Problèmes Connus et Solutions

### Type Checking

Avec la nouvelle structure, certaines erreurs de typage peuvent apparaître dans le code existant. Pour les résoudre :

1. Utilisez le parser de règles pour extraire de manière sûre les propriétés :
   ```typescript
   import { getSectorRules } from '@/modules/planning/bloc-operatoire/utils/sectorRulesParser';
   const sectorRules = getSectorRules(sector.rules);
   // Accédez aux propriétés via sectorRules.requireContiguousRooms, etc.
   ```

2. Utilisez un type garde pour vérifier la présence des propriétés avant d'y accéder

### Compatibilité Ascendante

Pour maintenir la compatibilité avec le code existant :

1. La fonction `getSectorTypeFromName()` reste disponible pour la période de transition
2. Les fonctions `areRoomsContiguous()` et `areAllRoomsConnected()` sont compatibles avec les anciennes structures de données

## 7. Prochaines Étapes

Pour finaliser complètement l'implémentation :

1. Mettre à jour les API CRUD pour inclure les nouveaux champs
2. Développer des filtres par catégorie de secteur et type de salle dans l'interface utilisateur
3. Implémenter des règles métier spécifiques pour chaque type de secteur/salle
4. Migrer toutes les références au type détecté par le nom vers le champ `category`
5. Ajouter des contrôles de validation dans l'API pour vérifier que les catégories et types sont valides 