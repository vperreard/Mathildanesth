'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// import { PlanningGenerator } from '../../../services/planningGenerator'; // Supprimé
import { ApiService } from '../../../services/api';
import PlanningValidator from '../../../components/PlanningValidator';
import {
    Attribution,
    AssignmentType,
    GenerationParameters,
    RuleViolation,
    ValidationResult
} from '../../../types/attribution';
import { RulesConfiguration, defaultRulesConfiguration, FatigueConfig, defaultFatigueConfig } from '../../../types/rules';
import { User } from '../../../types/user';

const PlanningGeneratorPage: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [generating, setGenerating] = useState<boolean>(false);
    const [generated, setGenerated] = useState<boolean>(false);
    const [attributions, setAssignments] = useState<Attribution[]>([]);
    const [users, setUsers] = useState<User[]>([]); // Ajout pour stocker les utilisateurs
    const [validationResult, setValidationResult] = useState<ValidationResult>({
        valid: false,
        violations: [],
        metrics: {
            equiteScore: 0,
            fatigueScore: 0,
            satisfactionScore: 0
        }
    });
    const [parameters, setParameters] = useState<GenerationParameters>({
        dateDebut: new Date(),
        dateFin: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        etapesActives: [AssignmentType.GARDE, AssignmentType.CONSULTATION],
        conserverAffectationsExistantes: true,
        niveauOptimisation: 'standard',
        appliquerPreferencesPersonnelles: true,
        poidsEquite: 0.7,
        poidsPreference: 0.5,
        poidsQualiteVie: 0.8
    });
    const [rulesConfig, setRulesConfig] = useState<RulesConfiguration>(defaultRulesConfiguration); // Peut-être plus nécessaire côté client
    const [fatigueConfig, setFatigueConfig] = useState<FatigueConfig>(defaultFatigueConfig); // Peut-être plus nécessaire côté client
    const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false); // Options avancées peuvent être envoyées à l'API
    const [error, setError] = useState<string | null>(null);

    // Générer le planning via l'API
    const generatePlanning = async () => {
        setLoading(true);
        setGenerating(true);
        setError(null);

        try {
            const api = ApiService.getInstance();

            // Appeler le nouvel endpoint de génération
            const response = await api.generatePlanning(parameters);

            // Récupérer les utilisateurs actifs (pour l'affichage dans PlanningValidator)
            const activeUsers = await api.getActiveUsers();
            setUsers(activeUsers);

            // Mettre à jour l'état avec les résultats de l'API
            setAssignments(response.attributions);
            setValidationResult(response.validationResult);
            setGenerated(true);
        } catch (error) {
            console.error('Erreur lors de la génération du planning via API:', error);
            setError(error instanceof Error ? error.message : 'Une erreur API est survenue lors de la génération');
        } finally {
            setLoading(false);
            setGenerating(false);
        }
    };

    // Résoudre une violation manuellement (appel API validate)
    const handleResolveViolation = async (violation: RuleViolation, assignmentIds?: string[]) => {
        if (!assignmentIds || assignmentIds.length === 0) return;
        setError(null);

        try {
            const api = ApiService.getInstance();
            // L'API de validation devrait retourner le nouvel état de validation et potentiellement les gardes/vacations mises à jour
            const validationResponse = await api.validatePlanning(attributions);
            // Supposons que validatePlanning retourne { attributions: Attribution[], validationResult: ValidationResult }
            setAssignments(validationResponse.attributions); // Mettre à jour si l'API modifie les assignations
            setValidationResult(validationResponse.validationResult);
        } catch (error) {
            console.error('Erreur lors de la résolution de la violation via API:', error);
            setError(error instanceof Error ? error.message : 'Une erreur API est survenue lors de la validation');
        }
    };

    // Approuver le planning généré (appel API approve)
    const handleApprove = async () => {
        setError(null);
        try {
            const api = ApiService.getInstance();
            await api.approvePlanning(attributions);
            alert('Planning approuvé et sauvegardé via API !');
            router.push('/planning/view');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde du planning via API:', error);
            setError(error instanceof Error ? error.message : "Une erreur API est survenue lors de l'approbation");
        }
    };

    // Régénérer le planning
    const handleRegenerate = () => {
        setGenerated(false);
        setAssignments([]);
        setValidationResult({
            valid: false,
            violations: [],
            metrics: { equiteScore: 0, fatigueScore: 0, satisfactionScore: 0 }
        });
        // Pas besoin d'appeler generatePlanning ici, l'utilisateur cliquera sur le bouton
    };

    // Formater la date pour l'affichage
    const formatDate = (date: Date): string => {
        // Assurer que la date est bien un objet Date
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('fr-FR');
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Générateur de planning</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                    <p className="font-bold">Erreur</p>
                    <p>{error}</p>
                </div>
            )}

            {!generated ? (
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Paramètres de génération</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label htmlFor="dateDebut" className="block text-sm font-medium text-gray-700 mb-1">
                                Date de début
                            </label>
                            <input
                                id="dateDebut"
                                type="date"
                                className="w-full p-2 border rounded"
                                value={parameters.dateDebut.toISOString().split('T')[0]}
                                onChange={(e) => setParameters({
                                    ...parameters,
                                    dateDebut: new Date(e.target.value)
                                })}
                            />
                        </div>

                        <div>
                            <label htmlFor="dateFin" className="block text-sm font-medium text-gray-700 mb-1">
                                Date de fin
                            </label>
                            <input
                                id="dateFin"
                                type="date"
                                className="w-full p-2 border rounded"
                                value={parameters.dateFin.toISOString().split('T')[0]}
                                onChange={(e) => setParameters({
                                    ...parameters,
                                    dateFin: new Date(e.target.value)
                                })}
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Étapes à générer
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {Object.values(AssignmentType).map((type) => (
                                <label key={type} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={parameters.etapesActives.includes(type)}
                                        onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            setParameters(prevParams => ({
                                                ...prevParams,
                                                etapesActives: isChecked
                                                    ? [...prevParams.etapesActives, type]
                                                    : prevParams.etapesActives.filter(t => t !== type)
                                            }));
                                        }}
                                        className="rounded text-blue-600"
                                    />
                                    <span>{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <label htmlFor="niveauOptimisation" className="block text-sm font-medium text-gray-700 mb-1">
                            Niveau d'optimisation
                        </label>
                        <select
                            id="niveauOptimisation"
                            className="w-full p-2 border rounded"
                            value={parameters.niveauOptimisation}
                            onChange={(e) => setParameters({
                                ...parameters,
                                niveauOptimisation: e.target.value as 'rapide' | 'standard' | 'approfondi'
                            })}
                        >
                            <option value="rapide">Rapide</option>
                            <option value="standard">Standard</option>
                            <option value="approfondi">Approfondi</option>
                        </select>
                    </div>

                    <div className="mb-6">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={parameters.conserverAffectationsExistantes}
                                onChange={(e) => setParameters({
                                    ...parameters,
                                    conserverAffectationsExistantes: e.target.checked
                                })}
                                className="rounded text-blue-600"
                            />
                            <span>Conserver les gardes/vacations existantes</span>
                        </label>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={generatePlanning}
                            disabled={loading || generating}
                            className={`px-4 py-2 rounded ${loading || generating
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                        >
                            {generating ? 'Génération...' : (loading ? 'Chargement...' : 'Générer le planning')}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">Résultats de la génération</h2>
                        <div className="space-x-4">
                            <button
                                onClick={handleRegenerate}
                                disabled={loading || generating} // Désactiver pendant la régénération
                                className={`px-4 py-2 rounded ${loading || generating
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                                    }`}
                            >
                                Régénérer
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={loading || generating || !validationResult.valid} // Désactiver si invalide ou en cours
                                className={`px-4 py-2 rounded ${loading || generating || !validationResult.valid
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                    }`}
                            >
                                Approuver
                            </button>
                        </div>
                    </div>

                    <PlanningValidator
                        validationResult={validationResult}
                        attributions={attributions}
                        users={users} // Passer les utilisateurs récupérés
                        onResolveViolation={handleResolveViolation}
                        onApprove={handleApprove} // Conserver car le validateur peut avoir un bouton
                        onRegenerate={handleRegenerate} // Conserver car le validateur peut avoir un bouton
                    />

                    <div className="mt-8">
                        <h3 className="text-lg font-semibold mb-4">Gardes/Vacations générées ({attributions.length})</h3>
                        <div className="overflow-x-auto max-h-96">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {attributions.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                                Aucune garde/vacation générée.
                                            </td>
                                        </tr>
                                    )}
                                    {attributions.map((attribution) => (
                                        <tr key={attribution.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(attribution.startDate)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {attribution.shiftType}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {/* Afficher nom/prénom si possible */}
                                                {users.find(u => u.id === attribution.userId)?.prenom} {users.find(u => u.id === attribution.userId)?.nom || attribution.userId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {attribution.status}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanningGeneratorPage; 