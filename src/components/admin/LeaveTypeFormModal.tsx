'use client';

import React, { useState, useEffect } from 'react';
// Importer les types nécessaires
import { LeaveTypeSetting, ProfessionalRole, Role } from '@prisma/client';
import { JsonValue } from 'type-fest';
import { Modal, Form, Input, InputNumber, Select, Switch, Checkbox, Space, Divider, Row, Col } from 'antd';
import type { SelectProps } from 'antd';

const { Option } = Select;

// --- Constantes et Types ---
const ALL_ROLES: ProfessionalRole[] = [ProfessionalRole.MAR, ProfessionalRole.IADE, ProfessionalRole.SECRETAIRE];
const ADMIN_ROLES: Role[] = [Role.ADMIN_TOTAL, Role.ADMIN_PARTIEL];
const COUNTING_METHODS = [
    { value: 'WEEKDAYS_IF_WORKING', label: 'Jours ouvrés si travaillés' },
    { value: 'MONDAY_TO_SATURDAY', label: 'Du lundi au samedi' },
    { value: 'CONTINUOUS_ALL_DAYS', label: 'Tous les jours en continu' },
    { value: 'NONE', label: 'Non Décompté' },
] as const;

type CountingMethod = typeof COUNTING_METHODS[number]['value'];

interface LeaveType {
    id: string;
    code: string;
    label: string;
    description: string | null;
    rules: JsonValue;
    isActive: boolean;
    isUserSelectable: boolean;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

// Props du composant
interface LeaveTypeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Partial<LeaveType & {
        rules: {
            counting?: {
                method?: string;
                excludePublicHolidays?: boolean;
            };
            balance?: {
                deducts?: boolean;
                annual?: {
                    defaultDaysByRole?: Record<string, number>;
                    seniorityBonus?: {
                        enabled?: boolean;
                        yearsRequired?: number;
                        bonusDaysPerThreshold?: number;
                        maxBonusDays?: number;
                        applicableRoles?: string[];
                    };
                };
            };
            eligibility?: {
                roles?: string[];
                minSeniorityMonths?: number;
            };
            request?: {
                minNoticeDays?: number;
                requiresReason?: boolean;
                allowHalfDays?: boolean;
            };
            approval?: {
                autoApprove?: boolean;
                requiredRole?: string;
            };
            conflicts?: {
                checkMaxOverlap?: boolean;
                maxOverlapSameRole?: number;
            };
        };
    }>;
}

// Type pour les données du formulaire
interface FormData {
    code: string;
    label: string;
    description: string;
    isActive: boolean;
    isUserSelectable: boolean;
    displayOrder: number;
    eligibility_roles: ProfessionalRole[];
    approval_requiredRole: Role | null;
    counting_method: typeof COUNTING_METHODS[number]['value'];
    counting_excludePublicHolidays: boolean;
    balance_deducts: boolean;
    balance_annual_enabled: boolean;
    balance_annual_defaultDays_MAR: number;
    balance_annual_defaultDays_IADE: number;
    balance_annual_defaultDays_SECRETAIRE: number;
    balance_annual_seniorityBonus_enabled: boolean;
    balance_annual_seniorityBonus_yearsRequired: number;
    balance_annual_seniorityBonus_bonusDaysPerThreshold: number;
    balance_annual_seniorityBonus_maxBonusDays: number;
    balance_annual_seniorityBonus_applicableRoles: ProfessionalRole[];
    eligibility_minSeniorityMonths: number;
    request_minNoticeDays: number;
    request_requiresReason: boolean;
    request_allowHalfDays: boolean;
    approval_autoApprove: boolean;
    conflicts_checkMaxOverlap: boolean;
    conflicts_maxOverlapSameRole: number;
}

// Valeurs par défaut pour un nouveau type
const getDefaultFormData = (): FormData => ({
    code: '',
    label: '',
    description: '',
    isActive: true,
    isUserSelectable: true,
    displayOrder: 0,
    eligibility_roles: [],
    approval_requiredRole: null,
    counting_method: 'WEEKDAYS_IF_WORKING',
    counting_excludePublicHolidays: true,
    balance_deducts: true,
    balance_annual_enabled: false,
    balance_annual_defaultDays_MAR: 0,
    balance_annual_defaultDays_IADE: 0,
    balance_annual_defaultDays_SECRETAIRE: 0,
    balance_annual_seniorityBonus_enabled: false,
    balance_annual_seniorityBonus_yearsRequired: 5,
    balance_annual_seniorityBonus_bonusDaysPerThreshold: 1,
    balance_annual_seniorityBonus_maxBonusDays: 5,
    balance_annual_seniorityBonus_applicableRoles: [],
    eligibility_minSeniorityMonths: 0,
    request_minNoticeDays: 0,
    request_requiresReason: false,
    request_allowHalfDays: true,
    approval_autoApprove: false,
    conflicts_checkMaxOverlap: false,
    conflicts_maxOverlapSameRole: 0,
});

const transformInitialDataToFormData = (initialData: LeaveTypeFormModalProps['initialData']): FormData => {
    if (!initialData) return getDefaultFormData();

    const rules = initialData.rules || {};
    const counting = rules.counting || {};
    const balance = rules.balance || {};
    const annual = balance.annual || {};
    const seniorityBonus = annual.seniorityBonus || {};
    const eligibility = rules.eligibility || {};
    const request = rules.request || {};
    const approval = rules.approval || {};
    const conflicts = rules.conflicts || {};

    return {
        ...getDefaultFormData(),
        code: initialData.code || '',
        label: initialData.label || '',
        description: initialData.description || '',
        isActive: initialData.isActive ?? true,
        isUserSelectable: initialData.isUserSelectable ?? true,
        displayOrder: initialData.displayOrder ?? 0,
        counting_method: (counting.method as CountingMethod) || 'WEEKDAYS_IF_WORKING',
        counting_excludePublicHolidays: counting.excludePublicHolidays ?? true,
        balance_deducts: balance.deducts ?? true,
        balance_annual_enabled: !!annual,
        balance_annual_defaultDays_MAR: annual.defaultDaysByRole?.MAR ?? 0,
        balance_annual_defaultDays_IADE: annual.defaultDaysByRole?.IADE ?? 0,
        balance_annual_defaultDays_SECRETAIRE: annual.defaultDaysByRole?.SECRETAIRE ?? 0,
        balance_annual_seniorityBonus_enabled: seniorityBonus.enabled ?? false,
        balance_annual_seniorityBonus_yearsRequired: seniorityBonus.yearsRequired ?? 5,
        balance_annual_seniorityBonus_bonusDaysPerThreshold: seniorityBonus.bonusDaysPerThreshold ?? 1,
        balance_annual_seniorityBonus_maxBonusDays: seniorityBonus.maxBonusDays ?? 5,
        balance_annual_seniorityBonus_applicableRoles: (seniorityBonus.applicableRoles || []) as ProfessionalRole[],
        eligibility_roles: (eligibility.roles || []) as ProfessionalRole[],
        eligibility_minSeniorityMonths: eligibility.minSeniorityMonths ?? 0,
        request_minNoticeDays: request.minNoticeDays ?? 0,
        request_requiresReason: request.requiresReason ?? false,
        request_allowHalfDays: request.allowHalfDays ?? true,
        approval_autoApprove: approval.autoApprove ?? false,
        approval_requiredRole: approval.requiredRole ? (approval.requiredRole as Role) : null,
        conflicts_checkMaxOverlap: conflicts.checkMaxOverlap ?? false,
        conflicts_maxOverlapSameRole: conflicts.maxOverlapSameRole ?? 0,
    };
};

const LeaveTypeFormModal: React.FC<LeaveTypeFormModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    initialData
}) => {
    const [form] = Form.useForm();
    const [formData, setFormData] = useState<FormData>(getDefaultFormData());
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!initialData?.id;

    useEffect(() => {
        if (isOpen) {
            const data = transformInitialDataToFormData(initialData);
            setFormData(data);
            form.setFieldsValue(data);
            setError(null);
        }
    }, [isOpen, initialData, form]);

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
            setFormData(prev => ({ ...prev, approval_requiredRole: null })); // Effacer si autoApprove
        }
        // Gérer la visibilité des champs liés aux conflits
        if (name === 'conflicts_checkMaxOverlap' && !(e.target as HTMLInputElement).checked) {
            setFormData(prev => ({ ...prev, conflicts_maxOverlapSameRole: 1 })); // Reset si check désactivé
        }
    };

    // Gestionnaire unifié pour les changements de rôles
    const handleRoleChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            approval_requiredRole: value ? (value as Role) : null
        }));
    };

    // Gestionnaire de changement pour les rôles de bonus d'ancienneté
    const handleSeniorityRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        const role = value as ProfessionalRole;
        setFormData(prev => ({
            ...prev,
            balance_annual_seniorityBonus_applicableRoles: checked
                ? [...prev.balance_annual_seniorityBonus_applicableRoles, role]
                : prev.balance_annual_seniorityBonus_applicableRoles.filter(r => r !== role)
        }));
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
                displayOrder: formData.displayOrder,
                rules: rules // Envoyer l'objet rules reconstruit
            };
        } else {
            bodyToSend = {
                code: formData.code, // Inclure le code pour la création
                label: formData.label,
                description: formData.description,
                isActive: formData.isActive,
                isUserSelectable: formData.isUserSelectable,
                displayOrder: formData.displayOrder,
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

    return (
        <Modal
            title={isEditing ? 'Modifier le Type de Congé' : 'Ajouter un Type de Congé'}
            open={isOpen}
            onCancel={onClose}
            onOk={handleSubmit}
            width={800}
            confirmLoading={isSubmitting}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={formData}
                onValuesChange={(_, allValues) => setFormData(allValues as FormData)}
            >
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {/* Section Informations Générales */}
                    <div>
                        <Divider orientation="left">Informations Générales</Divider>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="code"
                                    label="Code"
                                    rules={[{ required: true, message: 'Le code est requis' }]}
                                >
                                    <Input disabled={isEditing} />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="displayOrder"
                                    label="Ordre d'affichage"
                                >
                                    <InputNumber style={{ width: '100%' }} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="label"
                            label="Libellé"
                            rules={[{ required: true, message: 'Le libellé est requis' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="Description"
                        >
                            <Input.TextArea rows={4} />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="isActive"
                                    valuePropName="checked"
                                >
                                    <Switch checkedChildren="Actif" unCheckedChildren="Inactif" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="isUserSelectable"
                                    valuePropName="checked"
                                >
                                    <Switch checkedChildren="Sélectionnable" unCheckedChildren="Non sélectionnable" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    {/* Section Règles de Décompte */}
                    <div>
                        <Divider orientation="left">Règles de Décompte</Divider>
                        <Form.Item
                            name="counting_method"
                            label="Méthode de décompte"
                        >
                            <Select>
                                {COUNTING_METHODS.map(opt => (
                                    <Select.Option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="counting_excludePublicHolidays"
                            valuePropName="checked"
                        >
                            <Checkbox>Exclure les jours fériés du décompte</Checkbox>
                        </Form.Item>
                    </div>

                    {/* Section Règles de Solde */}
                    <div>
                        <Divider orientation="left">Règles de Solde</Divider>
                        <Form.Item
                            name="balance_deducts"
                            valuePropName="checked"
                        >
                            <Checkbox>Ce congé déduit d'un solde</Checkbox>
                        </Form.Item>

                        {formData.balance_deducts && formData.code.startsWith('ANNUAL') && (
                            <div>
                                <Divider orientation="left" plain>Configuration Solde Annuel</Divider>
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Form.Item
                                            name="balance_annual_defaultDays_MAR"
                                            label="MAR"
                                        >
                                            <InputNumber style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="balance_annual_defaultDays_IADE"
                                            label="IADE"
                                        >
                                            <InputNumber style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="balance_annual_defaultDays_SECRETAIRE"
                                            label="SEC"
                                        >
                                            <InputNumber style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item
                                    name="balance_annual_seniorityBonus_enabled"
                                    valuePropName="checked"
                                >
                                    <Checkbox>Activer Bonus Ancienneté</Checkbox>
                                </Form.Item>

                                {formData.balance_annual_seniorityBonus_enabled && (
                                    <div style={{ paddingLeft: 24, borderLeft: '1px solid #f0f0f0' }}>
                                        <Row gutter={16}>
                                            <Col span={8}>
                                                <Form.Item
                                                    name="balance_annual_seniorityBonus_yearsRequired"
                                                    label="Années Requises"
                                                >
                                                    <InputNumber style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item
                                                    name="balance_annual_seniorityBonus_bonusDaysPerThreshold"
                                                    label="Jours / Palier"
                                                >
                                                    <InputNumber style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item
                                                    name="balance_annual_seniorityBonus_maxBonusDays"
                                                    label="Bonus Max"
                                                >
                                                    <InputNumber style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <Form.Item
                                            name="balance_annual_seniorityBonus_applicableRoles"
                                            label="Rôles concernés par le bonus"
                                        >
                                            <Checkbox.Group>
                                                <Row>
                                                    {ALL_ROLES.map(role => (
                                                        <Col span={8} key={role}>
                                                            <Checkbox value={role}>{role}</Checkbox>
                                                        </Col>
                                                    ))}
                                                </Row>
                                            </Checkbox.Group>
                                        </Form.Item>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Section Éligibilité */}
                    <div>
                        <Divider orientation="left">Éligibilité</Divider>
                        <Form.Item
                            name="eligibility_roles"
                            label="Rôles professionnels éligibles"
                        >
                            <Checkbox.Group>
                                <Space direction="vertical">
                                    {ALL_ROLES.map(role => (
                                        <Checkbox key={role} value={role}>{role}</Checkbox>
                                    ))}
                                </Space>
                            </Checkbox.Group>
                        </Form.Item>

                        <Form.Item
                            name="eligibility_minSeniorityMonths"
                            label="Ancienneté minimale requise (mois)"
                        >
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </div>

                    {/* Section Règles de Demande */}
                    <div>
                        <Divider orientation="left">Règles de Demande</Divider>
                        <Form.Item
                            name="request_minNoticeDays"
                            label="Délai de prévenance minimum (jours)"
                        >
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="request_requiresReason"
                                    valuePropName="checked"
                                >
                                    <Checkbox>Motif obligatoire</Checkbox>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="request_allowHalfDays"
                                    valuePropName="checked"
                                >
                                    <Checkbox>Autoriser les demi-journées</Checkbox>
                                </Form.Item>
                            </Col>
                        </Row>
                    </div>

                    {/* Section Approbation */}
                    <div>
                        <Divider orientation="left">Approbation</Divider>
                        <Form.Item
                            name="approval_autoApprove"
                            valuePropName="checked"
                        >
                            <Checkbox>Approbation automatique</Checkbox>
                        </Form.Item>

                        {!formData.approval_autoApprove && (
                            <Form.Item
                                name="approval_requiredRole"
                                label="Rôle requis pour approbation"
                            >
                                <Select>
                                    <Select.Option value="">Aucun rôle requis</Select.Option>
                                    {ADMIN_ROLES.map(role => (
                                        <Select.Option key={role} value={role}>{role}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}
                    </div>

                    {/* Section Règles de Conflit */}
                    <div>
                        <Divider orientation="left">Règles de Conflit</Divider>
                        <Form.Item
                            name="conflicts_checkMaxOverlap"
                            valuePropName="checked"
                        >
                            <Checkbox>Vérifier le nombre maximal de personnes absentes en même temps</Checkbox>
                        </Form.Item>

                        {formData.conflicts_checkMaxOverlap && (
                            <Form.Item
                                name="conflicts_maxOverlapSameRole"
                                label="Nombre maximal de personnes du même rôle absentes simultanément"
                            >
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        )}
                    </div>

                    {error && (
                        <div className="text-red-500 mt-4">
                            {error}
                        </div>
                    )}
                </Space>
            </Form>
        </Modal>
    );
};

export default LeaveTypeFormModal; 