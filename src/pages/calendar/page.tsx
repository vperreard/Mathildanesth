'use client';

import React, { useState, useEffect } from 'react';
import DraggableCalendar from '../../components/DraggableCalendar';
import { Assignment, ShiftType, AssignmentStatus } from '../../types/assignment';
import { RulesConfiguration } from '../../types/rules';
import { User } from '../../types/user';
import { Doctor, MedicalSpecialty, MedicalGrade, DoctorAvailabilityStatus } from '../../types/doctor';
import toast from 'react-hot-toast';

// Simuler des données utilisateurs pour notre exemple
const mockUsers: User[] = [
    {
        id: "1",
        prenom: 'Jean',
        nom: 'Dupont',
        email: 'jean.dupont@hopital.fr',
        login: 'jdupont',
        role: 'DOCTOR',
        professionalRole: 'MEDECIN'
    },
    {
        id: "2",
        prenom: 'Marie',
        nom: 'Martin',
        email: 'marie.martin@hopital.fr',
        login: 'mmartin',
        role: 'DOCTOR',
        professionalRole: 'MEDECIN'
    },
    {
        id: "3",
        prenom: 'Pierre',
        nom: 'Dubois',
        email: 'pierre.dubois@hopital.fr',
        login: 'pdubois',
        role: 'DOCTOR',
        professionalRole: 'MEDECIN'
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
    intervalle: {
        minJoursEntreGardes: 2,
        minJoursRecommandes: 7,
        maxGardesMois: 5,
        maxGardesConsecutives: 1
    },
    supervision: {
        maxSallesParMAR: {
            'standard': 2
        },
        maxSallesExceptionnel: 3,
        reglesSecteursCompatibles: {
            'standard': ['standard']
        }
    },
    consultations: {
        maxParSemaine: 2,
        equilibreMatinApresMidi: true
    },
    equite: {
        poidsGardesWeekend: 1.5,
        poidsGardesFeries: 2,
        equilibrageSpecialites: true
    },
    qualiteVie: {
        poidsPreferences: 0.5,
        eviterConsecutifs: true,
        recuperationApresGardeNuit: true
    }
};

const CalendarDragDropDemo: React.FC = () => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [syncErrors, setSyncErrors] = useState<any[]>([]);

    // Charger les affectations au chargement de la page
    useEffect(() => {
        // Simulation d'un chargement depuis une API
        setIsLoading(true);
        setTimeout(() => {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            // Générer des affectations aléatoires pour le mois en cours
            const generatedAssignments: Assignment[] = [];

            // Pour chaque utilisateur
            mockUsers.forEach((user, userIndex) => {
                // Attribuer 3 à 5 gardes aléatoires dans le mois
                const assignmentCount = 3 + Math.floor(Math.random() * 3);

                for (let i = 0; i < assignmentCount; i++) {
                    // Jour aléatoire entre 1 et 28
                    const day = 1 + Math.floor(Math.random() * 28);
                    const date = new Date(currentYear, currentMonth, day);

                    // Alterner les types de garde
                    const shiftTypes = [ShiftType.DAY, ShiftType.NIGHT, ShiftType.WEEKEND, ShiftType.HOLIDAY];
                    const shiftType = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];

                    generatedAssignments.push({
                        id: `assignment-${userIndex}-${i}`,
                        doctorId: user.id,
                        date: date,
                        shiftType: shiftType,
                        status: AssignmentStatus.SCHEDULED,
                        notes: ''
                    });
                }
            });

            setAssignments(generatedAssignments);
            setIsLoading(false);
        }, 1000);
    }, []);

    // Gérer la sauvegarde des affectations
    const handleSave = (updatedAssignments: Assignment[]) => {
        console.log('Affectations sauvegardées:', updatedAssignments);
        // Dans une application réelle, on pourrait envoyer ces données à une API
    };

    // Gérer les erreurs de validation
    const handleValidationError = (violations: any[]) => {
        console.error('Violations des règles:', violations);
        setSyncErrors(violations);
    };

    // Gérer la fin de la synchronisation
    const handleSyncComplete = (success: boolean) => {
        if (success) {
            toast.success('Synchronisation avec le calendrier principal réussie');
            setSyncErrors([]);
        } else {
            toast.error('Échec de la synchronisation avec le calendrier principal');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">Calendrier des gardes avec drag-and-drop</h1>

            {syncErrors.length > 0 && (
                <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                    <h2 className="font-bold mb-2">Erreurs de synchronisation avec le calendrier principal</h2>
                    <ul className="list-disc list-inside">
                        {syncErrors.map((error, index) => (
                            <li key={index}>{error.message}</li>
                        ))}
                    </ul>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <DraggableCalendar
                    initialAssignments={assignments}
                    users={mockUsers}
                    doctors={mockDoctors}
                    rules={mockRules}
                    onSave={handleSave}
                    onValidationError={handleValidationError}
                    onSyncComplete={handleSyncComplete}
                />
            )}

            <div className="mt-8 p-4 bg-blue-50 rounded-md">
                <h2 className="text-xl font-semibold mb-2">Instructions</h2>
                <ul className="list-disc list-inside space-y-1">
                    <li>Faites glisser une garde pour la déplacer à une autre date</li>
                    <li>Les gardes modifiées apparaissent en jaune jusqu'à la sauvegarde</li>
                    <li>Cliquez sur le X d'une garde modifiée pour annuler le changement</li>
                    <li>Utilisez le bouton "Valider" pour vérifier les règles de planning</li>
                    <li>Utilisez le bouton "Annuler" pour annuler toutes les modifications</li>
                    <li>Utilisez le bouton "Sauvegarder" pour enregistrer les modifications</li>
                </ul>
            </div>
        </div>
    );
};

export default CalendarDragDropDemo; 