import {
    QuotaTransferRule,
    QuotaTransferRuleType,
    QuotaTransferRequest,
    QuotaTransferResult,
    QuotaTransferHistory,
    QuotaCarryOverRule,
    QuotaCarryOverRuleType,
    QuotaCarryOverCalculationRequest,
    QuotaCarryOverCalculationResult,
    QuotaCarryOverHistory,
    SpecialPeriodRule,
    SpecialPeriodRuleType
} from '../types/quota';
import { LeaveType, LeaveBalance } from '../types/leave';
import { fetchLeaveBalance } from './leaveService';
import { format, isWithinInterval, differenceInDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

/**
 * URL de base pour les APIs de quotas
 */
const QUOTA_API_BASE_URL = '/api/leaves/quotas';

/**
 * Récupère toutes les règles de transfert de quotas
 */
export const fetchTransferRules = async (): Promise<QuotaTransferRule[]> => {
    try {
        const response = await fetch(`${QUOTA_API_BASE_URL}/transfer-rules`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            throw new Error(`Erreur HTTP ${response.status} lors de la récupération des règles de transfert: ${errorData}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération des règles de transfert:', error);
        throw error;
    }
};

/**
 * Récupère les règles de transfert actives pour un utilisateur
 */
export const fetchActiveTransferRulesForUser = async (userId: string): Promise<QuotaTransferRule[]> => {
    try {
        const response = await fetch(`${QUOTA_API_BASE_URL}/transfer-rules/active?userId=${userId}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            throw new Error(`Erreur HTTP ${response.status} lors de la récupération des règles de transfert actives: ${errorData}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération des règles de transfert actives:', error);
        throw error;
    }
};

/**
 * Crée ou met à jour une règle de transfert
 */
export const saveTransferRule = async (rule: Partial<QuotaTransferRule>): Promise<QuotaTransferRule> => {
    try {
        const method = rule.id ? 'PUT' : 'POST';
        const url = rule.id
            ? `${QUOTA_API_BASE_URL}/transfer-rules/${rule.id}`
            : `${QUOTA_API_BASE_URL}/transfer-rules`;

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rule),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            throw new Error(`Erreur HTTP ${response.status} lors de l'enregistrement de la règle de transfert: ${errorData}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la règle de transfert:', error);
        throw error;
    }
};

/**
 * Supprime une règle de transfert
 */
export const deleteTransferRule = async (ruleId: string): Promise<{ success: boolean }> => {
    try {
        const response = await fetch(`${QUOTA_API_BASE_URL}/transfer-rules/${ruleId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            throw new Error(`Erreur HTTP ${response.status} lors de la suppression de la règle de transfert: ${errorData}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la suppression de la règle de transfert:', error);
        throw error;
    }
};

/**
 * Effectue un transfert de quotas entre deux types de congés
 */
export const transferQuota = async (request: QuotaTransferRequest): Promise<QuotaTransferResult> => {
    try {
        const response = await fetch(`${QUOTA_API_BASE_URL}/transfer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            throw new Error(`Erreur HTTP ${response.status} lors du transfert de quotas: ${errorData}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors du transfert de quotas:', error);
        throw error;
    }
};

/**
 * Récupère l'historique des transferts de quotas pour un utilisateur
 */
export const fetchTransferHistory = async (userId: string): Promise<QuotaTransferHistory[]> => {
    try {
        const response = await fetch(`${QUOTA_API_BASE_URL}/transfer/history?userId=${userId}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            throw new Error(`Erreur HTTP ${response.status} lors de la récupération de l'historique des transferts: ${errorData}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique des transferts:', error);
        throw error;
    }
};

/**
 * Vérifie si un transfert est possible et calcule le montant cible
 */
export const previewQuotaTransfer = async (request: QuotaTransferRequest): Promise<QuotaTransferResult> => {
    try {
        const response = await fetch(`${QUOTA_API_BASE_URL}/transfer/preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            throw new Error(`Erreur HTTP ${response.status} lors de la simulation du transfert: ${errorData}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la simulation du transfert:', error);
        throw error;
    }
};

/**
 * Récupère toutes les règles de report de quotas
 */
export const fetchCarryOverRules = async (): Promise<QuotaCarryOverRule[]> => {
    try {
        const response = await fetch(`${QUOTA_API_BASE_URL}/carry-over-rules`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            throw new Error(`Erreur HTTP ${response.status} lors de la récupération des règles de report: ${errorData}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération des règles de report:', error);
        throw error;
    }
};

/**
 * Récupère les règles de report actives pour un utilisateur
 */
export const fetchActiveCarryOverRulesForUser = async (userId: string): Promise<QuotaCarryOverRule[]> => {
    try {
        const response = await fetch(`${QUOTA_API_BASE_URL}/carry-over-rules/active?userId=${userId}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            throw new Error(`Erreur HTTP ${response.status} lors de la récupération des règles de report actives: ${errorData}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération des règles de report actives:', error);
        throw error;
    }
};

/**
 * Crée ou met à jour une règle de report
 */
export const saveCarryOverRule = async (rule: Partial<QuotaCarryOverRule>): Promise<QuotaCarryOverRule> => {
    try {
        const method = rule.id ? 'PUT' : 'POST';
        const url = rule.id
            ? `${QUOTA_API_BASE_URL}/carry-over-rules/${rule.id}`
            : `${QUOTA_API_BASE_URL}/carry-over-rules`;

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rule),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            throw new Error(`Erreur HTTP ${response.status} lors de l'enregistrement de la règle de report: ${errorData}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la règle de report:', error);
        throw error;
    }
};

/**
 * Calcule le report de quotas pour un utilisateur
 */
export const calculateCarryOver = async (request: QuotaCarryOverCalculationRequest): Promise<QuotaCarryOverCalculationResult> => {
    try {
        const response = await fetch(`${QUOTA_API_BASE_URL}/carry-over/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            throw new Error(`Erreur HTTP ${response.status} lors du calcul du report: ${errorData}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors du calcul du report:', error);
        throw error;
    }
};

/**
 * Effectue le report de quotas pour un utilisateur
 */
export const executeCarryOver = async (request: QuotaCarryOverCalculationRequest): Promise<QuotaCarryOverHistory> => {
    try {
        const response = await fetch(`${QUOTA_API_BASE_URL}/carry-over/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            throw new Error(`Erreur HTTP ${response.status} lors de l'exécution du report: ${errorData}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de l\'exécution du report:', error);
        throw error;
    }
};

/**
 * Récupère l'historique des reports de quotas pour un utilisateur
 */
export const fetchCarryOverHistory = async (userId: string): Promise<QuotaCarryOverHistory[]> => {
    try {
        const response = await fetch(`${QUOTA_API_BASE_URL}/carry-over/history?userId=${userId}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            throw new Error(`Erreur HTTP ${response.status} lors de la récupération de l'historique des reports: ${errorData}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique des reports:', error);
        throw error;
    }
};

/**
 * Récupère toutes les règles de périodes spéciales
 */
export const fetchSpecialPeriodRules = async (): Promise<SpecialPeriodRule[]> => {
    try {
        const response = await fetch(`${QUOTA_API_BASE_URL}/special-periods`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            throw new Error(`Erreur HTTP ${response.status} lors de la récupération des périodes spéciales: ${errorData}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération des périodes spéciales:', error);
        throw error;
    }
};

/**
 * Crée ou met à jour une règle de période spéciale
 */
export const saveSpecialPeriodRule = async (rule: Partial<SpecialPeriodRule>): Promise<SpecialPeriodRule> => {
    try {
        const method = rule.id ? 'PUT' : 'POST';
        const url = rule.id
            ? `${QUOTA_API_BASE_URL}/special-periods/${rule.id}`
            : `${QUOTA_API_BASE_URL}/special-periods`;

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(rule),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.statusText);
            throw new Error(`Erreur HTTP ${response.status} lors de l'enregistrement de la période spéciale: ${errorData}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la période spéciale:', error);
        throw error;
    }
};

/**
 * Vérifie si une date est dans une période spéciale
 */
export const isInSpecialPeriod = (
    date: Date,
    specialPeriod: SpecialPeriodRule
): boolean => {
    const year = date.getFullYear();
    const targetYear = specialPeriod.specificYear || year;

    // Créer des dates pour la période
    const startDate = new Date(targetYear, specialPeriod.startMonth - 1, specialPeriod.startDay);
    const endDate = new Date(targetYear, specialPeriod.endMonth - 1, specialPeriod.endDay, 23, 59, 59);

    // Gérer le cas où la période chevauche deux années
    if (specialPeriod.startMonth > specialPeriod.endMonth) {
        if (date.getMonth() + 1 >= specialPeriod.startMonth) {
            // Si on est après le mois de début, on est dans l'année de début
            return isWithinInterval(date, {
                start: startDate,
                end: new Date(targetYear, 11, 31, 23, 59, 59)
            });
        } else {
            // Sinon on vérifie si on est dans la période qui déborde sur l'année suivante
            return isWithinInterval(date, {
                start: new Date(targetYear - 1, specialPeriod.startMonth - 1, specialPeriod.startDay),
                end: endDate
            });
        }
    }

    // Cas standard (période dans la même année)
    return isWithinInterval(date, { start: startDate, end: endDate });
};

/**
 * Retourne les périodes spéciales actives pour une date donnée
 */
export const getActiveSpecialPeriodsForDate = async (date: Date): Promise<SpecialPeriodRule[]> => {
    try {
        const allPeriods = await fetchSpecialPeriodRules();
        return allPeriods.filter(period =>
            period.isActive && isInSpecialPeriod(date, period)
        );
    } catch (error) {
        console.error('Erreur lors de la récupération des périodes spéciales actives:', error);
        throw error;
    }
};

/**
 * Vérifier si une règle de transfert est applicable actuellement
 */
export const isTransferRuleApplicable = (rule: QuotaTransferRule): boolean => {
    // Vérifier si la règle est active
    if (!rule.isActive) return false;

    const now = new Date();

    // Vérifier si la règle est dans sa période de validité
    if (rule.startDate && rule.startDate > now) return false;
    if (rule.endDate && rule.endDate < now) return false;

    // Vérifier les périodes saisonnières si la règle est de type SEASONAL
    if (rule.ruleType === QuotaTransferRuleType.SEASONAL && rule.seasonalPeriods) {
        // La règle est applicable si au moins une période saisonnière est active
        return rule.seasonalPeriods.some(period => {
            const year = period.specificYear || now.getFullYear();
            const startDate = new Date(year, period.startMonth - 1, period.startDay);
            const endDate = new Date(year, period.endMonth - 1, period.endDay, 23, 59, 59);

            return isWithinInterval(now, { start: startDate, end: endDate });
        });
    }

    // Si tous les contrôles sont passés, la règle est applicable
    return true;
};

/**
 * Effectue un transfert de quota en mode simulation (sans API)
 * À des fins de démonstration et de test
 */
export const simulateQuotaTransfer = async (
    request: QuotaTransferRequest,
    rules: QuotaTransferRule[] = []
): Promise<QuotaTransferResult> => {
    // Récupérer le solde actuel de l'utilisateur
    const balance = await fetchLeaveBalance(request.userId);

    // Trouver les quotas pertinents
    const sourceTypeDetails = balance.detailsByType[request.sourceType] || { used: 0, pending: 0 };
    const targetTypeDetails = balance.detailsByType[request.targetType] || { used: 0, pending: 0 };

    const sourceQuota = getQuotaForType(balance, request.sourceType);

    // Vérifier si le montant demandé est disponible
    if (request.sourceAmount > sourceQuota.remaining) {
        return {
            success: false,
            sourceAmount: 0,
            targetAmount: 0,
            sourceRemaining: sourceQuota.remaining,
            targetTotal: getQuotaForType(balance, request.targetType).total,
            message: `Montant insuffisant. Il reste ${sourceQuota.remaining} jours disponibles pour le type source.`
        };
    }

    // Trouver la règle applicable
    let applicableRule: QuotaTransferRule | undefined;

    if (rules.length > 0) {
        applicableRule = rules.find(rule =>
            rule.sourceType === request.sourceType &&
            rule.targetType === request.targetType &&
            isTransferRuleApplicable(rule)
        );
    }

    // Si aucune règle trouvée, utiliser un ratio par défaut de 1:1
    const ratio = applicableRule?.ratio || 1.0;

    // Calculer le montant cible
    const targetAmount = request.sourceAmount / ratio;

    // Simuler la mise à jour des quotas
    const sourceRemaining = sourceQuota.remaining - request.sourceAmount;
    const targetTotal = getQuotaForType(balance, request.targetType).total + targetAmount;

    return {
        success: true,
        transferId: uuidv4(), // Simuler un ID
        sourceAmount: request.sourceAmount,
        targetAmount,
        sourceRemaining,
        targetTotal,
        appliedRule: applicableRule,
        message: `Transfert de ${request.sourceAmount} jours de ${getLeaveTypeLabel(request.sourceType)} vers ${getLeaveTypeLabel(request.targetType)} avec un ratio de ${ratio}.`
    };
};

/**
 * Effectue un calcul de report de quota en mode simulation (sans API)
 * À des fins de démonstration et de test
 */
export const simulateCarryOverCalculation = async (
    request: QuotaCarryOverCalculationRequest,
    rules: QuotaCarryOverRule[] = []
): Promise<QuotaCarryOverCalculationResult> => {
    // Récupérer le solde actuel de l'utilisateur
    const balance = await fetchLeaveBalance(request.userId);

    // Trouver le quota pour le type concerné
    const quota = getQuotaForType(balance, request.leaveType);
    const remaining = quota.remaining;

    // Trouver la règle applicable
    let applicableRule: QuotaCarryOverRule | undefined;

    if (rules.length > 0) {
        applicableRule = rules.find(rule =>
            rule.leaveType === request.leaveType &&
            rule.isActive
        );
    }

    // Si aucune règle trouvée, utiliser une règle par défaut (50% avec expiration à 6 mois)
    const ruleType = applicableRule?.ruleType || QuotaCarryOverRuleType.PERCENTAGE;
    const value = applicableRule?.value || 50; // 50% par défaut
    const expiryMonths = applicableRule?.expiryMonths || 6;

    // Calculer le montant éligible au report
    let eligibleForCarryOver = 0;

    switch (ruleType) {
        case QuotaCarryOverRuleType.PERCENTAGE:
            eligibleForCarryOver = remaining * (value / 100);
            break;
        case QuotaCarryOverRuleType.FIXED:
            eligibleForCarryOver = Math.min(remaining, value);
            break;
        case QuotaCarryOverRuleType.MAX_DAYS:
            eligibleForCarryOver = Math.min(remaining, value);
            break;
        case QuotaCarryOverRuleType.ALL:
            eligibleForCarryOver = remaining;
            break;
    }

    // Arrondir à 0.5 près (car souvent les jours de congés sont comptés en demi-journées)
    eligibleForCarryOver = Math.round(eligibleForCarryOver * 2) / 2;

    // Calculer la date d'expiration
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(now.getMonth() + expiryMonths);

    return {
        originalRemaining: remaining,
        eligibleForCarryOver,
        carryOverAmount: eligibleForCarryOver,
        expiryDate,
        appliedRule: applicableRule,
        message: `Report de ${eligibleForCarryOver} jours de ${getLeaveTypeLabel(request.leaveType)} de ${request.fromYear} à ${request.toYear}. Expiration le ${format(expiryDate, 'dd/MM/yyyy')}.`
    };
};

/**
 * Fonction utilitaire pour obtenir le quota d'un type de congé
 */
const getQuotaForType = (balance: LeaveBalance, type: LeaveType) => {
    const details = balance.detailsByType[type] || { used: 0, pending: 0 };
    let total = 0;

    // Attribuer les quotas par type
    switch (type) {
        case LeaveType.ANNUAL:
            total = balance.initialAllowance;
            break;
        case LeaveType.RECOVERY:
            total = balance.additionalAllowance;
            break;
        case LeaveType.TRAINING:
            total = 5; // Exemple: 5 jours de formation par an
            break;
        default:
            total = 0;
    }

    const used = details.used || 0;
    const pending = details.pending || 0;
    const remaining = Math.max(0, total - used - pending);

    return { total, used, pending, remaining };
};

/**
 * Fonction utilitaire pour obtenir le libellé d'un type de congé
 */
const getLeaveTypeLabel = (type: LeaveType): string => {
    const labels: Record<LeaveType, string> = {
        [LeaveType.ANNUAL]: 'Congés annuels',
        [LeaveType.RECOVERY]: 'Récupération',
        [LeaveType.TRAINING]: 'Formation',
        [LeaveType.SICK]: 'Maladie',
        [LeaveType.MATERNITY]: 'Maternité',
        [LeaveType.SPECIAL]: 'Congés spéciaux',
        [LeaveType.UNPAID]: 'Sans solde',
        [LeaveType.OTHER]: 'Autre',
    };

    return labels[type] || type;
}; 