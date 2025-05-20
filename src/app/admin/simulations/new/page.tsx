'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeftIcon, Loader2, CalendarIcon, UsersIcon, ScrollTextIcon, BuildingIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Type pour les utilisateurs
interface User {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
}

// Type pour les règles
interface Rule {
    id: string;
    name: string;
    description: string;
    type: string;
    enabled: boolean;
}

// Type pour les sites
interface Site {
    id: string;
    name: string;
    isActive: boolean;
}

// Type pour les paramètres de simulation
interface SimulationParams {
    period: {
        startDate: string;
        endDate: string;
    };
    siteId?: string;
    rules: Rule[];
    userIds?: string[];
}

export default function NewSimulationScenarioPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});
    const [activeTab, setActiveTab] = useState('basic');

    // États pour les paramètres structurés
    const [startDate, setStartDate] = useState<Date | undefined>(new Date());
    const [endDate, setEndDate] = useState<Date | undefined>(
        new Date(new Date().setDate(new Date().getDate() + 30)) // Par défaut, 30 jours après aujourd'hui
    );
    const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>(undefined);
    const [selectedRules, setSelectedRules] = useState<Rule[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    // États pour les données à charger depuis l'API
    const [sites, setSites] = useState<Site[]>([]);
    const [rules, setRules] = useState<Rule[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [loadingError, setLoadingError] = useState<string | null>(null);

    // État pour les paramètres JSON avancés (optionnel)
    const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
    const [advancedJsonString, setAdvancedJsonString] = useState('{}');

    // Charger les données des API
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            setLoadingError(null);

            try {
                // Charger les sites
                const sitesResponse = await fetch('/api/sites');
                if (!sitesResponse.ok) throw new Error('Échec du chargement des sites');
                const sitesData = await sitesResponse.json();
                setSites(sitesData);

                // Charger les règles
                const rulesResponse = await fetch('/api/rules');
                if (!rulesResponse.ok) throw new Error('Échec du chargement des règles');
                const rulesData = await rulesResponse.json();
                setRules(rulesData);

                // Charger les utilisateurs
                const usersResponse = await fetch('/api/users');
                if (!usersResponse.ok) throw new Error('Échec du chargement des utilisateurs');
                const usersData = await usersResponse.json();
                setUsers(usersData);
            } catch (err) {
                console.error('Erreur lors du chargement des données:', err);
                setLoadingError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
                toast.error("Erreur lors du chargement des données nécessaires");
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
    }, []);

    // Préparer les paramètres JSON à partir des champs structurés
    const prepareSimulationParams = (): SimulationParams => {
        const params: SimulationParams = {
            period: {
                startDate: startDate ? format(startDate, 'yyyy-MM-dd') : '',
                endDate: endDate ? format(endDate, 'yyyy-MM-dd') : '',
            },
            rules: selectedRules,
        };

        if (selectedSiteId) {
            params.siteId = selectedSiteId;
        }

        if (selectedUserIds.length > 0) {
            params.userIds = selectedUserIds;
        }

        return params;
    };

    // Validation de base du formulaire
    const validateForm = (): boolean => {
        const errors: Record<string, string[]> = {};

        if (!name.trim()) {
            errors.name = ["Le nom est requis."];
        }

        if (!startDate) {
            errors.startDate = ["La date de début est requise."];
        }

        if (!endDate) {
            errors.endDate = ["La date de fin est requise."];
        }

        if (startDate && endDate && startDate > endDate) {
            errors.endDate = ["La date de fin doit être après la date de début."];
        }

        if (selectedRules.length === 0) {
            errors.rules = ["Au moins une règle doit être sélectionnée."];
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Gérer la soumission du formulaire
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        setFieldErrors({});

        if (!validateForm()) {
            setIsLoading(false);
            toast.warning("Veuillez corriger les erreurs dans le formulaire.");
            return;
        }

        // Préparer les paramètres JSON
        let parametersJson = showAdvancedEditor
            ? JSON.parse(advancedJsonString)
            : prepareSimulationParams();

        try {
            const response = await fetch('/api/simulations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description,
                    parametersJson
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 400 && errorData.errors) {
                    setFieldErrors(errorData.errors);
                    setError("Veuillez corriger les erreurs dans le formulaire.");
                } else {
                    setError(errorData.error || "Échec de la création du scénario.");
                }
                throw new Error(errorData.error || 'Failed to create scenario');
            }

            const newScenario = await response.json();
            toast.success("Scénario créé avec succès !");
            router.push('/admin/simulations');
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle pour la sélection d'une règle
    const toggleRule = (rule: Rule) => {
        setSelectedRules(prevRules => {
            const isSelected = prevRules.some(r => r.id === rule.id);
            if (isSelected) {
                return prevRules.filter(r => r.id !== rule.id);
            } else {
                return [...prevRules, rule];
            }
        });
    };

    // Toggle pour la sélection d'un utilisateur
    const toggleUser = (userId: string) => {
        setSelectedUserIds(prevIds => {
            const isSelected = prevIds.includes(userId);
            if (isSelected) {
                return prevIds.filter(id => id !== userId);
            } else {
                return [...prevIds, userId];
            }
        });
    };

    // Mise à jour de l'éditeur JSON avancé lorsque les paramètres structurés changent
    useEffect(() => {
        if (!showAdvancedEditor) {
            const params = prepareSimulationParams();
            setAdvancedJsonString(JSON.stringify(params, null, 2));
        }
    }, [startDate, endDate, selectedSiteId, selectedRules, selectedUserIds, showAdvancedEditor]);

    // Afficher un indicateur de chargement si les données sont en cours de chargement
    if (isLoadingData) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-primary mr-2" />
                <p className="text-lg">Chargement des données...</p>
            </div>
        );
    }

    // Afficher une erreur si le chargement des données a échoué
    if (loadingError) {
        return (
            <div className="container mx-auto py-8 text-center">
                <div className="text-red-500 mb-4">
                    Erreur lors du chargement des données: {loadingError}
                </div>
                <Button onClick={() => window.location.reload()}>Réessayer</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 max-w-3xl">
            <Link href="/admin/simulations" passHref>
                <Button variant="outline" className="mb-4">
                    <ArrowLeftIcon className="mr-2 h-4 w-4" /> Retour à la liste
                </Button>
            </Link>

            <Card>
                <CardHeader>
                    <CardTitle>Créer un nouveau scénario de simulation</CardTitle>
                    <CardDescription>
                        Définissez les paramètres pour votre scénario de simulation en complétant ce formulaire.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid grid-cols-4 mx-4 mb-2">
                            <TabsTrigger value="basic">Informations de base</TabsTrigger>
                            <TabsTrigger value="period">
                                <CalendarIcon className="h-4 w-4 mr-2" /> Période
                            </TabsTrigger>
                            <TabsTrigger value="rules">
                                <ScrollTextIcon className="h-4 w-4 mr-2" /> Règles
                            </TabsTrigger>
                            <TabsTrigger value="participants">
                                <UsersIcon className="h-4 w-4 mr-2" /> Participants
                            </TabsTrigger>
                        </TabsList>

                        {/* Onglet Informations de base */}
                        <TabsContent value="basic">
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nom du scénario *</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Ex: Simulation été 2024 avec équipe réduite"
                                        className={fieldErrors.name ? "border-red-500" : ""}
                                    />
                                    {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name.join(', ')}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Décrivez l'objectif et le contexte de cette simulation..."
                                        rows={3}
                                        className={fieldErrors.description ? "border-red-500" : ""}
                                    />
                                    {fieldErrors.description && <p className="text-sm text-red-500">{fieldErrors.description.join(', ')}</p>}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center mt-6">
                                        <Checkbox
                                            id="showAdvanced"
                                            checked={showAdvancedEditor}
                                            onCheckedChange={(checked) => setShowAdvancedEditor(!!checked)}
                                        />
                                        <Label htmlFor="showAdvanced" className="ml-2">
                                            Afficher l'éditeur JSON avancé
                                        </Label>
                                    </div>

                                    {showAdvancedEditor && (
                                        <div className="mt-4">
                                            <Label htmlFor="advancedJson">Paramètres JSON avancés</Label>
                                            <Textarea
                                                id="advancedJson"
                                                value={advancedJsonString}
                                                onChange={(e) => setAdvancedJsonString(e.target.value)}
                                                rows={10}
                                                className="font-mono text-sm"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Modifiez directement le JSON des paramètres de simulation. Assurez-vous que le format est valide.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </TabsContent>

                        {/* Onglet Période */}
                        <TabsContent value="period">
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="startDate">Date de début *</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={`w-full justify-start text-left font-normal ${fieldErrors.startDate ? "border-red-500" : ""
                                                        }`}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {startDate ? (
                                                        format(startDate, 'PPP', { locale: fr })
                                                    ) : (
                                                        <span>Sélectionnez une date</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={startDate}
                                                    onSelect={setStartDate}
                                                    initialFocus
                                                    locale={fr}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        {fieldErrors.startDate && <p className="text-sm text-red-500">{fieldErrors.startDate.join(', ')}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="endDate">Date de fin *</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={`w-full justify-start text-left font-normal ${fieldErrors.endDate ? "border-red-500" : ""
                                                        }`}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {endDate ? (
                                                        format(endDate, 'PPP', { locale: fr })
                                                    ) : (
                                                        <span>Sélectionnez une date</span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={endDate}
                                                    onSelect={setEndDate}
                                                    initialFocus
                                                    locale={fr}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        {fieldErrors.endDate && <p className="text-sm text-red-500">{fieldErrors.endDate.join(', ')}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="site">Site (optionnel)</Label>
                                    <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez un site" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Tous les sites</SelectItem>
                                            {sites.map((site) => (
                                                <SelectItem key={site.id} value={site.id}>
                                                    {site.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-500">
                                        Si aucun site n'est sélectionné, la simulation portera sur tous les sites.
                                    </p>
                                </div>
                            </CardContent>
                        </TabsContent>

                        {/* Onglet Règles */}
                        <TabsContent value="rules">
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-base">Règles à appliquer *</Label>
                                        <span className="text-sm text-gray-500">
                                            {selectedRules.length} sélectionnée(s)
                                        </span>
                                    </div>

                                    {fieldErrors.rules && <p className="text-sm text-red-500">{fieldErrors.rules.join(', ')}</p>}

                                    <div className="border rounded-md divide-y max-h-80 overflow-y-auto">
                                        {rules.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">
                                                Aucune règle disponible
                                            </div>
                                        ) : (
                                            rules.map((rule) => (
                                                <div key={rule.id} className="flex items-start p-3 hover:bg-gray-50">
                                                    <Checkbox
                                                        id={`rule-${rule.id}`}
                                                        checked={selectedRules.some(r => r.id === rule.id)}
                                                        onCheckedChange={() => toggleRule(rule)}
                                                        className="mt-1"
                                                    />
                                                    <div className="ml-3">
                                                        <Label htmlFor={`rule-${rule.id}`} className="font-medium">
                                                            {rule.name}
                                                        </Label>
                                                        <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                                                        <div className="flex mt-1 gap-2">
                                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                                                {rule.type}
                                                            </span>
                                                            {rule.enabled ? (
                                                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                                    Activée
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                                                    Désactivée
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </TabsContent>

                        {/* Onglet Participants */}
                        <TabsContent value="participants">
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-base">Participants (optionnel)</Label>
                                        <span className="text-sm text-gray-500">
                                            {selectedUserIds.length} sélectionné(s)
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-500">
                                        Sélectionnez les utilisateurs à inclure spécifiquement dans cette simulation.
                                        Si aucun utilisateur n'est sélectionné, tous les utilisateurs actifs seront inclus.
                                    </p>

                                    <div className="flex gap-2 mb-4 flex-wrap">
                                        <Select
                                            value=""
                                            onValueChange={(value) => {
                                                if (value) {
                                                    // Filtrer les utilisateurs par rôle
                                                    const filteredUsers = users.filter(user => user.role === value);
                                                    // Sélectionner tous les utilisateurs filtrés
                                                    setSelectedUserIds(prevIds => {
                                                        const newIds = [...prevIds];
                                                        filteredUsers.forEach(user => {
                                                            if (!newIds.includes(user.id)) {
                                                                newIds.push(user.id);
                                                            }
                                                        });
                                                        return newIds;
                                                    });
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-[200px]">
                                                <SelectValue placeholder="Filtrer par rôle" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Tous les rôles</SelectItem>
                                                {Array.from(new Set(users.map(user => user.role))).map(role => (
                                                    <SelectItem key={role} value={role}>
                                                        {role}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setSelectedUserIds([])}
                                            className="h-10"
                                        >
                                            Désélectionner tout
                                        </Button>
                                    </div>

                                    <div className="border rounded-md divide-y max-h-80 overflow-y-auto">
                                        {users.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">
                                                Aucun utilisateur disponible
                                            </div>
                                        ) : (
                                            users.map((user) => (
                                                <div key={user.id} className="flex items-start p-3 hover:bg-gray-50">
                                                    <Checkbox
                                                        id={`user-${user.id}`}
                                                        checked={selectedUserIds.includes(user.id)}
                                                        onCheckedChange={() => toggleUser(user.id)}
                                                        className="mt-1"
                                                    />
                                                    <div className="ml-3">
                                                        <Label htmlFor={`user-${user.id}`} className="font-medium">
                                                            {user.prenom} {user.nom}
                                                        </Label>
                                                        <p className="text-sm text-gray-500">{user.email}</p>
                                                        <span className="inline-block mt-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                                                            {user.role}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </TabsContent>
                    </Tabs>

                    <CardFooter className="flex justify-between border-t p-6">
                        <Button type="button" variant="outline" onClick={() => router.push('/admin/simulations')}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Création en cours...
                                </>
                            ) : (
                                'Créer le scénario'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
} 