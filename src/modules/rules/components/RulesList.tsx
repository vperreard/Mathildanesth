import React from 'react';
import { Rule, RuleType } from '../types/rule';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface RulesListProps {
    rules: Rule[];
    onEditRule: (rule: Rule) => void;
    onDeleteRule: (ruleId: string) => void;
    onToggleRuleStatus: (ruleId: string, enabled: boolean) => void;
}

// Fonctions locales simples
const getRuleTypeLabelLocal = (type: RuleType) => type;
const getRulePriorityLabelLocal = (priority: number) => `${priority}`;
const getRulePriorityColorLocal = (priority: number): string => {
    if (priority > 75) return 'bg-red-100 text-red-800';
    if (priority > 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
};

export const RulesList: React.FC<RulesListProps> = ({ rules, onEditRule, onDeleteRule, onToggleRuleStatus }) => {
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Priorité</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rules.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                                Aucune règle configurée
                            </TableCell>
                        </TableRow>
                    ) : (
                        rules.map(rule => (
                            <TableRow key={rule.id}>
                                <TableCell className="font-medium">{rule.name}</TableCell>
                                <TableCell>{getRuleTypeLabelLocal(rule.type as RuleType)}</TableCell>
                                <TableCell>
                                    <Badge className={getRulePriorityColorLocal(rule.priority || 0)}>
                                        {getRulePriorityLabelLocal(rule.priority || 0)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={rule.enabled ? 'success' : 'secondary'}>
                                        {rule.enabled ? 'Actif' : 'Inactif'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onToggleRuleStatus(rule.id, !rule.enabled)}
                                        className="px-2"
                                    >
                                        {rule.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEditRule(rule)}
                                        className="px-2"
                                    >
                                        <Edit size={16} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onDeleteRule(rule.id)}
                                        className="px-2 text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}; 