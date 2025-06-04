'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Calendar as CalendarIcon, 
    Users, 
    ArrowLeftRight,
    Clock,
    AlertCircle,
    CheckCircle,
    Send
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

interface AvailableColleague {
    id: string;
    name: string;
    role: 'MAR' | 'IADE';
    specialty?: string;
    availability: 'DISPONIBLE' | 'PEUT_ETRE' | 'OCCUPE';
}

export default function ExchangeRequestPage() {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState<Date>();
    const [selectedColleague, setSelectedColleague] = useState<string>('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Données simulées - À remplacer par des appels API
    const availableColleagues: AvailableColleague[] = [
        { id: '1', name: 'Dr. Martin', role: 'MAR', availability: 'DISPONIBLE' },
        { id: '2', name: 'Dr. Dubois', role: 'MAR', specialty: 'Pédiatrie', availability: 'PEUT_ETRE' },
        { id: '3', name: 'Sophie L.', role: 'IADE', availability: 'DISPONIBLE' },
        { id: '4', name: 'Pierre M.', role: 'IADE', availability: 'OCCUPE' },
    ];

    const handleSubmit = async () => {
        if (!selectedDate || !selectedColleague) {
            toast({
                title: "Erreur",
                description: "Veuillez sélectionner une date et un collègue",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            // TODO: Appel API pour créer la demande d'échange
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            toast({
                title: "Demande envoyée",
                description: "Votre demande d'échange a été transmise avec succès",
            });
            
            router.push('/');
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible d'envoyer la demande. Veuillez réessayer.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const getAvailabilityBadge = (availability: AvailableColleague['availability']) => {
        switch (availability) {
            case 'DISPONIBLE':
                return <Badge variant="default" className="bg-green-500">Disponible</Badge>;
            case 'PEUT_ETRE':
                return <Badge variant="secondary" className="bg-orange-500">Peut-être</Badge>;
            case 'OCCUPE':
                return <Badge variant="secondary" className="bg-red-500">Occupé</Badge>;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Demande d'échange de garde
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Trouvez un collègue disponible pour échanger votre garde
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Formulaire de demande */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ArrowLeftRight className="h-5 w-5" />
                            Nouvelle demande
                        </CardTitle>
                        <CardDescription>
                            Sélectionnez la date et le collègue avec qui vous souhaitez échanger
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Sélection de la date */}
                        <div className="space-y-2">
                            <Label>Date de la garde à échanger</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !selectedDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedDate ? (
                                            format(selectedDate, "d MMMM yyyy", { locale: fr })
                                        ) : (
                                            "Sélectionner une date"
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        disabled={(date) => date < new Date()}
                                        locale={fr}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Sélection du collègue */}
                        <div className="space-y-2">
                            <Label>Collègue pour l'échange</Label>
                            <Select value={selectedColleague} onValueChange={setSelectedColleague}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un collègue" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableColleagues.map(colleague => (
                                        <SelectItem 
                                            key={colleague.id} 
                                            value={colleague.id}
                                            disabled={colleague.availability === 'OCCUPE'}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <div>
                                                    <span className="font-medium">{colleague.name}</span>
                                                    <span className="text-muted-foreground ml-2">
                                                        ({colleague.role})
                                                    </span>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Message optionnel */}
                        <div className="space-y-2">
                            <Label>Message (optionnel)</Label>
                            <Textarea
                                placeholder="Ajoutez un message pour votre collègue..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                            />
                        </div>

                        {/* Bouton d'envoi */}
                        <Button 
                            className="w-full" 
                            onClick={handleSubmit}
                            disabled={loading || !selectedDate || !selectedColleague}
                        >
                            {loading ? (
                                <>
                                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                                    Envoi en cours...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Envoyer la demande
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Liste des collègues disponibles */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Collègues disponibles
                            </CardTitle>
                            <CardDescription>
                                Statut de disponibilité de vos collègues
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {availableColleagues.map(colleague => (
                                    <div 
                                        key={colleague.id}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-lg border",
                                            selectedColleague === colleague.id && "border-primary bg-primary/5"
                                        )}
                                    >
                                        <div>
                                            <p className="font-medium">{colleague.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {colleague.role} 
                                                {colleague.specialty && ` - ${colleague.specialty}`}
                                            </p>
                                        </div>
                                        {getAvailabilityBadge(colleague.availability)}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Informations importantes */}
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Important :</strong> L'échange de garde nécessite l'accord de votre collègue 
                            et la validation par l'administration. Vous serez notifié de la décision par email.
                        </AlertDescription>
                    </Alert>

                    {/* Conseils */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Conseils pour un échange réussi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                    <span>Prévenez à l'avance (minimum 48h)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                    <span>Choisissez un collègue avec les mêmes compétences</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                                    <span>Proposez un échange équitable (garde contre garde)</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}