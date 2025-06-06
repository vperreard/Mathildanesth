# Migration Strategy: Consolidation sur Radix UI

**Date**: 06/01/2025  
**Objectif**: Consolidation de toutes les librairies UI vers Radix UI pour réduire la taille du bundle et améliorer la cohérence

## 📊 Analyse de l'usage actuel

### Material-UI (@mui/material)
**12 fichiers identifiés** utilisant Material-UI

#### Composants les plus utilisés
| Composant MUI | Fréquence | Fichiers concernés |
|---------------|-----------|-------------------|
| `Button` | 5 | EventDetailModal, LeavePerformanceTest, plus... |
| `Typography` | 4 | TeamAvailabilityChart, LeaveTrendsChart, plus... |
| `Table/TableCell/TableRow/TableHead/TableBody` | 3 | LeavesList, LeavePerformanceTest |
| `Card/CardContent/CardHeader` | 3 | TeamAvailabilityChart, BlocPlanningTemplateEditor |
| `Dialog/DialogTitle/DialogContent/DialogActions` | 2 | EventDetailModal, BlocPlanningTemplateEditor |
| `TextField` | 2 | LeavesList, BlocPlanningTemplateEditor |
| `Select/MenuItem` | 2 | LeavesList, BlocPlanningTemplateEditor |
| `Box` | 2 | TeamAvailabilityChart, LeavePerformanceTest |
| `CircularProgress` | 2 | TeamAvailabilityChart, LeaveTrendsChart |

### Ant Design (antd)
**9 fichiers identifiés** utilisant Ant Design

#### Composants les plus utilisés
| Composant Antd | Fréquence | Fichiers concernés |
|----------------|-----------|-------------------|
| `Button` | 6 | QuotaTransferForm, QuotaCarryOverForm, plus... |
| `Form` | 4 | QuotaTransferForm, QuotaCarryOverForm, LeaveTypeFormModal |
| `Card` | 4 | QuotaTransferForm, LeaveDashboard, PerformanceMonitor |
| `Typography` | 4 | QuotaTransferForm, LeaveDashboard, LeaveHistoryTable |
| `Select` | 3 | QuotaTransferForm, LeaveDashboard, LeaveTypeFormModal |
| `Input/InputNumber` | 3 | QuotaTransferForm, QuotaCarryOverForm, LeaveTypeFormModal |
| `Row/Col` | 3 | QuotaTransferForm, QuotaCarryOverForm, LeaveQuotaOverview |
| `Table` | 3 | LeaveDashboard, PerformanceMonitor, LeaveHistoryTable |
| `Alert` | 3 | QuotaTransferForm, PerformanceMonitor, LeaveQuotaOverview |
| `Steps/Statistic` | 2 | QuotaTransferForm, QuotaCarryOverForm |

### Headless UI (@headlessui/react)
**5 fichiers identifiés** utilisant Headless UI

#### Composants utilisés
| Composant Headless UI | Fréquence | Fichiers concernés |
|----------------------|-----------|-------------------|
| `Dialog` | 4 | Modal, WidgetConfigModal, WidgetCustomizationModal, PreferencesModal |
| `Transition` | 1 | Modal |
| `Tab` | 1 | LeaveManagementPanel |

## 🎯 Stratégie de migration vers Radix UI

### Mapping des composants vers Radix UI

#### Material-UI → Radix UI
| MUI Composant | Radix UI Équivalent | Complexité | Notes |
|---------------|-------------------|------------|--------|
| `Button` | `@radix-ui/react-button` ou custom | ⭐ Simple | Style avec Tailwind |
| `Typography` | Custom avec Tailwind | ⭐ Simple | `<h1>`, `<p>` + classes CSS |
| `Table` | `@radix-ui/react-table` ou HTML natif | ⭐⭐ Moyen | Tables simples possible avec HTML + Tailwind |
| `Card` | Custom avec Tailwind | ⭐ Simple | `<div>` avec classes appropriées |
| `Dialog` | `@radix-ui/react-dialog` | ⭐⭐ Moyen | Migration directe possible |
| `TextField` | Custom Input | ⭐⭐ Moyen | `<input>` + validation + styling |
| `Select` | `@radix-ui/react-select` | ⭐⭐⭐ Complexe | API différente, needs wrapper |
| `CircularProgress` | Custom ou librairie externe | ⭐⭐ Moyen | CSS animations ou react-spinners |
| `Box` | `<div>` avec Tailwind | ⭐ Simple | Remplacement direct |

#### Ant Design → Radix UI
| Antd Composant | Radix UI Équivalent | Complexité | Notes |
|----------------|-------------------|------------|--------|
| `Form` | `react-hook-form` + validation | ⭐⭐⭐ Complexe | Changement de paradigme |
| `Button` | `@radix-ui/react-button` ou custom | ⭐ Simple | Style avec Tailwind |
| `Card` | Custom avec Tailwind | ⭐ Simple | `<div>` avec classes appropriées |
| `Typography` | Custom avec Tailwind | ⭐ Simple | `<h1>`, `<p>` + classes CSS |
| `Select` | `@radix-ui/react-select` | ⭐⭐⭐ Complexe | API différente |
| `Input/InputNumber` | Custom Input | ⭐⭐ Moyen | `<input>` + validation + styling |
| `Table` | `@radix-ui/react-table` ou HTML natif | ⭐⭐ Moyen | Tables simples avec HTML + Tailwind |
| `Alert` | Custom avec Tailwind | ⭐⭐ Moyen | Toast notifications ou custom |
| `Steps` | Custom Stepper | ⭐⭐⭐ Complexe | Pas d'équivalent direct Radix |
| `Statistic` | Custom avec Tailwind | ⭐ Simple | `<div>` avec styling approprié |
| `notification` | `@radix-ui/react-toast` | ⭐⭐ Moyen | Migration vers toast system |

#### Headless UI → Radix UI
| Headless UI | Radix UI Équivalent | Complexité | Notes |
|-------------|-------------------|------------|--------|
| `Dialog` | `@radix-ui/react-dialog` | ⭐⭐ Moyen | APIs similaires, migration facile |
| `Transition` | CSS transitions ou Framer Motion | ⭐⭐ Moyen | Radix n'a pas de transitions built-in |
| `Tab` | `@radix-ui/react-tabs` | ⭐ Simple | Migration directe |

## 📋 Plan de migration par priorité

### Phase 1: Migration simple (⭐ - 1-2 jours)
**Objectif**: Composants avec équivalents directs
1. **Modal.tsx** (Headless UI → Radix UI Dialog)
2. **Tous les Button** (MUI/Antd → Custom Button avec Tailwind)
3. **Typography/Text** (MUI/Antd → Custom avec Tailwind)
4. **Box/Card** (MUI/Antd → Custom avec Tailwind)

### Phase 2: Migration moyenne (⭐⭐ - 3-5 jours)
**Objectif**: Composants nécessitant des wrappers
1. **Tables** (MUI/Antd → HTML natif + Tailwind ou Radix Table)
2. **Input/TextField** (MUI/Antd → Custom Input avec validation)
3. **CircularProgress** (MUI/Antd → Custom spinner)
4. **Alert** (Antd → Custom Alert avec Tailwind)

### Phase 3: Migration complexe (⭐⭐⭐ - 1-2 semaines)
**Objectif**: Composants nécessitant refactoring important
1. **Form** (Antd → react-hook-form + Radix)
2. **Select** (MUI/Antd → Radix Select + wrapper)
3. **Steps** (Antd → Custom Stepper)
4. **Notification system** (Antd → Radix Toast)

## 🏗️ Composants à créer

### Composants de base prioritaires
```typescript
// components/ui/Button.tsx
// components/ui/Input.tsx  
// components/ui/Card.tsx
// components/ui/Typography.tsx
// components/ui/Modal.tsx (Radix Dialog wrapper)
// components/ui/Select.tsx (Radix Select wrapper)
// components/ui/Table.tsx
// components/ui/Alert.tsx
// components/ui/Form.tsx (react-hook-form wrapper)
// components/ui/Spinner.tsx
```

### Composants complexes
```typescript
// components/ui/Stepper.tsx (custom implementation)
// components/ui/Toast.tsx (Radix Toast wrapper)
// components/ui/Statistic.tsx (custom implementation)
```

## 📈 Impact estimé

### Bénéfices
- **Réduction bundle**: ~150-200KB (estimé)
- **Cohérence UI**: Design system unifié
- **Performance**: Moins de CSS conflicts
- **Maintenance**: Une seule librairie à maintenir
- **Accessibilité**: Radix UI excellent support a11y

### Effort de développement
- **Phase 1**: 1-2 jours (migration simple)
- **Phase 2**: 3-5 jours (migration moyenne)  
- **Phase 3**: 1-2 semaines (migration complexe)
- **Total estimé**: 2-3 semaines

### Risques
- **Régression UI**: Changements visuels possibles
- **Bugs temporaires**: Pendant la migration
- **Formation équipe**: Nouvelle API à apprendre
- **Tests à adapter**: Selectors et behavior changes

## 🎯 Recommandations

### Stratégie recommandée
1. **Commencer par Phase 1**: Impact minimal, gains immédiats
2. **Créer design system**: Composants UI réutilisables
3. **Migration incrémentale**: Par module/feature
4. **Tests exhaustifs**: Chaque composant migré
5. **Documentation**: Guide d'usage des nouveaux composants

### Priorisation des fichiers par complexité

#### Simples (Phase 1)
- `src/components/Modal.tsx` 
- `src/components/dashboard/WidgetConfigModal.tsx`
- `src/components/dashboard/PreferencesModal.tsx`
- `src/modules/dashboard/leaves/components/charts/TeamAvailabilityChart.tsx`

#### Moyens (Phase 2)  
- `src/modules/leaves/components/LeavesList.tsx`
- `src/components/absences/LeaveHistoryTable.tsx`
- `src/components/admin/PerformanceMonitor.tsx`

#### Complexes (Phase 3)
- `src/modules/leaves/quotas/transfer/QuotaTransferForm.tsx`
- `src/modules/leaves/quotas/carryOver/QuotaCarryOverForm.tsx`
- `src/modules/templates/components/BlocPlanningTemplateEditor.tsx`

## 🚀 Next Steps

1. **Validation équipe**: Approval de la stratégie
2. **Setup Radix UI**: Installation et configuration
3. **Création composants base**: Phase 1 components
4. **Migration pilote**: Un fichier simple pour validation
5. **Rollout incrémental**: Suivre les phases définies

---

**Note**: Cette migration s'inscrit dans la stratégie de stabilisation du projet. Elle devra être coordonnée avec les autres initiatives techniques en cours.