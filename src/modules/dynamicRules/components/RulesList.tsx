import React, { useState, useEffect, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import {
    ScheduleRule,
    ScheduleRulePriority
} from '../models/ScheduleRule';
import { Rule, RuleType, RulePriority } from '../types/rule';
import { RuleEngineService } from '../services/ruleEngineService';

interface RulesListProps {
    onEdit: (rule: ScheduleRule) => void;
    onDelete: (id: string) => void;
    onToggleActive: (id: string, isActive: boolean) => void;
    onEditRule: (rule: Rule) => void;
    onCreateRule: () => void;
    onViewDetails?: (rule: Rule) => void;
    onDeleteRule?: (ruleId: string) => void;
}

/**
 * Composant d'affichage et de gestion de la liste des règles
 */
const RulesList: React.FC<RulesListProps> = ({
    onEdit,
    onDelete,
    onToggleActive,
    onEditRule,
    onCreateRule,
    onViewDetails,
    onDeleteRule
}) => {
    const router = useRouter();
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // États pour le filtrage et le tri
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [sortField, setSortField] = useState<keyof Rule>('priority');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [showInactiveRules, setShowInactiveRules] = useState(false);

    const ruleEngineService = RuleEngineService.getInstance();

    // Chargement initial des règles
    useEffect(() => {
        loadRules();
    }, []);

    // Fonction pour charger les règles
    const loadRules = async () => {
        try {
            setLoading(true);
            setError(null);
            const allRules = ruleEngineService.getAllRules();
            setRules(allRules);
        } catch (err) {
            setError('Erreur lors du chargement des règles: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setLoading(false);
        }
    };

    // Application des filtres et du tri
    const filteredAndSortedRules = useMemo(() => {
        // Filtrer par terme de recherche, type et statut d'activité
        const filtered = rules.filter(rule => {
            const matchesSearch = !searchTerm ||
                rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (rule.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (rule.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));

            const matchesType = !selectedType || rule.type === selectedType;

            const matchesActive = showInactiveRules || rule.isActive;

            return matchesSearch && matchesType && matchesActive;
        });

        // Appliquer le tri
        const sorted = [...filtered].sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            // Gestion de cas spéciaux
            if (sortField === 'createdAt' || sortField === 'updatedAt') {
                const aDate = aValue instanceof Date ? aValue : new Date(aValue as string);
                const bDate = bValue instanceof Date ? bValue : new Date(bValue as string);
                return sortDirection === 'asc' ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime();
            }

            // Tri standard
            if (aValue === bValue) return 0;

            if (sortDirection === 'asc') {
                return aValue < bValue ? -1 : 1;
            } else {
                return aValue > bValue ? -1 : 1;
            }
        });

        return sorted;
    }, [rules, searchTerm, selectedType, sortField, sortDirection, showInactiveRules]);

    // Fonction pour changer le tri
    const handleSortChange = (field: keyof Rule) => {
        if (field === sortField) {
            // Inverser la direction si on clique sur le même champ
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc'); // Par défaut en ordre décroissant
        }
    };

    // Fonction pour supprimer une règle
    const handleDeleteRule = async (ruleId: string) => {
        if (!onDeleteRule) return;

        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette règle?')) {
            try {
                setLoading(true);
                onDeleteRule(ruleId); // Appel du callback pour la suppression
                const removed = ruleEngineService.removeRule(ruleId);
                if (removed) {
                    await loadRules(); // Recharger la liste après suppression
                } else {
                    setError("Impossible de supprimer la règle. Elle n'existe pas ou a déjà été supprimée.");
                }
            } catch (err) {
                setError('Erreur lors de la suppression: ' + (err instanceof Error ? err.message : String(err)));
            } finally {
                setLoading(false);
            }
        }
    };

    // Fonction pour obtenir la couleur de la priorité
    const getPriorityColor = (priority: ScheduleRulePriority) => {
        switch (priority) {
            case ScheduleRulePriority.CRITICAL:
                return 'bg-red-500';
            case ScheduleRulePriority.HIGH:
                return 'bg-orange-500';
            case ScheduleRulePriority.MEDIUM:
                return 'bg-yellow-500';
            case ScheduleRulePriority.LOW:
            default:
                return 'bg-blue-500';
        }
    };

    // Formatage de la date
    const formatDate = (date: Date) => {
        return format(date, 'dd MMM yyyy', { locale: fr });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Règles de planification</h2>
                <Button
                    onClick={() => router.push('/admin/planning médical-rules/nouveau')}
                    variant="default"
                >
                    Nouvelle règle
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Priorité</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Validité</TableHead>
                        <TableHead>Date de création</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rules.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                Aucune règle n'a été créée. Cliquez sur "Nouvelle règle" pour commencer.
                            </TableCell>
                        </TableRow>
                    ) : (
                        rules.map((rule) => (
                            <TableRow key={rule.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{rule.name}</span>
                                        {rule.description && (
                                            <span className="text-xs text-gray-500">{rule.description}</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={getPriorityColor(rule.priority as ScheduleRulePriority)}>
                                        {rule.priority}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={rule.isActive ? 'default' : 'outline'}>
                                        {rule.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span>Du {formatDate(rule.validFrom)}</span>
                                    {rule.validTo && (
                                        <span className="block text-xs">
                                            au {formatDate(rule.validTo)}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {rule.createdAt && formatDate(rule.createdAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onToggleActive(rule.id as string, !rule.isActive)}
                                        >
                                            {rule.isActive ? 'Désactiver' : 'Activer'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onEdit(rule as ScheduleRule)}
                                        >
                                            Modifier
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => onDelete(rule.id as string)}
                                        >
                                            Supprimer
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export { RulesList };
export default RulesList; 