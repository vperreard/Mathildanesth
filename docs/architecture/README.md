# Architecture Mathildanesth

## Vue d'ensemble

Mathildanesth est une application web de gestion de planning médical pour les équipes d'anesthésie (MARs et IADEs), construite avec Next.js 15, TypeScript, PostgreSQL et Prisma.

## Stack Technologique

### Frontend
- **Next.js 15.3.1** - App Router avec React 18
- **TypeScript 5.6.3** - Typage strict
- **Tailwind CSS** - Framework CSS utilitaire
- **Radix UI & Headless UI** - Composants accessibles
- **React Query (TanStack Query)** - Gestion état serveur
- **React Hook Form + Zod** - Validation formulaires
- **FullCalendar** - Vues calendrier
- **Recharts & Chart.js** - Visualisation données

### Backend
- **Next.js API Routes** - API REST intégrée
- **PostgreSQL** - Base de données relationnelle
- **Prisma ORM 6.9.0** - Accès données typé
- **Redis (ioredis)** - Cache et sessions
- **Socket.io** - WebSockets temps réel
- **Jose** - Authentification JWT

### Infrastructure
- **PWA** - Application web progressive
- **Pusher** - Notifications temps réel
- **Winston** - Logs structurés
- **Jest/Cypress/Puppeteer** - Tests multi-niveaux

## Architecture Modulaire

### Structure des dossiers
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # Routes API REST
│   ├── (auth)/            # Pages authentification
│   ├── (user)/            # Pages utilisateur
│   └── (admin)/           # Pages administration
├── modules/               # Modules métier
│   ├── leaves/            # Gestion congés
│   ├── planning/          # Planning bloc opératoire
│   ├── calendar/          # Système calendrier
│   └── dynamicRules/      # Moteur de règles
├── components/            # Composants UI partagés
├── hooks/                 # Hooks React personnalisés
├── services/              # Logique métier
├── lib/                   # Utilitaires core
└── types/                 # Définitions TypeScript
```

## Modules Principaux

### 1. Authentification & Autorisation
- JWT avec cookies HTTPOnly
- RBAC (Role-Based Access Control)
- Hiérarchie médicale : ADMIN_TOTAL, ADMIN_PARTIEL, MAR, IADE, CHIRURGIEN, USER

### 2. Gestion des Congés (`/modules/leaves/`)
- Système de quotas avec reports et transferts
- Congés récurrents
- Détection de conflits
- Intégration planning

### 3. Planning Bloc Opératoire (`/modules/planning/bloc-operatoire/`)
- Interface drag-and-drop
- Gestion salles et secteurs
- Validation règles de supervision
- Templates de planning

### 4. Système Calendrier (`/modules/calendar/`)
- Vues personnelles, collectives et d'allocation
- Gestion événements avec WebSocket
- Export iCal
- Intégration jours fériés

### 5. Moteur de Règles Dynamiques (`/modules/dynamicRules/`)
- Architecture v2 avec détection conflits
- Templates et simulation
- Validation temps réel
- Intégration planning

## Modèles de Données Clés

### Entités Principales
- **Users** - Professionnels médicaux avec rôles et sites
- **TrameModele** - Modèles de tableaux de service
- **AffectationModele** - Modèles d'affectation
- **BlocDayPlanning** - Planning quotidien bloc opératoire
- **Leaves** - Demandes de congés avec quotas
- **OperatingRoom/Sector** - Ressources physiques
- **PlanningRule** - Règles métier validation
- **Surgeon/Specialty** - Spécialisations médicales

## Architecture API

### Structure RESTful
```
/api/
├── auth/                  # Authentification
├── leaves/                # Gestion congés
├── planning/              # Planning général
├── bloc-operatoire/       # Planning bloc
├── admin/                 # Administration
├── notifications/         # Notifications
└── ws/                    # WebSockets
```

### Patterns de Sécurité
- Validation d'entrée sur tous endpoints
- Prévention injection SQL via Prisma
- Cache JWT (TTL 5 minutes)
- Middleware d'autorisation
- Audit logs complets

## Performance & Optimisation

### Stratégies de Cache
- **Redis** - Sessions et données fréquentes
- **React Query** - Cache côté client
- **Next.js** - Cache statique et ISR
- **Bundle splitting** - Imports dynamiques

### Monitoring
- Dashboard performance `/admin/performance`
- Métriques temps réel
- Alertes automatiques
- Logs structurés Winston

## Terminologie Médicale

### Adaptation Française
- "Trames" → "Tableaux de service"
- "Affectations" → "Gardes/Vacations"
- "Slots" → "Créneaux"
- Interface avec icône stéthoscope
- Navigation optimisée professionnels santé

## Sécurité

### Mesures Implémentées
- 95% des TODOs critiques sécurité résolus
- Authentification JWT sécurisée
- Validation côté serveur
- Chiffrement données sensibles
- Audit trail complet
- Rate limiting global

## État Actuel (Janvier 2025)

### Priorité : Stabilisation
- Focus qualité avant nouvelles fonctionnalités
- 0 bugs bloquants usage réel
- Parcours critiques fonctionnels
- Base stable pour automatisation

### Modules Production-Ready
- ✅ Authentication (100% testé)
- ✅ Gestion Congés (quotas, récurrences)
- ✅ Tests & Monitoring (85% couverture)
- ✅ Sécurité (100% TODOs critiques)
- ✅ Tests E2E (Cypress/Puppeteer)

## Évolution Future

### Phase 1 - Admin Tools
- Dashboard Command Center unifié
- Assistant création planning intelligent
- Interface gestion contraintes visuelles
- Mode remplacement urgence

### Phase 2 - UX Optimization
- Navigation simplifiée
- Templates médicaux spécialisés
- Notifications contextuelles
- PWA mobile complète

### Phase 3 - Innovation
- Assistant IA prédictif
- Système d'échanges intelligents
- Planification capacité long terme
- Intégrations externes

---

*Documentation mise à jour : Juin 2025*