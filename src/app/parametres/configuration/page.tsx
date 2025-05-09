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
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
        id: 'assignments',
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
        id: 'trames',
        label: 'Trames',
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
            case 'assignments':
                return <AssignmentsConfigPanel />;
            case 'weekly-planning':
                return preloadedComponents.has('weekly-planning') || selectedItem === 'weekly-planning' ? <WeeklyPlanningConfigPanel /> : null;
            case 'trames':
                return preloadedComponents.has('trames') || selectedItem === 'trames' ? <TramesConfigPanel /> : null;
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
        <div className="flex min-h-screen">
            <aside className="w-1/4 p-6 border-r bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                <h1
                    className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary-600 via-secondary-600 to-tertiary-600 bg-clip-text text-transparent dark:text-gray-100 flex items-center"
                    style={{
                        background: 'linear-gradient(to right, rgb(79, 70, 229), rgb(192, 38, 211), rgb(219, 39, 119))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}
                >
                    <Settings className="h-7 w-7 mr-2 text-primary-600 dark:text-primary-400" />
                    Configuration
                </h1>

                {/* Bouton de test des couleurs */}
                <div className="mb-4">
                    <button
                        className="w-full bg-primary-500 text-white p-2 rounded-md mb-2"
                        onClick={testColors}
                        style={{ backgroundColor: 'rgb(99, 102, 241)' }}
                    >
                        Test Couleur Primaire
                    </button>
                    <button
                        className="w-full bg-gradient-to-r from-primary-500 via-secondary-500 to-tertiary-500 text-white p-2 rounded-md"
                        onClick={testColors}
                        style={{
                            background: 'linear-gradient(to right, rgb(99, 102, 241), rgb(217, 70, 239), rgb(236, 72, 153))'
                        }}
                    >
                        Test Dégradé
                    </button>
                </div>

                <nav>
                    <ul className="space-y-2">
                        {menuItems.map((item) => (
                            <li key={item.id}>
                                <Button
                                    variant={selectedItem === item.id ? "primary" : "ghost"}
                                    onClick={() => setSelectedItem(item.id)}
                                    fullWidth
                                    className={cn(
                                        "justify-start py-2.5 px-4 transition-all",
                                        selectedItem === item.id ? "text-white shadow-md" : "hover:bg-gradient-to-r hover:from-primary-50 hover:via-secondary-50 hover:to-tertiary-50 text-gray-700 dark:text-gray-200 dark:hover:bg-slate-700"
                                    )}
                                >
                                    <span className={`mr-3 ${selectedItem === item.id ? 'text-white' : 'text-primary-600 dark:text-primary-400'}`}>{item.icon}</span>
                                    {item.label}
                                </Button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
            <main className="flex-1 p-6 bg-gray-50 dark:bg-slate-900">
                <Suspense fallback={<div className="animate-pulse">Chargement...</div>}>
                    {renderContent()}
                </Suspense>
            </main>
        </div>
    );
};

export default ConfigurationPanelPage; 