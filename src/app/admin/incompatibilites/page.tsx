import Link from 'next/link';
import { logger } from "../../../lib/logger";
// TODO: Replace @heroicons with lucide-react
import { IncompatibilitesTable, DisplayPersonnelIncompatibility } from '@/components/admin/incompatibilites/IncompatibilitesTable';
import { getPersonnelIncompatibilities } from '@/services/admin/personnelIncompatibilityService';
import Button from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// TODO: Replace @heroicons with lucide-react
export const dynamic = 'force-dynamic';

async function fetchIncompatibilitiesData(): Promise<{ data: DisplayPersonnelIncompatibility[]; error?: string }> {
    try {
        const incompatibilities = await getPersonnelIncompatibilities();
        return { data: incompatibilities };
    } catch (error: unknown) {
        logger.error("Failed to fetch incompatibilities:", { error: error });
        return { data: [], error: error.message || "Une erreur est survenue lors de la récupération des données." };
    }
}

export default async function IncompatibilitesPage() {
    const { data: incompatibilities, error } = await fetchIncompatibilitiesData();

    return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold">
                                Gestion des Incompatibilités Personnelles
                            </CardTitle>
                            <CardDescription>
                                Visualisez, créez et gérez les incompatibilités entre membres du personnel.
                            </CardDescription>
                        </div>
                        <Link href="/admin/incompatibilites/nouveau" passHref>
                            <Button>
                                <{/* PlusCircleIconclassName="mr-2 h-5 w-5" /> */}
                                Nouvelle Incompatibilité
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <{/* ExclamationTriangleIconclassName="h-4 w-4" /> */}
                            <AlertTitle>Erreur de chargement</AlertTitle>
                            <AlertDescription>
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}
                    {!error && incompatibilities.length > 0 ? (
                        <IncompatibilitesTable incompatibilities={incompatibilities} />
                    ) : null}
                    {!error && incompatibilities.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-lg text-gray-500">Aucune incompatibilité trouvée.</p>
                            <p className="mt-2 text-sm text-gray-400">
                                Commencez par en créer une en cliquant sur le bouton ci-dessus.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 