import React, { useState, useCallback, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import { useProfiler, ProfilerReport, MetricType } from '../';
import Button from '@/components/ui/button';

/**
 * Composant d'exemple pour démontrer l'utilisation du profileur
 */
export const ProfilerExample: React.FC = () => {
    const [count, setCount] = useState(0);
    const [showReport, setShowReport] = useState(false);

    // Utiliser le hook de profilage
    const {
        startProfiling,
        stopProfiling,
        isActive,
        measureFunction,
        measure,
        getLastReport
    } = useProfiler('ProfilerExample');

    // Un exemple de fonction coûteuse
    const heavyCalculation = useCallback((n: number) => {
        let result = 0;
        for (let i = 0; i < n * 100000; i++) {
            result += Math.sin(i) * Math.cos(i);
        }
        return result;
    }, []);

    // Envelopper la fonction coûteuse avec le profileur
    const profiledHeavyCalculation = measureFunction(
        heavyCalculation,
        'heavyCalculation',
        MetricType.COMPONENT_RENDER
    );

    // Gérer le début/fin du profilage
    const handleToggleProfiling = () => {
        if (isActive) {
            stopProfiling();
            setShowReport(true);
        } else {
            startProfiling();
            setShowReport(false);
        }
    };

    // Exécuter un calcul coûteux lors d'un clic
    const handleHeavyOperation = () => {
        // Utiliser la fonction profilée
        const result = profiledHeavyCalculation(count);
        logger.info('Résultat du calcul:', result);
        setCount(count + 1);
    };

    // Exemple de profilage ponctuel avec la fonction measure
    const handleMeasuredOperation = () => {
        const endMeasure = measure('ponctualOperation', MetricType.COMPONENT_RENDER);

        // Simuler une opération qui prend du temps
        setTimeout(() => {
            endMeasure(); // Terminer la mesure
            setCount(prev => prev + 5);
        }, 500);
    };

    // Simuler une opération périodique pour le profilage
    useEffect(() => {
        if (isActive) {
            const interval = setInterval(() => {
                const endMeasure = measure('periodicOperation', MetricType.COMPONENT_RENDER);

                // Simuler un traitement
                const result = Math.random() * 1000;

                endMeasure();

                logger.info('Opération périodique:', result);
            }, 2000);

            return () => clearInterval(interval);
        }
    }, [isActive, measure]);

    // Obtenir le rapport
    const report = getLastReport();

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h1 className="text-2xl font-bold mb-4">Exemple de Profilage</h1>

                <div className="mb-6">
                    <p className="mb-2">
                        Compteur: <span className="font-bold">{count}</span>
                    </p>

                    <div className="flex space-x-4 mb-4">
                        <Button
                            onClick={handleToggleProfiling}
                            className={isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
                        >
                            {isActive ? 'Arrêter le profilage' : 'Démarrer le profilage'}
                        </Button>

                        <Button
                            onClick={handleHeavyOperation}
                            disabled={!isActive}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300"
                        >
                            Exécuter calcul lourd
                        </Button>

                        <Button
                            onClick={handleMeasuredOperation}
                            disabled={!isActive}
                            className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300"
                        >
                            Opération ponctuelle
                        </Button>
                    </div>

                    {isActive && (
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
                            <p className="text-yellow-700">
                                Profilage actif - Effectuez plusieurs actions pour collecter des métriques
                            </p>
                        </div>
                    )}
                </div>

                {!isActive && showReport && report && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Rapport de Profilage</h2>
                        <ProfilerReport report={report} />
                    </div>
                )}
            </div>
        </div>
    );
}; 