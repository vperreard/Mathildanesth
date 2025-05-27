'use client';

import React, { useState, useEffect } from 'react';
import { format, parse, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { Plus, Trash, Edit, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PublicHoliday, CreatePublicHolidayDTO, UpdatePublicHolidayDTO } from '@/modules/leaves/types/public-holiday';
import { publicHolidayService } from '@/modules/leaves/services/publicHolidayService';

export default function PublicHolidaysPage() {
    const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<CreatePublicHolidayDTO>({
        date: new Date(),
        name: '',
        description: '',
        isNational: true,
        country: 'FR'
    });
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
    const [regionFilter, setRegionFilter] = useState<string>('');

    // Charger les données
    const loadHolidays = async () => {
        setLoading(true);
        try {
            const filter = {
                year: yearFilter,
                region: regionFilter || undefined
            };
            const result = await publicHolidayService.getPublicHolidays(filter);
            setHolidays(result);
        } catch (error) {
            console.error('Erreur lors du chargement des jours fériés:', error);
            toast.error('Impossible de charger les jours fériés');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHolidays();
    }, [yearFilter, regionFilter, loadHolidays]);

    // Gérer la soumission du formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editMode && editId) {
                // Mise à jour
                const updateData: UpdatePublicHolidayDTO = {
                    id: editId,
                    ...formData
                };

                await publicHolidayService.updatePublicHoliday(updateData);
                toast.success('Jour férié mis à jour avec succès');
            } else {
                // Création
                await publicHolidayService.createPublicHoliday(formData);
                toast.success('Jour férié créé avec succès');
            }

            // Réinitialiser le formulaire et recharger les données
            resetForm();
            loadHolidays();
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            toast.error('Erreur lors de la sauvegarde du jour férié');
        }
    };

    // Réinitialiser le formulaire
    const resetForm = () => {
        setFormData({
            date: new Date(),
            name: '',
            description: '',
            isNational: true,
            country: 'FR'
        });
        setEditMode(false);
        setEditId(null);
        setShowForm(false);
    };

    // Éditer un jour férié
    const handleEdit = (holiday: PublicHoliday) => {
        const dateObj = parse(holiday.date, 'yyyy-MM-dd', new Date());

        setFormData({
            date: isValid(dateObj) ? dateObj : new Date(),
            name: holiday.name,
            description: holiday.description || '',
            isNational: holiday.isNational,
            regions: holiday.regions,
            country: holiday.country || 'FR'
        });

        setEditMode(true);
        setEditId(holiday.id);
        setShowForm(true);
    };

    // Supprimer un jour férié
    const handleDelete = async (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce jour férié ?')) {
            try {
                await publicHolidayService.deletePublicHoliday(id);
                toast.success('Jour férié supprimé avec succès');
                loadHolidays();
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                toast.error('Erreur lors de la suppression du jour férié');
            }
        }
    };

    // Recalculer les jours fériés pour une année
    const handleRecalculate = async () => {
        try {
            setLoading(true);
            await publicHolidayService.calculateFrenchHolidays(yearFilter);
            toast.success(`Jours fériés recalculés pour ${yearFilter}`);
            loadHolidays();
        } catch (error) {
            console.error('Erreur lors du recalcul des jours fériés:', error);
            toast.error('Erreur lors du recalcul des jours fériés');
        } finally {
            setLoading(false);
        }
    };

    // Colonnes pour le tableau
    const columns = [
        {
            header: 'Date',
            accessorKey: 'date',
            cell: ({ row }: { row: { original: PublicHoliday } }) => {
                const date = parse(row.original.date, 'yyyy-MM-dd', new Date());
                return format(date, 'dd MMMM yyyy', { locale: fr });
            }
        },
        {
            header: 'Nom',
            accessorKey: 'name',
        },
        {
            header: 'Description',
            accessorKey: 'description',
        },
        {
            header: 'National',
            accessorKey: 'isNational',
            cell: ({ row }: { row: { original: PublicHoliday } }) => (
                row.original.isNational ? 'Oui' : 'Non'
            )
        },
        {
            header: 'Actions',
            cell: ({ row }: { row: { original: PublicHoliday } }) => (
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(row.original)}
                    >
                        <Edit className="h-4 w-4 mr-1" /> Modifier
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(row.original.id as string)}
                    >
                        <Trash className="h-4 w-4 mr-1" /> Supprimer
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="container mx-auto py-6 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Gestion des jours fériés</h1>
                <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Ajouter un jour férié
                </Button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center space-x-4 mb-6">
                    <div className="flex items-center">
                        <label className="mr-2">Année:</label>
                        <Input
                            type="number"
                            value={yearFilter}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setYearFilter(Number(e.target.value))}
                            className="w-24"
                        />
                    </div>
                    <div className="flex items-center">
                        <label className="mr-2">Région:</label>
                        <Input
                            type="text"
                            value={regionFilter}
                            onChange={(e) => setRegionFilter(e.target.value)}
                            placeholder="ex: FR-ALSACE"
                            className="w-32"
                        />
                    </div>
                    <Button
                        variant="outline"
                        onClick={loadHolidays}
                    >
                        Filtrer
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleRecalculate}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" /> Recalculer les jours fériés
                    </Button>
                </div>

                <DataTable
                    columns={columns}
                    data={holidays}
                    loading={loading}
                />
            </div>

            {/* Formulaire d'ajout/modification */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editMode ? 'Modifier un jour férié' : 'Ajouter un jour férié'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Date</label>
                            <DatePicker
                                selected={formData.date instanceof Date ? formData.date : new Date()}
                                onChange={(date: Date) => setFormData({ ...formData, date })}
                                dateFormat="dd/MM/yyyy"
                                className="w-full"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Nom</label>
                            <Input
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nom du jour férié"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Description</label>
                            <Input
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Description (optionnelle)"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isNational"
                                checked={formData.isNational}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, isNational: checked as boolean })
                                }
                            />
                            <label htmlFor="isNational" className="text-sm font-medium">
                                Jour férié national
                            </label>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Pays</label>
                            <Input
                                value={formData.country || 'FR'}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                placeholder="Code pays (ex: FR)"
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={resetForm}>
                                Annuler
                            </Button>
                            <Button type="submit">
                                {editMode ? 'Mettre à jour' : 'Ajouter'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
} 