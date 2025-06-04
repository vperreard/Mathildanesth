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
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Importer les composants UI
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';

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
    loading: () => <div>Chargement des trameModeles...</div>
});

// Ajout de l'import dynamique pour le nouveau panneau combiné
const SurgeonAndSpecialtyPanel = dynamic(() => import('./SurgeonAndSpecialtyPanel'), {
    loading: () => <div>Chargement des chirurgiens et spécialités...</div>
});

// Ajout de l'import dynamique pour la gestion de la fatigue
const FatigueManagementPanel = dynamic(() => import('./fatigue/page'), {
    loading: () => <div>Chargement de la gestion de la fatigue...</div>
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
        color: 'bg-gradient-to-r from-primary-500 to-secondary-500',
        hoverColor: 'hover:from-primary-400 hover:to-secondary-400'
    },
    {
        id: 'leave-management',
        label: 'Gestion des Congés Annuels',
        icon: <FileText className="h-5 w-5" />,
        color: 'bg-gradient-to-r from-primary-500 via-secondary-500 to-tertiary-500',
        hoverColor: 'hover:from-primary-400 hover:via-secondary-400 hover:to-tertiary-400'
    },
    {
        id: 'professional-roles',
        label: 'Rôles Professionnels',
        icon: <Users className="h-5 w-5" />,
        color: 'bg-gradient-to-r from-secondary-500 to-tertiary-500',
        hoverColor: 'hover:from-secondary-400 hover:to-tertiary-400'
    },
    {
        id: 'surgeons-specialties',
        label: 'Chirurgiens - Spécialités',
        icon: <Award className="h-5 w-5" />,
        color: 'bg-gradient-to-r from-tertiary-500 to-secondary-500',
        hoverColor: 'hover:from-tertiary-400 hover:to-secondary-400'
    },
    {
        id: 'operating-rooms',
        label: 'Bloc Opératoire',
        icon: <Layout className="h-5 w-5" />,
        color: 'bg-gradient-to-r from-primary-500 to-tertiary-500',
        hoverColor: 'hover:from-primary-400 hover:to-tertiary-400'
    },
    {
        id: 'operating-sectors',
        label: 'Secteurs du Bloc',
        icon: <Grid className="h-5 w-5" />,
        color: 'bg-gradient-to-r from-secondary-500 via-tertiary-500 to-primary-500',
        hoverColor: 'hover:from-secondary-400 hover:via-tertiary-400 hover:to-primary-400'
    },
    {
        id: 'planning',
        label: 'Règles de Planning',
        icon: <Activity className="h-5 w-5" />,
        color: 'bg-gradient-to-r from-tertiary-500 via-primary-500 to-secondary-500',
        hoverColor: 'hover:from-tertiary-400 hover:via-primary-400 hover:to-secondary-400'
    },
    {
        id: 'fatigue-management',
        label: 'Gestion de la Fatigue',
        icon: <Activity className="h-5 w-5" />,
        color: 'bg-gradient-to-r from-primary-500 via-secondary-500 to-tertiary-500',
        hoverColor: 'hover:from-primary-400 hover:via-secondary-400 hover:to-tertiary-400'
    },
    {
        id: 'attributions',
        label: 'Affectations',
        icon: <Share2 className="h-5 w-5" />,
        color: 'bg-gradient-to-r from-primary-500 to-secondary-500',
        hoverColor: 'hover:from-primary-400 hover:to-secondary-400'
    },
    {
        id: 'weekly-planning',
        label: 'Planning Hebdomadaire',
        icon: <TableProperties className="h-5 w-5" />,
        color: 'bg-gradient-to-r from-tertiary-500 to-primary-500',
        hoverColor: 'hover:from-tertiary-400 hover:to-primary-400'
    },
    {
        id: 'trameModeles',
        label: 'TrameModeles',
        icon: <Clock className="h-5 w-5" />,
        color: 'bg-gradient-to-r from-secondary-500 to-tertiary-500',
        hoverColor: 'hover:from-secondary-400 hover:to-tertiary-400'
    },
    {
        id: 'header',
        label: 'En-tête des Requêtes',
        icon: <FileText className="h-5 w-5" />,
        color: 'bg-gradient-to-r from-primary-500 via-tertiary-500 to-secondary-500',
        hoverColor: 'hover:from-primary-400 hover:via-tertiary-400 hover:to-secondary-400'
    },
    {
        id: 'others',
        label: 'Autres Configurations',
        icon: <Settings className="h-5 w-5" />,
        color: 'bg-gradient-to-r from-primary-500 via-secondary-500 to-tertiary-500',
        hoverColor: 'hover:from-primary-400 hover:via-secondary-400 hover:to-tertiary-400'
    },
];

const ConfigurationPanelPage: React.FC = () => {
    const [selectedItem, setSelectedItem] = useState<string>('types');
    const { theme } = useTheme();
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

    // Fonction pour tester l'application des couleurs
    const testColors = () => {
        alert("Bouton de test des couleurs cliqué");
    };

    const renderContent = () => {
        switch (selectedItem) {
            case 'types':
                return <TypesCongesPage />;
            case 'leave-management':
                return <LeaveManagementPanel />;
            case 'professional-roles':
                return <ProfessionalRoleManagementPanel />;
            case 'surgeons-specialties':
                return <SurgeonAndSpecialtyPanel />;
            case 'operating-rooms':
                return <OperatingRoomsConfigPanel />;
            case 'operating-sectors':
                return <SectorsConfigPanel />;
            case 'planning':
                return <PlanningRulesConfigPanel />;
            case 'fatigue-management':
                return preloadedComponents.has('fatigue-management') || selectedItem === 'fatigue-management' ? <FatigueManagementPanel /> : null;
            case 'attributions':
                return <AssignmentsConfigPanel />;
            case 'weekly-planning':
                return preloadedComponents.has('weekly-planning') || selectedItem === 'weekly-planning' ? <WeeklyPlanningConfigPanel /> : null;
            case 'trameModeles':
                typeof window !== 'undefined' && window.location.replace('/parametres/trameModeles');
                return <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Redirection vers la nouvelle interface des trameModeles...</p>
                </div>;
            case 'header':
                return <HeaderConfigPanel />;
            case 'others':
                return (
                    preloadedComponents.has('others') || selectedItem === 'others' ? (
                        <div>Contenu pour Autres Configurations</div>
                    ) : null
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Sidebar */}
            <nav className={cn("w-64 p-4 space-y-2 border-r", theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200')}>
                {menuItems.map((item) => (
                    <Button
                        key={item.id}
                        variant={selectedItem === item.id ? "default" : "ghost"}
                        className={cn(
                            "w-full justify-start text-sm",
                            selectedItem === item.id ? `${item.color} text-white` : 'text-foreground',
                            selectedItem !== item.id && item.hoverColor
                        )}
                        onClick={() => setSelectedItem(item.id)}
                    >
                        {item.icon}
                        <span className="ml-2">{item.label}</span>
                    </Button>
                ))}
            </nav>

            {/* Main content */}
            <main className="flex-1 p-6 overflow-auto">
                <Suspense fallback={<div>Chargement du contenu...</div>}>
                    <DndProvider backend={HTML5Backend}>
                        {renderContent()}
                    </DndProvider>
                </Suspense>
            </main>
        </div>
    );
};

export default ConfigurationPanelPage; 