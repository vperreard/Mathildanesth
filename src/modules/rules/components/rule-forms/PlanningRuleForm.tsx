import React, { useState } from "react";
import { AnyRule, PlanningRule, RuleType, RuleSeverity, RuleScope } from "../../types/rule";
import { ChevronDown, Info } from "lucide-react";

type PlanningRuleFormProps = {
    rule?: PlanningRule;
    onSave: (rule: AnyRule) => void;
    onCancel: () => void;
};

const PlanningRuleForm: React.FC<PlanningRuleFormProps> = ({
    rule,
    onSave,
    onCancel
}) => {
    const [formData, setFormData] = useState<PlanningRule>(
        rule || {
            id: "",
            name: "",
            description: "",
            type: RuleType.PLANNING,
            severity: RuleSeverity.MEDIUM,
            scope: RuleScope.GLOBAL,
            enabled: true,
            parameters: {},
            priority: 1,
            configuration: {},
            createdAt: new Date(),
            updatedAt: new Date(),
            planningConfig: {
                planningType: "HEBDOMADAIRE",
                maxLimit: 5,
                periodType: "WEEK",
                minLimit: 1,
                minPeriodType: "MONTH",
                applyToAllUsers: true,
                exceptions: "",
                strictEnforcement: false
            }
        }
    );

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        if (name.includes(".")) {
            const [parent, child] = name.split(".");
            setFormData((prev) => ({
                ...prev,
                [parent]: {
                    ...prev[parent as keyof PlanningRule],
                    [child]: value
                }
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleNumberChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;
        if (name.includes(".")) {
            const [parent, child] = name.split(".");
            setFormData((prev) => ({
                ...prev,
                [parent]: {
                    ...prev[parent as keyof PlanningRule],
                    [child]: parseInt(value) || 0
                }
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: parseInt(value) || 0
            }));
        }
    };

    const handleToggleChange = (field: string) => {
        if (field.includes(".")) {
            const [parent, child] = field.split(".");
            setFormData((prev) => {
                const parentObj = prev[parent as keyof PlanningRule] as Record<string, any>;
                return {
                    ...prev,
                    [parent]: {
                        ...parentObj,
                        [child]: !parentObj[child]
                    }
                };
            });
        } else {
            setFormData((prev) => ({
                ...prev,
                [field]: !prev[field as keyof typeof prev]
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                        Nom de la règle
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                        Type de planification
                    </label>
                    <select
                        name="planningConfig.planningType"
                        value={formData.planningConfig.planningType}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    >
                        <option value="HEBDOMADAIRE">Hebdomadaire</option>
                        <option value="MENSUEL">Mensuel</option>
                        <option value="JOURNALIER">Journalier</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                        Limite maximale d'affectations
                    </label>
                    <input
                        type="number"
                        name="planningConfig.maxLimit"
                        value={formData.planningConfig.maxLimit || 0}
                        onChange={handleNumberChange}
                        className="w-full p-2 border rounded"
                        min="0"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                        Type de période (maximum)
                    </label>
                    <select
                        name="planningConfig.periodType"
                        value={formData.planningConfig.periodType || ""}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    >
                        <option value="DAY">Jour</option>
                        <option value="WEEK">Semaine</option>
                        <option value="MONTH">Mois</option>
                        <option value="QUARTER">Trimestre</option>
                        <option value="YEAR">Année</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                        Limite minimale d'affectations
                    </label>
                    <input
                        type="number"
                        name="planningConfig.minLimit"
                        value={formData.planningConfig.minLimit || 0}
                        onChange={handleNumberChange}
                        className="w-full p-2 border rounded"
                        min="0"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                        Type de période (minimum)
                    </label>
                    <select
                        name="planningConfig.minPeriodType"
                        value={formData.planningConfig.minPeriodType || ""}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                    >
                        <option value="DAY">Jour</option>
                        <option value="WEEK">Semaine</option>
                        <option value="MONTH">Mois</option>
                        <option value="QUARTER">Trimestre</option>
                        <option value="YEAR">Année</option>
                    </select>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                    Description
                </label>
                <textarea
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    rows={3}
                />
            </div>

            <div className="mb-4">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                        Appliquer à tous les utilisateurs
                    </label>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={formData.planningConfig.applyToAllUsers || false}
                        onClick={() => handleToggleChange("planningConfig.applyToAllUsers")}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.planningConfig.applyToAllUsers ? "bg-blue-600" : "bg-gray-200"
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${formData.planningConfig.applyToAllUsers ? "translate-x-6" : "translate-x-1"
                                }`}
                            aria-hidden="true"
                        />
                    </button>
                </div>
            </div>

            {!formData.planningConfig.applyToAllUsers && (
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                        Exceptions (séparées par des virgules)
                    </label>
                    <textarea
                        name="planningConfig.exceptions"
                        value={formData.planningConfig.exceptions || ""}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                        rows={2}
                    />
                </div>
            )}

            <div className="mb-4">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                        Application stricte de la règle
                    </label>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={formData.planningConfig.strictEnforcement || false}
                        onClick={() => handleToggleChange("planningConfig.strictEnforcement")}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.planningConfig.strictEnforcement ? "bg-blue-600" : "bg-gray-200"
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${formData.planningConfig.strictEnforcement ? "translate-x-6" : "translate-x-1"
                                }`}
                            aria-hidden="true"
                        />
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">
                        Règle active
                    </label>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={formData.enabled}
                        onClick={() => handleToggleChange("enabled")}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.enabled ? "bg-blue-600" : "bg-gray-200"
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${formData.enabled ? "translate-x-6" : "translate-x-1"
                                }`}
                            aria-hidden="true"
                        />
                    </button>
                </div>
            </div>

            <div className="flex justify-end space-x-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700"
                >
                    Enregistrer
                </button>
            </div>
        </form>
    );
};

export default PlanningRuleForm; 