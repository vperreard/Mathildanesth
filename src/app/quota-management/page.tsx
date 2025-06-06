import { getServerSession } from '@/lib/auth/migration-shim-client';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/migration-shim-client';
import TransferQuotaForm from '@/modules/leaves/components/quotas/TransferQuotaForm';
import QuotaTransferHistory from '@/modules/leaves/components/quotas/QuotaTransferHistory';
import AvailableQuotaDisplay from '@/modules/leaves/components/quotas/AvailableQuotaDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
    title: 'Gestion des quotas de congés',
    description: 'Transférez et suivez vos quotas de congés',
};

export default async function QuotaManagementPage() {
    const session = await getServerSession(authOptions);

    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (!session?.user) {
        return redirect('/auth/signin?callbackUrl=/quota-management');
    }

    const userId = session.user.id;

    return (
        <div className="container mx-auto py-6 max-w-7xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Gestion des quotas de congés</h1>
                <p className="text-muted-foreground">
                    Consultez, transférez et suivez vos quotas de congés
                </p>
            </div>

            {/* Section des quotas disponibles en haut */}
            <div className="mb-8">
                <AvailableQuotaDisplay userId={userId} />
            </div>

            {/* Section principale avec onglets */}
            <Tabs defaultValue="transfer" className="mb-8">
                <TabsList className="mb-4">
                    <TabsTrigger value="transfer">
                        Transfert de quotas
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        Historique
                    </TabsTrigger>
                    <TabsTrigger value="help">
                        Aide
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="transfer">
                    <TransferQuotaForm userId={userId} />
                </TabsContent>

                <TabsContent value="history">
                    <div className="space-y-4">
                        <p className="text-muted-foreground mb-4">
                            Consultez l'historique complet de vos transferts de quotas, y compris les demandes en attente,
                            approuvées et rejetées.
                        </p>

                        <QuotaTransferHistory userId={userId} limit={20} />
                    </div>
                </TabsContent>

                <TabsContent value="help">
                    <Card>
                        <CardHeader>
                            <CardTitle>Aide sur la gestion des quotas</CardTitle>
                            <CardDescription>Comprendre le système de transfert et de report des quotas</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <h3 className="text-lg font-semibold mb-3">Informations sur les transferts de quotas</h3>
                            <p>
                                Le système de transfert de quotas vous permet de convertir des jours d'un type de congé
                                à un autre, selon des règles prédéfinies. Voici comment cela fonctionne :
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Chaque type de congé a ses propres règles de transfert.</li>
                                <li>Les taux de conversion peuvent varier selon les types de congés.</li>
                                <li>Certains transferts peuvent nécessiter une approbation.</li>
                                <li>Un historique complet des transferts est disponible.</li>
                                <li>Vous pouvez voir les jours qui vont bientôt expirer avant qu'ils ne soient perdus.</li>
                            </ul>

                            <h3 className="text-lg font-semibold mt-6 mb-3">Comprendre les dates d'expiration</h3>
                            <p>
                                Certains types de quotas ont une date d'expiration. Vous pouvez voir ces dates
                                d'expiration dans la section "Quotas disponibles".
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Les quotas non utilisés peuvent expirer selon les règles de votre organisation.</li>
                                <li>Les jours reportés ont généralement une date d'expiration plus courte.</li>
                                <li>Un avertissement s'affiche lorsque des jours sont sur le point d'expirer.</li>
                                <li>Pensez à utiliser ou transférer vos jours avant leur expiration.</li>
                            </ul>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 