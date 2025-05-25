'use client';

import React from 'react';
import ReglesSupervisionAdmin from '../../admin/bloc-operatoire/components/ReglesSupervisionAdmin';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Button from '@/components/ui/button';
import { BadgeInfo, FileCode, ListFilter, Settings } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';

/**
 * Page des règles de supervision du bloc opératoire
 */
export default function ReglesSupervisionPage() {
    const router = useRouter();

    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Règles de Supervision</h1>
                    <p className="text-muted-foreground mt-1">
                        Gérez les règles qui contrôlent la supervision des salles d'opération par le personnel médical
                    </p>
                </div>

                <Button
                    variant="outline"
                    onClick={() => router.push('/bloc-operatoire')}
                >
                    Retour au Bloc Opératoire
                </Button>
            </div>

            <Separator className="my-6" />

            <Tabs defaultValue="regles" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="regles">
                        <ListFilter className="h-4 w-4 mr-2" />
                        Règles Actives
                    </TabsTrigger>
                    <TabsTrigger value="documentation">
                        <FileCode className="h-4 w-4 mr-2" />
                        Documentation
                    </TabsTrigger>
                    <TabsTrigger value="aide">
                        <BadgeInfo className="h-4 w-4 mr-2" />
                        Aide
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="regles" className="space-y-6">
                    <ReglesSupervisionAdmin />
                </TabsContent>

                <TabsContent value="documentation" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Documentation des Règles de Supervision</CardTitle>
                            <CardDescription>
                                Apprenez à configurer efficacement les règles de supervision pour votre établissement
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <h3 className="text-lg font-semibold">Types de règles</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>
                                    <strong>Règles basiques</strong> : S'appliquent à tous les secteurs.
                                    Définissent le nombre maximum de salles qu'un médecin anesthésiste-réanimateur (MAR) peut superviser.
                                </li>
                                <li>
                                    <strong>Règles spécifiques</strong> : S'appliquent à un secteur particulier.
                                    Peuvent définir des contraintes supplémentaires comme la supervision interne ou les salles contiguës.
                                </li>
                                <li>
                                    <strong>Exceptions</strong> : Permettent de dépasser temporairement les limites standards
                                    en situation exceptionnelle (ex: nombre de MAR réduit).
                                </li>
                            </ul>

                            <h3 className="text-lg font-semibold mt-4">Modèle de planification simplifié</h3>
                            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800 mt-2 mb-2">
                                <p className="text-sm">
                                    <strong>Important :</strong> Dans cette version MVP, le planning gère uniquement des <strong>vacations par demi-journées</strong> (matin/après-midi), définies comme ouvertes ou fermées, avec affectation simplifiée du personnel :
                                </p>
                                <ul className="list-disc pl-6 mt-2 text-sm">
                                    <li>1 chirurgien par vacation</li>
                                    <li>1 MAR (Médecin Anesthésiste-Réanimateur)</li>
                                    <li>+/- 1 IADE (Infirmier Anesthésiste)</li>
                                </ul>
                                <p className="text-sm mt-2">
                                    Les interventions chirurgicales détaillées ne sont pas gérées dans cette version.
                                </p>
                            </div>

                            <h3 className="text-lg font-semibold mt-4">Priorité des règles</h3>
                            <p>
                                Les règles sont évaluées par ordre de priorité décroissante.
                                Une règle de priorité plus élevée peut surpasser une règle de priorité inférieure.
                            </p>

                            <h3 className="text-lg font-semibold mt-4">Conditions disponibles</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Max. salles par MAR</strong> : Nombre maximum de salles qu'un MAR peut superviser</li>
                                <li><strong>Supervision interne</strong> : Limite la supervision aux médecins du secteur</li>
                                <li><strong>Salles contiguës</strong> : Exige que les salles supervisées soient adjacentes</li>
                                <li><strong>Compétences requises</strong> : Définit les compétences nécessaires pour superviser</li>
                                <li><strong>Supervision depuis autre secteur</strong> : Autorise certains secteurs à superviser</li>
                            </ul>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="aide" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Aide et Bonnes Pratiques</CardTitle>
                            <CardDescription>
                                Conseils pour configurer efficacement vos règles de supervision
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <h3 className="text-lg font-semibold">Bonnes pratiques</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Commencez par définir une règle basique qui s'applique à tous les secteurs</li>
                                <li>Ajoutez des règles spécifiques uniquement pour les secteurs ayant des besoins particuliers</li>
                                <li>Utilisez les exceptions avec parcimonie, uniquement pour des situations réellement exceptionnelles</li>
                                <li>Testez vos règles en créant des plannings tests avant de les utiliser en production</li>
                                <li>Documentez chaque règle avec une description claire pour faciliter la compréhension</li>
                            </ul>

                            <h3 className="text-lg font-semibold mt-4">Exemples courants</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>
                                    <strong>Règle standard</strong> : Maximum 2 salles par MAR pour tous les secteurs
                                </li>
                                <li>
                                    <strong>Bloc cardiaque</strong> : Supervision uniquement par des MAR du secteur cardiaque
                                </li>
                                <li>
                                    <strong>Bloc pédiatrique</strong> : Compétence spécifique en anesthésie pédiatrique requise
                                </li>
                                <li>
                                    <strong>Exception weekend</strong> : Jusqu'à 3 salles par MAR pendant les weekends
                                </li>
                            </ul>

                            <h3 className="text-lg font-semibold mt-4">Résolution de problèmes</h3>
                            <p>
                                Si une règle ne s'applique pas comme prévu :
                            </p>
                            <ol className="list-decimal pl-6 space-y-2">
                                <li>Vérifiez la priorité des règles (une règle de priorité supérieure peut surpasser votre règle)</li>
                                <li>Assurez-vous que la règle est active</li>
                                <li>Vérifiez que le secteur associé existe et est correctement configuré</li>
                                <li>Consultez les logs de validation pour voir quelles règles ont été appliquées</li>
                            </ol>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 