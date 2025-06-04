'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  CalendarDays, 
  UserCircle, 
  Settings, 
  Home,
  Stethoscope,
  Bell,
  ClipboardList
} from 'lucide-react';

interface NavItem {
  id: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  medicalType?: 'guard' | 'oncall' | 'vacation' | 'rest';
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    href: '/',
    icon: Home,
    label: 'Accueil',
  },
  {
    id: 'planning',
    href: '/planning',
    icon: CalendarDays,
    label: 'Planning',
    medicalType: 'vacation'
  },
  {
    id: 'bloc',
    href: '/bloc-operatoire',
    icon: Stethoscope,
    label: 'Bloc',
    medicalType: 'guard'
  },
  {
    id: 'conges',
    href: '/leaves',
    icon: ClipboardList,
    label: 'Congés',
    medicalType: 'rest'
  },
  {
    id: 'notifications',
    href: '/notifications',
    icon: Bell,
    label: 'Alertes',
    badge: 3,
    medicalType: 'oncall'
  }
];

interface MobileBottomNavigationProps {
  className?: string;
}

export function MobileBottomNavigation({ className = '' }: MobileBottomNavigationProps) {
  const pathname = usePathname();
  
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const getMedicalColorClass = (medicalType?: string, isActiveTab: boolean = false) => {
    if (!medicalType) return '';
    
    const colorMap = {
      guard: isActiveTab ? 'text-medical-guard-600 bg-medical-guard-50' : 'text-medical-guard-500',
      oncall: isActiveTab ? 'text-medical-oncall-600 bg-medical-oncall-50' : 'text-medical-oncall-500',
      vacation: isActiveTab ? 'text-medical-vacation-600 bg-medical-vacation-50' : 'text-medical-vacation-500',
      rest: isActiveTab ? 'text-medical-rest-600 bg-medical-rest-50' : 'text-medical-rest-500',
    };
    
    return colorMap[medicalType] || '';
  };

  // Cache les bottom tabs sur certaines pages (login, admin, etc.)
  const hiddenPaths = ['/auth', '/admin', '/login'];
  const shouldHide = hiddenPaths.some(path => pathname.startsWith(path));
  
  if (shouldHide) return null;

  return (
    <nav 
      className={`bottom-tabs ${className}`}
      role="navigation" 
      aria-label="Navigation principale mobile"
    >
      {navigationItems.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        
        return (
          <Link
            key={item.id}
            href={item.href}
            className={`bottom-tab ${active ? 'active' : ''} ${getMedicalColorClass(item.medicalType, active)}`}
            aria-label={`${item.label}${item.badge ? ` (${item.badge} notifications)` : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <div className="relative">
              <Icon 
                className={`w-6 h-6 transition-all duration-200 ${
                  active ? 'scale-110' : 'scale-100'
                }`}
                aria-hidden="true"
              />
              {item.badge && item.badge > 0 && (
                <div className="absolute -top-2 -right-2 bg-medical-guard-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium shadow-md">
                  {item.badge > 99 ? '99+' : item.badge}
                </div>
              )}
            </div>
            <span 
              className={`text-xs font-medium mt-1 transition-all duration-200 ${
                active ? 'opacity-100' : 'opacity-75'
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// Composant pour espacer le contenu au-dessus des bottom tabs
export function BottomNavigationSpacer({ className = '' }: { className?: string }) {
  return <div className={`h-20 ${className}`} />;
}

export default MobileBottomNavigation;