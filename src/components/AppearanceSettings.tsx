'use client';

import React, { useState, useEffect } from 'react';
import { VisualTheme, AppearancePreferences } from '@/types/user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/context/ThemeContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppearance } from '@/hooks/useAppearance';

interface AppearanceSettingsProps {
    onSave?: (success: boolean) => void;
}

const colorThemes = [
    { id: VisualTheme.DEFAULT, name: 'Par défaut', colors: ['#6366f1', '#d946ef', '#ec4899'] },
    { id: VisualTheme.OCEAN, name: 'Océan', colors: ['#0ea5e9', '#06b6d4', '#0891b2'] },
    { id: VisualTheme.SUNSET, name: 'Crépuscule', colors: ['#f97316', '#ef4444', '#dc2626'] },
    { id: VisualTheme.FOREST, name: 'Forêt', colors: ['#22c55e', '#16a34a', '#15803d'] },
    { id: VisualTheme.LAVENDER, name: 'Lavande', colors: ['#8b5cf6', '#a855f7', '#d946ef'] },
    { id: VisualTheme.MONOCHROME, name: 'Monochrome', colors: ['#525252', '#737373', '#a3a3a3'] },
    { id: VisualTheme.CUSTOM, name: 'Personnalisé', colors: ['#ff0000', '#00ff00', '#0000ff'] },
];

const fontSizeOptions = [
    { value: 'small', label: 'Petite' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'large', label: 'Grande' },
    { value: 'x-large', label: 'Très grande' },
];

const fontFamilyOptions = [
    { value: 'system', label: 'Système' },
    { value: 'serif', label: 'Serif' },
    { value: 'sans-serif', label: 'Sans-serif' },
    { value: 'monospace', label: 'Monospace' },
];

const borderRadiusOptions = [
    { value: 'none', label: 'Aucun' },
    { value: 'small', label: 'Petit' },
    { value: 'medium', label: 'Moyen' },
    { value: 'large', label: 'Grand' },
    { value: 'full', label: 'Complet' },
];

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ onSave }) => {
    const { theme } = useTheme();
    const { preferences, updatePreferences, loading } = useAppearance();
    const [activeTab, setActiveTab] = useState('theme');
    const [customizing, setCustomizing] = useState(false);

    const handleColorSchemeChange = async (themeId: VisualTheme) => {
        const success = await updatePreferences({ visualTheme: themeId });
        if (onSave) onSave(success);
    };

    const handleTypographyChange = async (field: keyof AppearancePreferences['typography'], value: any) => {
        const success = await updatePreferences({
            typography: {
                ...preferences?.typography,
                [field]: value,
            },
        });
        if (onSave) onSave(success);
    };

    const handleInterfaceChange = async (field: keyof AppearancePreferences['interface'], value: any) => {
        const success = await updatePreferences({
            interface: {
                ...preferences?.interface,
                [field]: value,
            },
        });
        if (onSave) onSave(success);
    };

    const handleAccessibilityChange = async (field: keyof AppearancePreferences['accessibility'], value: boolean) => {
        const success = await updatePreferences({
            accessibility: {
                ...preferences?.accessibility,
                [field]: value,
            },
        });
        if (onSave) onSave(success);
    };

    const handleHeaderChange = async (field: keyof AppearancePreferences['header'], value: any) => {
        const success = await updatePreferences({
            header: {
                ...preferences?.header,
                [field]: value,
            },
        });
        if (onSave) onSave(success);
    };

    // Si les préférences sont en cours de chargement, afficher un indicateur de chargement
    if (loading) {
        return <div className="py-4 text-center">Chargement des préférences...</div>;
    }

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="theme">Thème</TabsTrigger>
                    <TabsTrigger value="typography">Typographie</TabsTrigger>
                    <TabsTrigger value="interface">Interface</TabsTrigger>
                    <TabsTrigger value="accessibility">Accessibilité</TabsTrigger>
                </TabsList>

                <TabsContent value="theme" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thème visuel</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {colorThemes.map((colorTheme) => (
                                    <div
                                        key={colorTheme.id}
                                        onClick={() => handleColorSchemeChange(colorTheme.id)}
                                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${preferences?.visualTheme === colorTheme.id
                                                ? 'ring-2 ring-primary-500 dark:ring-primary-400'
                                                : 'hover:border-gray-400 dark:hover:border-gray-500'
                                            }`}
                                    >
                                        <div className="flex space-x-2 mb-3 justify-center">
                                            {colorTheme.colors.map((color, index) => (
                                                <div
                                                    key={index}
                                                    className="w-6 h-6 rounded-full"
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-center text-sm font-medium">{colorTheme.name}</p>
                                    </div>
                                ))}
                            </div>

                            {preferences?.visualTheme === VisualTheme.CUSTOM && (
                                <div className="mt-6 p-4 border rounded-lg">
                                    <h4 className="font-medium mb-3">Personnalisation des couleurs</h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm mb-1">Couleur principale</label>
                                            <input
                                                type="color"
                                                className="h-10 w-full"
                                                value="#6366f1"
                                                onChange={(e) => {
                                                    // Pour une future implémentation
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-1">Couleur secondaire</label>
                                            <input
                                                type="color"
                                                className="h-10 w-full"
                                                value="#d946ef"
                                                onChange={(e) => {
                                                    // Pour une future implémentation
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm mb-1">Couleur tertiaire</label>
                                            <input
                                                type="color"
                                                className="h-10 w-full"
                                                value="#ec4899"
                                                onChange={(e) => {
                                                    // Pour une future implémentation
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>En-tête</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Style d'en-tête</label>
                                    <select
                                        className="w-full border rounded-md p-2"
                                        value={preferences?.header?.style || 'gradient'}
                                        onChange={(e) => handleHeaderChange('style', e.target.value as any)}
                                    >
                                        <option value="solid">Uni</option>
                                        <option value="gradient">Dégradé</option>
                                        <option value="transparent">Transparent</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="block text-sm font-medium">En-tête fixe</label>
                                        <p className="text-xs text-gray-500">L'en-tête reste visible lors du défilement</p>
                                    </div>
                                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                        <input
                                            type="checkbox"
                                            id="header-sticky"
                                            className="opacity-0 absolute block w-6 h-6 rounded-full bg-white border-4 cursor-pointer"
                                            checked={preferences?.header?.sticky ?? true}
                                            onChange={(e) => handleHeaderChange('sticky', e.target.checked)}
                                        />
                                        <label
                                            htmlFor="header-sticky"
                                            className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${preferences?.header?.sticky ?? true ? 'bg-primary-500' : ''
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="typography" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Typographie</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Taille de police</label>
                                    <select
                                        className="w-full border rounded-md p-2"
                                        value={preferences?.typography?.fontSize || 'medium'}
                                        onChange={(e) => handleTypographyChange('fontSize', e.target.value as any)}
                                    >
                                        {fontSizeOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Famille de police</label>
                                    <select
                                        className="w-full border rounded-md p-2"
                                        value={preferences?.typography?.fontFamily || 'system'}
                                        onChange={(e) => handleTypographyChange('fontFamily', e.target.value as any)}
                                    >
                                        {fontFamilyOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Hauteur de ligne</label>
                                    <select
                                        className="w-full border rounded-md p-2"
                                        value={preferences?.typography?.lineHeight || 'normal'}
                                        onChange={(e) => handleTypographyChange('lineHeight', e.target.value as any)}
                                    >
                                        <option value="compact">Compacte</option>
                                        <option value="normal">Normale</option>
                                        <option value="relaxed">Détendue</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Graisse de police</label>
                                    <select
                                        className="w-full border rounded-md p-2"
                                        value={preferences?.typography?.fontWeight || 'normal'}
                                        onChange={(e) => handleTypographyChange('fontWeight', e.target.value as any)}
                                    >
                                        <option value="normal">Normale</option>
                                        <option value="medium">Moyenne</option>
                                        <option value="bold">Gras</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="interface" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Interface</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Rayon de bordure</label>
                                    <select
                                        className="w-full border rounded-md p-2"
                                        value={preferences?.interface?.borderRadius || 'medium'}
                                        onChange={(e) => handleInterfaceChange('borderRadius', e.target.value as any)}
                                    >
                                        {borderRadiusOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Densité</label>
                                    <select
                                        className="w-full border rounded-md p-2"
                                        value={preferences?.interface?.density || 'normal'}
                                        onChange={(e) => handleInterfaceChange('density', e.target.value as any)}
                                    >
                                        <option value="compact">Compacte</option>
                                        <option value="normal">Normale</option>
                                        <option value="comfortable">Confortable</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Ombres</label>
                                    <select
                                        className="w-full border rounded-md p-2"
                                        value={preferences?.interface?.shadows || 'normal'}
                                        onChange={(e) => handleInterfaceChange('shadows', e.target.value as any)}
                                    >
                                        <option value="none">Aucune</option>
                                        <option value="subtle">Subtiles</option>
                                        <option value="normal">Normales</option>
                                        <option value="prominent">Prononcées</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="block text-sm font-medium">Effets de transparence</label>
                                        <p className="text-xs text-gray-500">Activer les effets de verre et transparence</p>
                                    </div>
                                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                        <input
                                            type="checkbox"
                                            id="transparency-effects"
                                            className="opacity-0 absolute block w-6 h-6 rounded-full bg-white border-4 cursor-pointer"
                                            checked={preferences?.interface?.transparencyEffects ?? true}
                                            onChange={(e) => handleInterfaceChange('transparencyEffects', e.target.checked)}
                                        />
                                        <label
                                            htmlFor="transparency-effects"
                                            className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${preferences?.interface?.transparencyEffects ?? true ? 'bg-primary-500' : ''
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="accessibility" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Accessibilité</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="block text-sm font-medium">Contraste élevé</label>
                                        <p className="text-xs text-gray-500">Améliore la lisibilité avec des contrastes plus forts</p>
                                    </div>
                                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                        <input
                                            type="checkbox"
                                            id="high-contrast"
                                            className="opacity-0 absolute block w-6 h-6 rounded-full bg-white border-4 cursor-pointer"
                                            checked={preferences?.accessibility?.highContrast ?? false}
                                            onChange={(e) => handleAccessibilityChange('highContrast', e.target.checked)}
                                        />
                                        <label
                                            htmlFor="high-contrast"
                                            className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${preferences?.accessibility?.highContrast ? 'bg-primary-500' : ''
                                                }`}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="block text-sm font-medium">Réduire les animations</label>
                                        <p className="text-xs text-gray-500">
                                            Limite les animations pour réduire les distractions et la fatigue
                                        </p>
                                    </div>
                                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                        <input
                                            type="checkbox"
                                            id="reduce-motion"
                                            className="opacity-0 absolute block w-6 h-6 rounded-full bg-white border-4 cursor-pointer"
                                            checked={preferences?.accessibility?.reduceMotion ?? false}
                                            onChange={(e) => handleAccessibilityChange('reduceMotion', e.target.checked)}
                                        />
                                        <label
                                            htmlFor="reduce-motion"
                                            className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${preferences?.accessibility?.reduceMotion ? 'bg-primary-500' : ''
                                                }`}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="block text-sm font-medium">Grandes cibles de clic</label>
                                        <p className="text-xs text-gray-500">Augmente la taille des boutons et zones cliquables</p>
                                    </div>
                                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                                        <input
                                            type="checkbox"
                                            id="large-targets"
                                            className="opacity-0 absolute block w-6 h-6 rounded-full bg-white border-4 cursor-pointer"
                                            checked={preferences?.accessibility?.largeClickTargets ?? false}
                                            onChange={(e) => handleAccessibilityChange('largeClickTargets', e.target.checked)}
                                        />
                                        <label
                                            htmlFor="large-targets"
                                            className={`block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${preferences?.accessibility?.largeClickTargets ? 'bg-primary-500' : ''
                                                }`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AppearanceSettings; 