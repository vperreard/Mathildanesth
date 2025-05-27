'use client';

import React from 'react';
import Link from 'next/link';
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
  Zap, 
  Plus, 
  Calendar, 
  Clock, 
  UserCheck, 
  ClipboardList,
  Activity,
  Users,
  FileText
} from 'lucide-react';
import { getQuickLinks } from '@/utils/navigationConfig';

interface QuickActionsProps {
  userRole: string;
}

export function QuickActions({ userRole }: QuickActionsProps) {
  const quickLinks = getQuickLinks(userRole);

  if (quickLinks.length === 0) return null;

  // Actions les plus importantes en accès direct
  const primaryActions = quickLinks.slice(0, 2);
  const secondaryActions = quickLinks.slice(2);

  return (
    <div className="flex items-center gap-1">
      {/* Actions principales */}
      {primaryActions.map((action) => {
        const Icon = action.icon;
        
        return (
          <Button
            key={action.href}
            asChild
            variant="outline"
            size="sm"
            className="h-8 px-2 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300 dark:hover:border-blue-700"
          >
            <Link href={action.href} className="flex items-center gap-1">
              {Icon && <Icon className="h-3 w-3" />}
              <span className="hidden lg:inline text-xs">{action.label}</span>
              {action.badge && (
                <Badge variant="destructive" className="ml-1 h-4 px-1 text-[9px]">
                  {action.badge}
                </Badge>
              )}
            </Link>
          </Button>
        );
      })}

      {/* Menu actions secondaires */}
      {secondaryActions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 border-slate-200 dark:border-slate-700"
            >
              <Zap className="h-3 w-3" />
              <span className="hidden lg:inline text-xs ml-1">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Actions Rapides
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {secondaryActions.map((action) => {
              const Icon = action.icon;
              
              return (
                <DropdownMenuItem key={action.href} asChild>
                  <Link href={action.href} className="flex items-center gap-3">
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{action.label}</span>
                    {action.badge && (
                      <Badge variant="destructive" className="ml-auto h-4 px-1 text-[9px]">
                        {action.badge}
                      </Badge>
                    )}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}