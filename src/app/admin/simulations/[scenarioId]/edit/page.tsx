"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, Loader2, SaveIcon, AlertTriangleIcon } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface ScenarioData {
    name: string;
    description: string;
    parametersJson: string;
}

interface ScenarioFromAPI extends ScenarioData {
    id: string;
    createdAt: string;
    updatedAt: string;
    createdById: string;
}

export default function EditSimulationScenarioPage() {
    const router = useRouter();
    const params = useParams();
    const scenarioId = typeof params?.scenarioId === 'string' ? params.scenarioId : null;

    const [scenario, setScenario] = useState<ScenarioData>({
        name: '',
        description: '',
        parametersJson: '{}',
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const fetchScenario = useCallback(async () => {
        if (!scenarioId) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/simulations/${scenarioId}`);
            if (!res.ok) {
                let errorMessage = "Échec de la récupération du scénario";
                if (res.status === 404) errorMessage = "Scénario non trouvé.";
                try {
                    const errorData = await res.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = `Erreur ${res.status}: ${res.statusText}`;
                }
                throw new Error(errorMessage);
            }
            const data: ScenarioFromAPI = await res.json();
            setScenario({
                name: data.name,
                description: data.description || '',
                parametersJson: typeof data.parametersJson === 'string' ? data.parametersJson : JSON.stringify(data.parametersJson, null, 2),
            });
        } catch (err: any) {
            setError(err.message);
            toast.error("Erreur lors du chargement du scénario: " + err.message);
        } finally {
            setIsLoading(false);
        }
    }, [scenarioId]);

    useEffect(() => {
        if (scenarioId) {
            fetchScenario();
        } else {
            setIsLoading(false);
            setError("ID du scénario non trouvé dans l'URL.");
            toast.error("ID du scénario non trouvé. Impossible de charger les données.");
        }
    }, [fetchScenario, scenarioId]);

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!scenario.name.trim()) {
            errors.name = "Le nom est requis.";
        }
        try {
            JSON.parse(scenario.parametersJson);
        } catch (e) {
            errors.parametersJson = "Le JSON des paramètres est invalide.";
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validateForm()) {
            toast.warning("Veuillez corriger les erreurs dans le formulaire.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setValidationErrors({});

        try {
            const payload = {
                ...scenario,
                parametersJson: JSON.parse(scenario.parametersJson),
            };

            const res = await fetch(`/api/simulations/${scenarioId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                let errorMessage = "Échec de la mise à jour du scénario";
                try {
                    const errorData = await res.json();
                    if (errorData.errors) { // Zod validation errors
                        const backendErrors: Record<string, string> = {};
                        for (const issue of errorData.errors) {
                            if (issue.path && issue.path.length > 0) {
                                backendErrors[issue.path[0]] = issue.message;
                            }
                        }
                        setValidationErrors(backendErrors);
                        errorMessage = "Des erreurs de validation sont survenues.";
                    } else {
                        errorMessage = errorData.message || errorMessage;
                    }
                } catch (e) {
                    errorMessage = `Erreur ${res.status}: ${res.statusText}`;
                }
                throw new Error(errorMessage);
            }

            toast.success("Scénario mis à jour avec succès !");
            router.push('/admin/simulations');
        } catch (err: any) {
            setError(err.message);
            toast.error("Erreur lors de la mise à jour: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setScenario(prev => ({ ...prev, [name]: value }));
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-lg">Chargement du scénario...</p>
            </div>
        );
    }

    if (!scenarioId && !isLoading) {
        return (
            <div className="container mx-auto py-8 text-center">
                <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-500 text-lg">ID du scénario manquant. Impossible d'afficher la page.</p>
                <Link href="/admin/simulations" passHref>
                    <Button variant="outline" className="mt-4">
                        <ArrowLeftIcon className="mr-2 h-4 w-4" /> Retour à la liste
                    </Button>
                </Link>
            </div>
        );
    }

    if (error && !isSubmitting) {
        return (
            <div className="container mx-auto py-8 text-center">
                <AlertTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-500 text-lg">{error}</p>
                <Link href="/admin/simulations" passHref>
                    <Button variant="outline" className="mt-4 mr-2">
                        <ArrowLeftIcon className="mr-2 h-4 w-4" /> Retour à la liste
                    </Button>
                </Link>
                <Button onClick={fetchScenario} className="mt-4">
                    Réessayer
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 max-w-3xl">
            <Link href="/admin/simulations" className="inline-flex items-center text-sm text-primary hover:underline mb-6">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Retour à la liste des scénarios
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Modifier le Scénario de Simulation</CardTitle>
                    <CardDescription>Mettez à jour les détails de votre scénario de simulation.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        {error && isSubmitting && (
                            <div className="bg-red-50 border border-red-200 text-sm text-red-700 p-3 rounded-md">
                                <AlertTriangleIcon className="h-5 w-5 inline mr-2" />
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom du scénario</Label>
                            <Input
                                id="name"
                                name="name"
                                value={scenario.name}
                                onChange={handleInputChange}
                                placeholder="Ex: Simulation haute saison 2024"
                                className={validationErrors.name ? 'border-red-500' : ''}
                            />
                            {validationErrors.name && <p className="text-sm text-red-500">{validationErrors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optionnel)</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={scenario.description}
                                onChange={handleInputChange}
                                placeholder="Décrivez les objectifs ou les hypothèses de cette simulation."
                                rows={3}
                                className={validationErrors.description ? 'border-red-500' : ''}
                            />
                            {validationErrors.description && <p className="text-sm text-red-500">{validationErrors.description}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="parametersJson">Paramètres de simulation (JSON)</Label>
                            <Textarea
                                id="parametersJson"
                                name="parametersJson"
                                value={scenario.parametersJson}
                                onChange={handleInputChange}
                                placeholder='{
  "staffReductionPercentage": 10,
  "specificTeamOverrides": []
}'
                                rows={10}
                                className={`font-mono text-sm ${validationErrors.parametersJson ? 'border-red-500' : ''}`}
                            />
                            {validationErrors.parametersJson && <p className="text-sm text-red-500">{validationErrors.parametersJson}</p>}
                            <p className="text-xs text-gray-500">
                                Entrez les paramètres spécifiques pour cette simulation au format JSON.
                                Par exemple: <code>{`{"maxHoursPerWeek": 40, "preferredShift": "day"}`}</code>.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Link href="/admin/simulations" passHref legacyBehavior>
                            <Button type="button" variant="outline" disabled={isSubmitting}>
                                Annuler
                            </Button>
                        </Link>
                        <Button type="submit" disabled={isSubmitting || isLoading}>
                            {isSubmitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</>
                            ) : (
                                <><SaveIcon className="mr-2 h-4 w-4" /> Enregistrer les modifications</>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
} 