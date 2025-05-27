/**
 * Service de migration pour la fusion du bloc-opératoire
 * Facilite la transition progressive des composants et services
 */

import { redirect } from 'next/navigation';

interface MigrationStatus {
  component: string;
  oldPath: string;
  newPath: string;
  status: 'pending' | 'in-progress' | 'completed';
  issues?: string[];
}

export const migrationStatus: MigrationStatus[] = [
  {
    component: 'BlocPlanning',
    oldPath: '/src/app/bloc-operatoire/components/BlocPlanning.tsx',
    newPath: '/src/app/(app)/bloc-operatoire/planning/components/BlocPlanning.tsx',
    status: 'completed',
    issues: ['Imports de composants UI à adapter']
  },
  {
    component: 'OptimizedBlocPlanning',
    oldPath: '/src/app/bloc-operatoire/components/OptimizedBlocPlanning.tsx',
    newPath: '/src/app/(app)/bloc-operatoire/planning/components/OptimizedBlocPlanning.tsx',
    status: 'completed',
    issues: ['VirtualizedPlanningWeekView manquant']
  },
  {
    component: 'BlocPlanningEditor',
    oldPath: '/src/app/bloc-operatoire/components/BlocPlanningEditor.tsx',
    newPath: '/src/app/(app)/bloc-operatoire/planning/components/BlocPlanningEditor.tsx',
    status: 'completed'
  },
  {
    component: 'BlocDayPlanningEditor',
    oldPath: '/src/app/bloc-operatoire/components/BlocDayPlanningEditor.tsx',
    newPath: '/src/app/(app)/bloc-operatoire/planning/components/BlocDayPlanningEditor.tsx',
    status: 'completed'
  },
  {
    component: 'BlocDayPlanningView',
    oldPath: '/src/app/bloc-operatoire/components/BlocDayPlanningView.tsx',
    newPath: '/src/app/(app)/bloc-operatoire/planning/components/BlocDayPlanningView.tsx',
    status: 'completed'
  },
  {
    component: 'BlocDayView',
    oldPath: '/src/app/bloc-operatoire/components/BlocDayView.tsx',
    newPath: '/src/app/(app)/bloc-operatoire/planning/components/BlocDayView.tsx',
    status: 'completed'
  },
  {
    component: 'BlocVacation',
    oldPath: '/src/app/bloc-operatoire/components/BlocVacation.tsx',
    newPath: '/src/app/(app)/bloc-operatoire/planning/components/BlocVacation.tsx',
    status: 'completed'
  },
  {
    component: 'OperatingRoomForm',
    oldPath: '/src/app/admin/bloc-operatoire/components/OperatingRoomForm.tsx',
    newPath: '/src/app/(app)/bloc-operatoire/salles/components/OperatingRoomForm.tsx',
    status: 'completed'
  },
  {
    component: 'OperatingRoomList',
    oldPath: '/src/app/admin/bloc-operatoire/components/OperatingRoomList.tsx',
    newPath: '/src/app/(app)/bloc-operatoire/salles/components/OperatingRoomList.tsx',
    status: 'completed'
  },
  {
    component: 'SallesAdmin',
    oldPath: '/src/app/admin/bloc-operatoire/components/SallesAdmin.tsx',
    newPath: '/src/app/(app)/bloc-operatoire/salles/components/SallesAdmin.tsx',
    status: 'completed'
  },
  {
    component: 'SecteursAdmin',
    oldPath: '/src/app/admin/bloc-operatoire/components/SecteursAdmin.tsx',
    newPath: '/src/app/(app)/bloc-operatoire/secteurs/components/SecteursAdmin.tsx',
    status: 'completed'
  },
  {
    component: 'OperatingSectorForm',
    oldPath: '/src/app/admin/bloc-operatoire/components/OperatingSectorForm.tsx',
    newPath: '/src/app/(app)/bloc-operatoire/secteurs/components/OperatingSectorForm.tsx',
    status: 'completed'
  },
  {
    component: 'OperatingSectorList',
    oldPath: '/src/app/admin/bloc-operatoire/components/OperatingSectorList.tsx',
    newPath: '/src/app/(app)/bloc-operatoire/secteurs/components/OperatingSectorList.tsx',
    status: 'completed'
  },
  {
    component: 'ReglesSupervisionAdmin',
    oldPath: '/src/app/admin/bloc-operatoire/components/ReglesSupervisionAdmin.tsx',
    newPath: '/src/app/(app)/bloc-operatoire/regles/components/ReglesSupervisionAdmin.tsx',
    status: 'completed'
  },
  {
    component: 'SupervisionRulesForm',
    oldPath: '/src/modules/planning/bloc-operatoire/components/SupervisionRulesForm.tsx',
    newPath: '/src/app/(app)/bloc-operatoire/regles/components/SupervisionRulesForm.tsx',
    status: 'completed'
  },
  {
    component: 'SupervisionRulesList',
    oldPath: '/src/modules/planning/bloc-operatoire/components/SupervisionRulesList.tsx',
    newPath: '/src/app/(app)/bloc-operatoire/regles/components/SupervisionRulesList.tsx',
    status: 'completed'
  }
];

/**
 * Obtenir le statut de migration d'un composant
 */
export function getComponentMigrationStatus(componentName: string): MigrationStatus | undefined {
  return migrationStatus.find(m => m.component === componentName);
}

/**
 * Vérifier si un composant est migré
 */
export function isComponentMigrated(componentName: string): boolean {
  const status = getComponentMigrationStatus(componentName);
  return status?.status === 'completed';
}

/**
 * Obtenir le chemin du composant (nouveau si migré, ancien sinon)
 */
export function getComponentPath(componentName: string): string {
  const status = getComponentMigrationStatus(componentName);
  if (!status) return '';
  
  return status.status === 'completed' ? status.newPath : status.oldPath;
}

/**
 * Gestionnaire de redirection pour les anciennes URLs
 */
export function handleLegacyRedirect(pathname: string): void {
  const redirectMap: Record<string, string> = {
    '/bloc-operatoire': '/bloc-operatoire',
    '/bloc-operatoire/planning': '/bloc-operatoire/planning',
    '/bloc-operatoire/salles': '/bloc-operatoire/salles',
    '/bloc-operatoire/trames': '/bloc-operatoire/trames',
    '/bloc-operatoire/regles-supervision': '/bloc-operatoire/regles',
    '/admin/bloc-operatoire': '/bloc-operatoire',
    '/admin/bloc-operatoire/salles': '/bloc-operatoire/salles',
    '/admin/bloc-operatoire/secteurs': '/bloc-operatoire/secteurs',
    '/admin/bloc-operatoire/regles-supervision': '/bloc-operatoire/regles',
  };

  if (redirectMap[pathname]) {
    redirect(redirectMap[pathname]);
  }
}

/**
 * Obtenir un résumé de l'état de migration
 */
export function getMigrationSummary() {
  const total = migrationStatus.length;
  const completed = migrationStatus.filter(m => m.status === 'completed').length;
  const inProgress = migrationStatus.filter(m => m.status === 'in-progress').length;
  const pending = migrationStatus.filter(m => m.status === 'pending').length;

  return {
    total,
    completed,
    inProgress,
    pending,
    percentage: Math.round((completed / total) * 100),
    componentsWithIssues: migrationStatus.filter(m => m.issues && m.issues.length > 0)
  };
}

/**
 * Logger pour tracer les problèmes de migration
 */
export function logMigrationIssue(component: string, issue: string) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`[Migration] ${component}: ${issue}`);
  }
}