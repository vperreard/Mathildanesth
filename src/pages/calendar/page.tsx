'use client';

import React, { useState, useEffect } from 'react';
import DraggableCalendar from '../../components/DraggableCalendar';
import { Attribution, AssignmentStatus } from '../../types/assignment';
import { ShiftType } from '../../types/common';
import { RulesConfiguration } from '../../types/rules';
import { User, UserRole, LeaveStatus, LeaveType } from '../../types/user';
import { Doctor, MedicalSpecialty, MedicalGrade, DoctorAvailabilityStatus } from '../../types/doctor';
import toast from 'react-hot-toast';
import { addDays, startOfDay } from 'date-fns';
import { Toaster } from 'react-hot-toast';

// Simuler des données utilisateurs pour notre exemple
const mockUsers: User[] = [
    {
        id: "1",
        prenom: 'Alice',
        nom: 'Dubois',
        email: 'alice.dubois@example.com',
        role: UserRole.MÉDECIN,
        leaves: []
    },
    {
        id: "2",
        prenom: 'Bob',
        nom: 'Martin',
        email: 'bob.martin@example.com',
        role: UserRole.MÉDECIN,
        leaves: [
            {
                id: 'leave1',
                userId: '2',
                startDate: addDays(startOfDay(new Date()), 3),
                endDate: addDays(startOfDay(new Date()), 5),
                type: LeaveType.VACATION,
                status: LeaveStatus.APPROVED,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        ]
    },
    {
        id: "3",
        prenom: 'Charlie',
        nom: 'Bernard',
        email: 'charlie.bernard@example.com',
        role: UserRole.MÉDECIN,
        leaves: []
    }
];

// Exemple de médecins
const mockDoctors: Doctor[] = [
    {
        id: "1",
        firstName: "Jean",
        lastName: "Dupont",
        rpps: "12345678901",
        specialty: MedicalSpecialty.ANESTHESIE_REANIMATION,
        grade: MedicalGrade.CHEF_DE_CLINIQUE,
        facilityIds: ["facility1"],
        primaryServiceId: "service1",
        startDate: new Date(2020, 0, 1),
        occupationRate: 100,
        email: "jean.dupont@hopital.fr",
        phone: "0123456789",
        availabilityStatus: DoctorAvailabilityStatus.DISPONIBLE,
        currentMonthDutyCount: 2,
        currentYearDutyCount: 24,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: "2",
        firstName: "Marie",
        lastName: "Martin",
        rpps: "23456789012",
        specialty: MedicalSpecialty.MEDECINE_GENERALE,
        grade: MedicalGrade.PRATICIEN_HOSPITALIER,
        facilityIds: ["facility1"],
        primaryServiceId: "service2",
        startDate: new Date(2019, 5, 15),
        occupationRate: 80,
        email: "marie.martin@hopital.fr",
        phone: "0234567890",
        availabilityStatus: DoctorAvailabilityStatus.DISPONIBLE,
        currentMonthDutyCount: 3,
        currentYearDutyCount: 28,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: "3",
        firstName: "Pierre",
        lastName: "Dubois",
        rpps: "34567890123",
        specialty: MedicalSpecialty.CARDIOLOGIE,
        grade: MedicalGrade.PROFESSEUR_UNIVERSITAIRE,
        facilityIds: ["facility1"],
        primaryServiceId: "service3",
        startDate: new Date(2018, 2, 10),
        occupationRate: 100,
        email: "pierre.dubois@hopital.fr",
        phone: "0345678901",
        availabilityStatus: DoctorAvailabilityStatus.DISPONIBLE,
        currentMonthDutyCount: 1,
        currentYearDutyCount: 18,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// Exemple de règles de planification conformes à l'interface RulesConfiguration
const mockRules: RulesConfiguration = {
    minimumRestPeriod: 11,
    shiftStartTimes: {
        [ShiftType.MATIN]: '08:00',
        [ShiftType.APRES_MIDI]: '13:30',
        [ShiftType.JOUR]: '08:00',
        [ShiftType.NUIT]: '20:00',
        [ShiftType.GARDE_24H]: '08:00',
        [ShiftType.GARDE_WEEKEND]: '08:00',
        [ShiftType.ASTREINTE]: '00:00',
        [ShiftType.ASTREINTE_SEMAINE]: '00:00',
        [ShiftType.ASTREINTE_WEEKEND]: '00:00',
        [ShiftType.URGENCE]: '08:00',
        [ShiftType.CONSULTATION]: '09:00',
    },
    shiftEndTimes: {
        [ShiftType.MATIN]: '13:00',
        [ShiftType.APRES_MIDI]: '18:30',
        [ShiftType.JOUR]: '20:00',
        [ShiftType.NUIT]: '08:00',
        [ShiftType.GARDE_24H]: '08:00',
        [ShiftType.GARDE_WEEKEND]: '08:00',
        [ShiftType.ASTREINTE]: '00:00',
        [ShiftType.ASTREINTE_SEMAINE]: '00:00',
        [ShiftType.ASTREINTE_WEEKEND]: '00:00',
        [ShiftType.URGENCE]: '20:00',
        [ShiftType.CONSULTATION]: '13:00',
    },
    shiftSpecialties: {
        [ShiftType.MATIN]: [],
        [ShiftType.APRES_MIDI]: [],
        [ShiftType.JOUR]: [],
        [ShiftType.NUIT]: [],
        [ShiftType.GARDE_24H]: [],
        [ShiftType.GARDE_WEEKEND]: [],
        [ShiftType.ASTREINTE]: [],
        [ShiftType.ASTREINTE_SEMAINE]: [],
        [ShiftType.ASTREINTE_WEEKEND]: [],
        [ShiftType.URGENCE]: ['URGENTISTE'],
        [ShiftType.CONSULTATION]: ['GENERALISTE', 'SPECIALISTE_X'],
    },
    weekdayShifts: [ShiftType.MATIN, ShiftType.APRES_MIDI, ShiftType.JOUR, ShiftType.NUIT, ShiftType.CONSULTATION, ShiftType.URGENCE, ShiftType.ASTREINTE_SEMAINE],
    weekendShifts: [ShiftType.GARDE_24H, ShiftType.GARDE_WEEKEND, ShiftType.ASTREINTE_WEEKEND],
    intervalle: {
        minJoursEntreGardes: 7,
        minJoursRecommandes: 14,
        maxGardesMois: 4,
        maxGardesConsecutives: 1,
        maxAstreintesMois: 8,
    },
    supervision: {
        maxSallesParMAR: { standard: 2, exceptionnel: 3 },
        reglesSecteursCompatibles: {},
        maxSallesExceptionnel: 3,
    },
    consultations: {
        maxParSemaine: 5,
        equilibreMatinApresMidi: true,
    },
    equite: {
        poidsGardesWeekend: 1.5,
        poidsGardesFeries: 2.0,
        equilibrageSpecialites: true,
    },
    qualiteVie: {
        poidsPreferences: 0.5,
        eviterConsecutifs: true,
        recuperationApresGardeNuit: true,
    }
};

const mockInitialAssignments: Attribution[] = [
    {
        id: 'assign1',
        userId: '1',
        startDate: startOfDay(new Date()),
        endDate: addDays(startOfDay(new Date()), 1),
        shiftType: ShiftType.GARDE_24H,
        status: AssignmentStatus.APPROVED,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 'assign2',
        userId: '3',
        startDate: addDays(startOfDay(new Date()), 1),
        endDate: addDays(startOfDay(new Date()), 1),
        shiftType: ShiftType.MATIN,
        status: AssignmentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
    }
];

// Fonction pour générer des gardes/vacations MOCK (corrigée à nouveau)
function generateMockAssignments(users: User[]): Attribution[] {
    const attributions: Attribution[] = [];
    const today = startOfDay(new Date());

    users.forEach((user, userIndex) => {
        for (let i = 0; i < 7; i++) {
            const date = addDays(today, i);
            let shiftType: ShiftType | null = null;
            const dayOfWeek = date.getDay();

            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                if (i % 3 === userIndex % 3) {
                    shiftType = (i % 2 === 0) ? ShiftType.MATIN : ShiftType.APRES_MIDI;
                } else if (i % 4 === userIndex % 4) {
                    shiftType = ShiftType.JOUR;
                } else if (i % 5 === userIndex % 5) {
                    shiftType = ShiftType.NUIT;
                }
            } else {
                if (i % 2 === userIndex % 2) {
                    shiftType = ShiftType.GARDE_WEEKEND;
                }
            }

            if (shiftType) {
                let endDate = new Date(date);
                // Correction: Comparaison GARDE_24H retirée car non générée ici
                if (shiftType === ShiftType.NUIT || shiftType === ShiftType.GARDE_WEEKEND) {
                    endDate = addDays(date, 1);
                }
                else if (shiftType === ShiftType.MATIN) endDate.setHours(13, 0, 0, 0);
                else if (shiftType === ShiftType.APRES_MIDI) endDate.setHours(18, 30, 0, 0);
                else if (shiftType === ShiftType.JOUR) endDate.setHours(20, 0, 0, 0);

                attributions.push({
                    id: `mock-${user.id}-${i}`,
                    userId: user.id,
                    startDate: date, // Utilisation de startDate
                    endDate: endDate,
                    shiftType: shiftType,
                    status: AssignmentStatus.APPROVED, // Utilisation de APPROVED
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }
    });
    // Ajouter manuellement une garde 24h pour tester si besoin
    attributions.push({
        id: `mock-24h-1`, userId: users[0].id, shiftType: ShiftType.GARDE_24H,
        startDate: addDays(today, 8), endDate: addDays(today, 9), status: AssignmentStatus.APPROVED,
        createdAt: new Date(), updatedAt: new Date()
    });
    return attributions;
}

const CalendarPage: React.FC = () => {
    const [attributions, setAssignments] = useState<Attribution[]>(() => generateMockAssignments(mockUsers));
    const [isLoading, setIsLoading] = useState(false); // Mettre à false car données mockées
    const [syncErrors, setSyncErrors] = useState<any[]>([]);
    const [validationErrors, setValidationErrors] = useState<any[]>([]);
    const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null);

    // Charger les gardes/vacations au chargement de la page (commenté car mock)
    // useEffect(() => {
    //   setIsLoading(true);
    //   // Simuler un fetch API
    //   setTimeout(() => {
    //       setAssignments(generateMockAssignments(mockUsers));
    //       setIsLoading(false);
    //   }, 500);
    // }, []);

    const handleSave = (savedAssignments: Attribution[]) => {
        console.log("Changements sauvegardés (reçus via onSave):", savedAssignments);
        setAssignments(savedAssignments);
        toast.success('Modifications sauvegardées avec succès!');
    }

    const handleValidationError = (violations: any[]) => {
        console.error("Erreurs de validation détectées:", violations);
        setValidationErrors(violations);
        toast.error(`Des erreurs de validation empêchent la sauvegarde.`);
    }

    const handleSyncComplete = (success: boolean) => {
        console.log(`Synchronisation terminée avec succès: ${success}`);
        setSyncSuccess(success);
        if (!success) {
            toast.error('Échec de la synchronisation des modifications.');
        }
    }

    return (
        <div className="p-4">
            <Toaster position="top-right" /> {/* Ajouté pour afficher les toasts */}
            <h1 className="text-2xl font-bold mb-4">Calendrier du Planning</h1>
            {isLoading ? (
                <div>Chargement du calendrier...</div>
            ) : (
                <DraggableCalendar
                    initialAssignments={attributions}
                    users={mockUsers}
                    doctors={mockDoctors}
                    rules={mockRules}
                    onSave={handleSave}
                    onValidationError={handleValidationError}
                    onSyncComplete={handleSyncComplete}
                />
            )}
            {validationErrors.length > 0 && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <h3 className="font-bold">Erreurs de validation:</h3>
                    {/* Correction: s'assurer que err est bien une string ou un objet simple */}
                    <ul>
                        {validationErrors.map((err, index) => <li key={index}>{typeof err === 'string' ? err : JSON.stringify(err)}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CalendarPage; 