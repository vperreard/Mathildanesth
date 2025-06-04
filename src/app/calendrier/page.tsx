'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Calendar, CalendarCheck, Clock } from 'lucide-react';

export default function CalendrierPage() {
    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Calendar className="h-8 w-8 text-blue-600" />
                    Calendrier Médical
                </h1>
                <p className="text-gray-600 mt-2">
                    Visualisation du planning et des congés
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarCheck className="h-5 w-5 text-green-600" />
                            Planning Personnel
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">
                            Votre planning personnel et vos affectations
                        </p>
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                                📅 Fonctionnalité en cours de développement
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-600" />
                            Planning Équipe
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">
                            Planning collectif de votre équipe
                        </p>
                        <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                            <p className="text-sm text-orange-800">
                                👥 Fonctionnalité en cours de développement
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-purple-600" />
                            Congés et Absences
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">
                            Gestion des congés et absences
                        </p>
                        <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm text-purple-800">
                                🏖️ Fonctionnalité en cours de développement
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Informations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                                ✅ Les APIs de planning fonctionnent correctement
                            </p>
                            <p className="text-sm text-gray-600">
                                ✅ L'authentification est opérationnelle
                            </p>
                            <p className="text-sm text-gray-600">
                                🔄 Interface utilisateur en cours de finalisation
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}