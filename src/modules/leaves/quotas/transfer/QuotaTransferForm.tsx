import React, { useState, useEffect, useMemo } from 'react';
import { Form, Select, InputNumber, Button, Alert, Card, Typography, Divider, Space, Row, Col, Steps, Statistic, Input, Tooltip, notification } from 'antd';
// import { SwapOutlined, InfoCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useQuotaTransfer, TransferPreviewResult } from './useQuotaTransfer';
import { LeaveType } from '../../types/leave';
import { QuotaTransferRequest } from '../../types/quota';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Step } = Steps;
const { TextArea } = Input;

/**
 * Props pour le composant QuotaTransferForm
 */
export interface QuotaTransferFormProps {
    userId: string;
    onTransferComplete?: () => void;
    onCancel?: () => void;
}

/**
 * Composant de formulaire permettant de transférer des quotas de congés
 * entre différents types.
 */
export const QuotaTransferForm: React.FC<QuotaTransferFormProps> = ({
    userId,
    onTransferComplete,
    onCancel,
}) => {
    // Hook pour gérer les transferts de quotas
    const {
        loading,
        transferLoading,
        simulationLoading,
        error,
        transferError,
        transferPreview,
        availableSourceTypes,
        availableTargetTypes,
        simulateTransfer,
        executeTransfer,
        getTypeLabel,
        getRemainingDays,
        getMaxTransferableAmount,
        getConversionRatio,
        isTransferAllowed,
        getReasonTransferNotAllowed,
    } = useQuotaTransfer({ userId });

    // État local du formulaire
    const [form] = Form.useForm();
    const [sourceType, setSourceType] = useState<LeaveType | null>(null);
    const [targetType, setTargetType] = useState<LeaveType | null>(null);
    const [amount, setAmount] = useState<number>(0);
    const [step, setStep] = useState<number>(0);
    const [preview, setPreview] = useState<TransferPreviewResult | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [comment, setComment] = useState<string>('');

    // Déterminer les types de congés cibles disponibles pour le type source sélectionné
    const availableTargets = useMemo(() => {
        if (!sourceType) return [];
        return availableTargetTypes[sourceType] || [];
    }, [sourceType, availableTargetTypes]);

    // Déterminer le montant maximum transférable
    const maxAmount = useMemo(() => {
        if (!sourceType || !targetType) return 0;
        return getMaxTransferableAmount(sourceType, targetType);
    }, [sourceType, targetType, getMaxTransferableAmount]);

    // Déterminer le ratio de conversion
    const conversionRatio = useMemo(() => {
        if (!sourceType || !targetType) return 1;
        return getConversionRatio(sourceType, targetType);
    }, [sourceType, targetType, getConversionRatio]);

    // Déterminer si le transfert est possible
    const canTransfer = useMemo(() => {
        if (!sourceType || !targetType) return false;
        return isTransferAllowed(sourceType, targetType) && amount > 0 && amount <= maxAmount;
    }, [sourceType, targetType, amount, maxAmount, isTransferAllowed]);

    // Montant calculé après conversion
    const convertedAmount = useMemo(() => {
        return amount > 0 ? (amount * conversionRatio).toFixed(1) : '0';
    }, [amount, conversionRatio]);

    /**
     * Gérer le changement de type source
     */
    const handleSourceTypeChange = (value: LeaveType) => {
        setSourceType(value);
        setTargetType(null);
        setAmount(0);
        setPreview(null);
        setLocalError(null);
        form.setFieldsValue({ targetType: null, amount: 0 });
    };

    /**
     * Gérer le changement de type cible
     */
    const handleTargetTypeChange = (value: LeaveType) => {
        setTargetType(value);
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
     * Simuler le transfert
     */
    const handleSimulate = async () => {
        if (!sourceType || !targetType || amount <= 0) {
            setLocalError('Veuillez compléter tous les champs requis.');
            return;
        }

        try {
            const request: QuotaTransferRequest = {
                userId,
                sourceType,
                targetType,
                sourceAmount: amount,
            };

            const previewResult = await simulateTransfer(request);
            setPreview(previewResult);

            if (previewResult.success) {
                setLocalError(null);
                setStep(1);
            } else {
                setLocalError(previewResult.message);
            }
        } catch (err: unknown) {
            setLocalError((err as Error).message);
        }
    };

    /**
     * Exécuter le transfert
     */
    const handleExecute = async () => {
        if (!sourceType || !targetType || amount <= 0) {
            setLocalError('Veuillez compléter tous les champs requis.');
            return;
        }

        try {
            const request: QuotaTransferRequest = {
                userId,
                sourceType,
                targetType,
                sourceAmount: amount,
                comment: comment || undefined,
            };

            const result = await executeTransfer(request);

            if (result.success) {
                setStep(2);
                notification.success({
                    message: 'Transfert réussi',
                    description: `Vous avez transféré ${amount} jour(s) de ${getTypeLabel(sourceType)} vers ${getTypeLabel(targetType)}.`,
                });
                if (onTransferComplete) {
                    onTransferComplete();
                }
            } else {
                setLocalError(result.message);
            }
        } catch (err: unknown) {
            setLocalError((err as Error).message);
        }
    };

    /**
     * Annuler le transfert
     */
    const handleCancel = () => {
        if (step === 0) {
            if (onCancel) {
                onCancel();
            }
        } else {
            setStep(0);
            setPreview(null);
            setLocalError(null);
        }
    };

    /**
     * Réinitialiser le formulaire
     */
    const handleReset = () => {
        form.resetFields();
        setSourceType(null);
        setTargetType(null);
        setAmount(0);
        setPreview(null);
        setLocalError(null);
        setComment('');
        setStep(0);
    };

    /**
     * Recommencer un nouveau transfert
     */
    const handleNewTransfer = () => {
        handleReset();
    };

    return (
        <Card loading={loading} title="Transfert de quotas de congés">
            <Steps current={step} style={{ marginBottom: 24 }}>
                <Step
                    title="Sélection"
                    description="Choisir types et montant"
                    icon={step > 0 ? <span>✅</span> : undefined}
                />
                <Step
                    title="Confirmation"
                    description="Vérifier et confirmer"
                    icon={step > 1 ? <span>✅</span> : undefined}
                />
                <Step
                    title="Terminé"
                    description="Transfert effectué"
                    icon={step === 2 ? <span>✅</span> : undefined}
                />
            </Steps>

            {(error || localError || transferError) && (
                <Alert
                    message="Erreur"
                    description={localError || (transferError && transferError.message) || (error && error.message)}
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                />
            )}

            {step === 0 && (
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ sourceType: null, targetType: null, amount: 0 }}
                >
                    <Title level={4}>Transfert de quotas de congés</Title>
                    <Paragraph>
                        Ce formulaire vous permet de transférer des jours de congés entre différents types selon les règles en vigueur.
                    </Paragraph>

                    <Divider />

                    <Form.Item
                        label="Type de congé source"
                        name="sourceType"
                        rules={[{ required: true, message: 'Veuillez sélectionner un type de congé source' }]}
                    >
                        <Select
                            placeholder="Sélectionnez le type de congé source"
                            onChange={handleSourceTypeChange}
                            disabled={loading}
                        >
                            {availableSourceTypes.map((type) => (
                                <Option key={type} value={type}>
                                    {getTypeLabel(type)} ({getRemainingDays(type)} jours disponibles)
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label={<>
                            Type de congé destination
                            <Tooltip title="Type de congé vers lequel vous souhaitez transférer des jours">
                                <span style={{ marginLeft: 8 }}>❓</span>
                            </Tooltip>
                        </>}
                        name="targetType"
                        rules={[{ required: true, message: 'Veuillez sélectionner un type de congé destination' }]}
                    >
                        <Select
                            placeholder="Sélectionnez le type de congé destination"
                            onChange={handleTargetTypeChange}
                            disabled={!sourceType || loading}
                        >
                            {availableTargets.map((type) => (
                                <Option key={type} value={type}>
                                    {getTypeLabel(type)} (Taux de conversion: {conversionRatio})
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label={<>
                            Nombre de jours à transférer
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
                            disabled={!targetType || loading}
                            onChange={handleAmountChange}
                            addonAfter={<Text type="secondary">jours</Text>}
                        />
                    </Form.Item>

                    {sourceType && targetType && amount > 0 && (
                        <Alert
                            message={
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Text>
                                        Vous allez transférer <Text strong>{amount} jour(s)</Text> de {getTypeLabel(sourceType)}
                                        vers {getTypeLabel(targetType)}
                                    </Text>
                                    <Text>
                                        Après conversion (taux: {conversionRatio}), vous recevrez{' '}
                                        <Text strong>{convertedAmount} jour(s)</Text> de {getTypeLabel(targetType)}
                                    </Text>
                                </Space>
                            }
                            type="info"
                            showIcon
                            icon={<span>↔️</span>}
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
                                disabled={!canTransfer || simulationLoading}
                                loading={simulationLoading}
                            >
                                Simuler le transfert
                            </Button>
                        </Col>
                    </Row>
                </Form>
            )}

            {step === 1 && preview && (
                <div>
                    <Title level={4}>Confirmation du transfert</Title>
                    <Paragraph>
                        Veuillez vérifier les informations ci-dessous avant de confirmer le transfert.
                    </Paragraph>

                    <Divider />

                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Statistic
                                title={`${preview.sourceLabel} (source)`}
                                value={preview.sourceAmount}
                                suffix="jours"
                                valueStyle={{ color: '#cf1322' }}
                            />
                            <Text type="secondary">
                                Solde restant après transfert: {preview.sourceRemaining.toFixed(1)} jours
                            </Text>
                        </Col>
                        <Col span={12}>
                            <Statistic
                                title={`${preview.targetLabel} (destination)`}
                                value={preview.targetAmount}
                                suffix="jours"
                                valueStyle={{ color: '#3f8600' }}
                                prefix="+"
                            />
                            <Text type="secondary">
                                Nouveau solde: {preview.targetTotal.toFixed(1)} jours
                            </Text>
                        </Col>
                    </Row>

                    <Divider />

                    <Form.Item
                        label="Commentaire (optionnel)"
                        name="comment"
                    >
                        <TextArea
                            rows={3}
                            placeholder="Ajoutez un commentaire à ce transfert (raison, contexte, etc.)"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            maxLength={200}
                            showCount
                        />
                    </Form.Item>

                    <Alert
                        message="Confirmation requise"
                        description="Ce transfert sera définitif et ne pourra pas être annulé une fois confirmé."
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
                                onClick={handleExecute}
                                disabled={transferLoading}
                                loading={transferLoading}
                            >
                                Confirmer le transfert
                            </Button>
                        </Col>
                    </Row>
                </div>
            )}

            {step === 2 && (
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 72, color: '#52c41a', marginBottom: 24, display: 'block' }}>✅</span>

                    <Title level={4}>Transfert effectué avec succès</Title>
                    <Paragraph>
                        Le transfert de {amount} jour(s) de {sourceType && getTypeLabel(sourceType)} vers {targetType && getTypeLabel(targetType)} a été effectué avec succès.
                    </Paragraph>

                    <Divider />

                    <Row justify="center" gutter={16}>
                        <Col>
                            <Button onClick={onCancel}>Fermer</Button>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                onClick={handleNewTransfer}
                            >
                                Nouveau transfert
                            </Button>
                        </Col>
                    </Row>
                </div>
            )}
        </Card>
    );
};

export default QuotaTransferForm; 