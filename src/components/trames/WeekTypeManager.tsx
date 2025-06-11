/**
 * Composant de gestion avancée des semaines paires/impaires
 * Permet de visualiser et gérer les affectations par type de semaine
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Calendar,
  CalendarDays,
  Copy,
  Layers,
  ToggleLeft,
  ToggleRight,
  Info,
  ArrowRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format, getWeek, startOfYear, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toastManager } from '@/lib/toast-manager';

export type WeekType = 'ALL' | 'EVEN' | 'ODD';

interface WeekTypeManagerProps {
  trameId: string;
  currentWeekType: WeekType;
  affectations: Array<{
    id: string;
    weekType: WeekType;
    dayOfWeek: number;
    period: string;
    roomId: string;
    userId?: string;
    isActive: boolean;
  }>;
  onUpdateWeekType: (affectationIds: string[], newWeekType: WeekType) => void;
  onDuplicateToWeekType: (sourceWeekType: WeekType, targetWeekType: WeekType) => void;
  readOnly?: boolean;
}

export function WeekTypeManager({
  trameId,
  currentWeekType,
  affectations,
  onUpdateWeekType,
  onDuplicateToWeekType,
  readOnly = false,
}: WeekTypeManagerProps) {
  const [selectedWeekType, setSelectedWeekType] = useState<WeekType>('ALL');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Calculer les statistiques par type de semaine
  const weekTypeStats = useMemo(() => {
    const stats = {
      ALL: { count: 0, active: 0 },
      EVEN: { count: 0, active: 0 },
      ODD: { count: 0, active: 0 },
    };

    affectations.forEach(aff => {
      const type = aff.weekType || 'ALL';
      stats[type].count++;
      if (aff.isActive) {
        stats[type].active++;
      }
    });

    return stats;
  }, [affectations]);

  // Filtrer les affectations par type de semaine
  const filteredAffectations = useMemo(() => {
    if (selectedWeekType === 'ALL') {
      return affectations;
    }
    return affectations.filter(aff => 
      aff.weekType === selectedWeekType || aff.weekType === 'ALL'
    );
  }, [affectations, selectedWeekType]);

  // Calculer les semaines paires/impaires pour l'année
  const weekCalendar = useMemo(() => {
    const weeks = [];
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    
    for (let i = 0; i < 52; i++) {
      const weekStart = addWeeks(yearStart, i);
      const weekNumber = getWeek(weekStart, { locale: fr });
      const isEven = weekNumber % 2 === 0;
      
      weeks.push({
        number: weekNumber,
        start: weekStart,
        type: isEven ? 'EVEN' : 'ODD' as WeekType,
      });
    }
    
    return weeks;
  }, [selectedYear]);

  // Convertir des affectations vers un type de semaine
  const handleConvertToWeekType = (targetType: WeekType) => {
    const affectationIds = filteredAffectations
      .filter(aff => aff.weekType !== targetType)
      .map(aff => aff.id);
    
    if (affectationIds.length === 0) {
      toastManager.info('Aucune affectation à convertir');
      return;
    }
    
    onUpdateWeekType(affectationIds, targetType);
    toastManager.success(`${affectationIds.length} affectations converties en ${getWeekTypeLabel(targetType)}`);
  };

  // Dupliquer les affectations d'un type vers un autre
  const handleDuplicate = (source: WeekType, target: WeekType) => {
    if (source === target) {
      toastManager.warning('Source et destination identiques');
      return;
    }
    
    onDuplicateToWeekType(source, target);
  };

  // Helper pour obtenir le label du type de semaine
  const getWeekTypeLabel = (type: WeekType): string => {
    switch (type) {
      case 'ALL':
        return 'Toutes les semaines';
      case 'EVEN':
        return 'Semaines paires';
      case 'ODD':
        return 'Semaines impaires';
    }
  };

  // Helper pour obtenir la couleur du badge
  const getWeekTypeBadgeVariant = (type: WeekType): string => {
    switch (type) {
      case 'ALL':
        return 'default';
      case 'EVEN':
        return 'secondary';
      case 'ODD':
        return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      {/* En-tête avec statistiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              <span>Gestion des semaines paires/impaires</span>
            </div>
            <Badge variant={getWeekTypeBadgeVariant(currentWeekType)}>
              {getWeekTypeLabel(currentWeekType)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {(['ALL', 'EVEN', 'ODD'] as WeekType[]).map(type => (
              <div key={type} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="text-2xl font-bold">{weekTypeStats[type].count}</div>
                <div className="text-xs text-gray-600">
                  {getWeekTypeLabel(type)}
                </div>
                <div className="text-xs text-green-600">
                  {weekTypeStats[type].active} actives
                </div>
              </div>
            ))}
          </div>

          {/* Contrôles */}
          <div className="flex items-center gap-2 mb-4">
            <Label htmlFor="week-type-filter" className="text-sm">
              Filtrer par:
            </Label>
            <Select
              value={selectedWeekType}
              onValueChange={(value) => setSelectedWeekType(value as WeekType)}
            >
              <SelectTrigger id="week-type-filter" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toutes les semaines</SelectItem>
                <SelectItem value="EVEN">Semaines paires</SelectItem>
                <SelectItem value="ODD">Semaines impaires</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-2">
              <Switch
                id="preview-mode"
                checked={showPreview}
                onCheckedChange={setShowPreview}
              />
              <Label htmlFor="preview-mode" className="text-sm">
                Aperçu calendrier
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets principaux */}
      <Tabs defaultValue="manage" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manage">Gérer</TabsTrigger>
          <TabsTrigger value="duplicate">Dupliquer</TabsTrigger>
          <TabsTrigger value="calendar">Calendrier</TabsTrigger>
        </TabsList>

        {/* Onglet Gestion */}
        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversion par type de semaine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Convertir les affectations filtrées ({filteredAffectations.length}) vers:
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {(['ALL', 'EVEN', 'ODD'] as WeekType[]).map(type => (
                  <Button
                    key={type}
                    variant="outline"
                    onClick={() => handleConvertToWeekType(type)}
                    disabled={readOnly || selectedWeekType === type}
                    className="flex flex-col gap-1 h-auto py-3"
                  >
                    {type === 'ALL' && <Layers className="h-4 w-4" />}
                    {type === 'EVEN' && <ToggleLeft className="h-4 w-4" />}
                    {type === 'ODD' && <ToggleRight className="h-4 w-4" />}
                    <span className="text-xs">{getWeekTypeLabel(type)}</span>
                  </Button>
                ))}
              </div>

              {showPreview && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <Info className="h-4 w-4" />
                    <span>
                      Cette action convertira {filteredAffectations.length} affectations.
                      Les affectations déjà du type sélectionné ne seront pas modifiées.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Duplication */}
        <TabsContent value="duplicate">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Duplication entre types de semaine</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Duplication Paire → Impaire */}
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">Paires</Badge>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <Badge variant="outline">Impaires</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicate('EVEN', 'ODD')}
                    disabled={readOnly || weekTypeStats.EVEN.count === 0}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Dupliquer
                  </Button>
                </div>

                {/* Duplication Impaire → Paire */}
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Impaires</Badge>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <Badge variant="secondary">Paires</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDuplicate('ODD', 'EVEN')}
                    disabled={readOnly || weekTypeStats.ODD.count === 0}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Dupliquer
                  </Button>
                </div>

                {/* Duplication Toutes → Paire/Impaire */}
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge>Toutes</Badge>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <div className="flex gap-1">
                      <Badge variant="secondary">Paires</Badge>
                      <Badge variant="outline">Impaires</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleDuplicate('ALL', 'EVEN');
                      handleDuplicate('ALL', 'ODD');
                    }}
                    disabled={readOnly || weekTypeStats.ALL.count === 0}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Dupliquer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Calendrier */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Calendrier des semaines {selectedYear}</span>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2].map(offset => {
                      const year = new Date().getFullYear() + offset;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-13 gap-1 text-xs">
                {/* En-têtes des mois */}
                <div className="font-medium text-center">Sem.</div>
                {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'].map(month => (
                  <div key={month} className="font-medium text-center">
                    {month}
                  </div>
                ))}

                {/* Semaines */}
                {weekCalendar.slice(0, 4).map((week, index) => (
                  <React.Fragment key={week.number}>
                    <div className="text-center font-medium">
                      {week.number}
                    </div>
                    {Array.from({ length: 12 }).map((_, monthIndex) => {
                      const weekInMonth = weekCalendar.find(w => {
                        const weekMonth = w.start.getMonth();
                        return w.number === week.number + (monthIndex * 4) && weekMonth === monthIndex;
                      });
                      
                      if (!weekInMonth) return <div key={monthIndex} />;
                      
                      return (
                        <TooltipProvider key={monthIndex}>
                          <Tooltip>
                            <TooltipTrigger>
                              <div
                                className={`
                                  p-1 text-center rounded cursor-default
                                  ${weekInMonth.type === 'EVEN' 
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                                  }
                                `}
                              >
                                {weekInMonth.type === 'EVEN' ? 'P' : 'I'}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                Semaine {weekInMonth.number} - {weekInMonth.type === 'EVEN' ? 'Paire' : 'Impaire'}
                                <br />
                                {format(weekInMonth.start, 'dd MMM', { locale: fr })}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900 rounded" />
                  <span>Semaines paires</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-orange-100 dark:bg-orange-900 rounded" />
                  <span>Semaines impaires</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}