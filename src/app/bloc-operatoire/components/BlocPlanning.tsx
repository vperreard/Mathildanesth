'use client';

import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Settings } from 'lucide-react';

/**
 * Composant de planning du bloc opératoire
 * 
 * Ce composant permet de visualiser et gérer les plannings du bloc opératoire.
 * Il s'agit d'une version initiale qui sera enrichie au fur et à mesure du développement.
 */
export default function BlocPlanning() {
    const [date, setDate] = useState<Date>(new Date());
    const [view, setView] = useState<string>('day');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <Select value={view} onValueChange={setView}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Vue" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="day">Vue journalière</SelectItem>
                        <SelectItem value="week">Vue hebdomadaire</SelectItem>
                        <SelectItem value="month">Vue mensuelle</SelectItem>
                    </SelectContent>
                </Select>

                <div className="space-x-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/admin/bloc-operatoire">
                            <Settings className="h-4 w-4 mr-2" />
                            Administration
                        </Link>
                    </Button>
                </div>
            </div>

            <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-700">
                    Le module de planning du bloc opératoire est en cours de développement.
                    Commencez par configurer les salles et secteurs dans la section administration.
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base">Calendrier</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(newDate) => newDate && setDate(newDate)}
                            className="rounded-md border"
                        />
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => setDate(new Date())}>
                            Aujourd'hui
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Planning du {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="p-8 border rounded-md flex flex-col items-center justify-center bg-muted/10">
                            <p className="text-muted-foreground text-center mb-4">
                                Pour commencer à utiliser le planning du bloc opératoire,
                                configurez d'abord les salles et secteurs dans l'interface d'administration.
                            </p>
                            <Button asChild>
                                <Link href="/admin/bloc-operatoire">
                                    Aller à l'administration
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}