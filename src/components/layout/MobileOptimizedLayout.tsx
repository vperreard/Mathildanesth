'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { MobileHeader } from './MobileHeader';
import { MobileBottomNavigation, BottomNavigationSpacer } from './MobileBottomNavigation';
import { useAuth } from '@/hooks/useAuth';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
}

export function MobileOptimizedLayout({ children }: MobileOptimizedLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  // Détermine si on doit afficher la navigation mobile
  const showMobileNavigation = !pathname.startsWith('/auth') && !pathname.startsWith('/admin');
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header mobile */}
      {showMobileNavigation && (
        <MobileHeader 
          user={user}
          onLogout={logout}
        />
      )}
      
      {/* Contenu principal */}
      <main className={`flex-1 ${showMobileNavigation ? '' : 'pt-safe'}`}>
        <div className="px-4 py-4 safe-area-inset scroll-smooth-mobile">
          {children}
        </div>
        
        {/* Spacer pour éviter que le contenu soit caché par les bottom tabs */}
        {showMobileNavigation && <BottomNavigationSpacer />}
      </main>
      
      {/* Navigation mobile bottom tabs */}
      {showMobileNavigation && <MobileBottomNavigation />}
    </div>
  );
}

export default MobileOptimizedLayout;