'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Search,
  Filter,
  Plus,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  UnifiedRequest, 
  UnifiedRequestStatus, 
  UnifiedRequestType,
  RequestPriority,
  RequestFilter 
} from '@/types/unified-request';
import { useRouter } from 'next/navigation';

interface UnifiedRequestListProps {
  viewMode?: 'user' | 'admin';
  userId?: number;
  showCreateButton?: boolean;
}

export default function UnifiedRequestList({ 
  viewMode = 'user', 
  userId,
  showCreateButton = true 
}: UnifiedRequestListProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Construction des filtres
  const buildFilter = (): RequestFilter => {
    const filter: RequestFilter = {};
    
    // Filtre par onglet
    if (activeTab === 'pending') {
      filter.status = [
        UnifiedRequestStatus.SUBMITTED,
        UnifiedRequestStatus.IN_REVIEW,
        UnifiedRequestStatus.IN_PROGRESS
      ];
    } else if (activeTab === 'completed') {
      filter.status = [
        UnifiedRequestStatus.COMPLETED,
        UnifiedRequestStatus.REJECTED,
        UnifiedRequestStatus.CANCELLED
      ];
    }

    // Filtre par utilisateur (mode user)
    if (viewMode === 'user' && userId) {
      filter.initiatorId = userId;
    }

    // Filtre par type
    if (filterType !== 'all') {
      filter.type = [filterType as UnifiedRequestType];
    }

    // Filtre par priorité
    if (filterPriority !== 'all') {
      filter.priority = [filterPriority as RequestPriority];
    }

    // Recherche
    if (searchTerm) {
      filter.searchTerm = searchTerm;
    }

    return filter;
  };

  // Récupération des demandes
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['unified-requests', activeTab, filterType, filterPriority, searchTerm, userId],
    queryFn: async () => {
      const response = await axios.post('/api/requests/search', buildFilter());
      return response.data;
    }
  });

  const getStatusIcon = (status: UnifiedRequestStatus) => {
    switch (status) {
      case UnifiedRequestStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case UnifiedRequestStatus.REJECTED:
      case UnifiedRequestStatus.CANCELLED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case UnifiedRequestStatus.IN_PROGRESS:
      case UnifiedRequestStatus.IN_REVIEW:
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: UnifiedRequestStatus) => {
    const variants: Record<UnifiedRequestStatus, string> = {
      [UnifiedRequestStatus.DRAFT]: 'secondary',
      [UnifiedRequestStatus.SUBMITTED]: 'default',
      [UnifiedRequestStatus.IN_REVIEW]: 'default',
      [UnifiedRequestStatus.APPROVED]: 'success',
      [UnifiedRequestStatus.REJECTED]: 'destructive',
      [UnifiedRequestStatus.IN_PROGRESS]: 'default',
      [UnifiedRequestStatus.COMPLETED]: 'success',
      [UnifiedRequestStatus.CANCELLED]: 'secondary',
      [UnifiedRequestStatus.EXPIRED]: 'destructive'
    };

    const labels: Record<UnifiedRequestStatus, string> = {
      [UnifiedRequestStatus.DRAFT]: 'Brouillon',
      [UnifiedRequestStatus.SUBMITTED]: 'Soumise',
      [UnifiedRequestStatus.IN_REVIEW]: 'En révision',
      [UnifiedRequestStatus.APPROVED]: 'Approuvée',
      [UnifiedRequestStatus.REJECTED]: 'Rejetée',
      [UnifiedRequestStatus.IN_PROGRESS]: 'En cours',
      [UnifiedRequestStatus.COMPLETED]: 'Terminée',
      [UnifiedRequestStatus.CANCELLED]: 'Annulée',
      [UnifiedRequestStatus.EXPIRED]: 'Expirée'
    };

    return (
      <Badge variant={variants[status] as any}>
        {labels[status]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: RequestPriority) => {
    const colors: Record<RequestPriority, string> = {
      [RequestPriority.LOW]: 'bg-gray-100 text-gray-600',
      [RequestPriority.MEDIUM]: 'bg-blue-100 text-blue-600',
      [RequestPriority.HIGH]: 'bg-orange-100 text-orange-600',
      [RequestPriority.URGENT]: 'bg-red-100 text-red-600'
    };

    return (
      <Badge className={colors[priority]}>
        {priority === RequestPriority.URGENT && '🚨 '}
        {priority}
      </Badge>
    );
  };

  const getTypeIcon = (type: UnifiedRequestType) => {
    switch (type) {
      case UnifiedRequestType.LEAVE:
        return '🏖️';
      case UnifiedRequestType.ASSIGNMENT_SWAP:
        return '🔄';
      case UnifiedRequestType.EMERGENCY_REPLACEMENT:
        return '🚨';
      case UnifiedRequestType.SCHEDULE_CHANGE:
        return '📅';
      case UnifiedRequestType.TRAINING:
        return '📚';
      case UnifiedRequestType.EQUIPMENT:
        return '🛠️';
      default:
        return '📋';
    }
  };

  const handleRequestClick = (requestId: string) => {
    router.push(`/demandes/${requestId}`);
  };

  const handleCreateNew = () => {
    router.push('/demandes/nouvelle');
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher une demande..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              <SelectItem value={UnifiedRequestType.LEAVE}>Congés</SelectItem>
              <SelectItem value={UnifiedRequestType.ASSIGNMENT_SWAP}>Échanges</SelectItem>
              <SelectItem value={UnifiedRequestType.EMERGENCY_REPLACEMENT}>Urgences</SelectItem>
              <SelectItem value={UnifiedRequestType.SCHEDULE_CHANGE}>Planning</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorités</SelectItem>
              <SelectItem value={RequestPriority.LOW}>Faible</SelectItem>
              <SelectItem value={RequestPriority.MEDIUM}>Moyenne</SelectItem>
              <SelectItem value={RequestPriority.HIGH}>Haute</SelectItem>
              <SelectItem value={RequestPriority.URGENT}>Urgente</SelectItem>
            </SelectContent>
          </Select>

          {showCreateButton && (
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-1" />
              Nouvelle demande
            </Button>
          )}
        </div>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">
            Toutes ({data?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="pending">
            En attente
          </TabsTrigger>
          <TabsTrigger value="completed">
            Terminées
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : data?.requests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">Aucune demande trouvée</p>
                {showCreateButton && (
                  <Button onClick={handleCreateNew} className="mt-4">
                    Créer une demande
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {data?.requests.map((request: UnifiedRequest) => (
                <Card 
                  key={request.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleRequestClick(request.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getTypeIcon(request.type)}</span>
                          <h3 className="font-medium">{request.title}</h3>
                          {request.priority === RequestPriority.URGENT && 
                            getPriorityBadge(request.priority)
                          }
                        </div>
                        
                        <p className="text-sm text-gray-600">{request.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{request.initiatorName || 'Utilisateur'}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {format(new Date(request.createdAt), 'dd MMM yyyy', { locale: fr })}
                            </span>
                          </div>
                          
                          {request.targetUserName && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>→ {request.targetUserName}</span>
                            </div>
                          )}
                          
                          {request.comments && request.comments.length > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{request.comments.length}</span>
                            </div>
                          )}
                        </div>

                        {/* Workflow progress */}
                        {request.workflow && request.workflow.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            {request.workflow.map((step, idx) => (
                              <div key={step.id} className="flex items-center">
                                <div 
                                  className={`h-2 w-2 rounded-full ${
                                    step.status === 'COMPLETED' ? 'bg-green-500' :
                                    step.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                                    'bg-gray-300'
                                  }`}
                                />
                                {idx < request.workflow.length - 1 && (
                                  <div className="w-8 h-0.5 bg-gray-300 mx-1" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          {getStatusBadge(request.status)}
                        </div>
                        
                        {request.priority !== RequestPriority.URGENT && 
                         request.priority !== RequestPriority.MEDIUM && 
                          getPriorityBadge(request.priority)
                        }
                        
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}