import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';

// Import des composants de Recharts
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

// Import des composants UI
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Import depuis notre moteur de règles - commenté si module inexistant
// import { RuleEngine, FatigueSystem, EquitySystem, TemporalRulesService } from '@/modules/rules/engine';

// Couleurs pour les graphiques
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const MEDECINS = ['Dr. Martin', 'Dr. Dubois', 'Dr. Petit', 'Dr. Robert', 'Dr. Leroy'];

// Types pour les données
interface RepartitionData {
    name: string;
    gardes: number;
    astreintes: number;
    consultations: number;
}

interface FatigueData {
    jour: number;
    [key: string]: number;
}

interface ConformiteData {
    name: string;
    value: number;
}

interface EvolutionData {
    mois: string;
    gardes: number;
    astreintes: number;
    repos: number;
}

// Fonction pour générer des données simulées
const generateMockData = (type: string, periode: 'semaine' | 'mois' | 'trimestre' | 'annee') => {
    switch (type) {
        case 'repartition':
            return MEDECINS.map((name, index) => ({
                name,
                gardes: Math.floor(Math.random() * 10) + 5,
                astreintes: Math.floor(Math.random() * 15) + 3,
                consultations: Math.floor(Math.random() * 20) + 10
            }));
        case 'fatigue':
            const jours = periode === 'semaine' ? 7 : periode === 'mois' ? 30 : periode === 'trimestre' ? 90 : 365;
            return Array.from({ length: Math.min(jours, 30) }, (_, i) => {
                const data: FatigueData = { jour: i + 1 };
                MEDECINS.forEach(medecin => {
                    data[medecin] = Math.floor(Math.random() * 10) + 1;
                });
                return data;
            });
        case 'conformite':
            return [
                { name: 'Conformes', value: Math.floor(Math.random() * 30) + 70 },
                { name: 'Non-conformes', value: Math.floor(Math.random() * 30) }
            ];
        case 'evolution':
            const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
            const range = periode === 'trimestre' ? 3 : periode === 'semaine' ? 4 : periode === 'mois' ? 4 : 12;
            return Array.from({ length: range }, (_, i) => ({
                mois: months[i % 12],
                gardes: Math.floor(Math.random() * 50) + 20,
                astreintes: Math.floor(Math.random() * 40) + 15,
                repos: Math.floor(Math.random() * 30) + 10
            }));
        default:
            return [];
    }
};

export default function Statistiques() {
    const [periode, setPeriode] = useState<'semaine' | 'mois' | 'trimestre' | 'annee'>('mois');

    // Génération des données avec useMemo pour éviter des re-calculs inutiles
    const repartitionData = useMemo(() =>
        generateMockData('repartition', periode) as RepartitionData[], [periode]);

    const fatigueData = useMemo(() =>
        generateMockData('fatigue', periode) as FatigueData[], [periode]);

    const conformiteData = useMemo(() =>
        generateMockData('conformite', periode) as ConformiteData[], [periode]);

    const evolutionData = useMemo(() =>
        generateMockData('evolution', periode) as EvolutionData[], [periode]);

    return (
        <AdminLayout>
            <div className="container mx-auto py-6">
                <h1 className="text-2xl font-bold mb-6">Statistiques et Analyses</h1>

                <div className="flex justify-end mb-4">
                    <Select value={periode} onValueChange={(value) => setPeriode(value as 'semaine' | 'mois' | 'trimestre' | 'annee')}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sélectionner une période" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="semaine">Semaine</SelectItem>
                            <SelectItem value="mois">Mois</SelectItem>
                            <SelectItem value="trimestre">Trimestre</SelectItem>
                            <SelectItem value="annee">Année</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Tabs defaultValue="gardes" className="space-y-4">
                    <TabsList className="grid grid-cols-4 gap-4">
                        <TabsTrigger value="gardes">Répartition des gardes</TabsTrigger>
                        <TabsTrigger value="fatigue">Évolution de la fatigue</TabsTrigger>
                        <TabsTrigger value="conformite">Conformité aux règles</TabsTrigger>
                        <TabsTrigger value="equite">Équité entre médecins</TabsTrigger>
                    </TabsList>

                    <TabsContent value="gardes" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Distribution des gardes par médecin</CardTitle>
                            </CardHeader>
                            <CardContent className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={repartitionData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="gardes" name="Gardes" fill="#0088FE" />
                                        <Bar dataKey="astreintes" name="Astreintes" fill="#00C49F" />
                                        <Bar dataKey="consultations" name="Consultations" fill="#FFBB28" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="fatigue" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Évolution du niveau de fatigue</CardTitle>
                            </CardHeader>
                            <CardContent className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={fatigueData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="jour" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        {MEDECINS.map((medecin, index) => (
                                            <Line
                                                key={medecin}
                                                type="monotone"
                                                dataKey={medecin}
                                                stroke={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="conformite" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Indicateurs de conformité aux règles</CardTitle>
                            </CardHeader>
                            <CardContent className="h-80">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <PieChart>
                                                <Pie
                                                    data={conformiteData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    outerRadius={100}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {conformiteData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-xl font-semibold mb-2">
                                                {`${Math.floor(conformiteData[0].value / (conformiteData[0].value + conformiteData[1].value) * 100)}%`}
                                            </p>
                                            <p className="text-gray-500">Taux de conformité global</p>
                                            <Badge className="mt-2">+2% vs période précédente</Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="equite" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Score d'équité entre médecins</CardTitle>
                            </CardHeader>
                            <CardContent className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={MEDECINS.map((name, index) => ({
                                        name,
                                        score: Math.floor(Math.random() * 20) + 80
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="score" name="Score d'équité" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Indicateurs de performance clés */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
                    <Card className="p-4 shadow-lg bg-blue-50">
                        <h3 className="text-lg font-medium mb-2">Total des Gardes</h3>
                        <p className="text-3xl font-bold">{repartitionData.reduce((sum, item) => sum + item.gardes, 0)}</p>
                        <Badge className="mt-2">+5% vs période précédente</Badge>
                    </Card>

                    <Card className="p-4 shadow-lg bg-green-50">
                        <h3 className="text-lg font-medium mb-2">Taux de Conformité</h3>
                        <p className="text-3xl font-bold">{`${Math.floor(conformiteData[0].value / (conformiteData[0].value + conformiteData[1].value) * 100)}%`}</p>
                        <Badge className="mt-2">+2% vs période précédente</Badge>
                    </Card>

                    <Card className="p-4 shadow-lg bg-yellow-50">
                        <h3 className="text-lg font-medium mb-2">Score d'Équité</h3>
                        <p className="text-3xl font-bold">{`${Math.floor(Math.random() * 20) + 80}/100`}</p>
                        <Badge className="mt-2">Stable vs période précédente</Badge>
                    </Card>

                    <Card className="p-4 shadow-lg bg-purple-50">
                        <h3 className="text-lg font-medium mb-2">Fatigue Moyenne</h3>
                        <p className="text-3xl font-bold">{Math.floor(Math.random() * 30) + 40}</p>
                        <Badge className="mt-2">+8% vs période précédente</Badge>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
} 