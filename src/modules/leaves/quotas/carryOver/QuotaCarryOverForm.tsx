import React, { useState, useEffect, useMemo } from 'react';
import { Form, Select, InputNumber, Button, Alert, Card, Typography, Divider, Space, Row, Col, Steps, Statistic, Input, Tooltip, notification, Table, Tag } from 'antd';
// import { SwapOutlined, InfoCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, QuestionCircleOutlined, CalendarOutlined, RightOutlined } from '@ant-design/icons';
import { useQuotaCarryOver, CarryOverPreviewResult } from './useQuotaCarryOver';
import { LeaveType } from '../../types/leave';
import { QuotaCarryOverCalculationRequest, QuotaCarryOverRuleType } from '../../types/quota';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Step } = Steps;
const { TextArea } = Input;

/**
 * Props pour le composant QuotaCarryOverForm
 */
export interface QuotaCarryOverFormProps {
    userId: string;
    fromYear?: number;
    toYear?: number;
    onCarryOverComplete?: () => void;
    onCancel?: () => void;
}

/**
 * Composant de formulaire permettant de reporter des quotas de congés
 * d'une année sur l'autre.
 */
export const QuotaCarryOverForm: React.FC<QuotaCarryOverFormProps> = ({
    userId,
    fromYear = new Date().getFullYear(),
    toYear = fromYear + 1,
    onCarryOverComplete,
    onCancel,
}) => {
    // Hook pour gérer les reports de quotas
    const {
        loading,
        carryOverLoading,
        simulationLoading,
        historyLoading,
        error,
        carryOverError,
        balance,
        carryOverRules,
        carryOverHistory,
        carryOverPreviews,
        eligibleTypes,
        refreshBalance,
        refreshCarryOverRules,
        refreshCarryOverHistory,
        simulateCarryOver,
        simulateAllCarryOvers,
        executeCarryOver,
        executeAllCarryOvers,
        getTypeLabel,
        getRemainingDays,
        isCarryOverAllowed,
        getReasonCarryOverNotAllowed,
        getCarryOverRuleForType,
    } = useQuotaCarryOver({
        userId,
        fromYear,
        toYear,
        includeHistory: true,
    });

    // État local du formulaire
    const [form] = Form.useForm();
    const [selectedType, setSelectedType] = useState<LeaveType | null>(null);
    const [amount, setAmount] = useState<number>(0);
    const [step, setStep] = useState<number>(0);
    const [preview, setPreview] = useState<CarryOverPreviewResult | null>(null);
    const [allPreviews, setAllPreviews] = useState<CarryOverPreviewResult[]>([]);
    const [localError, setLocalError] = useState<string | null>(null);
    const [comment, setComment] = useState<string>('');
    const [simulateAllClicked, setSimulateAllClicked] = useState<boolean>(false);

    // Déterminer le montant maximum reportable
    const maxAmount = useMemo(() => {
        if (!selectedType) return 0;
        const rule = getCarryOverRuleForType(selectedType);
        if (!rule) return 0;

        const remaining = getRemainingDays(selectedType);

        switch (rule.ruleType) {
            case QuotaCarryOverRuleType.FIXED:
                return Math.min(remaining, rule.value || 0);
            case QuotaCarryOverRuleType.PERCENTAGE:
                return Math.min(remaining, (remaining * (rule.value || 0) / 100));
            case QuotaCarryOverRuleType.UNLIMITED:
                return remaining;
            default:
                return 0;
        }
    }, [selectedType, getCarryOverRuleForType, getRemainingDays]);

    // Déterminer si le report est possible
    const canCarryOver = useMemo(() => {
        if (!selectedType) return false;
        return isCarryOverAllowed(selectedType) && amount > 0 && amount <= maxAmount;
    }, [selectedType, amount, maxAmount, isCarryOverAllowed]);

    // Formater la règle de report pour affichage
    const ruleDescription = useMemo(() => {
        if (!selectedType) return '';

        const rule = getCarryOverRuleForType(selectedType);
        if (!rule) return 'Aucune règle de report disponible';

        switch (rule.ruleType) {
            case QuotaCarryOverRuleType.FIXED:
                return `Maximum ${rule.value} jour(s) reportable(s)`;
            case QuotaCarryOverRuleType.PERCENTAGE:
                return `Maximum ${rule.value}% du solde reportable`;
            case QuotaCarryOverRuleType.UNLIMITED:
                return 'Report illimité possible';
            case QuotaCarryOverRuleType.EXPIRABLE:
                return `Report avec expiration après ${rule.expirationDays || 0} jours`;
            default:
                return '';
        }
    }, [selectedType, getCarryOverRuleForType]);

    /**
     * Récupérer les données nécessaires au chargement du composant
     */
    useEffect(() => {
        refreshBalance();
        refreshCarryOverRules();
        refreshCarryOverHistory();
    }, [refreshBalance, refreshCarryOverRules, refreshCarryOverHistory]);

    /**
     * Gérer le changement de type de congé
     */
    const handleTypeChange = (value: LeaveType) => {
        setSelectedType(value);
        setAmount(0);
        setPreview(null);
        setLocalError(null);
        form.setFieldsValue({ amount: 0 });
    };

    /**
     * Gérer le changement de montant
     */
    const handleAmountChange = (value: number | null) => {
        setAmount(value || 0);
        setPreview(null);
    };

    /**
     * Simuler le report
     */
    const handleSimulate = async () => {
        if (!selectedType || amount <= 0) {
            setLocalError('Veuillez compléter tous les champs requis.');
            return;
        }

        try {
            const request: QuotaCarryOverCalculationRequest = {
                userId,
                leaveType: selectedType,
                fromYear,
                toYear,
                amount,
            };

            const previewResult = await simulateCarryOver(request);
            setPreview(previewResult);

            if (previewResult.isAllowed) {
                setLocalError(null);
                setStep(1);
            } else {
                setLocalError(previewResult.reasonNotAllowed || 'Report non autorisé');
            }
        } catch (err: unknown) {
            setLocalError((err as Error).message);
        }
    };

    /**
     * Simuler tous les reports possibles
     */
    const handleSimulateAll = async () => {
        try {
            setSimulateAllClicked(true);
            const previews = await simulateAllCarryOvers();
            setAllPreviews(previews);

            // Si au moins un report est possible, passer à l'étape suivante
            const validPreviews = previews.filter(p => p.isAllowed);
            if (validPreviews.length > 0) {
                setLocalError(null);
                setStep(1);
            } else {
                setLocalError('Aucun report possible avec les règles en vigueur.');
            }
        } catch (err: unknown) {
            setLocalError((err as Error).message);
        }
    };

    /**
     * Exécuter le report
     */
    const handleExecute = async () => {
        if (!selectedType || amount <= 0) {
            setLocalError('Veuillez compléter tous les champs requis.');
            return;
        }

        try {
            const request: QuotaCarryOverCalculationRequest = {
                userId,
                leaveType: selectedType,
                fromYear,
                toYear,
                amount,
                comment: comment || undefined,
            };

            const result = await executeCarryOver(request);

            if (result.carryOverAmount > 0) {
                setStep(2);
                notification.success({
                    message: 'Report réussi',
                    description: `Vous avez reporté ${amount} jour(s) de ${getTypeLabel(selectedType)} de ${fromYear} vers ${toYear}.`,
                });
                if (onCarryOverComplete) {
                    onCarryOverComplete();
                }
            } else {
                setLocalError('Le report n\'a pas pu être effectué.');
            }
        } catch (err: unknown) {
            setLocalError((err as Error).message);
        }
    };

    /**
     * Exécuter tous les reports
     */
    const handleExecuteAll = async () => {
        try {
            const results = await executeAllCarryOvers();

            if (results.length > 0) {
                setStep(2);
                notification.success({
                    message: 'Reports réussis',
                    description: `${results.length} type(s) de congés ont été reportés de ${fromYear} vers ${toYear}.`,
                });
                if (onCarryOverComplete) {
                    onCarryOverComplete();
                }
            } else {
                setLocalError('Aucun report n\'a pu être effectué.');
            }
        } catch (err: unknown) {
            setLocalError((err as Error).message);
        }
    };

    /**
     * Annuler le report
     */
    const handleCancel = () => {
        if (step === 0) {
            if (onCancel) {
                onCancel();
            }
        } else {
            setStep(0);
            setPreview(null);
            setAllPreviews([]);
            setLocalError(null);
            setSimulateAllClicked(false);
        }
    };

    /**
     * Réinitialiser le formulaire
     */
    const handleReset = () => {
        form.resetFields();
        setSelectedType(null);
        setAmount(0);
        setPreview(null);
        setAllPreviews([]);
        setLocalError(null);
        setComment('');
        setStep(0);
        setSimulateAllClicked(false);
    };

    /**
     * Recommencer un nouveau report
     */
    const handleNewCarryOver = () => {
        handleReset();
    };

    // Colonnes pour le tableau de prévisualisation des reports
    const previewColumns = [
        {
            title: 'Type de congés',
            dataIndex: 'typeLabel',
            key: 'typeLabel',
        },
        {
            title: 'Jours restants',
            dataIndex: 'originalRemaining',
            key: 'originalRemaining',
            render: (value: number) => `${value.toFixed(1)} jour(s)`,
        },
        {
            title: 'Jours reportables',
            dataIndex: 'eligibleForCarryOver',
            key: 'eligibleForCarryOver',
            render: (value: number) => `${value.toFixed(1)} jour(s)`,
        },
        {
            title: 'Statut',
            dataIndex: 'isAllowed',
            key: 'isAllowed',
            render: (allowed: boolean, record: CarryOverPreviewResult) => (
                allowed ?
                    <Tag color="success">Report possible</Tag> :
                    <Tag color="error" title={record.reasonNotAllowed}>Report impossible</Tag>
            ),
        },
    ];

    return (
        <Card loading={loading} title="Report de quotas de congés">
            <Steps current={step} style={{ marginBottom: 24 }}>
                <Step
                    title="Sélection"
                    description="Choisir type et montant"
                    icon={step > 0 ? <span>✅</span> : undefined}
                />
                <Step
                    title="Confirmation"
                    description="Vérifier et confirmer"
                    icon={step > 1 ? <span>✅</span> : undefined}
                />
                <Step
                    title="Terminé"
                    description="Report effectué"
                    icon={step === 2 ? <span>✅</span> : undefined}
                />
            </Steps>

            {(error || localError || carryOverError) && (
                <Alert
                    message="Erreur"
                    description={localError || (carryOverError && carryOverError.message) || (error && error.message)}
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            {step === 0 && (
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ leaveType: null, amount: 0 }}
                >
                    <Title level={4}>Report de quotas de congés</Title>
                    <Paragraph>
                        Ce formulaire vous permet de reporter des jours de congés de {fromYear} vers {toYear} selon les règles en vigueur.
                    </Paragraph>

                    <Divider />

                    <Row gutter={16}>
                        <Col span={24}>
                            <Button
                                type="primary"
                                icon={<span>📅</span>}
                                onClick={handleSimulateAll}
                                loading={simulationLoading}
                                style={{ marginBottom: 16 }}
                            >
                                Simuler tous les reports possibles
                            </Button>
                        </Col>
                    </Row>

                    <Divider>ou</Divider>

                    <Form.Item
                        label="Type de congé à reporter"
                        name="leaveType"
                        rules={[{ required: true, message: 'Veuillez sélectionner un type de congé' }]}
                    >
                        <Select
                            placeholder="Sélectionnez le type de congé à reporter"
                            onChange={handleTypeChange}
                            disabled={loading}
                        >
                            {eligibleTypes.map((type) => (
                                <Option key={type} value={type}>
                                    {getTypeLabel(type)} ({getRemainingDays(type)} jours disponibles)
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {selectedType && (
                        <Alert
                            message={ruleDescription}
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    <Form.Item
                        label={<>
                            Nombre de jours à reporter
                            <Tooltip title={`Maximum: ${maxAmount} jours`}>
                                <span style={{ marginLeft: 8 }}>ℹ️</span>
                            </Tooltip>
                        </>}
                        name="amount"
                        rules={[
                            { required: true, message: 'Veuillez saisir un nombre de jours' },
                            { type: 'number', min: 0.5, message: 'Le nombre de jours doit être d\'au moins 0.5' },
                            { type: 'number', max: maxAmount, message: `Maximum ${maxAmount} jours` }
                        ]}
                    >
                        <InputNumber
                            min={0.5}
                            max={maxAmount}
                            step={0.5}
                            style={{ width: '100%' }}
                            disabled={!selectedType || loading}
                            onChange={handleAmountChange}
                            addonAfter={<Text type="secondary">jours</Text>}
                        />
                    </Form.Item>

                    {selectedType && amount > 0 && (
                        <Alert
                            message={
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Text>
                                        Vous allez reporter <Text strong>{amount} jour(s)</Text> de {getTypeLabel(selectedType)}
                                        de {fromYear} vers {toYear}
                                    </Text>
                                </Space>
                            }
                            type="info"
                            showIcon
                            icon={<span>→</span>}
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    <Divider />

                    <Row justify="end" gutter={16}>
                        <Col>
                            <Button onClick={handleCancel}>Annuler</Button>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                onClick={handleSimulate}
                                disabled={!canCarryOver || simulationLoading}
                                loading={simulationLoading}
                            >
                                Simuler le report
                            </Button>
                        </Col>
                    </Row>
                </Form>
            )}

            {step === 1 && ((preview && !simulateAllClicked) || (allPreviews.length > 0 && simulateAllClicked)) && (
                <div>
                    <Title level={4}>Confirmation du report</Title>
                    <Paragraph>
                        Veuillez vérifier les informations ci-dessous avant de confirmer le report.
                    </Paragraph>

                    <Divider />

                    {simulateAllClicked ? (
                        <Table
                            dataSource={allPreviews.filter(p => p.isAllowed)}
                            columns={previewColumns}
                            rowKey="leaveType"
                            pagination={false}
                            style={{ marginBottom: 24 }}
                        />
                    ) : (
                        preview && (
                            <Row gutter={[16, 16]}>
                                <Col span={24}>
                                    <Statistic
                                        title={`${preview.typeLabel} (${fromYear})`}
                                        value={preview.originalRemaining}
                                        suffix="jours disponibles"
                                    />
                                </Col>
                                <Col span={12}>
                                    <Statistic
                                        title="Montant à reporter"
                                        value={preview.carryOverAmount}
                                        suffix="jours"
                                        valueStyle={{ color: '#cf1322' }}
                                    />
                                </Col>
                                <Col span={12}>
                                    <Statistic
                                        title={`Jours ajoutés (${toYear})`}
                                        value={preview.carryOverAmount}
                                        suffix="jours"
                                        valueStyle={{ color: '#3f8600' }}
                                        prefix="+"
                                    />
                                </Col>
                            </Row>
                        )
                    )}

                    <Divider />

                    <Form.Item
                        label="Commentaire (optionnel)"
                        name="comment"
                    >
                        <TextArea
                            rows={3}
                            placeholder="Ajoutez un commentaire à ce report (raison, contexte, etc.)"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            maxLength={200}
                            showCount
                        />
                    </Form.Item>

                    <Alert
                        message="Confirmation requise"
                        description="Ce report sera définitif et ne pourra pas être annulé une fois confirmé."
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />

                    <Row justify="end" gutter={16}>
                        <Col>
                            <Button onClick={handleCancel}>Retour</Button>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                onClick={simulateAllClicked ? handleExecuteAll : handleExecute}
                                disabled={carryOverLoading}
                                loading={carryOverLoading}
                            >
                                Confirmer le report
                            </Button>
                        </Col>
                    </Row>
                </div>
            )}

            {step === 2 && (
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 72, color: '#52c41a', marginBottom: 24, display: 'block' }}>✅</span>

                    <Title level={4}>Report effectué avec succès</Title>
                    {simulateAllClicked ? (
                        <Paragraph>
                            Les reports de quotas de {fromYear} vers {toYear} ont été effectués avec succès.
                        </Paragraph>
                    ) : (
                        <Paragraph>
                            Le report de {amount} jour(s) de {selectedType && getTypeLabel(selectedType)} de {fromYear} vers {toYear} a été effectué avec succès.
                        </Paragraph>
                    )}

                    <Divider />

                    <Row justify="center" gutter={16}>
                        <Col>
                            <Button onClick={onCancel}>Fermer</Button>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                onClick={handleNewCarryOver}
                            >
                                Nouveau report
                            </Button>
                        </Col>
                    </Row>
                </div>
            )}
        </Card>
    );
};

export default QuotaCarryOverForm; 