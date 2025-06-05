import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { AnyRule, RuleConflict, RuleSeverity, RuleType, RuleValidationResult } from '../../../../modules/rules/types/rule';


/**
 * POST /api/rules/validate
 * Valide un ensemble de règles pour détecter des conflits potentiels
 */
export async function POST(request: NextRequest) {
    try {
        const rules = await request.json();

        if (!Array.isArray(rules) && !rules.id) {
            return NextResponse.json(
                { error: 'Format invalide. Fournir une règle ou un tableau de règles à valider' },
                { status: 400 }
            );
        }

        // Convertir une seule règle en tableau
        const rulesToValidate = Array.isArray(rules) ? rules : [rules];

        // Si aucune règle fournie, renvoyer un résultat vide
        if (rulesToValidate.length === 0) {
            return NextResponse.json({
                isValid: true,
                conflicts: []
            });
        }

        // Récupérer toutes les règles actives de la base de données pour la validation
        const existingRules = await prisma.rule.findMany({
            where: {
                isActive: true
            }
        });

        // Liste pour stocker les conflits détectés
        const conflicts: RuleConflict[] = [];

        // Validation de base: vérifier les conflits entre règles
        for (const rule of rulesToValidate) {
            // Vérifier les chevauchements de période pour les règles du même type
            const overlappingRules = existingRules.filter(existingRule =>
                existingRule.id !== rule.id &&
                existingRule.type === rule.type &&
                isTimeOverlap(rule, existingRule)
            );

            // Détecter les conflits spécifiques selon le type de règle
            switch (rule.type) {
                case RuleType.DUTY:
                    await validateDutyRule(rule, existingRules, conflicts);
                    break;
                case RuleType.LEAVE:
                    await validateLeaveRule(rule, existingRules, conflicts);
                    break;
                case RuleType.SUPERVISION:
                    await validateSupervisionRule(rule, existingRules, conflicts);
                    break;
                case RuleType.ASSIGNMENT:
                    await validateAssignmentRule(rule, existingRules, conflicts);
                    break;
                case RuleType.ON_CALL:
                    await validateOnCallRule(rule, existingRules, conflicts);
                    break;
            }
        }

        // Retourner le résultat de la validation
        const validationResult: RuleValidationResult = {
            isValid: conflicts.length === 0,
            conflicts: conflicts.map(conflict => ({
                id: conflict.id || 'temp-' + Math.random().toString(36).substring(2, 9),
                ruleIds: conflict.ruleIds || [],
                description: conflict.description,
                severity: conflict.severity,
                detectedAt: conflict.detectedAt || new Date(),
                resolvedAt: null
            }))
        };

        return NextResponse.json(validationResult);
    } catch (error: unknown) {
        logger.error('Erreur lors de la validation des règles:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Erreur serveur lors de la validation des règles' },
            { status: 500 }
        );
    }
}

/**
 * Vérifie si deux règles se chevauchent dans le temps
 */
function isTimeOverlap(rule1: unknown, rule2: unknown): boolean {
    const validFrom1 = new Date(rule1.validFrom);
    const validTo1 = rule1.validTo ? new Date(rule1.validTo) : null;
    const validFrom2 = new Date(rule2.validFrom);
    const validTo2 = rule2.validTo ? new Date(rule2.validTo) : null;

    // Si l'une des règles n'a pas de date de fin, elle est valide indéfiniment
    if (!validTo1 && !validTo2) return true;
    if (!validTo1) return validFrom1 <= validFrom2 || validFrom1 <= validTo2;
    if (!validTo2) return validFrom2 <= validFrom1 || validFrom2 <= validTo1;

    // Vérifier le chevauchement des périodes
    return (validFrom1 <= validTo2) && (validFrom2 <= validTo1);
}

/**
 * Validation spécifique pour les règles de garde
 */
async function validateDutyRule(rule: unknown, existingRules: unknown[], conflicts: RuleConflict[]): Promise<void> {
    const dutyRules = existingRules.filter(r => r.type === RuleType.DUTY && r.id !== rule.id);

    // Vérifier les conflits de périodes de garde
    for (const existingRule of dutyRules) {
        if (!rule.configuration || !existingRule.configuration) continue;

        // Vérifier les chevauchements de périodes de garde
        const periodsConflict = checkDutyPeriodsOverlap(
            rule.configuration.dutyPeriods,
            existingRule.configuration.dutyPeriods
        );

        if (periodsConflict) {
            conflicts.push({
                id: '',
                ruleIds: [rule.id, existingRule.id],
                description: `Conflit de périodes de garde entre "${rule.name}" et "${existingRule.name}"`,
                severity: RuleSeverity.HIGH,
                detectedAt: new Date()
            });
        }
    }
}

/**
 * Vérifie si des périodes de garde se chevauchent
 */
function checkDutyPeriodsOverlap(periods1: unknown[], periods2: unknown[]): boolean {
    if (!periods1 || !periods2 || !Array.isArray(periods1) || !Array.isArray(periods2)) {
        return false;
    }

    for (const period1 of periods1) {
        for (const period2 of periods2) {
            if (period1.dayOfWeek === period2.dayOfWeek) {
                const start1 = convertTimeToMinutes(period1.startTime);
                const end1 = convertTimeToMinutes(period1.endTime);
                const start2 = convertTimeToMinutes(period2.startTime);
                const end2 = convertTimeToMinutes(period2.endTime);

                if ((start1 <= end2) && (start2 <= end1)) {
                    return true;
                }
            }
        }
    }

    return false;
}

/**
 * Convertit une heure au format "HH:MM" en minutes depuis minuit
 */
function convertTimeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Validation spécifique pour les règles de congé
 */
async function validateLeaveRule(rule: unknown, existingRules: unknown[], conflicts: RuleConflict[]): Promise<void> {
    const leaveRules = existingRules.filter(r => r.type === RuleType.LEAVE && r.id !== rule.id);

    for (const existingRule of leaveRules) {
        if (!rule.configuration || !existingRule.configuration) continue;

        // Vérifier les conflits de restrictions
        const sameRestrictions = hasOverlappingRestrictions(rule, existingRule);

        if (sameRestrictions) {
            conflicts.push({
                id: '',
                ruleIds: [rule.id, existingRule.id],
                description: `Conflit de restrictions de congés entre "${rule.name}" et "${existingRule.name}"`,
                severity: RuleSeverity.MEDIUM,
                detectedAt: new Date()
            });
        }
    }
}

/**
 * Vérifie si deux règles ont des restrictions qui se chevauchent
 */
function hasOverlappingRestrictions(rule1: unknown, rule2: unknown): boolean {
    // Si les deux règles ont les mêmes restrictions de rôle ou de spécialité
    const roleOverlap = hasArrayOverlap(
        rule1.configuration.roleRestrictions,
        rule2.configuration.roleRestrictions
    );

    const specialtyOverlap = hasArrayOverlap(
        rule1.configuration.specialtyRestrictions,
        rule2.configuration.specialtyRestrictions
    );

    // Vérifier les périodes restreintes
    const periodsOverlap = checkRestrictedPeriodsOverlap(
        rule1.configuration.restrictedPeriods,
        rule2.configuration.restrictedPeriods
    );

    return roleOverlap && (specialtyOverlap || periodsOverlap);
}

/**
 * Vérifie si deux tableaux ont des éléments en commun
 */
function hasArrayOverlap(array1: string[], array2: string[]): boolean {
    if (!array1 || !array2 || !Array.isArray(array1) || !Array.isArray(array2)) {
        return false;
    }

    return array1.some(item => array2.includes(item));
}

/**
 * Vérifie si des périodes restreintes se chevauchent
 */
function checkRestrictedPeriodsOverlap(periods1: unknown[], periods2: unknown[]): boolean {
    if (!periods1 || !periods2 || !Array.isArray(periods1) || !Array.isArray(periods2)) {
        return false;
    }

    for (const period1 of periods1) {
        const start1 = new Date(period1.startDate);
        const end1 = new Date(period1.endDate);

        for (const period2 of periods2) {
            const start2 = new Date(period2.startDate);
            const end2 = new Date(period2.endDate);

            if ((start1 <= end2) && (start2 <= end1)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Validation spécifique pour les règles de supervision
 */
async function validateSupervisionRule(rule: unknown, existingRules: unknown[], conflicts: RuleConflict[]): Promise<void> {
    const supervisionRules = existingRules.filter(r => r.type === RuleType.SUPERVISION && r.id !== rule.id);

    for (const existingRule of supervisionRules) {
        if (!rule.configuration || !existingRule.configuration) continue;

        // Vérifier les conflits de rôles de superviseur/supervisé
        const supervisorOverlap = hasArrayOverlap(
            rule.configuration.supervisorRoles,
            existingRule.configuration.supervisorRoles
        );

        const superviseeOverlap = hasArrayOverlap(
            rule.configuration.superviseeRoles,
            existingRule.configuration.superviseeRoles
        );

        if (supervisorOverlap && superviseeOverlap) {
            // Vérifier les périodes de supervision
            const periodsOverlap = checkDutyPeriodsOverlap(
                rule.configuration.supervisionPeriods,
                existingRule.configuration.supervisionPeriods
            );

            if (periodsOverlap) {
                conflicts.push({
                    id: '',
                    ruleIds: [rule.id, existingRule.id],
                    description: `Conflit de périodes de supervision entre "${rule.name}" et "${existingRule.name}"`,
                    severity: RuleSeverity.MEDIUM,
                    detectedAt: new Date()
                });
            }
        }
    }
}

/**
 * Validation spécifique pour les règles d'affectation
 */
async function validateAssignmentRule(rule: unknown, existingRules: unknown[], conflicts: RuleConflict[]): Promise<void> {
    const assignmentRules = existingRules.filter(r => r.type === RuleType.ASSIGNMENT && r.id !== rule.id);

    for (const existingRule of assignmentRules) {
        if (!rule.configuration || !existingRule.configuration) continue;

        // Vérifier les conflits de rôles préférés/restreints
        const preferredOverlap = hasArrayOverlap(
            rule.configuration.preferredRoles,
            existingRule.configuration.restrictedRoles
        );

        if (preferredOverlap) {
            conflicts.push({
                id: '',
                ruleIds: [rule.id, existingRule.id],
                description: `Conflit entre rôles préférés et restreints entre "${rule.name}" et "${existingRule.name}"`,
                severity: RuleSeverity.HIGH,
                detectedAt: new Date()
            });
        }
    }
}

/**
 * Validation spécifique pour les règles de garde
 */
async function validateOnCallRule(rule: unknown, existingRules: unknown[], conflicts: RuleConflict[]): Promise<void> {
    const onCallRules = existingRules.filter(r => r.type === RuleType.ON_CALL && r.id !== rule.id);

    for (const existingRule of onCallRules) {
        if (!rule.configuration || !existingRule.configuration) continue;

        // Vérifier les chevauchements de périodes d'astreinte
        const periodsConflict = checkDutyPeriodsOverlap(
            rule.configuration.onCallPeriods,
            existingRule.configuration.onCallPeriods
        );

        // Vérifier les chevauchements de rôles d'astreinte
        const rolesOverlap = hasArrayOverlap(
            rule.configuration.onCallRoles,
            existingRule.configuration.onCallRoles
        );

        if (periodsConflict && rolesOverlap) {
            conflicts.push({
                id: '',
                ruleIds: [rule.id, existingRule.id],
                description: `Conflit de périodes d'astreinte entre "${rule.name}" et "${existingRule.name}"`,
                severity: RuleSeverity.HIGH,
                detectedAt: new Date()
            });
        }
    }
} 