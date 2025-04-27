'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlanningGenerator } from '../../../services/planningGenerator';
import PlanningValidator from '../../../components/PlanningValidator';
import {
    Assignment,
    AssignmentType,
    GenerationParameters,
    RuleViolation,
    ValidationResult
} from '../../../types/assignment';
import { RulesConfiguration, defaultRulesConfiguration, FatigueConfig, defaultFatigueConfig } from '../../../types/rules';
import { User } from '../../../types/user';

// Données fictives pour démonstration - à remplacer par des appels API réels
const mockUsers: User[] = [
    {
        id: 1,
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@hopital.fr',
        login: 'jdupont',
        role: 'USER',
        professionalRole: 'MAR',
        actif: true
    },
    {
        id: 2,
        nom: 'Martin',
        prenom: 'Sophie',
        email: 'sophie.martin@hopital.fr',
        login: 'smartin',
        role: 'USER',
        professionalRole: 'MAR',
        actif: true
    },
    {
        id: 3,
        nom: 'Bernard',
        prenom: 'Philippe',
        email: 'philippe.bernard@hopital.fr',
        login: 'pbernard',
        role: 'USER',
        professionalRole: 'MAR',
        actif: true
    }
];

const PlanningGeneratorPage: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [generating, setGenerating] = useState<boolean>(false);
    const [generated, setGenerated] = useState<boolean>(false);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
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
    const [rulesConfig, setRulesConfig] = useState<RulesConfiguration>(defaultRulesConfiguration);
    const [fatigueConfig, setFatigueConfig] = useState<FatigueConfig>(defaultFatigueConfig);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);

    // Générer le planning
    const generatePlanning = async () => {
        setLoading(true);
        setGenerating(true);

        try {
            // Dans un environnement réel, récupérer les utilisateurs et les affectations existantes via API
            const users = mockUsers;
            const existingAssignments: Assignment[] = [];

            // Initialiser le générateur de planning
            const generator = new PlanningGenerator(parameters, rulesConfig, fatigueConfig);
            await generator.initialize(users, existingAssignments);

            // Générer le planning complet
            const validationResult = await generator.generateFullPlanning();

            // Récupérer les résultats
            const results = generator.getResults();
            const allAssignments = [
                ...results.gardes,
                ...results.astreintes,
                ...results.consultations,
                ...results.blocs
            ];

            // Mettre à jour l'état
            setAssignments(allAssignments);
            setValidationResult(validationResult);
            setGenerated(true);
        } catch (error) {
            console.error('Erreur lors de la génération du planning:', error);
            // Afficher une notification d'erreur
        } finally {
            setLoading(false);
            setGenerating(false);
        }
    };

    // Résoudre une violation manuellement
    const handleResolveViolation = (violation: RuleViolation, assignmentIds?: string[]) => {
        if (!assignmentIds || assignmentIds.length === 0) return;

        // Dans un environnement réel, ouvrir un modal d'édition ou rediriger vers une page d'édition
        alert(`Résolution manuelle de la violation: ${violation.message}`);
    };

    // Approuver le planning généré
    const handleApprove = () => {
        // Dans un environnement réel, sauvegarder les assignations et rediriger
        alert('Planning approuvé et sauvegardé !');

        // Rediriger vers la vue du planning
        router.push('/planning/view');
    };

    // Régénérer le planning
    const handleRegenerate = () => {
        setGenerated(false);
        generatePlanning();
    };

    // Formater la date pour l'affichage
    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString('fr-FR');
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Générateur de planning</h1>

            {!generated ? (
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Paramètres de génération</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date de début
                            </label>
                            <input
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date de fin
                            </label>
                            <input
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
                                            if (e.target.checked) {
                                                setParameters({
                                                    ...parameters,
                                                    etapesActives: [...parameters.etapesActives, type]
                                                });
                                            } else {
                                                setParameters({
                                                    ...parameters,
                                                    etapesActives: parameters.etapesActives.filter(t => t !== type)
                                                });
                                            }
                                        }}
                                        className="rounded text-blue-600"
                                    />
                                    <span>{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Niveau d'optimisation
                        </label>
                        <select
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
                            <span>Conserver les affectations existantes</span>
                        </label>
                    </div>

                    <div className="mb-6">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={parameters.appliquerPreferencesPersonnelles}
                                onChange={(e) => setParameters({
                                    ...parameters,
                                    appliquerPreferencesPersonnelles: e.target.checked
                                })}
                                className="rounded text-blue-600"
                            />
                            <span>Appliquer les préférences personnelles</span>
                        </label>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <button
                            type="button"
                            className="text-blue-600 hover:text-blue-800"
                            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        >
                            {showAdvancedOptions ? 'Masquer les options avancées' : 'Afficher les options avancées'}
                        </button>
                    </div>

                    {showAdvancedOptions && (
                        <div className="border-t pt-4 mb-6">
                            <h3 className="text-lg font-medium mb-3">Pondérations</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Poids de l'équité: {parameters.poidsEquite}
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={parameters.poidsEquite}
                                        onChange={(e) => setParameters({
                                            ...parameters,
                                            poidsEquite: parseFloat(e.target.value)
                                        })}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Poids des préférences: {parameters.poidsPreference}
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={parameters.poidsPreference}
                                        onChange={(e) => setParameters({
                                            ...parameters,
                                            poidsPreference: parseFloat(e.target.value)
                                        })}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Poids de la qualité de vie: {parameters.poidsQualiteVie}
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={parameters.poidsQualiteVie}
                                        onChange={(e) => setParameters({
                                            ...parameters,
                                            poidsQualiteVie: parseFloat(e.target.value)
                                        })}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="button"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                            onClick={generatePlanning}
                            disabled={loading}
                        >
                            {loading ? 'Génération en cours...' : 'Générer le planning'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Récapitulatif de génération</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div className="border rounded p-3">
                                <div className="text-sm text-gray-500">Période</div>
                                <div>{formatDate(parameters.dateDebut)} - {formatDate(parameters.dateFin)}</div>
                            </div>

                            <div className="border rounded p-3">
                                <div className="text-sm text-gray-500">Étapes générées</div>
                                <div>{parameters.etapesActives.join(', ')}</div>
                            </div>

                            <div className="border rounded p-3">
                                <div className="text-sm text-gray-500">Assignations générées</div>
                                <div>{assignments.length}</div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>
                                Optimisation: {parameters.niveauOptimisation},
                                {parameters.conserverAffectationsExistantes ? ' avec' : ' sans'} conservation des affectations existantes,
                                {parameters.appliquerPreferencesPersonnelles ? ' avec' : ' sans'} préférences personnelles
                            </span>
                        </div>
                    </div>

                    <PlanningValidator
                        validationResult={validationResult}
                        assignments={assignments}
                        users={mockUsers}
                        onResolveViolation={handleResolveViolation}
                        onApprove={handleApprove}
                        onRegenerate={handleRegenerate}
                    />
                </div>
            )}
        </div>
    );
};

export default PlanningGeneratorPage; 