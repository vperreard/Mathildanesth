'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Clock,
  MapPin,
  Battery,
  Award,
  UserCheck,
  Phone,
  Mail,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  Calendar,
  Bell,
  Zap,
  RefreshCw
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInHours } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useQuery, useMutation } from '@tanstack/react-query';

interface Absence {
  id: string;
  userId: string;
  userName: string;
  userRole: 'MAR' | 'IADE';
  date: Date;
  shift: string;
  room: string;
  reason: string;
  notifiedAt: Date;
  critical: boolean;
}

interface Candidate {
  id: string;
  name: string;
  role: 'MAR' | 'IADE';
  avatar?: string;
  score: number;
  availability: 'available' | 'maybe' | 'busy';
  distance: number; // en km
  fatigue: number; // 0-100
  competencies: string[];
  lastContact?: Date;
  phone: string;
  email: string;
  workload: {
    hoursThisWeek: number;
    consecutiveDays: number;
    lastRestDay: Date;
  };
  scoreBreakdown: {
    availability: number;
    proximity: number;
    fatigue: number;
    competency: number;
  };
}

interface ReplacementRequest {
  absenceId: string;
  candidateId: string;
  status: 'pending' | 'accepted' | 'refused' | 'timeout';
  sentAt: Date;
  respondedAt?: Date;
}

export default function EmergencyReplacementMode() {
  const [selectedAbsence, setSelectedAbsence] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [activeRequests, setActiveRequests] = useState<ReplacementRequest[]>([]);
  const [autoMode, setAutoMode] = useState(false);

  // Récupération des absences urgentes
  const { data: urgentAbsences, isLoading: loadingAbsences, refetch: refetchAbsences } = useQuery({
    queryKey: ['urgent-absences'],
    queryFn: async () => {
      const response = await axios.get('/api/admin/absences/urgent');
      return response.data;
    },
    refetchInterval: 30000 // Rafraîchissement toutes les 30 secondes
  });

  // Récupération des candidats pour une absence
  const { data: candidates, isLoading: loadingCandidates } = useQuery({
    queryKey: ['replacement-candidates', selectedAbsence],
    queryFn: async () => {
      if (!selectedAbsence) return [];
      const response = await axios.get(`/api/admin/replacements/candidates/${selectedAbsence}`);
      return response.data;
    },
    enabled: !!selectedAbsence
  });

  // Mutation pour envoyer une demande de remplacement
  const sendRequestMutation = useMutation({
    mutationFn: async ({ absenceId, candidateId }: { absenceId: string; candidateId: string }) => {
      return axios.post('/api/admin/replacements/request', {
        absenceId,
        candidateId,
        urgent: true
      });
    },
    onSuccess: (data, variables) => {
      const newRequest: ReplacementRequest = {
        absenceId: variables.absenceId,
        candidateId: variables.candidateId,
        status: 'pending',
        sentAt: new Date()
      };
      setActiveRequests(prev => [...prev, newRequest]);
      toast.success('Demande envoyée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi de la demande');
    }
  });

  // Auto-mode : envoi automatique aux meilleurs candidats
  useEffect(() => {
    if (autoMode && urgentAbsences?.length > 0 && candidates?.length > 0) {
      const unhandledAbsence = urgentAbsences.find((absence: Absence) => 
        !activeRequests.some(req => req.absenceId === absence.id)
      );

      if (unhandledAbsence) {
        const bestCandidate = candidates[0]; // Le premier est le mieux noté
        sendRequestMutation.mutate({
          absenceId: unhandledAbsence.id,
          candidateId: bestCandidate.id
        });
      }
    }
  }, [autoMode, urgentAbsences, candidates, activeRequests, sendRequestMutation]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAvailabilityBadge = (availability: string) => {
    switch (availability) {
      case 'available':
        return <Badge className="bg-green-500">Disponible</Badge>;
      case 'maybe':
        return <Badge className="bg-yellow-500">Peut-être</Badge>;
      case 'busy':
        return <Badge className="bg-red-500">Occupé</Badge>;
      default:
        return null;
    }
  };

  const getFatigueIndicator = (fatigue: number) => {
    if (fatigue < 30) return { color: 'text-green-500', label: 'Reposé' };
    if (fatigue < 70) return { color: 'text-yellow-500', label: 'Modéré' };
    return { color: 'text-red-500', label: 'Fatigué' };
  };

  const handleSendRequest = (candidateId: string) => {
    if (!selectedAbsence) return;
    
    sendRequestMutation.mutate({
      absenceId: selectedAbsence,
      candidateId
    });
  };

  const handleAcceptAll = async () => {
    if (!candidates || candidates.length === 0) return;
    
    // Envoyer des demandes aux 3 meilleurs candidats
    const topCandidates = candidates.slice(0, 3);
    for (const candidate of topCandidates) {
      await sendRequestMutation.mutateAsync({
        absenceId: selectedAbsence!,
        candidateId: candidate.id
      });
    }
  };

  if (loadingAbsences) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec mode automatique */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Mode Remplacement d'Urgence</h2>
          <p className="text-gray-600">
            {urgentAbsences?.length || 0} absence(s) critique(s) à traiter
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => refetchAbsences()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          
          <div className="flex items-center gap-2">
            <label htmlFor="auto-mode" className="text-sm font-medium">
              Mode automatique
            </label>
            <Button
              id="auto-mode"
              variant={autoMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoMode(!autoMode)}
            >
              {autoMode ? (
                <>
                  <Zap className="h-4 w-4 mr-1" />
                  Activé
                </>
              ) : (
                'Désactivé'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Alertes critiques */}
      {urgentAbsences?.filter((a: Absence) => a.critical).map((absence: Absence) => (
        <Alert key={absence.id} className="border-red-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Absence critique détectée</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <span>
              {absence.userName} ({absence.userRole}) - {absence.room} - 
              {format(new Date(absence.date), 'dd/MM HH:mm', { locale: fr })}
            </span>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setSelectedAbsence(absence.id)}
            >
              Traiter maintenant
            </Button>
          </AlertDescription>
        </Alert>
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des absences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Absences à remplacer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentAbsences?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune absence urgente
              </div>
            ) : (
              urgentAbsences?.map((absence: Absence) => (
                <Card
                  key={absence.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedAbsence === absence.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedAbsence(absence.id)}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{absence.userName}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Badge variant="outline">{absence.userRole}</Badge>
                          <span>{absence.room}</span>
                        </div>
                      </div>
                      {absence.critical && (
                        <Badge variant="destructive">Critique</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(absence.date), 'dd/MM HH:mm', { locale: fr })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Dans {formatDistanceToNow(new Date(absence.date), { locale: fr })}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600">
                      Motif : {absence.reason}
                    </p>

                    {activeRequests.filter(req => req.absenceId === absence.id).length > 0 && (
                      <div className="flex items-center gap-1 text-sm text-blue-600">
                        <Bell className="h-3 w-3" />
                        {activeRequests.filter(req => req.absenceId === absence.id).length} demande(s) envoyée(s)
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Candidats de remplacement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Candidats disponibles
              </span>
              {selectedAbsence && candidates?.length > 0 && (
                <Button size="sm" onClick={handleAcceptAll}>
                  Contacter les 3 meilleurs
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedAbsence ? (
              <div className="text-center py-8 text-gray-500">
                Sélectionnez une absence pour voir les candidats
              </div>
            ) : loadingCandidates ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : candidates?.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Aucun candidat disponible pour ce créneau
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {candidates?.map((candidate: Candidate) => (
                  <Card key={candidate.id} className="p-4">
                    <div className="space-y-3">
                      {/* En-tête candidat */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={candidate.avatar} />
                            <AvatarFallback>
                              {candidate.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{candidate.name}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{candidate.role}</Badge>
                              {getAvailabilityBadge(candidate.availability)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getScoreColor(candidate.score)}`}>
                            {candidate.score}%
                          </p>
                          <p className="text-xs text-gray-600">Score global</p>
                        </div>
                      </div>

                      {/* Métriques */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{candidate.distance} km</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Battery className={`h-3 w-3 ${getFatigueIndicator(candidate.fatigue).color}`} />
                          <span>{getFatigueIndicator(candidate.fatigue).label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{candidate.workload.hoursThisWeek}h cette semaine</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          <span>{candidate.competencies.length} compétences</span>
                        </div>
                      </div>

                      {/* Score détaillé */}
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-600">Détail du score :</p>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div>Disponibilité : {candidate.scoreBreakdown.availability}%</div>
                          <div>Proximité : {candidate.scoreBreakdown.proximity}%</div>
                          <div>Fatigue : {candidate.scoreBreakdown.fatigue}%</div>
                          <div>Compétences : {candidate.scoreBreakdown.competency}%</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleSendRequest(candidate.id)}
                          disabled={activeRequests.some(req => 
                            req.absenceId === selectedAbsence && 
                            req.candidateId === candidate.id
                          )}
                        >
                          {activeRequests.some(req => 
                            req.absenceId === selectedAbsence && 
                            req.candidateId === candidate.id
                          ) ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Demande envoyée
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3 mr-1" />
                              Envoyer demande
                            </>
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `tel:${candidate.phone}`}
                        >
                          <Phone className="h-3 w-3" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `mailto:${candidate.email}`}
                        >
                          <Mail className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statut des demandes actives */}
      {activeRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Demandes en cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeRequests.map((request, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {request.status === 'pending' && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    )}
                    {request.status === 'accepted' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {request.status === 'refused' && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      Demande envoyée il y a {formatDistanceToNow(request.sentAt, { locale: fr })}
                    </span>
                  </div>
                  <Badge variant={
                    request.status === 'accepted' ? 'default' :
                    request.status === 'refused' ? 'destructive' :
                    'secondary'
                  }>
                    {request.status === 'pending' ? 'En attente' :
                     request.status === 'accepted' ? 'Acceptée' :
                     request.status === 'refused' ? 'Refusée' :
                     'Timeout'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}