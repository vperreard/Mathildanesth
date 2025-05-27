'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    FileText,
    Play,
    Calendar,
    CheckCircle,
    AlertTriangle,
    Info
} from 'lucide-react';
import { DayOfWeek, Period, TypeSemaineTrame } from '@prisma/client';

// Types
interface TrameTemplate {
    id: number;
    name: string;
    description?: string;
    recurrence: TypeSemaineTrame;
    affectationsCount: number;
    lastUsed?: Date;
    tags?: string[];
}

interface ApplicationOptions {
    weekStart: Date;
    weekEnd: Date;
    overwriteExisting: boolean;
    skipConflicts: boolean;
    dryRun: boolean;
}

interface TemplateApplicatorProps {
    templates?: TrameTemplate[];
    selectedWeek?: Date;
    onApply?: (templateId: number, options: ApplicationOptions) => Promise<void>;
    onPreview?: (templateId: number, options: ApplicationOptions) => Promise<any>;
    isLoading?: boolean;
    className?: string;
}

// Composant pour une carte de template
const TemplateCard: React.FC<{
    template: TrameTemplate;
    isSelected: boolean;
    onSelect: () => void;
}> = ({ template, isSelected, onSelect }) => (
    <motion.div
        className={`
            p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
            ${isSelected
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }
        `}
        onClick={onSelect}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        layoutId={`template-${template.id}`}
    >
        <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-gray-900">{template.name}</h3>
            </div>
            {isSelected && (
                <CheckCircle className="w-5 h-5 text-blue-600" />
            )}
        </div>

        {template.description && (
            <p className="text-sm text-gray-600 mb-3">{template.description}</p>
        )}

        <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">
                Récurrence: {template.recurrence}
            </span>
        </div>

        <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
                {template.affectationsCount} affectations
            </Badge>
            {template.lastUsed && (
                <span className="text-xs text-gray-500">
                    Utilisé le {template.lastUsed.toLocaleDateString('fr-FR')}
                </span>
            )}
        </div>

        {template.tags && template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
                {template.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                    </Badge>
                ))}
            </div>
        )}
    </motion.div>
);

// Composant principal
export const TemplateApplicator: React.FC<TemplateApplicatorProps> = ({
    templates = [],
    selectedWeek = new Date(),
    onApply,
    onPreview,
    isLoading = false,
    className = ''
}) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const [options, setOptions] = useState<ApplicationOptions>({
        weekStart: selectedWeek,
        weekEnd: new Date(selectedWeek.getTime() + 6 * 24 * 60 * 60 * 1000),
        overwriteExisting: false,
        skipConflicts: true,
        dryRun: true
    });
    const [previewResults, setPreviewResults] = useState<any>(null);
    const [isApplying, setIsApplying] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

    const handlePreview = useCallback(async () => {
        if (!selectedTemplateId || !onPreview) return;

        try {
            const results = await onPreview(selectedTemplateId, options);
            setPreviewResults(results);
            setShowPreview(true);
        } catch (error) {
            console.error('Erreur lors de la prévisualisation:', error);
        }
    }, [selectedTemplateId, options, onPreview]);

    const handleApply = useCallback(async () => {
        if (!selectedTemplateId || !onApply) return;

        setIsApplying(true);
        try {
            await onApply(selectedTemplateId, { ...options, dryRun: false });
        } catch (error) {
            console.error('Erreur lors de l\'application:', error);
        } finally {
            setIsApplying(false);
        }
    }, [selectedTemplateId, options, onApply]);

    const updateOptions = useCallback((key: keyof ApplicationOptions, value: any) => {
        setOptions(prev => ({ ...prev, [key]: value }));
        setPreviewResults(null);
        setShowPreview(false);
    }, []);

    return (
        <div className={`space-y-6 ${className}`}>
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Appliquer un Modèle</h2>
                <Badge variant="outline">
                    {templates.length} templates disponibles
                </Badge>
            </div>

            {/* Sélection du template */}
            <div className="space-y-4">
                <h3 className="text-md font-medium">1. Choisir un template</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(template => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            isSelected={selectedTemplateId === template.id}
                            onSelect={() => setSelectedTemplateId(template.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Options d'application */}
            <AnimatePresence>
                {selectedTemplate && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                    >
                        <h3 className="text-md font-medium">2. Options d'application</h3>
                        <Card>
                            <CardContent className="p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Semaine de début</label>
                                        <input
                                            type="date"
                                            value={options.weekStart.toISOString().split('T')[0]}
                                            onChange={(e) => updateOptions('weekStart', new Date(e.target.value))}
                                            className="w-full mt-1 p-2 border rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Semaine de fin</label>
                                        <input
                                            type="date"
                                            value={options.weekEnd.toISOString().split('T')[0]}
                                            onChange={(e) => updateOptions('weekEnd', new Date(e.target.value))}
                                            className="w-full mt-1 p-2 border rounded-md"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="overwrite"
                                            checked={options.overwriteExisting}
                                            onCheckedChange={(checked) => updateOptions('overwriteExisting', checked)}
                                        />
                                        <label htmlFor="overwrite" className="text-sm">
                                            Remplacer les affectations existantes
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="skip-conflicts"
                                            checked={options.skipConflicts}
                                            onCheckedChange={(checked) => updateOptions('skipConflicts', checked)}
                                        />
                                        <label htmlFor="skip-conflicts" className="text-sm">
                                            Ignorer les slots en conflit
                                        </label>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Prévisualisation */}
            <AnimatePresence>
                {showPreview && previewResults && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                    >
                        <h3 className="text-md font-medium">3. Prévisualisation</h3>
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                {previewResults.affectationsToCreate || 0} affectations seront créées,
                                {previewResults.conflictsFound || 0} conflits détectés.
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Actions */}
            <AnimatePresence>
                {selectedTemplate && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="flex space-x-4"
                    >
                        <Button
                            variant="outline"
                            onClick={handlePreview}
                            disabled={isLoading}
                        >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Prévisualiser
                        </Button>

                        <Button
                            onClick={handleApply}
                            disabled={isLoading || isApplying || !showPreview}
                        >
                            <Play className="w-4 h-4 mr-2" />
                            {isApplying ? 'Application...' : 'Appliquer'}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TemplateApplicator; 