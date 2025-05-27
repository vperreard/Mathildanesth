'use client';

import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, Trash, Copy, Download, Upload, Edit, Eraser } from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
    TrameHebdomadaireService,
    TrameHebdomadaireDTO,
    AffectationTrameDTO,
} from '@/modules/modèles/services/TrameHebdomadaireService';
import { TypeSemaine as ImportedTypeSemaine, JourSemaine as ImportedJourSemaine, PeriodeJour as ImportedPeriodeJour } from '@/app/parametres/tableaux de service/EditeurTramesHebdomadaires';
import EditActivityModal from './EditActivityModal';
import { PersonnelService, Personnel, RolePersonnel } from '@/modules/modèles/services/PersonnelService';
import { SalleService, OperatingRoomFromAPI } from '@/modules/modèles/services/SalleService';

// Nouveaux Enums et Interfaces pour une gestion détaillée des activités dans les tableaux de service
export enum ActivityType {
    GARDE = 'GARDE',
    ASTREINTE = 'ASTREINTE',
    CONSULTATION = 'CONSULTATION',
    BLOC_SALLE = 'BLOC_SALLE',
}

export enum SlotStatus {
    OUVERT = 'OUVERT',
    FERME = 'FERME',
    PLANIFIE = 'PLANIFIE',
    VIDE = 'VIDE',
}

export interface DetailedActivityInTrame {
    id: string; // uuid de l'activité dans la tableau de service pour ce créneau
    jourSemaine: ImportedJourSemaine;
    periode: ImportedPeriodeJour;
    typeActivite: ActivityType;
    nomAffichage: string; // Ex: "GARDE", "ASTREINTE", "CONSULTATION X", "SALLE Y / Dr. Z"
    activityRowKey?: string; // Clé de la ligne de la grille (ex: 'CONSULT_1')

    salleId?: string | null;
    chirurgienId?: string | null;
    marId?: string | null; // Ajout pour garde/vacation nominative
    iadeId?: string | null; // Ajout pour garde/vacation nominative
    statutOuverture?: SlotStatus; // Principalement pour CONSULTATION et BLOC_SALLE (ouvert/fermé, planifié/vide)
}
// Fin des nouveaux Enums et Interfaces

// L'interface Tableau de service est maintenant typée avec DetailedActivityInTrame pour ses gardes/vacations
// Ceci est un changement par rapport à TrameHebdomadaireDTO qui utilise AffectationTrameDTO
// Nous devrons gérer la conversion lors de la sauvegarde si l'API attend toujours AffectationTrameDTO
interface Tableau de service extends Omit<TrameHebdomadaireDTO, 'gardes/vacations'> {
    gardes/vacations: DetailedActivityInTrame[];
}
// type Tableau de service = TrameHebdomadaireDTO; // Ancienne définition
type Attribution = AffectationTrameDTO; // Reste pour la compatibilité avec des parties du code non encore migrées

const BlocPlanningTemplateEditor: React.FC = () => {
    const [tableaux de service, setTrames] = useState<Tableau de service[]>([]);
    const [selectedTrameId, setSelectedTrameId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('edit');
    const [personnel, setPersonnel] = useState<Personnel[]>([]);
    const [salles, setSalles] = useState<OperatingRoomFromAPI[]>([]);
    const [chirurgiens, setChirurgiens] = useState<Personnel[]>([]);
    const [mars, setMars] = useState<Personnel[]>([]);
    const [iades, setIades] = useState<Personnel[]>([]);

    // États pour la modale d'édition d'activité
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<DetailedActivityInTrame | null>(null);
    const [currentEditingDay, setCurrentEditingDay] = useState<ImportedJourSemaine>(ImportedJourSemaine.LUNDI);
    const [currentEditingPeriod, setCurrentEditingPeriod] = useState<ImportedPeriodeJour>(ImportedPeriodeJour.MATIN);
    // Ajout des états pour mémoriser la cible de la modale
    const [currentTargetActivityType, setCurrentTargetActivityType] = useState<ActivityType>(ActivityType.BLOC_SALLE);
    const [currentTargetSalleId, setCurrentTargetSalleId] = useState<string | null | undefined>(null);
    // Ajouter un état pour mémoriser la clé de la ligne cible
    const [currentTargetActivityRowKey, setCurrentTargetActivityRowKey] = useState<string | null>(null);

    // D'abord, ajoutons un nouvel état pour stocker la tableau de service sélectionnée
    const [selectedTrame, setSelectedTrame] = useState<Tableau de service | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Ensuite, ajoutons un useEffect pour maintenir la synchronisation
    useEffect(() => {
        // Mettre à jour selectedTrame lorsque tableaux de service ou selectedTrameId change
        if (selectedTrameId) {
            const foundTrame = tableaux de service.find(t => t.id === selectedTrameId);
            if (foundTrame) {
                console.log("[BlocEditor] Mise à jour de selectedTrame:", foundTrame.id, "avec", foundTrame.gardes/vacations.length, "gardes/vacations");
                setSelectedTrame(foundTrame);
            } else {
                console.log("[BlocEditor] Aucune tableau de service trouvée avec ID:", selectedTrameId);
                setSelectedTrame(null);
                setHasUnsavedChanges(false);
            }
        } else {
            setSelectedTrame(null);
            setHasUnsavedChanges(false);
        }
    }, [tableaux de service, selectedTrameId]);

    // Définir les lignes de la grille (types d'activités principaux et salles spécifiques)
    const fixedActivityRows: Array<{ key: string; label: string; type: ActivityType; isFixed: true; specificSalleKey?: string; specificSalleId?: undefined; colorCode?: undefined }> = [
        { key: 'GARDE', label: 'GARDE', type: ActivityType.GARDE, isFixed: true },
        { key: 'ASTREINTE', label: 'ASTREINTE', type: ActivityType.ASTREINTE, isFixed: true },
        { key: 'CONSULT_1', label: 'CONSULTATION 1', type: ActivityType.CONSULTATION, specificSalleKey: 'CONSULT_SALLE_1', isFixed: true },
        { key: 'CONSULT_2', label: 'CONSULTATION 2', type: ActivityType.CONSULTATION, specificSalleKey: 'CONSULT_SALLE_2', isFixed: true },
    ];

    type FixedActivityRow = typeof fixedActivityRows[number]; // Type pour les lignes fixes
    type DynamicSalleRow = {
        key: string;
        label: string;
        type: ActivityType.BLOC_SALLE;
        isFixed: false;
        specificSalleId: string;
        colorCode?: string | null;
        specificSalleKey?: undefined;
    };
    type ActivityRowType = FixedActivityRow | DynamicSalleRow;

    const activityRows: ActivityRowType[] = [
        ...fixedActivityRows,
        ...salles.map((salle): DynamicSalleRow => ({ // Assurer le type pour isFixed: false
            key: `SALLE_${salle.id}`,
            label: salle.name,
            type: ActivityType.BLOC_SALLE,
            specificSalleId: String(salle.id),
            colorCode: salle.colorCode,
            isFixed: false, // Explicitement false et correspond au type DynamicSalleRow
        }))
    ];

    const joursDeSemaine = Object.values(ImportedJourSemaine);
    // Filtrer pour ne garder que Matin et Apres-midi
    const periodesDeJourVisibles = Object.values(ImportedPeriodeJour).filter(p => p === ImportedPeriodeJour.MATIN || p === ImportedPeriodeJour.APRES_MIDI);

    useEffect(() => {
        loadTrames();
        loadSupportData();
    }, []);

    useEffect(() => {
        // Cet effet est déclenché après chaque mise à jour des tableaux de service
        // Il permet de s'assurer que le composant se re-rend correctement
        console.log("[BlocEditor] useEffect pour mise à jour des tableaux de service:", selectedTrameId ? "Tableau de service sélectionnée existe" : "Aucune tableau de service sélectionnée");

        // Si une tableau de service est sélectionnée, s'assurer que selectedTrame reflète les dernières données
        if (selectedTrameId) {
            const currentSelectedTrame = tableaux de service.find(t => t.id === selectedTrameId);
            if (currentSelectedTrame && currentSelectedTrame.gardes/vacations.length > 0) {
                console.log("[BlocEditor] Tableau de service sélectionnée a", currentSelectedTrame.gardes/vacations.length, "gardes/vacations");
                // Forcer un re-render en déclenchant un log des dernières gardes/vacations
                console.log("[BlocEditor] Dernières gardes/vacations:",
                    currentSelectedTrame.gardes/vacations.slice(-3).map(a => ({
                        id: a.id,
                        jour: a.jourSemaine,
                        periode: a.periode,
                        nomAffichage: a.nomAffichage
                    }))
                );
            }
        }
    }, [tableaux de service, selectedTrameId]);

    const loadTrames = async () => {
        setIsLoading(true);
        try {
            const loadedTramesDTO = await TrameHebdomadaireService.getAllTrames();

            const convertedTrames: Tableau de service[] = loadedTramesDTO.map(dto => {
                const detailedAffectations: DetailedActivityInTrame[] = dto.gardes/vacations.map((affDto): DetailedActivityInTrame => {
                    // Logique de conversion initiale (sera affinée avec la modale)
                    // Ceci est une conversion basique pour faire fonctionner le typage.
                    // Le typeActivite, nomAffichage, etc. devront être déterminés plus intelligemment.
                    const typeActivite: ActivityType = ActivityType.BLOC_SALLE; // Par défaut
                    let nomAffichage = `Salle ${affDto.salleId || 'N/A'}`;
                    if (affDto.chirurgienId) nomAffichage += ` / Chir ${affDto.chirurgienId}`;

                    // TODO: Déterminer typeActivite plus finement basé sur la description/nom de la tableau de service ou affDto
                    // Par exemple, si affDto.salleId est null et chirId est null, ça pourrait être GARDE/ASTREINTE.
                    // Pour l'instant, c'est une initialisation basique.

                    return {
                        id: affDto.id,
                        jourSemaine: affDto.jourSemaine,
                        periode: affDto.periode,
                        typeActivite: typeActivite,
                        nomAffichage: nomAffichage,
                        salleId: affDto.salleId,
                        chirurgienId: affDto.chirurgienId,
                        marId: null,
                        iadeId: null,
                        statutOuverture: SlotStatus.OUVERT,
                    };
                });

                return {
                    id: dto.id,
                    nom: dto.nom,
                    typeSemaine: dto.typeSemaine,
                    description: dto.description,
                    gardes/vacations: detailedAffectations,
                };
            });

            setTrames(convertedTrames);
            if (convertedTrames.length > 0 && !selectedTrameId) {
                // Si un selectedTrameId existe déjà (suite à une sauvegarde par ex), ne pas le changer
                // pour éviter de perdre la sélection en cours d'édition.
                // On ne met à jour que si aucun n'est sélectionné.
                const currentSelected = tableaux de service.find(t => t.id === selectedTrameId);
                if (!currentSelected && convertedTrames[0]) {
                    setSelectedTrameId(convertedTrames[0].id);
                } else if (selectedTrameId) {
                    // Si un ID était sélectionné, s'assurer qu'il est toujours valide après rechargement
                    const stillExists = convertedTrames.some(t => t.id === selectedTrameId);
                    if (!stillExists && convertedTrames[0]) {
                        setSelectedTrameId(convertedTrames[0].id);
                    } else if (!stillExists) {
                        setSelectedTrameId(null);
                    }
                }
            } else if (convertedTrames.length === 0) {
                setSelectedTrameId(null);
            }
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error('Erreur lors du chargement des tableaux de service:', error);
            toast.error('Impossible de charger les tableaux de service');
        } finally {
            setIsLoading(false);
        }
    };

    const loadSupportData = async () => {
        try {
            // Appel unique pour les chirurgiens
            const chirurgiensDataPromise = PersonnelService.getChirurgiens();

            const [sallesData, marsData, iadesData, loadedChirurgiens] = await Promise.all([
                SalleService.getSalles(),
                PersonnelService.getMARs(),
                PersonnelService.getIADEs(),
                chirurgiensDataPromise // Réutiliser la promesse
            ]);

            // Personnel est utilisé par la modale si elle a besoin d'une liste globale non filtrée.
            // Pour l'instant, elle reçoit des listes filtrées (chirurgiens, mars, iades).
            // Si un jour on a besoin de TOUT le personnel (ex: pour une recherche globale), il faudra ajuster.
            setPersonnel(loadedChirurgiens as Personnel[]);
            setSalles(sallesData);
            setChirurgiens(loadedChirurgiens); // Déjà Personnel[]
            setMars(marsData); // Déjà Personnel[]
            setIades(iadesData); // Déjà Personnel[]

            console.log("[BlocEditor] Données de support chargées (salles):", sallesData.slice(0, 2));
        } catch (error) {
            toast.error("Erreur lors du chargement des données de support.");
            console.error("[BlocEditor] Erreur loadSupportData:", error);
        }
    };

    const handleTrameChange = (trameId: string) => {
        setSelectedTrameId(trameId);
        const trameToSelect = tableaux de service.find(t => t.id === trameId);
        if (trameToSelect) {
            console.log("[BlocEditor] Tableau de service sélectionnée:", trameToSelect.id);
            setSelectedTrame(trameToSelect);
        } else {
            console.log("[BlocEditor] Aucune tableau de service trouvée avec ID:", trameId);
            setSelectedTrame(null);
        }
        setHasUnsavedChanges(false);
    };

    const handleCreateNewTrame = () => {
        // S'assurer que newTrameData est compatible avec la nouvelle interface Tableau de service
        // Pour l'instant, gardes/vacations sera vide et sera peuplé via la nouvelle UI
        const newTrameDataOmitId: Omit<Tableau de service, 'id'> = {
            nom: 'Nouvelle tableau de service de bloc',
            typeSemaine: ImportedTypeSemaine.TOUTES,
            description: 'Description de la nouvelle tableau de service',
            gardes/vacations: [], // Sera de type DetailedActivityInTrame[]
        };

        const newTrameForState: Tableau de service = {
            ...newTrameDataOmitId,
            id: `new-${Date.now()}`,
        };

        setTrames([...tableaux de service, newTrameForState]);
        setSelectedTrameId(newTrameForState.id);
        setHasUnsavedChanges(true);
        toast('Nouvelle tableau de service initialisée. Pensez à sauvegarder.');
    };

    const handleSaveTrame = async () => {
        if (!selectedTrame) return;
        if (!selectedTrame.nom || selectedTrame.nom.trim() === "") {
            toast.error("Le nom de la tableau de service ne peut pas être vide.");
            return;
        }

        setIsLoading(true);
        try {
            let savedTrameDB;

            // TEMPORAIRE: Transformation de DetailedActivityInTrame[] vers AffectationTrameDTO[]
            // jusqu'à ce que l'API et le service soient mis à jour.
            // Cette transformation sera basique et perdra de l'information.
            const affectationsPourAPI: AffectationTrameDTO[] = selectedTrame.gardes/vacations.map(detailedAff => {
                // Logique de transformation basique (à affiner)
                // Attention: perte d'information ici (typeActivite, marRequis, etc. non directement mappables)
                return {
                    id: detailedAff.id, // Peut nécessiter une gestion différente si l'API s'attend à créer des ID
                    jourSemaine: detailedAff.jourSemaine,
                    periode: detailedAff.periode,
                    salleId: detailedAff.salleId,
                    chirurgienId: detailedAff.chirurgienId,
                    // marId et iadeId de AffectationTrameDTO ne sont pas directement dans detailedAff
                    // On pourrait les déduire ou les laisser null pour cette transformation temporaire
                    marId: null, // TODO: A gérer si on veut préserver cette info
                    iadeId: null, // TODO: A gérer
                };
            });

            const tramePayloadForAPI: TrameHebdomadaireDTO = {
                id: selectedTrame.id,
                nom: selectedTrame.nom,
                typeSemaine: selectedTrame.typeSemaine,
                description: selectedTrame.description,
                gardes/vacations: affectationsPourAPI, // Utilise les gardes/vacations transformées
            };

            if (selectedTrame.id.startsWith('new-')) {
                const { id, ...payloadForCreate } = tramePayloadForAPI;
                // Le service attend Omit<TrameHebdomadaireDTO, 'id'>
                // Notre payloadForCreate est déjà comme ça grâce à la destructuration de l'id
                savedTrameDB = await TrameHebdomadaireService.createTrame(payloadForCreate);
            } else {
                savedTrameDB = await TrameHebdomadaireService.updateTrame(selectedTrame.id, tramePayloadForAPI);
            }

            if (savedTrameDB) {
                toast.success('Tableau de service sauvegardée avec succès (transformation temporaire appliquée).');
                await loadTrames();
                setSelectedTrameId(savedTrameDB.id);
                setHasUnsavedChanges(false);
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la tableau de service:', error);
            toast.error('Impossible de sauvegarder la tableau de service. Vérifiez la console.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyTrame = async () => {
        if (!selectedTrame) return;
        toast('[AVERTISSEMENT] La fonctionnalité de copie n\'est pas encore implémentée.', { icon: '⚠️' });
    };

    const handleExportTrame = () => {
        if (!selectedTrame) return;
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(selectedTrame)
        )}`;
        const link = document.createElement("a");
        link.href = jsonString;
        link.download = `${selectedTrame.nom.replace(/\s+/g, '_')}.json`;
        link.click();
        toast.success('Tableau de service exportée localement avec succès');
    };

    const handleImportTrame = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                const importedTrameData = JSON.parse(content) as Partial<TrameHebdomadaireDTO>;

                const trameToCreate: Omit<TrameHebdomadaireDTO, 'id'> = {
                    nom: importedTrameData.nom || 'Tableau de service importée',
                    typeSemaine: importedTrameData.typeSemaine || ImportedTypeSemaine.TOUTES,
                    description: importedTrameData.description,
                    gardes/vacations: importedTrameData.gardes/vacations || []
                };

                setIsLoading(true);
                const savedTrame = await TrameHebdomadaireService.createTrame(trameToCreate);
                if (savedTrame) {
                    toast.success('Tableau de service importée et sauvegardée avec succès');
                    await loadTrames();
                    setSelectedTrameId(savedTrame.id);
                }
            } catch (error) {
                console.error('Erreur lors de l\'import de la tableau de service:', error);
                toast.error('Impossible d\'importer la tableau de service: format invalide ou erreur.');
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsText(file);
    };

    const handleDeleteTrame = async () => {
        if (!selectedTrame || selectedTrame.id.startsWith('new-')) {
            toast.error('Sélectionnez une tableau de service sauvegardée à supprimer.');
            return;
        }
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la tableau de service "${selectedTrame.nom}" ?`)) {
            return;
        }
        setIsLoading(true);
        try {
            await TrameHebdomadaireService.deleteTrame(selectedTrame.id);
            toast.success('Tableau de service supprimée avec succès');
            setSelectedTrameId(null);
            await loadTrames();
        } catch (error) {
            console.error('Erreur lors de la suppression de la tableau de service:', error);
            toast.error('Impossible de supprimer la tableau de service.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearTrameAssignments = () => {
        if (!selectedTrame) {
            toast.error("Aucune tableau de service sélectionnée.");
            return;
        }
        if (selectedTrame.gardes/vacations.length === 0) {
            toast("Cette tableau de service est déjà vide.");
            return;
        }
        if (window.confirm(`Êtes-vous sûr de vouloir vider toutes les gardes/vacations de la tableau de service "${selectedTrame.nom}" ? Cette action est irréversible.`)) {
            setTrames(currentTrames => {
                const trameToUpdate = currentTrames.find(t => t.id === selectedTrameId);
                if (!trameToUpdate) {
                    console.error("[BlocEditor] Tableau de service non trouvée lors de la tentative de vidage.");
                    return currentTrames;
                }
                const clearedTrame = { ...trameToUpdate, gardes/vacations: [] };
                console.log(`[BlocEditor] Vidage des gardes/vacations pour la tableau de service ID: ${selectedTrameId}`);
                return currentTrames.map(t =>
                    t.id === selectedTrameId ? clearedTrame : t
                );
            });
            toast.success(`Gardes/Vacations de la tableau de service "${selectedTrame.nom}" vidées.`);
            setHasUnsavedChanges(true);
        }
    };


    const handleSelectedTrameFieldChange = (fieldName: keyof Omit<Tableau de service, 'gardes/vacations' | 'id'>, value: any) => {
        if (selectedTrame) {
            const updatedTrame = { ...selectedTrame, [fieldName]: value };
            setTrames(prevTrames => prevTrames.map(t => t.id === selectedTrameId ? updatedTrame : t));
            setSelectedTrame(updatedTrame);
            setHasUnsavedChanges(true);
        }
    };

    // Réintroduire la fonction getCellActivity
    const getCellActivity = (tableau de service: Tableau de service | null, jour: ImportedJourSemaine, periode: ImportedPeriodeJour, activityRowKey: string): DetailedActivityInTrame | null => {
        if (!tableau de service) return null;
        return tableau de service.gardes/vacations.find(
            (aff) =>
                aff.jourSemaine === jour &&
                aff.periode === periode &&
                aff.activityRowKey === activityRowKey
        ) || null;
    };

    const handleOpenEditModal = (jour: ImportedJourSemaine, periode: ImportedPeriodeJour, activityRow: ActivityRowType) => {
        const currentActivity = getCellActivity(selectedTrame, jour, periode, activityRow.key);
        setEditingActivity(currentActivity);
        setCurrentEditingDay(jour);
        setCurrentEditingPeriod(periode);
        setCurrentTargetActivityType(activityRow.type);
        // Gérer specificSalleId qui est maintenant optionnel et lié au type de activityRow
        const targetSalleId = activityRow.isFixed === false && activityRow.specificSalleId ? activityRow.specificSalleId : null;
        setCurrentTargetSalleId(targetSalleId);
        setCurrentTargetActivityRowKey(activityRow.key);
        setIsEditModalOpen(true);
    };

    const handleSaveActivity = (activity: DetailedActivityInTrame) => {
        if (!selectedTrameId) { // Utiliser selectedTrameId car selectedTrame peut être obsolète dans la portée
            toast.error("Aucune tableau de service sélectionnée pour sauvegarder l'activité.");
            return;
        }

        console.log("[BlocEditor] Activité reçue par handleSaveActivity:", JSON.stringify(activity, null, 2));

        // Vérifier si l'activité est valide avant de l'ajouter
        if (!activity.nomAffichage || !activity.typeActivite) {
            console.error("[BlocEditor] Activité invalide sans nomAffichage ou typeActivite:", activity);
            toast.error("Erreur: données d'activité incomplètes");
            return;
        }

        setTrames(currentTrames =>
            currentTrames.map(t => {
                if (t.id === selectedTrameId) {
                    // Travailler sur une copie des gardes/vacations de la tableau de service actuelle de l'itération
                    const newAffectations = [...t.gardes/vacations];
                    const existingIndex = newAffectations.findIndex(a => a.id === activity.id);

                    if (existingIndex > -1) {
                        console.log(`[BlocEditor] Mise à jour de l'activité existante ID: ${activity.id} pour la période ${activity.periode}`);
                        newAffectations[existingIndex] = activity;
                    } else {
                        console.log(`[BlocEditor] Ajout d'une nouvelle activité ID: ${activity.id} pour la période ${activity.periode}`);
                        newAffectations.push(activity);
                    }
                    return { ...t, gardes/vacations: newAffectations };
                }
                return t;
            })
        );

        setHasUnsavedChanges(true);

        toast.success(`Activité pour ${activity.jourSemaine} - ${activity.periode} sauvegardée localement.`);
        // setIsEditModalOpen(false); // La modale est fermée par son propre onClose
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Select
                        value={selectedTrameId || ''}
                        onValueChange={handleTrameChange}
                        disabled={isLoading}
                    >
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Sélectionner une tableau de service" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md">
                            {tableaux de service.map((tableau de service) => (
                                <SelectItem key={tableau de service.id} value={tableau de service.id}>
                                    {tableau de service.nom}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCreateNewTrame}
                        disabled={isLoading}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Nouvelle
                    </Button>
                </div>

                <div className="flex space-x-3">
                    <Button
                        variant={hasUnsavedChanges || (selectedTrame && selectedTrame.id.startsWith('new-')) ? "default" : "outline"}
                        size="sm"
                        onClick={handleSaveTrame}
                        disabled={isLoading || !selectedTrame}
                        className={(hasUnsavedChanges || (selectedTrame && selectedTrame.id.startsWith('new-'))) ? "border-2 border-green-500 shadow-lg hover:bg-green-600" : ""}
                    >
                        <Save className="h-4 w-4 mr-1" />
                        Enregistrer {hasUnsavedChanges && "*"}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyTrame}
                        disabled={isLoading || !selectedTrame}
                    >
                        <Copy className="h-4 w-4 mr-1" />
                        Dupliquer
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteTrame}
                        disabled={isLoading || !selectedTrame || (selectedTrame && selectedTrame.id.startsWith('new-'))}
                    >
                        <Trash className="h-4 w-4 mr-1" />
                        Supprimer
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportTrame}
                        disabled={isLoading || !selectedTrame}
                    >
                        <Download className="h-4 w-4 mr-1" />
                        Exporter
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('import-file-bloc')?.click()}
                        disabled={isLoading}
                    >
                        <Upload className="h-4 w-4 mr-1" />
                        Importer
                    </Button>
                    <input
                        id="import-file-bloc"
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleImportTrame}
                    />
                </div>
            </div>

            {selectedTrame ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-md p-1 mb-6">
                        <TabsTrigger
                            value="edit"
                            className="px-3 py-1.5 text-sm font-medium rounded-sm data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm transition-all duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 outline-none"
                        >
                            Éditer Tableau de service
                        </TabsTrigger>
                        <TabsTrigger
                            value="attributions"
                            className="px-3 py-1.5 text-sm font-medium rounded-sm data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm transition-all duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 outline-none"
                        >
                            Gérer Gardes/Vacations (Bloc)
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="edit">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Configuration de: {selectedTrame.nom}
                                    {selectedTrame.id.startsWith('new-') && <span className="text-sm text-yellow-500 ml-2 p-1 bg-yellow-100 rounded">(Non sauvegardé)</span>}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label htmlFor="trameNameBloc" className="block text-sm font-medium">Nom</label>
                                    <Input
                                        id="trameNameBloc"
                                        value={selectedTrame.nom}
                                        onChange={(e) => handleSelectedTrameFieldChange('nom', e.target.value)}
                                        className="mt-1"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="trameDescriptionBloc" className="block text-sm font-medium">Description</label>
                                    <Input
                                        id="trameDescriptionBloc"
                                        value={selectedTrame.description || ''}
                                        onChange={(e) => handleSelectedTrameFieldChange('description', e.target.value)}
                                        className="mt-1"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="trameTypeSemaineBloc" className="block text-sm font-medium">Type de semaine</label>
                                    <Select
                                        value={selectedTrame.typeSemaine}
                                        onValueChange={(value) => handleSelectedTrameFieldChange('typeSemaine', value as ImportedTypeSemaine)}
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger id="trameTypeSemaineBloc" className="mt-1">
                                            <SelectValue placeholder="Sélectionner type" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md">
                                            {Object.values(ImportedTypeSemaine).map(type => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <p className="text-orange-600 font-semibold mt-6 p-3 bg-orange-50 rounded-md border border-orange-200">
                                    Note: La structure de base de la tableau de service (ID: {selectedTrame.id}) est éditée ici.
                                    La gestion détaillée des gardes/vacations spécifiques au bloc (jours, périodes flexibles, personnel, salles)
                                    se fait dans l'onglet "Gérer Gardes/Vacations (Bloc)" et nécessite une adaptation majeure.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="attributions">
                        <Card>
                            <CardHeader>
                                <CardTitle>Gérer les gardes/vacations pour la tableau de service: {selectedTrame.nom}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-blue-600 font-semibold p-3 bg-blue-50 rounded-md border border-blue-200 mb-4">
                                    Cliquez sur une case pour ajouter ou modifier une activité pour ce créneau et ce type d'activité.
                                    Les modifications sont locales jusqu'à la sauvegarde générale de la tableau de service.
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border-collapse border border-gray-300">
                                        <thead>
                                            <tr className="bg-gray-100 dark:bg-gray-800">
                                                <th className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2 text-left font-semibold">Activité / Salle</th>
                                                {joursDeSemaine.map(jour => (
                                                    <th key={jour} className="border border-gray-300 dark:border-gray-700 p-2 text-center font-semibold" colSpan={periodesDeJourVisibles.length}>
                                                        {jour.charAt(0).toUpperCase() + jour.slice(1).toLowerCase()}
                                                    </th>
                                                ))}
                                            </tr>
                                            <tr className="bg-gray-50 dark:bg-gray-700">
                                                <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-700 p-2"></th>
                                                {joursDeSemaine.map(jour => (
                                                    <React.Fragment key={`${jour}-periods`}>
                                                        {periodesDeJourVisibles.map(periode => (
                                                            <th key={`${jour}-${periode}`} className="border border-gray-300 dark:border-gray-700 p-1 text-xs font-medium text-center text-gray-500 dark:text-gray-400">
                                                                {periode === ImportedPeriodeJour.MATIN ? 'M' : 'AM'}
                                                            </th>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activityRows.map(row => (
                                                <tr key={row.key} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                                    <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 border border-gray-300 dark:border-gray-700 p-2 font-medium whitespace-nowrap">
                                                        {row.label}
                                                    </td>
                                                    {joursDeSemaine.map(jour => {
                                                        // Cas spécial pour Garde/Astreinte: fusionner les cellules
                                                        if (row.type === ActivityType.GARDE || row.type === ActivityType.ASTREINTE) {
                                                            const activity = selectedTrame?.gardes/vacations.find(
                                                                aff => aff.jourSemaine === jour &&
                                                                    (aff.periode === ImportedPeriodeJour.MATIN || aff.periode === ImportedPeriodeJour.APRES_MIDI || aff.periode === ImportedPeriodeJour.JOURNEE_COMPLETE) &&
                                                                    aff.typeActivite === row.type
                                                            );
                                                            const marName = activity?.marId ? (personnel.find(p => p.id === activity.marId)?.nom || `ID:${activity.marId.substring(0, 4)}`) : null;

                                                            return (
                                                                <td
                                                                    key={`${jour}-merged-${row.key}`}
                                                                    colSpan={periodesDeJourVisibles.length}
                                                                    className={`border border-gray-300 dark:border-gray-700 p-1 text-xs min-w-[160px] h-[50px] align-top relative group cursor-pointer ${activity ? 'bg-yellow-50 dark:bg-yellow-900/30' : 'bg-gray-50 dark:bg-slate-800/30'}`}
                                                                    onClick={() => handleOpenEditModal(jour, ImportedPeriodeJour.JOURNEE_COMPLETE, row)}
                                                                >
                                                                    {activity ? (
                                                                        <div className="flex flex-col h-full text-center items-center justify-center">
                                                                            <span className="font-semibold block truncate">
                                                                                {marName ? marName : <span className="text-gray-400">-</span>}
                                                                            </span>
                                                                            <span className="text-blue-700 dark:text-blue-400 text-[10px] mt-0.5">
                                                                                {activity.marId && "M"}
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-gray-300 dark:text-gray-600"></span>
                                                                    )}
                                                                    <Button variant="ghost" size="icon" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-0.5 w-5 h-5">
                                                                        <Edit size={12} />
                                                                    </Button>
                                                                </td>
                                                            );
                                                        } else {
                                                            // Cas normal: une cellule par période visible
                                                            return periodesDeJourVisibles.map(periode => {
                                                                const cellKey = `${jour}-${periode}-${row.key}`;

                                                                // Condition de recherche simplifiée et fiabilisée
                                                                const activityForCell = selectedTrame?.gardes/vacations.find(
                                                                    aff =>
                                                                        aff.jourSemaine === jour &&
                                                                        aff.periode === periode &&
                                                                        aff.activityRowKey === row.key
                                                                    // La vérification de type est redondante si activityRowKey est unique par type
                                                                    // && aff.typeActivite === row.type 
                                                                );

                                                                // Log simplifié pour la consultation
                                                                if (row.key === 'CONSULT_1' && jour === 'LUNDI' && periode === 'MATIN') {
                                                                    console.log(`[BlocEditor RENDER CONSULT] LUN-MATIN-CONSULT_1 - activityRowKey: ${activityForCell?.activityRowKey}, marId: ${activityForCell?.marId}, found: ${!!activityForCell}`);
                                                                }

                                                                const marName = activityForCell?.marId ? (personnel.find(p => String(p.id) === String(activityForCell.marId))?.nom || `ID:${String(activityForCell.marId)?.substring(0, 4)}`) : null;
                                                                const chirName = activityForCell?.chirurgienId ? (personnel.find(p => String(p.id) === String(activityForCell.chirurgienId))?.nom || `ID:${String(activityForCell.chirurgienId)?.substring(0, 4)}`) : null;
                                                                const iadePersonnel = activityForCell?.iadeId ? personnel.find(p => String(p.id) === String(activityForCell.iadeId)) : null;
                                                                const iadeDisplayName = iadePersonnel?.prenom || iadePersonnel?.nom || (activityForCell?.iadeId ? `ID:${String(activityForCell.iadeId)}` : null);

                                                                return (
                                                                    <td
                                                                        key={cellKey}
                                                                        className={`border border-gray-300 dark:border-gray-700 p-1 text-xs min-w-[80px] h-[50px] align-top relative group cursor-pointer ${activityForCell ? 'bg-white dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-800/30'}`}
                                                                        onClick={() => handleOpenEditModal(jour, periode, row)}
                                                                    >
                                                                        {activityForCell ? (
                                                                            <div className="flex flex-col h-full text-center items-center justify-center leading-tight">
                                                                                {/* Affichage principal (Chir, Statut Consult, Placeholder) */}
                                                                                {(activityForCell.typeActivite === ActivityType.BLOC_SALLE && chirName) ? (
                                                                                    <span className="font-semibold block truncate" title={chirName}>{chirName}</span>
                                                                                ) : activityForCell.typeActivite === ActivityType.CONSULTATION && activityForCell.statutOuverture === SlotStatus.OUVERT ? (
                                                                                    <span className="text-green-600 font-semibold">Ouvert</span>
                                                                                ) : activityForCell.typeActivite === ActivityType.CONSULTATION && activityForCell.statutOuverture === SlotStatus.FERME ? (
                                                                                    <span className="text-red-600 font-semibold">Fermé</span>
                                                                                ) : (
                                                                                    <span className="text-gray-400">-</span> // Placeholder par défaut
                                                                                )}

                                                                                {/* Affichage secondaire (MAR, IADE) */}
                                                                                {marName && (
                                                                                    <span className="text-blue-700 dark:text-blue-400 block truncate text-xs" title={`MAR: ${personnel.find(p => String(p.id) === String(activityForCell.marId))?.nom || ''}`}>
                                                                                        M: {marName}
                                                                                    </span>
                                                                                )}
                                                                                {iadeDisplayName && (
                                                                                    <span className="text-purple-500 dark:text-purple-400 block truncate text-xs" title={`IADE: ${personnel.find(p => String(p.id) === String(activityForCell.iadeId))?.nom || ''}`}>
                                                                                        I: {iadeDisplayName}
                                                                                    </span>
                                                                                )}

                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-gray-300 dark:text-gray-600"></span>
                                                                        )}
                                                                        {/* Icône d'édition */}
                                                                        <Button variant="ghost" size="icon" className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 p-0.5 w-5 h-5">
                                                                            <Edit size={12} />
                                                                        </Button>
                                                                    </td>
                                                                );
                                                            }); // Fin map periode
                                                        }
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            ) : (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-gray-500">
                            {isLoading ? 'Chargement des tableaux de service...' : "Sélectionnez une tableau de service pour l'éditer ou créez-en une nouvelle."}
                        </p>
                    </CardContent>
                </Card>
            )}

            {selectedTrame && (
                <EditActivityModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveActivity}
                    initialActivity={editingActivity}
                    jour={currentEditingDay}
                    periode={currentEditingPeriod}
                    targetActivityType={currentTargetActivityType}
                    targetSalleId={currentTargetSalleId}
                    targetActivityRowKey={currentTargetActivityRowKey}
                    salles={salles}
                    chirurgiens={chirurgiens}
                    mars={mars}
                    iades={iades}
                />
            )}
        </div>
    );
};

export default BlocPlanningTemplateEditor; 