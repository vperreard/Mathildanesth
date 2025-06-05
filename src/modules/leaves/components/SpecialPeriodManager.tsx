import React, { useState, useEffect } from 'react';
import { logger } from "../../../lib/logger";
import {
    SpecialPeriodRule,
    SpecialPeriodRuleType,
    PriorityRule,
    PriorityRuleType
} from '../types/quota';
import { fetchSpecialPeriodRules, saveSpecialPeriodRule } from '../services/quotaService';

interface SpecialPeriodManagerProps {
    onSaveComplete?: () => void;
}

export const SpecialPeriodManager: React.FC<SpecialPeriodManagerProps> = ({
    onSaveComplete
}) => {
    // États pour la gestion du formulaire
    const [specialPeriods, setSpecialPeriods] = useState<SpecialPeriodRule[]>([]);
    const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // États pour le formulaire d'édition
    const [formData, setFormData] = useState<Partial<SpecialPeriodRule>>({
        name: '',
        description: '',
        periodType: SpecialPeriodRuleType.SUMMER,
        startDay: 1,
        startMonth: 7, // Juillet
        endDay: 31,
        endMonth: 8, // Août
        specificYear: new Date().getFullYear(),
        minimumQuotaGuaranteed: 10,
        maxSimultaneousAbsences: 5,
        priorityRules: [
            {
                id: crypto.randomUUID(),
                name: 'Ancienneté',
                type: PriorityRuleType.SENIORITY,
                weight: 1
            },
            {
                id: crypto.randomUUID(),
                name: 'Premier arrivé, premier servi',
                type: PriorityRuleType.FIRST_COME,
                weight: 0.5
            }
        ],
        isActive: true
    });

    // Charger les périodes spéciales au chargement du composant
    useEffect(() => {
        loadSpecialPeriods();
    }, []);

    // Charger les périodes spéciales
    const loadSpecialPeriods = async () => {
        setLoading(true);
        setError(null);

        try {
            const periods = await fetchSpecialPeriodRules();
            setSpecialPeriods(periods);

            // Sélectionner la première période s'il y en a
            if (periods.length > 0 && !selectedPeriodId) {
                setSelectedPeriodId(periods[0].id);
                setFormData(periods[0]);
            }
        } catch (err) {
            logger.error('Erreur lors du chargement des périodes spéciales :', err);
            setError(`Erreur: ${(err as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    // Sélectionner une période pour édition
    const handlePeriodSelect = (periodId: string) => {
        const selectedPeriod = specialPeriods.find(p => p.id === periodId);
        if (selectedPeriod) {
            setSelectedPeriodId(periodId);
            setFormData(selectedPeriod);
        }
    };

    // Créer une nouvelle période
    const handleCreateNew = () => {
        const newPeriod: Partial<SpecialPeriodRule> = {
            name: `Nouvelle période ${new Date().getFullYear()}`,
            description: '',
            periodType: SpecialPeriodRuleType.SUMMER,
            startDay: 1,
            startMonth: 7,
            endDay: 31,
            endMonth: 8,
            specificYear: new Date().getFullYear(),
            minimumQuotaGuaranteed: 10,
            maxSimultaneousAbsences: 5,
            priorityRules: [
                {
                    id: crypto.randomUUID(),
                    name: 'Ancienneté',
                    type: PriorityRuleType.SENIORITY,
                    weight: 1
                }
            ],
            isActive: true
        };

        setFormData(newPeriod);
        setSelectedPeriodId(null);
    };

    // Gestionnaire de changement pour les champs simples
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) :
                name === 'isActive' ? (value === 'true') : value
        }));
    };

    // Ajouter une règle de priorité
    const handleAddPriorityRule = () => {
        const newRule: PriorityRule = {
            id: crypto.randomUUID(),
            name: 'Nouvelle règle',
            type: PriorityRuleType.FIRST_COME,
            weight: 0.5
        };

        setFormData(prev => ({
            ...prev,
            priorityRules: [...(prev.priorityRules || []), newRule]
        }));
    };

    // Modifier une règle de priorité
    const handlePriorityRuleChange = (ruleId: string, field: keyof PriorityRule, value: any) => {
        setFormData(prev => ({
            ...prev,
            priorityRules: prev.priorityRules?.map(rule =>
                rule.id === ruleId ? { ...rule, [field]: value } : rule
            ) || []
        }));
    };

    // Supprimer une règle de priorité
    const handleDeletePriorityRule = (ruleId: string) => {
        setFormData(prev => ({
            ...prev,
            priorityRules: prev.priorityRules?.filter(rule => rule.id !== ruleId) || []
        }));
    };

    // Enregistrer la période
    const handleSave = async () => {
        if (!formData.name || !formData.startDay || !formData.startMonth || !formData.endDay || !formData.endMonth) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            // Si c'est une nouvelle période, s'assurer que l'ID n'est pas défini
            const dataToSave = selectedPeriodId ? formData : { ...formData, id: undefined };

            const savedPeriod = await saveSpecialPeriodRule(dataToSave);

            setSuccess(`Période "${savedPeriod.name}" enregistrée avec succès !`);

            // Recharger les périodes
            await loadSpecialPeriods();

            // Sélectionner la période enregistrée
            setSelectedPeriodId(savedPeriod.id);
            setFormData(savedPeriod);

            // Notifier le parent
            if (onSaveComplete) {
                onSaveComplete();
            }
        } catch (err) {
            logger.error('Erreur lors de l\'enregistrement de la période :', err);
            setError(`Erreur: ${(err as Error).message}`);
        } finally {
            setSaving(false);
        }
    };

    // Fonction pour obtenir un libellé pour le type de période
    const getPeriodTypeLabel = (type: SpecialPeriodRuleType): string => {
        const labels: Record<SpecialPeriodRuleType, string> = {
            [SpecialPeriodRuleType.SUMMER]: 'Été',
            [SpecialPeriodRuleType.WINTER]: 'Hiver',
            [SpecialPeriodRuleType.HOLIDAYS]: 'Vacances',
            [SpecialPeriodRuleType.CUSTOM]: 'Personnalisé'
        };

        return labels[type] || type;
    };

    // Fonction pour obtenir un libellé pour le type de règle de priorité
    const getPriorityRuleTypeLabel = (type: PriorityRuleType): string => {
        const labels: Record<PriorityRuleType, string> = {
            [PriorityRuleType.SENIORITY]: 'Ancienneté',
            [PriorityRuleType.FIRST_COME]: 'Premier arrivé',
            [PriorityRuleType.ROTATION]: 'Rotation',
            [PriorityRuleType.CHILDREN]: 'Enfants scolarisés',
            [PriorityRuleType.CUSTOM]: 'Personnalisé'
        };

        return labels[type] || type;
    };

    // Si chargement en cours
    if (loading) {
        return <div className="p-4 text-center">Chargement des périodes spéciales...</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Gestion des périodes spéciales</h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Liste des périodes */}
                <div className="md:col-span-1">
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={handleCreateNew}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Nouvelle période
                        </button>
                    </div>

                    <div className="overflow-y-auto max-h-96 border rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {specialPeriods.map(period => (
                                <li
                                    key={period.id}
                                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${selectedPeriodId === period.id ? 'bg-blue-50' : ''}`}
                                    onClick={() => handlePeriodSelect(period.id)}
                                >
                                    <div className="font-medium">{period.name}</div>
                                    <div className="text-sm text-gray-500">
                                        {getPeriodTypeLabel(period.periodType)}
                                        {period.specificYear ? ` ${period.specificYear}` : ''}
                                    </div>
                                    <div className="text-xs mt-1">
                                        <span className={period.isActive ? 'text-green-600' : 'text-red-600'}>
                                            {period.isActive ? 'Actif' : 'Inactif'}
                                        </span>
                                    </div>
                                </li>
                            ))}

                            {specialPeriods.length === 0 && (
                                <li className="px-4 py-3 text-gray-500 text-sm">
                                    Aucune période définie
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Formulaire d'édition */}
                <div className="md:col-span-3">
                    <form>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Nom */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nom*
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name || ''}
                                    onChange={handleInputChange}
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                            </div>

                            {/* Type de période */}
                            <div>
                                <label htmlFor="periodType" className="block text-sm font-medium text-gray-700 mb-1">
                                    Type de période*
                                </label>
                                <select
                                    id="periodType"
                                    name="periodType"
                                    value={formData.periodType || SpecialPeriodRuleType.SUMMER}
                                    onChange={handleInputChange}
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    {Object.values(SpecialPeriodRuleType).map(type => (
                                        <option key={type} value={type}>
                                            {getPeriodTypeLabel(type)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={2}
                                    value={formData.description || ''}
                                    onChange={handleInputChange}
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            {/* Date de début */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date de début*
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label htmlFor="startDay" className="sr-only">Jour</label>
                                        <input
                                            type="number"
                                            id="startDay"
                                            name="startDay"
                                            min="1"
                                            max="31"
                                            value={formData.startDay || 1}
                                            onChange={handleInputChange}
                                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Jour"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="startMonth" className="sr-only">Mois</label>
                                        <select
                                            id="startMonth"
                                            name="startMonth"
                                            value={formData.startMonth || 1}
                                            onChange={handleInputChange}
                                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        >
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                                <option key={`start-${month}`} value={month}>
                                                    {new Date(2000, month - 1, 1).toLocaleString('fr-FR', { month: 'long' })}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Date de fin */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date de fin*
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label htmlFor="endDay" className="sr-only">Jour</label>
                                        <input
                                            type="number"
                                            id="endDay"
                                            name="endDay"
                                            min="1"
                                            max="31"
                                            value={formData.endDay || 31}
                                            onChange={handleInputChange}
                                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Jour"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="endMonth" className="sr-only">Mois</label>
                                        <select
                                            id="endMonth"
                                            name="endMonth"
                                            value={formData.endMonth || 1}
                                            onChange={handleInputChange}
                                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        >
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                                <option key={`end-${month}`} value={month}>
                                                    {new Date(2000, month - 1, 1).toLocaleString('fr-FR', { month: 'long' })}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Année spécifique */}
                            <div>
                                <label htmlFor="specificYear" className="block text-sm font-medium text-gray-700 mb-1">
                                    Année spécifique (optionnel)
                                </label>
                                <input
                                    type="number"
                                    id="specificYear"
                                    name="specificYear"
                                    value={formData.specificYear || ''}
                                    onChange={handleInputChange}
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Laisser vide pour récurrent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Laisser vide pour une période récurrente chaque année
                                </p>
                            </div>

                            {/* Statut actif/inactif */}
                            <div>
                                <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-1">
                                    Statut
                                </label>
                                <select
                                    id="isActive"
                                    name="isActive"
                                    value={formData.isActive === undefined ? 'true' : formData.isActive.toString()}
                                    onChange={handleInputChange}
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="true">Actif</option>
                                    <option value="false">Inactif</option>
                                </select>
                            </div>
                        </div>

                        <h3 className="text-lg font-medium text-gray-900 mb-4">Règles de quotas</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Quota minimum garanti */}
                            <div>
                                <label htmlFor="minimumQuotaGuaranteed" className="block text-sm font-medium text-gray-700 mb-1">
                                    Quota minimum garanti par personne (jours)
                                </label>
                                <input
                                    type="number"
                                    id="minimumQuotaGuaranteed"
                                    name="minimumQuotaGuaranteed"
                                    min="0"
                                    step="0.5"
                                    value={formData.minimumQuotaGuaranteed || 0}
                                    onChange={handleInputChange}
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            {/* Absences simultanées maximum */}
                            <div>
                                <label htmlFor="maxSimultaneousAbsences" className="block text-sm font-medium text-gray-700 mb-1">
                                    Absences simultanées maximum
                                </label>
                                <input
                                    type="number"
                                    id="maxSimultaneousAbsences"
                                    name="maxSimultaneousAbsences"
                                    min="0"
                                    value={formData.maxSimultaneousAbsences || 0}
                                    onChange={handleInputChange}
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <h3 className="text-lg font-medium text-gray-900 mb-4">Règles de priorité</h3>

                        <div className="mb-4">
                            <button
                                type="button"
                                onClick={handleAddPriorityRule}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                + Ajouter une règle
                            </button>
                        </div>

                        {formData.priorityRules && formData.priorityRules.length > 0 ? (
                            <div className="overflow-hidden border border-gray-200 rounded-md mb-6">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nom
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Poids
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {formData.priorityRules.map(rule => (
                                            <tr key={rule.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="text"
                                                        value={rule.name}
                                                        onChange={(e) => handlePriorityRuleChange(rule.id, 'name', e.target.value)}
                                                        className="block w-full border-0 p-0 focus:ring-0 text-sm"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <select
                                                        value={rule.type}
                                                        onChange={(e) => handlePriorityRuleChange(rule.id, 'type', e.target.value)}
                                                        className="block w-full border-0 bg-white p-0 focus:ring-0 text-sm"
                                                    >
                                                        {Object.values(PriorityRuleType).map(type => (
                                                            <option key={type} value={type}>
                                                                {getPriorityRuleTypeLabel(type)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.1"
                                                        value={rule.weight}
                                                        onChange={(e) => handlePriorityRuleChange(rule.id, 'weight', parseFloat(e.target.value))}
                                                        className="block w-full border-0 p-0 focus:ring-0 text-sm"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeletePriorityRule(rule.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Supprimer
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-gray-500 mb-6">
                                Aucune règle de priorité définie
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}; 