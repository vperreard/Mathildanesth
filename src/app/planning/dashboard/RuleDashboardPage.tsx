import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePlanningRules } from '@/modules/rules/hooks/usePlanningRules';
import RuleFeedback from '@/modules/rules/components/RuleFeedback';
// TODO: Create or import chart components
// // TODO: Create or import chart components
// import { PieChart, LineChart, BarChart } from '@/components/ui/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendrier';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRule } from '@/modules/rules/hooks/useRule';
import { Rule, RuleType } from '@/modules/dynamicRules/types/rule';
import { User } from '@/types/user';
import { addMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { Loader2, RefreshCw, AlertCircle, Download, Filter } from 'lucide-react';
import { fr } from 'date-fns/locale';

/**
 * Page tableau de bord d'analyse des règles pour le planning
 */
const RuleDashboardPage: React.FC = () => {
    const router = useRouter();

    // État pour les dates de début et fin
    const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
    const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

    // État pour les onglets actifs
    const [activeTab, setActiveTab] = useState<string>('overview');

    // État pour les utilisateurs (simulé pour l'exemple)
    const [users, setUsers] = useState<User[]>([]);

    // Chargement des règles via le hook useRule
    const { rules, loading: rulesLoading, fetchRules } = useRule();

    // Intégration avec le hook usePlanningRules
    const {
        attributions,
        ruleResults,
        status,
        error,
        metrics,
        violatedRules,
        generatePlanning,
        reset,
        qualityScore
    } = usePlanningRules({
        rules: rules as Rule[],
        users,
        startDate,
        endDate
    });

    // Chargement initial des données
    useEffect(() => {
        // Chargement des règles
        fetchRules();

        // Simulation de chargement des utilisateurs
        // En production, cette donnée viendrait d'une API
        setUsers([
            { id: '1', name: 'Dr. Martin', role: 'SENIOR', speciality: 'ANESTHESIE' },
            { id: '2', name: 'Dr. Durand', role: 'SENIOR', speciality: 'ANESTHESIE' },
            { id: '3', name: 'Dr. Petit', role: 'JUNIOR', speciality: 'ANESTHESIE' },
            { id: '4', name: 'Dr. Leroy', role: 'JUNIOR', speciality: 'ANESTHESIE' },
            { id: '5', name: 'Dr. Dubois', role: 'SENIOR', speciality: 'ANESTHESIE' }
        ]);
    }, [fetchRules]);

    // Données pour les graphiques (simulées)
    const chartData = {
        compliance: [
            { name: 'Respectées', value: ruleResults.filter(r => r.passed).length, color: '#4ade80' },
            { name: 'Violées', value: ruleResults.filter(r => !r.passed).length, color: '#f87171' }
        ],
        ruleTypes: [
            { name: 'Planning', value: rules.filter(r => r.type === RuleType.PLANNING).length },
            { name: 'Allocation', value: rules.filter(r => r.type === RuleType.ALLOCATION).length },
            { name: 'Contrainte', value: rules.filter(r => r.type === RuleType.CONSTRAINT).length },
            { name: 'Supervision', value: rules.filter(r => r.type === RuleType.SUPERVISION).length }
        ],
        compliance3Months: [
            { date: format(addMonths(new Date(), -2), 'MMM yyyy', { locale: fr }), score: 78 },
            { date: format(addMonths(new Date(), -1), 'MMM yyyy', { locale: fr }), score: 85 },
            { date: format(new Date(), 'MMM yyyy', { locale: fr }), score: Math.round(qualityScore) }
        ]
    };

    // Fonction pour exporter les données
    const exportData = () => {
        const data = {
            attributions,
            ruleResults,
            metrics,
            violatedRules,
            exportDate: new Date().toISOString()
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `planning-rules-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Tableau de bord des règles de planning</h1>
                <div className="flex gap-2">
                    <Button
                        onClick={reset}
                        variant="outline"
                        size="sm"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Réinitialiser
                    </Button>
                    <Button
                        onClick={exportData}
                        variant="outline"
                        size="sm"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Exporter
                    </Button>
                </div>
            </div>

            {/* Filtres et contrôles */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <h3 className="text-sm font-medium mb-1">Période</h3>
                        <div className="flex gap-2 items-center">
                            <div>
                                <label className="text-xs text-gray-500">Du</label>
                                <input
                                    type="date"
                                    value={format(startDate, 'yyyy-MM-dd')}
                                    onChange={e => setStartDate(new Date(e.target.value))}
                                    className="block w-full border border-gray-300 rounded-md p-1.5 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500">Au</label>
                                <input
                                    type="date"
                                    value={format(endDate, 'yyyy-MM-dd')}
                                    onChange={e => setEndDate(new Date(e.target.value))}
                                    className="block w-full border border-gray-300 rounded-md p-1.5 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <Button
                            onClick={generatePlanning}
                            disabled={status === 'loading' || rulesLoading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Générer et analyser
                        </Button>
                    </div>

                    {error && (
                        <div className="flex items-center text-red-600 text-sm">
                            <AlertCircle className="mr-1 h-4 w-4" />
                            {error.message}
                        </div>
                    )}
                </div>
            </div>

            {/* Onglets */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid grid-cols-3 w-[400px]">
                    <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                    <TabsTrigger value="compliance">Conformité</TabsTrigger>
                    <TabsTrigger value="optimization">Optimisation</TabsTrigger>
                </TabsList>

                {/* Onglet Vue d'ensemble */}
                <TabsContent value="overview">
                    {/* Score global */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm text-gray-500">Score global</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {Math.round(qualityScore)}%
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Conformité aux règles
                                </p>
                            </CardContent>
                        </Card>

                        {metrics && (
                            <>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-gray-500">Équité</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">
                                            {Math.round(metrics.equityScore)}%
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Distribution équitable
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-gray-500">Satisfaction</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">
                                            {Math.round(metrics.satisfactionScore)}%
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Respect des préférences
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm text-gray-500">Conformité</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold">
                                            {Math.round(metrics.ruleComplianceScore)}%
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Respect des règles
                                        </p>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>

                    {/* Graphiques */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Respect des règles</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <PieChart
                                    data={chartData.compliance}
                                    dataKey="value"
                                    nameKey="name"
                                    colors={chartData.compliance.map(item => item.color)}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Évolution sur 3 mois</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <LineChart
                                    data={chartData.compliance3Months}
                                    xKey="date"
                                    yKey="score"
                                    name="Score de conformité"
                                    color="#4f46e5"
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Feedback sur les règles */}
                    <div className="mb-6">
                        <RuleFeedback
                            ruleResults={ruleResults}
                            attributions={attributions}
                            onRuleClick={(ruleId) => {
                                router.push(`/parametres/configuration?ruleId=${ruleId}`);
                            }}
                        />
                    </div>
                </TabsContent>

                {/* Onglet Conformité */}
                <TabsContent value="compliance">
                    {/* Types de règles */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Distribution des règles par type</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <BarChart
                                    data={chartData.ruleTypes}
                                    xKey="name"
                                    yKey="value"
                                    name="Nombre de règles"
                                    color="#8b5cf6"
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Répartition des règles</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Object.values(RuleType).slice(0, 6).map(type => (
                                        <div key={type} className="flex justify-between items-center">
                                            <span className="text-sm">{type}</span>
                                            <span className="text-sm font-medium">
                                                {rules.filter(r => r.type === type).length}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Détails des règles violées */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Détails des règles violées</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {violatedRules.length === 0 ? (
                                <p className="text-center text-gray-500 py-4">
                                    Aucune règle violée détectée
                                </p>
                            ) : (
                                <div className="divide-y">
                                    {violatedRules.map(rule => (
                                        <div key={rule.ruleId} className="py-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium">{rule.ruleName}</h4>
                                                    <p className="text-sm text-gray-600">{rule.message}</p>
                                                </div>
                                                <div className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    Sévérité: {rule.severity}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Onglet Optimisation */}
                <TabsContent value="optimization">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Paramètres d'optimisation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Priorité des règles
                                        </label>
                                        <select className="w-full p-2 border border-gray-300 rounded-md text-sm">
                                            <option value="auto">Automatique</option>
                                            <option value="custom">Personnalisé</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Stratégie d'optimisation
                                        </label>
                                        <select className="w-full p-2 border border-gray-300 rounded-md text-sm">
                                            <option value="balanced">Équilibrée</option>
                                            <option value="rules">Priorité aux règles</option>
                                            <option value="preferences">Priorité aux préférences</option>
                                            <option value="equity">Priorité à l'équité</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Nombre d'itérations maximum
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                            defaultValue={10}
                                            min={1}
                                            max={50}
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <Button
                                            onClick={generatePlanning}
                                            disabled={status === 'loading'}
                                            className="w-full"
                                        >
                                            Relancer l'optimisation
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Évolution de l'optimisation</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <LineChart
                                    data={[
                                        { iteration: 1, score: 45 },
                                        { iteration: 2, score: 58 },
                                        { iteration: 3, score: 65 },
                                        { iteration: 4, score: 72 },
                                        { iteration: 5, score: 78 },
                                        { iteration: 6, score: 80 },
                                        { iteration: 7, score: 85 },
                                        { iteration: 8, score: 87 },
                                        { iteration: 9, score: 88 },
                                        { iteration: 10, score: 89 }
                                    ]}
                                    xKey="iteration"
                                    yKey="score"
                                    name="Score d'optimisation"
                                    color="#059669"
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Suggestions d'amélioration</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Ces suggestions seraient générées dynamiquement en fonction des résultats */}
                                <div className="p-3 rounded-md bg-blue-50 border-l-4 border-blue-500">
                                    <h4 className="font-medium">Augmenter la priorité des règles de supervision</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Les règles de supervision sont fréquemment violées. Augmenter leur priorité pourrait améliorer le score global.
                                    </p>
                                </div>

                                <div className="p-3 rounded-md bg-green-50 border-l-4 border-green-500">
                                    <h4 className="font-medium">Équité atteinte à 92%</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        La répartition des gardes est très équitable. Continuer avec ces paramètres.
                                    </p>
                                </div>

                                <div className="p-3 rounded-md bg-amber-50 border-l-4 border-amber-500">
                                    <h4 className="font-medium">Conflit entre règles détecté</h4>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Les règles "Limite de gardes consécutives" et "Répartition équitable" entrent en conflit. Considérer l'ajustement de leurs priorités.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default RuleDashboardPage; 