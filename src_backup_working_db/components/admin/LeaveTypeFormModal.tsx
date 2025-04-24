'use client';

import React, { useState, useEffect } from 'react';
// Importer les types nécessaires (ajuster les chemins si besoin)
import { LeaveTypeSetting, Prisma, ProfessionalRole, Role as AdminRole } from '@prisma/client';

// --- Constantes et Types ---
const ALL_ROLES: ProfessionalRole[] = [ProfessionalRole.MAR, ProfessionalRole.IADE, ProfessionalRole.SECRETAIRE];
const ADMIN_ROLES: AdminRole[] = [AdminRole.ADMIN_TOTAL, AdminRole.ADMIN_PARTIEL];
const COUNTING_METHODS = [
    { value: 'WEEKDAYS_IF_WORKING', label: 'Jours Ouvrés (Lu-Ve, si travaillé)' },
    { value: 'MONDAY_TO_SATURDAY', label: 'Jours Ouvrés (Lu-Sa)' },
    { value: 'CONTINUOUS_ALL_DAYS', label: 'Jours Calendaires Continus' },
    { value: 'NONE', label: 'Non Décompté' },
];

// Props du composant
interface LeaveTypeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData: Partial<LeaveTypeSetting> | null;
}

// Type pour les données du formulaire (incluant les règles décomposées)
type FormData = {
    code: string;
    label: string;
    description: string;
    isActive: boolean;
    isUserSelectable: boolean;
    // --- Règles décomposées ---
    // Counting
    counting_method: string;
    counting_excludePublicHolidays: boolean;
    // Balance
    balance_deducts: boolean;
    // Balance - Annual Specific (seulement si code commence par ANNUAL)
    balance_annual_enabled: boolean; // Pour afficher/masquer la section
    balance_annual_defaultDays_MAR: number;
    balance_annual_defaultDays_IADE: number;
    balance_annual_defaultDays_SECRETAIRE: number;
    balance_annual_seniorityBonus_enabled: boolean;
    balance_annual_seniorityBonus_yearsRequired: number;
    balance_annual_seniorityBonus_bonusDaysPerThreshold: number;
    balance_annual_seniorityBonus_maxBonusDays: number;
    balance_annual_seniorityBonus_applicableRoles: ProfessionalRole[];
    // Eligibility
    eligibility_roles: ProfessionalRole[] | null; // null signifie tous
    eligibility_minSeniorityMonths: number;
    // Request
    request_minNoticeDays: number;
    request_requiresReason: boolean;
    request_allowHalfDays: boolean;
    // Approval
    approval_autoApprove: boolean;
    approval_requiredRole: AdminRole | ''; // Rôle admin requis si pas auto
    // Conflicts
    conflicts_checkMaxOverlap: boolean;
    conflicts_maxOverlapSameRole: number;
};

// Valeurs par défaut pour un nouveau type
const getDefaultFormData = (): FormData => ({
    code: '', label: '', description: '', isActive: true, isUserSelectable: true,
    // Règles par défaut
    counting_method: 'WEEKDAYS_IF_WORKING', counting_excludePublicHolidays: true,
    balance_deducts: true,
    balance_annual_enabled: false, balance_annual_defaultDays_MAR: 0, balance_annual_defaultDays_IADE: 0, balance_annual_defaultDays_SECRETAIRE: 0,
    balance_annual_seniorityBonus_enabled: false, balance_annual_seniorityBonus_yearsRequired: 0, balance_annual_seniorityBonus_bonusDaysPerThreshold: 0, balance_annual_seniorityBonus_maxBonusDays: 0, balance_annual_seniorityBonus_applicableRoles: [],
    eligibility_roles: null, eligibility_minSeniorityMonths: 0,
    request_minNoticeDays: 0, request_requiresReason: false, request_allowHalfDays: false,
    approval_autoApprove: false, approval_requiredRole: '',
    conflicts_checkMaxOverlap: false, conflicts_maxOverlapSameRole: 1,
});


export default function LeaveTypeFormModal({ isOpen, onClose, onSuccess, initialData }: LeaveTypeFormModalProps) {
    const [formData, setFormData] = useState<FormData>(getDefaultFormData());
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const isEditing = !!initialData?.id;

    // Pré-remplir/Réinitialiser le formulaire
    useEffect(() => {
        if (isOpen) {
            if (isEditing && initialData) {
                const rules = (initialData.rules as any) ?? {}; // Utiliser any temporairement pour accès flexible
                const counting = rules.counting ?? {};
                const balance = rules.balance ?? {};
                const annual = balance.annualAllowance ?? {};
                const seniority = annual.seniorityBonus ?? {};
                const eligibility = rules.eligibility ?? {};
                const request = rules.request ?? {};
                const approval = rules.approval ?? {};
                const conflicts = rules.conflicts ?? {};

                setFormData({
                    code: initialData.code || '',
                    label: initialData.label || '',
                    description: initialData.description || '',
                    isActive: initialData.isActive ?? true,
                    isUserSelectable: initialData.isUserSelectable ?? true,
                    // --- Règles ---
                    counting_method: counting.method || 'WEEKDAYS_IF_WORKING',
                    counting_excludePublicHolidays: counting.excludePublicHolidays ?? true,
                    balance_deducts: balance.deducts ?? true,
                    balance_annual_enabled: !!balance.annualAllowance, // Déduit de la présence de l'objet
                    balance_annual_defaultDays_MAR: annual.defaultDaysByRole?.MAR ?? 0,
                    balance_annual_defaultDays_IADE: annual.defaultDaysByRole?.IADE ?? 0,
                    balance_annual_defaultDays_SECRETAIRE: annual.defaultDaysByRole?.SECRETAIRE ?? 0,
                    balance_annual_seniorityBonus_enabled: seniority.enabled ?? false,
                    balance_annual_seniorityBonus_yearsRequired: seniority.yearsRequired ?? 0,
                    balance_annual_seniorityBonus_bonusDaysPerThreshold: seniority.bonusDaysPerThreshold ?? 0,
                    balance_annual_seniorityBonus_maxBonusDays: seniority.maxBonusDays ?? 0,
                    balance_annual_seniorityBonus_applicableRoles: seniority.applicableRoles ?? [],
                    eligibility_roles: eligibility.roles === undefined ? null : eligibility.roles, // Gérer null explicitement vs undefined
                    eligibility_minSeniorityMonths: eligibility.minSeniorityMonths ?? 0,
                    request_minNoticeDays: request.minNoticeDays ?? 0,
                    request_requiresReason: request.requiresReason ?? false,
                    request_allowHalfDays: request.allowHalfDays ?? false,
                    approval_autoApprove: approval.autoApprove ?? false,
                    approval_requiredRole: approval.requiredRole ?? '',
                    conflicts_checkMaxOverlap: conflicts.checkMaxOverlap ?? false,
                    conflicts_maxOverlapSameRole: conflicts.maxOverlapSameRole ?? 1,
                });
            } else {
                // Réinitialiser pour l'ajout
                setFormData(getDefaultFormData());
            }
        }
        setError(null); // Toujours effacer l'erreur à l'ouverture/changement
    }, [initialData, isEditing, isOpen]);

    // Handler générique pour la plupart des champs
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: value === '' ? 0 : parseInt(value, 10) })); // Gérer champ vide
        }
        else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Gérer la visibilité des champs liés à l'approbation manuelle
        if (name === 'approval_autoApprove' && (e.target as HTMLInputElement).checked) {
            setFormData(prev => ({ ...prev, approval_requiredRole: '' })); // Effacer si autoApprove
        }
        // Gérer la visibilité des champs liés aux conflits
        if (name === 'conflicts_checkMaxOverlap' && !(e.target as HTMLInputElement).checked) {
            setFormData(prev => ({ ...prev, conflicts_maxOverlapSameRole: 1 })); // Reset si check désactivé
        }
    };

    // Handler spécifique pour les checkboxes de rôles (multi-sélection)
    const handleRoleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof FormData) => {
        const { value, checked } = e.target;
        const role = value as ProfessionalRole; // ou AdminRole selon le champ
        const currentRoles = formData[fieldName] as ProfessionalRole[] | null; // Peut être null pour eligibility_roles

        let updatedRoles: ProfessionalRole[] | null = null; // Initialiser à null

        if (fieldName === 'eligibility_roles') {
            const allPossibleRoles = ALL_ROLES; // Utiliser ALL_ROLES pour éligibilité

            if (checked) {
                // Ajouter le rôle coché
                if (currentRoles === null) {
                    // Si on coche alors que "tous" est sélectionné, cela n'a pas de sens, on reste à "tous".
                    updatedRoles = null;
                } else {
                    // Ajouter le rôle à la liste existante
                    const rolesSet = new Set(currentRoles);
                    rolesSet.add(role);
                    updatedRoles = Array.from(rolesSet);
                    // Si tous les rôles sont maintenant cochés, repasser à null (signifie "tous")
                    if (updatedRoles.length === allPossibleRoles.length) {
                        updatedRoles = null;
                    }
                }
            } else {
                // Retirer le rôle décoché
                if (currentRoles === null) {
                    // Si on décoche depuis l'état "tous", sélectionner explicitement tous les *autres* rôles.
                    updatedRoles = allPossibleRoles.filter(r => r !== role);
                } else {
                    // Si on décoche depuis une sélection partielle, retirer simplement le rôle.
                    updatedRoles = currentRoles.filter(r => r !== role);
                    // Si la liste devient vide après avoir décoché, cela signifie qu'aucun rôle spécifique n'est sélectionné.
                    // Selon notre convention (null = tous), une liste vide n'a pas de sens ici. 
                    // On pourrait soit interdire de tout décocher, soit revenir à null (tous).
                    // Pour l'instant, on laisse la possibilité d'avoir un tableau vide (signifiant aucun rôle éligible dans ce cas).
                    // ATTENTION: vérifier si la logique backend interprète bien [] comme "aucun" et null comme "tous".
                    // Si on veut que décocher la dernière case = revenir à null (tous), décommenter la ligne suivante :
                    // if (updatedRoles.length === 0) { updatedRoles = null; }
                }
            }
        } else if (fieldName === 'balance_annual_seniorityBonus_applicableRoles') {
            // Logique pour les rôles du bonus (ne peut pas être null, commence par [])
            const currentBonusRoles = formData.balance_annual_seniorityBonus_applicableRoles ?? [];
            if (checked) {
                // Utiliser un Set pour éviter les doublons si jamais
                const rolesSet = new Set(currentBonusRoles);
                rolesSet.add(role as ProfessionalRole);
                updatedRoles = Array.from(rolesSet);
            } else {
                updatedRoles = currentBonusRoles.filter(r => r !== role);
            }
        }

        // Mettre à jour l'état
        setFormData(prev => ({ ...prev, [fieldName]: updatedRoles }));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // --- Reconstruire l'objet rules ---
        const rules: any = { // Utiliser any pour construction flexible
            counting: {
                method: formData.counting_method,
                excludePublicHolidays: formData.counting_excludePublicHolidays
            },
            balance: {
                deducts: formData.balance_deducts,
                sourceTypeCode: formData.code.startsWith("RECOVERY") ? formData.code : null // Logique simple pour sourceTypeCode
            },
            eligibility: {
                roles: formData.eligibility_roles, // null signifie tous
                minSeniorityMonths: formData.eligibility_minSeniorityMonths
            },
            request: {
                minNoticeDays: formData.request_minNoticeDays,
                requiresReason: formData.request_requiresReason,
                allowHalfDays: formData.request_allowHalfDays
            },
            approval: {
                autoApprove: formData.approval_autoApprove,
                requiredRole: !formData.approval_autoApprove ? formData.approval_requiredRole || undefined : undefined // Seulement si pas autoApprove
            },
            conflicts: {
                checkMaxOverlap: formData.conflicts_checkMaxOverlap,
                maxOverlapSameRole: formData.conflicts_checkMaxOverlap ? formData.conflicts_maxOverlapSameRole : undefined // Seulement si checkMaxOverlap
            }
        };

        // Ajouter la section annualAllowance seulement si nécessaire
        if (formData.code.startsWith('ANNUAL')) { // Ou utiliser formData.balance_annual_enabled
            rules.balance.annualAllowance = {
                defaultDaysByRole: {
                    MAR: formData.balance_annual_defaultDays_MAR,
                    IADE: formData.balance_annual_defaultDays_IADE,
                    SECRETAIRE: formData.balance_annual_defaultDays_SECRETAIRE
                },
                seniorityBonus: {
                    enabled: formData.balance_annual_seniorityBonus_enabled,
                    yearsRequired: formData.balance_annual_seniorityBonus_enabled ? formData.balance_annual_seniorityBonus_yearsRequired : undefined,
                    bonusDaysPerThreshold: formData.balance_annual_seniorityBonus_enabled ? formData.balance_annual_seniorityBonus_bonusDaysPerThreshold : undefined,
                    maxBonusDays: formData.balance_annual_seniorityBonus_enabled ? formData.balance_annual_seniorityBonus_maxBonusDays : undefined,
                    applicableRoles: formData.balance_annual_seniorityBonus_enabled ? formData.balance_annual_seniorityBonus_applicableRoles : undefined,
                }
            };
        }
        // --- Fin reconstruction rules ---


        const apiUrl = isEditing ? `/api/admin/leave-types/${initialData?.id}` : '/api/admin/leave-types';
        const method = isEditing ? 'PUT' : 'POST';

        let bodyToSend: any;
        if (isEditing) {
            bodyToSend = {
                label: formData.label,
                description: formData.description,
                isActive: formData.isActive,
                isUserSelectable: formData.isUserSelectable,
                rules: rules // Envoyer l'objet rules reconstruit
            };
        } else {
            bodyToSend = {
                code: formData.code, // Inclure le code pour la création
                label: formData.label,
                description: formData.description,
                isActive: formData.isActive,
                isUserSelectable: formData.isUserSelectable,
                rules: rules
            };
        }

        try {
            const response = await fetch(apiUrl, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
            }

            alert(`Type de congé ${isEditing ? 'mis à jour' : 'créé'} avec succès !`);
            onSuccess();

        } catch (err: any) {
            console.error("Erreur lors de la soumission:", err);
            setError(err.message || `Une erreur est survenue.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // --- Rendu JSX --- 
    return (
        // Backdrop:
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex', /* alignItems: 'center', // Retiré */ justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem 0' // Ajout padding vertical pour l'espacement
            // overflowY: 'auto' // Retiré du backdrop
        }}>
            {/* Conteneur du Modal Blanc: */}
            <div style={{
                background: 'white', padding: '2rem',
                borderRadius: '8px', width: '90%', maxWidth: '600px',
                overflowY: 'auto', // Ajout du scroll sur le modal lui-même
                maxHeight: '90vh' // Limite la hauteur à 90% de la vue
            }}>
                <h2 className="text-xl font-bold mb-6">{isEditing ? 'Modifier le Type de Congé' : 'Ajouter un Type de Congé'}</h2>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* --- Informations Générales --- */}
                    <fieldset className="space-y-4 border p-4 rounded">
                        <legend className="text-lg font-medium px-1">Informations Générales</legend>
                        {/* Code (non modifiable en édition) */}
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-gray-700">Code <span className="text-red-500">*</span></label>
                            <input type="text" id="code" name="code" value={formData.code} onChange={handleChange} required disabled={isEditing}
                                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 sm:text-sm ${isEditing ? 'bg-gray-100' : 'border-gray-300'}`}
                                pattern="[A-Z0-9_]+" title="Majuscules, chiffres, underscores (_)." />
                            {!isEditing && <p className="text-xs text-gray-500 mt-1">Identifiant unique (ANNUAL_MAR, SICK...). Non modifiable.</p>}
                        </div>
                        {/* Libellé */}
                        <div>
                            <label htmlFor="label" className="block text-sm font-medium text-gray-700">Libellé <span className="text-red-500">*</span></label>
                            <input type="text" id="label" name="label" value={formData.label} onChange={handleChange} required
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm" />
                            <p className="text-xs text-gray-500 mt-1">Nom affiché.</p>
                        </div>
                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea id="description" name="description" rows={2} value={formData.description} onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm" />
                        </div>
                        {/* Checkboxes Actif / Sélectionnable */}
                        <div className="flex space-x-4">
                            <div className="flex items-center">
                                <input id="isActive" name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Actif</label>
                            </div>
                            <div className="flex items-center">
                                <input id="isUserSelectable" name="isUserSelectable" type="checkbox" checked={formData.isUserSelectable} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                                <label htmlFor="isUserSelectable" className="ml-2 block text-sm text-gray-900">Sélectionnable par l'utilisateur</label>
                            </div>
                        </div>
                    </fieldset>

                    {/* --- Règles de Décompte --- */}
                    <fieldset className="space-y-4 border p-4 rounded">
                        <legend className="text-lg font-medium px-1">Règles de Décompte</legend>
                        <div>
                            <label htmlFor="counting_method" className="block text-sm font-medium text-gray-700">Méthode de décompte</label>
                            <select id="counting_method" name="counting_method" value={formData.counting_method} onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm">
                                {COUNTING_METHODS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center">
                            <input id="counting_excludePublicHolidays" name="counting_excludePublicHolidays" type="checkbox" checked={formData.counting_excludePublicHolidays} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                            <label htmlFor="counting_excludePublicHolidays" className="ml-2 block text-sm text-gray-900">Exclure les jours fériés du décompte</label>
                        </div>
                    </fieldset>

                    {/* --- Règles de Solde --- */}
                    <fieldset className="space-y-4 border p-4 rounded">
                        <legend className="text-lg font-medium px-1">Règles de Solde</legend>
                        <div className="flex items-center">
                            <input id="balance_deducts" name="balance_deducts" type="checkbox" checked={formData.balance_deducts} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                            <label htmlFor="balance_deducts" className="ml-2 block text-sm text-gray-900">Ce congé déduit d'un solde</label>
                        </div>

                        {/* Section Spécifique Annuel (Conditionnelle) */}
                        {formData.code.startsWith('ANNUAL') && (
                            <div className="border-t pt-4 mt-4 space-y-4">
                                <p className="text-sm font-medium text-gray-600">Configuration Solde Annuel</p>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Jours annuels par défaut par rôle</label>
                                    <div className="grid grid-cols-3 gap-2 mt-1">
                                        <div><label htmlFor="balance_annual_defaultDays_MAR" className="text-xs">MAR</label><input type="number" id="balance_annual_defaultDays_MAR" name="balance_annual_defaultDays_MAR" value={formData.balance_annual_defaultDays_MAR} onChange={handleChange} className="w-full border-gray-300 rounded-md sm:text-sm" /></div>
                                        <div><label htmlFor="balance_annual_defaultDays_IADE" className="text-xs">IADE</label><input type="number" id="balance_annual_defaultDays_IADE" name="balance_annual_defaultDays_IADE" value={formData.balance_annual_defaultDays_IADE} onChange={handleChange} className="w-full border-gray-300 rounded-md sm:text-sm" /></div>
                                        <div><label htmlFor="balance_annual_defaultDays_SECRETAIRE" className="text-xs">SEC</label><input type="number" id="balance_annual_defaultDays_SECRETAIRE" name="balance_annual_defaultDays_SECRETAIRE" value={formData.balance_annual_defaultDays_SECRETAIRE} onChange={handleChange} className="w-full border-gray-300 rounded-md sm:text-sm" /></div>
                                    </div>
                                </div>
                                {/* Bonus Ancienneté */}
                                <div className="flex items-center pt-2">
                                    <input id="balance_annual_seniorityBonus_enabled" name="balance_annual_seniorityBonus_enabled" type="checkbox" checked={formData.balance_annual_seniorityBonus_enabled} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                                    <label htmlFor="balance_annual_seniorityBonus_enabled" className="ml-2 block text-sm font-medium text-gray-900">Activer Bonus Ancienneté</label>
                                </div>
                                {formData.balance_annual_seniorityBonus_enabled && (
                                    <div className="pl-6 space-y-3 border-l ml-2">
                                        <div className="grid grid-cols-3 gap-2">
                                            <div><label htmlFor="balance_annual_seniorityBonus_yearsRequired" className="text-xs">Années Req.</label><input type="number" id="balance_annual_seniorityBonus_yearsRequired" name="balance_annual_seniorityBonus_yearsRequired" value={formData.balance_annual_seniorityBonus_yearsRequired} onChange={handleChange} className="w-full border-gray-300 rounded-md sm:text-sm" /></div>
                                            <div><label htmlFor="balance_annual_seniorityBonus_bonusDaysPerThreshold" className="text-xs">Jours / Palier</label><input type="number" id="balance_annual_seniorityBonus_bonusDaysPerThreshold" name="balance_annual_seniorityBonus_bonusDaysPerThreshold" value={formData.balance_annual_seniorityBonus_bonusDaysPerThreshold} onChange={handleChange} className="w-full border-gray-300 rounded-md sm:text-sm" /></div>
                                            <div><label htmlFor="balance_annual_seniorityBonus_maxBonusDays" className="text-xs">Bonus Max</label><input type="number" id="balance_annual_seniorityBonus_maxBonusDays" name="balance_annual_seniorityBonus_maxBonusDays" value={formData.balance_annual_seniorityBonus_maxBonusDays} onChange={handleChange} className="w-full border-gray-300 rounded-md sm:text-sm" /></div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Rôles concernés par le bonus</label>
                                            <div className="flex space-x-4">
                                                {[ProfessionalRole.IADE, ProfessionalRole.SECRETAIRE].map(role => (
                                                    <div key={role} className="flex items-center">
                                                        <input type="checkbox" id={`bonusRole_${role}`} name="balance_annual_seniorityBonus_applicableRoles" value={role}
                                                            checked={formData.balance_annual_seniorityBonus_applicableRoles.includes(role)}
                                                            onChange={(e) => handleRoleCheckboxChange(e, 'balance_annual_seniorityBonus_applicableRoles')}
                                                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                                                        <label htmlFor={`bonusRole_${role}`} className="ml-2 text-sm text-gray-600">{role}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </fieldset>


                    {/* --- Règles d'Éligibilité --- */}
                    <fieldset className="space-y-4 border p-4 rounded">
                        <legend className="text-lg font-medium px-1">Éligibilité</legend>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rôles autorisés à demander</label>
                            <div className="flex space-x-4">
                                {ALL_ROLES.map(role => (
                                    <div key={role} className="flex items-center">
                                        <input type="checkbox" id={`eligRole_${role}`} name="eligibility_roles" value={role}
                                            checked={formData.eligibility_roles === null || formData.eligibility_roles.includes(role)}
                                            onChange={(e) => handleRoleCheckboxChange(e, 'eligibility_roles')}
                                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                                        <label htmlFor={`eligRole_${role}`} className="ml-2 text-sm text-gray-600">{role}</label>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Si aucune case n'est cochée, tous les rôles sont autorisés.</p>
                        </div>
                        <div>
                            <label htmlFor="eligibility_minSeniorityMonths" className="block text-sm font-medium text-gray-700">Ancienneté minimale requise (mois)</label>
                            <input type="number" id="eligibility_minSeniorityMonths" name="eligibility_minSeniorityMonths" value={formData.eligibility_minSeniorityMonths} onChange={handleChange} min="0"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm" />
                        </div>
                    </fieldset>

                    {/* --- Règles de Demande --- */}
                    <fieldset className="space-y-4 border p-4 rounded">
                        <legend className="text-lg font-medium px-1">Règles de Demande</legend>
                        <div>
                            <label htmlFor="request_minNoticeDays" className="block text-sm font-medium text-gray-700">Délai de prévenance minimum (jours)</label>
                            <input type="number" id="request_minNoticeDays" name="request_minNoticeDays" value={formData.request_minNoticeDays} onChange={handleChange} min="0"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm" />
                        </div>
                        <div className="flex space-x-4">
                            <div className="flex items-center">
                                <input id="request_requiresReason" name="request_requiresReason" type="checkbox" checked={formData.request_requiresReason} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                                <label htmlFor="request_requiresReason" className="ml-2 block text-sm text-gray-900">Motif obligatoire</label>
                            </div>
                            <div className="flex items-center">
                                <input id="request_allowHalfDays" name="request_allowHalfDays" type="checkbox" checked={formData.request_allowHalfDays} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                                <label htmlFor="request_allowHalfDays" className="ml-2 block text-sm text-gray-900">Autoriser les demi-journées</label>
                            </div>
                        </div>
                    </fieldset>


                    {/* --- Règles d'Approbation --- */}
                    <fieldset className="space-y-4 border p-4 rounded">
                        <legend className="text-lg font-medium px-1">Approbation</legend>
                        <div className="flex items-center">
                            <input id="approval_autoApprove" name="approval_autoApprove" type="checkbox" checked={formData.approval_autoApprove} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                            <label htmlFor="approval_autoApprove" className="ml-2 block text-sm text-gray-900">Approbation Automatique</label>
                        </div>
                        {!formData.approval_autoApprove && (
                            <div>
                                <label htmlFor="approval_requiredRole" className="block text-sm font-medium text-gray-700">Rôle requis pour approbation manuelle</label>
                                <select id="approval_requiredRole" name="approval_requiredRole" value={formData.approval_requiredRole} onChange={handleChange}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm">
                                    <option value="">-- Sélectionner un rôle --</option>
                                    {ADMIN_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                                </select>
                            </div>
                        )}
                    </fieldset>

                    {/* --- Règles de Conflits --- */}
                    <fieldset className="space-y-4 border p-4 rounded">
                        <legend className="text-lg font-medium px-1">Conflits d'effectif</legend>
                        <div className="flex items-center">
                            <input id="conflicts_checkMaxOverlap" name="conflicts_checkMaxOverlap" type="checkbox" checked={formData.conflicts_checkMaxOverlap} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                            <label htmlFor="conflicts_checkMaxOverlap" className="ml-2 block text-sm text-gray-900">Vérifier le nombre maximum d'absents simultanés (même rôle)</label>
                        </div>
                        {formData.conflicts_checkMaxOverlap && (
                            <div>
                                <label htmlFor="conflicts_maxOverlapSameRole" className="block text-sm font-medium text-gray-700">Nombre maximum d'absents autorisés</label>
                                <input type="number" id="conflicts_maxOverlapSameRole" name="conflicts_maxOverlapSameRole" value={formData.conflicts_maxOverlapSameRole} onChange={handleChange} min="0"
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm" />
                            </div>
                        )}
                        {/* Note: La vérification d'effectif minimum (checkMinStaff) n'est pas incluse ici pour simplifier, mais pourrait être ajoutée */}
                    </fieldset>


                    {/* Affichage Erreur Générale */}
                    {error && (<p className="text-sm text-red-600">{error}</p>)}

                    {/* Boutons d'action */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded disabled:opacity-50">Annuler</button>
                        <button type="submit" disabled={isSubmitting} className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 ${isSubmitting ? 'animate-pulse' : ''}`}> {isSubmitting ? 'Enregistrement...' : (isEditing ? 'Mettre à jour' : 'Créer')} </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 