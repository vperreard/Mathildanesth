import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Widget } from '@/types/dashboard';

interface WidgetConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    widget: Widget;
    onSave: (widget: Widget) => void;
}

export const WidgetConfigModal: React.FC<WidgetConfigModalProps> = ({
    isOpen,
    onClose,
    widget,
    onSave
}) => {
    const [title, setTitle] = useState(widget.title);
    const [config, setConfig] = useState(widget.config || {});

    const handleSave = () => {
        onSave({
            ...widget,
            title,
            config
        });
        onClose();
    };

    const renderConfigFields = () => {
        switch (widget.type) {
            case 'stat':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Valeur</label>
                            <input
                                type="number"
                                value={config.value || 0}
                                onChange={(e) => setConfig({ ...config, value: Number(e.target.value) })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Label</label>
                            <input
                                type="text"
                                value={config.label || ''}
                                onChange={(e) => setConfig({ ...config, label: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                );

            case 'chart':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Type de graphique</label>
                            <select
                                value={config.type || 'line'}
                                onChange={(e) => setConfig({ ...config, type: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="line">Ligne</option>
                                <option value="bar">Barre</option>
                                <option value="pie">Camembert</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Données</label>
                            <textarea
                                value={JSON.stringify(config.data || {}, null, 2)}
                                onChange={(e) => {
                                    try {
                                        setConfig({ ...config, data: JSON.parse(e.target.value) });
                                    } catch (error: unknown) {
                                        // Ignorer les erreurs de parsing JSON
                                    }
                                }}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                rows={5}
                            />
                        </div>
                    </div>
                );

            case 'list':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Afficher le statut</label>
                            <input
                                type="checkbox"
                                checked={config.showStatus || false}
                                onChange={(e) => setConfig({ ...config, showStatus: e.target.checked })}
                                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Afficher la date</label>
                            <input
                                type="checkbox"
                                checked={config.showDate || false}
                                onChange={(e) => setConfig({ ...config, showDate: e.target.checked })}
                                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Items</label>
                            <textarea
                                value={JSON.stringify(config.items || [], null, 2)}
                                onChange={(e) => {
                                    try {
                                        setConfig({ ...config, items: JSON.parse(e.target.value) });
                                    } catch (error: unknown) {
                                        // Ignorer les erreurs de parsing JSON
                                    }
                                }}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                rows={5}
                            />
                        </div>
                    </div>
                );

            case 'calendar':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Vue par défaut</label>
                            <select
                                value={config.view || 'month'}
                                onChange={(e) => setConfig({ ...config, view: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            >
                                <option value="month">Mois</option>
                                <option value="week">Semaine</option>
                                <option value="day">Jour</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Événements</label>
                            <textarea
                                value={JSON.stringify(config.events || [], null, 2)}
                                onChange={(e) => {
                                    try {
                                        setConfig({ ...config, events: JSON.parse(e.target.value) });
                                    } catch (error: unknown) {
                                        // Ignorer les erreurs de parsing JSON
                                    }
                                }}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                rows={5}
                            />
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            className="fixed inset-0 z-10 overflow-y-auto"
        >
            <div className="flex min-h-screen items-center justify-center">
                <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

                <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
                    <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                        Configuration du widget
                    </Dialog.Title>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Titre</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                            />
                        </div>

                        {renderConfigFields()}
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Enregistrer
                        </button>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}; 