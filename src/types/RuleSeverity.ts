/**
 * Énumération unifiée pour la sévérité des règles
 */
export enum RuleSeverity {
    // Sévérités principales
    ERROR = 'error',
    WARNING = 'warning',
    INFO = 'info',

    // Alias pour la compatibilité avec l'ancien code
    CRITICAL = ERROR,
    MAJOR = WARNING,
    MINOR = INFO,

    // Alias pour la compatibilité avec Prisma
    HIGH = ERROR,
    MEDIUM = WARNING,
    LOW = INFO
}

/**
 * Convertit une sévérité Prisma en RuleSeverity
 */
export function fromPrismaSeverity(severity: 'LOW' | 'MEDIUM' | 'HIGH'): RuleSeverity {
    switch (severity) {
        case 'LOW': return RuleSeverity.LOW;
        case 'MEDIUM': return RuleSeverity.MEDIUM;
        case 'HIGH': return RuleSeverity.HIGH;
        default: return RuleSeverity.WARNING;
    }
}

/**
 * Convertit une RuleSeverity en sévérité Prisma
 */
export function toPrismaSeverity(severity: RuleSeverity): 'LOW' | 'MEDIUM' | 'HIGH' {
    switch (severity) {
        case RuleSeverity.LOW:
        case RuleSeverity.INFO:
            return 'LOW';
        case RuleSeverity.MEDIUM:
        case RuleSeverity.WARNING:
            return 'MEDIUM';
        case RuleSeverity.HIGH:
        case RuleSeverity.ERROR:
            return 'HIGH';
        default:
            return 'MEDIUM';
    }
}

/**
 * Obtient la couleur associée à une sévérité
 */
export function getSeverityColor(severity: RuleSeverity): string {
    switch (severity) {
        case RuleSeverity.ERROR:
        case RuleSeverity.CRITICAL:
        case RuleSeverity.HIGH:
            return '#ff4d4f';
        case RuleSeverity.WARNING:
        case RuleSeverity.MAJOR:
        case RuleSeverity.MEDIUM:
            return '#faad14';
        case RuleSeverity.INFO:
        case RuleSeverity.MINOR:
        case RuleSeverity.LOW:
            return '#1890ff';
        default:
            return '#1890ff';
    }
} 