"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusIcon, Search, BookmarkIcon, Trash2Icon, PencilIcon, CopyIcon, CalendarIcon, BarChart2Icon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Input from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { fetchTemplates, deleteTemplate, createScenarioFromTemplate, duplicateTemplate, SimulationTemplate } from '@/services/simulationTemplateService';
import { Label } from '@/components/ui/label';

export default function TemplatesPage() {
    const router = useRouter();
    const [modèles, setTemplates] = useState<SimulationTemplate[]>([]);
    const [filteredTemplates, setFilteredTemplates] = useState<SimulationTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'all' | 'my' | 'public'>('all');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // États pour la duplication
    const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
    const [templateToDuplicate, setTemplateToDuplicate] = useState<string | null>(null);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [isDuplicating, setIsDuplicating] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [modèles, searchTerm, categoryFilter, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadTemplates = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchTemplates();
            setTemplates(data);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des modèles';
            setError(errorMessage);
            toast.error('Erreur lors du chargement des modèles');
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...modèles];

        // Filtrer par onglet
        if (activeTab === 'my') {
            filtered = filtered.filter(modèle => !modèle.isPublic);
        } else if (activeTab === 'public') {
            filtered = filtered.filter(modèle => modèle.isPublic);
        }

        // Filtrer par catégorie
        if (categoryFilter) {
            filtered = filtered.filter(modèle => modèle.category === categoryFilter);
        }

        // Filtrer par terme de recherche
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                modèle =>
                    modèle.name.toLowerCase().includes(term) ||
                    (modèle.description && modèle.description.toLowerCase().includes(term))
            );
        }

        setFilteredTemplates(filtered);
    };

    const handleDeleteTemplate = async () => {
        if (!templateToDelete) return;

        setIsDeleting(true);
        try {
            await deleteTemplate(templateToDelete);
            setTemplates(prevTemplates => prevTemplates.filter(t => t.id !== templateToDelete));
            toast.success('Modèle supprimé avec succès');
            setDeleteDialogOpen(false);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            toast.error('Erreur lors de la suppression du modèle: ' + errorMessage);
        } finally {
            setIsDeleting(false);
            setTemplateToDelete(null);
        }
    };

    const handleDuplicateTemplate = async () => {
        if (!templateToDuplicate || !newTemplateName.trim()) return;

        setIsDuplicating(true);
        try {
            const newTemplate = await duplicateTemplate(templateToDuplicate, newTemplateName);
            setTemplates(prevTemplates => [...prevTemplates, newTemplate]);
            toast.success('Modèle dupliqué avec succès');
            setDuplicateDialogOpen(false);
            setNewTemplateName('');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            toast.error('Erreur lors de la duplication du modèle: ' + errorMessage);
        } finally {
            setIsDuplicating(false);
            setTemplateToDuplicate(null);
        }
    };

    const handleUseTemplate = async (templateId: string) => {
        try {
            toast.info('Création d\'un scénario à partir du modèle...');
            const scenario = await createScenarioFromTemplate(templateId);
            toast.success('Scénario créé avec succès');
            router.push(`/admin/simulations/${scenario.id}/edit`);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
            toast.error('Erreur lors de la création du scénario: ' + errorMessage);
        }
    };

    const getUniqueCategories = () => {
        const categories = new Set(modèles.map(t => t.category).filter(Boolean));
        return Array.from(categories) as string[];
    };

    const renderEmptyState = () => (
        <div className="flex flex-col items-center justify-center py-10 text-center">
            <BookmarkIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">Aucun modèle trouvé</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">
                {activeTab === 'all'
                    ? 'Vous n\'avez pas encore de modèles. Créez votre premier modèle pour faciliter la création de scénarios répétitifs.'
                    : activeTab === 'my'
                        ? 'Vous n\'avez pas encore créé de modèles personnels.'
                        : 'Aucun modèle public disponible.'}
            </p>
            <Button
                variant="default"
                size="sm"
                onClick={() => router.push('/admin/simulations/modèles/nouveau')}
            >
                <PlusIcon className="h-4 w-4 mr-2" />
                Créer un modèle
            </Button>
        </div>
    );

    return (
        <div className="container p-4 mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Modèles de Simulation</h1>
                    <p className="text-muted-foreground">
                        Gérez des configurations réutilisables pour vos simulations de planning
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/admin/simulations/modèles/stats')}
                    >
                        <BarChart2Icon className="h-4 w-4 mr-2" />
                        Statistiques
                    </Button>
                    <Button
                        variant="default"
                        onClick={() => router.push('/admin/simulations/modèles/nouveau')}
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Nouveau Modèle
                    </Button>
                </div>
            </div>

            <div className="mb-6">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'my' | 'public')}>
                    <div className="flex justify-between items-center mb-4">
                        <TabsList>
                            <TabsTrigger value="all">Tous les modèles</TabsTrigger>
                            <TabsTrigger value="my">Mes modèles</TabsTrigger>
                            <TabsTrigger value="public">Modèles publics</TabsTrigger>
                        </TabsList>

                        <div className="flex space-x-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <Select value={categoryFilter || ""} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Catégorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Toutes les catégories</SelectItem>
                                    {getUniqueCategories().map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <TabsContent value="all" className="mt-0">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredTemplates.length ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredTemplates.map((modèle) => (
                                    <TemplateCard
                                        key={modèle.id}
                                        modèle={modèle}
                                        onDelete={(id) => {
                                            setTemplateToDelete(id);
                                            setDeleteDialogOpen(true);
                                        }}
                                        onDuplicate={(id, name) => {
                                            setTemplateToDuplicate(id);
                                            setNewTemplateName(`Copie de ${name}`);
                                            setDuplicateDialogOpen(true);
                                        }}
                                        onUse={handleUseTemplate}
                                    />
                                ))}
                            </div>
                        ) : (
                            renderEmptyState()
                        )}
                    </TabsContent>

                    <TabsContent value="my" className="mt-0">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredTemplates.length ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredTemplates.map((modèle) => (
                                    <TemplateCard
                                        key={modèle.id}
                                        modèle={modèle}
                                        onDelete={(id) => {
                                            setTemplateToDelete(id);
                                            setDeleteDialogOpen(true);
                                        }}
                                        onDuplicate={(id, name) => {
                                            setTemplateToDuplicate(id);
                                            setNewTemplateName(`Copie de ${name}`);
                                            setDuplicateDialogOpen(true);
                                        }}
                                        onUse={handleUseTemplate}
                                    />
                                ))}
                            </div>
                        ) : (
                            renderEmptyState()
                        )}
                    </TabsContent>

                    <TabsContent value="public" className="mt-0">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredTemplates.length ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredTemplates.map((modèle) => (
                                    <TemplateCard
                                        key={modèle.id}
                                        modèle={modèle}
                                        onDelete={(id) => {
                                            setTemplateToDelete(id);
                                            setDeleteDialogOpen(true);
                                        }}
                                        onDuplicate={(id, name) => {
                                            setTemplateToDuplicate(id);
                                            setNewTemplateName(`Copie de ${name}`);
                                            setDuplicateDialogOpen(true);
                                        }}
                                        onUse={handleUseTemplate}
                                    />
                                ))}
                            </div>
                        ) : (
                            renderEmptyState()
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Dialogue de suppression */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmer la suppression</DialogTitle>
                        <DialogDescription>
                            Êtes-vous sûr de vouloir supprimer ce modèle ? Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex space-x-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteTemplate}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Suppression...
                                </>
                            ) : (
                                'Supprimer'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialogue de duplication */}
            <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Dupliquer le modèle</DialogTitle>
                        <DialogDescription>
                            Entrez un nom pour la copie du modèle.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="new-modèle-name" className="mb-2 block">Nom du nouveau modèle</Label>
                        <Input
                            id="new-modèle-name"
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            placeholder="Nom du modèle"
                            className="w-full"
                        />
                    </div>
                    <DialogFooter className="flex space-x-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={() => setDuplicateDialogOpen(false)}
                            disabled={isDuplicating}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleDuplicateTemplate}
                            disabled={isDuplicating || !newTemplateName.trim()}
                        >
                            {isDuplicating ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Duplication...
                                </>
                            ) : (
                                'Dupliquer'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

interface TemplateCardProps {
    modèle: SimulationTemplate;
    onDelete: (id: string) => void;
    onDuplicate: (id: string, name: string) => void;
    onUse: (id: string) => void;
}

function TemplateCard({ modèle, onDelete, onDuplicate, onUse }: TemplateCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">{modèle.name}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                            {modèle.description || 'Aucune description'}
                        </CardDescription>
                    </div>
                    {modèle.isPublic && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Public
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-muted-foreground mb-3">
                    <div className="flex items-center mb-1">
                        <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                        Créé le {new Date(modèle.createdAt).toLocaleDateString()}
                    </div>
                    {modèle.category && (
                        <Badge variant="secondary" className="mt-1">
                            {modèle.category}
                        </Badge>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(modèle.id)}
                    >
                        <Trash2Icon className="h-4 w-4" />
                    </Button>
                    <Link href={`/admin/simulations/modèles/${modèle.id}/edit`} passHref>
                        <Button variant="outline" size="sm">
                            <PencilIcon className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDuplicate(modèle.id, modèle.name)}
                    >
                        <CopyIcon className="h-4 w-4" />
                    </Button>
                </div>
                <Button variant="default" size="sm" onClick={() => onUse(modèle.id)}>
                    Utiliser
                </Button>
            </CardFooter>
        </Card>
    );
} 