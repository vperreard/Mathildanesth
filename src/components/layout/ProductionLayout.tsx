'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MobileBottomNavigation, BottomNavigationSpacer } from './MobileBottomNavigation';
import { useAuth } from '@/hooks/useAuth';

// Import dynamique des composants lourds pour éviter les erreurs de compilation
const Header = dynamic(() => import('../Header'), {
  ssr: false,
  loading: () => <div className="h-16 bg-primary-100 animate-pulse" />
});

const Footer = dynamic(() => import('../Footer'), {
  ssr: false,  
  loading: () => <div className="h-10 bg-gray-100 animate-pulse" />
});

interface ProductionLayoutProps {
  children: React.ReactNode;
}

export function ProductionLayout({ children }: ProductionLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Évite les erreurs d'hydratation
  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <div className="h-16 bg-primary-100 animate-pulse" />
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
        <div className="h-10 bg-gray-100 animate-pulse" />
      </div>
    );
  }

  const showMobileNavigation = isMobile && 
    user && 
    pathname && 
    !pathname.startsWith('/auth') && 
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/login');

  const showDesktopLayout = !isMobile || 
    (pathname && (pathname.startsWith('/admin') || pathname.startsWith('/auth')));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header desktop ou mobile selon le contexte */}
      {showDesktopLayout && <Header />}
      
      {/* Contenu principal */}
      <main className={`flex-1 ${showMobileNavigation ? 'pb-safe' : ''}`}>
        <div className={`
          ${showMobileNavigation ? 'px-4 py-4' : 'container mx-auto px-4 py-8'}
          ${showDesktopLayout ? '' : 'safe-area-inset'}
          scroll-smooth-mobile
        `}>
          {children}
        </div>
        
        {showMobileNavigation && <BottomNavigationSpacer />}
      </main>
      
      {/* Footer desktop */}
      {showDesktopLayout && <Footer />}
      
      {/* Navigation mobile bottom tabs */}
      {showMobileNavigation && <MobileBottomNavigation />}
    </div>
  );
}

export default ProductionLayout;