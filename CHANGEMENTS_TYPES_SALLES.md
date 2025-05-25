# Modification des Types de Salles - Documentation

## 📋 Résumé des changements

### Types supprimés
- ❌ **Septique** - Remplacé par Aseptique
- ❌ **Ambulatoire** - Supprimé selon demande
- ❌ **Spécialisée** - Supprimé selon demande
- ❌ **Urgence** - Remplacé par Garde
- ❌ **FIV** - Supprimé (type obsolète)

### Types conservés
- ✅ **Standard** - Inchangé
- ✅ **Aseptique** - Conservé (était déjà présent)
- ✅ **Endoscopie** - Inchangé
- ✅ **Consultation** - Inchangé

### Nouveaux types ajoutés
- ✨ **Garde** - Nouveau type pour les salles de garde
- ✨ **Astreinte** - Nouveau type pour les salles d'astreinte

## 📁 Fichiers modifiés

### 1. Configuration principale
- `src/app/parametres/configuration/OperatingRoomsConfigPanel.tsx`
  - Mise à jour de `ROOM_TYPE_OPTIONS` avec les nouveaux types

### 2. Constantes
- `src/modules/planning/bloc-operatoire/constants/roomTypes.ts`
  - Mise à jour de `ROOM_TYPES` et `ROOM_TYPE_LABELS`
  - Ajout des nouveaux types avec leurs libellés

### 3. Règles métier
- `src/modules/planning/bloc-operatoire/services/sectorTypeRules.ts`
  - Suppression des règles pour type FIV
  - Ajout des règles pour les nouveaux types :
    - **Aseptique** : Supervision dédiée, 6 patients/jour, 75min/procédure
    - **Endoscopie** : Supervision dédiée, 10 patients/jour, 45min/procédure
    - **Garde** : Supervision dédiée, 6 patients/jour, 90min/procédure
    - **Astreinte** : Pas de supervision dédiée, 4 patients/jour, 120min/procédure
  - Mise à jour des types autorisés par secteur

### 4. Services
- `src/modules/planning/bloc-operatoire/services/blocPlanningService.ts`
  - Remplacement de la logique FIV par les nouveaux types spéciaux
  - Mise à jour des messages d'erreur

### 5. Tests
- `src/modules/analytics/services/analyticsService.test.ts`
  - Remplacement du type FIV par ASEPTIQUE dans les tests

## 🔧 Impact sur les règles de planning

### Règles par type de salle :

| Type | Supervision dédiée | Max patients/jour | Durée moy. | Spécialités autorisées |
|------|-------------------|-------------------|------------|----------------------|
| Standard | Non | 8 | 60min | Toutes |
| Aseptique | Oui | 6 | 75min | Toutes (avec conditions) |
| Endoscopie | Oui | 10 | 45min | Gastro, Pneumo, Uro |
| Garde | Oui | 6 | 90min | Toutes (mode garde) |
| Astreinte | Non | 4 | 120min | Toutes (support) |
| Consultation | Non | 15 | 30min | Toutes |

### Compatibilité avec les secteurs :
- **Standard** : Compatible avec Garde et Astreinte
- **Hyperaseptique** : Compatible avec type Aseptique
- **Endoscopie** : Compatible avec type Endoscopie
- **Ophtalmologie** : Compatible avec Standard et Consultation

## 🧪 Tests de validation

Un script de test a été créé : `test-room-types.js`

Pour tester la configuration :
```bash
node test-room-types.js
```

## 📈 Utilité pour la génération de planning

Ces nouveaux types permettront de :
1. **Garde** : Identifier les salles utilisées pour les gardes, permettant des règles spécifiques
2. **Astreinte** : Gérer les salles d'astreinte avec leurs contraintes particulières
3. **Aseptique** : Remplacer "Septique" par un terme plus approprié et positif
4. Simplifier la liste en supprimant les types peu utilisés

## ⚠️ Migration des données existantes

Les salles existantes avec les anciens types devront être mises à jour :
- Septique → Aseptique
- Ambulatoire → Standard ou autre selon contexte
- Spécialisée → Standard ou type spécifique selon usage
- Urgence → Garde
- FIV → Standard ou Consultation selon usage

## 🎯 Prochaines étapes

1. Tester l'interface utilisateur avec les nouveaux types
2. Migrer les données existantes si nécessaire
3. Mettre à jour la documentation utilisateur
4. Former les utilisateurs sur les nouveaux types 