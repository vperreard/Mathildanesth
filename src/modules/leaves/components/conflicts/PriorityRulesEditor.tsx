import React, { useState, useEffect } from 'react';
import { logger } from "../../../../lib/logger";
import { useTranslation } from 'next-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, RefreshCcw, Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { ConflictType, ConflictSeverity } from '../../types/conflict';
import {
    ConflictPriority,
    ResolutionStrategy,
    ConflictResolutionRules,
    RecommendationOptions
} from '../../types/recommendation';
import { ConflictRecommendationService } from '../../services/conflictRecommendationService';

interface PriorityRulesEditorProps {
    onSave?: (rules: ConflictResolutionRules, options: RecommendationOptions) => void;
    onClose?: () => void;
}

export const PriorityRulesEditor: React.FC<PriorityRulesEditorProps> = ({
    onSave,
    onClose,
}) => {
    const { t } = useTranslation('leaves');
    const [tab, setTab] = useState('priority');
    const [rules, setRules] = useState<ConflictResolutionRules>(
        ConflictRecommendationService.getInstance().getDefaultRules()
    );
    const [options, setOptions] = useState<RecommendationOptions>({
        rules,
        maxRecommendationsPerConflict: 3,
        enableAutoResolution: true,
        learnFromPastResolutions: true,
        considerWorkload: true,
        considerUserHistory: true,
        considerTeamBalance: true,
        explanationLevel: 'DETAILED'
    });
    const [isDirty, setIsDirty] = useState(false);

    // Sauvegarder les règles dans le service
    const handleSave = () => {
        try {
            const service = ConflictRecommendationService.getInstance();
            service.updateRules(rules);
            service.updateOptions(options);

            setIsDirty(false);

            toast({
                title: t('conflit.regles.sauvegarde_succes'),
                description: t('conflit.regles.sauvegarde_description'),
                variant: 'default',
            });

            if (onSave) {
                onSave(rules, options);
            }
        } catch (error: unknown) {
            logger.error('Erreur lors de la sauvegarde des règles:', { error: error });
            toast({
                title: t('conflit.regles.sauvegarde_erreur'),
                description: String(error),
                variant: 'destructive',
            });
        }
    };

    // Réinitialiser les règles aux valeurs par défaut
    const handleReset = () => {
        const service = ConflictRecommendationService.getInstance();
        const defaultRules = service.getDefaultRules();

        setRules(defaultRules);
        setOptions({
            ...options,
            rules: defaultRules
        });

        setIsDirty(true);

        toast({
            title: t('conflit.regles.reinitialisation'),
            description: t('conflit.regles.reinitialisation_description'),
            variant: 'default',
        });
    };

    // Mettre à jour les priorités par type et sévérité
    const handleUpdatePriority = (
        conflictType: ConflictType,
        severity: ConflictSeverity,
        priority: ConflictPriority
    ) => {
        setRules(prevRules => {
            const updatedRules = { ...prevRules };

            // Initialiser l'objet pour ce type de conflit s'il n'existe pas
            if (!updatedRules.priorityRules[conflictType]) {
                updatedRules.priorityRules[conflictType] = {};
            }

            // Mettre à jour la priorité pour cette sévérité
            updatedRules.priorityRules[conflictType][severity] = priority;

            return updatedRules;
        });

        setIsDirty(true);
    };

    // Mettre à jour les stratégies préférées
    const handleUpdatePreferredStrategies = (
        conflictType: ConflictType,
        strategies: ResolutionStrategy[]
    ) => {
        setRules(prevRules => {
            const updatedRules = { ...prevRules };

            // Initialiser l'objet pour les stratégies préférées s'il n'existe pas
            if (!updatedRules.preferredStrategies) {
                updatedRules.preferredStrategies = {};
            }

            // Mettre à jour les stratégies pour ce type de conflit
            updatedRules.preferredStrategies[conflictType] = strategies;

            return updatedRules;
        });

        setIsDirty(true);
    };

    // Mettre à jour les seuils de résolution automatique
    const handleUpdateAutoResolutionThresholds = (
        field: keyof typeof rules.autoResolutionThresholds,
        value: unknown
    ) => {
        setRules(prevRules => {
            const updatedRules = { ...prevRules };

            // Initialiser l'objet pour les seuils s'il n'existe pas
            if (!updatedRules.autoResolutionThresholds) {
                updatedRules.autoResolutionThresholds = {
                    minConfidence: 80,
                    maxSeverity: ConflictSeverity.AVERTISSEMENT,
                    enabledStrategies: []
                };
            }

            // Mettre à jour la valeur du champ
            updatedRules.autoResolutionThresholds[field] = value;

            return updatedRules;
        });

        setIsDirty(true);
    };

    // Mettre à jour une option générale
    const handleUpdateOption = (field: keyof RecommendationOptions, value: unknown) => {
        setOptions(prevOptions => ({
            ...prevOptions,
            [field]: value
        }));

        setIsDirty(true);
    };

    // Fonction utilitaire pour afficher le nom traduit du type de conflit
    const getConflictTypeName = (type: ConflictType) => {
        return t(`conflit.type.${type.toLowerCase()}`, type);
    };

    // Fonction utilitaire pour afficher le nom traduit de la sévérité
    const getSeverityName = (severity: ConflictSeverity) => {
        return t(`conflit.severite.${severity.toLowerCase()}`, severity);
    };

    // Fonction utilitaire pour afficher le nom traduit de la priorité
    const getPriorityName = (priority: ConflictPriority) => {
        const priorityMap = {
            [ConflictPriority.VERY_LOW]: t('conflit.priorite.tres_basse'),
            [ConflictPriority.LOW]: t('conflit.priorite.basse'),
            [ConflictPriority.MEDIUM]: t('conflit.priorite.moyenne'),
            [ConflictPriority.HIGH]: t('conflit.priorite.elevee'),
            [ConflictPriority.VERY_HIGH]: t('conflit.priorite.tres_elevee')
        };

        return priorityMap[priority] || priority.toString();
    };

    // Fonction utilitaire pour afficher le nom traduit de la stratégie
    const getStrategyName = (strategy: ResolutionStrategy) => {
        return t(`conflit.strategie.${strategy.toLowerCase()}`, strategy);
    };

    // Liste des types de conflits les plus courants
    const commonConflictTypes = [
        ConflictType.USER_LEAVE_OVERLAP,
        ConflictType.TEAM_ABSENCE,
        ConflictType.TEAM_CAPACITY,
        ConflictType.CRITICAL_ROLE,
        ConflictType.DUTY_CONFLICT,
        ConflictType.HOLIDAY_PROXIMITY
    ];

    // Liste de toutes les sévérités
    const severities = [
        ConflictSeverity.INFORMATION,
        ConflictSeverity.AVERTISSEMENT,
        ConflictSeverity.BLOQUANT
    ];

    // Liste de toutes les priorités
    const priorities = [
        ConflictPriority.VERY_LOW,
        ConflictPriority.LOW,
        ConflictPriority.MEDIUM,
        ConflictPriority.HIGH,
        ConflictPriority.VERY_HIGH
    ];

    // Liste de toutes les stratégies
    const strategies = [
        ResolutionStrategy.APPROVE,
        ResolutionStrategy.REJECT,
        ResolutionStrategy.RESCHEDULE_BEFORE,
        ResolutionStrategy.RESCHEDULE_AFTER,
        ResolutionStrategy.SHORTEN,
        ResolutionStrategy.SPLIT,
        ResolutionStrategy.SWAP,
        ResolutionStrategy.REASSIGN,
        ResolutionStrategy.MANUAL
    ];

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>{t('conflit.regles.titre')}</CardTitle>
                <CardDescription>
                    {t('conflit.regles.description')}
                </CardDescription>
            </CardHeader>

            <CardContent>
                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="priority">{t('conflit.regles.priorites')}</TabsTrigger>
                        <TabsTrigger value="strategies">{t('conflit.regles.strategies')}</TabsTrigger>
                        <TabsTrigger value="auto">{t('conflit.regles.resolution_auto')}</TabsTrigger>
                        <TabsTrigger value="general">{t('conflit.regles.parametres_generaux')}</TabsTrigger>
                    </TabsList>

                    {/* Onglet des priorités */}
                    <TabsContent value="priority">
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">{t('conflit.regles.priorites_par_type')}</h3>
                            <p className="text-sm text-muted-foreground">
                                {t('conflit.regles.priorites_description')}
                            </p>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('conflit.type.label')}</TableHead>
                                        <TableHead>{t('conflit.severite.information')}</TableHead>
                                        <TableHead>{t('conflit.severite.avertissement')}</TableHead>
                                        <TableHead>{t('conflit.severite.bloquant')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {commonConflictTypes.map(type => (
                                        <TableRow key={type}>
                                            <TableCell className="font-medium">{getConflictTypeName(type)}</TableCell>
                                            {severities.map(severity => (
                                                <TableCell key={severity}>
                                                    <Select
                                                        value={String(rules.priorityRules[type]?.[severity] || ConflictPriority.MEDIUM)}
                                                        onValueChange={(value) =>
                                                            handleUpdatePriority(type, severity, Number(value) as ConflictPriority)
                                                        }
                                                    >
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue placeholder={t('conflit.priorite.selectionner')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {priorities.map((priority) => (
                                                                <SelectItem key={priority} value={String(priority)}>
                                                                    {getPriorityName(priority)}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    {/* Onglet des stratégies */}
                    <TabsContent value="strategies">
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">{t('conflit.regles.strategies_preferees')}</h3>
                            <p className="text-sm text-muted-foreground">
                                {t('conflit.regles.strategies_description')}
                            </p>

                            {commonConflictTypes.map(type => (
                                <div key={type} className="p-4 border rounded-lg space-y-2">
                                    <h4 className="font-medium">{getConflictTypeName(type)}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {strategies.map(strategy => {
                                            const isSelected = rules.preferredStrategies?.[type]?.includes(strategy) || false;

                                            return (
                                                <div key={strategy} className="flex items-center space-x-2">
                                                    <Switch
                                                        checked={isSelected}
                                                        onCheckedChange={(checked) => {
                                                            const currentStrategies = rules.preferredStrategies?.[type] || [];
                                                            let newStrategies: ResolutionStrategy[];

                                                            if (checked) {
                                                                newStrategies = [...currentStrategies, strategy];
                                                            } else {
                                                                newStrategies = currentStrategies.filter(s => s !== strategy);
                                                            }

                                                            handleUpdatePreferredStrategies(type, newStrategies);
                                                        }}
                                                    />
                                                    <Label htmlFor={`strategy-${type}-${strategy}`}>
                                                        {getStrategyName(strategy)}
                                                    </Label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Onglet de la résolution automatique */}
                    <TabsContent value="auto">
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">{t('conflit.regles.seuils_auto')}</h3>
                            <p className="text-sm text-muted-foreground">
                                {t('conflit.regles.seuils_description')}
                            </p>

                            <div className="grid gap-6">
                                <div className="space-y-2">
                                    <Label>{t('conflit.regles.confiance_min')}</Label>
                                    <div className="flex items-center gap-4">
                                        <Slider
                                            value={[rules.autoResolutionThresholds?.minConfidence || 80]}
                                            min={50}
                                            max={100}
                                            step={5}
                                            onValueChange={(value) =>
                                                handleUpdateAutoResolutionThresholds('minConfidence', value[0])
                                            }
                                            className="flex-1"
                                        />
                                        <span className="w-12 text-right font-medium">
                                            {rules.autoResolutionThresholds?.minConfidence || 80}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {t('conflit.regles.confiance_description')}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>{t('conflit.regles.severite_max')}</Label>
                                    <Select
                                        value={rules.autoResolutionThresholds?.maxSeverity || ConflictSeverity.INFORMATION}
                                        onValueChange={(value) =>
                                            handleUpdateAutoResolutionThresholds('maxSeverity', value as ConflictSeverity)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {severities.map(severity => (
                                                <SelectItem key={severity} value={severity}>
                                                    {getSeverityName(severity)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        {t('conflit.regles.severite_description')}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>{t('conflit.regles.strategies_auto')}</Label>
                                    <div className="flex flex-wrap gap-2 border p-3 rounded-md">
                                        {strategies.map(strategy => {
                                            const isEnabled = rules.autoResolutionThresholds?.enabledStrategies?.includes(strategy) || false;

                                            return (
                                                <div key={strategy} className="flex items-center space-x-2">
                                                    <Switch
                                                        checked={isEnabled}
                                                        onCheckedChange={(checked) => {
                                                            const currentStrategies = rules.autoResolutionThresholds?.enabledStrategies || [];
                                                            let newStrategies: ResolutionStrategy[];

                                                            if (checked) {
                                                                newStrategies = [...currentStrategies, strategy];
                                                            } else {
                                                                newStrategies = currentStrategies.filter(s => s !== strategy);
                                                            }

                                                            handleUpdateAutoResolutionThresholds('enabledStrategies', newStrategies);
                                                        }}
                                                    />
                                                    <Label htmlFor={`auto-strategy-${strategy}`}>
                                                        {getStrategyName(strategy)}
                                                    </Label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {t('conflit.regles.strategies_auto_description')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Onglet des paramètres généraux */}
                    <TabsContent value="general">
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">{t('conflit.regles.parametres_generaux')}</h3>
                            <p className="text-sm text-muted-foreground">
                                {t('conflit.regles.parametres_description')}
                            </p>

                            <div className="grid gap-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>{t('conflit.regles.activer_auto')}</Label>
                                        <p className="text-xs text-muted-foreground">
                                            {t('conflit.regles.activer_auto_description')}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={options.enableAutoResolution}
                                        onCheckedChange={(checked) =>
                                            handleUpdateOption('enableAutoResolution', checked)
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>{t('conflit.regles.apprentissage')}</Label>
                                        <p className="text-xs text-muted-foreground">
                                            {t('conflit.regles.apprentissage_description')}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={options.learnFromPastResolutions}
                                        onCheckedChange={(checked) =>
                                            handleUpdateOption('learnFromPastResolutions', checked)
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>{t('conflit.regles.max_recommandations')}</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={5}
                                        value={options.maxRecommendationsPerConflict || 3}
                                        onChange={(e) =>
                                            handleUpdateOption('maxRecommendationsPerConflict', parseInt(e.target.value, 10))
                                        }
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {t('conflit.regles.max_recommandations_description')}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>{t('conflit.regles.niveau_explication')}</Label>
                                    <Select
                                        value={options.explanationLevel || 'DETAILED'}
                                        onValueChange={(value) =>
                                            handleUpdateOption('explanationLevel', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NONE">{t('conflit.regles.explication_aucune')}</SelectItem>
                                            <SelectItem value="BASIC">{t('conflit.regles.explication_basique')}</SelectItem>
                                            <SelectItem value="DETAILED">{t('conflit.regles.explication_detaillee')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        {t('conflit.regles.niveau_explication_description')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>

            <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReset}>
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        {t('conflit.regles.reinitialiser')}
                    </Button>
                </div>

                <div className="flex gap-2">
                    {onClose && (
                        <Button variant="outline" onClick={onClose}>
                            {t('commun.annuler')}
                        </Button>
                    )}

                    <Button
                        variant="default"
                        onClick={handleSave}
                        disabled={!isDirty}
                    >
                        {isDirty ? (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                {t('conflit.regles.sauvegarder')}
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {t('conflit.regles.sauvegarde')}
                            </>
                        )}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}; 