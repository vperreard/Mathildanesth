'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import BlocDayPlanningEditor from '../../components/BlocDayPlanningEditor';

export default function EditBlocPlanningPage() {
    const params = useParams();
    const router = useRouter();
    const [planningId, setPlanningId] = useState<string>('');

    useEffect(() => {
        if (params.id) {
            setPlanningId(params.id as string);
        }
    }, [params.id]);

    const handleSave = () => {
        // Redirige vers la page du planning après sauvegarde
        router.push('/bloc-operatoire/planning');
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center mb-6">
                <Button variant="outline" size="sm" onClick={handleCancel} className="mr-4">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Retour
                </Button>
                <h1 className="text-2xl font-bold">Édition du planning du bloc opératoire</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Modifier le planning</CardTitle>
                </CardHeader>
                <CardContent>
                    {planningId ? (
                        <BlocDayPlanningEditor
                            planningId={planningId}
                            onSave={handleSave}
                            onCancel={handleCancel}
                        />
                    ) : (
                        <div className="p-6 text-center">
                            <p className="text-muted-foreground">
                                Identification du planning en cours...
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 