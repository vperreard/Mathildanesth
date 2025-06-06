'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { logger } from "../../../../lib/logger";
import FatigueSettingsForm, { FatigueConfig } from './FatigueSettingsForm';
// Chemin relatif corrigé pour pointer vers config/seed-config.js à la racine
import { planningRules } from '../../../../../config/seed-config.js';
import { toast } from 'react-hot-toast';

// Structure de config par défaut minimale si l'import échoue
const fallbackDefaultConfig: FatigueConfig = {
    enabled: false,
    points: { garde: 30, astreinte: 10, supervisionMultiple: 15, pediatrie: 10, specialiteLourde: 8 },
    recovery: { jourOff: -20, weekendOff: -30, demiJourneeOff: -10 }, // Utiliser valeurs négatives ici?
    thresholds: { alert: 80, critical: 120 },
    weighting: { equity: 0.6, fatigue: 0.4 }
};

// Appels API réels
const fetchFatigueConfig = async (): Promise<FatigueConfig> => {
    logger.info("API Call: Fetching fatigue config...");
    try {
        const response = await fetch('http://localhost:3000/api/admin/parametres/fatigue'); // Appel API GET
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const config = await response.json();
        logger.info("Fetched fatigue config from API", config);
        return config;
    } catch (error: unknown) {
        logger.error("Error fetching fatigue config from API:", { error: error });
        toast.error("Impossible de charger la configuration de fatigue depuis le serveur.");
        // Retourner le fallback en cas d'erreur API majeure
        return fallbackDefaultConfig;
    }
};

const saveFatigueConfig = async (config: FatigueConfig): Promise<void> => {
    logger.info("API Call: Saving fatigue config...", config);
    try {
        const response = await fetch('http://localhost:3000/api/admin/parametres/fatigue', { // Appel API PUT
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(config),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        logger.info("Save response:", result);
        // Pas besoin de sauvegarder en localStorage maintenant
    } catch (error: unknown) {
        logger.error("Error saving fatigue config via API:", { error: error });
        // L'erreur sera catchée dans handleSave et affichée par le toast du formulaire
        throw error; // Renvoyer l'erreur pour que handleSave la traite
    }
};

export default function FatigueSettingsPage() {
    const [config, setConfig] = useState<FatigueConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const loadConfig = useCallback(async () => {
        setIsLoading(true);
        const fetchedConfig = await fetchFatigueConfig();
        setConfig(fetchedConfig);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const handleSave = async (newConfig: FatigueConfig) => {
        setIsSaving(true);
        try {
            await saveFatigueConfig(newConfig);
            setConfig(newConfig); // Met à jour l'état local après succès API
            // Le toast de succès est déjà dans le composant Form
        } catch (error: unknown) {
            // Le toast d'erreur est déjà géré dans le composant Form
            logger.error("Handle save error (page level):", { error: error });
            // Optionnel : recharger la config depuis le serveur pour annuler les changements locaux ?
            // loadConfig();
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading || !config) {
        // Amélioration de l'affichage de chargement
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <p className="text-lg font-semibold">Chargement de la configuration...</p>
                    {/* Ajouter un spinner ici si disponible */}
                </div>
            </div>
        );
    }


    return (
        <div className="container mx-auto p-4 md:p-6">
            <h1 className="text-2xl font-semibold mb-6">Paramètres du Système de Fatigue</h1>
            {config ? (
                <FatigueSettingsForm
                    initialConfig={config} // Passer la config chargée
                    onSave={handleSave}
                    isLoading={isSaving}
                />
            ) : (
                // Gérer le cas où config est null même après chargement (ne devrait pas arriver avec le fallback)
                <p className="text-red-500">Erreur: Impossible d'afficher le formulaire de configuration.</p>
            )}
        </div>
    );
} 