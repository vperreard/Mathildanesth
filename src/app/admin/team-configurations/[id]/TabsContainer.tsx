'use client';

import { TeamConfiguration } from '@/types/team-configuration';
import GeneralForm from './forms/GeneralForm';
import GardesForm from './forms/GardesForm';
import ConsultationsForm from './forms/ConsultationsForm';
import BlocForm from './forms/BlocForm';
import CongesForm from './forms/CongesForm';

interface TabsContainerProps {
    config: TeamConfiguration;
    updateConfig: (path: string, value: any) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const tabs = [
    { id: 'general', label: 'Général' },
    { id: 'gardes', label: 'Gardes' },
    { id: 'consultations', label: 'Consultations' },
    { id: 'bloc', label: 'Bloc Opératoire' },
    { id: 'conges', label: 'Congés' },
    { id: 'fatigue', label: 'Fatigue' },
    { id: 'tempsPartiel', label: 'Temps Partiel' },
    { id: 'iades', label: 'IADEs' },
    { id: 'autres', label: 'Autres Paramètres' },
];

export default function TabsContainer({ config, updateConfig, activeTab, setActiveTab }: TabsContainerProps) {
    return (
        <div>
            <div className="border-b border-gray-200">
                <nav className="flex overflow-x-auto py-2 px-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 mx-1 text-sm font-medium rounded-t-lg transition-colors duration-200 ${activeTab === tab.id
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="p-6">
                {activeTab === 'general' && (
                    <GeneralForm config={config} updateConfig={updateConfig} />
                )}
                {activeTab === 'gardes' && (
                    <GardesForm config={config} updateConfig={updateConfig} />
                )}
                {activeTab === 'consultations' && (
                    <ConsultationsForm config={config} updateConfig={updateConfig} />
                )}
                {activeTab === 'bloc' && (
                    <BlocForm config={config} updateConfig={updateConfig} />
                )}
                {activeTab === 'conges' && (
                    <CongesForm config={config} updateConfig={updateConfig} />
                )}
                {/* Formulaires supplémentaires à implémenter */}
                {activeTab === 'fatigue' && (
                    <div className="text-center py-10">
                        <p className="text-gray-500">Formulaire en cours de développement.</p>
                    </div>
                )}
                {activeTab === 'tempsPartiel' && (
                    <div className="text-center py-10">
                        <p className="text-gray-500">Formulaire en cours de développement.</p>
                    </div>
                )}
                {activeTab === 'iades' && (
                    <div className="text-center py-10">
                        <p className="text-gray-500">Formulaire en cours de développement.</p>
                    </div>
                )}
                {activeTab === 'autres' && (
                    <div className="text-center py-10">
                        <p className="text-gray-500">Formulaire en cours de développement.</p>
                    </div>
                )}
            </div>
        </div>
    );
} 