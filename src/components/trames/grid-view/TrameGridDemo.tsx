'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import TrameGridView from './TrameGridView';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import Button from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import NewTrameModal from './NewTrameModal';
import { toast } from '@/components/ui/use-toast';

// Définition des types pour les données de démonstration
interface RequiredStaff {
    id: string;
    affectationId: string;
    role: 'MAR' | 'SURGEON' | 'IADE' | 'IBODE';
    count: number;
    userId?: string;
}

interface AffectationModele {
    id: string;
    trameId: string;
    roomId?: string;
    activityTypeId: string;
    period: 'MORNING' | 'AFTERNOON' | 'FULL_DAY';
    dayOverride?: number;
    weekTypeOverride?: 'ALL' | 'EVEN' | 'ODD';
    requiredStaff: RequiredStaff[];
    isActive: boolean;
}

interface TrameModele {
    id: string;
    name: string;
    description?: string;
    siteId: string;
    weekType: 'ALL' | 'EVEN' | 'ODD';
    activeDays: number[]; // 0 = Sunday, 1 = Monday, etc.
    isActive: boolean;
    effectiveStartDate: Date;
    effectiveEndDate?: Date;
    affectations: AffectationModele[];
}

const TrameGridDemo: React.FC = () => {
    // Données de démonstration pour le composant
    const demoData: TrameModele[] = [
        {
            id: 'demo-1',
            name: 'TrameModele Bloc A - Semaine Standard',
            description: 'Planning hebdomadaire standard pour le bloc A',
            siteId: 'site-1',
            weekType: 'ALL',
            activeDays: [1, 2, 3, 4, 5], // Lundi à vendredi
            isActive: true,
            effectiveStartDate: new Date('2025-01-01'),
            effectiveEndDate: new Date('2025-12-31'),
            affectations: [
                {
                    id: 'aff-1',
                    trameId: 'demo-1',
                    roomId: 'room1',
                    activityTypeId: 'activity1',
                    period: 'MORNING',
                    dayOverride: 1,
                    isActive: true,
                    requiredStaff: [
                        {
                            id: 'rs-1',
                            affectationId: 'aff-1',
                            role: 'MAR',
                            count: 1,
                            userId: 'user1'
                        },
                        {
                            id: 'rs-2',
                            affectationId: 'aff-1',
                            role: 'IADE',
                            count: 2,
                            userId: 'user5'
                        }
                    ]
                },
                {
                    id: 'aff-2',
                    trameId: 'demo-1',
                    roomId: 'room2',
                    activityTypeId: 'activity2',
                    period: 'FULL_DAY',
                    dayOverride: 2,
                    isActive: true,
                    requiredStaff: [
                        {
                            id: 'rs-3',
                            affectationId: 'aff-2',
                            role: 'SURGEON',
                            count: 1,
                            userId: 'user3'
                        },
                        {
                            id: 'rs-4',
                            affectationId: 'aff-2',
                            role: 'IBODE',
                            count: 2,
                            userId: 'user6'
                        }
                    ]
                }
            ]
        },
        {
            id: 'demo-2',
            name: 'TrameModele Bloc B - Semaines Paires',
            description: 'Planning pour les semaines paires du bloc B',
            siteId: 'site-1',
            weekType: 'EVEN',
            activeDays: [1, 3, 5], // Lundi, mercredi, vendredi
            isActive: true,
            effectiveStartDate: new Date('2025-01-01'),
            effectiveEndDate: new Date('2025-12-31'),
            affectations: [
                {
                    id: 'aff-3',
                    trameId: 'demo-2',
                    roomId: 'room3',
                    activityTypeId: 'activity3',
                    period: 'AFTERNOON',
                    dayOverride: 3,
                    isActive: true,
                    requiredStaff: [
                        {
                            id: 'rs-5',
                            affectationId: 'aff-3',
                            role: 'MAR',
                            count: 1,
                            userId: 'user2'
                        }
                    ]
                }
            ]
        }
    ];

    // État pour le mode de visualisation
    const [selectedTrameId, setSelectedTrameId] = useState<string>(demoData[0].id);
    const [showNewTrameModal, setShowNewTrameModal] = useState(false);

    // Données de démonstration pour les sites
    const demoSites = [
        { id: 'site-1', name: 'Hôpital Nord' },
        { id: 'site-2', name: 'Clinique Est' },
        { id: 'site-3', name: 'Centre Médical Sud' }
    ];

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Démonstration de la Vue en Grille</CardTitle>
                <Alert className="mt-4">
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>Mode démonstration</AlertTitle>
                    <AlertDescription>
                        Cette vue utilise des données factices pour illustrer les fonctionnalités de l'interface en grille.
                    </AlertDescription>
                </Alert>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <Select
                            value={selectedTrameId}
                            onValueChange={setSelectedTrameId}
                        >
                            <SelectTrigger className="w-[250px]">
                                <SelectValue placeholder="Sélectionner une trameModele" />
                            </SelectTrigger>
                            <SelectContent>
                                {demoData.map(trameModele => (
                                    <SelectItem key={trameModele.id} value={trameModele.id}>
                                        {trameModele.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={() => setShowNewTrameModal(true)}
                            variant="default"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Nouvelle TrameModele
                        </Button>
                    </div>

                    {demoData.length > 0 ? (
                        <TrameGridView
                            trameModele={demoData.find(t => t.id === selectedTrameId) || demoData[0]}
                            readOnly={false}
                            onTrameChange={(updatedTrame) => console.log('TrameModele mise à jour:', updatedTrame)}
                        />
                    ) : (
                        <div className="text-center p-8">
                            <p>Aucune donnée de démonstration disponible.</p>
                        </div>
                    )}
                </div>

                {showNewTrameModal && (
                    <NewTrameModal
                        isOpen={showNewTrameModal}
                        onClose={() => setShowNewTrameModal(false)}
                        onSuccess={(newTrameId) => {
                            setShowNewTrameModal(false);
                            toast({
                                title: "Nouvelle trameModele créée",
                                description: "La trameModele a été ajoutée avec succès (simulation)",
                            });
                        }}
                        sites={demoSites}
                    />
                )}
            </CardContent>
        </Card>
    );
};

export default TrameGridDemo; 