'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  Calendar,
  Clock,
  Users,
  BarChart3,
  Grid3X3,
  List,
  Filter,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
  Maximize2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Types pour le planning multi-vues
export type PlanningView = 'day' | 'week' | 'month' | 'team' | 'workload';

export interface PlanningEvent {
  id: string;
  title: string;
  type: 'garde' | 'vacation' | 'conge' | 'formation' | 'astreinte';
  startTime: Date;
  endTime: Date;
  assignedTo: string[];
  location: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  specialty: string;
  workload: number; // 0-100%
}

export interface PlanningFilter {
  specialty: string[];
  location: string[];
  status: string[];
  assignedTo: string[];
  eventType: string[];
}

interface MultiViewPlanningProps {
  events: PlanningEvent[];
  onEventUpdate?: (event: PlanningEvent) => void;
  onEventCreate?: (event: Partial<PlanningEvent>) => void;
  className?: string;
}

export function MultiViewPlanning({ 
  events, 
  onEventUpdate, 
  onEventCreate,
  className 
}: MultiViewPlanningProps) {
  const [currentView, setCurrentView] = useState<PlanningView>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<PlanningEvent | null>(null);
  const [activeFilters, setActiveFilters] = useState<PlanningFilter>({
    specialty: [],
    location: [],
    status: [],
    assignedTo: [],
    eventType: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Configuration des vues
  const viewConfig = {
    day: { 
      label: 'Jour', 
      icon: Clock, 
      description: 'Focus assignations détaillées + timeline' 
    },
    week: { 
      label: 'Semaine', 
      icon: Calendar, 
      description: 'Planning équipe avec drag & drop' 
    },
    month: { 
      label: 'Mois', 
      icon: Grid3X3, 
      description: 'Vue d\'ensemble avec métriques' 
    },
    team: { 
      label: 'Équipe', 
      icon: Users, 
      description: 'Planning par personne/compétence' 
    },
    workload: { 
      label: 'Charge', 
      icon: BarChart3, 
      description: 'Visualisation surcharges/sous-charges' 
    }
  };

  // Filtrer les événements
  const filteredEvents = events.filter(event => {
    if (activeFilters.specialty.length > 0 && !activeFilters.specialty.includes(event.specialty)) return false;
    if (activeFilters.location.length > 0 && !activeFilters.location.includes(event.location)) return false;
    if (activeFilters.status.length > 0 && !activeFilters.status.includes(event.status)) return false;
    if (activeFilters.eventType.length > 0 && !activeFilters.eventType.includes(event.type)) return false;
    return true;
  });

  // Navigation temporelle
  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (currentView) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      default:
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    
    setCurrentDate(newDate);
  }, [currentDate, currentView]);

  // Obtenir le titre de la période actuelle
  const getPeriodTitle = () => {
    switch (currentView) {
      case 'day':
        return currentDate.toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      case 'month':
        return currentDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
      default:
        return 'Planning Équipe';
    }
  };

  const getEventColor = (event: PlanningEvent) => {
    switch (event.type) {
      case 'garde': return 'bg-medical-guard-100 border-medical-guard-300 text-medical-guard-800';
      case 'vacation': return 'bg-medical-vacation-100 border-medical-vacation-300 text-medical-vacation-800';
      case 'conge': return 'bg-medical-rest-100 border-medical-rest-300 text-medical-rest-800';
      case 'astreinte': return 'bg-medical-oncall-100 border-medical-oncall-300 text-medical-oncall-800';
      case 'formation': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const renderDayView = () => (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-4">Timeline Détaillée</h3>
        <div className="space-y-2">
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="flex items-center gap-4 py-2 border-b border-gray-100">
              <div className="w-16 text-sm text-gray-600 font-mono">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="flex-1">
                {filteredEvents
                  .filter(event => event.startTime.getHours() === hour)
                  .map(event => (
                    <div
                      key={event.id}
                      className={cn(
                        'inline-block px-3 py-1 rounded-md border text-xs font-medium mr-2 cursor-pointer',
                        getEventColor(event)
                      )}
                      onClick={() => setSelectedEvent(event)}
                    >
                      {event.title} - {event.assignedTo.join(', ')}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="p-3 text-sm font-medium text-gray-600">Heure</div>
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
          <div key={day} className="p-3 text-sm font-medium text-gray-900 text-center border-l border-gray-200">
            {day}
          </div>
        ))}
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {Array.from({ length: 24 }, (_, hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
            <div className="p-2 text-xs text-gray-600 font-mono border-r border-gray-100">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {Array.from({ length: 7 }, (_, day) => (
              <div key={day} className="min-h-[40px] p-1 border-l border-gray-100 relative">
                {filteredEvents
                  .filter(event => {
                    const eventDate = new Date(event.startTime);
                    const dayOfWeek = eventDate.getDay() === 0 ? 6 : eventDate.getDay() - 1;
                    return dayOfWeek === day && eventDate.getHours() === hour;
                  })
                  .map(event => (
                    <div
                      key={event.id}
                      className={cn(
                        'absolute inset-1 p-1 rounded text-xs font-medium cursor-pointer',
                        getEventColor(event)
                      )}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="truncate">{event.title}</div>
                      <div className="truncate text-xs opacity-75">
                        {event.assignedTo[0]}{event.assignedTo.length > 1 && ` +${event.assignedTo.length - 1}`}
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const renderMonthView = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Événements</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{filteredEvents.length}</div>
          <div className="text-xs text-gray-600">Ce mois</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-900">Personnes</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {new Set(filteredEvents.flatMap(e => e.assignedTo)).size}
          </div>
          <div className="text-xs text-gray-600">Impliquées</div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-gray-900">Charge Moy.</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.round(filteredEvents.reduce((sum, e) => sum + e.workload, 0) / filteredEvents.length || 0)}%
          </div>
          <div className="text-xs text-gray-600">Équipes</div>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-4">Calendrier du Mois</h3>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="p-2 text-xs font-medium text-gray-600 text-center">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, index) => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), index - 6);
            const dayEvents = filteredEvents.filter(event => 
              event.startTime.toDateString() === date.toDateString()
            );
            
            return (
              <div
                key={index}
                className={cn(
                  'min-h-[60px] p-1 border border-gray-100 rounded',
                  date.getMonth() !== currentDate.getMonth() && 'bg-gray-50',
                  date.toDateString() === new Date().toDateString() && 'bg-blue-50 border-blue-200'
                )}
              >
                <div className="text-xs text-gray-600 mb-1">{date.getDate()}</div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className={cn(
                        'text-xs p-1 rounded cursor-pointer',
                        getEventColor(event)
                      )}
                      onClick={() => setSelectedEvent(event)}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayEvents.length - 2}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderTeamView = () => (
    <div className="space-y-4">
      {Array.from(new Set(filteredEvents.flatMap(e => e.assignedTo))).map(person => {
        const personEvents = filteredEvents.filter(e => e.assignedTo.includes(person));
        const workload = personEvents.reduce((sum, e) => sum + e.workload, 0) / personEvents.length || 0;
        
        return (
          <div key={person} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {person.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{person}</h3>
                  <p className="text-sm text-gray-600">{personEvents.length} événement(s)</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">{Math.round(workload)}%</div>
                <div className="text-xs text-gray-600">Charge moyenne</div>
              </div>
            </div>
            
            <div className="space-y-2">
              {personEvents.map(event => (
                <div
                  key={event.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded border cursor-pointer',
                    getEventColor(event)
                  )}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div>
                    <div className="font-medium text-sm">{event.title}</div>
                    <div className="text-xs opacity-75">
                      {event.startTime.toLocaleDateString()} - {event.location}
                    </div>
                  </div>
                  <div className="text-xs font-medium">{event.workload}%</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderWorkloadView = () => (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-4">Analyse de Charge par Spécialité</h3>
        
        {Array.from(new Set(filteredEvents.map(e => e.specialty))).map(specialty => {
          const specialtyEvents = filteredEvents.filter(e => e.specialty === specialty);
          const avgWorkload = specialtyEvents.reduce((sum, e) => sum + e.workload, 0) / specialtyEvents.length || 0;
          const status = avgWorkload > 80 ? 'critical' : avgWorkload > 60 ? 'warning' : 'normal';
          
          return (
            <div key={specialty} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{specialty}</span>
                <span className={cn(
                  'text-sm font-medium',
                  status === 'critical' && 'text-red-600',
                  status === 'warning' && 'text-yellow-600',
                  status === 'normal' && 'text-green-600'
                )}>
                  {Math.round(avgWorkload)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    status === 'critical' && 'bg-red-500',
                    status === 'warning' && 'bg-yellow-500',
                    status === 'normal' && 'bg-green-500'
                  )}
                  style={{ width: `${Math.min(avgWorkload, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {specialtyEvents.length} événement(s) • {new Set(specialtyEvents.flatMap(e => e.assignedTo)).size} personne(s)
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Surcharges Détectées</h4>
          <div className="space-y-2">
            {filteredEvents
              .filter(e => e.workload > 80)
              .map(event => (
                <div key={event.id} className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
                  <div>
                    <div className="text-sm font-medium text-red-900">{event.title}</div>
                    <div className="text-xs text-red-700">{event.assignedTo.join(', ')}</div>
                  </div>
                  <div className="text-sm font-bold text-red-600">{event.workload}%</div>
                </div>
              ))}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Optimisations Suggérées</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="p-2 bg-blue-50 border border-blue-200 rounded">
              • Redistribuer 2 gardes de l'équipe Cardio vers Générale
            </div>
            <div className="p-2 bg-green-50 border border-green-200 rounded">
              • Équilibrage possible entre sites Nord et Sud
            </div>
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
              • Prévoir renfort pour période haute charge
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'day': return renderDayView();
      case 'week': return renderWeekView();
      case 'month': return renderMonthView();
      case 'team': return renderTeamView();
      case 'workload': return renderWorkloadView();
      default: return renderWeekView();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header avec contrôles */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Planning Multi-Vues</h2>
            <p className="text-sm text-gray-600">
              {viewConfig[currentView].description}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'p-2 rounded-md transition-colors',
                showFilters ? 'bg-medical-guard-100 text-medical-guard-600' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Filter className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sélecteur de vues */}
        <div className="flex items-center gap-2 mb-4">
          {Object.entries(viewConfig).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => setCurrentView(key as PlanningView)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  currentView === key 
                    ? 'bg-medical-guard-100 text-medical-guard-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Icon className="h-4 w-4" />
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Navigation temporelle */}
        {(['day', 'week', 'month'] as PlanningView[]).includes(currentView) && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <h3 className="text-lg font-medium text-gray-900">
              {getPeriodTitle()}
            </h3>
            
            <button
              onClick={() => navigateDate('next')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Filtres (si activés) */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Filtres Intelligents</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Implementation des filtres ici */}
            <div className="text-sm text-gray-600">Filtres à implémenter...</div>
          </div>
        </div>
      )}

      {/* Vue principale */}
      <div className={cn(isFullscreen && 'fixed inset-0 z-50 bg-white p-4 overflow-auto')}>
        {renderCurrentView()}
      </div>

      {/* Détails événement sélectionné */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-25">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Type:</span> {selectedEvent.type}
              </div>
              <div>
                <span className="font-medium text-gray-700">Assigné à:</span> {selectedEvent.assignedTo.join(', ')}
              </div>
              <div>
                <span className="font-medium text-gray-700">Lieu:</span> {selectedEvent.location}
              </div>
              <div>
                <span className="font-medium text-gray-700">Période:</span> {' '}
                {selectedEvent.startTime.toLocaleString()} - {selectedEvent.endTime.toLocaleString()}
              </div>
              <div>
                <span className="font-medium text-gray-700">Charge:</span> {selectedEvent.workload}%
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button className="flex-1 px-3 py-2 bg-medical-guard-600 text-white rounded-md hover:bg-medical-guard-700 transition-colors">
                Modifier
              </button>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}