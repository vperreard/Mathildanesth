"use client";

import React, { useState, useEffect } from 'react';
import { logger } from "../../../../../lib/logger";
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, AlertTriangleIcon, CalendarIcon, UserIcon, UsersIcon, SettingsIcon, SaveIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { prepareTemplateForScenario, createScenarioFromTemplate, SimulationTemplate } from '@/services/simulationTemplateService';
import { UserSelect } from '@/components/utilisateurs/user-select';
import { SurgeonSelect } from '@/components/chirurgiens/surgeon-select';
import { User } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Type pour les chirurgiens
interface Surgeon {
    id: number;
    firstName: string;
    lastName: string;
    specialtyId?: number;
    specialty?: {
        id: number;
        name: string;
    };
}

export default function UseTemplatePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const templateId = searchParams?.get('id');

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [template, setTemplate] = useState<SimulationTemplate | null>(null);

    // Utilisateurs et chirurgiens
    const [users, setUsers] = useState<User[]>([]);
    const [surgeons, setSurgeons] = useState<Surgeon[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingSurgeons, setLoadingSurgeons] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        dates: {
            startDate: '',
            endDate: ''
        },
        absences: {
            userIds: [] as number[],
            surgeonIds: [] as number[]
        },
        options: {
            ignoreLeaves: false,
            prioritizeExistingAssignments: true,
            balanceWorkload: true
        }
    });

    // Charger les données du template
    useEffect(() => {
        const loadTemplate = async () => {
            if (!templateId) {
                setError('ID du template manquant');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const data = await prepareTemplateForScenario(templateId);
                setTemplate(data.template);

                // Initialiser le formulaire avec les données du template
                setFormData({
                    name: data.baseScenarioData.name,
                    description: data.baseScenarioData.description || '',
                    dates: {
                        startDate: data.baseScenarioData.parametersJson.startDate || '',
                        endDate: data.baseScenarioData.parametersJson.endDate || ''
                    },
                    absences: {
                        userIds: data.baseScenarioData.parametersJson.absentUserIds || [],
                        surgeonIds: data.baseScenarioData.parametersJson.absentSurgeonIds || []
                    },
                    options: {
                        ignoreLeaves: data.baseScenarioData.parametersJson.options?.ignoreLeaves || false,
                        prioritizeExistingAssignments: data.baseScenarioData.parametersJson.options?.prioritizeExistingAssignments !== false,
                        balanceWorkload: data.baseScenarioData.parametersJson.options?.balanceWorkload !== false
                    }
                });

                // Charger les utilisateurs et chirurgiens
                loadUsersAndSurgeons();
            } catch (err: unknown) {
                logger.error('Erreur lors du chargement du template:', { error: err });
                setError(err.message || 'Erreur lors du chargement du template');
                toast.error('Erreur lors du chargement du template');
            } finally {
                setIsLoading(false);
            }
        };

        loadTemplate();
    }, [templateId]);

    // Charger les utilisateurs et chirurgiens
    const loadUsersAndSurgeons = async () => {
        try {
            // Charger les utilisateurs
            setLoadingUsers(true);
            const usersResponse = await fetch('http://localhost:3000/api/utilisateurs');
            if (usersResponse.ok) {
                const userData = await usersResponse.json();
                setUsers(userData);
            }
            setLoadingUsers(false);

            // Charger les chirurgiens
            setLoadingSurgeons(true);
            const surgeonsResponse = await fetch('http://localhost:3000/api/chirurgiens');
            if (surgeonsResponse.ok) {
                const surgeonData = await surgeonsResponse.json();
                setSurgeons(surgeonData);
            }
            setLoadingSurgeons(false);
        } catch (error: unknown) {
            logger.error("Erreur lors du chargement des utilisateurs/chirurgiens:", { error: error });
            toast.error("Impossible de charger la liste des utilisateurs/chirurgiens");
        } finally {
            setLoadingUsers(false);
            setLoadingSurgeons(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            dates: {
                ...prev.dates,
                [name]: value
            }
        }));
    };

    const handleOptionChange = (name: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            options: {
                ...prev.options,
                [name]: checked
            }
        }));
    };

    const handleUserSelectionChange = (userIds: number[]) => {
        setFormData(prev => ({
            ...prev,
            absences: {
                ...prev.absences,
                userIds
            }
        }));
    };

    const handleSurgeonSelectionChange = (surgeonIds: number[]) => {
        setFormData(prev => ({
            ...prev,
            absences: {
                ...prev.absences,
                surgeonIds
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!templateId || !template) return;

        if (!formData.name.trim()) {
            toast.error('Le nom du scénario est requis');
            return;
        }

        if (!formData.dates.startDate || !formData.dates.endDate) {
            toast.error('Les dates de début et de fin sont requises');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await createScenarioFromTemplate(templateId, {
                name: formData.name,
                description: formData.description,
                dates: formData.dates,
                absences: formData.absences,
                options: formData.options
            });

            toast.success('Scénario créé avec succès');
            // Rediriger vers la page d'édition du scénario
            router.push(`/admin/simulations/${result.id}/edit`);
        } catch (err: unknown) {
            logger.error('Erreur lors de la création du scénario:', { error: err });
            toast.error(`Erreur lors de la création du scénario: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container p-4 mx-auto flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p>Chargement du template...</p>
            </div>
        );
    }

    if (error || !template) {
        return (
            <div className="container p-4 mx-auto flex flex-col items-center justify-center min-h-[60vh]">
                <AlertTriangleIcon className="h-10 w-10 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Erreur</h2>
                <p className="text-red-500 mb-4">{error || 'Modèle non trouvé'}</p>
                <Button onClick={() => router.push('/admin/simulations/templates')}>
                    Retour à la liste des templates
                </Button>
            </div>
        );
    }

    return (
        <div className="container p-4 mx-auto max-w-4xl">
            <Link href="/admin/simulations/templates" className="inline-flex items-center text-sm text-primary hover:underline mb-4">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Retour à la liste des templates
            </Link>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Personnaliser le Scénario</CardTitle>
                        <CardDescription>
                            Créez un scénario à partir du template <strong>{template.name}</strong>
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="mb-4">
                                <TabsTrigger value="general">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    Général
                                </TabsTrigger>
                                <TabsTrigger value="absences">
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    Absences
                                </TabsTrigger>
                                <TabsTrigger value="options">
                                    <SettingsIcon className="mr-2 h-4 w-4" />
                                    Options
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom du scénario *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Ex: Planning vacances d'été 2025"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Décrivez le but et les caractéristiques de ce scénario"
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Date de début *</Label>
                                        <Input
                                            id="startDate"
                                            name="startDate"
                                            type="date"
                                            value={formData.dates.startDate}
                                            onChange={handleDateChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">Date de fin *</Label>
                                        <Input
                                            id="endDate"
                                            name="endDate"
                                            type="date"
                                            value={formData.dates.endDate}
                                            onChange={handleDateChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="absences" className="space-y-5">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-medium mb-2">Personnel absent</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Sélectionnez les utilisateurs absents pour cette période
                                        </p>

                                        <UserSelect
                                            users={users}
                                            selectedUserIds={formData.absences.userIds}
                                            onChange={handleUserSelectionChange}
                                            loading={loadingUsers}
                                            placeholder="Sélectionner le personnel absent..."
                                            groupByRoles={true}
                                            filterByRoles={['MAR', 'IADE']}
                                        />
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium mb-2">Chirurgiens absents</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Sélectionnez les chirurgiens absents pour cette période
                                        </p>

                                        <SurgeonSelect
                                            surgeons={surgeons}
                                            selectedSurgeonIds={formData.absences.surgeonIds}
                                            onChange={handleSurgeonSelectionChange}
                                            loading={loadingSurgeons}
                                            placeholder="Sélectionner les chirurgiens absents..."
                                            groupBySpecialty={true}
                                        />
                                    </div>
                                </div>

                                {(formData.absences.userIds.length > 0 || formData.absences.surgeonIds.length > 0) && (
                                    <Alert className="mt-4 bg-blue-50 border-blue-200">
                                        <AlertTitle className="text-blue-800">
                                            {formData.absences.userIds.length + formData.absences.surgeonIds.length} personne(s) marquée(s) comme absente(s)
                                        </AlertTitle>
                                        <AlertDescription className="text-blue-700">
                                            La simulation tiendra compte de ces absences lors du calcul des affectations
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </TabsContent>

                            <TabsContent value="options" className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Options de génération</Label>
                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="ignoreLeaves"
                                                checked={formData.options.ignoreLeaves}
                                                onCheckedChange={(checked) => handleOptionChange('ignoreLeaves', !!checked)}
                                            />
                                            <Label htmlFor="ignoreLeaves" className="font-normal">
                                                Ignorer les congés existants
                                            </Label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="prioritizeExistingAssignments"
                                                checked={formData.options.prioritizeExistingAssignments}
                                                onCheckedChange={(checked) => handleOptionChange('prioritizeExistingAssignments', !!checked)}
                                            />
                                            <Label htmlFor="prioritizeExistingAssignments" className="font-normal">
                                                Prioriser les affectations existantes
                                            </Label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="balanceWorkload"
                                                checked={formData.options.balanceWorkload}
                                                onCheckedChange={(checked) => handleOptionChange('balanceWorkload', !!checked)}
                                            />
                                            <Label htmlFor="balanceWorkload" className="font-normal">
                                                Équilibrer la charge de travail
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>

                    <CardFooter className="flex justify-between">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => router.push('/admin/simulations/templates')}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>

                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création...
                                </>
                            ) : (
                                <>
                                    <SaveIcon className="mr-2 h-4 w-4" /> Créer le scénario
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
} 