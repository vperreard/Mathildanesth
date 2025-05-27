'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Button from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { ActivityType, DetailedActivityInTrame, SlotStatus } from './BlocPlanningTemplateEditor';
import { JourSemaine as ImportedJourSemaine, PeriodeJour as ImportedPeriodeJour } from '@/app/parametres/trameModeles/EditeurTramesHebdomadaires';
import { Personnel } from '@/modules/templates/services/PersonnelService';
import { OperatingRoomFromAPI as Salle } from '@/modules/templates/services/SalleService';
import { toast } from 'react-hot-toast';

interface ApiSpecialty {
    id: number | string;
    name: string;
}

interface EditActivityModalProps {
    onClose: () => void;
    onSave: (activity: DetailedActivityInTrame) => void;
    initialActivity: DetailedActivityInTrame | null;
    jour: ImportedJourSemaine;
    periode: ImportedPeriodeJour;
    targetActivityType: ActivityType;
    targetSalleId?: string | null;
    targetActivityRowKey: string | null;
    salles: Salle[];
    chirurgiens: Personnel[];
    mars: Personnel[];
    iades: Personnel[];
}

const EditActivityModal: React.FC<EditActivityModalProps> = ({
    onClose,
    onSave,
    initialActivity,
    jour,
    periode,
    targetActivityType,
    targetSalleId,
    targetActivityRowKey,
    salles,
    chirurgiens,
    mars,
    iades,
}) => {
    const [typeActivite, setTypeActivite] = useState<ActivityType>(initialActivity?.typeActivite || targetActivityType);
    const [salleId, setSalleId] = useState<string | null>(initialActivity?.salleId ? String(initialActivity.salleId) : (targetSalleId ? String(targetSalleId) : null));
    const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
    const [chirurgienId, setChirurgienId] = useState<string | null>(initialActivity?.chirurgienId ? String(initialActivity.chirurgienId) : null);
    const [marId, setMarId] = useState<string | null>(initialActivity?.marId ? String(initialActivity.marId) : null);
    const [iadeId, setIadeId] = useState<string | null>(initialActivity?.iadeId ? String(initialActivity.iadeId) : null);
    const [statutOuverture, setStatutOuverture] = useState<SlotStatus>(initialActivity?.statutOuverture || SlotStatus.OUVERT);
    const [isFullDay, setIsFullDay] = useState<boolean>(
        initialActivity?.periode === ImportedPeriodeJour.JOURNEE_COMPLETE ||
        (initialActivity ? false : periode === ImportedPeriodeJour.JOURNEE_COMPLETE)
    );
    const [availableSpecialties, setAvailableSpecialties] = useState<ApiSpecialty[]>([]);
    const [isLoadingSpecialties, setIsLoadingSpecialties] = useState<boolean>(false);
    const [errorSpecialties, setErrorSpecialties] = useState<string | null>(null);

    // Utilisation de useCallback pour stabiliser les références des fonctions
    const fetchSpecialties = useCallback(async () => {
        setIsLoadingSpecialties(true);
        setErrorSpecialties(null);
        try {
            const response = await fetch('http://localhost:3000/api/specialties', { credentials: 'include' });
            if (!response.ok) {
                let errorMsg = `Erreur API (${response.status})`;
                try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (e) { /* no json */ }
                throw new Error(errorMsg);
            }
            const data: ApiSpecialty[] = await response.json();
            setAvailableSpecialties(data);
        } catch (error: any) {
            console.error("Erreur lors du chargement des spécialités:", error);
            setErrorSpecialties(error.message || "Impossible de charger les spécialités.");
        } finally {
            setIsLoadingSpecialties(false);
        }
    }, []);

    useEffect(() => {
        fetchSpecialties();
    }, [fetchSpecialties]);

    // Réorganisation du useEffect pour éviter les rendus inutiles
    useEffect(() => {
        if (!initialActivity) {
            setTypeActivite(targetActivityType);
            setSalleId(targetSalleId ? String(targetSalleId) : null);
            setSelectedSpecialty(null);
            setChirurgienId(null);
            setMarId(null);
            setIadeId(null);
            setStatutOuverture(SlotStatus.OUVERT);
            setIsFullDay(periode === ImportedPeriodeJour.JOURNEE_COMPLETE);
            return;
        }

        setTypeActivite(initialActivity.typeActivite);
        setSalleId(initialActivity.salleId ? String(initialActivity.salleId) : (targetSalleId ? String(targetSalleId) : null));
        setChirurgienId(initialActivity.chirurgienId ? String(initialActivity.chirurgienId) : null);
        setMarId(initialActivity.marId ? String(initialActivity.marId) : null);
        setIadeId(initialActivity.iadeId ? String(initialActivity.iadeId) : null);
        setStatutOuverture(initialActivity.statutOuverture || SlotStatus.OUVERT);
        setIsFullDay(initialActivity.periode === ImportedPeriodeJour.JOURNEE_COMPLETE || (!!initialActivity.id && initialActivity.nomAffichage.includes("JOURNEE")));

        // Vérification de spécialité uniquement si chirurgien et spécialités sont disponibles
        if (initialActivity.chirurgienId && availableSpecialties.length > 0) {
            const chirId = initialActivity.chirurgienId;
            const initialChirFromList = chirurgiens.find(c => String(c.id) === chirId);
            if (initialChirFromList?.specialties?.length) {
                const foundSpecialty = initialChirFromList.specialties.find(cs =>
                    availableSpecialties.some(as => String(as.id) === String(cs.id))
                );
                setSelectedSpecialty(foundSpecialty ? String(foundSpecialty.id) : null);
            } else {
                setSelectedSpecialty(null);
            }
        } else {
            setSelectedSpecialty(null);
        }
    }, [initialActivity, targetActivityType, targetSalleId, periode, chirurgiens, availableSpecialties]);

    const isTypeLocked = targetActivityType === ActivityType.GARDE || targetActivityType === ActivityType.ASTREINTE || !!targetSalleId;
    const isSalleLocked = !!targetSalleId;

    const filteredChirurgiens = useMemo(() => {
        if (!selectedSpecialty) return chirurgiens;
        return chirurgiens.filter(c => c.specialties?.some(s => String(s.id) === String(selectedSpecialty)));
    }, [chirurgiens, selectedSpecialty]);

    const handleSpecialtyChange = useCallback((specialtyIdValue: string) => {
        setSelectedSpecialty(specialtyIdValue === 'all' ? null : specialtyIdValue);
    }, []);

    const handleSaveClick = useCallback(() => {
        if (typeActivite === ActivityType.BLOC_SALLE && !salleId) {
            toast.error("Veuillez sélectionner une salle pour le bloc.");
            return;
        }

        // Vérification pour journée complète
        if (isFullDay && (typeActivite === ActivityType.BLOC_SALLE || typeActivite === ActivityType.CONSULTATION)) {
            const confirmationMessage = periode === ImportedPeriodeJour.MATIN
                ? "Vous allez appliquer cette activité sur la journée entière. Les données de l'après-midi seront écrasées. Confirmez-vous ?"
                : "Vous allez appliquer cette activité sur la journée entière. Les données du matin seront écrasées. Confirmez-vous ?";
            if (!window.confirm(confirmationMessage)) return;
        }

        const createActivityObject = (currentPeriod: ImportedPeriodeJour, existingId?: string): DetailedActivityInTrame => {
            let nomAffichage = "";
            const selectedSalleInfo = salles.find(s => String(s.id) === salleId);
            const selectedChirurgienInfo = chirurgiens.find(c => String(c.id) === chirurgienId);
            const selectedMarInfo = mars.find(m => String(m.id) === marId);
            const selectedIadeInfo = iades.find(i => String(i.id) === iadeId);

            switch (typeActivite) {
                case ActivityType.BLOC_SALLE:
                    nomAffichage = selectedSalleInfo ? selectedSalleInfo.name : "Salle non spécifiée";
                    if (selectedChirurgienInfo) nomAffichage += ` / ${selectedChirurgienInfo.nom}`;
                    break;
                case ActivityType.CONSULTATION:
                    nomAffichage = `Consultation`;
                    if (selectedMarInfo) nomAffichage += ` (${selectedMarInfo.nom})`;
                    else if (selectedSalleInfo) nomAffichage += ` (${selectedSalleInfo.name})`;
                    break;
                case ActivityType.GARDE:
                    nomAffichage = "GARDE";
                    if (selectedMarInfo) nomAffichage += ` (${selectedMarInfo.nom})`;
                    break;
                case ActivityType.ASTREINTE:
                    nomAffichage = "ASTREINTE";
                    if (selectedMarInfo) nomAffichage += ` (${selectedMarInfo.nom})`;
                    break;
                default:
                    nomAffichage = "Activité";
            }

            return {
                id: existingId || initialActivity?.id || targetActivityRowKey + '_' + Date.now(),
                jourSemaine: jour,
                periode: currentPeriod,
                typeActivite,
                nomAffichage,
                salleId,
                chirurgienId,
                marId,
                iadeId,
                statutOuverture: typeActivite === ActivityType.CONSULTATION || typeActivite === ActivityType.BLOC_SALLE ? statutOuverture : undefined,
                activityRowKey: targetActivityRowKey,
            };
        };

        try {
            // Création des objets d'activité en fonction du mode journée complète ou non
            if (isFullDay) {
                if (typeActivite === ActivityType.GARDE || typeActivite === ActivityType.ASTREINTE) {
                    const activityJourneeComplete = createActivityObject(ImportedPeriodeJour.JOURNEE_COMPLETE, initialActivity?.id);
                    onSave(activityJourneeComplete);
                } else {
                    const activityMatin = createActivityObject(ImportedPeriodeJour.MATIN,
                        initialActivity?.periode === ImportedPeriodeJour.MATIN ? initialActivity.id : undefined);
                    onSave(activityMatin);

                    const activityApresMidi = createActivityObject(ImportedPeriodeJour.APRES_MIDI,
                        initialActivity?.periode === ImportedPeriodeJour.APRES_MIDI ? initialActivity.id : undefined);
                    onSave(activityApresMidi);
                }
            } else {
                const activity = createActivityObject(periode, initialActivity?.id);
                onSave(activity);
            }

            // Fermeture propre, sans risk de re-render inutile
            setTimeout(() => {
                onClose();
            }, 0);
        } catch (error) {
            console.error("Erreur lors de la sauvegarde de l'activité:", error);
            toast.error("Une erreur est survenue lors de la sauvegarde de l'activité.");
        }
    }, [typeActivite, salleId, isFullDay, jour, periode, targetActivityRowKey, onSave, onClose,
        chirurgienId, marId, iadeId, statutOuverture, initialActivity, targetSalleId,
        salles, chirurgiens, mars, iades]);

    // Empêcher la propagation des événements pour éviter les fermetures indésirables
    const stopPropagation = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    return (
        <div className="grid gap-4 py-4" onClick={stopPropagation}>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="activity-type" className="text-right">
                    Type d\'activité
                </Label>
                <Select
                    value={typeActivite}
                    onValueChange={(value) => setTypeActivite(value as ActivityType)}
                    disabled={isTypeLocked}
                >
                    <SelectTrigger id="activity-type" className="col-span-3">
                        <SelectValue placeholder="Sélectionner type activité" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.values(ActivityType).map(type => (
                            <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {(typeActivite === ActivityType.BLOC_SALLE || typeActivite === ActivityType.CONSULTATION) && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="slot-status" className="text-right">
                        Statut slot
                    </Label>
                    <Select
                        value={statutOuverture}
                        onValueChange={(value) => setStatutOuverture(value as SlotStatus)}
                    >
                        <SelectTrigger id="slot-status" className="col-span-3">
                            <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={SlotStatus.OUVERT}>Ouvert</SelectItem>
                            <SelectItem value={SlotStatus.FERME}>Fermé</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {typeActivite === ActivityType.BLOC_SALLE && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="salle" className="text-right">
                        Salle
                    </Label>
                    <Select
                        value={salleId === null ? undefined : salleId}
                        onValueChange={(value) => setSalleId(value === 'none' ? null : value)}
                        disabled={isSalleLocked}
                    >
                        <SelectTrigger id="salle" className="col-span-3">
                            <SelectValue placeholder="Sélectionner salle" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Aucune</SelectItem>
                            {salles.map(s => (
                                <SelectItem
                                    key={String(s.id)}
                                    value={String(s.id)}
                                >
                                    {s.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {(typeActivite === ActivityType.BLOC_SALLE || typeActivite === ActivityType.CONSULTATION) && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="specialty-select" className="text-right">Spécialité (Chir.)</Label>
                    <Select
                        value={selectedSpecialty === null ? undefined : selectedSpecialty}
                        onValueChange={handleSpecialtyChange}
                        disabled={isLoadingSpecialties}
                    >
                        <SelectTrigger id="specialty-select" className="col-span-3">
                            <SelectValue placeholder="Filtrer par spécialité" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les spécialités</SelectItem>
                            {isLoadingSpecialties && <SelectItem value="loading" disabled>Chargement...</SelectItem>}
                            {errorSpecialties && <SelectItem value="error" disabled>{errorSpecialties}</SelectItem>}
                            {availableSpecialties.map(spec => (
                                <SelectItem key={spec.id} value={String(spec.id)}>{spec.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {(typeActivite === ActivityType.BLOC_SALLE) && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="chirurgien" className="text-right">
                        Chirurgien
                    </Label>
                    <Select
                        value={chirurgienId === null ? undefined : chirurgienId}
                        onValueChange={(value) => setChirurgienId(value === 'none' ? null : value)}
                        disabled={!salleId && typeActivite === ActivityType.BLOC_SALLE && !isTypeLocked}
                    >
                        <SelectTrigger id="chirurgien" className="col-span-3">
                            <SelectValue placeholder="Sélectionner chirurgien" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Aucun</SelectItem>
                            {filteredChirurgiens.map(c => (
                                <SelectItem key={String(c.id)} value={String(c.id)}>{c.nom} {c.prenom}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mar" className="text-right">
                    MAR
                </Label>
                <Select
                    value={marId === null ? undefined : marId}
                    onValueChange={(value) => setMarId(value === 'none' ? null : value)}
                >
                    <SelectTrigger id="mar" className="col-span-3">
                        <SelectValue placeholder="Sélectionner MAR" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
                        {mars.map(m => (
                            <SelectItem key={String(m.id)} value={String(m.id)}>{m.nom} {m.prenom}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {(typeActivite === ActivityType.BLOC_SALLE) && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="iade" className="text-right">
                        IADE
                    </Label>
                    <Select
                        value={iadeId === null ? undefined : iadeId}
                        onValueChange={(value) => setIadeId(value === 'none' ? null : value)}
                    >
                        <SelectTrigger id="iade" className="col-span-3">
                            <SelectValue placeholder="Sélectionner IADE" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Aucun</SelectItem>
                            {iades.map(i => (
                                <SelectItem key={String(i.id)} value={String(i.id)}>{i.nom} {i.prenom}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {(typeActivite === ActivityType.BLOC_SALLE || typeActivite === ActivityType.CONSULTATION || typeActivite === ActivityType.GARDE || typeActivite === ActivityType.ASTREINTE) && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <div />
                    <div className="col-span-3 flex items-center space-x-2">
                        <Checkbox
                            id="isFullDay"
                            checked={isFullDay}
                            onCheckedChange={(checked) => setIsFullDay(checked as boolean)}
                        />
                        <Label htmlFor="isFullDay">Journée entière</Label>
                    </div>
                </div>
            )}

            <div className="flex justify-end space-x-2 mt-6">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        // Utilisation de setTimeout pour éviter les problèmes de re-render
                        setTimeout(() => onClose(), 0);
                    }}
                >
                    Annuler
                </Button>
                <Button
                    type="button"
                    onClick={handleSaveClick}
                >
                    Sauvegarder
                </Button>
            </div>
        </div>
    );
};

export default EditActivityModal; 