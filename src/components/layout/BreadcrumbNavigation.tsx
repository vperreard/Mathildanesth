'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBreadcrumb } from './SimplifiedNavigation';

interface BreadcrumbNavigationProps {
  className?: string;
}

export function BreadcrumbNavigation({ className }: BreadcrumbNavigationProps) {
  const breadcrumb = useBreadcrumb();

  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-gray-600', className)}>
      {breadcrumb.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
          )}
          
          {index === 0 ? (
            <Link
              href={item.href}
              className="flex items-center gap-1 text-gray-500 hover:text-medical-guard-600 transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ) : index === breadcrumb.length - 1 ? (
            <span className="font-medium text-gray-900">{item.label}</span>
          ) : (
            <Link
              href={item.href}
              className="text-gray-500 hover:text-medical-guard-600 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

// Composant actions rapides contextuelles
export function QuickActions() {
  const breadcrumb = useBreadcrumb();
  const currentPage = breadcrumb[breadcrumb.length - 1]?.label;

  const getQuickActions = () => {
    switch (currentPage) {
      case 'Planning':
        return [
          { label: 'Nouveau Planning', action: () => {}, color: 'guard' },
          { label: 'Vue Équipe', action: () => {}, color: 'oncall' }
        ];
      case 'Congés':
        return [
          { label: 'Nouvelle Demande', action: () => {}, color: 'rest' },
          { label: 'Voir Soldes', action: () => {}, color: 'vacation' }
        ];
      case 'Command Center':
        return [
          { label: 'Mode Urgence', action: () => {}, color: 'guard' },
          { label: 'Générer Planning', action: () => {}, color: 'oncall' }
        ];
      default:
        return [];
    }
  };

  const actions = getQuickActions();

  if (actions.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            action.color === 'guard' && 'bg-medical-guard-100 text-medical-guard-700 hover:bg-medical-guard-200',
            action.color === 'oncall' && 'bg-medical-oncall-100 text-medical-oncall-700 hover:bg-medical-oncall-200',
            action.color === 'rest' && 'bg-medical-rest-100 text-medical-rest-700 hover:bg-medical-rest-200',
            action.color === 'vacation' && 'bg-medical-vacation-100 text-medical-vacation-700 hover:bg-medical-vacation-200'
          )}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}