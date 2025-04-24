import React, { useState, useEffect } from 'react';
import {
    AnyRule,
    RuleType,
    RulePriority
} from '../types/rule';
import {
    getRuleTypeLabel,
    getRulePriorityLabel,
    getRulePriorityColor
} from '../services/ruleService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RulesListProps {
    rules: AnyRule[];
    loading: boolean;
    onRuleSelect?: (rule: AnyRule) => void;
    onRuleToggleStatus?: (ruleId: string, isActive: boolean) => Promise<void>;
    onRuleDelete?: (ruleId: string) => Promise<void>;
    onAddNewRule?: (type: RuleType) => void;
    className?: string;
}

export const RulesList: React.FC<RulesListProps> = ({
    rules,
    loading,
    onRuleSelect,
    onRuleToggleStatus,
    onRuleDelete,
    onAddNewRule,
    className = ''
}) => {
    // État pour les filtres
    const [filters, setFilters] = useState<{
        search: string;
        type: RuleType | '';
        priority: RulePriority | '';
        status: boolean | null;
    }>({
        search: '',
        type: '',
        priority: '',
        status: null
    });

    // État pour le tri
    const [sortField, setSortField] = useState<keyof AnyRule>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // État pour la règle sélectionnée
    const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

    // Confirmation de suppression
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

    // Fonction de filtrage des règles
    const getFilteredRules = (): AnyRule[] => {
        return rules.filter(rule => {
            // Filtre par texte de recherche
            if (filters.search && !rule.name.toLowerCase().includes(filters.search.toLowerCase()) &&
                !rule.description.toLowerCase().includes(filters.search.toLowerCase())) {
                return false;
            }

            // Filtre par type
            if (filters.type && rule.type !== filters.type) {
                return false;
            }

            // Filtre par priorité
            if (filters.priority && rule.priority !== filters.priority) {
                return false;
            }

            // Filtre par statut
            if (filters.status !== null && rule.isActive !== filters.status) {
                return false;
            }

            return true;
        });
    };

    // Fonction de tri des règles
    const getSortedRules = (filteredRules: AnyRule[]): AnyRule[] => {
        return [...filteredRules].sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            } else if (aValue instanceof Date && bValue instanceof Date) {
                return sortDirection === 'asc'
                    ? aValue.getTime() - bValue.getTime()
                    : bValue.getTime() - aValue.getTime();
            } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                return sortDirection === 'asc'
                    ? (aValue ? 1 : 0) - (bValue ? 1 : 0)
                    : (bValue ? 1 : 0) - (aValue ? 1 : 0);
            }

            return 0;
        });
    };

    // Gérer le changement de tri
    const handleSort = (field: keyof AnyRule) => {
        if (field === sortField) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Gérer le changement de filtre textuel
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
    };

    // Gérer le changement de filtre de type
    const handleTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, type: e.target.value as RuleType | '' }));
    };

    // Gérer le changement de filtre de priorité
    const handlePriorityFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, priority: e.target.value as RulePriority | '' }));
    };

    // Gérer le changement de filtre de statut
    const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setFilters(prev => ({
            ...prev,
            status: value === '' ? null : value === 'active'
        }));
    };

    // Gérer la sélection d'une règle
    const handleRuleClick = (rule: AnyRule) => {
        setSelectedRuleId(rule.id);
        if (onRuleSelect) {
            onRuleSelect(rule);
        }
    };

    // Gérer le changement de statut d'une règle
    const handleToggleStatus = async (rule: AnyRule, e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRuleToggleStatus) {
            try {
                await onRuleToggleStatus(rule.id, !rule.isActive);
            } catch (error) {
                console.error('Erreur lors du changement de statut:', error);
            }
        }
    };

    // Gérer la demande de suppression d'une règle
    const handleDeleteClick = (ruleId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirmation(ruleId);
    };

    // Confirmer la suppression d'une règle
    const confirmDelete = async (ruleId: string) => {
        if (onRuleDelete) {
            try {
                await onRuleDelete(ruleId);
                setDeleteConfirmation(null);
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
            }
        }
    };

    // Annuler la suppression
    const cancelDelete = () => {
        setDeleteConfirmation(null);
    };

    // Obtenir les règles filtrées et triées
    const filteredAndSortedRules = getSortedRules(getFilteredRules());

    return (
        <div className={`bg-white shadow rounded-lg ${className}`}>
            {/* En-tête avec filtres */}
            <div className="border-b border-gray-200 p-4">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Règles de planning</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {/* Recherche */}
                    <div>
                        <label htmlFor="search" className="sr-only">Recherche</label>
                        <input
                            id="search"
                            type="text"
                            placeholder="Rechercher..."
                            value={filters.search}
                            onChange={handleSearchChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Filtre par type */}
                    <div>
                        <label htmlFor="typeFilter" className="sr-only">Type</label>
                        <select
                            id="typeFilter"
                            value={filters.type}
                            onChange={handleTypeFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Tous les types</option>
                            {Object.values(RuleType).map(type => (
                                <option key={type} value={type}>{getRuleTypeLabel(type)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtre par priorité */}
                    <div>
                        <label htmlFor="priorityFilter" className="sr-only">Priorité</label>
                        <select
                            id="priorityFilter"
                            value={filters.priority}
                            onChange={handlePriorityFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Toutes les priorités</option>
                            {Object.values(RulePriority).map(priority => (
                                <option key={priority} value={priority}>{getRulePriorityLabel(priority)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtre par statut */}
                    <div>
                        <label htmlFor="statusFilter" className="sr-only">Statut</label>
                        <select
                            id="statusFilter"
                            value={filters.status === null ? '' : filters.status ? 'active' : 'inactive'}
                            onChange={handleStatusFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Tous les statuts</option>
                            <option value="active">Actives</option>
                            <option value="inactive">Inactives</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Boutons d'action */}
            {onAddNewRule && (
                <div className="p-4 border-b border-gray-200">
                    <div className="flex flex-wrap gap-2">
                        {Object.values(RuleType).map(type => (
                            <button
                                key={type}
                                onClick={() => onAddNewRule(type)}
                                className="px-3 py-1 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                Ajouter {getRuleTypeLabel(type)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Liste des règles */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="p-6 text-center">
                        <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
                        <p className="mt-2 text-gray-500">Chargement des règles...</p>
                    </div>
                ) : filteredAndSortedRules.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                        {filters.search || filters.type || filters.priority || filters.status !== null
                            ? 'Aucune règle ne correspond aux filtres sélectionnés.'
                            : 'Aucune règle définie. Cliquez sur "Ajouter" pour créer une nouvelle règle.'}
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center">
                                        Nom
                                        {sortField === 'name' && (
                                            <span className="ml-1">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('type')}
                                >
                                    <div className="flex items-center">
                                        Type
                                        {sortField === 'type' && (
                                            <span className="ml-1">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('priority')}
                                >
                                    <div className="flex items-center">
                                        Priorité
                                        {sortField === 'priority' && (
                                            <span className="ml-1">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('validFrom')}
                                >
                                    <div className="flex items-center">
                                        Valide du
                                        {sortField === 'validFrom' && (
                                            <span className="ml-1">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('isActive')}
                                >
                                    <div className="flex items-center">
                                        Statut
                                        {sortField === 'isActive' && (
                                            <span className="ml-1">
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAndSortedRules.map(rule => (
                                <tr
                                    key={rule.id}
                                    onClick={() => handleRuleClick(rule)}
                                    className={`${selectedRuleId === rule.id ? 'bg-blue-50' : 'hover:bg-gray-50'} cursor-pointer`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                                        <div className="text-sm text-gray-500 truncate max-w-xs">{rule.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                            {getRuleTypeLabel(rule.type)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRulePriorityColor(rule.priority)}`}>
                                            {getRulePriorityLabel(rule.priority)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {format(new Date(rule.validFrom), 'dd/MM/yyyy', { locale: fr })}
                                        {rule.validTo && ` - ${format(new Date(rule.validTo), 'dd/MM/yyyy', { locale: fr })}`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${rule.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {rule.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {onRuleToggleStatus && (
                                            <button
                                                onClick={(e) => handleToggleStatus(rule, e)}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                            >
                                                {rule.isActive ? 'Désactiver' : 'Activer'}
                                            </button>
                                        )}
                                        {onRuleDelete && deleteConfirmation !== rule.id && (
                                            <button
                                                onClick={(e) => handleDeleteClick(rule.id, e)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Supprimer
                                            </button>
                                        )}
                                        {deleteConfirmation === rule.id && (
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        confirmDelete(rule.id);
                                                    }}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Confirmer
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        cancelDelete();
                                                    }}
                                                    className="text-gray-600 hover:text-gray-900"
                                                >
                                                    Annuler
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}; 