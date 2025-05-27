# 🎯 ROADMAP MATHILDANESTH - Document Unique Consolidé

> **Dernière mise à jour** : Janvier 2025  
> **Statut global** : Architecture en refactoring, 85% modules testés, Production Ready

## 📊 État Actuel du Projet

### ✅ Modules Complétés (Production Ready)
- **Authentication** : JWT sécurisé, 100% testé
- **Gestion Congés** : Module complet avec quotas, reports, récurrences
- **Tests & Monitoring** : 85% couverture, monitoring temps réel
- **Sécurité** : 95% des TODO critiques résolus (18/19)

### 🚧 En Cours
- **Refactoring Architecture** : Nettoyage doublons et restructuration
- **Planning Unifié** : Consolidation des multiples interfaces
- **Templates** : Simplification du système complexe actuel

### ⚠️ Points d'Attention
- Architecture avec doublons (bloc-operatoire, templates, requests)
- Mix français/anglais dans les routes
- Navigation utilisateur confuse
- Pages obsolètes en production (/demo, fichiers .bak)

---

## 🏗️ PHASE 1 : REFACTORING ARCHITECTURE (Janvier-Février 2025)

### 1.1 Nettoyage Immédiat (Semaine 1-2) 🧹

**Suppressions**
- [ ] `/demo/*` - Supprimer complètement
- [ ] `/diagnostic/*` - Retirer de production
- [ ] Tous fichiers `.old`, `.bak`, `.backup`
- [ ] `/utilisateurs` → rediriger vers `/admin/users`
- [ ] `/chirurgiens` → rediriger vers `/admin/surgeons`

**Unification Doublons**
- [ ] **Bloc Opératoire** : Fusionner `/bloc-operatoire` et `/admin/bloc-operatoire`
  - Garder une seule version avec vues par rôle
  - Migration des données existantes
- [ ] **Système Demandes** : Unifier 3 systèmes en 1
  - `/requetes` + `/admin/requests` + `/notifications/swaps`
  - Un seul workflow cohérent

### 1.2 Harmonisation Langue (Semaine 3) 🌐

**Décision** : Tout en français pour cohérence UX
- [ ] `/leaves` → `/conges`
- [ ] `/users` → `/utilisateurs` 
- [ ] `/settings` → `/parametres`
- [ ] `/assignments` → `/affectations`
- [ ] Mise à jour de toutes les références

### 1.3 Restructuration Routes (Semaine 4) 🗂️

**Nouvelle Structure**
```
/app/
├── (auth)/
│   ├── connexion/
│   └── mot-de-passe-oublie/
├── (utilisateur)/
│   ├── tableau-de-bord/
│   ├── planning/
│   │   ├── jour/
│   │   ├── semaine/
│   │   ├── mois/
│   │   └── equipe/
│   ├── conges/
│   │   ├── demander/
│   │   ├── historique/
│   │   └── soldes/
│   ├── notifications/
│   └── profil/
└── (admin)/
    ├── tableau-de-bord/
    ├── utilisateurs/
    ├── sites-et-salles/
    ├── conges/
    │   ├── validation/
    │   ├── quotas/
    │   └── rapports/
    ├── planning/
    │   ├── generation/
    │   ├── templates/
    │   └── regles/
    └── parametres/
```

---

## 🔒 SÉCURITÉ & CONFORMITÉ (En Continu)

### État Actuel : 95% des TODOs Critiques Résolus (18/19)

**TODO Restant** :
- [ ] **Validation côté serveur des règles métier** (3h)
  - Implémenter validation serveur pour toutes les règles de gestion
  - Pattern : `validateBusinessRules()` dans chaque service
  - Tests unitaires pour chaque règle

**Patterns de Sécurité à Maintenir** :
```typescript
// Pour toutes les routes API
export async function handler(req: NextRequest) {
  // 1. Authentification
  const user = await getServerSession();
  if (!user) return unauthorized();
  
  // 2. Autorisation
  const hasPermission = await checkPermission(user, resource, action);
  if (!hasPermission) return forbidden();
  
  // 3. Validation entrées
  const validated = schema.safeParse(req.body);
  if (!validated.success) return badRequest(validated.error);
  
  // 4. Vérification propriétaire/admin
  if (!isOwnerOrAdmin(user, resource)) return forbidden();
}
```

**Checklist Sécurité API** :
- ✅ JWT HTTPOnly cookies
- ✅ Rate limiting (100 req/min)
- ✅ Input validation (Zod schemas)
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection (React)
- ✅ RBAC avec permissions granulaires
- ✅ Audit logs
- ⏳ Validation métier côté serveur

---

## 🎨 PHASE 2 : AMÉLIORATION UX (Mars 2025)

### 2.1 Planning Unifié Multi-Vues ✅

**Concept** : Une interface, plusieurs vues
- [ ] Vue **Jour** : Focus sur les assignations détaillées
- [ ] Vue **Semaine** : Planning équipe avec drag & drop
- [ ] Vue **Mois** : Vue d'ensemble avec statistiques
- [ ] Vue **Équipe** : Planning par personne/compétence

**Filtres Intelligents**
- [ ] Par site/secteur/salle
- [ ] Par personne/équipe
- [ ] Par type d'activité
- [ ] Sauvegarde des filtres favoris

### 2.2 Simplification Templates 📋

**Nouveau Système**
```
Templates de Base
    ↓
Variations (jours spéciaux, périodes)
    ↓
Application au Planning
    ↓
Validation & Ajustements
```

- [ ] Interface unifiée de gestion
- [ ] Preview en temps réel
- [ ] Historique des applications
- [ ] Analyse d'impact

### 2.3 Navigation Simplifiée 🧭

**Menu Principal Utilisateur**
```
🏠 Accueil | 📅 Mon Planning | 🌴 Mes Congés | 🔔 Notifications | 👤 Profil
```

**Menu Principal Admin**
```
📊 Tableau de Bord | 👥 Gestion | 📈 Rapports | ⚙️ Configuration
```

---

## 🚀 PHASE 3 : OPTIMISATIONS PERFORMANCE (Avril 2025)

### 3.1 Cache Intelligent
- [ ] Cache Redis optimisé par module
- [ ] Invalidation intelligente
- [ ] Préchargement prédictif

### 3.2 Lazy Loading Avancé
- [ ] Chargement progressif des plannings
- [ ] Virtualisation des grandes listes
- [ ] Images optimisées automatiquement

### 3.3 API Optimisées
- [ ] Pagination cursor-based
- [ ] GraphQL pour requêtes complexes
- [ ] Batch operations

---

## 🏥 PHASE 4 : FONCTIONNALITÉS MÉDICALES AVANCÉES (Mai-Juin 2025)

### 4.1 Gestion Compétences Avancée
- [ ] Matrice compétences détaillée
- [ ] Parcours de formation intégré
- [ ] Validation automatique des prérequis

### 4.2 Optimisation IA
- [ ] Suggestions intelligentes d'affectation
- [ ] Prédiction des besoins
- [ ] Détection anomalies planning

### 4.3 Intégrations Externes
- [ ] Synchronisation RH
- [ ] Export comptabilité
- [ ] Interface mobile native

---

## 📅 Planning & Jalons

### T1 2025 (Janvier-Mars)
- **Semaines 1-4** : Phase 1 - Refactoring Architecture ✅
- **Semaines 5-8** : Phase 2.1 - Planning Unifié
- **Semaines 9-12** : Phase 2.2-2.3 - UX & Navigation

### T2 2025 (Avril-Juin)  
- **Avril** : Phase 3 - Optimisations Performance
- **Mai-Juin** : Phase 4 - Fonctionnalités Médicales

### Critères de Succès par Phase
- **Phase 1** : 0 doublons, architecture claire, -50% fichiers
- **Phase 2** : NPS utilisateur >8/10, -70% clics pour actions courantes
- **Phase 3** : Temps chargement <1s, 0 timeout API
- **Phase 4** : 100% compétences trackées, ROI +30% sur planning

---

## 📋 SPÉCIFICATIONS MÉDICALES DÉTAILLÉES

### Score de Fatigue - Algorithme de Calcul

**Formule** : Score = Σ(Points × Durée) sur période glissante 7 jours

| Type d'Activité | Points/heure | Justification |
|-----------------|--------------|---------------|
| Salle d'opération | 2 pts | Charge cognitive et physique élevée |
| Supervision MAR | 1 pt | Responsabilité, disponibilité requise |
| Consultation | 0.5 pt | Activité moins intensive |
| Formation | 0.25 pt | Activité d'apprentissage |

**Seuils d'Alerte** :
- ⚠️ **Attention** : >80 points/semaine
- 🚫 **Critique** : >100 points/semaine
- 🆘 **Danger** : >120 points/semaine

### Gestion Pédiatrie - Compétences Spécifiques

**Niveaux de Compétence** :
1. **Débutant** : Supervision obligatoire
2. **Intermédiaire** : Cas simples autonomes
3. **Confirmé** : Tous cas sauf urgences complexes
4. **Expert** : Référent pédiatrie, formateur

**Règles d'Affectation** :
- Minimum 2 MAR niveau ≥3 par vacation pédiatrie
- Ratio IADE/MAR adapté selon complexité
- Formation continue obligatoire (20h/an)

### Mode Urgence Admin - Remplacement Rapide

**Activation** : Absence imprévue <24h
1. Notification push tous MAR disponibles
2. Proposition basée sur :
   - Proximité géographique
   - Score fatigue actuel
   - Compétences requises
3. Validation en 1 clic
4. Mise à jour planning temps réel

### Module Gardes - Architecture Double Vue

**Vue Planning** :
- Calendrier mensuel gardes
- Drag & drop pour échanges
- Visualisation charge globale

**Vue Individuelle** :
- Mes gardes à venir
- Historique et statistiques
- Demandes d'échange

### Terminologie Médicale à Implémenter

| Ancien Terme | Nouveau Terme | Contexte |
|-------------|---------------|----------|
| Trames | Tableaux de service | UI utilisateur |
| Slots | Créneaux | Planning |
| Rules | Règles de gestion | Configuration |
| Patterns | Modèles récurrents | Templates |

---

## 🔧 Décisions Techniques Prises

1. **Langue** : Tout en français pour l'UX (sauf code/API)
2. **Planning** : Système unifié multi-vues avec filtres avancés
3. **Templates** : Simplification en 3 étapes (Base → Variation → Application)
4. **Architecture** : Structure par contexte utilisateur (auth/user/admin)
5. **Performance** : Objectif bundle <50MB (actuellement 4GB)
6. **Sécurité** : Pattern authorization middleware sur toutes les routes

---

## 🎯 AXES D'AMÉLIORATION UTILISATEUR

### 1. Expression des Préférences
- [ ] Interface de saisie des préférences (jours off, créneaux préférés)
- [ ] Système de voeux avec priorités
- [ ] Historique satisfaction des demandes
- [ ] Dashboard équité des attributions

### 2. Alertes Proactives
- [ ] Détection patterns absences récurrentes
- [ ] Prédiction surcharge équipes
- [ ] Suggestions préventives remplacements
- [ ] Notifications intelligentes contextuelles

### 3. Gestion des Exceptions
- [ ] Mode "hors routine" pour cas spéciaux
- [ ] Templates d'urgence pré-configurés
- [ ] Workflow validation accéléré
- [ ] Audit trail des décisions exceptionnelles

### 4. Tableaux de Bord Équité
- [ ] Répartition charge par personne
- [ ] Statistiques weekends/jours fériés
- [ ] Indice satisfaction préférences
- [ ] Rapports mensuels automatiques

### 5. Outils de Simulation
- [ ] "What-if" scenarios planning
- [ ] Impact analysis changements
- [ ] Prévisions charge à 3 mois
- [ ] Tests configuration sans impact prod

### 6. Détection Anomalies
- [ ] ML sur patterns inhabituels
- [ ] Alertes déséquilibres équipes
- [ ] Identification risques burnout
- [ ] Suggestions rééquilibrage automatique

---

## 🧪 DETTE TECHNIQUE RÉSOLUE

### Infrastructure & Build
- ✅ Migration Babel → SWC
- ✅ Fix configuration Next.js 14
- ✅ Optimisation bundle (target <50MB)
- ✅ Stabilisation tests E2E

### Sécurité (95% Complété)
- ✅ JWT HTTPOnly cookies
- ✅ RBAC avec permissions
- ✅ Rate limiting global
- ✅ Audit logs complets
- ⏳ Validation métier serveur (1 TODO restant)

### Tests & Qualité
- ✅ 85% couverture tests critiques
- ✅ Infrastructure monitoring
- ✅ Performance benchmarks
- ✅ Documentation consolidée

---

## 📝 Notes de Mise en Œuvre

### Priorités Immédiates (Cette semaine)
1. Supprimer `/demo` et pages test
2. Commencer fusion bloc-operatoire
3. Créer redirections pour routes obsolètes
4. Documenter nouvelles conventions

### Points de Vigilance
- Migration données lors des fusions
- Maintien rétrocompatibilité API
- Formation utilisateurs aux changements
- Tests de non-régression complets

### Métriques de Suivi
- Temps de chargement pages
- Nombre de clics pour actions courantes  
- Taux d'erreur utilisateur
- Satisfaction utilisateur (NPS)

---

## 🎯 Vision Long Terme

**Objectif 2025** : Plateforme de référence pour la gestion des plannings médicaux
- Interface intuitive "zero-training"
- Performance temps réel
- IA assistante non intrusive
- Écosystème d'intégrations

**KPIs Cibles**
- 95% satisfaction utilisateur
- <1s temps de réponse
- 0 erreur planning critique
- 50% réduction temps administratif

---

*Ce document remplace tous les anciens fichiers NEXT_STEPS et roadmap. Mise à jour mensuelle obligatoire.*