'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Header from '../Header';
import Footer from '../Footer';
import { MobileBottomNavigation, BottomNavigationSpacer } from './MobileBottomNavigation';
import { useAuth } from '@/hooks/useAuth';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  // Détecte si l'écran est mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Détermine si on doit afficher la navigation mobile
  const showMobileNavigation = isMobile && 
    user && 
    pathname && 
    !pathname.startsWith('/auth') && 
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/login');

  // Détermine si on doit afficher le header/footer desktop
  const showDesktopLayout = !isMobile || 
    (pathname && (pathname.startsWith('/admin') || pathname.startsWith('/auth')));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header desktop ou mobile selon le contexte */}
      {showDesktopLayout && <Header />}
      
      {/* Contenu principal */}
      <main className={`flex-1 ${showMobileNavigation ? 'pb-safe' : ''}`}>
        {/* Container responsive avec padding adaptatif */}
        <div className={`
          ${showMobileNavigation ? 'px-4 py-4' : 'container mx-auto px-4 py-8'}
          ${showDesktopLayout ? '' : 'safe-area-inset'}
          scroll-smooth-mobile
        `}>
          {children}
        </div>
        
        {/* Spacer pour éviter que le contenu soit caché par les bottom tabs */}
        {showMobileNavigation && <BottomNavigationSpacer />}
      </main>
      
      {/* Footer desktop */}
      {showDesktopLayout && <Footer />}
      
      {/* Navigation mobile bottom tabs */}
      {showMobileNavigation && <MobileBottomNavigation />}
    </div>
  );
}

export default ResponsiveLayout;