"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeftIcon, SaveIcon, Loader2, AlertTriangleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { fetchTemplate, updateTemplate } from '@/services/simulationTemplateService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Catégories communes pour les templates
const TEMPLATE_CATEGORIES = [
    'Vacances scolaires',
    'Effectif réduit',
    'Planning été',
    'Congés exceptionnels',
    'Événement spécial',
    'Formation',
    'Autre'
];

export default function EditTemplatePage() {
    const router = useRouter();
    const params = useParams();
    const templateId = params?.templateId as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        isPublic: false,
        parametersJson: {
            startDate: '',
            endDate: '',
            userIds: [],
            siteIds: [],
            ruleIds: [],
            options: {
                ignoreLeaves: false,
                prioritizeExistingAssignments: true,
                balanceWorkload: true
            }
        }
    });

    useEffect(() => {
        const loadTemplate = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const template = await fetchTemplate(templateId);

                // Normaliser les options pour s'assurer qu'elles existent
                const options = template.parametersJson.options || {
                    ignoreLeaves: false,
                    prioritizeExistingAssignments: true,
                    balanceWorkload: true
                };

                setFormData({
                    name: template.name,
                    description: template.description || '',
                    category: template.category || '',
                    isPublic: template.isPublic || false,
                    parametersJson: {
                        ...template.parametersJson,
                        options
                    }
                });
            } catch (err: any) {
                setError(err.message || 'Erreur lors du chargement du template');
                toast.error('Erreur lors du chargement du template');
            } finally {
                setIsLoading(false);
            }
        };

        if (templateId) {
            loadTemplate();
        }
    }, [templateId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleParametersChange = (key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            parametersJson: {
                ...prev.parametersJson,
                [key]: value
            }
        }));
    };

    const handleOptionsChange = (key: string, value: boolean) => {
        setFormData(prev => ({
            ...prev,
            parametersJson: {
                ...prev.parametersJson,
                options: {
                    ...prev.parametersJson.options,
                    [key]: value
                }
            }
        }));
    };

    const handleCategoryChange = (value: string) => {
        setFormData(prev => ({ ...prev, category: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Le nom du template est requis');
            return;
        }

        setIsSubmitting(true);

        try {
            await updateTemplate(templateId, {
                name: formData.name,
                description: formData.description,
                category: formData.category,
                isPublic: formData.isPublic,
                parametersJson: formData.parametersJson
            });

            toast.success('Template mis à jour avec succès');
            router.push('/admin/simulations/templates');
        } catch (error: any) {
            toast.error(`Erreur lors de la mise à jour du template: ${error.message}`);
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

    if (error) {
        return (
            <div className="container p-4 mx-auto flex flex-col items-center justify-center min-h-[60vh]">
                <AlertTriangleIcon className="h-10 w-10 text-red-500 mb-4" />
                <h2 className="text-xl font-bold mb-2">Erreur</h2>
                <p className="text-red-500 mb-4">{error}</p>
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
                        <CardTitle>Modifier le Template</CardTitle>
                        <CardDescription>
                            Mettez à jour votre template de simulation pour le planning
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom du template *</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ex: Planning vacances d'été"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Décrivez le but et les caractéristiques de ce template"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Catégorie</Label>
                            <Select value={formData.category} onValueChange={handleCategoryChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez une catégorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TEMPLATE_CATEGORIES.map(category => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isPublic"
                                    checked={formData.isPublic}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: !!checked }))}
                                />
                                <Label htmlFor="isPublic" className="text-sm font-normal">
                                    Rendre ce template public (visible et utilisable par tous les utilisateurs)
                                </Label>
                            </div>
                        </div>

                        <div className="border rounded-md p-4 mt-4">
                            <h3 className="text-md font-medium mb-3">Paramètres par défaut</h3>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Date de début</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={formData.parametersJson.startDate || ''}
                                            onChange={(e) => handleParametersChange('startDate', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">Date de fin</Label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            value={formData.parametersJson.endDate || ''}
                                            onChange={(e) => handleParametersChange('endDate', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Options de génération</Label>
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="ignoreLeaves"
                                                checked={formData.parametersJson.options?.ignoreLeaves || false}
                                                onCheckedChange={(checked) => handleOptionsChange('ignoreLeaves', !!checked)}
                                            />
                                            <Label htmlFor="ignoreLeaves" className="text-sm font-normal">
                                                Ignorer les congés existants
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="prioritizeExistingAssignments"
                                                checked={formData.parametersJson.options?.prioritizeExistingAssignments !== false}
                                                onCheckedChange={(checked) => handleOptionsChange('prioritizeExistingAssignments', !!checked)}
                                            />
                                            <Label htmlFor="prioritizeExistingAssignments" className="text-sm font-normal">
                                                Prioriser les affectations existantes
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="balanceWorkload"
                                                checked={formData.parametersJson.options?.balanceWorkload !== false}
                                                onCheckedChange={(checked) => handleOptionsChange('balanceWorkload', !!checked)}
                                            />
                                            <Label htmlFor="balanceWorkload" className="text-sm font-normal">
                                                Équilibrer la charge de travail
                                            </Label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" type="button" onClick={() => router.push('/admin/simulations/templates')}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mise à jour...
                                </>
                            ) : (
                                <>
                                    <SaveIcon className="mr-2 h-4 w-4" /> Enregistrer les modifications
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
} 