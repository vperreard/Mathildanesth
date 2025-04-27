'use client';

import { TeamConfiguration } from '@/types/team-configuration';

interface GeneralFormProps {
    config: TeamConfiguration;
    updateConfig: (path: string, value: any) => void;
}

export default function GeneralForm({ config, updateConfig }: GeneralFormProps) {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Paramètres généraux</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de la configuration *
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={config.name}
                        onChange={(e) => updateConfig('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                    </label>
                    <textarea
                        id="description"
                        value={config.description || ''}
                        onChange={(e) => updateConfig('description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="flex items-center space-x-6">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={config.isActive}
                        onChange={(e) => updateConfig('isActive', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">
                        Configuration active
                    </label>
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="isDefault"
                        checked={config.isDefault}
                        onChange={(e) => updateConfig('isDefault', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isDefault" className="ml-2 block text-sm font-medium text-gray-700">
                        Configuration par défaut
                    </label>
                </div>
            </div>

            <div className="pt-4 mt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                    * Champs obligatoires
                </p>
            </div>
        </div>
    );
} 