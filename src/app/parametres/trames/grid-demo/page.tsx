'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Charger le composant dynamiquement pour éviter les problèmes de SSR avec react-beautiful-dnd
const TrameGridDemo = dynamic(
    () => import('@/components/tableaux de service/grid-view/TrameGridDemo'),
    { ssr: false }
);

export default function TrameGridDemoPage() {
    // Un wrapper simple pour la démo
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Démo Interface Grille de Tableaux de service</h1>

            <div className="bg-white shadow-md rounded-lg p-6">
                <TrameGridDemo />
            </div>
        </div>
    );
} 