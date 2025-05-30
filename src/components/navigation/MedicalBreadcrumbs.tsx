'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { getBreadcrumbs, getQuickLinks } from '@/utils/navigationConfig';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MedicalBreadcrumbsProps {
  userRole: string;
}

export function MedicalBreadcrumbs({ userRole }: MedicalBreadcrumbsProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname, userRole);
  const quickLinks = getQuickLinks(userRole);

  // Ne pas afficher sur la page d'accueil
  if (pathname === '/') return null;

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-1 text-sm" aria-label="Fil d'Ariane">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={`${crumb.label}-${index}`}>
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {index === 0 && <Home className="h-4 w-4" />}
                    <span>{crumb.label}</span>
                  </Link>
                ) : (
                  <span className="flex items-center gap-1 text-slate-900 dark:text-slate-100 font-medium">
                    {index === 0 && <Home className="h-4 w-4" />}
                    <span>{crumb.label}</span>
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Actions rapides contextuelles */}
          <div className="hidden md:flex items-center space-x-2">
            {quickLinks.slice(0, 3).map((link) => {
              const Icon = link.icon;
              
              return (
                <Button
                  key={link.href}
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-2"
                >
                  <Link href={link.href} className="flex items-center gap-1">
                    {Icon && <Icon className="h-3 w-3" />}
                    <span>{link.label}</span>
                    {link.badge && (
                      <Badge variant="destructive" className="ml-1 h-4 px-1 text-[9px]">
                        {link.badge}
                      </Badge>
                    )}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}