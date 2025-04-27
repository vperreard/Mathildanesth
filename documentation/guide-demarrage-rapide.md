# Guide de démarrage rapide et FAQ

## Guide de démarrage rapide pour administrateurs

### 1. Configuration initiale

```typescript
// 1. Importer la configuration de base
import { defaultConfig } from '@/config/default';

// 2. Personnaliser pour votre équipe
const config = {
  ...defaultConfig,
  equipe: {
    nom: "Anesthésie - Hôpital XYZ",
    effectifs: {
      mars: 16,
      iades: 9
    }
  }
};

// 3. Initialiser l'application
const app = new PlanningApp(config);
```

### 2. Création des utilisateurs

1. Accéder à l'interface d'administration
2. Cliquer sur "Gestion des utilisateurs"
3. Pour chaque utilisateur :
   - Créer le compte (nom, prénom, email)
   - Définir le rôle (MAR, IADE, Admin)
   - Configurer le temps de travail
   - Définir les spécialités

### 3. Configuration des règles de base

1. Accéder à "Configuration des règles"
2. Vérifier les règles par défaut
3. Ajuster selon vos besoins :
   - Espacement des gardes
   - Nombre de consultations
   - Règles de supervision

### 4. Génération du premier planning

1. Aller dans "Génération de planning"
2. Sélectionner la période
3. Choisir le mode de génération :
   - Par couches (recommandé)
   - Complet
4. Valider chaque étape
5. Examiner les commentaires et alertes
6. Publier le planning

## FAQ des règles

### Questions générales

**Q: Comment sont calculés les quotas pour les temps partiels ?**
R: Les quotas sont proportionnels au temps de travail. Par exemple, un MAR à 50% aura 1 consultation/semaine au lieu de 2.

**Q: Que se passe-t-il si aucun MAR n'est disponible pour une garde ?**
R: Le système génère une alerte critique et propose des solutions :
- Assouplir temporairement les règles
- Faire appel à un remplaçant
- Redistribuer les affectations existantes

**Q: Comment fonctionne le système de fatigue ?**
R: Chaque affectation génère des points de fatigue. Le repos permet de récupérer. Si un seuil critique est atteint, le système évite d'attribuer des affectations lourdes.

### Questions sur les gardes

**Q: Pourquoi le système refuse-t-il d'attribuer une garde à un MAR ?**
R: Plusieurs raisons possibles :
- Moins de 7 jours depuis la dernière garde
- Déjà 3 gardes ce mois-ci
- Score de fatigue trop élevé
- Congé ou indisponibilité déclarée

**Q: Comment gérer les weekends prolongés ?**
R: Les weekends avec jours fériés ont une pondération plus élevée. Ils sont comptabilisés séparément pour assurer une répartition équitable.

### Questions sur les consultations

**Q: Peut-on modifier le nombre de consultations par semaine ?**
R: Oui, dans la configuration des règles. Le standard est 2/semaine pour un temps plein, max 3/semaine.

**Q: Comment fermer des créneaux de consultation ?**
R: Dans l'interface de planification, sélectionner la période et utiliser l'option "Fermer créneaux".

### Questions sur le bloc

**Q: Que signifie "supervision exceptionnelle" ?**
R: Un MAR supervise 3 salles au lieu des 2 habituelles. Cette situation génère une alerte orange et des points de fatigue supplémentaires.

**Q: Comment gérer les règles de secteur ?**
R: Les règles sont configurables par secteur dans "Configuration > Règles de supervision". Chaque secteur peut avoir ses propres contraintes.

### Questions sur les urgences

**Q: Comment remplacer un MAR absent en dernière minute ?**
R: Utiliser le module "Gestion des urgences" qui propose automatiquement des modifications de planning optimales.

**Q: Le système peut-il proposer des solutions automatiquement ?**
R: Oui, il analyse les disponibilités et propose plusieurs scénarios avec leurs impacts respectifs.

## Guide de dépannage

### Problèmes courants

#### 1. "Impossible de générer le planning"
- Vérifier les disponibilités du personnel
- S'assurer qu'il n'y a pas trop de contraintes simultanées
- Examiner les logs pour identifier les conflits

#### 2. "Règles en conflit"
- Utiliser l'outil de diagnostic des règles
- Vérifier les priorités des règles
- Désactiver temporairement les règles moins critiques

#### 3. "Performance lente"
- Vérifier les indexes de la base de données
- Activer le cache pour les calculs récurrents
- Réduire la période de génération

### Logs et diagnostic

```typescript
// Activer les logs détaillés
app.setLogLevel('DEBUG');

// Analyser les problèmes de génération
const diagnostics = await app.runDiagnostics();
console.log(diagnostics.issues);

// Vérifier les conflits de règles
const conflicts = await app.checkRuleConflicts();
```

### Support technique

- Email: support@planning-anesthesie.fr
- Documentation complète: /docs
- Logs système: /admin/logs
- Diagnostic automatique: /admin/diagnostics

## Bonnes pratiques

1. **Planification**
   - Générer les plannings au moins 1 mois à l'avance
   - Valider chaque couche avant de passer à la suivante
   - Examiner attentivement les alertes et commentaires

2. **Gestion des règles**
   - Ne pas modifier les règles pendant une génération
   - Tester les nouvelles règles sur une période limitée
   - Documenter les exceptions et dérogations

3. **Urgences**
   - Utiliser le module d'urgence dès qu'une absence est connue
   - Valider les propositions automatiques avant application
   - Informer rapidement le personnel concerné

4. **Maintenance**
   - Sauvegarder régulièrement la configuration
   - Archiver les anciens plannings
   - Mettre à jour les préférences du personnel