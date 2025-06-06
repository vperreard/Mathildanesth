import React, { useEffect, useState } from 'react';
import { logger } from "../../../lib/logger";
import { Button, Box, Typography, Paper, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDebounceFilters } from '../hooks/useDebounceFilters';
import { useLeavesList } from '../hooks/useLeaveQueries';
import { LeaveStatus } from '../types/leave';

// Créer un client QueryClient avec des paramètres de test
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
            refetchOnWindowFocus: false,
        },
    },
});

// Composant pour afficher les résultats de test
const TestResults = ({ results }: { results: TestResult[] }) => (
    <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>Résultats des tests de performance</Typography>

        <Table>
            <TableHead>
                <TableRow>
                    <TableCell>Test</TableCell>
                    <TableCell>Durée (ms)</TableCell>
                    <TableCell>Taille résultat</TableCell>
                    <TableCell>État</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {results.map((result, index) => (
                    <TableRow key={index}>
                        <TableCell>{result.name}</TableCell>
                        <TableCell>{result.duration.toFixed(2)} ms</TableCell>
                        <TableCell>{result.resultSize} items</TableCell>
                        <TableCell>{result.success ? 'Succès' : 'Échec'}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </Paper>
);

// Interface pour les résultats de test
interface TestResult {
    name: string;
    duration: number;
    resultSize: number;
    success: boolean;
}

// Composant de test de performance
const PerformanceTestComponent = () => {
    const [results, setResults] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState<boolean>(false);

    // Hook pour tester les filtres
    const { updateFilters } = useDebounceFilters();

    // Fonction pour exécuter un test de performance
    const runTest = async () => {
        setIsRunning(true);
        const testResults: TestResult[] = [];

        try {
            // Test de chargement initial
            const initialLoadResult = await testInitialLoad();
            testResults.push(initialLoadResult);

            // Test de filtrage
            const filteringResult = await testFiltering();
            testResults.push(filteringResult);

            // Test de pagination
            const paginationResult = await testPagination();
            testResults.push(paginationResult);

            // Test de tri
            const sortingResult = await testSorting();
            testResults.push(sortingResult);

            // Test de recherche
            const searchResult = await testSearch();
            testResults.push(searchResult);

            // Enregistrer les résultats
            setResults(testResults);
        } catch (error: unknown) {
            logger.error('Erreur lors des tests de performance:', { error: error });
        } finally {
            setIsRunning(false);
        }
    };

    // Test de chargement initial
    const testInitialLoad = (): Promise<TestResult> => {
        return new Promise((resolve) => {
            const start = performance.now();

            // Réinitialiser le cache
            queryClient.invalidateQueries({ queryKey: ['leaves'] });

            // Composant de test
            const TestComponent = () => {
                const { data, isSuccess } = useLeavesList();

                useEffect(() => {
                    if (isSuccess) {
                        const end = performance.now();
                        resolve({
                            name: 'Chargement initial',
                            duration: end - start,
                            resultSize: data?.items.length || 0,
                            success: true
                        });
                    }
                }, [data, isSuccess]);

                return null;
            };

            // Rendre le composant de test
            const testElement = document.createElement('div');
            document.body.appendChild(testElement);

            // Nettoyer après le test
            setTimeout(() => {
                document.body.removeChild(testElement);
            }, 5000); // Timeout de sécurité
        });
    };

    // Test de filtrage
    const testFiltering = (): Promise<TestResult> => {
        return new Promise((resolve) => {
            const start = performance.now();

            // Composant de test
            const TestComponent = () => {
                const { data, isSuccess } = useLeavesList({
                    status: LeaveStatus.APPROVED
                });

                useEffect(() => {
                    if (isSuccess) {
                        const end = performance.now();
                        resolve({
                            name: 'Filtrage par statut',
                            duration: end - start,
                            resultSize: data?.items.length || 0,
                            success: true
                        });
                    }
                }, [data, isSuccess]);

                return null;
            };

            // Rendre le composant de test
            const testElement = document.createElement('div');
            document.body.appendChild(testElement);

            // Nettoyer après le test
            setTimeout(() => {
                document.body.removeChild(testElement);
            }, 5000);
        });
    };

    // Test de pagination
    const testPagination = (): Promise<TestResult> => {
        return new Promise((resolve) => {
            const start = performance.now();

            // Composant de test
            const TestComponent = () => {
                const { data, isSuccess } = useLeavesList({
                    page: 2,
                    limit: 10
                });

                useEffect(() => {
                    if (isSuccess) {
                        const end = performance.now();
                        resolve({
                            name: 'Pagination (page 2)',
                            duration: end - start,
                            resultSize: data?.items.length || 0,
                            success: true
                        });
                    }
                }, [data, isSuccess]);

                return null;
            };

            // Rendre le composant de test
            const testElement = document.createElement('div');
            document.body.appendChild(testElement);

            // Nettoyer après le test
            setTimeout(() => {
                document.body.removeChild(testElement);
            }, 5000);
        });
    };

    // Test de tri
    const testSorting = (): Promise<TestResult> => {
        return new Promise((resolve) => {
            const start = performance.now();

            // Composant de test
            const TestComponent = () => {
                const { data, isSuccess } = useLeavesList({
                    sortBy: 'userName',
                    sortOrder: 'asc'
                });

                useEffect(() => {
                    if (isSuccess) {
                        const end = performance.now();
                        resolve({
                            name: 'Tri par nom utilisateur',
                            duration: end - start,
                            resultSize: data?.items.length || 0,
                            success: true
                        });
                    }
                }, [data, isSuccess]);

                return null;
            };

            // Rendre le composant de test
            const testElement = document.createElement('div');
            document.body.appendChild(testElement);

            // Nettoyer après le test
            setTimeout(() => {
                document.body.removeChild(testElement);
            }, 5000);
        });
    };

    // Test de recherche
    const testSearch = (): Promise<TestResult> => {
        return new Promise((resolve) => {
            const start = performance.now();

            // Composant de test
            const TestComponent = () => {
                const { data, isSuccess } = useLeavesList({
                    search: 'test'
                });

                useEffect(() => {
                    if (isSuccess) {
                        const end = performance.now();
                        resolve({
                            name: 'Recherche de texte',
                            duration: end - start,
                            resultSize: data?.items.length || 0,
                            success: true
                        });
                    }
                }, [data, isSuccess]);

                return null;
            };

            // Rendre le composant de test
            const testElement = document.createElement('div');
            document.body.appendChild(testElement);

            // Nettoyer après le test
            setTimeout(() => {
                document.body.removeChild(testElement);
            }, 5000);
        });
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Test de Performance des Composants de Congés</Typography>

            <Button
                variant="contained"
                color="primary"
                onClick={runTest}
                disabled={isRunning}
                sx={{ mb: 3 }}
            >
                {isRunning ? (
                    <>
                        <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                        Exécution des tests...
                    </>
                ) : 'Lancer les tests de performance'}
            </Button>

            {results.length > 0 && <TestResults results={results} />}
        </Box>
    );
};

// Wrapper avec le contexte React Query
const LeavePerformanceTest = () => (
    <QueryClientProvider client={queryClient}>
        <PerformanceTestComponent />
    </QueryClientProvider>
);

export default LeavePerformanceTest; 