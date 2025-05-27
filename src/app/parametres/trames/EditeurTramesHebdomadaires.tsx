'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { PlusCircleIcon, Trash2Icon, Edit3Icon, AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { TrameHebdomadaireService, TrameHebdomadaireDTO } from '@/modules/modèles/services/TrameHebdomadaireService';
import { PersonnelService, Personnel } from '@/modules/modèles/services/PersonnelService';
import { SalleService, OperatingRoomFromAPI } from '@/modules/modèles/services/SalleService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RecurrenceTypeTrame, TypeSemaineTrame } from '@prisma/client';

// Types de personnel (à affiner/importer si existent déjà)
interface BasePersonnel {
    id: string;
    nom: string;
    prenom: string;
}

interface Salle {
    id: string;
    name: string;
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

export enum RoleType {
    MAR = 'MAR',
    IADE = 'IADE',
    CHIRURGIEN = 'CHIRURGIEN',
    TOUS = 'TOUS'
}

interface AffectationTrame {
    id: string; // uuid
    jourSemaine: JourSemaine;
    periode: PeriodeJour;
    salleId?: string | null;
    chirurgienId?: string | null;
    marId?: string | null;
    iadeId?: string | null;
    // autres rôles ou informations spécifiques à l'garde/vacation
    // Par exemple: typeActivite?: string;
}

interface TrameHebdomadaire {
    id: string; // uuid
    name: string;
    typeSemaine: TypeSemaine;
    description?: string; // Optionnel
    roles?: RoleType[]; // Rôles associés à la tableau de service
    gardes/vacations: AffectationTrame[];
    // Potentiellement des métadonnées: dateCreation, dateModification
    siteId?: string | null;
    isActive?: boolean;
    dateDebutEffet?: string | Date;
    dateFinEffet?: string | Date | null;
    recurrenceType?: RecurrenceTypeTrame; // Importer depuis @prisma/client si besoin
    joursSemaineActifs?: number[];
}

interface EditingCellInfo {
    jour: JourSemaine;
    periode: PeriodeJour;
    garde/vacation?: AffectationTrame | null;
}

// Données mockées pour le développement
const mockSalles: Salle[] = [
    { id: 'salle1', name: 'Salle Op 1' },
    { id: 'salle2', name: 'Salle Op 2' },
    { id: 'salle3', name: 'Salle Endoscopie' },
    { id: 'salle-na', name: 'N/A - Pas de salle' }
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
        id: 'tableau de service-paires-std',
        name: 'Standard Semaines PAIRES',
        typeSemaine: TypeSemaine.PAIRE,
        description: 'Configuration type pour les semaines paires',
        gardes/vacations: [
            { id: 'aff-p1', jourSemaine: JourSemaine.LUNDI, periode: PeriodeJour.MATIN, salleId: 'salle1', chirurgienId: 'chir1', marId: 'mar1', iadeId: 'iade1' },
            { id: 'aff-p2', jourSemaine: JourSemaine.MARDI, periode: PeriodeJour.APRES_MIDI, salleId: 'salle2', chirurgienId: 'chir2', marId: 'mar1' },
        ]
    },
    {
        id: 'tableau de service-impaires-cardio',
        name: 'Cardio Semaines IMPAIRES',
        typeSemaine: TypeSemaine.IMPAIRE,
        description: 'Rotation cardio pour les semaines impaires',
        gardes/vacations: [
            { id: 'aff-i1', jourSemaine: JourSemaine.MERCREDI, periode: PeriodeJour.MATIN, salleId: 'salle1', chirurgienId: 'chir3', iadeId: 'iade2' },
            { id: 'aff-i3', jourSemaine: JourSemaine.VENDREDI, periode: PeriodeJour.MATIN, salleId: 'salle3', chirurgienId: 'chir1' },
            { id: 'aff-i4', jourSemaine: JourSemaine.VENDREDI, periode: PeriodeJour.APRES_MIDI, salleId: 'salle3', chirurgienId: 'chir1', marId: 'mar2', iadeId: 'iade1' },
        ]
    },
    {
        id: 'tableau de service-toutes-consult',
        name: 'Consultations Générales',
        typeSemaine: TypeSemaine.TOUTES,
        gardes/vacations: [
            { id: 'aff-t1', jourSemaine: JourSemaine.JEUDI, periode: PeriodeJour.APRES_MIDI, chirurgienId: 'chir2' }, // Pas de salle spécifique
        ]
    }
];

// Constantes pour la grille
const joursDeLaSemaine = Object.values(JourSemaine);
const periodesDeLaJournee = Object.values(PeriodeJour);

const EditeurTramesHebdomadaires: React.FC = () => {
    // États pour les données
    const [tableaux de service, setTrames] = useState<TrameHebdomadaire[]>([]);
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

    // États de la modale d'garde/vacation
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

    // Chargement des tableaux de service
    const fetchTrames = async () => {
        setIsLoadingTrames(true);
        try {
            const tramesDataDTO = await TrameHebdomadaireService.getAllTrames();
            console.log('[DEBUG] fetchTrames - DTO data:', tramesDataDTO);
            // Mapper DTO en TrameHebdomadaire local
            const tramesDataLocal: TrameHebdomadaire[] = tramesDataDTO.map(dto => {
                const localAffectations: AffectationTrame[] = (dto.gardes/vacations || []).map((affDto): AffectationTrame => ({
                    id: affDto.id ? affDto.id.toString() : `generated-aff-${Math.random().toString(36).substring(7)}`,
                    jourSemaine: affDto.jourSemaine as JourSemaine,
                    periode: affDto.periode as PeriodeJour,
                    salleId: affDto.salleId ? affDto.salleId.toString() : null,
                    chirurgienId: affDto.chirurgienId ? affDto.chirurgienId.toString() : null,
                    marId: affDto.marId ? affDto.marId.toString() : null,
                    iadeId: affDto.iadeId ? affDto.iadeId.toString() : null,
                }));

                return {
                    id: dto.id.toString(),
                    name: dto.name || dto.nom || 'Tableau de service sans nom',
                    typeSemaine: mapApiTypeSemaineToLocal(dto.typeSemaine),
                    description: dto.description || undefined,
                    gardes/vacations: localAffectations,
                    siteId: dto.siteId,
                    isActive: dto.isActive,
                    dateDebutEffet: dto.dateDebutEffet,
                    dateFinEffet: dto.dateFinEffet,
                    recurrenceType: dto.recurrenceType,
                    joursSemaineActifs: dto.joursSemaineActifs,
                };
            });
            setTrames(tramesDataLocal);
            setIsLoadingTrames(false);
        } catch (err) {
            console.error("Erreur lors du chargement des tableaux de service:", err);
            setError("Impossible de charger les tableaux de service. Veuillez réessayer plus tard.");
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

            console.log('[DEBUG] Chirurgiens Data:', chirurgiensData);
            console.log('[DEBUG] MARs Data:', marsData);
            console.log('[DEBUG] IADEs Data:', iadesData);

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
            const sallesDataAPI = await SalleService.getSalles();
            console.log('[DEBUG] Salles Data API:', sallesDataAPI);
            // Mapper OperatingRoomFromAPI en Salle locale
            const sallesDataLocal: Salle[] = sallesDataAPI.map(apiSalle => ({
                id: apiSalle.id ? apiSalle.id.toString() : `salle-generated-${Math.random()}`, // Assurer que l'id est string
                name: apiSalle.name || 'Salle sans nom', // Utiliser name, fallback si besoin
            }));
            console.log('[DEBUG] Salles Data Local:', sallesDataLocal);
            setSalles(sallesDataLocal);
            setIsLoadingSalles(false);
        } catch (err) {
            console.error("Erreur lors du chargement des salles:", err);
            setError("Impossible de charger les salles. Veuillez réessayer plus tard.");
            setIsLoadingSalles(false);
        }
    };

    // Création d'une nouvelle tableau de service
    const handleCreateNewTrame = async () => {
        if (!newTrameNom.trim()) {
            alert("Le nom de la tableau de service ne peut pas être vide.");
            return;
        }

        setIsSaving(true);
        try {
            // Structure attendue par TrameHebdomadaireService.createTrame est CreateTrameModelePayload
            // qui est Omit<TrameHebdomadaireDTO, 'id' | 'gardes/vacations'> mais avec des champs spécifiques
            const payloadForCreate: Omit<TrameHebdomadaireDTO, 'id' | 'gardes/vacations'> = {
                name: newTrameNom,
                typeSemaine: mapLocalTypeSemaineToApi(newTrameTypeSemaine),
                description: newTrameDescription || null,
            };

            console.log('[DEBUG] handleCreateNewTrame - Payload for create:', payloadForCreate);
            const createdTrameDTO = await TrameHebdomadaireService.createTrame(payloadForCreate);
            console.log('[DEBUG] handleCreateNewTrame - Created DTO:', createdTrameDTO);

            // Mapper le DTO retourné vers TrameHebdomadaire local
            const createdTrameLocal: TrameHebdomadaire = {
                id: createdTrameDTO.id.toString(),
                name: createdTrameDTO.name || createdTrameDTO.nom || 'Tableau de service sans nom',
                typeSemaine: mapApiTypeSemaineToLocal(createdTrameDTO.typeSemaine),
                description: createdTrameDTO.description || undefined,
                gardes/vacations: [],
                siteId: createdTrameDTO.siteId,
                isActive: createdTrameDTO.isActive,
                dateDebutEffet: createdTrameDTO.dateDebutEffet,
                dateFinEffet: createdTrameDTO.dateFinEffet,
                recurrenceType: createdTrameDTO.recurrenceType,
                joursSemaineActifs: createdTrameDTO.joursSemaineActifs,
            };

            setTrames(prevTrames => [...prevTrames, createdTrameLocal]);
            setSelectedTrame(createdTrameLocal);
            setNewTrameNom('');
            setNewTrameTypeSemaine(TypeSemaine.TOUTES);
            setNewTrameDescription('');
            setIsCreating(false);
            setIsSaving(false);
        } catch (err) {
            console.error("Erreur lors de la création de la tableau de service:", err);
            setError("Impossible de créer la tableau de service. Veuillez réessayer plus tard.");
            setIsSaving(false);
        }
    };

    // Suppression d'une tableau de service
    const handleDeleteTrame = async (trameId: string) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette tableau de service ?")) {
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
            console.error(`Erreur lors de la suppression de la tableau de service ${trameId}:`, err);
            setError("Impossible de supprimer la tableau de service. Veuillez réessayer plus tard.");
            setIsSaving(false);
        }
    };

    // Ouverture de la modale d'garde/vacation
    const openAffectationModal = (jour: JourSemaine, periode: PeriodeJour) => {
        if (!selectedTrame) return;

        const existingAffectation = selectedTrame.gardes/vacations?.find(
            aff => aff.jourSemaine === jour && aff.periode === periode
        );

        console.log('[DEBUG] openAffectationModal - Jour:', jour, 'Periode:', periode);
        console.log('[DEBUG] openAffectationModal - Selected Tableau de service:', selectedTrame);
        console.log('[DEBUG] openAffectationModal - Existing Garde/Vacation:', existingAffectation);

        setEditingCellInfo({ jour, periode, garde/vacation: existingAffectation || null });
        setCurrentModalSalleId(existingAffectation?.salleId || null);
        setCurrentModalChirurgienId(existingAffectation?.chirurgienId || null);
        setCurrentModalMarId(existingAffectation?.marId || null);
        setCurrentModalIadeId(existingAffectation?.iadeId || null);
        setIsAffectationModalOpen(true);
    };

    // Sauvegarde d'une garde/vacation
    const handleSaveAffectation = async () => {
        if (!selectedTrame || !editingCellInfo) return;

        setIsSaving(true);
        try {
            const { jour, periode, garde/vacation: existingAffectation } = editingCellInfo;
            let newAffectations = [...(selectedTrame.gardes/vacations || [])];

            if (existingAffectation) {
                newAffectations = newAffectations.map(aff =>
                    aff.id === existingAffectation.id
                        ? { ...aff, salleId: currentModalSalleId, chirurgienId: currentModalChirurgienId, marId: currentModalMarId, iadeId: currentModalIadeId }
                        : aff
                );
            } else {
                const newAffectation: AffectationTrame = {
                    id: `local-aff-${Date.now()}-${Math.random().toString(36).substring(7)}`, // ID purement local pour la clé React
                    jourSemaine: jour,
                    periode: periode,
                    salleId: currentModalSalleId,
                    chirurgienId: currentModalChirurgienId,
                    marId: currentModalMarId,
                    iadeId: currentModalIadeId
                };
                newAffectations.push(newAffectation);
            }

            const updatedTrameForState = {
                ...selectedTrame,
                gardes/vacations: newAffectations
            };

            console.log('[DEBUG] handleSaveAffectation - Updated Tableau de service for State (local gardes/vacations):', updatedTrameForState);

            // TODO IMPORTANT: La sauvegarde des gardes/vacations doit se faire via une API dédiée,
            // par exemple /api/tableau de service-modeles/{trameId}/gardes/vacations.
            // TrameHebdomadaireService.updateTrame ne gère probablement pas la mise à jour des gardes/vacations.
            // Pour l'instant, on met à jour l'état local et on simule une sauvegarde de la tableau de service principale (sans ses gardes/vacations).

            const trameDetailsToUpdate: TrameHebdomadaireDTO = {
                id: selectedTrame.id,
                name: selectedTrame.name,
                typeSemaine: mapLocalTypeSemaineToApi(selectedTrame.typeSemaine),
                description: selectedTrame.description || null,
                gardes/vacations: [],
                siteId: selectedTrame.siteId,
                isActive: selectedTrame.isActive,
                dateDebutEffet: selectedTrame.dateDebutEffet ? new Date(selectedTrame.dateDebutEffet).toISOString() : undefined,
                dateFinEffet: selectedTrame.dateFinEffet ? new Date(selectedTrame.dateFinEffet).toISOString() : null,
                recurrenceType: selectedTrame.recurrenceType,
                joursSemaineActifs: selectedTrame.joursSemaineActifs,
            };
            console.log('[DEBUG] handleSaveAffectation - DTO for updateTrame (details only):', trameDetailsToUpdate);

            await TrameHebdomadaireService.updateTrame(selectedTrame.id, trameDetailsToUpdate);


            // Mise à jour de l'état local pour refléter les changements d'gardes/vacations (UI)
            setSelectedTrame(updatedTrameForState);
            setTrames(prevTrames =>
                prevTrames.map(t => t.id === updatedTrameForState.id ? updatedTrameForState : t)
            );

            setIsAffectationModalOpen(false);
            setEditingCellInfo(null);
            // TODO: Afficher un message indiquant que les détails de la tableau de service sont sauvegardés,
            // mais que la sauvegarde individuelle des gardes/vacations est un TODO ou se fait autrement.
            // toast.success('Détails de la tableau de service sauvegardés. Sauvegarde des gardes/vacations à implémenter via API dédiée.');

        } catch (err) {
            console.error("Erreur lors de la sauvegarde de l'garde/vacation:", err);
            setError("Impossible de sauvegarder l'garde/vacation. Veuillez réessayer plus tard.");
        } finally {
            setIsSaving(false);
        }
    };

    // Suppression d'une garde/vacation directement depuis la modale
    const handleRemoveAffectationInModal = async () => {
        if (!selectedTrame || !editingCellInfo?.garde/vacation) return;

        setIsSaving(true);
        try {
            const affectationIdToRemove = editingCellInfo.garde/vacation.id;
            const newAffectations = (selectedTrame.gardes/vacations || []).filter(
                aff => aff.id !== affectationIdToRemove
            );

            const updatedTrameForState = {
                ...selectedTrame,
                gardes/vacations: newAffectations
            };

            // TODO IMPORTANT: La suppression d'garde/vacation doit aussi se faire via une API dédiée.
            // Par exemple DELETE /api/tableau de service-modeles/{trameId}/gardes/vacations/{affectationId}
            // Pour l'instant, on met à jour uniquement l'état local.

            console.log('[DEBUG] handleRemoveAffectationInModal - Garde/Vacation to remove ID:', affectationIdToRemove);
            // Simuler un appel API ou appeler le vrai service de suppression d'garde/vacation si disponible.
            // await AffectationService.deleteAffectation(selectedTrame.id, affectationIdToRemove);


            setSelectedTrame(updatedTrameForState);
            setTrames(prevTrames =>
                prevTrames.map(t => t.id === updatedTrameForState.id ? updatedTrameForState : t)
            );

            setIsAffectationModalOpen(false);
            setEditingCellInfo(null);
            // toast.info('Garde/Vacation retirée localement. Sauvegarde via API dédiée à implémenter.');

        } catch (err) {
            console.error("Erreur lors de la suppression de l'garde/vacation:", err);
            setError("Impossible de supprimer l'garde/vacation. Veuillez réessayer plus tard.");
        } finally {
            setIsSaving(false);
        }
    };

    // Rendu des gardes/vacations dans la grille
    const renderAffectation = (garde/vacation: AffectationTrame | undefined) => {
        if (!garde/vacation || (!garde/vacation.salleId && !garde/vacation.chirurgienId && !garde/vacation.marId && !garde/vacation.iadeId))
            return <div className="text-xs text-gray-400 italic">Vide</div>;

        const chir = chirurgiens.find(c => c.id === garde/vacation.chirurgienId);
        const salle = salles.find(s => s.id === garde/vacation.salleId);
        const mar = mars.find(m => m.id === garde/vacation.marId);
        const iade = iades.find(i => i.id === garde/vacation.iadeId);

        return (
            <div className="bg-blue-100 p-1 rounded text-xs text-blue-800 shadow-sm w-full text-left space-y-0.5">
                {chir && chir.id !== 'chir-na' && <div className="font-semibold truncate">C: {`${chir.prenom.charAt(0)}. ${chir.nom}`}</div>}
                {salle && salle.id !== 'salle-na' && <div className="text-gray-700 truncate">S: {salle.name}</div>}
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
                <div>Chargement...</div>
                <p className="text-gray-500 text-sm">Chargement des données en cours...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Éditeur de Tableaux de service Habituelles (Hebdomadaires)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 mb-6">
                        Configurez ici les gardes/vacations récurrentes pour vos plannings hebdomadaires.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                        {/* Colonne de gauche : Liste des tableaux de service et création */}
                        <div className="col-span-1 md:col-span-1 space-y-4 border-r md:pr-6">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-semibold">Tableaux de service Existantes</h3>
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
                                        <CardTitle className="text-md">Nouvelle Tableau de service</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="newTrameNom" className="text-lg font-medium text-blue-700">Nom de la tableau de service *</Label>
                                            <Input
                                                id="newTrameNom"
                                                value={newTrameNom}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTrameNom(e.target.value)}
                                                placeholder="Entrez le nom de la tableau de service..."
                                                disabled={isSaving}
                                                className="border-2 border-blue-300 focus:border-blue-500 font-medium"
                                                required
                                            />
                                            {!newTrameNom.trim() && <p className="text-xs text-red-500 mt-1">Le nom de la tableau de service est obligatoire</p>}
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

                            {tableaux de service.length === 0 && !isCreating && (
                                <p className="text-sm text-gray-500">Aucune tableau de service définie. Cliquez sur "Créer" pour commencer.</p>
                            )}

                            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                {tableaux de service.map(tableau de service => (
                                    <Button
                                        key={tableau de service.id}
                                        variant={selectedTrame?.id === tableau de service.id ? "default" : "outline"}
                                        onClick={() => { setSelectedTrame(tableau de service); setIsCreating(false); }}
                                        className="w-full justify-start text-left h-auto py-2 relative group"
                                        disabled={isSaving}
                                    >
                                        <div className="flex flex-col flex-grow">
                                            <span className="font-medium">{tableau de service.name}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{tableau de service.typeSemaine} - {tableau de service.gardes/vacations?.length || 0} affect.</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-700"
                                            onClick={(e) => { e.stopPropagation(); handleDeleteTrame(tableau de service.id); }}
                                            aria-label="Supprimer la tableau de service"
                                            disabled={isSaving}
                                        >
                                            <Trash2Icon className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Colonne de droite : Éditeur visuel pour la tableau de service sélectionnée */}
                        <div className="col-span-1 md:col-span-2">
                            {selectedTrame ? (
                                <div className="border rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 className="text-xl font-semibold">
                                                <span className="text-gray-700">Édition de la tableau de service :</span>
                                                <span className="text-2xl text-blue-600 font-bold ml-2 border-b-2 border-blue-400 pb-1">{selectedTrame.name}</span>
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">Type: {selectedTrame.typeSemaine} {selectedTrame.description && `- ${selectedTrame.description}`}</p>
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
                                                const affectationExistante = selectedTrame.gardes/vacations?.find(
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
                                    <p className="text-gray-400 text-center">Sélectionnez une tableau de service à éditer ou créez-en une nouvelle pour commencer.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Modale d'édition d'garde/vacation */}
            {editingCellInfo && selectedTrame && (
                <Dialog open={isAffectationModalOpen} onOpenChange={setIsAffectationModalOpen}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>Éditer l'garde/vacation</DialogTitle>
                            <DialogDescription>
                                Pour {editingCellInfo.jour.toLowerCase()} - {editingCellInfo.periode.toLowerCase()} de la tableau de service "{selectedTrame.name}".
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
                                        {salles.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
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
                                        {chirurgiens.map(c => <SelectItem key={c.id} value={c.id.toString()}>{`${c.prenom} ${c.nom}`}</SelectItem>)}
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
                                        {mars.map(m => <SelectItem key={m.id} value={m.id.toString()}>{`${m.prenom} ${m.nom}`}</SelectItem>)}
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
                                        {iades.map(i => <SelectItem key={i.id} value={i.id.toString()}>{`${i.prenom} ${i.nom}`}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="justify-between sm:justify-between">
                            {editingCellInfo.garde/vacation && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleRemoveAffectationInModal}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Suppression...' : 'Retirer l\'garde/vacation'}
                                </Button>
                            )}
                            {!editingCellInfo.garde/vacation && <div />}
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

// Fonctions de mapping pour TypeSemaine
const mapApiTypeSemaineToLocal = (apiTypeSemaine: TypeSemaineTrame | TypeSemaine): TypeSemaine => {
    if (Object.values(TypeSemaine).includes(apiTypeSemaine as TypeSemaine)) {
        return apiTypeSemaine as TypeSemaine;
    }
    switch (apiTypeSemaine) {
        case TypeSemaineTrame.PAIRES: return TypeSemaine.PAIRE;
        case TypeSemaineTrame.IMPAIRES: return TypeSemaine.IMPAIRE;
        case TypeSemaineTrame.TOUTES:
        default:
            return TypeSemaine.TOUTES;
    }
};

const mapLocalTypeSemaineToApi = (localTypeSemaine: TypeSemaine): TypeSemaineTrame => {
    switch (localTypeSemaine) {
        case TypeSemaine.PAIRE: return TypeSemaineTrame.PAIRES;
        case TypeSemaine.IMPAIRE: return TypeSemaineTrame.IMPAIRES;
        case TypeSemaine.TOUTES:
        default:
            return TypeSemaineTrame.TOUTES;
    }
};

export default EditeurTramesHebdomadaires; 