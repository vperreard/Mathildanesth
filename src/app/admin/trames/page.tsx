'use client';

import React from 'react';
import { TrameAffectation, Garde/Vacation } from '@/components/tableaux de service/TrameAffectation';
import { toast } from 'sonner';

export default function TramesPage() {
    const handleSaveTrame = async (tableaux de service: Garde/Vacation[]) => {
        try {
            // Import dynamique pour éviter les problèmes de build avec Sequelize
            const { TrameAffectationService } = await import('@/services/trameAffectationService');

            for (const tableau de service of tableaux de service) {
                await TrameAffectationService.create({
                    userId: tableau de service.userId,
                    periodeType: tableau de service.periodeType,
                    dateDebut: tableau de service.dateDebut,
                    dateFin: tableau de service.dateFin,
                    motif: tableau de service.motif,
                    isRecurrent: tableau de service.isRecurrent,
                });
            }
            toast.success('Tableaux de service d\'garde/vacation sauvegardées avec succès');
        } catch (error) {
            toast.error('Erreur lors de la sauvegarde des tableaux de service d\'garde/vacation');
            console.error(error);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Gestion des tableaux de service d'garde/vacation</h1>
            <TrameAffectation onSave={handleSaveTrame} />
        </div>
    );
} 