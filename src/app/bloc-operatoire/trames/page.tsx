"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Input from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-hot-toast";

export default function TramesPlanningPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [sites, setSites] = useState<any[]>([]);
    const [selectedSiteId, setSelectedSiteId] = useState<string>("");
    const [sectors, setSectors] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [surgeons, setSurgeons] = useState<any[]>([]);
    const [trames, setTrames] = useState<any[]>([]);

    const [newTrame, setNewTrame] = useState({
        name: "",
        siteId: "",
        description: "",
        dateDebut: new Date().toISOString().split('T')[0],
        isActive: true,
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                // Charger les sites
                const sitesRes = await fetch('/api/sites');
                if (sitesRes.ok) {
                    const sitesData = await sitesRes.json();
                    setSites(sitesData);
                }

                // Charger les utilisateurs
                const usersRes = await fetch('/api/utilisateurs');
                if (usersRes.ok) {
                    const usersData = await usersRes.json();
                    setUsers(usersData.filter((user: any) =>
                        user.role === 'MAR' || user.role === 'IADE'
                    ));
                    setSurgeons(usersData.filter((user: any) => user.role === 'SURGEON'));
                }

                // Charger les trames existantes
                const tramesRes = await fetch('/api/bloc-operatoire/trames');
                if (tramesRes.ok) {
                    const tramesData = await tramesRes.json();
                    setTrames(tramesData);
                }
            } catch (error) {
                console.error("Erreur lors du chargement des données initiales:", error);
                toast.error("Erreur lors du chargement des données");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Charger les secteurs et salles quand un site est sélectionné
    useEffect(() => {
        if (!selectedSiteId) return;

        const fetchSectorsAndRooms = async () => {
            try {
                // Charger les secteurs pour ce site
                const sectorsRes = await fetch(`/api/operating-sectors?siteId=${selectedSiteId}`);
                if (sectorsRes.ok) {
                    const sectorsData = await sectorsRes.json();
                    setSectors(sectorsData);
                }

                // Charger les salles associées à ce site (via les secteurs)
                const roomsRes = await fetch(`/api/operating-rooms?siteId=${selectedSiteId}`);
                if (roomsRes.ok) {
                    const roomsData = await roomsRes.json();
                    setRooms(roomsData);
                }
            } catch (error) {
                console.error("Erreur lors du chargement des secteurs et salles:", error);
            }
        };

        fetchSectorsAndRooms();
    }, [selectedSiteId]);

    const handleCreateTrame = async () => {
        if (!newTrame.name || !newTrame.siteId) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/bloc-operatoire/trames', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTrame),
            });

            if (!response.ok) {
                throw new Error(`Erreur: ${response.status}`);
            }

            const createdTrame = await response.json();
            setTrames([...trames, createdTrame]);
            toast.success("Trame créée avec succès");

            // Réinitialiser le formulaire
            setNewTrame({
                name: "",
                siteId: selectedSiteId,  // Garder le site sélectionné
                description: "",
                dateDebut: new Date().toISOString().split('T')[0],
                isActive: true,
            });
        } catch (error) {
            console.error("Erreur lors de la création de la trame:", error);
            toast.error("Erreur lors de la création de la trame");
        } finally {
            setIsLoading(false);
        }
    };

    const createDefaultSectorAndRoom = async () => {
        if (!selectedSiteId) {
            toast.error("Veuillez sélectionner un site");
            return;
        }

        setIsLoading(true);
        try {
            // 1. Créer un secteur
            const sectorResponse = await fetch('/api/operating-sectors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: "Secteur par défaut",
                    description: "Secteur créé automatiquement",
                    siteId: selectedSiteId,
                    isActive: true,
                    colorCode: "#4F46E5"
                }),
            });

            if (!sectorResponse.ok) {
                throw new Error(`Erreur lors de la création du secteur: ${sectorResponse.status}`);
            }

            const createdSector = await sectorResponse.json();

            // 2. Créer une salle dans ce secteur
            const roomResponse = await fetch('/api/operating-rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: "Salle 1",
                    number: "1",
                    operatingSectorId: createdSector.id,
                    isActive: true,
                    displayOrder: 1
                }),
            });

            if (!roomResponse.ok) {
                throw new Error(`Erreur lors de la création de la salle: ${roomResponse.status}`);
            }

            toast.success("Secteur et salle créés avec succès");

            // Recharger les secteurs et salles
            const sectorsRes = await fetch(`/api/operating-sectors?siteId=${selectedSiteId}`);
            const sectorsData = await sectorsRes.json();
            setSectors(sectorsData);

            const roomsRes = await fetch(`/api/operating-rooms?siteId=${selectedSiteId}`);
            const roomsData = await roomsRes.json();
            setRooms(roomsData);

        } catch (error) {
            console.error("Erreur:", error);
            toast.error("Erreur lors de la création des éléments");
        } finally {
            setIsLoading(false);
        }
    };

    const generatePlanningFromTrames = async (trameId: number) => {
        if (!selectedSiteId) {
            toast.error("Veuillez sélectionner un site");
            return;
        }

        setIsLoading(true);
        try {
            // Définir la période pour la génération du planning (semaine courante)
            const today = new Date();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi de la semaine courante

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche

            const response = await fetch('/api/planning/bloc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    siteId: selectedSiteId,
                    startDate: startOfWeek.toISOString(),
                    endDate: endOfWeek.toISOString(),
                    trameIds: [trameId],
                    initiatorUserId: 1, // ID factice pour l'utilisateur actuel
                }),
            });

            if (!response.ok) {
                throw new Error(`Erreur: ${response.status}`);
            }

            const result = await response.json();
            toast.success("Planning généré avec succès");

            // Rediriger vers la page du planning hebdomadaire
            window.location.href = '/planning/hebdomadaire';

        } catch (error) {
            console.error("Erreur lors de la génération du planning:", error);
            toast.error("Erreur lors de la génération du planning");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Gestion des trames de planning bloc opératoire</h1>

            <div className="mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Sélection du site</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label htmlFor="site-selector" className="block text-sm font-medium mb-1">
                                    Site hospitalier
                                </label>
                                <Select
                                    value={selectedSiteId}
                                    onValueChange={(value) => {
                                        setSelectedSiteId(value);
                                        setNewTrame({ ...newTrame, siteId: value });
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un site" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sites.map((site) => (
                                            <SelectItem key={site.id} value={site.id}>
                                                {site.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="trames">
                <TabsList className="mb-4">
                    <TabsTrigger value="trames">Trames</TabsTrigger>
                    <TabsTrigger value="secteurs-salles">Secteurs & Salles</TabsTrigger>
                    <TabsTrigger value="affectations">Affectations</TabsTrigger>
                </TabsList>

                <TabsContent value="trames">
                    <Card>
                        <CardHeader>
                            <CardTitle>Créer une nouvelle trame</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                                        Nom de la trame *
                                    </label>
                                    <Input
                                        id="name"
                                        value={newTrame.name}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTrame({ ...newTrame, name: e.target.value })}
                                        placeholder="ex: Trame standard semaine paire"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium mb-1">
                                        Description
                                    </label>
                                    <Input
                                        id="description"
                                        value={newTrame.description || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTrame({ ...newTrame, description: e.target.value })}
                                        placeholder="Description optionnelle"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="dateDebut" className="block text-sm font-medium mb-1">
                                        Date de début
                                    </label>
                                    <Input
                                        id="dateDebut"
                                        type="date"
                                        value={newTrame.dateDebut}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTrame({ ...newTrame, dateDebut: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleCreateTrame} disabled={isLoading || !selectedSiteId}>
                                {isLoading ? "Création en cours..." : "Créer la trame"}
                            </Button>
                        </CardFooter>
                    </Card>

                    <div className="mt-6">
                        <h3 className="text-lg font-medium mb-3">Trames existantes</h3>
                        {trames.length === 0 ? (
                            <p className="text-gray-500">Aucune trame disponible.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {trames.map((trame) => (
                                    <Card key={trame.id}>
                                        <CardHeader>
                                            <CardTitle>{trame.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-gray-500 text-sm mb-2">{trame.description || "Aucune description"}</p>
                                            <div className="flex items-center justify-between">
                                                <span className={`px-2 py-1 rounded text-xs ${trame.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                                    {trame.isActive ? "Active" : "Inactive"}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    Date: {new Date(trame.dateDebut).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </CardContent>
                                        <CardFooter>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => generatePlanningFromTrames(trame.id)}
                                                disabled={isLoading}
                                            >
                                                Générer planning
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="secteurs-salles">
                    <Card>
                        <CardHeader>
                            <CardTitle>Secteurs et Salles d'opération</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-6">
                                <Button onClick={createDefaultSectorAndRoom} disabled={isLoading || !selectedSiteId}>
                                    Créer un secteur et une salle par défaut
                                </Button>
                                <p className="text-sm text-gray-500 mt-2">
                                    Cette action créera un secteur par défaut avec une salle d'opération pour le site sélectionné.
                                </p>
                            </div>

                            <h3 className="font-medium mb-3">Secteurs existants</h3>
                            {sectors.length === 0 ? (
                                <p className="text-gray-500">Aucun secteur disponible pour ce site.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {sectors.map((sector) => (
                                        <Card key={sector.id} className="border-l-4" style={{ borderLeftColor: sector.colorCode || '#cbd5e1' }}>
                                            <CardContent className="py-4">
                                                <h4 className="font-medium">{sector.name}</h4>
                                                <p className="text-sm text-gray-500">{sector.description || "Aucune description"}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            <h3 className="font-medium mb-3 mt-6">Salles d'opération</h3>
                            {rooms.length === 0 ? (
                                <p className="text-gray-500">Aucune salle disponible pour ce site.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {rooms.map((room) => (
                                        <Card key={room.id}>
                                            <CardContent className="py-4">
                                                <h4 className="font-medium">{room.name}</h4>
                                                <p className="text-xs text-gray-500">Secteur: {room.sector?.name || "Non assigné"}</p>
                                                <p className="text-xs text-gray-500">Numéro: {room.number || "N/A"}</p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="affectations">
                    <Card>
                        <CardHeader>
                            <CardTitle>Créer des affectations habituelles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4">
                                Cette fonctionnalité n'est pas encore implémentée dans cette interface simplifiée.
                                Pour créer des affectations habituelles, vous devez d'abord :
                            </p>
                            <ol className="list-decimal pl-5 mb-4 space-y-2">
                                <li>Créer une trame de planning</li>
                                <li>Créer au moins un secteur avec des salles d'opération</li>
                                <li>Associer des chirurgiens et du personnel (MAR/IADE) aux salles via une interface d'administration</li>
                            </ol>
                            <p>
                                Une fois ces étapes réalisées, vous pourrez générer un planning à partir des trames et voir les résultats dans le planning hebdomadaire.
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => window.location.href = '/planning/hebdomadaire'}>
                                Voir le planning hebdomadaire
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 