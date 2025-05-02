"use client";

import React, { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
    Settings,
    Calendar,
    FileText,
    Award,
    Activity,
    Grid,
    Share2,
    Layout,
    Map,
    TableProperties,
    Users,
    Clock
} from 'lucide-react';

// Importer les composants UI
import {
    Button,
    Card,
    CardContent,
    cn
} from '@/components/ui';

// Chargement dynamique des composants avec préchargement
const TypesCongesPage = dynamic(() => import('../types-conges/page'), {
    loading: () => <div>Chargement des types de congés...</div>
});

const HeaderConfigPanel = dynamic(() => import('./HeaderConfigPanel'), {
    loading: () => <div>Chargement de l'en-tête...</div>
});

const SpecialtiesConfigPanel = dynamic(() => import('./SpecialtiesConfigPanel'), {
    loading: () => <div>Chargement des spécialités...</div>
});

const OperatingRoomsConfigPanel = dynamic(() => import('./OperatingRoomsConfigPanel'), {
    loading: () => <div>Chargement des salles d'opération...</div>
});

const SectorsConfigPanel = dynamic(() => import('./SectorsConfigPanel'), {
    loading: () => <div>Chargement des secteurs...</div>
});

const PlanningRulesConfigPanel = dynamic(() => import('./PlanningRulesConfigPanel'), {
    loading: () => <div>Chargement des règles de planning...</div>
});

const AssignmentsConfigPanel = dynamic(() => import('./AssignmentsConfigPanel'), {
    loading: () => <div>Chargement des affectations...</div>
});

const WeeklyPlanningConfigPanel = dynamic(() => import('./WeeklyPlanningConfigPanel'), {
    loading: () => <div>Chargement du planning hebdomadaire...</div>
});

const LeaveManagementPanel = dynamic(() => import('./LeaveManagementPanel'), {
    loading: () => <div>Chargement de la gestion des congés...</div>
});

const ProfessionalRoleManagementPanel = dynamic(() => import('./ProfessionalRoleManagementPanel'), {
    loading: () => <div>Chargement des rôles professionnels...</div>
});

const TramesConfigPanel = dynamic(() => import('./TramesConfigPanel'), {
    loading: () => <div>Chargement des trames...</div>
});

// Ajout de l'import dynamique pour le nouveau panneau combiné
const SurgeonAndSpecialtyPanel = dynamic(() => import('./SurgeonAndSpecialtyPanel'), {
    loading: () => <div>Chargement des chirurgiens et spécialités...</div>
});

type ConfigMenuItem = {
    id: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    hoverColor: string;
};

// Définir menuItems en dehors du composant pour éviter les références circulaires
const menuItems: ConfigMenuItem[] = [
    {
        id: 'types',
        label: 'Types de Congés',
        icon: <Calendar className="h-5 w-5" />,
        color: 'bg-blue-600',
        hoverColor: 'hover:bg-blue-100'
    },
    {
        id: 'leave-management',
        label: 'Gestion des Congés Annuels',
        icon: <FileText className="h-5 w-5" />,
        color: 'bg-purple-600',
        hoverColor: 'hover:bg-purple-100'
    },
    {
        id: 'professional-roles',
        label: 'Rôles Professionnels',
        icon: <Users className="h-5 w-5" />,
        color: 'bg-green-600',
        hoverColor: 'hover:bg-green-100'
    },
    {
        id: 'surgeons-specialties',
        label: 'Chirurgiens - Spécialités',
        icon: <Award className="h-5 w-5" />,
        color: 'bg-teal-600',
        hoverColor: 'hover:bg-teal-100'
    },
    {
        id: 'operating-rooms',
        label: 'Bloc Opératoire',
        icon: <Layout className="h-5 w-5" />,
        color: 'bg-orange-600',
        hoverColor: 'hover:bg-orange-100'
    },
    {
        id: 'operating-sectors',
        label: 'Secteurs du Bloc',
        icon: <Grid className="h-5 w-5" />,
        color: 'bg-amber-500',
        hoverColor: 'hover:bg-amber-100'
    },
    {
        id: 'planning',
        label: 'Règles de Planning',
        icon: <Activity className="h-5 w-5" />,
        color: 'bg-green-600',
        hoverColor: 'hover:bg-green-100'
    },
    {
        id: 'assignments',
        label: 'Affectations',
        icon: <Share2 className="h-5 w-5" />,
        color: 'bg-indigo-600',
        hoverColor: 'hover:bg-indigo-100'
    },
    {
        id: 'weekly-planning',
        label: 'Planning Hebdomadaire',
        icon: <TableProperties className="h-5 w-5" />,
        color: 'bg-pink-600',
        hoverColor: 'hover:bg-pink-100'
    },
    {
        id: 'trames',
        label: 'Trames',
        icon: <Clock className="h-5 w-5" />,
        color: 'bg-cyan-600',
        hoverColor: 'hover:bg-cyan-100'
    },
    {
        id: 'header',
        label: 'En-tête des Requêtes',
        icon: <FileText className="h-5 w-5" />,
        color: 'bg-purple-600',
        hoverColor: 'hover:bg-purple-100'
    },
    {
        id: 'others',
        label: 'Autres Configurations',
        icon: <Settings className="h-5 w-5" />,
        color: 'bg-red-600',
        hoverColor: 'hover:bg-red-100'
    },
];

const ConfigurationPanelPage: React.FC = () => {
    const [selectedItem, setSelectedItem] = useState<string>('types');
    const [preloadedComponents, setPreloadedComponents] = useState<Set<string>>(new Set(['types']));

    // Précharger les composants adjacents
    useEffect(() => {
        const preloadAdjacentComponents = (currentId: string) => {
            const currentIndex = menuItems.findIndex(item => item.id === currentId);
            const adjacentIds = [
                menuItems[currentIndex - 1]?.id,
                menuItems[currentIndex + 1]?.id
            ].filter(Boolean);

            adjacentIds.forEach(id => {
                if (id && !preloadedComponents.has(id)) {
                    setPreloadedComponents(prev => new Set([...prev, id]));
                }
            });
        };

        preloadAdjacentComponents(selectedItem);
    }, [selectedItem, preloadedComponents]);

    const renderContent = () => {
        switch (selectedItem) {
            case 'types':
                return <TypesCongesPage />;
            case 'planning':
                return <PlanningRulesConfigPanel />;
            case 'header':
                return <HeaderConfigPanel />;
            case 'surgeons-specialties':
                return <SurgeonAndSpecialtyPanel />;
            case 'operating-rooms':
                return <OperatingRoomsConfigPanel />;
            case 'operating-sectors':
                return <SectorsConfigPanel />;
            case 'assignments':
                return <AssignmentsConfigPanel />;
            case 'weekly-planning':
                return <WeeklyPlanningConfigPanel />;
            case 'leave-management':
                return <LeaveManagementPanel />;
            case 'professional-roles':
                return <ProfessionalRoleManagementPanel />;
            case 'trames':
                return <TramesConfigPanel />;
            case 'others':
                return (
                    <Card>
                        <CardContent className="pt-6">
                            <h2 className="text-2xl font-bold mb-4">Autres Configurations</h2>
                            <p>Ici se trouveront d'autres configurations.</p>
                        </CardContent>
                    </Card>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex min-h-screen">
            <aside className="w-1/4 p-6 border-r bg-white border-gray-200">
                <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center">
                    <Settings className="h-7 w-7 mr-2 text-primary-600" />
                    Configuration
                </h1>
                <nav>
                    <ul className="space-y-2">
                        {menuItems.map((item) => (
                            <li key={item.id}>
                                <Button
                                    variant={selectedItem === item.id ? "primary" : "ghost"}
                                    onClick={() => setSelectedItem(item.id)}
                                    fullWidth
                                    className={cn(
                                        "justify-start py-2.5 px-4 hover:bg-gray-100 transition-colors",
                                        selectedItem === item.id && "text-white"
                                    )}
                                >
                                    <span className="mr-3">{item.icon}</span>
                                    {item.label}
                                </Button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
            <main className="flex-1 p-6 bg-gray-50">
                <Suspense fallback={<div>Chargement...</div>}>
                    {renderContent()}
                </Suspense>
            </main>
        </div>
    );
};

export default ConfigurationPanelPage; 