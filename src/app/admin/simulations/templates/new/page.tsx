"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeftIcon, SaveIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createTemplate } from '@/services/simulationTemplateService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Catégories communes pour les modèles
const TEMPLATE_CATEGORIES = [
    'Vacances scolaires',
    'Effectif réduit',
    'Planning été',
    'Congés exceptionnels',
    'Événement spécial',
    'Formation',
    'Autre'
];

export default function NewTemplatePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
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
            toast.error('Le nom du modèle est requis');
            return;
        }

        setIsSubmitting(true);

        try {
            await createTemplate({
                name: formData.name,
                description: formData.description,
                category: formData.category,
                isPublic: formData.isPublic,
                parametersJson: formData.parametersJson
            });

            toast.success('Modèle créé avec succès');
            router.push('/admin/simulations/modèles');
        } catch (error: any) {
            toast.error(`Erreur lors de la création du modèle: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container p-4 mx-auto max-w-4xl">
            <Link href="/admin/simulations/modèles" className="inline-flex items-center text-sm text-primary hover:underline mb-4">
                <ArrowLeftIcon className="mr-2 h-4 w-4" />
                Retour à la liste des modèles
            </Link>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Nouveau Modèle de Simulation</CardTitle>
                        <CardDescription>
                            Créez un modèle réutilisable pour vos scénarios de simulation de planning
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom du modèle *</Label>
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
                                placeholder="Décrivez le but et les caractéristiques de ce modèle"
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
                                    Rendre ce modèle public (visible et utilisable par tous les utilisateurs)
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
                                            value={formData.parametersJson.startDate}
                                            onChange={(e) => handleParametersChange('startDate', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">Date de fin</Label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            value={formData.parametersJson.endDate}
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
                                                checked={formData.parametersJson.options.ignoreLeaves}
                                                onCheckedChange={(checked) => handleOptionsChange('ignoreLeaves', !!checked)}
                                            />
                                            <Label htmlFor="ignoreLeaves" className="text-sm font-normal">
                                                Ignorer les congés existants
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="prioritizeExistingAssignments"
                                                checked={formData.parametersJson.options.prioritizeExistingAssignments}
                                                onCheckedChange={(checked) => handleOptionsChange('prioritizeExistingAssignments', !!checked)}
                                            />
                                            <Label htmlFor="prioritizeExistingAssignments" className="text-sm font-normal">
                                                Prioriser les gardes/vacations existantes
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="balanceWorkload"
                                                checked={formData.parametersJson.options.balanceWorkload}
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
                        <Button variant="outline" type="button" onClick={() => router.push('/admin/simulations/modèles')}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création...
                                </>
                            ) : (
                                <>
                                    <SaveIcon className="mr-2 h-4 w-4" /> Créer le modèle
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
} 