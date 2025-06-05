import React, { useState, useEffect, useCallback } from 'react';
import { logger } from "../../../lib/logger";
import { useForm, Controller } from 'react-hook-form';
import { format, addMinutes, parseISO } from 'date-fns';
import { CalendarEventType } from '../types/event';
import { Spinner, FormSubmitSpinner, Tooltip, TooltipIcon, HelpTooltip, useToast } from './feedback';
import { motion, AnimatePresence } from 'framer-motion';

// Types pour le formulaire
export interface Room {
    id: string;
    name: string;
    sector: string;
    capacity: number;
    equipment: string[];
    isAvailable: boolean;
}

export interface Sector {
    id: string;
    name: string;
    color: string;
    rooms: Room[];
}

export interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    role: 'ANESTHESIOLOGIST' | 'SURGEON' | 'NURSE';
    specialties: string[];
    isAvailable: boolean;
}

export interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    medicalRecordNumber: string;
}

export interface OperationFormValues {
    title: string;
    description?: string;
    start: string;
    duration: number;
    room: string;
    sector: string;
    patient: string;
    anesthesiologists: string[];
    surgeons: string[];
    nurses: string[];
    priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    requiredEquipment: string[];
    notes?: string;
}

interface OperationFormProps {
    initialValues?: Partial<OperationFormValues>;
    sectors: Sector[];
    staff: Staff[];
    patients: Patient[];
    onSubmit: (values: OperationFormValues) => void;
    onCancel: () => void;
    isEditing?: boolean;
}

/**
 * Formulaire pour créer ou modifier une opération de bloc
 */
export const OperationForm: React.FC<OperationFormProps> = ({
    initialValues,
    sectors,
    staff,
    patients,
    onSubmit,
    onCancel,
    isEditing = false
}) => {
    // Utiliser le hook toast
    const { showSuccess, showError, ToastContainer } = useToast();

    // État pour le feedback visuel
    const [isValidating, setIsValidating] = useState(false);
    const [hasTimeConflict, setHasTimeConflict] = useState(false);
    const [conflictDetails, setConflictDetails] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Configuration react-hook-form
    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors, isDirty, isValid }
    } = useForm<OperationFormValues>({
        defaultValues: {
            title: initialValues?.title || '',
            description: initialValues?.description || '',
            start: initialValues?.start || format(new Date(), "yyyy-MM-dd'T'HH:mm"),
            duration: initialValues?.duration || 60,
            room: initialValues?.room || '',
            sector: initialValues?.sector || '',
            patient: initialValues?.patient || '',
            anesthesiologists: initialValues?.anesthesiologists || [],
            surgeons: initialValues?.surgeons || [],
            nurses: initialValues?.nurses || [],
            priority: initialValues?.priority || 'NORMAL',
            status: initialValues?.status || 'SCHEDULED',
            requiredEquipment: initialValues?.requiredEquipment || [],
            notes: initialValues?.notes || ''
        },
        mode: 'onChange'
    });

    // Observer les valeurs de watch pour les traitements en temps réel
    const selectedSectorId = watch('sector');
    const selectedRoomId = watch('room');
    const selectedDuration = watch('duration');
    const selectedStart = watch('start');
    const selectedPriority = watch('priority');

    // Effet pour mettre en évidence l'urgence
    const [priorityChangedEffect, setPriorityChangedEffect] = useState(false);
    useEffect(() => {
        if (selectedPriority !== 'NORMAL' && isDirty) {
            setPriorityChangedEffect(true);
            const timer = setTimeout(() => {
                setPriorityChangedEffect(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [selectedPriority, isDirty]);

    // Filtrer les salles en fonction du secteur sélectionné
    const availableRooms = React.useMemo(() => {
        if (!selectedSectorId) return [];
        const sector = sectors.find(s => s.id === selectedSectorId);
        return sector ? sector.rooms.filter(r => r.isAvailable) : [];
    }, [selectedSectorId, sectors]);

    // Filtrer le personnel disponible par rôle
    const availableStaff = React.useMemo(() => {
        const available = staff.filter(s => s.isAvailable);

        return {
            anesthesiologists: available.filter(s => s.role === 'ANESTHESIOLOGIST'),
            surgeons: available.filter(s => s.role === 'SURGEON'),
            nurses: available.filter(s => s.role === 'NURSE')
        };
    }, [staff]);

    // Calculer l'heure de fin en fonction de l'heure de début et de la durée
    const endTime = React.useMemo(() => {
        if (!selectedStart) return '';

        try {
            const startDate = parseISO(selectedStart);
            const endDate = addMinutes(startDate, selectedDuration);
            return format(endDate, 'HH:mm');
        } catch (error) {
            return '';
        }
    }, [selectedStart, selectedDuration]);

    // Mettre à jour le secteur lorsque la salle change
    useEffect(() => {
        if (selectedRoomId) {
            // Rechercher le secteur associé à la salle
            for (const sector of sectors) {
                const room = sector.rooms.find(r => r.id === selectedRoomId);
                if (room) {
                    setValue('sector', sector.id);
                    break;
                }
            }
        }
    }, [selectedRoomId, sectors, setValue]);

    // Vérifier les conflits d'horaire (simulation)
    useEffect(() => {
        if (selectedRoomId && selectedStart && selectedDuration) {
            setIsValidating(true);
            const checkTimeConflicts = async () => {
                try {
                    // Simuler un appel API pour vérifier les conflits
                    await new Promise(resolve => setTimeout(resolve, 800));

                    // Simulation d'un conflit occasionnel pour la démonstration
                    const hasConflict = Math.random() < 0.3;

                    if (hasConflict) {
                        setHasTimeConflict(true);
                        setConflictDetails('Cette salle est déjà réservée à ce slot horaire.');
                    } else {
                        setHasTimeConflict(false);
                        setConflictDetails(null);
                    }
                } catch (error) {
                    logger.error('Erreur lors de la vérification des conflits:', error);
                } finally {
                    setIsValidating(false);
                }
            };

            // Ne vérifier que si les 3 champs sont remplis
            if (selectedRoomId && selectedStart && selectedDuration) {
                const timer = setTimeout(() => {
                    checkTimeConflicts();
                }, 500);

                return () => clearTimeout(timer);
            }
        }
    }, [selectedRoomId, selectedStart, selectedDuration]);

    // Gérer la soumission du formulaire
    const onSubmitForm = useCallback(
        async (data: OperationFormValues) => {
            if (hasTimeConflict) {
                showError('Impossible de planifier l\'opération : conflit horaire détecté');
                return;
            }

            setIsSubmitting(true);
            try {
                // Simuler un délai réseau
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Soumettre les données
                onSubmit(data);

                // Afficher un message de succès
                showSuccess(
                    isEditing
                        ? 'Opération modifiée avec succès'
                        : 'Nouvelle opération planifiée avec succès'
                );
            } catch (error) {
                logger.error('Erreur lors de la soumission du formulaire:', error);
                showError('Une erreur est survenue lors de l\'enregistrement');
            } finally {
                setIsSubmitting(false);
            }
        },
        [onSubmit, isEditing, hasTimeConflict, showSuccess, showError]
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
                {/* Container pour les toasts */}
                <ToastContainer />

                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">
                        {isEditing ? 'Modifier une opération' : 'Planifier une nouvelle opération'}
                    </h2>

                    {/* Afficher un indicateur lorsque le formulaire est modifié */}
                    <AnimatePresence>
                        {isDirty && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full"
                            >
                                Modifications non enregistrées
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Informations de base */}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                            Titre de l'opération *
                        </label>
                        <input
                            id="title"
                            type="text"
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors ${errors.title ? 'border-red-300 bg-red-50' : ''
                                }`}
                            {...register('title', { required: 'Le titre est obligatoire' })}
                        />
                        <AnimatePresence>
                            {errors.title && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-1 text-sm text-red-600"
                                >
                                    {errors.title.message}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            id="description"
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                            {...register('description')}
                        ></textarea>
                    </div>
                </div>

                {/* Date et durée */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <label htmlFor="start" className="block text-sm font-medium text-gray-700 flex items-center">
                            Date et heure de début *
                            <TooltipIcon content="Sélectionnez la date et l'heure de début de l'opération" />
                        </label>
                        <input
                            id="start"
                            type="datetime-local"
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors ${errors.start ? 'border-red-300 bg-red-50' : ''
                                }`}
                            {...register('start', { required: 'La date de début est obligatoire' })}
                        />
                        <AnimatePresence>
                            {errors.start && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-1 text-sm text-red-600"
                                >
                                    {errors.start.message}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 flex items-center">
                            Durée (minutes) *
                            <TooltipIcon content="Par incréments de 15 minutes. Minimum 15, maximum 480 (8h)" />
                        </label>
                        <div className="relative">
                            <input
                                id="duration"
                                type="number"
                                min="15"
                                step="15"
                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors ${errors.duration ? 'border-red-300 bg-red-50' : ''
                                    }`}
                                {...register('duration', {
                                    required: 'La durée est obligatoire',
                                    min: { value: 15, message: 'Minimum 15 minutes' },
                                    max: { value: 480, message: 'Maximum 8 heures' }
                                })}
                            />
                            {isValidating && (
                                <div className="absolute right-2 top-2">
                                    <Spinner size="sm" />
                                </div>
                            )}
                        </div>
                        <AnimatePresence>
                            {errors.duration && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-1 text-sm text-red-600"
                                >
                                    {errors.duration.message}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Heure de fin estimée
                        </label>
                        <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
                            {endTime || '--:--'}
                        </div>
                    </div>
                </div>

                {/* Secteur et salle */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label htmlFor="sector" className="block text-sm font-medium text-gray-700">
                            Secteur *
                        </label>
                        <select
                            id="sector"
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors ${errors.sector ? 'border-red-300 bg-red-50' : ''
                                }`}
                            {...register('sector', { required: 'Le secteur est obligatoire' })}
                        >
                            <option value="">Sélectionnez un secteur</option>
                            {sectors.map(sector => (
                                <option key={sector.id} value={sector.id}>
                                    {sector.name}
                                </option>
                            ))}
                        </select>
                        <AnimatePresence>
                            {errors.sector && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-1 text-sm text-red-600"
                                >
                                    {errors.sector.message}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    <div>
                        <label htmlFor="room" className="block text-sm font-medium text-gray-700 flex items-center">
                            Salle d'opération *
                            <TooltipIcon content="Veuillez d'abord sélectionner un secteur" />
                        </label>
                        <div className="relative">
                            <select
                                id="room"
                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors ${errors.room ? 'border-red-300 bg-red-50' : ''
                                    } ${hasTimeConflict ? 'border-red-300 bg-red-50' : ''}`}
                                {...register('room', { required: 'La salle est obligatoire' })}
                                disabled={!selectedSectorId}
                            >
                                <option value="">Sélectionnez une salle</option>
                                {availableRooms.map(room => (
                                    <option key={room.id} value={room.id}>
                                        {room.name} ({room.capacity} personnes)
                                    </option>
                                ))}
                            </select>
                            {isValidating && (
                                <div className="absolute right-2 top-2">
                                    <Spinner size="sm" />
                                </div>
                            )}
                        </div>
                        <AnimatePresence>
                            {errors.room && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-1 text-sm text-red-600"
                                >
                                    {errors.room.message}
                                </motion.p>
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {hasTimeConflict && conflictDetails && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-1 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200"
                                >
                                    <div className="flex items-start">
                                        <svg className="h-5 w-5 text-red-500 mr-1 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <div className="font-medium">Conflit détecté</div>
                                            <div>{conflictDetails}</div>
                                            <div className="mt-1">
                                                <button
                                                    type="button"
                                                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                                                    onClick={() => {
                                                        // Simuler "Voir détails"
                                                        showInfo('Cette fonctionnalité sera disponible prochainement');
                                                    }}
                                                >
                                                    Voir détails du conflit
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Patient */}
                <div>
                    <label htmlFor="patient" className="block text-sm font-medium text-gray-700">
                        Patient *
                    </label>
                    <select
                        id="patient"
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors ${errors.patient ? 'border-red-300 bg-red-50' : ''
                            }`}
                        {...register('patient', { required: 'Le patient est obligatoire' })}
                    >
                        <option value="">Sélectionnez un patient</option>
                        {patients.map(patient => (
                            <option key={patient.id} value={patient.id}>
                                {patient.lastName} {patient.firstName} ({patient.medicalRecordNumber})
                            </option>
                        ))}
                    </select>
                    <AnimatePresence>
                        {errors.patient && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-1 text-sm text-red-600"
                            >
                                {errors.patient.message}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>

                {/* Personnel */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Personnel</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 flex items-center">
                            Anesthésistes *
                            <HelpTooltip content="Sélectionnez au moins un anesthésiste pour l'opération. Maintenez Ctrl (ou Cmd sur Mac) pour une sélection multiple." />
                        </label>
                        <Controller
                            control={control}
                            name="anesthesiologists"
                            rules={{ required: 'Au moins un anesthésiste est requis' }}
                            render={({ field }) => (
                                <select
                                    multiple
                                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors ${errors.anesthesiologists ? 'border-red-300 bg-red-50' : ''
                                        }`}
                                    value={field.value}
                                    onChange={e => {
                                        const values = Array.from(
                                            e.target.selectedOptions,
                                            option => option.value
                                        );
                                        field.onChange(values);
                                    }}
                                >
                                    {availableStaff.anesthesiologists.map(staff => (
                                        <option key={staff.id} value={staff.id}>
                                            {staff.lastName} {staff.firstName}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                        <AnimatePresence>
                            {errors.anesthesiologists && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-1 text-sm text-red-600"
                                >
                                    {errors.anesthesiologists.message}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 flex items-center">
                            Chirurgiens *
                            <HelpTooltip content="Sélectionnez au moins un chirurgien pour l'opération. Maintenez Ctrl (ou Cmd sur Mac) pour une sélection multiple." />
                        </label>
                        <Controller
                            control={control}
                            name="surgeons"
                            rules={{ required: 'Au moins un chirurgien est requis' }}
                            render={({ field }) => (
                                <select
                                    multiple
                                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors ${errors.surgeons ? 'border-red-300 bg-red-50' : ''
                                        }`}
                                    value={field.value}
                                    onChange={e => {
                                        const values = Array.from(
                                            e.target.selectedOptions,
                                            option => option.value
                                        );
                                        field.onChange(values);
                                    }}
                                >
                                    {availableStaff.surgeons.map(staff => (
                                        <option key={staff.id} value={staff.id}>
                                            {staff.lastName} {staff.firstName}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                        <AnimatePresence>
                            {errors.surgeons && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-1 text-sm text-red-600"
                                >
                                    {errors.surgeons.message}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 flex items-center">
                            Infirmiers/infirmières *
                            <HelpTooltip content="Sélectionnez au moins un infirmier pour l'opération. Maintenez Ctrl (ou Cmd sur Mac) pour une sélection multiple." />
                        </label>
                        <Controller
                            control={control}
                            name="nurses"
                            rules={{ required: 'Au moins un infirmier est requis' }}
                            render={({ field }) => (
                                <select
                                    multiple
                                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors ${errors.nurses ? 'border-red-300 bg-red-50' : ''
                                        }`}
                                    value={field.value}
                                    onChange={e => {
                                        const values = Array.from(
                                            e.target.selectedOptions,
                                            option => option.value
                                        );
                                        field.onChange(values);
                                    }}
                                >
                                    {availableStaff.nurses.map(staff => (
                                        <option key={staff.id} value={staff.id}>
                                            {staff.lastName} {staff.firstName}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                        <AnimatePresence>
                            {errors.nurses && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-1 text-sm text-red-600"
                                >
                                    {errors.nurses.message}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Équipement requis */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 flex items-center">
                        Équipement requis
                        <TooltipIcon content="Sélectionnez l'équipement nécessaire à l'opération" />
                    </label>
                    <Controller
                        control={control}
                        name="requiredEquipment"
                        render={({ field }) => (
                            <select
                                multiple
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                                value={field.value}
                                onChange={e => {
                                    const values = Array.from(
                                        e.target.selectedOptions,
                                        option => option.value
                                    );
                                    field.onChange(values);
                                }}
                            >
                                {selectedRoomId &&
                                    availableRooms
                                        .find(r => r.id === selectedRoomId)
                                        ?.equipment.map((equipment, index) => (
                                            <option key={index} value={equipment}>
                                                {equipment}
                                            </option>
                                        ))}
                            </select>
                        )}
                    />
                </div>

                {/* Priorité et statut */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700 flex items-center">
                            Priorité *
                            <TooltipIcon content="Normale: planification standard. Urgente: à faire rapidement. Urgence vitale: intervention immédiate requise." />
                        </label>
                        <motion.div
                            animate={{
                                scale: priorityChangedEffect ? [1, 1.05, 1] : 1,
                                boxShadow: priorityChangedEffect ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none',
                            }}
                            transition={{ duration: 0.4 }}
                        >
                            <select
                                id="priority"
                                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors ${selectedPriority === 'URGENT' ? 'border-orange-300 bg-orange-50' :
                                        selectedPriority === 'EMERGENCY' ? 'border-red-300 bg-red-50' : ''
                                    } ${errors.priority ? 'border-red-300' : ''}`}
                                {...register('priority', { required: 'La priorité est obligatoire' })}
                            >
                                <option value="NORMAL">Normale</option>
                                <option value="URGENT">Urgente</option>
                                <option value="EMERGENCY">Urgence vitale</option>
                            </select>
                        </motion.div>
                        <AnimatePresence>
                            {errors.priority && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-1 text-sm text-red-600"
                                >
                                    {errors.priority.message}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Statut *
                        </label>
                        <select
                            id="status"
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors ${errors.status ? 'border-red-300 bg-red-50' : ''
                                }`}
                            {...register('status', { required: 'Le statut est obligatoire' })}
                        >
                            <option value="SCHEDULED">Planifiée</option>
                            <option value="IN_PROGRESS">En cours</option>
                            <option value="COMPLETED">Terminée</option>
                            <option value="CANCELLED">Annulée</option>
                        </select>
                        <AnimatePresence>
                            {errors.status && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-1 text-sm text-red-600"
                                >
                                    {errors.status.message}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes supplémentaires
                    </label>
                    <textarea
                        id="notes"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-colors"
                        {...register('notes')}
                    ></textarea>
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-end space-x-3">
                    <Tooltip content="Annuler les modifications" position="top">
                        <button
                            type="button"
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </button>
                    </Tooltip>
                    <Tooltip
                        content={
                            !isValid
                                ? "Veuillez remplir tous les champs obligatoires"
                                : hasTimeConflict
                                    ? "Veuillez résoudre le conflit horaire"
                                    : isEditing
                                        ? "Enregistrer les modifications"
                                        : "Planifier l'opération"
                        }
                        position="top"
                    >
                        <button
                            type="submit"
                            className={`rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${(!isValid || hasTimeConflict)
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            disabled={!isValid || isSubmitting || hasTimeConflict}
                        >
                            {isSubmitting ? (
                                <FormSubmitSpinner label={isEditing ? "Modification en cours..." : "Planification en cours..."} />
                            ) : (
                                isEditing ? 'Modifier' : 'Planifier'
                            )}
                        </button>
                    </Tooltip>
                </div>
            </form>
        </motion.div>
    );
};

export default OperationForm; 