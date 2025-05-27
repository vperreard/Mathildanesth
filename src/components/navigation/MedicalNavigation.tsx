'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  X, 
  ChevronDown,
  Users,
  Calendar,
  Clock,
  MessageCircle,
  User,
  HelpCircle,
  BarChart3,
  FileText,
  Settings,
  Activity
} from 'lucide-react';
import { NavigationItem, adminNavigation } from '@/utils/navigationConfig';

interface MedicalNavigationProps {
  navigation: NavigationItem[];
  userRole: string;
  mobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
}

export default function MedicalNavigation({
  navigation,
  userRole,
  mobileMenuOpen,
  onMobileMenuToggle
}: MedicalNavigationProps) {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const isAdmin = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(userRole);

  // Menu utilisateur (5 liens max)
  const userMenuItems = navigation.slice(0, 5);
  
  // Liens admin si applicable
  const adminMenuItems = isAdmin ? adminNavigation : [];

  const isActivePath = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'MAR':
        return <Activity className="h-4 w-4 text-red-500" />;
      case 'IADE':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'ADMIN_TOTAL':
      case 'ADMIN_PARTIEL':
        return <Settings className="h-4 w-4 text-purple-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      'MAR': 'Médecin Anesthésiste',
      'IADE': 'Infirmier Anesthésiste',
      'ADMIN_TOTAL': 'Administrateur',
      'ADMIN_PARTIEL': 'Admin Partiel',
      'CHIRURGIEN': 'Chirurgien'
    };
    return roleLabels[role] || role;
  };

  return (
    <>
      {/* Navigation Desktop */}
      <nav className="hidden lg:flex items-center space-x-1" aria-label="Navigation principale">
        {/* Menu utilisateur principal */}
        <div className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          {userMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title={item.description}
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span className="hidden xl:inline">{item.label}</span>
                {item.badge && (
                  <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>

        {/* Menu admin groupé */}
        {isAdmin && (
          <div className="flex items-center ml-4">
            {adminMenuItems.map((group) => {
              const GroupIcon = group.icon;
              
              return (
                <DropdownMenu
                  key={group.name}
                  open={openDropdown === group.name}
                  onOpenChange={(open) => setOpenDropdown(open ? group.name : null)}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {GroupIcon && <GroupIcon className="h-4 w-4" />}
                      <span className="hidden xl:inline">{group.name}</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="start">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      {GroupIcon && <GroupIcon className="h-4 w-4" />}
                      {group.name}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = isActivePath(item.href);
                      
                      return (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link
                            href={item.href}
                            className={`flex items-center gap-3 px-2 py-2 ${
                              isActive ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : ''
                            }`}
                          >
                            {ItemIcon && <ItemIcon className="h-4 w-4" />}
                            <div className="flex-1">
                              <div className="font-medium">{item.label}</div>
                              {item.description && (
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
          </div>
        )}

        {/* Indicateur de rôle */}
        <div className="flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium">
          {getRoleIcon(userRole)}
          <span className="hidden xl:inline text-slate-600 dark:text-slate-300">
            {getRoleLabel(userRole)}
          </span>
        </div>
      </nav>

      {/* Bouton menu mobile */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMobileMenuToggle}
          className="p-2"
          aria-label="Menu principal"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-lg"
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              {/* Rôle utilisateur */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                {getRoleIcon(userRole)}
                <div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">
                    {getRoleLabel(userRole)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Navigation adaptée à votre rôle
                  </div>
                </div>
              </div>

              {/* Navigation utilisateur */}
              <div className="space-y-1 mb-4">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-1">
                  Navigation principale
                </h3>
                {userMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActivePath(item.href);
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileMenuToggle}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {Icon && <Icon className="h-5 w-5" />}
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        {item.description && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {item.description}
                          </div>
                        )}
                      </div>
                      {item.badge && (
                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Navigation admin mobile */}
              {isAdmin && (
                <div className="space-y-3">
                  {adminMenuItems.map((group) => {
                    const GroupIcon = group.icon;
                    
                    return (
                      <div key={group.name} className="space-y-1">
                        <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-1">
                          {GroupIcon && <GroupIcon className="h-3 w-3" />}
                          {group.name}
                        </h3>
                        {group.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isActive = isActivePath(item.href);
                          
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={onMobileMenuToggle}
                              className={`flex items-center gap-3 px-3 py-2 ml-4 rounded-lg transition-colors ${
                                isActive
                                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              {ItemIcon && <ItemIcon className="h-4 w-4" />}
                              <div className="flex-1">
                                <div className="font-medium text-sm">{item.label}</div>
                                {item.description && (
                                  <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}