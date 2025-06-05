'use client';

import React from 'react';
import { logger } from "../../../lib/logger";
import { TrameAffectation, GardeVacation } from '@/components/trames/TrameAffectation';
import { toast } from 'sonner';

export default function TramesPage() {
    const handleSaveTrame = async (trames: GardeVacation[]) => {
        try {
            // Import dynamique pour éviter les problèmes de build avec Sequelize
            const { TrameAffectationService } = await import('@/services/trameAffectationService');

            for (const trameModele of trameModeles) {
                await TrameAffectationService.create({
                    userId: trameModele.userId,
                    periodeType: trameModele.periodeType,
                    dateDebut: trameModele.dateDebut,
                    dateFin: trameModele.dateFin,
                    motif: trameModele.motif,
                    isRecurrent: trameModele.isRecurrent,
                });
            }
            toast.success('TrameModeles d\'affectation sauvegardées avec succès');
        } catch (error: unknown) {
            toast.error('Erreur lors de la sauvegarde des trameModeles d\'affectation');
            logger.error(error);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Gestion des trameModeles d'affectation</h1>
            <TrameAffectation onSave={handleSaveTrame} />
        </div>
    );
} 