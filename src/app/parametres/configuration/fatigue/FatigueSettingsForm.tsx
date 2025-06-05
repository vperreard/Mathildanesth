import React, { useState, useEffect } from 'react';
import { logger } from "../../../../lib/logger";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Input from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import Button from '@/components/ui/button';
import { toast } from 'react-hot-toast';

// Type pour la configuration de la fatigue (basé sur seed-config.js)
export interface FatigueConfig {
    enabled: boolean;
    points: {
        garde: number;
        astreinte: number;
        supervisionMultiple: number;
        pediatrie: number;
        specialiteLourde: number;
    };
    recovery: {
        jourOff: number;
        weekendOff: number;
        demiJourneeOff: number;
    };
    thresholds: {
        alert: number;
        critical: number;
    };
    weighting: {
        equity: number;
        fatigue: number;
    };
}

interface FatigueSettingsFormProps {
    initialConfig: FatigueConfig;
    onSave: (config: FatigueConfig) => Promise<void>;
    isLoading: boolean;
}

const FatigueSettingsForm: React.FC<FatigueSettingsFormProps> = ({ initialConfig, onSave, isLoading }) => {
    const [config, setConfig] = useState<FatigueConfig>(initialConfig);

    useEffect(() => {
        setConfig(initialConfig);
    }, [initialConfig]);

    const handlePointsChange = (category: 'points' | 'recovery' | 'thresholds', key: string, value: string) => {
        const numericValue = parseInt(value, 10);
        if (!isNaN(numericValue)) {
            setConfig(prevConfig => ({
                ...prevConfig,
                [category]: {
                    ...prevConfig[category],
                    [key]: numericValue,
                },
            }));
        }
    };

    const handleWeightingChange = (key: 'equity' | 'fatigue', value: string) => {
        let numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
            numericValue = Math.max(0, Math.min(1, numericValue));
            const otherKey = key === 'equity' ? 'fatigue' : 'equity';
            const otherValue = 1 - numericValue;

            setConfig(prevConfig => ({
                ...prevConfig,
                weighting: {
                    ...prevConfig.weighting,
                    [key]: numericValue,
                    [otherKey]: parseFloat(otherValue.toFixed(2))
                },
            }));
        }
    };

    const handleEnabledChange = (enabled: boolean) => {
        setConfig(prevConfig => ({
            ...prevConfig,
            enabled,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (Math.abs(config.weighting.equity + config.weighting.fatigue - 1) > 0.001) {
            toast.error("La somme des pondérations Équité et Fatigue doit être égale à 1.");
            return;
        }
        try {
            await onSave(config);
            toast.success('Paramètres de fatigue sauvegardés.');
        } catch (error: unknown) {
            toast.error("Erreur lors de la sauvegarde des paramètres.");
            logger.error("Save fatigue settings error:", error instanceof Error ? error : new Error(String(error)));
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Configuration du Système de Fatigue</CardTitle>
                    <CardDescription>
                        Activez et configurez les points de fatigue, les seuils d'alerte et la pondération pour l'optimisation du planning.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={config.enabled}
                            onCheckedChange={handleEnabledChange}
                        />
                        <Label htmlFor="fatigue-enabled">Activer le système de gestion de la fatigue</Label>
                    </div>

                    {config.enabled && (
                        <>
                            {/* Section Points d'affectation */}
                            <Card className="pt-4">
                                <CardHeader className="p-4">
                                    <CardTitle className="text-lg">Points par Affectation</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-4">
                                    {(Object.keys(config.points) as Array<keyof FatigueConfig['points']>).map((key) => (
                                        <div key={key} className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor={`points-${key}`} className="capitalize">
                                                {key.replace(/([A-Z])/g, ' $1')}
                                            </Label>
                                            <Input
                                                id={`points-${key}`}
                                                type="number"
                                                value={config.points[key]}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePointsChange('points', key, e.target.value)}
                                                className="col-span-2"
                                            />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Section Points de récupération */}
                            <Card className="pt-4">
                                <CardHeader className="p-4">
                                    <CardTitle className="text-lg">Points de Récupération</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-4">
                                    {(Object.keys(config.recovery) as Array<keyof FatigueConfig['recovery']>).map((key) => (
                                        <div key={key} className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor={`recovery-${key}`} className="capitalize">
                                                {key.replace(/([A-Z])/g, ' $1')}
                                            </Label>
                                            <Input
                                                id={`recovery-${key}`}
                                                type="number"
                                                value={config.recovery[key]}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePointsChange('recovery', key, e.target.value)}
                                                className="col-span-2"
                                                min="0"
                                            />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Section Seuils */}
                            <Card className="pt-4">
                                <CardHeader className="p-4">
                                    <CardTitle className="text-lg">Seuils de Fatigue</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-4">
                                    {(Object.keys(config.thresholds) as Array<keyof FatigueConfig['thresholds']>).map((key) => (
                                        <div key={key} className="grid grid-cols-3 items-center gap-4">
                                            <Label htmlFor={`thresholds-${key}`} className="capitalize">
                                                {key.replace(/([A-Z])/g, ' $1')}
                                            </Label>
                                            <Input
                                                id={`thresholds-${key}`}
                                                type="number"
                                                value={config.thresholds[key]}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePointsChange('thresholds', key, e.target.value)}
                                                className="col-span-2"
                                                min="0"
                                            />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Section Pondération */}
                            <Card className="pt-4">
                                <CardHeader className="p-4">
                                    <CardTitle className="text-lg">Pondération (Optimisation)</CardTitle>
                                    <CardDescription>Définit l'importance relative de l'équité vs la fatigue lors de la génération (somme doit être 1).</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 p-4">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="weighting-equity">Équité</Label>
                                        <Input
                                            id="weighting-equity"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="1"
                                            value={config.weighting.equity}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleWeightingChange('equity', e.target.value)}
                                            className="col-span-2"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="weighting-fatigue">Fatigue</Label>
                                        <Input
                                            id="weighting-fatigue"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="1"
                                            value={config.weighting.fatigue}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleWeightingChange('fatigue', e.target.value)}
                                            className="col-span-2"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
};

export default FatigueSettingsForm; 