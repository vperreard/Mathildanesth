# Guide Démarrage Rapide - Système de Trames

## 🚀 Mise en route en 5 minutes

### Prérequis

- Base de données avec le nouveau schéma Prisma
- Types d'activité créés dans le système
- Salles d'opération configurées
- Au moins un site défini

### Étape 1 : Créer un modèle de trame

```bash
curl -X POST /api/trame-modeles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ma Première Trame",
    "description": "Trame de test",
    "dateDebutEffet": "2024-01-01T00:00:00.000Z",
    "recurrenceType": "HEBDOMADAIRE",
    "joursSemaineActifs": [1, 2, 3, 4, 5],
    "typeSemaine": "TOUTES",
    "siteId": "votre-site-id"
  }'
```

### Étape 2 : Ajouter une affectation

```bash
curl -X POST /api/trame-modeles/1/affectations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activityTypeId": "votre-activity-type-id",
    "jourSemaine": "MONDAY",
    "periode": "MATIN",
    "typeSemaine": "TOUTES",
    "operatingRoomId": 1,
    "personnelRequis": [
      {
        "roleGenerique": "MAR",
        "nombreRequis": 1
      }
    ]
  }'
```

### Étape 3 : Prévisualiser l'application

```bash
curl -X GET "/api/trame-modeles/1/apply?startDate=2024-01-01&endDate=2024-01-07&siteId=votre-site-id" \
  -H "Authorization: Bearer $TOKEN"
```

### Étape 4 : Appliquer la trame

```bash
curl -X POST /api/trame-modeles/1/apply \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-01-07",
    "siteId": "votre-site-id",
    "options": {
      "dryRun": false,
      "skipExistingAssignments": true
    }
  }'
```

## ⚡ Exemples concrets

### Trame bloc opératoire standard

```json
{
  "name": "Bloc Principal - Standard",
  "description": "Trame pour le bloc opératoire principal, du lundi au vendredi",
  "siteId": "hopital-central",
  "dateDebutEffet": "2024-01-01T00:00:00.000Z",
  "dateFinEffet": "2024-12-31T23:59:59.999Z",
  "recurrenceType": "HEBDOMADAIRE",
  "joursSemaineActifs": [1, 2, 3, 4, 5],
  "typeSemaine": "TOUTES",
  "isActive": true
}
```

**Affectations associées :**

```json
// Lundi matin - Chirurgie générale
{
  "activityTypeId": "chirurgie-generale",
  "jourSemaine": "MONDAY",
  "periode": "MATIN", 
  "typeSemaine": "TOUTES",
  "operatingRoomId": 1,
  "priorite": 5,
  "personnelRequis": [
    {
      "roleGenerique": "CHIRURGIEN",
      "nombreRequis": 1,
      "personnelHabituelSurgeonId": 12
    },
    {
      "roleGenerique": "IADE",
      "nombreRequis": 1,
      "personnelHabituelUserId": 34
    },
    {
      "roleGenerique": "MAR",
      "nombreRequis": 1
    }
  ]
}

// Lundi après-midi - Chirurgie orthopédique
{
  "activityTypeId": "chirurgie-orthopedie",
  "jourSemaine": "MONDAY",
  "periode": "APRES_MIDI",
  "typeSemaine": "TOUTES", 
  "operatingRoomId": 2,
  "priorite": 5,
  "personnelRequis": [
    {
      "roleGenerique": "CHIRURGIEN",
      "nombreRequis": 1,
      "specialtyId": 3
    },
    {
      "roleGenerique": "IADE",
      "nombreRequis": 1
    }
  ]
}
```

### Trame alternée semaines paires/impaires

```json
{
  "name": "Bloc Spécialisé - Alternance",
  "description": "Trame alternée pour chirurgie spécialisée",
  "siteId": "hopital-central",
  "dateDebutEffet": "2024-01-01T00:00:00.000Z",
  "recurrenceType": "HEBDOMADAIRE",
  "joursSemaineActifs": [1, 3, 5],
  "typeSemaine": "PAIRES",
  "isActive": true
}
```

**Affectation pour semaines paires uniquement :**

```json
{
  "activityTypeId": "neurochirurgie",
  "jourSemaine": "WEDNESDAY",
  "periode": "JOURNEE_ENTIERE",
  "typeSemaine": "PAIRES",
  "operatingRoomId": 5,
  "priorite": 8,
  "personnelRequis": [
    {
      "roleGenerique": "CHIRURGIEN",
      "nombreRequis": 1,
      "specialtyId": 5,
      "notes": "Spécialiste neurochirurgie requis"
    },
    {
      "roleGenerique": "IADE", 
      "nombreRequis": 2,
      "notes": "2 IADE pour intervention longue"
    }
  ]
}
```

## 🛠️ Migration depuis l'ancien système

### Étape 1 : Vérification préliminaire

```bash
# Vérifier l'état actuel
npm run migrate:trame-modeles -- --dry-run --verbose
```

### Étape 2 : Migration en mode simulation

```bash
# Test de migration sans modification des données
npm run migrate:trame-modeles -- --dry-run
```

### Étape 3 : Migration réelle

```bash
# Migration effective (irréversible)
npm run migrate:trame-modeles -- --force
```

### Étape 4 : Vérification post-migration

```bash
# Vérifier les données migrées
npm run migrate:trame-modeles -- --dry-run --verbose
```

## 🔧 Utilisation avec TypeScript

### Service d'application

```typescript
import TrameApplicationService from '@/services/TrameApplicationService';

const trameService = new TrameApplicationService();

// Application avec gestion d'erreur
async function appliquerTrame(
  trameId: number,
  dateDebut: Date,
  dateFin: Date,
  siteId: string
) {
  try {
    const result = await trameService.applyTrameToDateRange(
      trameId,
      dateDebut,
      dateFin,
      siteId,
      {
        forceOverwrite: false,
        skipExistingAssignments: true,
        dryRun: false
      }
    );

    if (result.success) {
      console.log(`✅ Succès: ${result.planningsCreated} plannings créés`);
      console.log(`📋 ${result.assignmentsCreated} affectations créées`);
    } else {
      console.error('❌ Erreurs:', result.errors);
      console.warn('⚠️ Avertissements:', result.warnings);
    }

    return result;
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    throw error;
  } finally {
    await trameService.disconnect();
  }
}

// Utilisation
appliquerTrame(1, new Date('2024-01-01'), new Date('2024-01-31'), 'site-123')
  .then(result => console.log('Terminé:', result.message))
  .catch(console.error);
```

### Hook React personnalisé

```typescript
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface UseTrameApplicationResult {
  applying: boolean;
  result: ApplyTrameResult | null;
  error: string | null;
  applyTrame: (params: ApplyTrameParams) => Promise<void>;
  previewTrame: (params: PreviewTrameParams) => Promise<void>;
}

export function useTrameApplication(): UseTrameApplicationResult {
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<ApplyTrameResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const applyTrame = useCallback(async (params: ApplyTrameParams) => {
    setApplying(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/trame-modeles/${params.trameId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: params.startDate,
          endDate: params.endDate,
          siteId: params.siteId,
          options: params.options
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'application');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setApplying(false);
    }
  }, [token]);

  const previewTrame = useCallback(async (params: PreviewTrameParams) => {
    // Implémentation similaire avec GET
  }, [token]);

  return { applying, result, error, applyTrame, previewTrame };
}
```

## 📊 Monitoring et logs

### Logs d'application

```typescript
// Configuration des logs détaillés
const result = await trameService.applyTrameToDateRange(
  trameId, startDate, endDate, siteId, 
  { dryRun: true } // Mode prévisualisation pour diagnostic
);

console.log('📊 Statistiques d\'application:', {
  trameModeleId: trameId,
  plageApplicable: `${startDate.toISOString()} → ${endDate.toISOString()}`,
  datesApplicables: result.planningsCreated,
  affectationsPotentielles: result.assignmentsCreated,
  avertissements: result.warnings.length,
  erreurs: result.errors.length
});
```

### Métriques de performance

```typescript
console.time('application-trame');
const result = await trameService.applyTrameToDateRange(/*...*/);
console.timeEnd('application-trame');

console.log('⚡ Performance:', {
  planningsParSeconde: result.planningsCreated / (executionTime / 1000),
  affectationsParSeconde: result.assignmentsCreated / (executionTime / 1000)
});
```

## 🚨 Résolution de problèmes

### Problème : "Aucune date applicable trouvée"

**Cause :** Configuration de récurrence incorrecte

**Solution :**
```javascript
// Vérifier la configuration
const trame = await fetch(`/api/trame-modeles/${id}`).then(r => r.json());

console.log('Configuration actuelle:', {
  joursSemaineActifs: trame.joursSemaineActifs,
  typeSemaine: trame.typeSemaine,
  dateDebutEffet: trame.dateDebutEffet,
  dateFinEffet: trame.dateFinEffet
});

// Exemple de correction
await fetch(`/api/trame-modeles/${id}`, {
  method: 'PUT',
  body: JSON.stringify({
    joursSemaineActifs: [1, 2, 3, 4, 5], // Lun-Ven
    typeSemaine: 'TOUTES' // Pas seulement paires/impaires
  })
});
```

### Problème : Conflits d'affectation

**Cause :** Plannings existants non gérés

**Solution :**
```javascript
// Option 1: Ignorer les conflits
const result = await applyTrame(id, start, end, site, {
  skipExistingAssignments: true
});

// Option 2: Écraser les conflits (attention !)
const result = await applyTrame(id, start, end, site, {
  forceOverwrite: true
});

// Option 3: Prévisualiser d'abord
const preview = await previewTrame(id, start, end, site);
console.log('Conflits potentiels:', preview.warnings);
```

### Problème : Personnel habituel non disponible

**Cause :** Personnel assigné non actif ou inexistant

**Solution :**
```javascript
// Vérifier les affectations
const affectations = await fetch(`/api/trame-modeles/${id}/affectations`)
  .then(r => r.json());

for (const affectation of affectations) {
  for (const personnel of affectation.personnelRequis) {
    if (personnel.personnelHabituelUserId) {
      // Vérifier que l'utilisateur existe et est actif
      const user = await fetch(`/api/users/${personnel.personnelHabituelUserId}`)
        .then(r => r.json());
      
      if (!user.actif) {
        console.warn(`Utilisateur ${user.nom} ${user.prenom} inactif`);
      }
    }
  }
}
```

## 🎯 Cas d'usage avancés

### Trame avec personnel spécialisé

```json
{
  "activityTypeId": "chirurgie-cardiaque",
  "jourSemaine": "TUESDAY",
  "periode": "JOURNEE_ENTIERE",
  "operatingRoomId": 10,
  "priorite": 10,
  "personnelRequis": [
    {
      "roleGenerique": "CHIRURGIEN",
      "nombreRequis": 1,
      "specialtyId": 7,
      "notes": "Chirurgien cardiaque senior obligatoire"
    },
    {
      "roleGenerique": "IADE",
      "nombreRequis": 2,
      "notes": "IADE spécialisés en circulation extracorporelle"
    },
    {
      "roleGenerique": "MAR",
      "nombreRequis": 2,
      "notes": "MAR expérimentés pour assistance"
    }
  ]
}
```

### Application conditionnelle

```typescript
async function appliquerTrameConditionnelle(
  trameId: number,
  dateDebut: Date,
  dateFin: Date,
  siteId: string
) {
  // 1. Prévisualisation obligatoire
  const preview = await trameService.applyTrameToDateRange(
    trameId, dateDebut, dateFin, siteId, { dryRun: true }
  );

  // 2. Validation des prérequis
  if (preview.warnings.length > 5) {
    throw new Error(`Trop d'avertissements (${preview.warnings.length}), vérifiez la configuration`);
  }

  // 3. Demande de confirmation pour les gros volumes
  if (preview.planningsCreated > 30) {
    const confirmed = await confirm(
      `Cette opération va créer ${preview.planningsCreated} plannings. Continuer ?`
    );
    if (!confirmed) return;
  }

  // 4. Application réelle
  return await trameService.applyTrameToDateRange(
    trameId, dateDebut, dateFin, siteId, {
      skipExistingAssignments: true
    }
  );
}
```

## 📚 Ressources supplémentaires

- [Guide Architecture Complète](./TRAME_ARCHITECTURE_GUIDE.md)
- [Spécifications API](./TRAME_API_SPECIFICATION.md)
- [Documentation Prisma](https://www.prisma.io/docs/)
- [Tests E2E](../../cypress/e2e/planning/)

## 💡 Conseils et bonnes pratiques

1. **Toujours prévisualiser** avant l'application réelle
2. **Tester avec de petites plages** de dates d'abord
3. **Configurer les alertes** pour les échecs d'application
4. **Sauvegarder** avant les grosses migrations
5. **Monitorer les performances** lors d'applications importantes