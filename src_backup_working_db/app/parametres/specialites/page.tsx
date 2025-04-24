import React from 'react';
import SpecialtyManager from '@/components/SpecialtyManager'; // Importer le composant client

export default function ManageSpecialtiesPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestion des Spécialités</h1>
            <p className="mb-6 text-gray-600">
                Ajoutez, modifiez ou supprimez les spécialités chirurgicales disponibles dans l'application.
                Cochez la case "Pédiatrique" pour les spécialités spécifiques aux enfants.
            </p>
            <SpecialtyManager />
        </div>
    );
} 