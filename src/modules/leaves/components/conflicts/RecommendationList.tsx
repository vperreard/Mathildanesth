import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Check, CheckCircle, AlertTriangle, Calendar, Users, ArrowRight, MessageSquare } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ConflictRecommendation, ResolutionStrategy } from '../../types/recommendation';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/utils/dateUtils';

interface RecommendationListProps {
    recommendation: ConflictRecommendation;
    onApplyStrategy: (strategy: ResolutionStrategy, comment: string) => void;
}

export const RecommendationList: React.FC<RecommendationListProps> = ({
    recommendation,
    onApplyStrategy,
}) => {
    const { t } = useTranslation('leaves');
    const [activeStrategy, setActiveStrategy] = useState<string | null>(null);
    const [comment, setComment] = useState<string>('');

    const handleApplyStrategy = (strategy: ResolutionStrategy) => {
        onApplyStrategy(strategy, comment);
        setActiveStrategy(null);
        setComment('');
    };

    const getStrategyIcon = (strategy: ResolutionStrategy) => {
        switch (strategy) {
            case ResolutionStrategy.APPROVE:
                return <CheckCircle className="h-4 w-4 text-success" />;
            case ResolutionStrategy.REJECT:
                return <AlertTriangle className="h-4 w-4 text-destructive" />;
            case ResolutionStrategy.RESCHEDULE_BEFORE:
            case ResolutionStrategy.RESCHEDULE_AFTER:
                return <Calendar className="h-4 w-4 text-primary" />;
            case ResolutionStrategy.SPLIT:
                return <ArrowRight className="h-4 w-4 text-secondary" />;
            case ResolutionStrategy.REASSIGN:
                return <Users className="h-4 w-4 text-blue-500" />;
            default:
                return <MessageSquare className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-2">
            <h4 className="text-sm font-medium">{t('conflit.recommandations')}</h4>

            <Accordion type="single" collapsible className="w-full">
                {recommendation.strategies.map((strategy, index) => (
                    <AccordionItem key={index} value={`strategy-${index}`}>
                        <AccordionTrigger className="py-2">
                            <div className="flex items-center gap-2 text-left text-sm">
                                {getStrategyIcon(strategy.strategy)}
                                <span>{strategy.description}</span>
                                <Badge variant="outline" className="ml-2">
                                    {Math.round(strategy.confidence)}%
                                </Badge>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{t('conflit.confiance')}</span>
                                    <div className="flex gap-2 items-center">
                                        <Progress value={strategy.confidence} className="h-2 w-24" />
                                        <span className="text-sm font-medium">{Math.round(strategy.confidence)}%</span>
                                    </div>
                                </div>

                                {strategy.alternativeDates && strategy.alternativeDates.length > 0 && (
                                    <div className="space-y-1">
                                        <span className="text-sm text-muted-foreground">{t('conflit.dates_alternatives')}</span>
                                        {strategy.alternativeDates.map((dates, i) => (
                                            <div key={i} className="text-sm bg-secondary/10 p-2 rounded-md">
                                                {formatDate(new Date(dates.startDate))} - {formatDate(new Date(dates.endDate))}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {strategy.additionalActions && strategy.additionalActions.length > 0 && (
                                    <div className="space-y-1">
                                        <span className="text-sm text-muted-foreground">{t('conflit.actions_additionnelles')}</span>
                                        <ul className="text-sm list-disc list-inside">
                                            {strategy.additionalActions.map((action, i) => (
                                                <li key={i}>{action}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {activeStrategy === strategy.strategy ? (
                                    <div className="space-y-2 mt-3">
                                        <Textarea
                                            placeholder={t('conflit.commentaire_placeholder')}
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            rows={2}
                                            className="resize-none"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setActiveStrategy(null)}
                                            >
                                                {t('commun.annuler')}
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => handleApplyStrategy(strategy.strategy)}
                                            >
                                                <Check className="h-4 w-4 mr-1" />{t('conflit.appliquer')}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        className="mt-3"
                                        size="sm"
                                        onClick={() => setActiveStrategy(strategy.strategy)}
                                    >
                                        {t('conflit.appliquer_strategie')}
                                    </Button>
                                )}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            {recommendation.explanation && (
                <div className="text-sm italic text-muted-foreground mt-1 px-2">
                    {recommendation.explanation}
                </div>
            )}
        </div>
    );
}; 