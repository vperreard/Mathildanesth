'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { PlusCircleIcon, Trash2Icon, Edit3Icon, AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { TrameHebdomadaireService, TrameHebdomadaireDTO } from '@/modules/templates/services/TrameHebdomadaireService';
import { PersonnelService, Personnel } from '@/modules/templates/services/PersonnelService';
import { SalleService, Salle } from '@/modules/templates/services/SalleService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner'; // À créer/importer si ce composant n'existe pas

// Types de personnel (à affiner/importer si existent déjà)
interface BasePersonnel {
    id: string;
    nom: string;
    prenom: string;
}

interface Salle {
    id: string;
    nom: string;
}

// Énumérations pour la clarté
export enum JourSemaine {
    LUNDI = 'LUNDI',
    MARDI = 'MARDI',
    MERCREDI = 'MERCREDI',
    JEUDI = 'JEUDI',
    VENDREDI = 'VENDREDI',
    // SAMEDI = 'SAMEDI', // Optionnel
    // DIMANCHE = 'DIMANCHE' // Optionnel
}

export enum PeriodeJour {
    MATIN = 'MATIN',
    APRES_MIDI = 'APRES_MIDI',
    JOURNEE_COMPLETE = 'JOURNEE_COMPLETE' // Optionnel
}

export enum TypeSemaine {
    PAIRE = 'PAIRE',
    IMPAIRE = 'IMPAIRE',
    TOUTES = 'TOUTES'
}

interface AffectationTrame {
    id: string; // uuid
    jourSemaine: JourSemaine;
    periode: PeriodeJour;
    salleId?: string | null;
    chirurgienId?: string | null;
    marId?: string | null;
    iadeId?: string | null;
    // autres rôles ou informations spécifiques à l'affectation
    // Par exemple: typeActivite?: string;
}

interface TrameHebdomadaire {
    id: string; // uuid
    nom: string;
    typeSemaine: TypeSemaine;
    description?: string; // Optionnel
    affectations: AffectationTrame[];
    // Potentiellement des métadonnées: dateCreation, dateModification
}

interface EditingCellInfo {
    jour: JourSemaine;
    periode: PeriodeJour;
    affectation?: AffectationTrame | null;
}

// Données mockées pour le développement
const mockSalles: Salle[] = [
    { id: 'salle1', nom: 'Salle Op 1' },
    { id: 'salle2', nom: 'Salle Op 2' },
    { id: 'salle3', nom: 'Salle Endoscopie' },
    { id: 'salle-na', nom: 'N/A - Pas de salle' }
];

const mockChirurgiens: BasePersonnel[] = [
    { id: 'chir1', nom: 'Dupont', prenom: 'Jean' },
    { id: 'chir2', nom: 'Martin', prenom: 'Alice' },
    { id: 'chir3', nom: 'Bernard', prenom: 'Paul' },
    { id: 'chir-na', nom: 'N/A', prenom: '' }
];

const mockMARs: BasePersonnel[] = [
    { id: 'mar1', nom: 'Durand', prenom: 'Sophie' },
    { id: 'mar2', nom: 'Leroy', prenom: 'Luc' },
    { id: 'mar-na', nom: 'N/A', prenom: '' }
];

const mockIADEs: BasePersonnel[] = [
    { id: 'iade1', nom: 'Petit', prenom: 'Marc' },
    { id: 'iade2', nom: 'Moreau', prenom: 'Eva' },
    { id: 'iade-na', nom: 'N/A', prenom: '' }
];

const mockTramesInitiales: TrameHebdomadaire[] = [
    {
        id: 'trame-paires-std',
        nom: 'Standard Semaines PAIRES',
        typeSemaine: TypeSemaine.PAIRE,
        description: 'Configuration type pour les semaines paires',
        affectations: [
            { id: 'aff-p1', jourSemaine: JourSemaine.LUNDI, periode: PeriodeJour.MATIN, salleId: 'salle1', chirurgienId: 'chir1', marId: 'mar1', iadeId: 'iade1' },
            { id: 'aff-p2', jourSemaine: JourSemaine.MARDI, periode: PeriodeJour.APRES_MIDI, salleId: 'salle2', chirurgienId: 'chir2', marId: 'mar1' },
        ]
    },
    {
        id: 'trame-impaires-cardio',
        nom: 'Cardio Semaines IMPAIRES',
        typeSemaine: TypeSemaine.IMPAIRE,
        description: 'Rotation cardio pour les semaines impaires',
        affectations: [
            { id: 'aff-i1', jourSemaine: JourSemaine.MERCREDI, periode: PeriodeJour.MATIN, salleId: 'salle1', chirurgienId: 'chir3', iadeId: 'iade2' },
            { id: 'aff-i3', jourSemaine: JourSemaine.VENDREDI, periode: PeriodeJour.MATIN, salleId: 'salle3', chirurgienId: 'chir1' },
            { id: 'aff-i4', jourSemaine: JourSemaine.VENDREDI, periode: PeriodeJour.APRES_MIDI, salleId: 'salle3', chirurgienId: 'chir1', marId: 'mar2', iadeId: 'iade1' },
        ]
    },
    {
        id: 'trame-toutes-consult',
        nom: 'Consultations Générales',
        typeSemaine: TypeSemaine.TOUTES,
        affectations: [
            { id: 'aff-t1', jourSemaine: JourSemaine.JEUDI, periode: PeriodeJour.APRES_MIDI, chirurgienId: 'chir2' }, // Pas de salle spécifique
        ]
    }
];

// Constantes pour la grille
const joursDeLaSemaine = Object.values(JourSemaine);
const periodesDeLaJournee = Object.values(PeriodeJour);

const EditeurTramesHebdomadaires: React.FC = () => {
    // États pour les données
    const [trames, setTrames] = useState<TrameHebdomadaire[]>([]);
    const [salles, setSalles] = useState<Salle[]>([]);
    const [chirurgiens, setChirurgiens] = useState<Personnel[]>([]);
    const [mars, setMars] = useState<Personnel[]>([]);
    const [iades, setIades] = useState<Personnel[]>([]);

    // États d'interface
    const [selectedTrame, setSelectedTrame] = useState<TrameHebdomadaire | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newTrameNom, setNewTrameNom] = useState('');
    const [newTrameTypeSemaine, setNewTrameTypeSemaine] = useState<TypeSemaine>(TypeSemaine.TOUTES);
    const [newTrameDescription, setNewTrameDescription] = useState('');

    // États de la modale d'affectation
    const [isAffectationModalOpen, setIsAffectationModalOpen] = useState(false);
    const [editingCellInfo, setEditingCellInfo] = useState<EditingCellInfo | null>(null);
    const [currentModalSalleId, setCurrentModalSalleId] = useState<string | null>(null);
    const [currentModalChirurgienId, setCurrentModalChirurgienId] = useState<string | null>(null);
    const [currentModalMarId, setCurrentModalMarId] = useState<string | null>(null);
    const [currentModalIadeId, setCurrentModalIadeId] = useState<string | null>(null);

    // États de chargement et d'erreur
    const [isLoadingTrames, setIsLoadingTrames] = useState(true);
    const [isLoadingPersonnel, setIsLoadingPersonnel] = useState(true);
    const [isLoadingSalles, setIsLoadingSalles] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Effet pour charger les données initiales
    useEffect(() => {
        fetchData();
    }, []);

    // Fonction pour charger toutes les données nécessaires
    const fetchData = async () => {
        setError(null);
        await Promise.all([
            fetchTrames(),
            fetchPersonnel(),
            fetchSalles()
        ]);
    };

    // Chargement des trames
    const fetchTrames = async () => {
        setIsLoadingTrames(true);
        try {
            const tramesData = await TrameHebdomadaireService.getAllTrames();
            setTrames(tramesData);
            setIsLoadingTrames(false);
        } catch (err) {
            console.error("Erreur lors du chargement des trames:", err);
            setError("Impossible de charger les trames. Veuillez réessayer plus tard.");
            setIsLoadingTrames(false);
        }
    };

    // Chargement du personnel
    const fetchPersonnel = async () => {
        setIsLoadingPersonnel(true);
        try {
            const [chirurgiensData, marsData, iadesData] = await Promise.all([
                PersonnelService.getChirurgiens(),
                PersonnelService.getMARs(),
                PersonnelService.getIADEs()
            ]);

            setChirurgiens(chirurgiensData);
            setMars(marsData);
            setIades(iadesData);
            setIsLoadingPersonnel(false);
        } catch (err) {
            console.error("Erreur lors du chargement du personnel:", err);
            setError("Impossible de charger les données du personnel. Veuillez réessayer plus tard.");
            setIsLoadingPersonnel(false);
        }
    };

    // Chargement des salles
    const fetchSalles = async () => {
        setIsLoadingSalles(true);
        try {
            const sallesData = await SalleService.getSalles();
            setSalles(sallesData);
            setIsLoadingSalles(false);
        } catch (err) {
            console.error("Erreur lors du chargement des salles:", err);
            setError("Impossible de charger les salles. Veuillez réessayer plus tard.");
            setIsLoadingSalles(false);
        }
    };

    // Création d'une nouvelle trame
    const handleCreateNewTrame = async () => {
        if (!newTrameNom.trim()) {
            alert("Le nom de la trame ne peut pas être vide.");
            return;
        }

        setIsSaving(true);
        try {
            const newTrame = {
                nom: newTrameNom,
                typeSemaine: newTrameTypeSemaine,
                description: newTrameDescription || 'Nouvelle trame',
                affectations: []
            };

            const createdTrame = await TrameHebdomadaireService.createTrame(newTrame);
            setTrames(prevTrames => [...prevTrames, createdTrame]);
            setSelectedTrame(createdTrame);
            setNewTrameNom('');
            setNewTrameTypeSemaine(TypeSemaine.TOUTES);
            setNewTrameDescription('');
            setIsCreating(false);
            setIsSaving(false);
        } catch (err) {
            console.error("Erreur lors de la création de la trame:", err);
            setError("Impossible de créer la trame. Veuillez réessayer plus tard.");
            setIsSaving(false);
        }
    };

    // Suppression d'une trame
    const handleDeleteTrame = async (trameId: string) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette trame ?")) {
            return;
        }

        setIsSaving(true);
        try {
            const success = await TrameHebdomadaireService.deleteTrame(trameId);
            if (success) {
                setTrames(prevTrames => prevTrames.filter(t => t.id !== trameId));
                if (selectedTrame?.id === trameId) {
                    setSelectedTrame(null);
                }
                setIsSaving(false);
            } else {
                throw new Error("La suppression a échoué");
            }
        } catch (err) {
            console.error(`Erreur lors de la suppression de la trame ${trameId}:`, err);
            setError("Impossible de supprimer la trame. Veuillez réessayer plus tard.");
            setIsSaving(false);
        }
    };

    // Ouverture de la modale d'affectation
    const openAffectationModal = (jour: JourSemaine, periode: PeriodeJour) => {
        if (!selectedTrame) return;

        const existingAffectation = selectedTrame.affectations.find(
            aff => aff.jourSemaine === jour && aff.periode === periode
        );

        setEditingCellInfo({ jour, periode, affectation: existingAffectation });
        setCurrentModalSalleId(existingAffectation?.salleId || 'salle-na');
        setCurrentModalChirurgienId(existingAffectation?.chirurgienId || 'chir-na');
        setCurrentModalMarId(existingAffectation?.marId || 'mar-na');
        setCurrentModalIadeId(existingAffectation?.iadeId || 'iade-na');
        setIsAffectationModalOpen(true);
    };

    // Sauvegarde d'une affectation
    const handleSaveAffectation = async () => {
        if (!selectedTrame || !editingCellInfo) return;

        setIsSaving(true);
        const { jour, periode } = editingCellInfo;
        let newAffectations = [...selectedTrame.affectations];
        const existingAffectationIndex = newAffectations.findIndex(
            aff => aff.jourSemaine === jour && aff.periode === periode
        );

        const salleIdToSave = currentModalSalleId === 'salle-na' ? null : currentModalSalleId;
        const chirurgienIdToSave = currentModalChirurgienId === 'chir-na' ? null : currentModalChirurgienId;
        const marIdToSave = currentModalMarId === 'mar-na' ? null : currentModalMarId;
        const iadeIdToSave = currentModalIadeId === 'iade-na' ? null : currentModalIadeId;

        // L'affectation est considérée comme non vide si au moins un élément est défini
        if (salleIdToSave || chirurgienIdToSave || marIdToSave || iadeIdToSave) {
            const newOrUpdatedAffectation: AffectationTrame = {
                id: editingCellInfo.affectation?.id || `affect-${Date.now()}`,
                jourSemaine: jour,
                periode: periode,
                salleId: salleIdToSave,
                chirurgienId: chirurgienIdToSave,
                marId: marIdToSave,
                iadeId: iadeIdToSave,
            };

            if (existingAffectationIndex !== -1) {
                newAffectations[existingAffectationIndex] = newOrUpdatedAffectation;
            } else {
                newAffectations.push(newOrUpdatedAffectation);
            }
        } else {
            if (existingAffectationIndex !== -1) {
                newAffectations.splice(existingAffectationIndex, 1);
            }
        }

        const updatedTrame = { ...selectedTrame, affectations: newAffectations };

        try {
            const savedTrame = await TrameHebdomadaireService.updateTrame(updatedTrame.id, updatedTrame);
            setSelectedTrame(savedTrame);
            setTrames(prevTrames => prevTrames.map(t => t.id === savedTrame.id ? savedTrame : t));
            setIsAffectationModalOpen(false);
            setEditingCellInfo(null);
            setIsSaving(false);
        } catch (err) {
            console.error("Erreur lors de la sauvegarde de l'affectation:", err);
            setError("Impossible de sauvegarder l'affectation. Veuillez réessayer plus tard.");
            setIsSaving(false);
        }
    };

    // Suppression d'une affectation directement depuis la modale
    const handleRemoveAffectationInModal = async () => {
        if (!selectedTrame || !editingCellInfo) return;

        setIsSaving(true);
        const { jour, periode } = editingCellInfo;
        let newAffectations = selectedTrame.affectations.filter(
            aff => !(aff.jourSemaine === jour && aff.periode === periode)
        );

        const updatedTrame = { ...selectedTrame, affectations: newAffectations };

        try {
            const savedTrame = await TrameHebdomadaireService.updateTrame(updatedTrame.id, updatedTrame);
            setSelectedTrame(savedTrame);
            setTrames(prevTrames => prevTrames.map(t => t.id === savedTrame.id ? savedTrame : t));
            setIsAffectationModalOpen(false);
            setEditingCellInfo(null);
            setIsSaving(false);
        } catch (err) {
            console.error("Erreur lors de la suppression de l'affectation:", err);
            setError("Impossible de supprimer l'affectation. Veuillez réessayer plus tard.");
            setIsSaving(false);
        }
    };

    // Rendu des affectations dans la grille
    const renderAffectation = (affectation: AffectationTrame | undefined) => {
        if (!affectation || (!affectation.salleId && !affectation.chirurgienId && !affectation.marId && !affectation.iadeId))
            return <div className="text-xs text-gray-400 italic">Vide</div>;

        const chir = chirurgiens.find(c => c.id === affectation.chirurgienId);
        const salle = salles.find(s => s.id === affectation.salleId);
        const mar = mars.find(m => m.id === affectation.marId);
        const iade = iades.find(i => i.id === affectation.iadeId);

        return (
            <div className="bg-blue-100 p-1 rounded text-xs text-blue-800 shadow-sm w-full text-left space-y-0.5">
                {chir && chir.id !== 'chir-na' && <div className="font-semibold truncate">C: {`${chir.prenom.charAt(0)}. ${chir.nom}`}</div>}
                {salle && salle.id !== 'salle-na' && <div className="text-gray-700 truncate">S: {salle.nom}</div>}
                {mar && mar.id !== 'mar-na' && <div className="text-green-700 truncate">M: {`${mar.prenom.charAt(0)}. ${mar.nom}`}</div>}
                {iade && iade.id !== 'iade-na' && <div className="text-purple-700 truncate">I: {`${iade.prenom.charAt(0)}. ${iade.nom}`}</div>}
            </div>
        );
    };

    // État de chargement global
    const isLoading = isLoadingTrames || isLoadingPersonnel || isLoadingSalles;

    // Si une erreur s'est produite
    if (error) {
        return (
            <div className="space-y-6">
                <Alert variant="destructive">
                    <AlertCircleIcon className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>
                        {error}
                        <Button
                            variant="outline"
                            size="sm"
                            className="ml-4"
                            onClick={fetchData}
                        >
                            <RefreshCwIcon className="h-4 w-4 mr-1" /> Réessayer
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Si en cours de chargement
    if (isLoading) {
        return (
            <div className="h-[300px] flex flex-col items-center justify-center">
                <div className="mb-2">{/* Remplacer par votre composant Spinner */}Chargement...</div>
                <p className="text-gray-500 text-sm">Chargement des données en cours...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Éditeur de Trames Habituelles (Hebdomadaires)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 mb-6">
                        Configurez ici les affectations récurrentes pour vos plannings hebdomadaires.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                        {/* Colonne de gauche : Liste des trames et création */}
                        <div className="col-span-1 md:col-span-1 space-y-4 border-r md:pr-6">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold">Trames Existantes</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsCreating(true)}
                                    className="text-blue-600 hover:text-blue-700"
                                    disabled={isLoading || isSaving}
                                >
                                    <PlusCircleIcon className="w-4 h-4 mr-1" /> Créer
                                </Button>
                            </div>

                            {isCreating && (
                                <Card className="p-4 bg-slate-50">
                                    <CardHeader className="p-0 pb-2">
                                        <CardTitle className="text-md">Nouvelle Trame</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0 space-y-3">
                                        <div>
                                            <Label htmlFor="newTrameNom">Nom de la trame</Label>
                                            <Input
                                                id="newTrameNom"
                                                value={newTrameNom}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTrameNom(e.target.value)}
                                                placeholder="Ex: Standard Sem. Paires"
                                                disabled={isSaving}
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="newTrameTypeSemaine">Type de semaine</Label>
                                            <Select
                                                value={newTrameTypeSemaine}
                                                onValueChange={(value) => setNewTrameTypeSemaine(value as TypeSemaine)}
                                                disabled={isSaving}
                                            >
                                                <SelectTrigger id="newTrameTypeSemaine">
                                                    <SelectValue placeholder="Sélectionner type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.values(TypeSemaine).map(type => (
                                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label htmlFor="newTrameDescription">Description (facultatif)</Label>
                                            <Input
                                                id="newTrameDescription"
                                                value={newTrameDescription}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTrameDescription(e.target.value)}
                                                placeholder="Description courte..."
                                                disabled={isSaving}
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-2 mt-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsCreating(false)}
                                                disabled={isSaving}
                                            >
                                                Annuler
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleCreateNewTrame}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? 'Création...' : 'Valider'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {trames.length === 0 && !isCreating && (
                                <p className="text-sm text-gray-500">Aucune trame définie. Cliquez sur "Créer" pour commencer.</p>
                            )}

                            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                {trames.map(trame => (
                                    <Button
                                        key={trame.id}
                                        variant={selectedTrame?.id === trame.id ? "default" : "outline"}
                                        onClick={() => { setSelectedTrame(trame); setIsCreating(false); }}
                                        className="w-full justify-start text-left h-auto py-2 relative group"
                                        disabled={isSaving}
                                    >
                                        <div className="flex flex-col flex-grow">
                                            <span className="font-medium">{trame.nom}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{trame.typeSemaine} - {trame.affectations.length} affect.</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-700"
                                            onClick={(e) => { e.stopPropagation(); handleDeleteTrame(trame.id); }}
                                            aria-label="Supprimer la trame"
                                            disabled={isSaving}
                                        >
                                            <Trash2Icon className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Colonne de droite : Éditeur visuel pour la trame sélectionnée */}
                        <div className="col-span-1 md:col-span-2">
                            {selectedTrame ? (
                                <div className="border rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 className="text-xl font-semibold">Édition: <span className="text-blue-600">{selectedTrame.nom}</span></h3>
                                            <p className="text-sm text-gray-500">Type: {selectedTrame.typeSemaine} {selectedTrame.description && `- ${selectedTrame.description}`}</p>
                                        </div>
                                        {isSaving && <p className="text-sm text-blue-500">Sauvegarde en cours...</p>}
                                    </div>

                                    <div className="grid grid-cols-5 gap-1 bg-gray-50 p-1 rounded">
                                        {joursDeLaSemaine.map(jour => (
                                            <div key={jour} className="text-center font-medium text-sm py-2 capitalize select-none">
                                                {jour.toLowerCase()}
                                            </div>
                                        ))}

                                        {joursDeLaSemaine.flatMap(jour =>
                                            periodesDeLaJournee.map(periode => {
                                                const affectationExistante = selectedTrame.affectations.find(
                                                    aff => aff.jourSemaine === jour && aff.periode === periode
                                                );
                                                return (
                                                    <div
                                                        key={`${jour}-${periode}`}
                                                        className={`bg-white border rounded p-2 min-h-[100px] ${!isSaving ? 'hover:bg-slate-100 cursor-pointer' : ''} flex flex-col justify-between items-start group relative`}
                                                        onClick={() => !isSaving && openAffectationModal(jour, periode)}
                                                    >
                                                        <div className="text-xs text-gray-400 self-start capitalize pb-1 select-none">{periode.toLowerCase()}</div>
                                                        <div className="flex-grow flex items-start justify-start w-full mt-1">
                                                            {renderAffectation(affectationExistante)}
                                                        </div>
                                                        {!isSaving && (
                                                            <Button variant="ghost" size="icon" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 hover:bg-slate-200 w-6 h-6">
                                                                <Edit3Icon className="w-3 h-3 text-slate-600" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 border-2 border-dashed border-gray-300 rounded-md min-h-[400px] flex items-center justify-center bg-slate-50">
                                    <p className="text-gray-400 text-center">Sélectionnez une trame à éditer ou créez-en une nouvelle pour commencer.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Modale d'édition d'affectation */}
            {editingCellInfo && selectedTrame && (
                <Dialog open={isAffectationModalOpen} onOpenChange={setIsAffectationModalOpen}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>Éditer l'affectation</DialogTitle>
                            <DialogDescription>
                                Pour {editingCellInfo.jour.toLowerCase()} - {editingCellInfo.periode.toLowerCase()} de la trame "{selectedTrame.nom}".
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="salle-modal" className="text-right">Salle</Label>
                                <Select value={currentModalSalleId || 'salle-na'} onValueChange={setCurrentModalSalleId} disabled={isSaving}>
                                    <SelectTrigger id="salle-modal" className="col-span-3">
                                        <SelectValue placeholder="Choisir une salle" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {salles.map(s => <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="chirurgien-modal" className="text-right">Chirurgien</Label>
                                <Select value={currentModalChirurgienId || 'chir-na'} onValueChange={setCurrentModalChirurgienId} disabled={isSaving}>
                                    <SelectTrigger id="chirurgien-modal" className="col-span-3">
                                        <SelectValue placeholder="Choisir un chirurgien" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {chirurgiens.map(c => <SelectItem key={c.id} value={c.id}>{`${c.prenom} ${c.nom}`}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="mar-modal" className="text-right">MAR</Label>
                                <Select value={currentModalMarId || 'mar-na'} onValueChange={setCurrentModalMarId} disabled={isSaving}>
                                    <SelectTrigger id="mar-modal" className="col-span-3">
                                        <SelectValue placeholder="Choisir un MAR" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mars.map(m => <SelectItem key={m.id} value={m.id}>{`${m.prenom} ${m.nom}`}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="iade-modal" className="text-right">IADE</Label>
                                <Select value={currentModalIadeId || 'iade-na'} onValueChange={setCurrentModalIadeId} disabled={isSaving}>
                                    <SelectTrigger id="iade-modal" className="col-span-3">
                                        <SelectValue placeholder="Choisir un IADE" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {iades.map(i => <SelectItem key={i.id} value={i.id}>{`${i.prenom} ${i.nom}`}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="justify-between sm:justify-between">
                            {editingCellInfo.affectation && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleRemoveAffectationInModal}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Suppression...' : 'Retirer l\'affectation'}
                                </Button>
                            )}
                            {!editingCellInfo.affectation && <div />}
                            <div className="flex space-x-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" disabled={isSaving}>Annuler</Button>
                                </DialogClose>
                                <Button
                                    type="button"
                                    onClick={handleSaveAffectation}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default EditeurTramesHebdomadaires; 