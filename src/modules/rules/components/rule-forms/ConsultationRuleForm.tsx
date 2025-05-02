import React from 'react';
import { Rule } from '../../types/rule';

interface ConsultationRuleFormProps {
    rule: Partial<Rule>;
    onChange: (updatedRule: Partial<Rule>) => void;
}

export const ConsultationRuleForm: React.FC<ConsultationRuleFormProps> = ({ rule, onChange }) => {
    // Gérer les changements des champs spécifiques
    const handleFieldChange = (field: string, value: any) => {
        const updatedRule = { ...rule };

        // Mettre à jour le champ spécifique dans le bon sous-objet
        if (!updatedRule.parameters) {
            updatedRule.parameters = {};
        }

        updatedRule.parameters[field] = value;

        onChange(updatedRule);
    };

    return (
        <div className="space-y-6">
            <h3 className="text-md font-medium text-gray-700">
                Paramètres spécifiques aux consultations
            </h3>

            {/* Durée minimum */}
            <div>
                <label htmlFor="min-duration" className="block text-sm font-medium text-gray-700 mb-1">
                    Durée minimum (minutes)
                </label>
                <input
                    id="min-duration"
                    type="number"
                    min="5"
                    step="5"
                    value={rule.parameters?.minDuration || 15}
                    onChange={(e) => handleFieldChange('minDuration', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Durée maximum */}
            <div>
                <label htmlFor="max-duration" className="block text-sm font-medium text-gray-700 mb-1">
                    Durée maximum (minutes)
                </label>
                <input
                    id="max-duration"
                    type="number"
                    min="5"
                    step="5"
                    value={rule.parameters?.maxDuration || 120}
                    onChange={(e) => handleFieldChange('maxDuration', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Pause entre consultations */}
            <div>
                <label htmlFor="break-duration" className="block text-sm font-medium text-gray-700 mb-1">
                    Pause entre consultations (minutes)
                </label>
                <input
                    id="break-duration"
                    type="number"
                    min="0"
                    step="5"
                    value={rule.parameters?.breakDuration || 10}
                    onChange={(e) => handleFieldChange('breakDuration', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Type de consultations autorisées */}
            <div>
                <label htmlFor="consultation-types" className="block text-sm font-medium text-gray-700 mb-1">
                    Types de consultations autorisées
                </label>
                <select
                    id="consultation-types"
                    multiple
                    value={rule.parameters?.allowedConsultationTypes || []}
                    onChange={(e) => {
                        const options = e.target.options;
                        const value: string[] = [];
                        for (let i = 0; i < options.length; i++) {
                            if (options[i].selected) {
                                value.push(options[i].value);
                            }
                        }
                        handleFieldChange('allowedConsultationTypes', value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    size={4}
                >
                    <option value="STANDARD">Consultation standard</option>
                    <option value="FIRST_VISIT">Première visite</option>
                    <option value="FOLLOW_UP">Suivi</option>
                    <option value="URGENT">Urgence</option>
                    <option value="PRE_OP">Pré-opératoire</option>
                    <option value="POST_OP">Post-opératoire</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Maintenez la touche Ctrl pour sélectionner plusieurs options</p>
            </div>

            {/* Nombre maximum de consultations par jour */}
            <div>
                <label htmlFor="max-per-day" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre maximum de consultations par jour
                </label>
                <input
                    id="max-per-day"
                    type="number"
                    min="1"
                    value={rule.parameters?.maxConsultationsPerDay || 10}
                    onChange={(e) => handleFieldChange('maxConsultationsPerDay', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Période d'application (jours de la semaine) */}
            <div>
                <fieldset className="border border-gray-200 rounded-md p-4">
                    <legend className="text-sm font-medium text-gray-700 px-2">Jours d'application</legend>
                    <div className="grid grid-cols-4 gap-4">
                        {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((day, index) => (
                            <div key={day} className="flex items-center">
                                <input
                                    id={`day-${index}`}
                                    type="checkbox"
                                    checked={rule.parameters?.applyOnDays?.includes(index) || false}
                                    onChange={(e) => {
                                        const currentDays = rule.parameters?.applyOnDays || [];
                                        const newDays = e.target.checked
                                            ? [...currentDays, index]
                                            : currentDays.filter(d => d !== index);
                                        handleFieldChange('applyOnDays', newDays);
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`day-${index}`} className="ml-2 block text-sm text-gray-700">
                                    {day}
                                </label>
                            </div>
                        ))}
                    </div>
                </fieldset>
            </div>
        </div>
    );
}; 