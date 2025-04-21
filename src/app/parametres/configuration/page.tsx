"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import TypesCongesPage from '../types-conges/page';

const ConfigurationPanelPage: React.FC = () => {
    const [selectedItem, setSelectedItem] = useState<string>('types');

    const renderContent = () => {
        switch (selectedItem) {
            case 'types':
                return <TypesCongesPage />;
            case 'planning':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Gestion des Règles de Planning</h2>
                        <p>Ici se trouvera la gestion des règles de planning.</p>
                    </div>
                );
            case 'others':
                return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Autres Configurations</h2>
                        <p>Ici se trouveront d'autres configurations.</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex min-h-screen">
            <aside className="w-1/4 p-6 border-r">
                <h1 className="text-3xl font-bold mb-6">Configuration</h1>
                <ul className="space-y-4">
                    <li>
                        <button
                            onClick={() => setSelectedItem('types')}
                            className={`w-full text-left px-4 py-2 rounded ${selectedItem === 'types' ? 'bg-blue-600 text-white' : 'hover:bg-blue-100'}`}>
                            Types de Congés
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => setSelectedItem('planning')}
                            className={`w-full text-left px-4 py-2 rounded ${selectedItem === 'planning' ? 'bg-green-600 text-white' : 'hover:bg-green-100'}`}>
                            Règles de Planning
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={() => setSelectedItem('others')}
                            className={`w-full text-left px-4 py-2 rounded ${selectedItem === 'others' ? 'bg-red-600 text-white' : 'hover:bg-red-100'}`}>
                            Autres Configurations
                        </button>
                    </li>
                </ul>
            </aside>
            <main className="flex-1 p-6">
                {renderContent()}
            </main>
        </div>
    );
};

export default ConfigurationPanelPage; 