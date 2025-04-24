"use client";

import React, { useState } from 'react';
import Link from 'next/link';
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
    TableProperties
} from 'lucide-react';
import TypesCongesPage from '../types-conges/page';
import HeaderConfigPanel from './HeaderConfigPanel';
import SpecialtiesConfigPanel from './SpecialtiesConfigPanel';
import OperatingRoomsConfigPanel from './OperatingRoomsConfigPanel';
import SectorsConfigPanel from './SectorsConfigPanel';
import PlanningRulesConfigPanel from './PlanningRulesConfigPanel';
import AssignmentsConfigPanel from './AssignmentsConfigPanel';
import WeeklyPlanningConfigPanel from './WeeklyPlanningConfigPanel';

// Importer les composants UI
import {
    Button,
    Card,
    CardContent,
    cn
} from '@/components/ui';

type ConfigMenuItem = {
    id: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    hoverColor: string;
};

const ConfigurationPanelPage: React.FC = () => {
    const [selectedItem, setSelectedItem] = useState<string>('types');

    const menuItems: ConfigMenuItem[] = [
        {
            id: 'types',
            label: 'Types de Congés',
            icon: <Calendar className="h-5 w-5" />,
            color: 'bg-blue-600',
            hoverColor: 'hover:bg-blue-100'
        },
        {
            id: 'specialties',
            label: 'Spécialités Chirurgicales',
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

    const renderContent = () => {
        switch (selectedItem) {
            case 'types':
                return <TypesCongesPage />;
            case 'planning':
                return <PlanningRulesConfigPanel />;
            case 'header':
                return <HeaderConfigPanel />;
            case 'specialties':
                return <SpecialtiesConfigPanel />;
            case 'operating-rooms':
                return <OperatingRoomsConfigPanel />;
            case 'operating-sectors':
                return <SectorsConfigPanel />;
            case 'assignments':
                return <AssignmentsConfigPanel />;
            case 'weekly-planning':
                return <WeeklyPlanningConfigPanel />;
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
                {renderContent()}
            </main>
        </div>
    );
};

export default ConfigurationPanelPage; 