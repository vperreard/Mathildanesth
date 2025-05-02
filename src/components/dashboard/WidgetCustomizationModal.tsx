import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Widget } from '@/types/dashboard';
import { useTheme } from '@/hooks/useTheme';

interface WidgetCustomizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    widget: Widget;
    onSave: (widget: Widget) => void;
}

export const WidgetCustomizationModal: React.FC<WidgetCustomizationModalProps> = ({
    isOpen,
    onClose,
    widget,
    onSave
}) => {
    const { currentTheme } = useTheme();
    const [customization, setCustomization] = useState({
        backgroundColor: widget.config?.backgroundColor || currentTheme.colors.background,
        textColor: widget.config?.textColor || currentTheme.colors.text,
        borderColor: widget.config?.borderColor || currentTheme.colors.border,
        borderWidth: widget.config?.borderWidth || '1px',
        borderRadius: widget.config?.borderRadius || currentTheme.borderRadius.medium,
        shadow: widget.config?.shadow || currentTheme.shadows.medium,
        padding: widget.config?.padding || currentTheme.spacing.medium,
        fontSize: widget.config?.fontSize || '1rem',
        fontFamily: widget.config?.fontFamily || currentTheme.fonts.body,
        opacity: widget.config?.opacity || 1,
        animation: widget.config?.animation || 'none'
    });

    const handleSave = () => {
        onSave({
            ...widget,
            config: {
                ...widget.config,
                ...customization
            }
        });
        onClose();
    };

    const handleColorChange = (key: string, value: string) => {
        setCustomization(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleNumberChange = (key: string, value: string) => {
        setCustomization(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSelectChange = (key: string, value: string) => {
        setCustomization(prev => ({
            ...prev,
            [key]: value
        }));
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            className="fixed inset-0 z-10 overflow-y-auto"
        >
            <div className="flex min-h-screen items-center justify-center">
                <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

                <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
                    <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                        Personnalisation du widget
                    </Dialog.Title>

                    <div className="space-y-6">
                        {/* Couleurs */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Couleur de fond</label>
                                <input
                                    type="color"
                                    value={customization.backgroundColor}
                                    onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                                    className="mt-1 block w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Couleur du texte</label>
                                <input
                                    type="color"
                                    value={customization.textColor}
                                    onChange={(e) => handleColorChange('textColor', e.target.value)}
                                    className="mt-1 block w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Couleur de la bordure</label>
                                <input
                                    type="color"
                                    value={customization.borderColor}
                                    onChange={(e) => handleColorChange('borderColor', e.target.value)}
                                    className="mt-1 block w-full"
                                />
                            </div>
                        </div>

                        {/* Bordures et ombres */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Épaisseur de la bordure</label>
                                <select
                                    value={customization.borderWidth}
                                    onChange={(e) => handleSelectChange('borderWidth', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    <option value="0">Aucune</option>
                                    <option value="1px">Fine</option>
                                    <option value="2px">Moyenne</option>
                                    <option value="3px">Épaisse</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Arrondi des coins</label>
                                <select
                                    value={customization.borderRadius}
                                    onChange={(e) => handleSelectChange('borderRadius', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    <option value="0">Aucun</option>
                                    <option value="0.25rem">Petit</option>
                                    <option value="0.5rem">Moyen</option>
                                    <option value="1rem">Grand</option>
                                </select>
                            </div>
                        </div>

                        {/* Ombres et espacement */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ombre</label>
                                <select
                                    value={customization.shadow}
                                    onChange={(e) => handleSelectChange('shadow', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    <option value="none">Aucune</option>
                                    <option value={currentTheme.shadows.small}>Légère</option>
                                    <option value={currentTheme.shadows.medium}>Moyenne</option>
                                    <option value={currentTheme.shadows.large}>Prononcée</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Espacement interne</label>
                                <select
                                    value={customization.padding}
                                    onChange={(e) => handleSelectChange('padding', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    <option value={currentTheme.spacing.small}>Petit</option>
                                    <option value={currentTheme.spacing.medium}>Moyen</option>
                                    <option value={currentTheme.spacing.large}>Grand</option>
                                </select>
                            </div>
                        </div>

                        {/* Typographie */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Taille de police</label>
                                <select
                                    value={customization.fontSize}
                                    onChange={(e) => handleSelectChange('fontSize', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    <option value="0.875rem">Petite</option>
                                    <option value="1rem">Normale</option>
                                    <option value="1.25rem">Grande</option>
                                    <option value="1.5rem">Très grande</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Police</label>
                                <select
                                    value={customization.fontFamily}
                                    onChange={(e) => handleSelectChange('fontFamily', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    <option value={currentTheme.fonts.body}>Par défaut</option>
                                    <option value="'Inter', sans-serif">Inter</option>
                                    <option value="'Poppins', sans-serif">Poppins</option>
                                    <option value="'Roboto', sans-serif">Roboto</option>
                                </select>
                            </div>
                        </div>

                        {/* Effets */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Opacité</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={customization.opacity}
                                    onChange={(e) => handleNumberChange('opacity', e.target.value)}
                                    className="mt-1 block w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Animation</label>
                                <select
                                    value={customization.animation}
                                    onChange={(e) => handleSelectChange('animation', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                >
                                    <option value="none">Aucune</option>
                                    <option value="fade">Fondu</option>
                                    <option value="slide">Glissement</option>
                                    <option value="bounce">Rebond</option>
                                </select>
                            </div>
                        </div>
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