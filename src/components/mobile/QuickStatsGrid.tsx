'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatItem {
  id: string;
  title: string;
  value: string | number;
  change?: number; // pourcentage de changement
  icon: LucideIcon;
  color: 'guard' | 'oncall' | 'vacation' | 'rest' | 'emergency';
  trend?: 'up' | 'down' | 'stable';
  onClick?: () => void;
}

interface QuickStatsGridProps {
  stats: StatItem[];
  className?: string;
}

export function QuickStatsGrid({ stats, className = '' }: QuickStatsGridProps) {
  const colorConfig = {
    guard: {
      bg: 'bg-medical-guard-50',
      border: 'border-l-medical-guard-500',
      text: 'text-medical-guard-700',
      icon: 'text-medical-guard-600'
    },
    oncall: {
      bg: 'bg-medical-oncall-50',
      border: 'border-l-medical-oncall-500',
      text: 'text-medical-oncall-700',
      icon: 'text-medical-oncall-600'
    },
    vacation: {
      bg: 'bg-medical-vacation-50',
      border: 'border-l-medical-vacation-500',
      text: 'text-medical-vacation-700',
      icon: 'text-medical-vacation-600'
    },
    rest: {
      bg: 'bg-medical-rest-50',
      border: 'border-l-medical-rest-500',
      text: 'text-medical-rest-700',
      icon: 'text-medical-rest-600'
    },
    emergency: {
      bg: 'bg-medical-emergency-50',
      border: 'border-l-medical-emergency-500',
      text: 'text-medical-emergency-700',
      icon: 'text-medical-emergency-600'
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '➡️';
      default: return '';
    }
  };

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {stats.map((stat, index) => {
        const colors = colorConfig[stat.color];
        const Icon = stat.icon;
        
        return (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`
              ${colors.bg} ${colors.border}
              rounded-medical p-4 border-l-4
              ${stat.onClick ? 'cursor-pointer hover:shadow-medical transition-all duration-200 active:scale-95' : ''}
              touch-target
            `}
            onClick={stat.onClick}
            role={stat.onClick ? 'button' : undefined}
            tabIndex={stat.onClick ? 0 : undefined}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className={`text-2xl font-bold ${colors.text} mb-1`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 leading-tight">
                  {stat.title}
                </div>
                
                {/* Tendance et changement */}
                {(stat.change !== undefined || stat.trend) && (
                  <div className="flex items-center mt-2 space-x-1">
                    {stat.trend && (
                      <span className="text-xs">
                        {getTrendIcon(stat.trend)}
                      </span>
                    )}
                    {stat.change !== undefined && (
                      <span className={`text-xs font-medium ${getTrendColor(stat.trend)}`}>
                        {stat.change > 0 ? '+' : ''}{stat.change}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className={`${colors.icon} flex-shrink-0 ml-2`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default QuickStatsGrid;