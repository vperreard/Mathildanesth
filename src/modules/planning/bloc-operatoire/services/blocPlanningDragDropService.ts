import { v4 as uuidv4 } from 'uuid';
import { BlocDayPlanning, BlocRoomAssignment, BlocSupervisor } from '@/types/bloc-planning-types';
import { DragItem, DropTarget, DragDropResult, SupervisorDragItem, PeriodDragItem } from '@/types/bloc-planning-drag-drop';
import { blocPlanningService } from './blocPlanningService';
import { logError } from '@/lib/logger';
import { RuleEngineV2 } from '@/modules/dynamicRules/v2/services/RuleEngineV2';
import { RuleContext } from '@/modules/dynamicRules/v2/types/ruleV2.types';
import { ShiftType } from '@/types/common';

/**
 * Service pour gérer les opérations de glisser-déposer dans le planning du bloc
 */
class BlocPlanningDragDropService {
    private ruleEngine: RuleEngineV2;

    constructor() {
        this.ruleEngine = new RuleEngineV2();
        // Initialiser le moteur de règles de manière asynchrone
        this.ruleEngine.initialize().catch(err => {
            logError({
                message: 'Erreur lors de l\'initialisation du moteur de règles',
                context: { error: err }
            });
        });
    }
    /**
     * Traite une opération de drop d'un élément sur une cible
     */
    async handleDrop(item: DragItem, target: DropTarget, planning: BlocDayPlanning): Promise<DragDropResult> {
        try {
            // Vérifier si le drop est valide
            const validationResult = await this.validateDrop(item, target, planning);
            if (!validationResult.success) {
                return validationResult;
            }

            // Gérer les différents types de drag and drop
            if (item.type === 'SUPERVISEUR' && target.type === 'SALLE') {
                return await this.handleSupervisorToRoomDrop(item as SupervisorDragItem, target, planning);
            } else if (item.type === 'PERIODE' && target.type === 'SALLE') {
                return await this.handlePeriodToRoomDrop(item as PeriodDragItem, target, planning);
            } else if (item.type === 'PLANNING_TEMPLATE' && target.type === 'PLANNING') {
                return await this.handleTemplateToPlanningDrop(item, target, planning);
            }

            // Type de drop non supporté
            return {
                success: false,
                item,
                target,
                error: 'Type de glisser-déposer non pris en charge'
            };
        } catch (error: unknown) {
            logError({
                message: 'Erreur lors du traitement du drop',
                context: { item, target, error }
            });

            return {
                success: false,
                item,
                target,
                error: `Erreur lors du traitement: ${(error as Error).message}`
            };
        }
    }

    /**
     * Valide si un drop est possible
     */
    async validateDrop(item: DragItem, target: DropTarget, planning: BlocDayPlanning): Promise<DragDropResult> {
        // Vérification de base
        if (!planning) {
            return {
                success: false,
                item,
                target,
                error: 'Planning non défini'
            };
        }

        // Vérifier si la salle existe dans le planning
        if (target.type === 'SALLE' && target.salleId) {
            const salleExists = planning.salles.some(salle => salle.salleId === target.salleId);
            if (!salleExists) {
                return {
                    success: false,
                    item,
                    target,
                    error: `La salle ${target.salleId} n'existe pas dans le planning`
                };
            }
        }

        // Vérifier la disponibilité du superviseur si c'est un superviseur
        if (item.type === 'SUPERVISEUR') {
            const supervisorItem = item as SupervisorDragItem;
            if (!supervisorItem.estDisponible) {
                return {
                    success: false,
                    item,
                    target,
                    error: 'Le superviseur n\'est pas disponible pour cette date'
                };
            }

            // Validation avec les règles V2
            if (target.type === 'SALLE' && target.salleId && target.periodeId) {
                const context = this.createRuleContext(supervisorItem, target, planning);
                const ruleResults = await this.ruleEngine.evaluate(context, 'validation');
                
                for (const result of ruleResults) {
                    if (!result.passed && result.actions) {
                        const criticalViolation = result.actions.find(
                            action => action.type === 'validate' && 
                                     action.parameters.severity === 'error'
                        );
                        
                        if (criticalViolation) {
                            return {
                                success: false,
                                item,
                                target,
                                error: criticalViolation.parameters.message || 
                                      `Violation de la règle: ${result.ruleName}`,
                                violations: [{
                                    ruleId: result.ruleId,
                                    ruleName: result.ruleName,
                                    message: criticalViolation.parameters.message
                                }]
                            };
                        }
                    }
                }
            }
        }

        // Par défaut, on considère le drop comme valide
        return {
            success: true,
            item,
            target
        };
    }

    /**
     * Crée un contexte de règle pour la validation
     */
    private createRuleContext(
        item: SupervisorDragItem, 
        target: DropTarget, 
        planning: BlocDayPlanning
    ): RuleContext {
        const salle = planning.salles.find(s => s.salleId === target.salleId);
        
        return {
            date: planning.date,
            user: {
                id: item.superviseurId,
                name: item.nom,
                specialty: item.specialite,
                yearsOfExperience: item.experience || 0
            },
            attribution: {
                type: ShiftType.JOURNEE,
                location: salle?.nomSalle,
                startDate: planning.date,
                endDate: planning.date,
                userId: item.superviseurId
            },
            planning: {
                existingAssignments: planning.salles.flatMap(s => 
                    s.affectations.map(a => ({
                        userId: a.superviseurId,
                        shiftType: ShiftType.JOURNEE,
                        startDate: planning.date,
                        endDate: planning.date,
                        location: s.nomSalle
                    }))
                ),
                proposedAssignments: []
            }
        };
    }

    /**
     * Gère le drop d'un superviseur sur une salle
     */
    async handleSupervisorToRoomDrop(
        item: SupervisorDragItem,
        target: DropTarget,
        planning: BlocDayPlanning
    ): Promise<DragDropResult> {
        try {
            // Trouver l'assignation de salle
            const roomAssignment = planning.salles.find(salle => salle.salleId === target.salleId);
            if (!roomAssignment) {
                return {
                    success: false,
                    item,
                    target,
                    error: `Salle ${target.salleId} non trouvée dans le planning`
                };
            }

            // Créer un nouveau superviseur
            const newSupervisor: BlocSupervisor = {
                id: uuidv4(),
                userId: item.userId,
                role: item.role as any,
                periodes: [
                    {
                        debut: target.debut || '08:00',
                        fin: target.fin || '18:00'
                    }
                ]
            };

            // Ajouter le superviseur à la salle
            roomAssignment.superviseurs.push(newSupervisor);

            // Sauvegarder le planning
            await blocPlanningService.saveDayPlanning(planning);

            return {
                success: true,
                item,
                target,
                newAssignment: {
                    salleId: target.salleId!,
                    superviseurId: newSupervisor.id,
                    debut: newSupervisor.periodes[0].debut,
                    fin: newSupervisor.periodes[0].fin
                }
            };
        } catch (error: unknown) {
            logError({
                message: 'Erreur lors de l\'assignation d\'un superviseur à une salle',
                context: { item, target, error }
            });

            return {
                success: false,
                item,
                target,
                error: `Erreur lors de l'assignation: ${(error as Error).message}`
            };
        }
    }

    /**
     * Gère le drop d'une période sur une salle
     */
    async handlePeriodToRoomDrop(
        item: PeriodDragItem,
        target: DropTarget,
        planning: BlocDayPlanning
    ): Promise<DragDropResult> {
        try {
            // Trouver l'assignation de salle source
            const sourceRoomAssignment = planning.salles.find(salle =>
                salle.superviseurs.some(sup =>
                    sup.periodes.some(p =>
                        sup.id === item.superviseurId &&
                        p.debut === item.debut &&
                        p.fin === item.fin
                    )
                )
            );

            // Trouver l'assignation de salle cible
            const targetRoomAssignment = planning.salles.find(salle => salle.salleId === target.salleId);

            if (!sourceRoomAssignment || !targetRoomAssignment) {
                return {
                    success: false,
                    item,
                    target,
                    error: 'Salle source ou cible non trouvée'
                };
            }

            // Trouver le superviseur et la période à déplacer
            let supervisorFound = false;
            let periodRemoved = false;

            for (const supervisor of sourceRoomAssignment.superviseurs) {
                if (supervisor.id === item.superviseurId) {
                    supervisorFound = true;

                    // Supprimer la période de la source
                    supervisor.periodes = supervisor.periodes.filter(p =>
                        !(p.debut === item.debut && p.fin === item.fin)
                    );

                    periodRemoved = true;

                    // Vérifier si le superviseur existe déjà dans la salle cible
                    const existingSupervisor = targetRoomAssignment.superviseurs.find(
                        sup => sup.userId === supervisor.userId
                    );

                    if (existingSupervisor) {
                        // Ajouter la période au superviseur existant
                        existingSupervisor.periodes.push({
                            debut: item.debut,
                            fin: item.fin
                        });
                    } else {
                        // Créer un nouveau superviseur dans la salle cible
                        const newSupervisor: BlocSupervisor = {
                            id: uuidv4(),
                            userId: supervisor.userId,
                            role: supervisor.role,
                            periodes: [{
                                debut: item.debut,
                                fin: item.fin
                            }]
                        };

                        targetRoomAssignment.superviseurs.push(newSupervisor);
                    }

                    break;
                }
            }

            if (!supervisorFound || !periodRemoved) {
                return {
                    success: false,
                    item,
                    target,
                    error: 'Superviseur ou période non trouvé'
                };
            }

            // Supprimer le superviseur s'il n'a plus de périodes
            sourceRoomAssignment.superviseurs = sourceRoomAssignment.superviseurs.filter(
                sup => sup.periodes.length > 0
            );

            // Sauvegarder le planning
            await blocPlanningService.saveDayPlanning(planning);

            return {
                success: true,
                item,
                target,
                newAssignment: {
                    salleId: target.salleId!,
                    superviseurId: item.superviseurId,
                    debut: item.debut,
                    fin: item.fin
                }
            };
        } catch (error: unknown) {
            logError({
                message: 'Erreur lors du déplacement d\'une période',
                context: { item, target, error }
            });

            return {
                success: false,
                item,
                target,
                error: `Erreur lors du déplacement: ${(error as Error).message}`
            };
        }
    }

    /**
     * Gère le drop d'une trameModele sur un planning
     */
    async handleTemplateToPlanningDrop(
        item: DragItem,
        target: DropTarget,
        planning: BlocDayPlanning
    ): Promise<DragDropResult> {
        try {
            if (item.type !== 'PLANNING_TEMPLATE') {
                return {
                    success: false,
                    item,
                    target,
                    error: 'Type d\'élément invalide'
                };
            }

            // Pour chaque affectation de la trameModele, créer une affectation dans le planning
            for (const affectation of item.affectations) {
                // Vérifier si la salle existe déjà dans le planning
                let roomAssignment = planning.salles.find(salle => salle.salleId === affectation.salleId);

                // Si la salle n'existe pas, la créer
                if (!roomAssignment) {
                    roomAssignment = {
                        id: uuidv4(),
                        salleId: affectation.salleId,
                        superviseurs: []
                    };
                    planning.salles.push(roomAssignment);
                }

                // Ajouter chaque superviseur à la salle
                for (const supervisorTemplate of affectation.superviseurs) {
                    // Créer un nouveau superviseur
                    const newSupervisor: BlocSupervisor = {
                        id: uuidv4(),
                        userId: supervisorTemplate.userId,
                        role: supervisorTemplate.role,
                        periodes: [...supervisorTemplate.periodes]
                    };

                    roomAssignment.superviseurs.push(newSupervisor);
                }
            }

            // Sauvegarder le planning
            await blocPlanningService.saveDayPlanning(planning);

            return {
                success: true,
                item,
                target
            };
        } catch (error: unknown) {
            logError({
                message: 'Erreur lors de l\'application d\'une trameModele',
                context: { item, target, error }
            });

            return {
                success: false,
                item,
                target,
                error: `Erreur lors de l'application de la trameModele: ${(error as Error).message}`
            };
        }
    }
}

export const blocPlanningDragDropService = new BlocPlanningDragDropService(); 