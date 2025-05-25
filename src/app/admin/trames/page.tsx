'use client';

import React from 'react';
import { TrameAffectation, Affectation } from '@/components/trames/TrameAffectation';
import { toast } from 'sonner';

export default function TramesPage() {
    const handleSaveTrame = async (trames: Affectation[]) => {
        try {
            // Import dynamique pour éviter les problèmes de build avec Sequelize
            const { TrameAffectationService } = await import('@/services/trameAffectationService');

            for (const trame of trames) {
                await TrameAffectationService.create({
                    userId: trame.userId,
                    periodeType: trame.periodeType,
                    dateDebut: trame.dateDebut,
                    dateFin: trame.dateFin,
                    motif: trame.motif,
                    isRecurrent: trame.isRecurrent,
                });
            }
            toast.success('Trames d\'affectation sauvegardées avec succès');
        } catch (error) {
            toast.error('Erreur lors de la sauvegarde des trames d\'affectation');
            console.error(error);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Gestion des trames d'affectation</h1>
            <TrameAffectation onSave={handleSaveTrame} />
        </div>
    );
} 