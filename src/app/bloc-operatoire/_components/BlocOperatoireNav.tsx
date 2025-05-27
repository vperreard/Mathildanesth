'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  CalendarDays, 
  Building2, 
  Layout, 
  BookOpen, 
  Shield,
  Grid3X3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navigation = [
  { 
    name: 'Planning', 
    href: '/bloc-operatoire/planning', 
    icon: CalendarDays,
    requiresAuth: false 
  },
  { 
    name: 'Salles', 
    href: '/bloc-operatoire/salles', 
    icon: Building2,
    requiresAuth: false 
  },
  { 
    name: 'Secteurs', 
    href: '/bloc-operatoire/secteurs', 
    icon: Layout,
    requiresAuth: true,
    requiredRole: 'ADMIN'
  },
  { 
    name: 'Règles', 
    href: '/bloc-operatoire/regles', 
    icon: Shield,
    requiresAuth: true,
    requiredRole: 'ADMIN'
  },
  { 
    name: 'Tableaux de service', 
    href: '/bloc-operatoire/tableaux de service', 
    icon: Grid3X3,
    requiresAuth: false 
  },
];

// Navigation de développement (à retirer en production)
const devNavigation = process.env.NODE_ENV === 'development' ? [
  {
    name: 'Migration',
    href: '/bloc-operatoire/migration-status',
    icon: BookOpen,
    requiresAuth: true,
    requiredRole: 'ADMIN',
    isDev: true
  }
] : [];

export default function BlocOperatoireNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Combiner navigation normale et dev
  const allNavigation = [...navigation, ...devNavigation];

  // Filtrer la navigation selon les permissions
  const accessibleNavigation = allNavigation.filter(item => {
    if (!item.requiresAuth) return true;
    if (!user) return false;
    if (item.requiredRole === 'ADMIN' && !isAdmin) return false;
    return true;
  });

  return (
    <nav className="-mb-px flex space-x-8" aria-label="Navigation bloc opératoire">
      {accessibleNavigation.map((item) => {
        const isActive = pathname?.startsWith(item.href);
        const Icon = item.icon;
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              isActive
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              className={cn(
                isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                '-ml-0.5 mr-2 h-5 w-5'
              )}
              aria-hidden="true"
            />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}