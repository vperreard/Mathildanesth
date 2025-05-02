'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth/AuthContext';
import { QuotaTransferForm } from './quotas/QuotaTransferForm';
import { AvailableQuotaDisplay } from './quotas/AvailableQuotaDisplay';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

// Import dynamique pour éviter les problèmes de rendu côté serveur avec recharts
const QuotaTransferReportPanel = dynamic(
    () => import('./reports/QuotaTransferReportPanel').then(mod => mod.QuotaTransferReportPanel),
    { ssr: false, loading: () => <div>Chargement du rapport...</div> }
);

interface QuotaAdvancedManagementProps {
    userId?: string;
}

/**
 * Composant principal pour la gestion avancée des quotas de congés
 * Inclut les fonctionnalités de transfert, reporting et configuration
 */
export function QuotaAdvancedManagement({ userId }: QuotaAdvancedManagementProps) {
    const [activeTab, setActiveTab] = useState<string>('transferts');
    const { user, isAdmin } = useAuth();
    const router = useRouter();

    // Utiliser l'ID utilisateur fourni ou celui de l'utilisateur connecté
    const targetUserId = userId || (user?.id ? user.id.toString() : undefined);

    // Si pas d'utilisateur cible et pas d'utilisateur connecté, afficher une erreur
    if (!targetUserId) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur d'authentification</AlertTitle>
                <AlertDescription>
                    Vous devez être connecté pour accéder à cette fonctionnalité.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Gestion avancée des quotas de congés</CardTitle>
                <CardDescription>
                    Transferts de quotas, reportings et configuration des reports annuels
                </CardDescription>
            </CardHeader>

            <CardContent>
                <Tabs defaultValue="transferts" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="transferts">Transferts de quotas</TabsTrigger>
                        <TabsTrigger value="reporting">Reporting</TabsTrigger>
                        {isAdmin && (
                            <TabsTrigger value="configuration">Configuration</TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="transferts">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-1">
                                <AvailableQuotaDisplay
                                    userId={targetUserId}
                                    className="h-full"
                                />
                            </div>

                            <div className="lg:col-span-2">
                                <QuotaTransferForm
                                    userId={targetUserId}
                                    onTransferComplete={() => {
                                        // Rafraîchir les quotas après un transfert
                                    }}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="reporting">
                        <QuotaTransferReportPanel
                            userId={isAdmin ? undefined : targetUserId}
                        />
                    </TabsContent>

                    {isAdmin && (
                        <TabsContent value="configuration">
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Configuration des transferts de quotas</CardTitle>
                                        <CardDescription>
                                            Définissez les règles de transfert entre types de congés
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Ici nous ajouterons la configuration des règles de transfert */}
                                        <p className="text-muted-foreground">
                                            Fonctionnalité de configuration des transferts en cours de développement.
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Configuration des reports annuels</CardTitle>
                                        <CardDescription>
                                            Définissez les règles de report des quotas d'une année sur l'autre
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Ici nous ajouterons la configuration des règles de report */}
                                        <p className="text-muted-foreground">
                                            Fonctionnalité de configuration des reports annuels en cours de développement.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </CardContent>

            <CardFooter className="flex justify-between border-t p-4">
                <div className="text-sm text-muted-foreground">
                    {isAdmin
                        ? "Mode administrateur - Accès à toutes les fonctionnalités"
                        : "Mode utilisateur - Accès limité à vos propres données"}
                </div>
                <Button
                    variant="link"
                    onClick={() => router.push('/leaves/quotas')}
                >
                    Retour à la gestion des quotas
                </Button>
            </CardFooter>
        </Card>
    );
} 