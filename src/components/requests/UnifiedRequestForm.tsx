'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar as CalendarIcon,
  Loader2,
  AlertCircle,
  ArrowLeftRight as Swap,
  CalendarOff,
  Siren,
  GraduationCap,
  Wrench,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { 
  UnifiedRequestType, 
  RequestPriority,
  RequestTypeConfig 
} from '@/types/unified-request';

interface UnifiedRequestFormProps {
  userId: number;
  preselectedType?: UnifiedRequestType;
  onSuccess?: () => void;
}

const REQUEST_TYPE_INFO = [
  {
    type: UnifiedRequestType.LEAVE,
    icon: <CalendarOff className="h-8 w-8" />,
    title: 'Demande de congé',
    description: 'Faire une demande de congé ou d\'absence',
    color: 'bg-green-500'
  },
  {
    type: UnifiedRequestType.ASSIGNMENT_SWAP,
    icon: <Swap className="h-8 w-8" />,
    title: 'Échange de garde',
    description: 'Échanger une garde avec un collègue',
    color: 'bg-blue-500'
  },
  {
    type: UnifiedRequestType.EMERGENCY_REPLACEMENT,
    icon: <Siren className="h-8 w-8" />,
    title: 'Remplacement urgent',
    description: 'Demander un remplacement en urgence',
    color: 'bg-red-500'
  },
  {
    type: UnifiedRequestType.SCHEDULE_CHANGE,
    icon: <CalendarIcon className="h-8 w-8" />,
    title: 'Modification planning',
    description: 'Demander une modification de planning',
    color: 'bg-purple-500'
  },
  {
    type: UnifiedRequestType.TRAINING,
    icon: <GraduationCap className="h-8 w-8" />,
    title: 'Formation',
    description: 'Demander une formation ou un congrès',
    color: 'bg-indigo-500'
  },
  {
    type: UnifiedRequestType.EQUIPMENT,
    icon: <Wrench className="h-8 w-8" />,
    title: 'Matériel',
    description: 'Demander du matériel ou équipement',
    color: 'bg-yellow-500'
  },
  {
    type: UnifiedRequestType.GENERIC,
    icon: <FileText className="h-8 w-8" />,
    title: 'Autre demande',
    description: 'Toute autre demande administrative',
    color: 'bg-gray-500'
  }
];

export default function UnifiedRequestForm({ 
  userId, 
  preselectedType,
  onSuccess 
}: UnifiedRequestFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(preselectedType ? 2 : 1);
  const [selectedType, setSelectedType] = useState<UnifiedRequestType | null>(preselectedType || null);
  const [formData, setFormData] = useState<any>({
    priority: RequestPriority.MEDIUM
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return axios.post('/api/requests', data);
    },
    onSuccess: () => {
      toast.success('Demande créée avec succès');
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/demandes');
      }
    },
    onError: () => {
      toast.error('Erreur lors de la création de la demande');
    }
  });

  const handleTypeSelect = (type: UnifiedRequestType) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleSubmit = () => {
    if (!selectedType) return;

    const requestData = {
      type: selectedType,
      title: formData.title || generateTitle(selectedType, formData),
      description: formData.description || '',
      priority: formData.priority,
      initiatorId: userId,
      targetUserId: formData.targetUserId,
      metadata: { ...formData },
      expiresAt: formData.expiresAt
    };

    createMutation.mutate(requestData);
  };

  const generateTitle = (type: UnifiedRequestType, data: any): string => {
    switch (type) {
      case UnifiedRequestType.LEAVE:
        return `Congé du ${data.startDate ? format(new Date(data.startDate), 'dd/MM') : ''} au ${data.endDate ? format(new Date(data.endDate), 'dd/MM') : ''}`;
      case UnifiedRequestType.ASSIGNMENT_SWAP:
        return `Échange de garde - ${data.swapDate ? format(new Date(data.swapDate), 'dd/MM') : ''}`;
      case UnifiedRequestType.EMERGENCY_REPLACEMENT:
        return `Remplacement urgent - ${data.shiftDate ? format(new Date(data.shiftDate), 'dd/MM') : ''} ${data.room || ''}`;
      default:
        return data.title || 'Nouvelle demande';
    }
  };

  const renderTypeSpecificFields = () => {
    if (!selectedType) return null;

    switch (selectedType) {
      case UnifiedRequestType.LEAVE:
        return (
          <>
            <div className="space-y-2">
              <Label>Type de congé</Label>
              <Select
                value={formData.leaveType}
                onValueChange={(value) => setFormData({ ...formData, leaveType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CP">Congés payés</SelectItem>
                  <SelectItem value="RTT">RTT</SelectItem>
                  <SelectItem value="MALADIE">Arrêt maladie</SelectItem>
                  <SelectItem value="FORMATION">Formation</SelectItem>
                  <SelectItem value="AUTRE">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? (
                        format(new Date(formData.startDate), "dd/MM/yyyy", { locale: fr })
                      ) : (
                        "Sélectionner"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate ? new Date(formData.startDate) : undefined}
                      onSelect={(date) => setFormData({ ...formData, startDate: date })}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? (
                        format(new Date(formData.endDate), "dd/MM/yyyy", { locale: fr })
                      ) : (
                        "Sélectionner"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate ? new Date(formData.endDate) : undefined}
                      onSelect={(date) => setFormData({ ...formData, endDate: date })}
                      disabled={(date) => formData.startDate && date < new Date(formData.startDate)}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </>
        );

      case UnifiedRequestType.ASSIGNMENT_SWAP:
        return (
          <>
            <div className="space-y-2">
              <Label>Ma garde à échanger</Label>
              <Select
                value={formData.proposedAssignmentId}
                onValueChange={(value) => setFormData({ ...formData, proposedAssignmentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une garde" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Lundi 15/01 - Bloc A</SelectItem>
                  <SelectItem value="2">Mercredi 17/01 - Urgences</SelectItem>
                  <SelectItem value="3">Vendredi 19/01 - Bloc B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Collègue pour l'échange</Label>
              <Select
                value={formData.targetUserId}
                onValueChange={(value) => setFormData({ ...formData, targetUserId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un collègue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">Dr. Martin</SelectItem>
                  <SelectItem value="3">Dr. Dubois</SelectItem>
                  <SelectItem value="4">Dr. Laurent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case UnifiedRequestType.EMERGENCY_REPLACEMENT:
        return (
          <>
            <Alert className="border-red-500">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Cette demande sera traitée en priorité et déclenchera des notifications urgentes
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de la garde</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.shiftDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.shiftDate ? (
                        format(new Date(formData.shiftDate), "dd/MM/yyyy", { locale: fr })
                      ) : (
                        "Sélectionner"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.shiftDate ? new Date(formData.shiftDate) : undefined}
                      onSelect={(date) => setFormData({ ...formData, shiftDate: date })}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Horaire</Label>
                <Input
                  value={formData.shiftTime || ''}
                  onChange={(e) => setFormData({ ...formData, shiftTime: e.target.value })}
                  placeholder="Ex: 08h00-20h00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Salle/Service</Label>
              <Input
                value={formData.room || ''}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="Ex: Bloc A, Urgences..."
              />
            </div>
          </>
        );

      default:
        return (
          <div className="space-y-2">
            <Label>Titre de la demande</Label>
            <Input
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Décrivez brièvement votre demande"
            />
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle demande</CardTitle>
            <CardDescription>
              Sélectionnez le type de demande que vous souhaitez créer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REQUEST_TYPE_INFO.map((info) => (
                <Card
                  key={info.type}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTypeSelect(info.type)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={`p-3 rounded-full ${info.color} text-white`}>
                        {info.icon}
                      </div>
                      <h3 className="font-medium">{info.title}</h3>
                      <p className="text-sm text-gray-600">{info.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && selectedType && (
        <Card>
          <CardHeader>
            <CardTitle>
              {REQUEST_TYPE_INFO.find(t => t.type === selectedType)?.title}
            </CardTitle>
            <CardDescription>
              Complétez les informations nécessaires pour votre demande
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Priorité */}
            <div className="space-y-2">
              <Label>Priorité</Label>
              <RadioGroup
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={RequestPriority.LOW} id="low" />
                    <Label htmlFor="low">Faible</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={RequestPriority.MEDIUM} id="medium" />
                    <Label htmlFor="medium">Moyenne</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={RequestPriority.HIGH} id="high" />
                    <Label htmlFor="high">Haute</Label>
                  </div>
                  {selectedType === UnifiedRequestType.EMERGENCY_REPLACEMENT && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={RequestPriority.URGENT} id="urgent" />
                      <Label htmlFor="urgent">🚨 Urgente</Label>
                    </div>
                  )}
                </div>
              </RadioGroup>
            </div>

            {/* Champs spécifiques au type */}
            {renderTypeSpecificFields()}

            {/* Description */}
            <div className="space-y-2">
              <Label>Description / Motif</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ajoutez des détails supplémentaires si nécessaire..."
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => preselectedType ? router.back() : setStep(1)}
              >
                Retour
              </Button>
              
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer la demande'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}