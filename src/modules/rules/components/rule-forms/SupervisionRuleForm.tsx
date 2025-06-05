import React, { useState, useEffect } from 'react';
import { AnyRule, SupervisionRule, RuleType } from '../../types/rule';

interface SupervisionRuleFormProps {
    rule: Partial<AnyRule>;
    onChange: (rule: Partial<AnyRule>) => void;
}

export const SupervisionRuleForm: React.FC<SupervisionRuleFormProps> = ({ rule, onChange }) => {
    // État local pour la configuration de supervision
    const [supervisionConfig, setSupervisionConfig] = useState<SupervisionRule['supervisionConfig']>(
        (rule as Partial<SupervisionRule>).supervisionConfig || {
            supervisorRoles: [],
            superviseeRoles: [],
            maxSuperviseesPerSupervisor: 3,
            minExperienceYearsToSupervise: 5,
            supervisionPeriods: [],
            specialtyRestrictions: [],
            locationRestrictions: []
        }
    );

    // Mettre à jour la configuration dans le parent lorsqu'elle change
    useEffect(() => {
        onChange({
            ...rule,
            type: RuleType.SUPERVISION,
            supervisionConfig
        } as Partial<SupervisionRule>);
    }, [supervisionConfig, rule, onChange]);

    // Gérer les changements de champs simples
    const handleChange = (field: keyof SupervisionRule['supervisionConfig'], value: unknown) => {
        setSupervisionConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Gérer les changements de nombre maximum de supervisés
    const handleMaxSuperviseesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            handleChange('maxSuperviseesPerSupervisor', value);
        }
    };

    // Gérer les changements d'années d'expérience minimales
    const handleExperienceYearsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value >= 0) {
            handleChange('minExperienceYearsToSupervise', value);
        }
    };

    // --- Gestion des rôles de superviseur ---

    // Ajouter un rôle de superviseur
    const handleAddSupervisorRole = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            e.preventDefault();
            const newRole = e.currentTarget.value.trim();
            if (!supervisionConfig.supervisorRoles.includes(newRole)) {
                handleChange('supervisorRoles', [...supervisionConfig.supervisorRoles, newRole]);
                e.currentTarget.value = '';
            }
        }
    };

    // Supprimer un rôle de superviseur
    const handleRemoveSupervisorRole = (roleToRemove: string) => {
        handleChange(
            'supervisorRoles',
            supervisionConfig.supervisorRoles.filter(role => role !== roleToRemove)
        );
    };

    // --- Gestion des rôles de supervisé ---

    // Ajouter un rôle de supervisé
    const handleAddSuperviseeRole = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            e.preventDefault();
            const newRole = e.currentTarget.value.trim();
            if (!supervisionConfig.superviseeRoles.includes(newRole)) {
                handleChange('superviseeRoles', [...supervisionConfig.superviseeRoles, newRole]);
                e.currentTarget.value = '';
            }
        }
    };

    // Supprimer un rôle de supervisé
    const handleRemoveSuperviseeRole = (roleToRemove: string) => {
        handleChange(
            'superviseeRoles',
            supervisionConfig.superviseeRoles.filter(role => role !== roleToRemove)
        );
    };

    // --- Gestion des restrictions de spécialité ---

    // Ajouter une restriction de spécialité
    const handleAddSpecialtyRestriction = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            e.preventDefault();
            const newSpecialty = e.currentTarget.value.trim();
            if (!supervisionConfig.specialtyRestrictions?.includes(newSpecialty)) {
                handleChange('specialtyRestrictions',
                    [...(supervisionConfig.specialtyRestrictions || []), newSpecialty]);
                e.currentTarget.value = '';
            }
        }
    };

    // Supprimer une restriction de spécialité
    const handleRemoveSpecialtyRestriction = (specialtyToRemove: string) => {
        handleChange(
            'specialtyRestrictions',
            supervisionConfig.specialtyRestrictions?.filter(specialty => specialty !== specialtyToRemove) || []
        );
    };

    // --- Gestion des restrictions de lieu ---

    // Ajouter une restriction de lieu
    const handleAddLocationRestriction = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
            e.preventDefault();
            const newLocation = e.currentTarget.value.trim();
            if (!supervisionConfig.locationRestrictions?.includes(newLocation)) {
                handleChange('locationRestrictions',
                    [...(supervisionConfig.locationRestrictions || []), newLocation]);
                e.currentTarget.value = '';
            }
        }
    };

    // Supprimer une restriction de lieu
    const handleRemoveLocationRestriction = (locationToRemove: string) => {
        handleChange(
            'locationRestrictions',
            supervisionConfig.locationRestrictions?.filter(location => location !== locationToRemove) || []
        );
    };

    // --- Gestion des périodes de supervision ---

    // Ajouter une période de supervision
    const handleAddSupervisionPeriod = () => {
        handleChange('supervisionPeriods', [
            ...(supervisionConfig.supervisionPeriods || []),
            { dayOfWeek: 1, startTime: '08:00', endTime: '17:00' }
        ]);
    };

    // Mettre à jour une période de supervision
    const handleUpdateSupervisionPeriod = (index: number, field: string, value: unknown) => {
        const updatedPeriods = [...(supervisionConfig.supervisionPeriods || [])];
        updatedPeriods[index] = { ...updatedPeriods[index], [field]: value };
        handleChange('supervisionPeriods', updatedPeriods);
    };

    // Supprimer une période de supervision
    const handleRemoveSupervisionPeriod = (index: number) => {
        const updatedPeriods = [...(supervisionConfig.supervisionPeriods || [])];
        updatedPeriods.splice(index, 1);
        handleChange('supervisionPeriods', updatedPeriods);
    };

    // Obtenir le nom du jour de la semaine
    const getDayName = (dayOfWeek: number): string => {
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return days[dayOfWeek % 7];
    };

    return (
        <div className="space-y-6">
            {/* Rôles pouvant superviser */}
            <div>
                <label htmlFor="supervisor-roles" className="block text-sm font-medium text-gray-700">
                    Rôles pouvant superviser
                </label>
                <div className="mt-1">
                    <input
                        type="text"
                        id="supervisor-roles"
                        placeholder="Appuyez sur Entrée pour ajouter un rôle"
                        onKeyDown={handleAddSupervisorRole}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                {supervisionConfig.supervisorRoles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {supervisionConfig.supervisorRoles.map((role, index) => (
                            <div
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            >
                                {role}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSupervisorRole(role)}
                                    className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-green-400 hover:text-green-700 focus:outline-none"
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
                    Les rôles qui sont autorisés à superviser d'autres professionnels
                </p>
            </div>

            {/* Rôles pouvant être supervisés */}
            <div>
                <label htmlFor="supervisee-roles" className="block text-sm font-medium text-gray-700">
                    Rôles pouvant être supervisés
                </label>
                <div className="mt-1">
                    <input
                        type="text"
                        id="supervisee-roles"
                        placeholder="Appuyez sur Entrée pour ajouter un rôle"
                        onKeyDown={handleAddSuperviseeRole}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                {supervisionConfig.superviseeRoles.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {supervisionConfig.superviseeRoles.map((role, index) => (
                            <div
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                                {role}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSuperviseeRole(role)}
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
                    Les rôles qui doivent être supervisés
                </p>
            </div>

            {/* Nombre maximum de supervisés par superviseur */}
            <div>
                <label htmlFor="max-supervisees" className="block text-sm font-medium text-gray-700">
                    Nombre maximum de supervisés par superviseur
                </label>
                <div className="mt-1">
                    <input
                        type="number"
                        id="max-supervisees"
                        min="1"
                        value={supervisionConfig.maxSuperviseesPerSupervisor}
                        onChange={handleMaxSuperviseesChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Le nombre maximum de personnes qu'un superviseur peut superviser simultanément
                </p>
            </div>

            {/* Années d'expérience minimales pour superviser */}
            <div>
                <label htmlFor="min-experience" className="block text-sm font-medium text-gray-700">
                    Années d'expérience minimales pour superviser
                </label>
                <div className="mt-1">
                    <input
                        type="number"
                        id="min-experience"
                        min="0"
                        value={supervisionConfig.minExperienceYearsToSupervise}
                        onChange={handleExperienceYearsChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Nombre d'années d'expérience requises pour pouvoir superviser
                </p>
            </div>

            {/* Restrictions par spécialité */}
            <div>
                <label htmlFor="specialty-restrictions" className="block text-sm font-medium text-gray-700">
                    Restrictions par spécialité
                </label>
                <div className="mt-1">
                    <input
                        type="text"
                        id="specialty-restrictions"
                        placeholder="Appuyez sur Entrée pour ajouter une spécialité"
                        onKeyDown={handleAddSpecialtyRestriction}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                {supervisionConfig.specialtyRestrictions && supervisionConfig.specialtyRestrictions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {supervisionConfig.specialtyRestrictions.map((specialty, index) => (
                            <div
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                            >
                                {specialty}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSpecialtyRestriction(specialty)}
                                    className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-purple-400 hover:text-purple-700 focus:outline-none"
                                >
                                    <span className="sr-only">Supprimer {specialty}</span>
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                    Les spécialités concernées par cette règle de supervision
                </p>
            </div>

            {/* Restrictions par lieu */}
            <div>
                <label htmlFor="location-restrictions" className="block text-sm font-medium text-gray-700">
                    Restrictions par lieu
                </label>
                <div className="mt-1">
                    <input
                        type="text"
                        id="location-restrictions"
                        placeholder="Appuyez sur Entrée pour ajouter un lieu"
                        onKeyDown={handleAddLocationRestriction}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                {supervisionConfig.locationRestrictions && supervisionConfig.locationRestrictions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {supervisionConfig.locationRestrictions.map((location, index) => (
                            <div
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                            >
                                {location}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveLocationRestriction(location)}
                                    className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-yellow-400 hover:text-yellow-700 focus:outline-none"
                                >
                                    <span className="sr-only">Supprimer {location}</span>
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                    Les lieux où cette règle de supervision s'applique
                </p>
            </div>

            {/* Périodes de supervision */}
            <div>
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                        Périodes de supervision
                    </label>
                    <button
                        type="button"
                        onClick={handleAddSupervisionPeriod}
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Ajouter une période
                    </button>
                </div>
                <div className="mt-2 space-y-4">
                    {supervisionConfig.supervisionPeriods && supervisionConfig.supervisionPeriods.length > 0 ? (
                        supervisionConfig.supervisionPeriods.map((period, index) => (
                            <div key={index} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md">
                                <div className="flex-grow">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label htmlFor={`supervision-day-${index}`} className="block text-xs font-medium text-gray-500">
                                                Jour
                                            </label>
                                            <select
                                                id={`supervision-day-${index}`}
                                                value={period.dayOfWeek}
                                                onChange={(e) => handleUpdateSupervisionPeriod(index, 'dayOfWeek', parseInt(e.target.value))}
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
                                            <label htmlFor={`supervision-start-${index}`} className="block text-xs font-medium text-gray-500">
                                                Début
                                            </label>
                                            <input
                                                type="time"
                                                id={`supervision-start-${index}`}
                                                value={period.startTime}
                                                onChange={(e) => handleUpdateSupervisionPeriod(index, 'startTime', e.target.value)}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor={`supervision-end-${index}`} className="block text-xs font-medium text-gray-500">
                                                Fin
                                            </label>
                                            <input
                                                type="time"
                                                id={`supervision-end-${index}`}
                                                value={period.endTime}
                                                onChange={(e) => handleUpdateSupervisionPeriod(index, 'endTime', e.target.value)}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSupervisionPeriod(index)}
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
                            Aucune période de supervision définie. La supervision s'applique à tout moment si aucune période n'est spécifiée.
                        </div>
                    )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    Définissez les jours et heures pendant lesquels la supervision est requise
                </p>
            </div>
        </div>
    );
}; 