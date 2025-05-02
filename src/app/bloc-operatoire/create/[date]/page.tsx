'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, AlertCircle, Calendar, Check } from 'lucide-react';
import { blocPlanningService } from '@/services/blocPlanningService';
import { BlocDayPlanning, OperatingRoom, BlocSector, SupervisionRule } from '@/types/bloc-planning-types';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import BlocPlanningEditor from '../../components/BlocPlanningEditor';
import { Skeleton } from '@/components/ui/skeleton';
import { v4 as uuidv4 } from 'uuid';

export default function CreateBlocPlanningPage() {
    const params = useParams();
    const router = useRouter();
    const [date, setDate] = useState<Date | null>(null);
    const [planning, setPlanning] = useState<BlocDayPlanning | null>(null);
    const [salles, setSalles] = useState<OperatingRoom[]>([]);
    const [secteurs, setSecteurs] = useState<BlocSector[]>([]);
    const [rules, setRules] = useState<SupervisionRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Récupérer la date de l'URL
    useEffect(() => {
        if (params.date) {
            try {
                const parsedDate = parse(params.date as string, 'yyyy-MM-dd', new Date());
                setDate(parsedDate);
            } catch (err) {
                setError("Format de date invalide");
                console.error("Erreur de parsing de date:", err);
            }
        }
    }, [params.date]);

    // Charger les données et initialiser un nouveau planning
    useEffect(() => {
        const loadData = async () => {
            if (!date) return;

            setLoading(true);
            setError(null);

            try {
                // Charger les données nécessaires
                const formattedDate = format(date, 'yyyy-MM-dd');

                // Vérifier si un planning existe déjà pour cette date
                const existingPlanning = await blocPlanningService.getDayPlanning(formattedDate);

                if (existingPlanning) {
                    setError("Un planning existe déjà pour cette date. Utilisez l'option d'édition.");
                    setTimeout(() => {
                        router.push(`/bloc-operatoire/edit/${formattedDate}`);
                    }, 2000);
                    return;
                }

                // Créer un nouveau planning
                const newPlanning: BlocDayPlanning = {
                    id: uuidv4(),
                    date: formattedDate,
                    salles: [],
                    validationStatus: 'BROUILLON'
                };

                // Charger les autres données
                const [sallesData, secteursData, rulesData] = await Promise.all([
                    blocPlanningService.getAllOperatingRooms(),
                    blocPlanningService.getAllSectors(),
                    blocPlanningService.getAllSupervisionRules()
                ]);

                setPlanning(newPlanning);
                setSalles(sallesData);
                setSecteurs(secteursData);
                setRules(rulesData);
            } catch (err) {
                console.error("Erreur lors du chargement des données:", err);
                setError("Erreur lors du chargement des données. Veuillez réessayer.");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [date, router]);

    // Gestion de la sauvegarde
    const handleSavePlanning = async (updatedPlanning: BlocDayPlanning) => {
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            await blocPlanningService.saveDayPlanning(updatedPlanning);
            setSuccessMessage("Planning créé avec succès");
            setPlanning(updatedPlanning);

            // Rediriger après 1.5 secondes
            setTimeout(() => {
                router.push('/bloc-operatoire');
            }, 1500);
        } catch (err) {
            console.error("Erreur lors de la création du planning:", err);
            setError("Erreur lors de la création du planning. Veuillez réessayer.");
        } finally {
            setSaving(false);
        }
    };

    // Titre de la page et formatage de la date pour l'affichage
    const formattedDateDisplay = date ? format(date, 'EEEE d MMMM yyyy', { locale: fr }) : '';

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/bloc-operatoire">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Retour au planning
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold mt-2">Création de Planning</h1>
                    <p className="text-muted-foreground">
                        {formattedDateDisplay}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="default" disabled={loading || saving} onClick={() => planning && handleSavePlanning(planning)}>
                        {saving ? (
                            <>Enregistrement...</>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Enregistrer
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {successMessage && (
                <Alert variant="success">
                    <Check className="h-4 w-4" />
                    <AlertTitle>Succès</AlertTitle>
                    <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
            )}

            {/* Contenu principal */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        Nouveau planning du {formattedDateDisplay}
                    </CardTitle>
                    <CardDescription>
                        Créez le planning du bloc opératoire pour cette journée
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-full max-w-md" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    ) : (
                        <BlocPlanningEditor
                            date={date!}
                            planning={planning}
                            salles={salles}
                            secteurs={secteurs}
                            rules={rules}
                            onPlanningChange={setPlanning}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 