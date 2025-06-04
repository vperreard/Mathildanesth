'use client';

import { useState, useEffect } from 'react';
import { Card, Badge, Button, Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui';
import { History, Filter, ChevronDown, ChevronUp, Clock, User } from 'lucide-react';

interface ChangeHistoryItem {
    id: string;
    timestamp: string | Date;
    userId: string;
    userName: string;
    action: 'create' | 'update' | 'delete' | 'statusChange' | 'comment';
    targetType: 'attribution' | 'planning' | 'supervisor' | 'annotation';
    targetId: string;
    details: {
        previous?: any;
        current?: any;
        roomName?: string;
        surgeonName?: string;
        status?: string;
        comment?: string;
    };
}

interface PlanningChangeHistoryProps {
    planningId: string;
    onLoadHistory: (planningId: string, filters?: {
        limit?: number;
        offset?: number;
        actionTypes?: string[];
        userId?: string;
        startDate?: Date;
        endDate?: Date;
    }) => Promise<{ items: ChangeHistoryItem[]; total: number }>;
}

export default function PlanningChangeHistory({ planningId, onLoadHistory }: PlanningChangeHistoryProps) {
    const [history, setHistory] = useState<ChangeHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [limit, setLimit] = useState(10);
    const [filters, setFilters] = useState<{
        actionTypes: string[];
        startDate?: Date;
        endDate?: Date;
        userId?: string;
    }>({
        actionTypes: ['create', 'update', 'delete', 'statusChange', 'comment']
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        if (planningId) {
            loadHistory();
        }
    }, [planningId, limit, filters]);

    const loadHistory = async (offset = 0) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await onLoadHistory(planningId, {
                limit,
                offset,
                actionTypes: filters.actionTypes,
                userId: filters.userId,
                startDate: filters.startDate,
                endDate: filters.endDate
            });

            if (offset === 0) {
                setHistory(result.items);
            } else {
                setHistory(prev => [...prev, ...result.items]);
            }

            setTotal(result.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible de charger l'historique");
        } finally {
            setIsLoading(false);
        }
    };

    const loadMore = () => {
        loadHistory(history.length);
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'create': return 'Création';
            case 'update': return 'Modification';
            case 'delete': return 'Suppression';
            case 'statusChange': return 'Changement de statut';
            case 'comment': return 'Commentaire';
            default: return 'Action inconnue';
        }
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'create':
                return <Badge variant="success">Création</Badge>;
            case 'update':
                return <Badge variant="warning">Modification</Badge>;
            case 'delete':
                return <Badge variant="destructive">Suppression</Badge>;
            case 'statusChange':
                return <Badge variant="default">Statut</Badge>;
            case 'comment':
                return <Badge variant="outline">Commentaire</Badge>;
            default:
                return <Badge>Inconnu</Badge>;
        }
    };

    const getTargetLabel = (item: ChangeHistoryItem) => {
        switch (item.targetType) {
            case 'attribution':
                return `Affectation ${item.details.roomName ? `- Salle ${item.details.roomName}` : ''}`;
            case 'planning':
                return 'Planning';
            case 'supervisor':
                return 'Superviseur';
            case 'annotation':
                return 'Annotation';
            default:
                return 'Cible inconnue';
        }
    };

    const formatDate = (date: string | Date) => {
        const d = new Date(date);
        return d.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderChangeDetails = (item: ChangeHistoryItem) => {
        switch (item.action) {
            case 'statusChange':
                return (
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Changement de statut</p>
                        {item.details.previous && (
                            <p className="text-sm">
                                De: <span className="font-medium">{item.details.previous}</span>
                            </p>
                        )}
                        {item.details.current && (
                            <p className="text-sm">
                                À: <span className="font-medium">{item.details.current}</span>
                            </p>
                        )}
                        {item.details.comment && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm">
                                "{item.details.comment}"
                            </div>
                        )}
                    </div>
                );

            case 'create':
            case 'update':
            case 'delete':
                return (
                    <div className="space-y-1">
                        <p className="text-sm font-medium">
                            {getActionLabel(item.action)} de {getTargetLabel(item).toLowerCase()}
                        </p>
                        {item.targetType === 'attribution' && (
                            <div className="text-sm">
                                {item.details.surgeonName && (
                                    <p>Chirurgien: <span className="font-medium">{item.details.surgeonName}</span></p>
                                )}
                                {item.details.roomName && (
                                    <p>Salle: <span className="font-medium">{item.details.roomName}</span></p>
                                )}
                            </div>
                        )}
                        {item.details.comment && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-md text-sm">
                                "{item.details.comment}"
                            </div>
                        )}
                    </div>
                );

            case 'comment':
                return (
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Commentaire ajouté</p>
                        <div className="p-2 bg-gray-50 rounded-md text-sm">
                            "{item.details.comment}"
                        </div>
                    </div>
                );

            default:
                return <p className="text-sm">Détails non disponibles</p>;
        }
    };

    return (
        <Card className="p-5">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <History size={20} />
                    <h2 className="text-xl font-semibold">Historique des modifications</h2>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-1"
                >
                    <Filter size={16} />
                    Filtres
                    {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </Button>
            </div>

            {showFilters && (
                <div className="mb-4 p-3 border rounded-md space-y-3">
                    <h3 className="font-medium text-sm">Filtrer par type d'action</h3>
                    <div className="flex flex-wrap gap-2">
                        {['create', 'update', 'delete', 'statusChange', 'comment'].map(actionType => (
                            <Badge
                                key={actionType}
                                variant={filters.actionTypes.includes(actionType) ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => {
                                    setFilters(prev => {
                                        if (prev.actionTypes.includes(actionType)) {
                                            return {
                                                ...prev,
                                                actionTypes: prev.actionTypes.filter(t => t !== actionType)
                                            };
                                        } else {
                                            return {
                                                ...prev,
                                                actionTypes: [...prev.actionTypes, actionType]
                                            };
                                        }
                                    });
                                }}
                            >
                                {getActionLabel(actionType)}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm mb-4">
                    {error}
                </div>
            )}

            {history.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    {isLoading ? 'Chargement de l\'historique...' : 'Aucune modification enregistrée'}
                </div>
            ) : (
                <div className="space-y-3">
                    <Accordion type="multiple" className="w-full">
                        {history.map((item, index) => (
                            <AccordionItem key={item.id} value={item.id} className="border-b border-gray-200 py-2">
                                <AccordionTrigger className="flex justify-between items-center w-full text-left p-2 hover:bg-gray-50 rounded-md">
                                    <div className="flex items-center gap-3">
                                        {getActionBadge(item.action)}
                                        <div className="text-sm">
                                            <span className="font-medium">{getTargetLabel(item)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <User size={14} />
                                            {item.userName}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {formatDate(item.timestamp)}
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-2 py-3">
                                    {renderChangeDetails(item)}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    {history.length < total && (
                        <div className="flex justify-center mt-4">
                            <Button
                                variant="outline"
                                onClick={loadMore}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Chargement...' : 'Voir plus'}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
} 