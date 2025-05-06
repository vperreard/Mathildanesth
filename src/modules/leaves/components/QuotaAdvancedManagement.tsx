'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useLeaveQuota, UseLeaveQuotaReturn, LeaveTypeQuota } from '@/modules/leaves/hooks/useLeaveQuota';
import { useToast } from '@/components/ui/use-toast';
import AvailableQuotaDisplay from "./quotas/AvailableQuotaDisplay";
import QuotaTransferForm from "./QuotaTransferForm";
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import QuotaTransferHistory from "./QuotaTransferHistory";

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
export default function QuotaAdvancedManagement({ userId }: QuotaAdvancedManagementProps) {
    const [activeTab, setActiveTab] = useState<string>('transferts');
    const { toast } = useToast();
    const { quotasByType, loading: isLoadingQuotas, error: errorQuotas, refreshQuotas }: UseLeaveQuotaReturn =
        useLeaveQuota({ userId: userId || 'current' });
    const { user } = useAuth();
    const router = useRouter();
    const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
    const [targetUserId, setTargetUserId] = useState<string>('');

    // Déclarer isAdmin correctement
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'ADMIN_TOTAL';

    useEffect(() => {
        if (selectedUser) {
            setTargetUserId(selectedUser.id);
        } else if (user) {
            setTargetUserId(String(user.id));
        }
    }, [selectedUser, user]);

    useEffect(() => {
        if (targetUserId) {
            refreshQuotas(targetUserId);
        }
    }, [targetUserId, refreshQuotas]);

    const handleTransferComplete = useCallback(() => {
        if (targetUserId) {
            refreshQuotas(targetUserId);
            toast({ title: "Transfert de quota réussi !", description: "Les soldes ont été mis à jour." });
        }
    }, [targetUserId, refreshQuotas, toast]);

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

    const currentQuotasByType: LeaveTypeQuota[] = quotasByType || [];

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
                                {targetUserId && !isLoadingQuotas && currentQuotasByType.length > 0 && (
                                    <QuotaTransferForm
                                        userId={targetUserId}
                                        quotasByType={currentQuotasByType}
                                        onTransferComplete={handleTransferComplete}
                                    />
                                )}
                                {isLoadingQuotas && <p>Chargement des quotas...</p>}
                                {!isLoadingQuotas && currentQuotasByType.length === 0 && <p>Aucun quota trouvé.</p>}
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
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/leaves/new')}
                    className="mt-4"
                >
                    Faire une nouvelle demande
                </Button>
            </CardFooter>
        </Card>
    );
} 