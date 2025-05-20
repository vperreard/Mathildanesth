'use client';

import React, { useEffect, useState } from 'react';
import TrameGridView, { TrameModele, AffectationModele, RequiredStaff, DayPeriod } from './TrameGridView';

// Données simulées pour la démo
const mockTrame: TrameModele = {
    id: 'trame1',
    name: 'Trame Bloc Orthopédie - Semaines Paires',
    description: 'Trame standard pour le bloc orthopédie, semaines paires',
    siteId: 'site1',
    weekType: 'EVEN',
    activeDays: [1, 2, 3, 4, 5], // Lundi à vendredi
    effectiveStartDate: new Date('2025-01-01'),
    effectiveEndDate: new Date('2025-12-31'),
    affectations: [
        // Salle 1, Lundi
        {
            id: 'aff1',
            trameId: 'trame1',
            roomId: 'room1',
            activityTypeId: 'activity1',
            period: 'MORNING',
            isActive: true,
            requiredStaff: [
                {
                    id: 'staff1',
                    affectationId: 'aff1',
                    role: 'MAR',
                    count: 1,
                    userId: 'user1'
                },
                {
                    id: 'staff2',
                    affectationId: 'aff1',
                    role: 'SURGEON',
                    count: 1,
                    userId: 'user3'
                },
                {
                    id: 'staff3',
                    affectationId: 'aff1',
                    role: 'IADE',
                    count: 1,
                    userId: 'user5'
                }
            ]
        },
        {
            id: 'aff2',
            trameId: 'trame1',
            roomId: 'room1',
            activityTypeId: 'activity1',
            period: 'AFTERNOON',
            isActive: true,
            requiredStaff: [
                {
                    id: 'staff4',
                    affectationId: 'aff2',
                    role: 'MAR',
                    count: 1,
                    userId: 'user1'
                },
                {
                    id: 'staff5',
                    affectationId: 'aff2',
                    role: 'SURGEON',
                    count: 1,
                    userId: 'user3'
                },
                {
                    id: 'staff6',
                    affectationId: 'aff2',
                    role: 'IADE',
                    count: 1,
                    userId: 'user5'
                }
            ]
        },
        // Salle 2, Lundi
        {
            id: 'aff3',
            trameId: 'trame1',
            roomId: 'room2',
            activityTypeId: 'activity1',
            period: 'MORNING',
            isActive: true,
            requiredStaff: [
                {
                    id: 'staff7',
                    affectationId: 'aff3',
                    role: 'MAR',
                    count: 1,
                    userId: 'user2'
                }
            ]
        },
        {
            id: 'aff4',
            trameId: 'trame1',
            roomId: 'room2',
            activityTypeId: 'activity1',
            period: 'AFTERNOON',
            isActive: true,
            requiredStaff: [
                {
                    id: 'staff8',
                    affectationId: 'aff4',
                    role: 'MAR',
                    count: 1,
                    userId: 'user2'
                }
            ]
        },
        // Salle 3, Fermée le Lundi
        {
            id: 'aff5',
            trameId: 'trame1',
            roomId: 'room3',
            activityTypeId: 'activity1',
            period: 'FULL_DAY',
            dayOverride: 1, // Lundi
            isActive: false,
            requiredStaff: []
        },
        // Salle 2, Mardi
        {
            id: 'aff6',
            trameId: 'trame1',
            roomId: 'room2',
            activityTypeId: 'activity1',
            period: 'FULL_DAY',
            dayOverride: 2, // Mardi
            isActive: true,
            requiredStaff: [
                {
                    id: 'staff9',
                    affectationId: 'aff6',
                    role: 'MAR',
                    count: 1,
                    userId: 'user2'
                },
                {
                    id: 'staff10',
                    affectationId: 'aff6',
                    role: 'SURGEON',
                    count: 1,
                    userId: 'user4'
                },
                {
                    id: 'staff11',
                    affectationId: 'aff6',
                    role: 'IADE',
                    count: 1,
                    userId: 'user6'
                }
            ]
        }
    ]
};

const TrameGridDemo: React.FC = () => {
    const [trame, setTrame] = useState<TrameModele>(mockTrame);

    // Simuler le chargement des données
    useEffect(() => {
        console.log('Chargement de la trame de démo');
    }, []);

    // Gérer les modifications de la trame
    const handleTrameChange = (updatedTrame: TrameModele) => {
        console.log('Trame mise à jour:', updatedTrame);
        setTrame(updatedTrame);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Démo Interface Grille de Trames</h1>

            <div className="bg-white shadow-md rounded-lg p-6">
                <TrameGridView
                    trame={trame}
                    onTrameChange={handleTrameChange}
                />
            </div>
        </div>
    );
};

export default TrameGridDemo; 