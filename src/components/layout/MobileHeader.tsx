'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  Search, 
  AlertCircle,
  Clock,
  User,
  LogOut,
  Settings
} from 'lucide-react';
import { UniversalSearch } from '../UniversalSearch';

interface MobileHeaderProps {
  user?: {
    name: string;
    role: string;
    avatar?: string;
  };
  onLogout?: () => void;
  className?: string;
}

export function MobileHeader({ user, onLogout, className = '' }: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);
  const toggleSearch = () => setIsSearchOpen(!isSearchOpen);
  
  // Obtient le titre de la page actuelle
  const getPageTitle = () => {
    const titles = {
      '/': 'Accueil',
      '/planning': 'Planning',
      '/bloc-operatoire': 'Bloc Opératoire',
      '/leaves': 'Congés',
      '/notifications': 'Notifications',
      '/profile': 'Profil',
      '/settings': 'Paramètres',
    };
    
    // Recherche exacte d'abord
    if (titles[pathname]) return titles[pathname];
    
    // Recherche par préfixe
    for (const [path, title] of Object.entries(titles)) {
      if (pathname.startsWith(path) && path !== '/') {
        return title;
      }
    }
    
    return 'Mathildanesth';
  };

  // Menu items pour la navigation mobile
  const menuItems = [
    { href: '/', label: 'Accueil', icon: '🏠' },
    { href: '/planning', label: 'Planning Hebdomadaire', icon: '📅' },
    { href: '/bloc-operatoire', label: 'Bloc Opératoire', icon: '🏥' },
    { href: '/leaves', label: 'Gestion des Congés', icon: '✈️' },
    { href: '/notifications', label: 'Notifications', icon: '🔔' },
    { href: '/profile', label: 'Mon Profil', icon: '👤' },
    { href: '/settings', label: 'Paramètres', icon: '⚙️' },
  ];

  return (
    <>
      {/* Header principal */}
      <header className={`bg-white border-b border-gray-200 sticky top-0 z-40 ${className}`}>
        <div className="flex items-center justify-between px-4 py-3 safe-area-inset">
          {/* Bouton menu hamburger */}
          <button
            onClick={toggleMenu}
            className="touch-target p-2 -ml-2 rounded-lg hover:bg-gray-100 focus:bg-gray-100 focus-medical"
            aria-label="Ouvrir le menu"
            aria-expanded={isMenuOpen}
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          
          {/* Titre de la page */}
          <h1 className="text-lg font-semibold text-gray-900 truncate mx-4 flex-1 text-center">
            {getPageTitle()}
          </h1>
          
          {/* Actions rapides */}
          <div className="flex items-center space-x-2">
            {/* Bouton recherche */}
            <button
              onClick={toggleSearch}
              className="touch-target p-2 rounded-lg hover:bg-gray-100 focus:bg-gray-100 focus-medical"
              aria-label="Rechercher"
            >
              <Search className="w-5 h-5 text-gray-700" />
            </button>
            
            {/* Indicateur de garde/astreinte */}
            {user && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-medical-guard-500 rounded-full animate-pulse-medical"></div>
                <span className="text-xs text-medical-guard-600 font-medium hidden sm:inline">
                  Garde
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Barre de progression de garde (optionnelle) */}
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-medical-oncall-400 w-1/3 transition-all duration-300"></div>
        </div>
      </header>

      {/* Overlay menu mobile */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeMenu}
            aria-hidden="true"
          />
          
          {/* Menu coulissant */}
          <div className="fixed top-0 left-0 w-80 max-w-[85vw] h-full bg-white shadow-xl animate-slide-up">
            {/* Header du menu */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-medical-vacation-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-medical-vacation-600" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{user?.name || 'Utilisateur'}</p>
                  <p className="text-sm text-gray-500">{user?.role || 'Médecin'}</p>
                </div>
              </div>
              
              <button
                onClick={closeMenu}
                className="touch-target p-2 -mr-2 rounded-lg hover:bg-gray-100"
                aria-label="Fermer le menu"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>
            
            {/* Navigation */}
            <nav className="py-4">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={`flex items-center space-x-3 px-4 py-3 text-base font-medium transition-colors touch-target ${
                      isActive 
                        ? 'bg-medical-vacation-50 text-medical-vacation-700 border-r-4 border-medical-vacation-500' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="text-xl" role="img" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            
            {/* Actions utilisateur */}
            <div className="absolute bottom-4 left-4 right-4 space-y-2">
              <Link
                href="/settings"
                onClick={closeMenu}
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg touch-target"
              >
                <Settings className="w-5 h-5" />
                <span>Paramètres</span>
              </Link>
              
              {onLogout && (
                <button
                  onClick={() => {
                    closeMenu();
                    onLogout();
                  }}
                  className="flex items-center space-x-3 px-4 py-3 text-medical-guard-600 hover:bg-medical-guard-50 rounded-lg w-full touch-target"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Déconnexion</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de recherche */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white md:hidden">
          <div className="flex flex-col h-full">
            {/* Header de recherche */}
            <div className="flex items-center p-4 border-b border-gray-200">
              <button
                onClick={toggleSearch}
                className="touch-target p-2 -ml-2 mr-3 rounded-lg hover:bg-gray-100"
                aria-label="Fermer la recherche"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
              <div className="flex-1">
                <UniversalSearch 
                  placeholder="Rechercher un patient, planning..."
                  autoFocus
                  onClose={toggleSearch}
                />
              </div>
            </div>
            
            {/* Contenu de recherche */}
            <div className="flex-1 p-4">
              <div className="text-center text-gray-500 mt-8">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Tapez pour rechercher</p>
                <p className="text-sm mt-2">Patients, plannings, chirurgiens...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MobileHeader;