'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { userNavigation, adminNavigation, NavigationItem, NavigationGroup } from '@/utils/navigationConfig';
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface SimplifiedNavigationProps {
  className?: string;
}

export function SimplifiedNavigation({ className }: SimplifiedNavigationProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const isAdmin = user?.role === 'ADMIN_TOTAL' || user?.role === 'ADMIN_PARTIEL';

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    );
  };

  const isActiveLink = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const isActive = isActiveLink(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          'hover:bg-medical-guard-50 hover:text-medical-guard-600',
          isActive 
            ? 'bg-medical-guard-100 text-medical-guard-700 border-l-4 border-medical-guard-600' 
            : 'text-gray-700 hover:text-gray-900'
        )}
        onClick={() => setIsOpen(false)}
      >
        {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const renderAdminGroup = (group: NavigationGroup) => {
    const Icon = group.icon;
    const isExpanded = expandedGroups.includes(group.name);

    return (
      <div key={group.name} className="space-y-1">
        <button
          onClick={() => toggleGroup(group.name)}
          className={cn(
            'flex items-center justify-between w-full px-3 py-2 text-sm font-medium',
            'text-gray-900 hover:bg-gray-50 rounded-lg transition-colors'
          )}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
            <span>{group.name}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        
        {isExpanded && (
          <div className="ml-6 space-y-1 border-l border-gray-200 pl-3">
            {group.items.map(renderNavigationItem)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('bg-white border-r border-gray-200', className)}>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Navigation</h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation Content */}
      <div className={cn(
        'p-4 space-y-6',
        'lg:block',
        isOpen ? 'block' : 'hidden'
      )}>
        {/* Navigation Utilisateur - Toujours visible */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
            Menu Principal
          </h3>
          <div className="space-y-1">
            {userNavigation.map(renderNavigationItem)}
          </div>
        </div>

        {/* Navigation Admin - Conditionnelle */}
        {isAdmin && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
              Administration
            </h3>
            <div className="space-y-2">
              {adminNavigation.map(renderAdminGroup)}
            </div>
          </div>
        )}

        {/* Actions Rapides */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
            Actions Rapides
          </h3>
          <div className="space-y-1">
            <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-medical-rest-50 hover:text-medical-rest-700 rounded-lg transition-colors">
              <span className="h-2 w-2 bg-green-500 rounded-full"></span>
              Nouveau Congé
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-medical-oncall-50 hover:text-medical-oncall-700 rounded-lg transition-colors">
              <span className="h-2 w-2 bg-orange-500 rounded-full"></span>
              Échange Garde
            </button>
            {isAdmin && (
              <button className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-medical-guard-50 hover:text-medical-guard-700 rounded-lg transition-colors">
                <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                Mode Urgence
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook pour obtenir le breadcrumb intelligent
export function useBreadcrumb() {
  const pathname = usePathname();
  
  const generateBreadcrumb = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumb = [{ href: '/', label: 'Accueil' }];
    
    // Mapping intelligent des segments
    const segmentMap: Record<string, string> = {
      'planning': 'Planning',
      'conges': 'Congés',
      'notifications': 'Notifications',
      'profil': 'Profil',
      'admin': 'Administration',
      'bloc-operatoire': 'Bloc Opératoire',
      'utilisateurs': 'Personnel',
      'rapports': 'Rapports',
      'command-center': 'Command Center'
    };
    
    let currentPath = '';
    segments.forEach(segment => {
      currentPath += `/${segment}`;
      breadcrumb.push({
        href: currentPath,
        label: segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      });
    });
    
    return breadcrumb;
  };
  
  return generateBreadcrumb();
}