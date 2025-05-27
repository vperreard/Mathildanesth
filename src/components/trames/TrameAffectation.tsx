'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerComponent } from '@/components/ui/date-picker';
import { toast } from 'sonner';

// Types pour le template de données
export type PeriodeType = 'HEBDOMADAIRE' | 'BI_HEBDOMADAIRE' | 'MENSUEL';

export interface Affectation {
    id: string;
    userId: number;
    periodeType: PeriodeType;
    dateDebut: Date;
    dateFin: Date;
    motif: string;
    isRecurrent: boolean;
}

export interface TrameAffectationProps {
    onSave: (trameModele: Affectation[]) => void;
    initialData?: Affectation[];
}

export const TrameAffectation: React.FC<TrameAffectationProps> = ({ onSave, initialData = [] }) => {
    const [affectations, setAffectations] = useState<Affectation[]>(initialData);
    const [selectedPeriode, setSelectedPeriode] = useState<PeriodeType>('HEBDOMADAIRE');
    const [dateDebut, setDateDebut] = useState<Date | null>(null);
    const [dateFin, setDateFin] = useState<Date | null>(null);
    const [motif, setMotif] = useState('');

    const handleAddAffectation = () => {
        if (!dateDebut || !dateFin || !motif) {
            toast.error('Veuillez remplir tous les champs obligatoires');
            return;
        }

        const newAffectation: Affectation = {
            id: Math.random().toString(36).substr(2, 9),
            userId: 1, // À remplacer par l'ID de l'utilisateur connecté
            periodeType: selectedPeriode,
            dateDebut,
            dateFin,
            motif,
            isRecurrent: false,
        };

        setAffectations([...affectations, newAffectation]);
        setMotif('');
    };

    const handleSave = () => {
        onSave(affectations);
        toast.success('TrameModele d\'affectation sauvegardée avec succès');
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Gestion des trameModeles d'affectation</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                            value={selectedPeriode}
                            onValueChange={(value: PeriodeType) => setSelectedPeriode(value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une période" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="HEBDOMADAIRE">Hebdomadaire</SelectItem>
                                <SelectItem value="BI_HEBDOMADAIRE">Bi-hebdomadaire</SelectItem>
                                <SelectItem value="MENSUEL">Mensuel</SelectItem>
                            </SelectContent>
                        </Select>

                        <DatePickerComponent
                            selected={dateDebut}
                            onSelect={setDateDebut}
                            placeholder="Date de début"
                        />

                        <DatePickerComponent
                            selected={dateFin}
                            onSelect={setDateFin}
                            placeholder="Date de fin"
                        />
                    </div>

                    <div className="flex gap-4">
                        <Input
                            value={motif}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMotif(e.target.value)}
                            placeholder="Motif de l'affectation"
                            className="flex-1"
                        />
                        <Button onClick={handleAddAffectation}>Ajouter</Button>
                    </div>

                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Affectations enregistrées</h3>
                        <div className="space-y-2">
                            {affectations.map((affectation) => (
                                <div
                                    key={affectation.id}
                                    className="p-3 bg-gray-100 rounded-lg flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-medium">{affectation.motif}</p>
                                        <p className="text-sm text-gray-600">
                                            {affectation.periodeType} - Du {affectation.dateDebut.toLocaleDateString()} au{' '}
                                            {affectation.dateFin.toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                            setAffectations(affectations.filter((a) => a.id !== affectation.id))
                                        }
                                    >
                                        Supprimer
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button onClick={handleSave}>Sauvegarder la trameModele</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}; 