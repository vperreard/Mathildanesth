'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { logger } from "../../../lib/logger";
import { Plus, Edit, Trash2, Eye, AlertTriangle, Loader2, CheckCircle2, XCircle, Save, ListPlus, Edit3, Trash, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import Button from '@/components/ui/button';
// Importer les types Prisma nécessaires (TrameModele, Site, etc.)
// Assurez-vous que ces types sont correctement générés et accessibles
import { TrameModele, Site, RecurrenceTypeTrame, TypeSemaineTrame, DayOfWeek, AffectationModele, ActivityType, OperatingRoom, PersonnelRequisModele, PeriodeJournee, RoleGenerique, ProfessionalRoleConfig, Specialty } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// Interface étendue pour TrameModele si elle inclut des relations chargées
interface TrameModeleWithRelations extends TrameModele {
    site?: Site | null;
    affectations: AffectationModeleWithRelations[];
}

interface AffectationModeleWithRelations extends AffectationModele {
    activityType?: ActivityType | null;
    operatingRoom?: OperatingRoom | null;
    personnelRequis?: PersonnelRequisModeleWithRelations[];
}

interface PersonnelRequisModeleWithRelations extends PersonnelRequisModele {
    professionalRoleConfig?: ProfessionalRoleConfig | null;
    specialty?: Specialty | null;
    // Ajoutez ici les relations de PersonnelRequisModele si nécessaire pour l'affichage
}

const TrameModelesConfigPanel: React.FC = () => {
    const [trameModeles, setTrameModeles] = useState<TrameModeleWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isAuthenticated, isLoading: authIsLoading } = useAuth();

    const [sitesList, setSitesList] = useState<Site[]>([]);
    const [sitesLoadingError, setSitesLoadingError] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTrame, setCurrentTrame] = useState<TrameModeleWithRelations | null>(null);
    // Initialiser formData avec tous les champs attendus par TrameModele pour la création
    const [formData, setFormData] = useState<Partial<TrameModele>>({
        name: '',
        description: '',
        siteId: undefined,
        isActive: true,
        dateDebutEffet: new Date().toISOString().split('T')[0],
        dateFinEffet: undefined,
        recurrenceType: RecurrenceTypeTrame.HEBDOMADAIRE,
        joursSemaineActifs: [], // Sera [1, 2, 3, 4, 5] pour Lun-Ven (ISO 8601: Mon=1, Sun=7)
        typeSemaine: TypeSemaineTrame.TOUTES,
    });

    // États pour la gestion des AffectationModele
    const [isAffectationModalOpen, setIsAffectationModalOpen] = useState(false);
    const [currentAffectation, setCurrentAffectation] = useState<AffectationModeleWithRelations | null>(null);
    const [affectationFormData, setAffectationFormData] = useState<Partial<AffectationModeleWithRelations>>({}); // Initialisation plus tard
    const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
    const [operatingRooms, setOperatingRooms] = useState<OperatingRoom[]>([]);
    // Ajouter d'autres états pour les listes déroulantes (ProfessionalRoleConfig, Specialty) si nécessaire
    const [professionalRoles, setProfessionalRoles] = useState<ProfessionalRoleConfig[]>([]);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);

    const [dataLoadingStates, setDataLoadingStates] = useState({
        activityTypes: false,
        operatingRooms: false,
        // Ajoutez ici les états de chargement pour d'autres données
        professionalRoles: false,
        specialties: false,
    });
    const [dataLoadingErrors, setDataLoadingErrors] = useState({
        activityTypes: null as string | null,
        operatingRooms: null as string | null,
        // Ajoutez ici les états d'erreur pour d'autres données
        professionalRoles: null as string | null,
        specialties: null as string | null,
    });

    const [affectationFormErrors, setAffectationFormErrors] = useState<z.ZodError | null>(null);

    // Schémas de validation Zod
    const personnelRequisModeleSchema = z.object({
        id: z.number().optional(), // Pour les éléments existants
        roleGenerique: z.nativeEnum(RoleGenerique, { required_error: "Le rôle générique est requis." }),
        nombreRequis: z.number({ required_error: "Le nombre est requis." }).min(1, "Le nombre doit être au moins 1."),
        professionalRoleConfigId: z.string().optional(), // Code du rôle
        specialtyId: z.number().optional(),
        notes: z.string().optional(),
        // Ne pas inclure affectationModeleId ici car il est géré par la relation
    });

    const affectationModeleSchema = z.object({
        activityTypeId: z.number({ required_error: "Le type d'activité est requis." }),
        jourSemaine: z.nativeEnum(DayOfWeek, { required_error: "Le jour de la semaine est requis." }),
        periode: z.nativeEnum(PeriodeJournee, { required_error: "La période est requise." }),
        typeSemaine: z.nativeEnum(TypeSemaineTrame, { required_error: "Le type de semaine est requis." }),
        operatingRoomId: z.number().optional(),
        priorite: z.number().min(0).optional(),
        isActive: z.boolean().optional(),
        detailsJson: z.any().optional(), // Ou un schéma plus précis si la structure est connue
        personnelRequis: z.array(personnelRequisModeleSchema).optional(),
        // trameModeleId n'est pas dans le formulaire, il vient du contexte
    });

    const fetchTrameModeles = useCallback(async () => {
        if (!isAuthenticated && !authIsLoading) {
            setError('Vous devez être connecté pour voir les templates de trameModele.');
            setIsLoading(false);
            setTrameModeles([]);
            return;
        }
        if (authIsLoading) {
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            // Inclure les affectations pour un affichage plus riche si nécessaire plus tard
            const response = await axios.get<TrameModeleWithRelations[]>('/api/trameModele-modeles?includeAffectations=true');
            setTrameModeles(response.data);
        } catch (err: unknown) {
            logger.error('Erreur lors du chargement des templates de trameModele:', { error: err });
            setError(err.response?.data?.error || err.message || 'Impossible de charger les templates de trameModele.');
            setTrameModeles([]); // Vider en cas d'erreur
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, authIsLoading]);

    const fetchSitesData = useCallback(async () => {
        if (!isAuthenticated && !authIsLoading) {
            // Pas besoin de charger les sites si non authentifié
            setSitesList([]);
            return;
        }
        if (authIsLoading) return;

        try {
            const response = await axios.get<Site[]>('/api/sites');
            setSitesList(response.data || []);
            setSitesLoadingError(null);
        } catch (err: unknown) {
            logger.error("Erreur lors du chargement des sites:", err);
            setSitesLoadingError(err.response?.data?.error || err.message || 'Impossible de charger les sites.');
            setSitesList([]);
            toast.error("Erreur lors du chargement de la liste des sites.");
        }
    }, [isAuthenticated, authIsLoading]);

    const fetchActivityTypes = useCallback(async () => {
        if (!isAuthenticated || authIsLoading) return;
        setDataLoadingStates(prev => ({ ...prev, activityTypes: true }));
        setDataLoadingErrors(prev => ({ ...prev, activityTypes: null }));
        try {
            const response = await axios.get<ActivityType[]>('/api/activity-types');
            setActivityTypes(response.data || []);
        } catch (err: unknown) {
            logger.error("Erreur lors du chargement des types d'activité:", err);
            setDataLoadingErrors(prev => ({ ...prev, activityTypes: err.response?.data?.error || err.message || "Impossible de charger les types d'activité." }));
            toast.error("Erreur chargement types d'activité.");
        } finally {
            setDataLoadingStates(prev => ({ ...prev, activityTypes: false }));
        }
    }, [isAuthenticated, authIsLoading]);

    const fetchOperatingRooms = useCallback(async () => {
        if (!isAuthenticated || authIsLoading) return;
        setDataLoadingStates(prev => ({ ...prev, operatingRooms: true }));
        setDataLoadingErrors(prev => ({ ...prev, operatingRooms: null }));
        try {
            // Si vous avez une route spécifique pour les salles d'op non liées à un site, ou toutes les salles
            // Sinon, vous pourriez avoir besoin de les charger en fonction du site sélectionné pour la TrameModele
            const response = await axios.get<OperatingRoom[]>('/api/operating-rooms');
            setOperatingRooms(response.data || []);
        } catch (err: unknown) {
            logger.error("Erreur lors du chargement des salles d'opération:", err);
            setDataLoadingErrors(prev => ({ ...prev, operatingRooms: err.response?.data?.error || err.message || "Impossible de charger les salles." }));
            toast.error("Erreur chargement salles d'opération.");
        } finally {
            setDataLoadingStates(prev => ({ ...prev, operatingRooms: false }));
        }
    }, [isAuthenticated, authIsLoading]);

    const fetchProfessionalRoles = useCallback(async () => {
        if (!isAuthenticated || authIsLoading) return;
        setDataLoadingStates(prev => ({ ...prev, professionalRoles: true }));
        setDataLoadingErrors(prev => ({ ...prev, professionalRoles: null }));
        try {
            // Assurez-vous d'avoir une route API pour les rôles professionnels
            // Par exemple: /api/professional-roles ou /api/admin/professional-role-configs
            const response = await axios.get<ProfessionalRoleConfig[]>('/api/admin/professional-role-configs');
            setProfessionalRoles(response.data || []);
        } catch (err: unknown) {
            logger.error("Erreur lors du chargement des rôles professionnels:", err);
            setDataLoadingErrors(prev => ({ ...prev, professionalRoles: err.response?.data?.error || err.message || "Impossible de charger les rôles professionnels." }));
            toast.error("Erreur chargement rôles professionnels.");
        } finally {
            setDataLoadingStates(prev => ({ ...prev, professionalRoles: false }));
        }
    }, [isAuthenticated, authIsLoading]);

    const fetchSpecialties = useCallback(async () => {
        if (!isAuthenticated || authIsLoading) return;
        setDataLoadingStates(prev => ({ ...prev, specialties: true }));
        setDataLoadingErrors(prev => ({ ...prev, specialties: null }));
        try {
            // Assurez-vous d'avoir une route API pour les spécialités
            // Par exemple: /api/specialties
            const response = await axios.get<Specialty[]>('/api/specialties');
            setSpecialties(response.data || []);
        } catch (err: unknown) {
            logger.error("Erreur lors du chargement des spécialités:", err);
            setDataLoadingErrors(prev => ({ ...prev, specialties: err.response?.data?.error || err.message || "Impossible de charger les spécialités." }));
            toast.error("Erreur chargement spécialités.");
        } finally {
            setDataLoadingStates(prev => ({ ...prev, specialties: false }));
        }
    }, [isAuthenticated, authIsLoading]);

    useEffect(() => {
        // Charger les données initialement ou quand l'état d'authentification change
        fetchTrameModeles();
        fetchSitesData();
        if (isAuthenticated && !authIsLoading) {
            fetchActivityTypes();
            fetchOperatingRooms();
            // Appeler ici le chargement d'autres données nécessaires pour les affectations
            fetchProfessionalRoles();
            fetchSpecialties();
        }
    }, [fetchTrameModeles, fetchSitesData, isAuthenticated, authIsLoading, fetchActivityTypes, fetchOperatingRooms, fetchProfessionalRoles, fetchSpecialties]);

    // Convention ISO 8601: Lundi=1, Mardi=2, ..., Dimanche=7
    const dayOfWeekMapping: { key: DayOfWeek; label: string; isoValue: number }[] = [
        { key: DayOfWeek.MONDAY, label: "Lundi", isoValue: 1 },
        { key: DayOfWeek.TUESDAY, label: "Mardi", isoValue: 2 },
        { key: DayOfWeek.WEDNESDAY, label: "Mercredi", isoValue: 3 },
        { key: DayOfWeek.THURSDAY, label: "Jeudi", isoValue: 4 },
        { key: DayOfWeek.FRIDAY, label: "Vendredi", isoValue: 5 },
        { key: DayOfWeek.SATURDAY, label: "Samedi", isoValue: 6 },
        { key: DayOfWeek.SUNDAY, label: "Dimanche", isoValue: 7 },
    ];

    const joursSemaineToString = (joursIso: number[]): string => {
        return joursIso
            .map(isoVal => dayOfWeekMapping.find(d => d.isoValue === isoVal)?.label || '?')
            .join(', ');
    };

    const handleOpenNewModal = () => {
        setCurrentTrame(null);
        setFormData({
            name: '',
            description: '',
            siteId: undefined,
            isActive: true,
            dateDebutEffet: new Date().toISOString().split('T')[0],
            dateFinEffet: undefined,
            recurrenceType: RecurrenceTypeTrame.HEBDOMADAIRE,
            joursSemaineActifs: [],
            typeSemaine: TypeSemaineTrame.TOUTES,
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (trameModele: TrameModeleWithRelations) => {
        setCurrentTrame(trameModele);
        setFormData({
            name: trameModele.name || '',
            description: trameModele.description || '',
            siteId: trameModele.siteId || undefined,
            isActive: trameModele.isActive !== undefined ? trameModele.isActive : true,
            // Assurer que les dates sont au format YYYY-MM-DD pour les inputs de type date
            dateDebutEffet: trameModele.dateDebutEffet ? new Date(trameModele.dateDebutEffet).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            dateFinEffet: trameModele.dateFinEffet ? new Date(trameModele.dateFinEffet).toISOString().split('T')[0] : undefined,
            recurrenceType: trameModele.recurrenceType,
            joursSemaineActifs: trameModele.joursSemaineActifs || [],
            typeSemaine: trameModele.typeSemaine,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isAuthenticated || authIsLoading) {
            toast.error("Vous devez être authentifié pour effectuer cette action.");
            return;
        }

        // Validation simple côté client (des validations plus robustes peuvent être ajoutées avec Zod, etc.)
        if (!formData.name || formData.name.trim() === '') {
            toast.error("Le nom du template de trameModele est requis.");
            return;
        }
        if (!formData.dateDebutEffet) {
            toast.error("La date de début d'effet est requise.");
            return;
        }
        if (!formData.recurrenceType) {
            toast.error("Le type de récurrence est requis.");
            return;
        }
        if (!formData.typeSemaine) {
            toast.error("Le type de semaine est requis.");
            return;
        }
        if (!formData.joursSemaineActifs || formData.joursSemaineActifs.length === 0) {
            toast.error("Au moins un jour de la semaine doit être actif.");
            return;
        }

        const dataToSubmit = {
            ...formData,
            // Assurer que les dates sont bien formatées si nécessaire, mais l'API devrait gérer les strings ISO
            // siteId: formData.siteId === '' ? null : formData.siteId, // Déjà géré dans le onChange du Select
        };

        setIsLoading(true); // Pour indiquer une opération en cours sur la page principale ou un loader dans la modale
        setError(null);

        try {
            let response;
            if (currentTrame && currentTrame.id) {
                // Logique de mise à jour (PUT)
                response = await axios.put(`http://localhost:3000/api/trameModele-modeles/${currentTrame.id}`, dataToSubmit);
                toast.success('Modèle de trameModele mis à jour avec succès!');
            } else {
                // Logique de création (POST)
                response = await axios.post('http://localhost:3000/api/trameModele-modeles', dataToSubmit);
                toast.success('Modèle de trameModele créé avec succès!');
            }

            setIsModalOpen(false);
            fetchTrameModeles(); // Recharger la liste
        } catch (err: unknown) {
            logger.error("Erreur lors de la soumission du template de trameModele:", err);
            const apiError = err.response?.data?.error || err.message || "Une erreur est survenue.";
            setError(apiError); // Afficher l'erreur potentiellement dans la modale ou globalement
            toast.error(`Erreur: ${apiError}`);
        } finally {
            setIsLoading(false); // Fin de l'opération
        }
    };

    const handleDelete = async (trameId: number) => {
        if (!isAuthenticated || authIsLoading) {
            toast.error("Vous devez être authentifié pour supprimer.");
            return;
        }

        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce template de trameModele ? Cette action est irréversible.")) {
            setIsLoading(true); // Indiquer une opération en cours
            setError(null);
            try {
                await axios.delete(`http://localhost:3000/api/trameModele-modeles/${trameId}`);
                toast.success("Modèle de trameModele supprimé avec succès!");
                fetchTrameModeles(); // Recharger la liste
            } catch (err: unknown) {
                logger.error("Erreur lors de la suppression du template de trameModele:", err);
                const apiError = err.response?.data?.error || err.message || "Une erreur est survenue lors de la suppression.";
                setError(apiError);
                toast.error(`Erreur: ${apiError}`);
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Fonctions pour la gestion des AffectationModele
    const handleOpenNewAffectationModal = () => {
        setCurrentAffectation(null);
        // Initialiser affectationFormData avec les valeurs par défaut
        setAffectationFormData({
            jourSemaine: DayOfWeek.MONDAY,
            periode: PeriodeJournee.MATIN,
            typeSemaine: TypeSemaineTrame.TOUTES, // ou une enum spécifique pour affectation si différente
            isActive: true,
            priorite: 5,
            personnelRequis: []
        });
        setIsAffectationModalOpen(true);
    };

    const handleOpenEditAffectationModal = (affectation: AffectationModeleWithRelations) => {
        setCurrentAffectation(affectation);
        setAffectationFormData({ ...affectation }); // Copier l'affectation existante dans le formulaire
        setIsAffectationModalOpen(true);
    };

    const handleAffectationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isAuthenticated || !currentTrame) {
            toast.error("Non authentifié ou aucun template de trameModele sélectionné.");
            return;
        }
        // ✅ Validation du formulaire d'affectation avec Zod (TODO complété)
        setAffectationFormErrors(null); // Réinitialiser les erreurs
        const validationResult = affectationModeleSchema.safeParse(affectationFormData);

        if (!validationResult.success) {
            logger.error("Erreurs de validation du formulaire d'affectation:", validationResult.error.flatten());
            setAffectationFormErrors(validationResult.error);
            toast.error("Le formulaire contient des erreurs. Veuillez vérifier les champs.");
            // Afficher les erreurs plus en détail si nécessaire
            validationResult.error.errors.forEach(err => {
                // Exemple: cibler un champ spécifique
                // if (err.path.includes('activityTypeId')) { toast.error(`Type d'activité: ${err.message}`); }
                logger.info(`Validation Error - Path: ${err.path.join('.')}, Message: ${err.message}`);
            });
            return;
        }

        // Utiliser validationResult.data qui contient les données parsées et potentiellement transformées
        const dataToSubmit = validationResult.data;

        setIsLoading(true); // Peut-être un loader spécifique pour la modale d'affectation
        try {
            if (currentAffectation && currentAffectation.id) {
                // Mise à jour
                const response = await axios.put<AffectationModeleWithRelations>(`/api/affectation-modeles/${currentAffectation.id}`, dataToSubmit);
                toast.success("Affectation mise à jour.");
                // Mettre à jour l'état local
                if (currentTrame && currentTrame.affectations) {
                    const updatedAffectations = currentTrame.affectations.map(aff =>
                        aff.id === response.data.id ? response.data : aff
                    );
                    setCurrentTrame(prevTrame => prevTrame ? ({ ...prevTrame, affectations: updatedAffectations }) : null);
                    // Mettre aussi à jour la liste principale des trameModeles si currentTrame en fait partie
                    setTrameModeles(prevModeles => prevModeles.map(tm =>
                        tm.id === currentTrame.id ? ({ ...tm, affectations: updatedAffectations }) : tm
                    ));
                }
            } else {
                // Création
                const response = await axios.post<AffectationModeleWithRelations>(`/api/trameModele-modeles/${currentTrame.id}/affectations`, dataToSubmit);
                toast.success("Affectation ajoutée.");
                // Mettre à jour l'état local
                if (currentTrame) {
                    const newAffectation = response.data;
                    const updatedAffectations = [...(currentTrame.affectations || []), newAffectation];
                    setCurrentTrame(prevTrame => prevTrame ? ({ ...prevTrame, affectations: updatedAffectations }) : null);
                    // Mettre aussi à jour la liste principale des trameModeles
                    setTrameModeles(prevModeles => prevModeles.map(tm =>
                        tm.id === currentTrame.id ? ({ ...tm, affectations: updatedAffectations }) : tm
                    ));
                }
            }
            setIsAffectationModalOpen(false);
            // fetchTrameModeles(); // Rechargement global désactivé pour mise à jour locale
        } catch (err: unknown) {
            logger.error("Erreur soumission affectation:", err);
            toast.error(err.response?.data?.error || "Erreur lors de la sauvegarde de l'affectation.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAffectationDelete = async (affectationId: number) => {
        if (!isAuthenticated) {
            toast.error("Non authentifié.");
            return;
        }
        if (window.confirm("Supprimer cette affectation ?")) {
            setIsLoading(true);
            try {
                await axios.delete(`http://localhost:3000/api/affectation-modeles/${affectationId}`);
                toast.success("Affectation supprimée.");
                // Mettre à jour l'état local
                if (currentTrame && currentTrame.affectations) {
                    const updatedAffectations = currentTrame.affectations.filter(aff => aff.id !== affectationId);
                    setCurrentTrame(prevTrame => prevTrame ? ({ ...prevTrame, affectations: updatedAffectations }) : null);
                    // Mettre aussi à jour la liste principale des trameModeles
                    setTrameModeles(prevModeles => prevModeles.map(tm =>
                        tm.id === currentTrame.id ? ({ ...tm, affectations: updatedAffectations }) : tm
                    ));
                }
                // fetchTrameModeles(); // Rechargement global désactivé pour mise à jour locale
            } catch (err: unknown) {
                logger.error("Erreur suppression affectation:", err);
                toast.error(err.response?.data?.error || "Erreur suppression.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    if (authIsLoading || (isLoading && trameModeles.length === 0)) {
        return (
            <div className="flex justify-center items-center h-32">
                <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
                <p className="ml-2 text-gray-600">Chargement des templates de trameModele...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-700">Gestion des Modèles de TrameModele</h2>
                {isAuthenticated && (
                    <Button onClick={handleOpenNewModal}>
                        <Plus className="mr-2 h-5 w-5" /> Ajouter un template
                    </Button>
                )}
            </div>

            {!isAuthenticated && !authIsLoading && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                    <p className="font-bold">Non authentifié</p>
                    <p>{error || 'Vous devez être connecté pour gérer les templates de trameModele.'}</p>
                </div>
            )}

            {isAuthenticated && error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                    <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                        <div>
                            <p className="font-bold">Erreur de chargement</p>
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {isAuthenticated && !isLoading && !error && trameModeles.length === 0 && (
                <div className="text-center py-8">
                    <Eye className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun template de trameModele</h3>
                    <p className="mt-1 text-sm text-gray-500">Commencez par créer un nouveau template de trameModele.</p>
                    {/* Bouton ici aussi si on veut faciliter la création depuis cet état vide */}
                </div>
            )}

            {isAuthenticated && !error && trameModeles.length > 0 && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actif</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Début</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fin</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Récurrence</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jours Actifs</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type Semaine</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {trameModeles.map((trameModele) => (
                                <tr key={trameModele.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trameModele.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trameModele.site?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {trameModele.isActive ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(trameModele.dateDebutEffet).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {trameModele.dateFinEffet ? new Date(trameModele.dateFinEffet).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trameModele.recurrenceType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{joursSemaineToString(trameModele.joursSemaineActifs)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trameModele.typeSemaine}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(trameModele)} className="text-indigo-600 hover:text-indigo-900">
                                            <Edit className="h-4 w-4 mr-1" /> Modifier
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(trameModele.id)} className="text-red-600 hover:text-red-900 ml-2">
                                            <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <Dialog open={isModalOpen} onOpenChange={(open) => { if (!open) setIsModalOpen(false); else setIsModalOpen(true); }}>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>{currentTrame ? "Modifier le Modèle de TrameModele" : "Ajouter un Modèle de TrameModele"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                                {/* Colonne 1 */}
                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="trameName">Nom du template</Label>
                                        <Input id="trameName" name="name" value={formData.name || ''} onChange={(e) => setFormData(fd => ({ ...fd, name: e.target.value }))} required />
                                    </div>
                                    <div>
                                        <Label htmlFor="trameDescription">Description</Label>
                                        <Textarea id="trameDescription" name="description" value={formData.description || ''} onChange={(e) => setFormData(fd => ({ ...fd, description: e.target.value }))} />
                                    </div>
                                    <div>
                                        <Label htmlFor="trameSite">Site</Label>
                                        <Select
                                            name="siteId"
                                            value={formData.siteId || undefined}
                                            onValueChange={(value) => setFormData(fd => ({ ...fd, siteId: value === '' ? undefined : value }))}
                                            disabled={sitesList.length === 0 && !sitesLoadingError} // Désactiver si la liste est vide et qu'il n'y a pas d'erreur de chargement
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={sitesLoadingError ? "Erreur chargement sites" : "Sélectionner un site (optionnel)"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Aucun</SelectItem>
                                                {sitesList.map(site => (
                                                    <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {sitesLoadingError && <p className="text-xs text-red-500 mt-1">{sitesLoadingError}</p>}
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox id="trameIsActive" name="isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData(fd => ({ ...fd, isActive: !!checked }))} />
                                        <Label htmlFor="trameIsActive">Actif</Label>
                                    </div>
                                </div>

                                {/* Colonne 2 */}
                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="trameDateDebut">Date de début d'effet</Label>
                                        <Input type="date" id="trameDateDebut" name="dateDebutEffet" value={formData.dateDebutEffet || ''} onChange={(e) => setFormData(fd => ({ ...fd, dateDebutEffet: e.target.value }))} required />
                                    </div>
                                    <div>
                                        <Label htmlFor="trameDateFin">Date de fin d'effet (optionnel)</Label>
                                        <Input type="date" id="trameDateFin" name="dateFinEffet" value={formData.dateFinEffet || ''} onChange={(e) => setFormData(fd => ({ ...fd, dateFinEffet: e.target.value === '' ? undefined : e.target.value }))} />
                                    </div>
                                    <div>
                                        <Label htmlFor="trameRecurrenceType">Type de récurrence</Label>
                                        <Select name="recurrenceType" value={formData.recurrenceType} onValueChange={(value) => setFormData(fd => ({ ...fd, recurrenceType: value as RecurrenceTypeTrame }))} required>
                                            <SelectTrigger><SelectValue placeholder="Type de récurrence" /></SelectTrigger>
                                            <SelectContent>
                                                {Object.values(RecurrenceTypeTrame).map(rt => <SelectItem key={rt} value={rt}>{rt}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="trameTypeSemaine">Type de semaine</Label>
                                        <Select name="typeSemaine" value={formData.typeSemaine} onValueChange={(value) => setFormData(fd => ({ ...fd, typeSemaine: value as TypeSemaineTrame }))} required>
                                            <SelectTrigger><SelectValue placeholder="Type de semaine" /></SelectTrigger>
                                            <SelectContent>
                                                {Object.values(TypeSemaineTrame).map(ts => <SelectItem key={ts} value={ts}>{ts}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            {/* Jours de la semaine actifs - en dehors du grid pour pleine largeur */}
                            <div className="mt-4">
                                <Label className="mb-2 block">Jours de la semaine actifs</Label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                                    {dayOfWeekMapping.map(day => (
                                        <div key={day.key} className="flex items-center space-x-2 p-2 border rounded-md">
                                            <Checkbox
                                                id={`jour-${day.key}`}
                                                checked={formData.joursSemaineActifs?.includes(day.isoValue)}
                                                onCheckedChange={(checked) => {
                                                    const currentJours = formData.joursSemaineActifs || [];
                                                    const newJours = checked
                                                        ? [...currentJours, day.isoValue]
                                                        : currentJours.filter(j => j !== day.isoValue);
                                                    setFormData(fd => ({ ...fd, joursSemaineActifs: newJours.sort((a, b) => a - b) }));
                                                }}
                                            />
                                            <Label htmlFor={`jour-${day.key}`} className="text-sm font-normal">{day.label}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section pour les AffectationModele */}
                            {currentTrame && currentTrame.id && (
                                <div className="mt-6 pt-4 border-t">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-lg font-medium text-gray-800">Affectations du Modèle</h3>
                                        <Button type="button" variant="outline" size="sm" onClick={handleOpenNewAffectationModal}>
                                            <ListPlus className="mr-2 h-4 w-4" /> Ajouter une affectation
                                        </Button>
                                    </div>
                                    {currentTrame.affectations && currentTrame.affectations.length > 0 ? (
                                        <ul className="space-y-2">
                                            {currentTrame.affectations.map(affectation => (
                                                <li key={affectation.id} className="p-3 bg-gray-50 rounded-md border flex justify-between items-center">
                                                    <div>
                                                        <p className="font-medium text-sm text-gray-700">
                                                            {affectation.activityType?.name || 'Activité non définie'} - {affectation.jourSemaine} - {affectation.periode}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Salle: {affectation.operatingRoom?.name || 'N/A'} | Priorité: {affectation.priorite}
                                                            {/* Afficher plus de détails sur personnelRequis si nécessaire */}
                                                        </p>
                                                    </div>
                                                    <div className="space-x-2">
                                                        <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800" onClick={() => handleOpenEditAffectationModal(affectation)}>
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-800" onClick={() => handleAffectationDelete(affectation.id)}>
                                                            <Trash className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500 text-center py-4">Aucune affectation définie pour ce template.</p>
                                    )}
                                </div>
                            )}
                        </form>
                        <DialogFooter className="mt-auto pt-4 sticky bottom-0 bg-white_forcing_opaque_tailwind_rules_here ">
                            <DialogClose asChild><Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Annuler</Button></DialogClose>
                            <Button type="submit" form="trameForm" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} Sauvegarder
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Modale pour Ajouter/Modifier AffectationModele */}
            {isAffectationModalOpen && currentTrame && (
                <Dialog open={isAffectationModalOpen} onOpenChange={setIsAffectationModalOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>
                                {currentAffectation ? "Modifier l'Affectation" : "Ajouter une Affectation"} au template "{currentTrame.name}"
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAffectationSubmit} id="affectationForm" className="space-y-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="affectationActivityType">Type d'activité *</Label>
                                    <Select
                                        name="activityTypeId"
                                        value={affectationFormData.activityTypeId?.toString() || ''}
                                        onValueChange={(value) => setAffectationFormData(fd => ({ ...fd, activityTypeId: value ? parseInt(value) : undefined }))}
                                        required
                                    >
                                        <SelectTrigger disabled={dataLoadingStates.activityTypes}>
                                            <SelectValue placeholder={dataLoadingStates.activityTypes ? "Chargement..." : "Sélectionner un type"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {activityTypes.map(at => <SelectItem key={at.id} value={at.id.toString()}>{at.name} ({at.code})</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {dataLoadingErrors.activityTypes && <p className="text-xs text-red-500 mt-1">{dataLoadingErrors.activityTypes}</p>}
                                    {affectationFormErrors?.formErrors.fieldErrors.activityTypeId && (
                                        <p className="text-xs text-red-500 mt-1">{affectationFormErrors.formErrors.fieldErrors.activityTypeId.join(', ')}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="affectationOperatingRoom">Salle d'opération (optionnel)</Label>
                                    <Select
                                        name="operatingRoomId"
                                        value={affectationFormData.operatingRoomId?.toString() || ''}
                                        onValueChange={(value) => setAffectationFormData(fd => ({ ...fd, operatingRoomId: value ? parseInt(value) : undefined }))}
                                    >
                                        <SelectTrigger disabled={dataLoadingStates.operatingRooms}>
                                            <SelectValue placeholder={dataLoadingStates.operatingRooms ? "Chargement..." : "Sélectionner une salle"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Aucune</SelectItem>
                                            {operatingRooms.map(or => <SelectItem key={or.id} value={or.id.toString()}>{or.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {dataLoadingErrors.operatingRooms && <p className="text-xs text-red-500 mt-1">{dataLoadingErrors.operatingRooms}</p>}
                                    {affectationFormErrors?.formErrors.fieldErrors.operatingRoomId && (
                                        <p className="text-xs text-red-500 mt-1">{affectationFormErrors.formErrors.fieldErrors.operatingRoomId.join(', ')}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="affectationJourSemaine">Jour de la semaine *</Label>
                                    <Select
                                        name="jourSemaine"
                                        value={affectationFormData.jourSemaine || ''}
                                        onValueChange={(value) => setAffectationFormData(fd => ({ ...fd, jourSemaine: value as DayOfWeek }))}
                                        required
                                    >
                                        <SelectTrigger><SelectValue placeholder="Sélectionner un jour" /></SelectTrigger>
                                        <SelectContent>
                                            {Object.values(DayOfWeek).map(day => (
                                                <SelectItem key={day} value={day}>{dayOfWeekMapping.find(d => d.key === day)?.label || day}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {affectationFormErrors?.formErrors.fieldErrors.jourSemaine && (
                                        <p className="text-xs text-red-500 mt-1">{affectationFormErrors.formErrors.fieldErrors.jourSemaine.join(', ')}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="affectationPeriode">Période *</Label>
                                    <Select
                                        name="periode"
                                        value={affectationFormData.periode || ''}
                                        onValueChange={(value) => setAffectationFormData(fd => ({ ...fd, periode: value as PeriodeJournee }))}
                                        required
                                    >
                                        <SelectTrigger><SelectValue placeholder="Sélectionner une période" /></SelectTrigger>
                                        <SelectContent>
                                            {Object.values(PeriodeJournee).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {affectationFormErrors?.formErrors.fieldErrors.periode && (
                                        <p className="text-xs text-red-500 mt-1">{affectationFormErrors.formErrors.fieldErrors.periode.join(', ')}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="affectationTypeSemaine">Type de semaine *</Label>
                                    <Select
                                        name="typeSemaine"
                                        value={affectationFormData.typeSemaine || ''}
                                        onValueChange={(value) => setAffectationFormData(fd => ({ ...fd, typeSemaine: value as TypeSemaineTrame }))}
                                        required
                                    >
                                        <SelectTrigger><SelectValue placeholder="Sélectionner type de semaine" /></SelectTrigger>
                                        <SelectContent>
                                            {Object.values(TypeSemaineTrame).map(ts => <SelectItem key={ts} value={ts}>{ts}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {affectationFormErrors?.formErrors.fieldErrors.typeSemaine && (
                                        <p className="text-xs text-red-500 mt-1">{affectationFormErrors.formErrors.fieldErrors.typeSemaine.join(', ')}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="affectationPriorite">Priorité</Label>
                                    <Input
                                        type="number"
                                        id="affectationPriorite"
                                        name="priorite"
                                        value={affectationFormData.priorite || '5'}
                                        onChange={(e) => setAffectationFormData(fd => ({ ...fd, priorite: parseInt(e.target.value) || 5 }))}
                                    />
                                    {affectationFormErrors?.formErrors.fieldErrors.priorite && (
                                        <p className="text-xs text-red-500 mt-1">{affectationFormErrors.formErrors.fieldErrors.priorite.join(', ')}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pt-3">
                                <Checkbox
                                    id="affectationIsActive"
                                    name="isActive"
                                    checked={affectationFormData.isActive === undefined ? true : affectationFormData.isActive}
                                    onCheckedChange={(checked) => setAffectationFormData(fd => ({ ...fd, isActive: !!checked }))}
                                />
                                <Label htmlFor="affectationIsActive">Affectation active</Label>
                            </div>

                            {/* Section Personnel Requis */}
                            <div className="mt-6 pt-4 border-t">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-md font-medium text-gray-800">Personnel Requis</h4>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const newPersonnelRequis = {
                                                // Valeurs par défaut pour un nouveau personnel requis
                                                roleGenerique: RoleGenerique.MEDECIN, // Exemple
                                                nombreRequis: 1,
                                            };
                                            setAffectationFormData(fd => ({
                                                ...fd,
                                                personnelRequis: [...(fd.personnelRequis || []), newPersonnelRequis]
                                            }));
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Ajouter Personnel
                                    </Button>
                                </div>

                                {(affectationFormData.personnelRequis && affectationFormData.personnelRequis.length > 0) ? (
                                    <div className="space-y-4">
                                        {affectationFormData.personnelRequis.map((pr, index) => (
                                            <div key={index} className="p-3 border rounded-md bg-gray-50 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-sm font-medium text-gray-700">Personnel Requis #{index + 1}</p>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-700"
                                                        onClick={() => {
                                                            setAffectationFormData(fd => ({
                                                                ...fd,
                                                                personnelRequis: fd.personnelRequis?.filter((_, i) => i !== index)
                                                            }));
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    {/* Bouton Dupliquer Personnel Requis */}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-blue-500 hover:text-blue-700 ml-1"
                                                        onClick={() => {
                                                            const personnelToDuplicate = affectationFormData.personnelRequis?.[index];
                                                            if (personnelToDuplicate) {
                                                                const { id, ...duplicatedPersonnel } = personnelToDuplicate; // Exclure l'ID pour la copie
                                                                setAffectationFormData(fd => ({
                                                                    ...fd,
                                                                    personnelRequis: [
                                                                        ...(fd.personnelRequis || []).slice(0, index + 1),
                                                                        duplicatedPersonnel,
                                                                        ...(fd.personnelRequis || []).slice(index + 1),
                                                                    ]
                                                                }));
                                                            }
                                                        }}
                                                        title="Dupliquer ce personnel requis"
                                                    >
                                                        <Copy className="h-4 w-4" /> {/* Assurez-vous d'importer l'icône Copy de lucide-react */}
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <Label htmlFor={`pr-role-${index}`}>Rôle Générique *</Label>
                                                        <Select
                                                            value={pr.roleGenerique || ''}
                                                            onValueChange={(value) => {
                                                                const updatedPr = [...(affectationFormData.personnelRequis || [])];
                                                                updatedPr[index] = { ...updatedPr[index], roleGenerique: value as RoleGenerique };
                                                                setAffectationFormData(fd => ({ ...fd, personnelRequis: updatedPr }));
                                                            }}
                                                            required
                                                        >
                                                            <SelectTrigger><SelectValue placeholder="Sélectionner un rôle" /></SelectTrigger>
                                                            <SelectContent>
                                                                {Object.values(RoleGenerique).map(rg => <SelectItem key={rg} value={rg}>{rg}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                        {/* Affichage d'erreur pour personnelRequis[index].roleGenerique */}
                                                        {affectationFormErrors?.formErrors.fieldErrors.personnelRequis?.[index]?.roleGenerique && (
                                                            <p className="text-xs text-red-500 mt-1">{affectationFormErrors.formErrors.fieldErrors.personnelRequis[index].roleGenerique.join(', ')}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor={`pr-nombre-${index}`}>Nombre Requis *</Label>
                                                        <Input
                                                            type="number"
                                                            id={`pr-nombre-${index}`}
                                                            value={pr.nombreRequis || 1}
                                                            onChange={(e) => {
                                                                const updatedPr = [...(affectationFormData.personnelRequis || [])];
                                                                updatedPr[index] = { ...updatedPr[index], nombreRequis: parseInt(e.target.value) || 1 };
                                                                setAffectationFormData(fd => ({ ...fd, personnelRequis: updatedPr }));
                                                            }}
                                                            min={1}
                                                            required
                                                        />
                                                        {/* Affichage d'erreur pour personnelRequis[index].nombreRequis */}
                                                        {affectationFormErrors?.formErrors.fieldErrors.personnelRequis?.[index]?.nombreRequis && (
                                                            <p className="text-xs text-red-500 mt-1">{affectationFormErrors.formErrors.fieldErrors.personnelRequis[index].nombreRequis.join(', ')}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor={`pr-profrole-${index}`}>Rôle Professionnel Spécifique</Label>
                                                        <Select
                                                            value={pr.professionalRoleConfigId?.toString() || ''}
                                                            onValueChange={(value) => {
                                                                const updatedPr = [...(affectationFormData.personnelRequis || [])];
                                                                updatedPr[index] = { ...updatedPr[index], professionalRoleConfigId: value ? value : undefined }; // Prisma attend le code du rôle, non l'ID numérique
                                                                setAffectationFormData(fd => ({ ...fd, personnelRequis: updatedPr }));
                                                            }}
                                                            disabled={dataLoadingStates.professionalRoles}
                                                        >
                                                            <SelectTrigger><SelectValue placeholder={dataLoadingStates.professionalRoles ? "Chargement..." : "Optionnel"} /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="">Aucun</SelectItem>
                                                                {professionalRoles.map(role => <SelectItem key={role.code} value={role.code}>{role.name} ({role.code})</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                        {dataLoadingErrors.professionalRoles && <p className="text-xs text-red-500 mt-1">{dataLoadingErrors.professionalRoles}</p>}
                                                        {/* Affichage d'erreur pour personnelRequis[index].professionalRoleConfigId */}
                                                        {affectationFormErrors?.formErrors.fieldErrors.personnelRequis?.[index]?.professionalRoleConfigId && (
                                                            <p className="text-xs text-red-500 mt-1">{affectationFormErrors.formErrors.fieldErrors.personnelRequis[index].professionalRoleConfigId.join(', ')}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor={`pr-specialty-${index}`}>Spécialité</Label>
                                                        <Select
                                                            value={pr.specialtyId?.toString() || ''}
                                                            onValueChange={(value) => {
                                                                const updatedPr = [...(affectationFormData.personnelRequis || [])];
                                                                updatedPr[index] = { ...updatedPr[index], specialtyId: value ? parseInt(value) : undefined };
                                                                setAffectationFormData(fd => ({ ...fd, personnelRequis: updatedPr }));
                                                            }}
                                                            disabled={dataLoadingStates.specialties}
                                                        >
                                                            <SelectTrigger><SelectValue placeholder={dataLoadingStates.specialties ? "Chargement..." : "Optionnel"} /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="">Aucune</SelectItem>
                                                                {specialties.map(spec => <SelectItem key={spec.id} value={spec.id.toString()}>{spec.name}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                        {dataLoadingErrors.specialties && <p className="text-xs text-red-500 mt-1">{dataLoadingErrors.specialties}</p>}
                                                        {/* Affichage d'erreur pour personnelRequis[index].specialtyId */}
                                                        {affectationFormErrors?.formErrors.fieldErrors.personnelRequis?.[index]?.specialtyId && (
                                                            <p className="text-xs text-red-500 mt-1">{affectationFormErrors.formErrors.fieldErrors.personnelRequis[index].specialtyId.join(', ')}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor={`pr-notes-${index}`}>Notes</Label>
                                                    <Textarea
                                                        id={`pr-notes-${index}`}
                                                        value={pr.notes || ''}
                                                        onChange={(e) => {
                                                            const updatedPr = [...(affectationFormData.personnelRequis || [])];
                                                            updatedPr[index] = { ...updatedPr[index], notes: e.target.value };
                                                            setAffectationFormData(fd => ({ ...fd, personnelRequis: updatedPr }));
                                                        }}
                                                        placeholder="Notes supplémentaires (optionnel)"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-3">Aucun personnel requis pour cette affectation. Cliquez sur "Ajouter Personnel".</p>
                                )}
                            </div>
                        </form>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline" onClick={() => setIsAffectationModalOpen(false)}>Annuler</Button></DialogClose>
                            <Button type="submit" form="affectationForm" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                {currentAffectation ? "Sauvegarder les modifications" : "Ajouter l'affectation"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default TrameModelesConfigPanel; 