# Architecture Analysis - Mathildanesth Application

## 1. Complete Pages Map

### Authentication & Access
- `/login` → Redirects to `/auth/connexion`
- `/auth/connexion` → Main login page (uses OptimizedLoginPage component)
  - **Duplicate**: Two login routes exist

### Main Application Pages

#### Dashboard & Home
- `/` → Main dashboard with feature cards for users and admin dashboard for admins

#### Planning Module
- `/planning` → Basic planning view (seems deprecated)
- `/planning/hebdomadaire` → Main weekly planning interface with drag-drop
- `/planning/generator` → Planning generation tool
- `/planning/validation` → Planning validation interface
  - **Issue**: Multiple planning interfaces with unclear hierarchy

#### Bloc Opératoire Module
- `/bloc-operatoire` → Main bloc operatoire page with tabs (planning, rooms, sectors)
- `/bloc-operatoire/planning` → Bloc planning view
- `/bloc-operatoire/salles` → Operating rooms management
- `/bloc-operatoire/regles-supervision` → Supervision rules
- `/bloc-operatoire/trames` → Bloc templates management
- `/bloc-operatoire/create/[date]` → Create new bloc planning
- `/bloc-operatoire/edit/[id]` → Edit existing bloc planning

#### Admin Bloc Opératoire (Duplicate Structure)
- `/admin/bloc-operatoire` → Admin overview page
- `/admin/bloc-operatoire/salles` → Room management (duplicate of `/bloc-operatoire/salles`)
- `/admin/bloc-operatoire/secteurs` → Sector management
- `/admin/bloc-operatoire/regles-supervision` → Supervision rules (duplicate)
  - **Major Issue**: Complete duplication of bloc operatoire features

#### Leave Management
- `/conges` → Main leave management page
- `/conges/nouveau` → Create new leave request
- `/conges/quotas` → Quota management
- `/conges/quotas/avances` → Advanced quota features
- `/conges/recurrents` → Recurring leaves
- `/admin/conges` → Admin leave management
- `/admin/conges/analytics` → Leave analytics

#### Calendar
- `/calendrier` → Main calendar view
- `/calendrier/parametres` → Calendar settings

#### Consultations
- `/consultations` → Consultation management

#### User Management
- `/utilisateurs` → User list and management
- `/profil` → User profile
- `/profil/notifications` → Notification preferences

#### Requests (Duplicate Structure)
- `/requetes` → User requests page
- `/admin/requetes` → Admin requests management
- `/parametres/requetes` → Settings for requests (seems to be leave requests)
  - **Issue**: Three different request pages with unclear purposes

#### Parameters/Settings (Complex Structure)
- `/parametres` → Main settings page with tabs
- `/parametres/chirurgiens` → Surgeons management
- `/parametres/hopitaux` → Hospitals management
- `/parametres/sites` → Sites management
- `/parametres/specialites` → Specialties management
- `/parametres/types-conges` → Leave types
- `/parametres/trames` → Template management (uses TemplateManager)
- `/parametres/trames/grid-demo` → Grid demo
- `/parametres/configuration` → Configuration page
- `/parametres/configuration/fatigue` → Fatigue settings

#### Admin Section
- `/admin/jours-feries` → Holiday management
- `/admin/performance` → Performance dashboard
- `/admin/planning-rules` → Planning rules
- `/admin/planning-rules/dashboard` → Rules dashboard
- `/admin/parametres` → Admin settings
- `/admin/parametres/conflict-rules` → Conflict rules
- `/admin/skills` → Skills management
- `/admin/site-assignments` → Site assignments
- `/admin/team-configurations` → Team configurations
- `/admin/team-configurations/[id]` → Specific team config
- `/admin/incompatibilites` → Incompatibilities
- `/admin/trames` → Admin templates (uses TrameAffectation component)
- `/admin/schedule-rules` → Schedule rules management

#### Statistics
- `/statistiques` → Main statistics page
- `/statistiques/previsions` → Predictions
- `/statistiques/utilisation-bloc` → Bloc utilization

#### Simulation Module
- `/admin/simulations` → Simulation list
- `/admin/simulations/nouveau` → Create simulation
- `/admin/simulations/compare` → Compare simulations
- `/admin/simulations/performance` → Performance analysis
- `/admin/simulations/visualizations` → Basic visualizations
- `/admin/simulations/avances-visualizations` → Advanced viz
- `/admin/simulations/templates` → Simulation templates
- Multiple nested pages for scenarios and results

#### Other Pages
- `/notifications` → Notifications center
- `/quota-management` → Quota management (duplicate of `/conges/quotas`?)
- `/documentation` → Documentation viewer
- `/diagnostic` → Diagnostic page
- `/demo` → Demo page
- `/demo/contextual-messages` → Contextual messages demo

## 2. Major Issues Identified

### Duplicated Pages
1. **Login Pages**: `/login` and `/auth/connexion`
2. **Bloc Opératoire**: Complete duplication between `/bloc-operatoire/*` and `/admin/bloc-operatoire/*`
3. **Requests**: Three different request pages (`/requetes`, `/admin/requetes`, `/parametres/requetes`)
4. **Quotas**: `/quota-management` and `/conges/quotas`
5. **Trames/Templates**: Multiple template pages (`/admin/trames`, `/parametres/trames`, `/bloc-operatoire/trames`)

### Overlapping Functionalities
1. **Planning**: Multiple planning interfaces without clear distinction
2. **User Management**: Split between `/utilisateurs` and various admin pages
3. **Settings**: Scattered across `/parametres/*` and `/admin/parametres/*`
4. **Rules Management**: Planning rules, schedule rules, supervision rules in different places

### Routing Inconsistencies
1. Some features under `/admin`, others directly accessible
2. Mixing French and English routes (`/requetes` vs `/demandes` in API)
3. Inconsistent nesting (some features deeply nested, others at root)

### Old vs New Implementations
1. `/planning` seems deprecated in favor of `/planning/hebdomadaire`
2. Multiple login page implementations (standard vs optimized)
3. Old planning files with `.old`, `.bak`, `.fix` extensions in hebdomadaire folder

### Confusing User Flows
1. **Admin Features**: Unclear when to use `/admin/*` vs root-level pages
2. **Settings**: Multiple entry points for configuration
3. **Templates/Trames**: Three different interfaces for similar functionality
4. **Planning**: No clear primary planning interface

### Unused/Deprecated Features
1. `/drag-and-drop-demo.tsx` - Demo file in production
2. Multiple backup files in `/planning/hebdomadaire/`
3. `/demo` pages in production
4. Test pages like `/diagnostic`

## 3. Recommendations

### Immediate Actions
1. **Remove duplicates**: Consolidate bloc operatoire pages
2. **Unify requests**: Single request management system
3. **Clean routes**: Remove demo/test pages from production
4. **Fix login**: Single login route

### Structure Improvements
1. **Clear admin boundary**: All admin features under `/admin`
2. **Consistent naming**: French or English, not mixed
3. **Template consolidation**: Single template management system
4. **Planning clarity**: Clear primary planning interface

### User Experience
1. **Simplify navigation**: Reduce nesting depth
2. **Clear feature separation**: Distinct purposes for each page
3. **Remove confusion**: Single path to each feature
4. **Improve discoverability**: Logical grouping of related features