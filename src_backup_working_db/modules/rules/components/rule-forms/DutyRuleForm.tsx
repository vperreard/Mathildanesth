import React, { useState, useEffect } from 'react';
import { AnyRule, DutyRule, RuleType } from '../../types/rule';

interface DutyRuleFormProps {
    rule: Partial<AnyRule>;
    onChange: (rule: Partial<AnyRule>) => void;
}

export const DutyRuleForm: React.FC<DutyRuleFormProps> = ({ rule, onChange }) => {
    // État local pour la configuration de garde
    const [dutyConfig, setDutyConfig] = useState<DutyRule['dutyConfig']>(
        (rule as Partial<DutyRule>).dutyConfig || {
            minPersonnel: 1,
            maxConsecutiveDays: 2,
            minRestPeriodAfterDuty: 24,
            dutyPeriods: [],
            specificRoles: [],
            rotationStrategy: 'SEQUENTIAL'
        }
    );

    // Mettre à jour la configuration dans le parent lorsqu'elle change
    useEffect(() => {
        onChange({
            ...rule,
            type: RuleType.DUTY,
            dutyConfig
        } as Partial<DutyRule>);
    }, [dutyConfig, rule, onChange]);

    // Gérer les changements de champs simples
    const handleChange = (field: keyof DutyRule['dutyConfig'], value: any) => {
        setDutyConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Gérer les changements de personnel minimum
    const handlePersonnelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            handleChange('minPersonnel', value);
        }
    };

    // Gérer les changements de jours consécutifs maximum
    const handleConsecutiveDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            handleChange('maxConsecutiveDays', value);
        }
    };

    // Gérer les changements de période de repos
    const handleRestPeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value >= 0) {
            handleChange('minRestPeriodAfterDuty', value);
        }
    };

    // Gérer les changements de stratégie de rotation
    const handleRotationStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        handleChange('rotationStrategy', e.target.value);
    };

    // Ajouter un rôle spécifique
    const handleAddRole = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            e.preventDefault();
            const newRole = e.currentTarget.value.trim();
            if (!dutyConfig.specificRoles?.includes(newRole)) {
                handleChange('specificRoles', [...(dutyConfig.specificRoles || []), newRole]);
                e.currentTarget.value = '';
            }
        }
    };

    // Supprimer un rôle spécifique
    const handleRemoveRole = (roleToRemove: string) => {
        handleChange(
            'specificRoles',
            dutyConfig.specificRoles?.filter(role => role !== roleToRemove) || []
        );
    };

    // Ajouter une période de garde
    const handleAddDutyPeriod = () => {
        handleChange('dutyPeriods', [
            ...(dutyConfig.dutyPeriods || []),
            { dayOfWeek: 1, startTime: '08:00', endTime: '20:00' }
        ]);
    };

    // Mettre à jour une période de garde
    const handleUpdateDutyPeriod = (index: number, field: string, value: any) => {
        const updatedPeriods = [...(dutyConfig.dutyPeriods || [])];
        updatedPeriods[index] = { ...updatedPeriods[index], [field]: value };
        handleChange('dutyPeriods', updatedPeriods);
    };

    // Supprimer une période de garde
    const handleRemoveDutyPeriod = (index: number) => {
        const updatedPeriods = [...(dutyConfig.dutyPeriods || [])];
        updatedPeriods.splice(index, 1);
        handleChange('dutyPeriods', updatedPeriods);
    };

    // Obtenir le nom du jour de la semaine
    const getDayName = (dayOfWeek: number): string => {
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return days[dayOfWeek % 7];
    };

    return (
        <div className="space-y-6">
            {/* Nombre minimum de personnel */}
            <div>
                <label htmlFor="min-personnel" className="block text-sm font-medium text-gray-700">
                    Personnel minimum requis
                </label>
                <div className="mt-1">
                    <input
                        type="number"
                        id="min-personnel"
                        min="1"
                        value={dutyConfig.minPersonnel}
                        onChange={handlePersonnelChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Nombre minimum de personnes requises pour assurer la garde
                </p>
            </div>

            {/* Jours consécutifs maximum */}
            <div>
                <label htmlFor="max-consecutive-days" className="block text-sm font-medium text-gray-700">
                    Jours consécutifs maximum
                </label>
                <div className="mt-1">
                    <input
                        type="number"
                        id="max-consecutive-days"
                        min="1"
                        value={dutyConfig.maxConsecutiveDays}
                        onChange={handleConsecutiveDaysChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Nombre maximum de jours consécutifs de garde autorisés
                </p>
            </div>

            {/* Période de repos minimum */}
            <div>
                <label htmlFor="min-rest-period" className="block text-sm font-medium text-gray-700">
                    Repos minimum après garde (heures)
                </label>
                <div className="mt-1">
                    <input
                        type="number"
                        id="min-rest-period"
                        min="0"
                        value={dutyConfig.minRestPeriodAfterDuty}
                        onChange={handleRestPeriodChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Durée minimale de repos requise après une garde (en heures)
                </p>
            </div>

            {/* Stratégie de rotation */}
            <div>
                <label htmlFor="rotation-strategy" className="block text-sm font-medium text-gray-700">
                    Stratégie de rotation
                </label>
                <div className="mt-1">
                    <select
                        id="rotation-strategy"
                        value={dutyConfig.rotationStrategy || 'SEQUENTIAL'}
                        onChange={handleRotationStrategyChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="SEQUENTIAL">Séquentielle</option>
                        <option value="BALANCED">Équilibrée</option>
                        <option value="CUSTOM">Personnalisée</option>
                    </select>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Comment les gardes sont attribuées aux membres du personnel
                </p>
            </div>

            {/* Rôles spécifiques */}
            <div>
                <label htmlFor="specific-roles" className="block text-sm font-medium text-gray-700">
                    Rôles spécifiques requis
                </label>
                <div className="mt-1">
                    <input
                        type="text"
                        id="specific-roles"
                        placeholder="Appuyez sur Entrée pour ajouter un rôle"
                        onKeyDown={handleAddRole}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                {dutyConfig.specificRoles && dutyConfig.specificRoles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {dutyConfig.specificRoles.map((role, index) => (
                            <div
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                                {role}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveRole(role)}
                                    className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-400 hover:text-blue-700 focus:outline-none"
                                >
                                    <span className="sr-only">Supprimer {role}</span>
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                    Rôles spécifiques nécessaires pour cette garde
                </p>
            </div>

            {/* Périodes de garde */}
            <div>
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                        Périodes de garde
                    </label>
                    <button
                        type="button"
                        onClick={handleAddDutyPeriod}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Ajouter une période
                    </button>
                </div>
                <div className="mt-2 space-y-4">
                    {dutyConfig.dutyPeriods && dutyConfig.dutyPeriods.length > 0 ? (
                        dutyConfig.dutyPeriods.map((period, index) => (
                            <div key={index} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md">
                                <div className="flex-grow">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label htmlFor={`day-of-week-${index}`} className="block text-xs font-medium text-gray-500">
                                                Jour
                                            </label>
                                            <select
                                                id={`day-of-week-${index}`}
                                                value={period.dayOfWeek}
                                                onChange={(e) => handleUpdateDutyPeriod(index, 'dayOfWeek', parseInt(e.target.value))}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            >
                                                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                                                    <option key={day} value={day}>
                                                        {getDayName(day)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor={`start-time-${index}`} className="block text-xs font-medium text-gray-500">
                                                Début
                                            </label>
                                            <input
                                                type="time"
                                                id={`start-time-${index}`}
                                                value={period.startTime}
                                                onChange={(e) => handleUpdateDutyPeriod(index, 'startTime', e.target.value)}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor={`end-time-${index}`} className="block text-xs font-medium text-gray-500">
                                                Fin
                                            </label>
                                            <input
                                                type="time"
                                                id={`end-time-${index}`}
                                                value={period.endTime}
                                                onChange={(e) => handleUpdateDutyPeriod(index, 'endTime', e.target.value)}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveDutyPeriod(index)}
                                        className="inline-flex items-center p-1.5 border border-transparent rounded-full text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        <span className="sr-only">Supprimer cette période</span>
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-sm text-gray-500 italic">
                            Aucune période de garde définie. Cliquez sur "Ajouter une période" pour en créer une.
                        </div>
                    )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Définissez les jours et heures de garde
                </p>
            </div>
        </div>
    );
}; 