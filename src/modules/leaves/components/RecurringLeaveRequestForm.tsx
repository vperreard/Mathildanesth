import React, { useState, useEffect } from 'react';
import { RecurringLeaveRequest, LeaveType, LeaveStatus, RecurrencePattern, RecurrenceFrequency, RecurrenceEndType } from '../types/leave';
import { RecurrenceForm } from './RecurrenceForm';
import { previewRecurringLeaveOccurrences } from '../services/leaveService';
import Button from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { DatePickerComponent } from '@/components/ui/date-picker';
import Textarea from '@/components/ui/textarea';

interface RecurringLeaveRequestFormProps {
    initialData?: Partial<RecurringLeaveRequest>;
    onSubmit: (data: Partial<RecurringLeaveRequest>) => void;
    onCancel?: () => void;
    isLoading?: boolean;
}

/**
 * Formulaire de création/édition d'une demande de congés récurrente
 */
const RecurringLeaveRequestForm: React.FC<RecurringLeaveRequestFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
    isLoading = false
}) => {
    // État initial du formulaire
    const [formData, setFormData] = useState<Partial<RecurringLeaveRequest>>(
        initialData || {
            isRecurring: true,
            type: LeaveType.ANNUAL,
            status: LeaveStatus.DRAFT,
            patternStartDate: new Date(),
            patternEndDate: new Date(),
            recurrencePattern: {
                frequency: RecurrenceFrequency.WEEKLY,
                interval: 1,
                weekdays: [1], // Lundi par défaut
                endType: RecurrenceEndType.COUNT,
                endCount: 10
            }
        }
    );

    // État pour les occurrences prévisualisées
    const [previewOccurrences, setPreviewOccurrences] = useState<any[]>([]);
    const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    // Erreurs de validation
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Mettre à jour l'état lorsque les données initiales changent
    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    // Fonction pour mettre à jour le state du formulaire
    const handleChange = (field: keyof RecurringLeaveRequest, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Effacer l'erreur de ce champ si elle existe
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Gérer les changements dans le composant RecurrenceForm
    const handleRecurrencePatternChange = (pattern: RecurrencePattern) => {
        setFormData(prev => ({
            ...prev,
            recurrencePattern: pattern
        }));
    };

    // Valider le formulaire avant soumission
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.userId) {
            newErrors.userId = 'L\'utilisateur est requis';
        }

        if (!formData.patternStartDate) {
            newErrors.patternStartDate = 'La date de début est requise';
        }

        if (!formData.patternEndDate) {
            newErrors.patternEndDate = 'La date de fin est requise';
        }

        if (formData.patternStartDate && formData.patternEndDate &&
            formData.patternStartDate > formData.patternEndDate) {
            newErrors.patternEndDate = 'La date de fin doit être postérieure à la date de début';
        }

        // Vérifier que le template de récurrence est valide
        if (!formData.recurrencePattern) {
            newErrors.recurrencePattern = 'Le template de récurrence est requis';
        } else {
            // Validation spécifique selon la fréquence
            if (formData.recurrencePattern.frequency === RecurrenceFrequency.WEEKLY &&
                (!formData.recurrencePattern.weekdays || formData.recurrencePattern.weekdays.length === 0)) {
                newErrors['recurrencePattern.weekdays'] = 'Au moins un jour de la semaine doit être sélectionné';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Soumettre le formulaire
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            onSubmit(formData);
        }
    };

    // Prévisualiser les occurrences
    const handlePreview = async () => {
        if (!validateForm()) {
            return;
        }

        setIsPreviewLoading(true);
        setPreviewError(null);

        try {
            const occurrences = await previewRecurringLeaveOccurrences(formData);
            setPreviewOccurrences(occurrences);
        } catch (error) {
            setPreviewError(error instanceof Error ? error.message : 'Erreur lors de la prévisualisation');
        } finally {
            setIsPreviewLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="recurring-leave-form">
            <div className="form-section">
                <h2>Informations générales</h2>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="leave-type">Type de congé</label>
                        <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                            <SelectTrigger id="leave-type">
                                <SelectValue placeholder="Sélectionnez un type de congé" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={LeaveType.ANNUAL}>Congé annuel</SelectItem>
                                <SelectItem value={LeaveType.RECOVERY}>Récupération</SelectItem>
                                <SelectItem value={LeaveType.TRAINING}>Formation</SelectItem>
                                <SelectItem value={LeaveType.SPECIAL}>Congé spécial</SelectItem>
                                <SelectItem value={LeaveType.UNPAID}>Sans solde</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.type && <div className="error-message">{errors.type}</div>}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="pattern-start-date">Date de début</label>
                        <DatePickerComponent
                            selected={formData.patternStartDate || null}
                            onSelect={(date) => handleChange('patternStartDate', date)}
                            placeholder="Sélectionner une date de début"
                        />
                        {errors.patternStartDate && <div className="error-message">{errors.patternStartDate}</div>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="pattern-end-date">Date de fin</label>
                        <DatePickerComponent
                            selected={formData.patternEndDate || null}
                            onSelect={(date) => handleChange('patternEndDate', date)}
                            placeholder="Sélectionner une date de fin"
                        />
                        {errors.patternEndDate && <div className="error-message">{errors.patternEndDate}</div>}
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="comment">Commentaire</label>
                        <Textarea
                            id="comment"
                            value={formData.comment || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('comment', e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>
            </div>

            <div className="form-section">
                <h2>Configuration de la récurrence</h2>

                {formData.recurrencePattern && (
                    <RecurrenceForm
                        value={formData.recurrencePattern}
                        onChange={handleRecurrencePatternChange}
                        initialStartDate={formData.patternStartDate}
                        hasError={(field) => !!errors[`recurrencePattern.${field}`]}
                        getErrorMessage={(field) => errors[`recurrencePattern.${field}`] || null}
                    />
                )}
            </div>

            {previewError && (
                <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mt-4" role="alert">
                    <p>{previewError}</p>
                </div>
            )}

            {previewOccurrences.length > 0 && (
                <div className="preview-section">
                    <h2>Prévisualisation ({previewOccurrences.length} occurrences)</h2>
                    <div className="occurrences-list">
                        {previewOccurrences.slice(0, 5).map((occurrence, index) => (
                            <div key={index} className="occurrence-item">
                                <span>
                                    {new Date(occurrence.startDate).toLocaleDateString()} - {new Date(occurrence.endDate).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                        {previewOccurrences.length > 5 && (
                            <div className="more-occurrences">
                                +{previewOccurrences.length - 5} autres occurrences
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="form-actions">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handlePreview}
                    disabled={isPreviewLoading}
                >
                    {isPreviewLoading ? 'Chargement...' : 'Prévisualiser'}
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                >
                    Annuler
                </Button>

                <Button
                    type="submit"
                    variant="default"
                    disabled={isLoading}
                >
                    {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
            </div>
        </form>
    );
};

export default RecurringLeaveRequestForm; 