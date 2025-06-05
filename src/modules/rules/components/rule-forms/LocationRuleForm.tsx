import React, { useEffect, useState } from 'react';
import { AnyRule } from '../../types/rule';

interface LocationRuleFormProps {
    rule: Partial<AnyRule>;
    onChange: (updatedRule: Partial<AnyRule>) => void;
}

export const LocationRuleForm: React.FC<LocationRuleFormProps> = ({ rule, onChange }) => {
    const [locationConfig, setLocationConfig] = useState<any>(rule.configuration || {});

    useEffect(() => {
        if (rule.configuration) {
            setLocationConfig(rule.configuration);
        } else {
            setLocationConfig({
                locationIds: [],
                constraints: {}
            });
        }
    }, [rule.configuration]);

    const handleConfigChange = (field: string, value: unknown) => {
        const updatedConfig = { ...locationConfig, [field]: value };
        setLocationConfig(updatedConfig);

        const updatedRule = {
            ...rule,
            configuration: updatedConfig
        };

        onChange(updatedRule);
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            Ce module de règles d'emplacement est en cours de développement. Fonctionnalités complètes à venir.
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description de la configuration
                </label>
                <textarea
                    value={locationConfig.description || ''}
                    onChange={(e) => handleConfigChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Description de la règle d'emplacement..."
                />
            </div>
        </div>
    );
}; 