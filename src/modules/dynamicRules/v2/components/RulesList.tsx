'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Edit, 
  Copy, 
  Archive,
  Play,
  History,
  AlertTriangle
} from 'lucide-react';
import { RuleV2 } from '../types/ruleV2.types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RulesListProps {
  rules: RuleV2[];
  isLoading: boolean;
  onEdit: (rule: RuleV2) => void;
  onDelete: (rule: RuleV2) => void;
  onSimulate?: (rule: RuleV2) => void;
  onViewHistory?: (rule: RuleV2) => void;
  onDuplicate?: (rule: RuleV2) => void;
}

export const RulesList: React.FC<RulesListProps> = ({
  rules,
  isLoading,
  onEdit,
  onDelete,
  onSimulate,
  onViewHistory,
  onDuplicate
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'archived':
        return <Badge variant="outline">Archivée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeColors = {
      PLANNING: 'bg-blue-100 text-blue-800',
      LEAVE: 'bg-green-100 text-green-800',
      CONSTRAINT: 'bg-orange-100 text-orange-800',
      ALLOCATION: 'bg-purple-100 text-purple-800',
      SUPERVISION: 'bg-pink-100 text-pink-800'
    };

    return (
      <Badge className={typeColors[type] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  const getPriorityIndicator = (priority: number) => {
    if (priority >= 20) {
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
    if (priority >= 10) {
      return <div className="w-2 h-2 rounded-full bg-orange-500" />;
    }
    return <div className="w-2 h-2 rounded-full bg-green-500" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Aucune règle trouvée</p>
          <p className="text-sm text-muted-foreground mt-2">
            Créez votre première règle pour commencer
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {rules.map((rule) => (
        <Card key={rule.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getPriorityIndicator(rule.priority || 0)}
                  <h3 className="text-lg font-semibold">{rule.name}</h3>
                  {!rule.enabled && (
                    <Badge variant="outline" className="text-gray-500">
                      Désactivée
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {rule.description}
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(rule.status)}
                    {getTypeBadge(rule.type)}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {rule.conditions?.length || 0} condition{(rule.conditions?.length || 0) > 1 ? 's' : ''} • 
                    {rule.actions?.length || 0} action{(rule.actions?.length || 0) > 1 ? 's' : ''}
                  </div>

                  {rule.tags && rule.tags.length > 0 && (
                    <div className="flex gap-1">
                      {rule.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {rule.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{rule.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {rule.effectiveDate && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Effective: {format(new Date(rule.effectiveDate), 'dd MMM yyyy', { locale: fr })}
                    {rule.expirationDate && (
                      <> • Expire: {format(new Date(rule.expirationDate), 'dd MMM yyyy', { locale: fr })}</>
                    )}
                  </div>
                )}

                {rule.conflictsWith && rule.conflictsWith.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-orange-600">
                      {rule.conflictsWith.length} conflit{rule.conflictsWith.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {rule.metrics && (
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>
                      {rule.metrics.evaluationCount} évaluations
                    </span>
                    <span>
                      {rule.metrics.averageExecutionTime.toFixed(0)}ms moy.
                    </span>
                    {rule.metrics.successRate !== undefined && (
                      <span>
                        {(rule.metrics.successRate * 100).toFixed(0)}% succès
                      </span>
                    )}
                  </div>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(rule)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                  
                  {onDuplicate && (
                    <DropdownMenuItem onClick={() => onDuplicate(rule)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Dupliquer
                    </DropdownMenuItem>
                  )}

                  {onSimulate && (
                    <DropdownMenuItem onClick={() => onSimulate(rule)}>
                      <Play className="mr-2 h-4 w-4" />
                      Simuler
                    </DropdownMenuItem>
                  )}

                  {onViewHistory && (
                    <DropdownMenuItem onClick={() => onViewHistory(rule)}>
                      <History className="mr-2 h-4 w-4" />
                      Historique
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem 
                    onClick={() => onDelete(rule)}
                    className="text-destructive"
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archiver
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};