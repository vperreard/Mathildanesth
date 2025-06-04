'use client';

import React from 'react';
import SpecialtyManager from '@/components/SpecialtyManager'; // Importer le composant client
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui';
import ProtectedRoute from '@/components/ProtectedRoute';

function SpecialtiesPageContent() {
    return (
        <div className="container mx-auto px-4 py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Gestion des Spécialités</CardTitle>
                    <CardDescription>
                        Ajoutez, modifiez ou supprimez les spécialités chirurgicales disponibles dans l'application.
                        Cochez la case "Pédiatrique" pour les spécialités spécifiques aux enfants.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SpecialtyManager />
                </CardContent>
            </Card>
        </div>
    );
}

export default function ManageSpecialtiesPage() {
    return (
        <ProtectedRoute allowedRoles={['ADMIN_TOTAL', 'ADMIN_PARTIEL']}>
            <SpecialtiesPageContent />
        </ProtectedRoute>
    );
} 