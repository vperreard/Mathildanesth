'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
    DialogClose,
} from '@/components/ui/dialog';
import Button from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { ActivityType, DetailedActivityInTrame, SlotStatus } from './BlocPlanningTemplateEditor';
import { JourSemaine as ImportedJourSemaine, PeriodeJour as ImportedPeriodeJour } from '@/app/parametres/trames/EditeurTramesHebdomadaires';
import { Personnel } from '@/modules/templates/services/PersonnelService';
import { Salle } from '@/modules/templates/services/SalleService';
import { toast } from 'react-hot-toast';

// Ajout d'une interface pour les spécialités récupérées de l'API
interface ApiSpecialty {
    id: number | string; // L'ID peut être numérique ou une chaîne selon l'API
    name: string;
    // Ajouter d'autres champs si nécessaire, par exemple isPediatric, etc.
}

interface EditActivityModalProps {
    isOpen: boolean;
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
    isOpen,
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

    // Les IDs stockés dans l'état seront des chaînes (ou null) car c'est ce que les Selects manipulent.
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

    // États pour les spécialités chargées depuis l'API
    const [availableSpecialties, setAvailableSpecialties] = useState<ApiSpecialty[]>([]);
    const [isLoadingSpecialties, setIsLoadingSpecialties] = useState<boolean>(false);
    const [errorSpecialties, setErrorSpecialties] = useState<string | null>(null);

    // Log pour déboguer les spécialités
    useEffect(() => {
        if (isOpen && chirurgiens.length > 0) {
            const testSpecialties = new Set(
                chirurgiens.flatMap(c => c.specialties?.map(s => s.name) || []).filter(Boolean) as string[]
            );
        }
    }, [isOpen, chirurgiens]);

    const isTypeLocked = targetActivityType === ActivityType.GARDE || targetActivityType === ActivityType.ASTREINTE || !!targetSalleId;
    const isSalleLocked = !!targetSalleId;

    // Filtrer les chirurgiens en fonction de la spécialité sélectionnée
    const filteredChirurgiens = useMemo(() => {
        if (!selectedSpecialty) {
            return chirurgiens;
        }
        // S'assurer que selectedSpecialty est un ID (string ou number)
        const specialtyIdToCompare = selectedSpecialty;
        return chirurgiens.filter(c =>
            c.specialties?.some(s => String(s.id) === String(specialtyIdToCompare))
        );
    }, [chirurgiens, selectedSpecialty]);

    // Chargement des spécialités depuis l'API
    useEffect(() => {
        if (isOpen) {
            const fetchSpecialties = async () => {
                setIsLoadingSpecialties(true);
                setErrorSpecialties(null);
                try {
                    const response = await fetch('/api/specialties', { credentials: 'include' });
                    if (!response.ok) {
                        let errorMsg = `Erreur API (${response.status})`;
                        try {
                            const errorData = await response.json();
                            errorMsg = errorData.message || errorMsg;
                        } catch (e) {
                            // Pas de JSON ou autre erreur
                        }
                        throw new Error(errorMsg);
                    }
                    const data: ApiSpecialty[] = await response.json();
                    setAvailableSpecialties(data);
                } catch (error: any) {
                    console.error("Erreur lors du chargement des spécialités:", error);
                    setErrorSpecialties(error.message || "Impossible de charger les spécialités.");
                    // Optionnel: afficher un toast d'erreur
                    // toast.error("Impossible de charger la liste des spécialités.");
                } finally {
                    setIsLoadingSpecialties(false);
                }
            };
            fetchSpecialties();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (initialActivity) {
                setTypeActivite(initialActivity.typeActivite);
                setSalleId(initialActivity.salleId ? String(initialActivity.salleId) : (targetSalleId ? String(targetSalleId) : null));

                const initialChirFromList = chirurgiens.find(c => String(c.id) === String(initialActivity.chirurgienId));
                if (initialChirFromList && initialChirFromList.specialties && initialChirFromList.specialties.length > 0 && initialChirFromList.specialties[0].name) {
                    setSelectedSpecialty(initialChirFromList.specialties[0].name);
                } else {
                    setSelectedSpecialty(null);
                }
                setChirurgienId(initialActivity.chirurgienId ? String(initialActivity.chirurgienId) : null);
                setMarId(initialActivity.marId ? String(initialActivity.marId) : null);
                setIadeId(initialActivity.iadeId ? String(initialActivity.iadeId) : null);
                setStatutOuverture(initialActivity.statutOuverture || SlotStatus.OUVERT);
                setIsFullDay(initialActivity.periode === ImportedPeriodeJour.JOURNEE_COMPLETE ||
                    (!!initialActivity.id && initialActivity.nomAffichage.includes("JOURNEE")));

                // Tenter de présélectionner la spécialité si initialActivity et le chirurgien sont là
                // et que les spécialités API sont chargées
                if (initialActivity?.chirurgienId && availableSpecialties.length > 0) {
                    const initialChirFromList = chirurgiens.find(c => String(c.id) === String(initialActivity.chirurgienId));
                    if (initialChirFromList?.specialties?.length) {
                        // Chercher la première spécialité du chirurgien qui existe dans availableSpecialties
                        const foundSpecialty = initialChirFromList.specialties.find(cs =>
                            availableSpecialties.some(as => String(as.id) === String(cs.id))
                        );
                        if (foundSpecialty) {
                            setSelectedSpecialty(String(foundSpecialty.id));
                        } else {
                            setSelectedSpecialty(null); //Fallback si aucune spécialité du chirurgien n'est dans la liste API
                        }
                    } else {
                        setSelectedSpecialty(null); // Pas de spécialités pour ce chirurgien
                    }
                } else if (!initialActivity?.chirurgienId) {
                    setSelectedSpecialty(null); // Pas de chirurgien initial, donc pas de spécialité pré-sélectionnée
                }

            } else {
                setTypeActivite(targetActivityType);
                setSalleId(targetSalleId ? String(targetSalleId) : null);
                setSelectedSpecialty(null);
                setChirurgienId(null);
                setMarId(null);
                setIadeId(null);
                setStatutOuverture(SlotStatus.OUVERT);
                setIsFullDay(periode === ImportedPeriodeJour.JOURNEE_COMPLETE);
            }
        }
    }, [initialActivity, isOpen, targetActivityType, targetSalleId, chirurgiens, periode]);

    // Réinitialiser chirurgienId si la spécialité change et que le chirurgien n'est plus valide
    useEffect(() => {
        if (chirurgienId && selectedSpecialty) {
            // Vérifier si le chirurgienId actuel appartient à la nouvelle selectedSpecialty
            const chir = chirurgiens.find(c => String(c.id) === chirurgienId);
            const chirHasSelectedSpecialty = chir?.specialties?.some(s => String(s.id) === String(selectedSpecialty));

            if (!chirHasSelectedSpecialty) {
                setChirurgienId(null); // Réinitialiser si le chirurgien n'a pas cette spécialité
            }
        } else if (!selectedSpecialty) {
            // Si aucune spécialité n'est sélectionnée, ne pas filtrer les chirurgiens par spécialité,
            // donc on ne réinitialise pas chirurgienId ici.
            // La liste filteredChirurgiens montrera tous les chirurgiens.
        }
    }, [selectedSpecialty, chirurgienId, chirurgiens]); // Retiré filteredChirurgiens des deps pour éviter boucle

    const handleSpecialtyChange = (specialtyIdValue: string) => {
        // specialtyIdValue est l'ID de la spécialité (string ou number converti en string)
        setSelectedSpecialty(specialtyIdValue === 'all' ? null : specialtyIdValue);
    };

    const handleSaveClick = () => {
        // Commenter la vérification pour le MAR avec chirurgien en BLOC_SALLE
        /*
        if (typeActivite === ActivityType.BLOC_SALLE && chirurgienId && !marId) {
            toast.error("Un MAR doit être sélectionné si un chirurgien est affecté au bloc.");
            return;
        }
        */
        // Laisser la vérification pour GARDE/ASTREINTE/CONSULTATION sans MAR, si elle est toujours pertinente
        if ((typeActivite === ActivityType.GARDE || typeActivite === ActivityType.ASTREINTE || typeActivite === ActivityType.CONSULTATION) && !marId && typeActivite !== ActivityType.CONSULTATION /* Permettre consultation sans MAR pour l'instant */) {
            // On pourrait vouloir affiner cette condition. Si CONSULTATION peut avoir un MAR optionnel, 
            // cette vérification doit être ajustée. Pour l'instant, on la garde pour GARDE/ASTREINTE.
            if (typeActivite === ActivityType.GARDE || typeActivite === ActivityType.ASTREINTE) {
                toast.error("Un MAR doit être sélectionné pour les gardes et astreintes.");
                return;
            }
        }

        if (typeActivite === ActivityType.BLOC_SALLE && !salleId) {
            toast.error("Veuillez sélectionner une salle pour le bloc.");
            return;
        }

        // Ajout de la confirmation pour écrasement si 'Journée entière' est cochée
        if (isFullDay && (typeActivite === ActivityType.BLOC_SALLE || typeActivite === ActivityType.CONSULTATION)) {
            const confirmationMessage = periode === ImportedPeriodeJour.MATIN
                ? "Vous allez appliquer cette activité sur la journée entière. Les données de l'après-midi seront écrasées. Confirmez-vous ?"
                : "Vous allez appliquer cette activité sur la journée entière. Les données du matin seront écrasées. Confirmez-vous ?";

            if (!window.confirm(confirmationMessage)) {
                return; // L'utilisateur a annulé
            }
        }

        const createActivityObject = (currentPeriod: ImportedPeriodeJour, existingId?: string): DetailedActivityInTrame => {
            let nomAffichage = "";
            const selectedSalleInfo = salles.find(s => String(s.id) === salleId);
            const selectedChirurgienInfo = chirurgiens.find(c => String(c.id) === chirurgienId);
            const selectedMarInfo = mars.find(m => String(m.id) === marId);
            const selectedIadeInfo = iades.find(i => String(i.id) === iadeId);

            console.log("[EditActivityModal] Données pour le nomAffichage:", {
                typeActivite,
                salleId,
                selectedSalleInfo: selectedSalleInfo ? JSON.stringify(selectedSalleInfo) : 'null',
                chirurgienId,
                selectedChirurgienInfo: selectedChirurgienInfo ? JSON.stringify(selectedChirurgienInfo) : 'null',
                marId,
                selectedMarInfo: selectedMarInfo ? JSON.stringify(selectedMarInfo) : 'null',
                iadeId,
                selectedIadeInfo: selectedIadeInfo ? JSON.stringify(selectedIadeInfo) : 'null',
                statutOuverture
            });

            const parts: string[] = [];

            switch (typeActivite) {
                case ActivityType.BLOC_SALLE:
                    if (selectedSalleInfo) parts.push(selectedSalleInfo.nom);
                    else if (salleId) parts.push(`Salle ID:${salleId}`);
                    else parts.push("Bloc");
                    if (selectedChirurgienInfo) parts.push(`/ ${selectedChirurgienInfo.nom}`);
                    else if (chirurgienId) parts.push(`/ Chir ID:${chirurgienId}`);
                    const personnelBloc: string[] = [];
                    if (selectedMarInfo) personnelBloc.push(`M: ${selectedMarInfo.nom}`);
                    if (selectedIadeInfo) personnelBloc.push(`I: ${selectedIadeInfo.prenom || selectedIadeInfo.nom}`);
                    if (personnelBloc.length > 0) parts.push(`(${personnelBloc.join(', ')})`);
                    break;
                case ActivityType.CONSULTATION:
                    parts.push("CONSULTATION");
                    if (selectedSalleInfo) parts.push(selectedSalleInfo.nom);
                    else if (salleId) parts.push(`Salle ID:${salleId}`);
                    if (selectedMarInfo) parts.push(`/ M: ${selectedMarInfo.nom}`);
                    parts.push(`(${statutOuverture})`);
                    break;
                case ActivityType.GARDE:
                    parts.push("GARDE");
                    if (selectedMarInfo) parts.push(`/ ${selectedMarInfo.nom}`);
                    else if (marId) parts.push(`/ MAR ID:${marId}`);
                    else parts.push("/ MAR requis");
                    break;
                case ActivityType.ASTREINTE:
                    parts.push("ASTREINTE");
                    if (selectedMarInfo) parts.push(`/ ${selectedMarInfo.nom}`);
                    else if (marId) parts.push(`/ MAR ID:${marId}`);
                    else parts.push("/ MAR requis");
                    break;
                default:
                    const safeTypeActivite = String(typeActivite || '');
                    parts.push(safeTypeActivite.replace('_', ' '));
            }
            nomAffichage = parts.join(' ').trim();
            if (!nomAffichage) {
                const safeTypeActiviteFallback = String(typeActivite || '');
                nomAffichage = `${safeTypeActiviteFallback.replace('_', ' ')} ${salleId ? `Salle ${salleId}` : ''}`.trim();
            }

            console.log("[EditActivityModal] nomAffichage construit:", nomAffichage);
            console.log("[EditActivityModal] parts utilisées:", parts);

            const resultActivity: DetailedActivityInTrame = {
                id: existingId || initialActivity?.id || `new-activity-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                jourSemaine: jour,
                periode: currentPeriod,
                typeActivite,
                nomAffichage,
                activityRowKey: targetActivityRowKey ?? undefined,
                salleId: salleId,
                chirurgienId: chirurgienId,
                marId: marId,
                iadeId: iadeId,
                statutOuverture: (typeActivite === ActivityType.CONSULTATION || typeActivite === ActivityType.BLOC_SALLE) ? statutOuverture : undefined,
            };

            console.log("[EditActivityModal] Objet d'activité final:", JSON.stringify(resultActivity, null, 2));
            return resultActivity;
        };

        if (isFullDay && (typeActivite === ActivityType.BLOC_SALLE || typeActivite === ActivityType.CONSULTATION)) {
            const activityMatin = createActivityObject(ImportedPeriodeJour.MATIN,
                initialActivity && initialActivity.periode === ImportedPeriodeJour.MATIN ? initialActivity.id : undefined
            );
            console.log("[EditActivityModal] Valeur de activityToSave (MATIN) avant onSave:", JSON.stringify(activityMatin, null, 2));
            onSave(activityMatin);

            const activityApresMidi = createActivityObject(ImportedPeriodeJour.APRES_MIDI,
                initialActivity && initialActivity.periode === ImportedPeriodeJour.APRES_MIDI ? initialActivity.id :
                    (initialActivity && initialActivity.id && isFullDay ? `new-activity-${Date.now()}-am` : undefined)
            );
            if (activityApresMidi.id === activityMatin.id && initialActivity?.periode !== ImportedPeriodeJour.APRES_MIDI) {
                activityApresMidi.id = `new-activity-${Date.now()}-am-${Math.random().toString(36).substr(2, 5)}`;
            }

            console.log("[EditActivityModal] Valeur de activityToSave (APRES_MIDI) avant onSave:", JSON.stringify(activityApresMidi, null, 2));
            onSave(activityApresMidi);

        } else {
            const currentPeriodForSave = (typeActivite === ActivityType.GARDE || typeActivite === ActivityType.ASTREINTE) ? ImportedPeriodeJour.JOURNEE_COMPLETE : periode;
            const activityToSingleSave = createActivityObject(currentPeriodForSave);
            console.log("[EditActivityModal] Valeur de activityToSave (SINGLE) avant onSave:", JSON.stringify(activityToSingleSave, null, 2));
            onSave(activityToSingleSave);
        }

        onClose();
    };

    if (!isOpen) return null;
    const selectContentClassName = "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        Éditer l'activité pour {jour} - {" "}
                        {isFullDay ? (
                            <span className="text-red-600 font-semibold">MATIN & APRÈS-MIDI</span>
                        ) : (
                            periode === ImportedPeriodeJour.JOURNEE_COMPLETE ? 'Journée' : periode
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        Configurez les détails de l'activité pour ce créneau.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 flex flex-col space-y-4">
                    {/* Checkbox Journée Entière */}
                    {(typeActivite === ActivityType.BLOC_SALLE || typeActivite === ActivityType.CONSULTATION) && periode !== ImportedPeriodeJour.JOURNEE_COMPLETE && (
                        <div className="flex items-center space-x-2 mb-2">
                            <Checkbox
                                id="isFullDayCheckbox"
                                checked={isFullDay}
                                onCheckedChange={(checkedState) => setIsFullDay(Boolean(checkedState))}
                            />
                            <Label htmlFor="isFullDayCheckbox" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Journée entière (applique à Matin & Après-midi)
                            </Label>
                        </div>
                    )}

                    {/* Type d'activité */}
                    <div className="flex flex-col w-full">
                        <Label htmlFor="typeActiviteModal" className="block text-sm font-medium mb-1">Type</Label>
                        <Select value={typeActivite} onValueChange={(value) => setTypeActivite(value as ActivityType)} disabled={isTypeLocked}>
                            <SelectTrigger id="typeActiviteModal" className="w-full"><SelectValue placeholder="Sélectionner type" /></SelectTrigger>
                            <SelectContent className={selectContentClassName}>
                                {Object.values(ActivityType).map(type => (
                                    <SelectItem key={type} value={type}>{String(type).replace('_', ' ')}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sélecteur de Salle */}
                    {(typeActivite === ActivityType.BLOC_SALLE || typeActivite === ActivityType.CONSULTATION) && (
                        <div className="flex flex-col w-full">
                            <Label htmlFor="salleModal" className="block text-sm font-medium mb-1">Salle</Label>
                            <Select value={salleId || 'none'} onValueChange={(value) => setSalleId(value === 'none' ? null : value)} disabled={isSalleLocked}>
                                <SelectTrigger id="salleModal" className="w-full"><SelectValue placeholder="Sélectionner salle" /></SelectTrigger>
                                <SelectContent className={selectContentClassName}>
                                    <SelectItem value="none">Aucune</SelectItem>
                                    {salles.map(s => (
                                        s.id && <SelectItem key={String(s.id)} value={String(s.id)}>{s.nom}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Sélecteur de Spécialité */}
                    {typeActivite === ActivityType.BLOC_SALLE && (
                        <div className="flex flex-col w-full">
                            <Label htmlFor="specialtyModal" className="block text-sm font-medium mb-1">Spécialité</Label>
                            <Select value={selectedSpecialty || 'all'} onValueChange={handleSpecialtyChange}>
                                <SelectTrigger id="specialtyModal" className="w-full"><SelectValue placeholder="Toutes spécialités" /></SelectTrigger>
                                <SelectContent className={selectContentClassName}>
                                    <SelectItem value="all">Toutes spécialités</SelectItem>
                                    {availableSpecialties.map((spec) => (
                                        <SelectItem key={spec.id} value={String(spec.id)}>
                                            {spec.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Sélecteur Chirurgien */}
                    {typeActivite === ActivityType.BLOC_SALLE && (
                        <div className="flex flex-col w-full">
                            <Label htmlFor="chirurgienModal" className="block text-sm font-medium mb-1">Chirurgien</Label>
                            <Select value={chirurgienId || 'none'} onValueChange={(value) => setChirurgienId(value === 'none' ? null : value)}>
                                <SelectTrigger id="chirurgienModal" className="w-full"><SelectValue placeholder="Sélectionner chirurgien" /></SelectTrigger>
                                <SelectContent className={selectContentClassName}>
                                    <SelectItem value="none">Aucun</SelectItem>
                                    {filteredChirurgiens.map(c => (
                                        c.id && <SelectItem key={String(c.id)} value={String(c.id)}>{c.prenom} {c.nom}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Statut Ouverture */}
                    {(typeActivite === ActivityType.BLOC_SALLE || typeActivite === ActivityType.CONSULTATION) && (
                        <div className="flex flex-col w-full">
                            <Label htmlFor="statutOuvertureModal" className="block text-sm font-medium mb-1">Statut</Label>
                            <Select value={statutOuverture} onValueChange={(value) => setStatutOuverture(value as SlotStatus)}>
                                <SelectTrigger id="statutOuvertureModal" className="w-full"><SelectValue placeholder="Sélectionner statut" /></SelectTrigger>
                                <SelectContent className={selectContentClassName}>
                                    {Object.values(SlotStatus).map(stat => (
                                        <SelectItem key={stat} value={stat}>{String(stat).replace('_', ' ')}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Sélecteur MAR */}
                    {(typeActivite === ActivityType.BLOC_SALLE || typeActivite === ActivityType.CONSULTATION || typeActivite === ActivityType.GARDE || typeActivite === ActivityType.ASTREINTE) && (
                        <div className="flex flex-col w-full">
                            <Label htmlFor="marModal" className="block text-sm font-medium mb-1">MAR</Label>
                            <Select value={marId || 'none'} onValueChange={(value) => setMarId(value === 'none' ? null : value)}>
                                <SelectTrigger id="marModal" className="w-full"><SelectValue placeholder="Sélectionner MAR" /></SelectTrigger>
                                <SelectContent className={selectContentClassName}>
                                    <SelectItem value="none">Aucun</SelectItem>
                                    {mars.map(m => (
                                        m.id && <SelectItem key={String(m.id)} value={String(m.id)}>{m.prenom} {m.nom}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Sélecteur IADE */}
                    {typeActivite === ActivityType.BLOC_SALLE && (
                        <div className="flex flex-col w-full">
                            <Label htmlFor="iadeModal" className="block text-sm font-medium mb-1">IADE</Label>
                            <Select value={iadeId || 'none'} onValueChange={(value) => setIadeId(value === 'none' ? null : value)}>
                                <SelectTrigger id="iadeModal" className="w-full"><SelectValue placeholder="Sélectionner IADE" /></SelectTrigger>
                                <SelectContent className={selectContentClassName}>
                                    <SelectItem value="none">Aucun</SelectItem>
                                    {iades.map(i => (
                                        i.id && <SelectItem key={String(i.id)} value={String(i.id)}>{i.prenom} {i.nom}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                </div>
                <DialogFooter className="mt-2">
                    <DialogClose asChild>
                        <Button variant="ghost" onClick={onClose}>Annuler</Button>
                    </DialogClose>
                    <Button onClick={handleSaveClick}>Enregistrer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditActivityModal; 