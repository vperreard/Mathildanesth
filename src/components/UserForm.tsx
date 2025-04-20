'use client';

import React, { useState, useEffect, forwardRef, useImperativeHandle, Ref } from 'react';
// Importer les TYPES depuis /types/user
import {
    User, UserFormData, DayOfWeek,
    Role as RoleType, // Renommer pour éviter conflit
    ProfessionalRole as ProfessionalRoleType, // Renommer
    WorkPatternType, WeekType
} from '@/types/user';
// Importer les VALEURS des Enums depuis Prisma pour les valeurs par défaut
import { Role, ProfessionalRole } from '@prisma/client';
import { Eye, EyeOff } from 'lucide-react';

// Interface interne pour l'état du formulaire
interface UserFormState {
    nom: string;
    prenom: string;
    email: string;
    phoneNumber: string;
    login: string;
    role: RoleType; // Utilise le type renommé
    professionalRole: ProfessionalRoleType; // Utilise le type renommé
    tempsPartiel: boolean;
    pourcentageTempsPartiel: string;
    dateEntree: string;
    dateSortie: string;
    actif: boolean;
    password?: string;
    workPattern: WorkPatternType;
    workOnMonthType: WeekType | null;
    joursTravaillesSemainePaire: DayOfWeek[];
    joursTravaillesSemaineImpaire: DayOfWeek[];
}

interface UserFormProps {
    onSubmit: (data: UserFormData) => Promise<void>;
    onCancel: () => void;
    initialData?: User | null;
    isLoading?: boolean;
    // Ajouter la prop pour la ref
    // formRef?: Ref<HTMLFormElement>; // Ne pas utiliser formRef directement comme prop
}

// Helper formatDateForInput
const formatDateForInput = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    try {
        return new Date(date).toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
};

// Valeurs initiales par défaut pour un nouveau formulaire
// Utilise les VALEURS importées de @prisma/client
const defaultInitialState: UserFormState = {
    nom: '', prenom: '', email: '', phoneNumber: '', login: '',
    role: Role.USER, // Valeur Enum Prisma
    professionalRole: ProfessionalRole.MAR, // Valeur Enum Prisma
    tempsPartiel: false, pourcentageTempsPartiel: '',
    dateEntree: '', dateSortie: '', actif: true, password: '',
    workPattern: WorkPatternType.FULL_TIME, // Type local OK
    workOnMonthType: null, // Type local OK
    joursTravaillesSemainePaire: [],
    joursTravaillesSemaineImpaire: [],
};

// Utiliser forwardRef pour passer la ref à l'élément form
const UserForm = forwardRef<HTMLFormElement, UserFormProps>(({ onSubmit, onCancel, initialData, isLoading = false }, ref) => {
    const [formData, setFormData] = useState<UserFormState>(() => {
        if (initialData) {
            // Créer l'état initial à partir de initialData
            return {
                nom: initialData.nom || '',
                prenom: initialData.prenom || '',
                email: initialData.email || '',
                phoneNumber: initialData.phoneNumber || '',
                login: initialData.login || '',
                role: initialData.role, // Le type User a déjà la bonne valeur (string)
                professionalRole: initialData.professionalRole, // Le type User a déjà la bonne valeur (string)
                tempsPartiel: initialData.tempsPartiel || false,
                pourcentageTempsPartiel: initialData.pourcentageTempsPartiel?.toString() || '',
                dateEntree: formatDateForInput(initialData.dateEntree),
                dateSortie: formatDateForInput(initialData.dateSortie),
                actif: initialData.actif !== undefined ? initialData.actif : true,
                password: '',
                workPattern: initialData.workPattern || WorkPatternType.FULL_TIME,
                workOnMonthType: initialData.workOnMonthType || null,
                joursTravaillesSemainePaire: initialData.joursTravaillesSemainePaire || [],
                joursTravaillesSemaineImpaire: initialData.joursTravaillesSemaineImpaire || [],
            };
        }
        return defaultInitialState; // Utiliser l'état par défaut
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditMode = !!initialData?.id;

    useEffect(() => {
        if (initialData) {
            setFormData({
                nom: initialData.nom || '',
                prenom: initialData.prenom || '',
                email: initialData.email || '',
                phoneNumber: initialData.phoneNumber || '',
                login: initialData.login || '',
                role: initialData.role,
                professionalRole: initialData.professionalRole,
                tempsPartiel: initialData.tempsPartiel || false,
                pourcentageTempsPartiel: initialData.pourcentageTempsPartiel?.toString() || '',
                dateEntree: formatDateForInput(initialData.dateEntree),
                dateSortie: formatDateForInput(initialData.dateSortie),
                actif: initialData.actif !== undefined ? initialData.actif : true,
                password: '',
                workPattern: initialData.workPattern || WorkPatternType.FULL_TIME,
                workOnMonthType: initialData.workOnMonthType || null,
                joursTravaillesSemainePaire: initialData.joursTravaillesSemainePaire || [],
                joursTravaillesSemaineImpaire: initialData.joursTravaillesSemaineImpaire || [],
            });
        } else {
            setFormData(defaultInitialState); // Réinitialiser
        }
        setError(null);
    }, [initialData]);

    // Nouvelle fonction pour gérer les changements des checkboxes de jours
    const handleDayChange = (day: DayOfWeek, weekType: 'pair' | 'impair', checked: boolean) => {
        setFormData((prev) => {
            const field = weekType === 'pair' ? 'joursTravaillesSemainePaire' : 'joursTravaillesSemaineImpaire';
            const currentDays = prev[field];
            let newDays: DayOfWeek[];

            if (checked) {
                // Ajouter le jour s'il n'est pas déjà présent
                newDays = currentDays.includes(day) ? currentDays : [...currentDays, day];
            } else {
                // Retirer le jour
                newDays = currentDays.filter(d => d !== day);
            }

            // Optionnel: trier les jours pour la cohérence
            // newDays.sort(); 

            return { ...prev, [field]: newDays };
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            // Ne pas traiter les checkboxes de jours ici, elles utilisent handleDayChange
            if (name.startsWith('day-')) return;

            const { checked } = e.target as HTMLInputElement;
            setFormData((prev): UserFormState => {
                // Actions spéciales pour la checkbox tempsPartiel
                if (name === 'tempsPartiel') {
                    if (!checked) {
                        // Réinitialise les champs liés au temps partiel, y compris les nouveaux
                        return {
                            ...prev,
                            tempsPartiel: false,
                            pourcentageTempsPartiel: '',
                            joursTravaillesSemainePaire: [], // Réinitialiser
                            joursTravaillesSemaineImpaire: [], // Réinitialiser
                            workPattern: WorkPatternType.FULL_TIME,
                            workOnMonthType: null,
                        };
                    } else {
                        // Active temps partiel
                        return {
                            ...prev,
                            tempsPartiel: true,
                            // On ne change plus workPattern ici, l'utilisateur choisira
                        };
                    }
                }
                // Gestion standard des autres checkboxes (ex: actif)
                return { ...prev, [name]: checked };
            });
        } else {
            // Gestion des inputs/selects
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        if (!formData.nom || !formData.prenom || !formData.email || /*!formData.login ||*/ !formData.role || !formData.professionalRole) {
            setError('Veuillez remplir tous les champs obligatoires (marqués d\'une *).');
            return;
        }
        // Le login n'est pas dans le formulaire en mode édition, ne pas valider ici
        if (!isEditMode && !formData.login) {
            setError('Le login est obligatoire pour la création.');
            return;
        }
        if (formData.tempsPartiel && !formData.pourcentageTempsPartiel) {
            setError('Le pourcentage est requis si \"Temps partiel\" est coché.');
            return;
        }
        if (!isEditMode && !formData.password) {
            setError('Le mot de passe est obligatoire pour la création.');
            return;
        }
        if (formData.password && formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }

        // Préparer les données à envoyer en utilisant le type UserFormData
        const dataToSend: UserFormData = {
            nom: formData.nom,
            prenom: formData.prenom,
            email: formData.email,
            phoneNumber: formData.phoneNumber || null,
            role: formData.role,
            professionalRole: formData.professionalRole,
            tempsPartiel: formData.tempsPartiel,
            pourcentageTempsPartiel: formData.tempsPartiel ? (parseFloat(formData.pourcentageTempsPartiel) || null) : null,
            dateEntree: formData.dateEntree || null, // Envoyer comme string ou null
            dateSortie: formData.dateSortie || null, // Envoyer comme string ou null
            actif: formData.actif,
            workPattern: formData.workPattern,
            workOnMonthType: formData.tempsPartiel ? formData.workOnMonthType : null,
            // Envoyer les tableaux de jours
            joursTravaillesSemainePaire: formData.joursTravaillesSemainePaire,
            joursTravaillesSemaineImpaire: formData.joursTravaillesSemaineImpaire,
            // Inclure le mot de passe seulement s'il est renseigné
            ...(formData.password && { password: formData.password }),
            // Inclure login et alias si présents (non modifiables via ce formulaire directement)
            ...(formData.login && { login: formData.login }),
            // alias: formData.alias || null, // Alias n'est pas dans le state UserFormState
        };

        console.log("Data to send:", dataToSend); // Log pour débogage

        try {
            await onSubmit(dataToSend);
        } catch (err: any) {
            console.error("Form submission error:", err);
            setError(err.message || 'Une erreur est survenue lors de la soumission.');
        }
    };

    // Exposer des méthodes si nécessaire via useImperativeHandle (optionnel)
    // useImperativeHandle(ref, () => ({ ... }));

    return (
        // Attacher la ref à l'élément form
        <form ref={ref} onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow mb-8">
            {/* Titre conditionnel */}
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
                {isEditMode ? `Modifier le profil de ${initialData?.prenom} ${initialData?.nom}` : 'Créer un nouvel utilisateur'}
            </h2>

            {error && <p className="text-red-500 text-sm font-medium mb-4 p-3 bg-red-50 border border-red-200 rounded-md">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="nom" className="block text-sm font-medium text-gray-700">Nom *</label>
                        <input
                            type="text"
                            id="nom"
                            name="nom"
                            value={formData.nom}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">Prénom *</label>
                        <input
                            type="text"
                            id="prenom"
                            name="prenom"
                            value={formData.prenom}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Téléphone</label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Optionnel"
                        />
                    </div>
                    <div>
                        <label htmlFor="login" className="block text-sm font-medium text-gray-700">Login *</label>
                        <input
                            type="text"
                            id="login"
                            name="login"
                            value={formData.login}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Rôle d'accès *</label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="professionalRole" className="block text-sm font-medium text-gray-700">Rôle Professionnel *</label>
                        <select
                            id="professionalRole"
                            name="professionalRole"
                            value={formData.professionalRole}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            {Object.values(ProfessionalRole).map(pr => <option key={pr} value={pr}>{pr}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            {isEditMode ? 'Nouveau Mot de Passe (laisser vide pour ne pas changer)' : 'Mot de Passe *'}
                        </label>
                        <div className="relative mt-1">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={formData.password || ''}
                                onChange={handleChange}
                                required={!isEditMode}
                                minLength={6}
                                className="block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <hr className="my-6" />

            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Détails administratifs</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="flex items-center">
                        <input
                            id="actif"
                            name="actif"
                            type="checkbox"
                            checked={formData.actif}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="actif" className="ml-2 block text-sm font-medium text-gray-900">Compte Actif</label>
                    </div>
                    <div className="flex items-center">
                        <input
                            id="tempsPartiel"
                            name="tempsPartiel"
                            type="checkbox"
                            checked={formData.tempsPartiel}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="tempsPartiel" className="ml-2 block text-sm text-gray-900">Temps Partiel</label>
                    </div>

                    {formData.tempsPartiel && (
                        <div>
                            <label htmlFor="pourcentageTempsPartiel" className="block text-sm font-medium text-gray-700">Pourcentage (%)</label>
                            <input
                                type="number"
                                id="pourcentageTempsPartiel"
                                name="pourcentageTempsPartiel"
                                value={formData.pourcentageTempsPartiel}
                                onChange={handleChange}
                                step="10"
                                min="0"
                                max="100"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    )}

                    {formData.tempsPartiel && (
                        <div>
                            <label htmlFor="workPattern" className="block text-sm font-medium text-gray-700">Configuration du temps partiel</label>
                            <select
                                id="workPattern"
                                name="workPattern"
                                value={formData.workPattern}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value={WorkPatternType.FULL_TIME}>Temps plein (5j/semaine)</option>
                                <option value={WorkPatternType.SPECIFIC_DAYS}>Jours spécifiques</option>
                            </select>
                        </div>
                    )}

                    {formData.tempsPartiel && (formData.workPattern === WorkPatternType.SPECIFIC_DAYS) && (
                        <div>
                            <label htmlFor="workOnMonthType" className="block text-sm font-medium text-gray-700">Travaille les mois</label>
                            <select
                                id="workOnMonthType"
                                name="workOnMonthType"
                                value={formData.workOnMonthType || WeekType.ALL}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value={WeekType.EVEN}>Pairs (février, avril...)</option>
                                <option value={WeekType.ODD}>Impairs (janvier, mars...)</option>
                                <option value={WeekType.ALL}>Tous</option>
                            </select>
                        </div>
                    )}

                    {formData.tempsPartiel && (
                        <div className="col-span-6 border-t pt-4 mt-4">
                            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Configuration Temps Partiel</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Jours travaillés (Semaines Paires)
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {Object.values(DayOfWeek).map((day) => (
                                        <div key={`pair-${day}`} className="flex items-center">
                                            <input
                                                id={`day-pair-${day}`}
                                                name={`day-pair-${day}`}
                                                type="checkbox"
                                                checked={formData.joursTravaillesSemainePaire.includes(day)}
                                                onChange={(e) => handleDayChange(day, 'pair', e.target.checked)}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor={`day-pair-${day}`} className="ml-2 block text-sm text-gray-900 capitalize">
                                                {day.toLowerCase()}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Jours travaillés (Semaines Impaires)
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {Object.values(DayOfWeek).map((day) => (
                                        <div key={`impair-${day}`} className="flex items-center">
                                            <input
                                                id={`day-impair-${day}`}
                                                name={`day-impair-${day}`}
                                                type="checkbox"
                                                checked={formData.joursTravaillesSemaineImpaire.includes(day)}
                                                onChange={(e) => handleDayChange(day, 'impair', e.target.checked)}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor={`day-impair-${day}`} className="ml-2 block text-sm text-gray-900 capitalize">
                                                {day.toLowerCase()}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="dateEntree" className="block text-sm font-medium text-gray-700">Date d'entrée</label>
                        <input
                            type="date"
                            id="dateEntree"
                            name="dateEntree"
                            value={formData.dateEntree}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="dateSortie" className="block text-sm font-medium text-gray-700">Date de sortie</label>
                        <input
                            type="date"
                            id="dateSortie"
                            name="dateSortie"
                            value={formData.dateSortie}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md shadow-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                    {isLoading
                        ? (isEditMode ? 'Enregistrement...' : 'Création...')
                        : 'Enregistrer'}
                </button>
            </div>
        </form>
    );
});

UserForm.displayName = 'UserForm'; // Ajouter displayName pour le HOC forwardRef

export default UserForm; 