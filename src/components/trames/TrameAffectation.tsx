'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerComponent } from '@/components/ui/date-picker';
import { toast } from 'sonner';

// Types pour le modèle de données
export type PeriodeType = 'HEBDOMADAIRE' | 'BI_HEBDOMADAIRE' | 'MENSUEL';

export interface Garde/Vacation {
    id: string;
    userId: number;
    periodeType: PeriodeType;
    dateDebut: Date;
    dateFin: Date;
    motif: string;
    isRecurrent: boolean;
}

export interface TrameAffectationProps {
    onSave: (tableau de service: Garde/Vacation[]) => void;
    initialData?: Garde/Vacation[];
}

export const TrameAffectation: React.FC<TrameAffectationProps> = ({ onSave, initialData = [] }) => {
    const [gardes/vacations, setAffectations] = useState<Garde/Vacation[]>(initialData);
    const [selectedPeriode, setSelectedPeriode] = useState<PeriodeType>('HEBDOMADAIRE');
    const [dateDebut, setDateDebut] = useState<Date | null>(null);
    const [dateFin, setDateFin] = useState<Date | null>(null);
    const [motif, setMotif] = useState('');

    const handleAddAffectation = () => {
        if (!dateDebut || !dateFin || !motif) {
            toast.error('Veuillez remplir tous les champs obligatoires');
            return;
        }

        const newAffectation: Garde/Vacation = {
            id: Math.random().toString(36).substr(2, 9),
            userId: 1, // À remplacer par l'ID de l'utilisateur connecté
            periodeType: selectedPeriode,
            dateDebut,
            dateFin,
            motif,
            isRecurrent: false,
        };

        setAffectations([...gardes/vacations, newAffectation]);
        setMotif('');
    };

    const handleSave = () => {
        onSave(gardes/vacations);
        toast.success('Tableau de service d\'garde/vacation sauvegardée avec succès');
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Gestion des tableaux de service d'garde/vacation</CardTitle>
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
                            placeholder="Motif de l'garde/vacation"
                            className="flex-1"
                        />
                        <Button onClick={handleAddAffectation}>Ajouter</Button>
                    </div>

                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Gardes/Vacations enregistrées</h3>
                        <div className="space-y-2">
                            {gardes/vacations.map((garde/vacation) => (
                                <div
                                    key={garde/vacation.id}
                                    className="p-3 bg-gray-100 rounded-lg flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-medium">{garde/vacation.motif}</p>
                                        <p className="text-sm text-gray-600">
                                            {garde/vacation.periodeType} - Du {garde/vacation.dateDebut.toLocaleDateString()} au{' '}
                                            {garde/vacation.dateFin.toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() =>
                                            setAffectations(gardes/vacations.filter((a) => a.id !== garde/vacation.id))
                                        }
                                    >
                                        Supprimer
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button onClick={handleSave}>Sauvegarder la tableau de service</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}; 