import { PrismaClient, Prisma, User, Surgeon, OperatingRoom, OperatingSector, Site, Absence, ProfessionalRole, BlocAffectationHabituelle, BlocTramePlanning, BlocDayPlanning, BlocRoomAssignment, BlocStaffAssignment, BlocPlanningConflict, Period, DayOfWeek, WeekType, BlocPlanningStatus, ConflictSeverity, BlocStaffRole, LeaveStatus, IncompatibilityType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
    OperatingRoom as LegacyOperatingRoom,
    OperatingSector as LegacyOperatingSector,
    SupervisionRule,
    BlocDayPlanning as LegacyBlocDayPlanning,
    BlocRoomAssignment as LegacyBlocRoomAssignment,
    BlocPlanningConflict as LegacyBlocPlanningConflict,
    ValidationResult as LegacyValidationResult,
    BlocPlanningStatus as LegacyBlocPlanningStatus,
    SupervisionRuleType,
    BlocPlanningSearchContext,
    BlocPeriod as LegacyBlocPeriod,
    BlocStaffRole as LegacyBlocStaffRole
} from '../models/BlocModels';
import { OperatingRoomSchema, OperatingSectorSchema } from '../models/BlocModels';
import { BlocConfig, TeamConfiguration } from '@/types/team-configuration';
import { getSectorRules, areRoomsContiguous as areRoomsContiguousLib } from '../utils/sectorRulesParser';
// Importer le service de règles de secteur/salle
import { sectorTypeRulesService } from './sectorTypeRules';

jest.mock('@/lib/prisma');


// Type pour les objets vides
interface EmptyObject extends Record<string, never> { }

// Instance Prisma
const prisma = prisma;

// Nouveaux types / interfaces pour la logique de planning V2 (si non générés par Prisma)
export interface CreateOrUpdatePlanningsParams {
    siteId: string;
    startDate: Date;
    endDate: Date;
    trameIds: number[];
    initiatorUserId: number; // Pour audit
}

export interface ValidationEngineResponse {
    isValid: boolean;
    conflicts: BlocPlanningConflict[];
}

/**
 * Service de gestion du planning du bloc opératoire
 */
export class BlocPlanningService {

    constructor() { }

    /**
     * Crée ou met à jour les plannings journaliers du bloc pour un site et une période donnés,
     * en se basant sur des trames.
     */
    async createOrUpdateBlocDayPlanningsFromTrames(params: CreateOrUpdatePlanningsParams): Promise<BlocDayPlanning[]> {
        const { siteId, startDate, endDate, trameIds, initiatorUserId } = params;
        const generatedPlannings: BlocDayPlanning[] = [];

        // 1. Récupérer les trames et leurs affectations habituelles
        const trames = await prisma.blocTramePlanning.findMany({
            where: {
                id: { in: trameIds },
                isActive: true,
            },
            include: { affectations: { include: { user: true, surgeon: true } } }
        });

        if (!trames.length) {
            // Ne pas jeter d'erreur ici, car on peut vouloir créer un planning vide basé sur une période,
            // puis y ajouter des affectations manuellement. Ou alors, la création depuis trames est stricte.
            // Pour l'instant, on retourne un tableau vide si pas de trames fournies et création stricte depuis trames.
            // Si le but est de créer des BlocDayPlanning vides pour la période, il faudrait une autre logique.
            console.warn("Aucune trame active trouvée pour les IDs fournis. Aucun planning ne sera généré ou mis à jour à partir de trames.");
            return [];
            // throw new Error("Aucune trame active trouvée pour les IDs fournis.");
        }

        const allUserIdsInTrames = trames.flatMap((t: BlocTramePlanning & { affectations: (BlocAffectationHabituelle & { user: User | null, surgeon: Surgeon | null })[] }) => t.affectations.map((a: BlocAffectationHabituelle & { user: User | null, surgeon: Surgeon | null }) => a.userId).filter(Boolean) as number[]);
        const allSurgeonIdsInTrames = trames.flatMap((t: BlocTramePlanning & { affectations: (BlocAffectationHabituelle & { user: User | null, surgeon: Surgeon | null })[] }) => t.affectations.map((a: BlocAffectationHabituelle & { user: User | null, surgeon: Surgeon | null }) => a.chirurgienId).filter(Boolean) as number[]);

        const absences = await prisma.absence.findMany({
            where: {
                OR: [
                    { userId: { in: allUserIdsInTrames } },
                    { chirurgienId: { in: allSurgeonIdsInTrames } }
                ],
                startDate: { lte: endDate },
                endDate: { gte: startDate },
                status: LeaveStatus.APPROVED
            }
        });

        // Itérer sur chaque jour de la période demandée
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dayOfWeek = this.mapDateToDayOfWeek(currentDate);
            const weekType = this.getWeekType(currentDate);

            // Trouver ou créer le BlocDayPlanning pour ce jour et ce site
            let blocDayPlanning = await prisma.blocDayPlanning.findUnique({
                where: { siteId_date: { siteId, date: currentDate } },
                include: { assignments: { include: { staffAssignments: true } }, conflicts: true }
            });

            if (!blocDayPlanning) {
                blocDayPlanning = await prisma.blocDayPlanning.create({
                    data: {
                        siteId,
                        date: currentDate,
                        status: BlocPlanningStatus.DRAFT,
                    },
                    include: { assignments: { include: { staffAssignments: true } }, conflicts: true }
                });
            } else if (blocDayPlanning.status !== BlocPlanningStatus.DRAFT) {
                console.warn(`Le planning pour le ${currentDate.toISOString().split('T')[0]} sur le site ${siteId} n'est pas en DRAFT. Il ne sera pas modifié.`);
                currentDate.setDate(currentDate.getDate() + 1);
                if (blocDayPlanning) generatedPlannings.push(blocDayPlanning)
                continue;
            }

            // Supprimer les anciennes affectations et conflits (ou marquer comme obsolètes) pour ce planning DRAFT
            await prisma.blocPlanningConflict.deleteMany({ where: { blocDayPlanningId: blocDayPlanning.id } });
            await prisma.blocStaffAssignment.deleteMany({ where: { blocRoomAssignment: { blocDayPlanningId: blocDayPlanning.id } } });
            await prisma.blocRoomAssignment.deleteMany({ where: { blocDayPlanningId: blocDayPlanning.id } });

            // Appliquer les affectations des trames pour ce jour
            for (const trame of trames) {
                for (const affHab of trame.affectations) {
                    if (affHab.jourSemaine !== dayOfWeek || (affHab.typeSemaine !== WeekType.ALL && affHab.typeSemaine !== weekType)) {
                        continue;
                    }

                    const isUserAbsent = affHab.userId && absences.some(abs => abs.userId === affHab.userId && this.isPersonnelAbsentForPeriod(currentDate, affHab.periode, abs.startDate, abs.endDate));
                    const isSurgeonAbsent = affHab.chirurgienId && absences.some(abs => abs.chirurgienId === affHab.chirurgienId && this.isPersonnelAbsentForPeriod(currentDate, affHab.periode, abs.startDate, abs.endDate));

                    if (isUserAbsent || isSurgeonAbsent) {
                        continue; // Personnel absent
                    }

                    // Créer les affectations dans le BlocDayPlanning
                    if (affHab.typeAffectation === 'BLOC_OPERATION' && affHab.operatingRoomId) {
                        // Pour l'instant, on gère une seule affectation de trame par salle/période.
                        // Une logique de priorité/fusion serait nécessaire si plusieurs trames affectent la même salle.
                        const existingAssignmentForRoomPeriod = await prisma.blocRoomAssignment.findFirst({
                            where: {
                                blocDayPlanningId: blocDayPlanning.id,
                                operatingRoomId: affHab.operatingRoomId,
                                period: affHab.periode
                            }
                        });

                        if (existingAssignmentForRoomPeriod) {
                            // TODO: Gestion des conflits de trames pour la même salle/période
                            // Options: Priorité de trame, première arrivée, fusion manuelle, ou générer un conflit.
                            // Pour V1: Générer un conflit d'avertissement.
                            console.warn(`Conflit de trame: Salle ${affHab.operatingRoomId} déjà assignée pour ${affHab.periode} le ${currentDate.toISOString().split('T')[0]}. Trame ${trame.id}, Affectation ${affHab.id}. La première affectation de trame est conservée.`);

                            // Création d'un conflit pour notifier l'utilisateur
                            await prisma.blocPlanningConflict.create({
                                data: {
                                    blocDayPlanningId: blocDayPlanning.id,
                                    relatedRoomAssignmentId: existingAssignmentForRoomPeriod.id, // Lier au premier assignment
                                    relatedStaffAssignmentId: null,
                                    relatedUserId: null,
                                    relatedSurgeonId: null,
                                    type: 'TRAME_OVERLAP_WARNING',
                                    message: `Conflit de trame : Plusieurs trames (${existingAssignmentForRoomPeriod.sourceBlocTrameAffectationId ? `provenant de l'affectation de trame ID ${existingAssignmentForRoomPeriod.sourceBlocTrameAffectationId}` : 'origine inconnue'} et trame ID ${trame.id} / affectation ID ${affHab.id}) tentent d'affecter la salle ID ${affHab.operatingRoomId} pour la période ${affHab.periode}. La première affectation a été conservée.`,
                                    severity: ConflictSeverity.WARNING,
                                    isResolved: false, isForceResolved: false,
                                    resolvedAt: null, resolvedByUserId: null, resolutionNotes: null,
                                    forceResolvedAt: null, forceResolvedByUserId: null, forceResolutionNotes: null
                                }
                            });
                            continue; // On garde la première affectation trouvée et on ne la remplace pas
                        }

                        const roomAssignment = await prisma.blocRoomAssignment.create({
                            data: {
                                blocDayPlanningId: blocDayPlanning.id,
                                operatingRoomId: affHab.operatingRoomId,
                                period: affHab.periode,
                                chirurgienId: affHab.chirurgienId,
                                expectedSpecialty: affHab.specialiteChir,
                                sourceBlocTrameAffectationId: affHab.id,
                            }
                        });

                        // Si l'affectation habituelle concerne un User (MAR/IADE) directement pour cette salle de bloc
                        if (affHab.userId && affHab.roleInAffectation) {
                            await prisma.blocStaffAssignment.create({
                                data: {
                                    blocRoomAssignmentId: roomAssignment.id,
                                    userId: affHab.userId,
                                    role: affHab.roleInAffectation as BlocStaffRole, // Assumer que le rôle est compatible
                                    isPrimaryAnesthetist: affHab.roleInAffectation === 'ANESTHETISTE_PRINCIPAL_MAR' // Exemple
                                }
                            });
                        }
                    }
                    // TODO: Gérer autres typeAffectation (CONSULTATION, GARDE, ASTREINTE)
                    // Ces affectations ne vont pas dans BlocRoomAssignment mais pourraient générer des contraintes
                    // ou être stockées dans un autre modèle (GeneralAssignment)
                }
            }

            // Valider le planning fraîchement généré/mis à jour
            const validationResult = await this.validateEntireBlocDayPlanning(blocDayPlanning.id);
            // Le statut pourrait être mis à jour ici en fonction des conflits (ex: DRAFT_WITH_ERRORS)

            generatedPlannings.push(await this.getBlocDayPlanningById(blocDayPlanning.id) as BlocDayPlanning); // Re-fetch avec toutes les inclusions
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return generatedPlannings;
    }

    /**
     * Récupère un planning journalier par son ID avec toutes ses relations.
     */
    async getBlocDayPlanningById(planningId: string): Promise<BlocDayPlanning & { site: Site, assignments: (BlocRoomAssignment & { operatingRoom: OperatingRoom & { operatingSector: OperatingSector | null }, surgeon: Surgeon | null, staffAssignments: (BlocStaffAssignment & { user: User | null })[] })[], conflicts: BlocPlanningConflict[] } | null> {
        return prisma.blocDayPlanning.findUnique({
            where: { id: planningId },
            include: {
                site: true,
                assignments: {
                    include: {
                        operatingRoom: { include: { operatingSector: true } }, // Modifié ici
                        surgeon: true,
                        staffAssignments: { include: { user: true } }
                    }
                },
                conflicts: true
            }
        });
    }

    /**
     * Récupère les plannings pour un site et une période donnée.
     */
    async getBlocDayPlanningsBySiteAndDateRange(siteId: string, startDate: Date, endDate: Date): Promise<BlocDayPlanning[]> {
        return prisma.blocDayPlanning.findMany({
            where: {
                siteId: siteId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                site: true,
                assignments: {
                    include: {
                        operatingRoom: { include: { operatingSector: true } }, // Modifié ici
                        surgeon: true,
                        staffAssignments: { include: { user: true } }
                    }
                },
                conflicts: true
            },
            orderBy: { date: 'asc' }
        });
    }

    /**
     * Valide l'ensemble d'un planning journalier et sauvegarde les conflits.
     */
    async validateEntireBlocDayPlanning(planningId: string): Promise<ValidationEngineResponse> {
        const conflictsToCreate: Prisma.BlocPlanningConflictCreateManyInput[] = [];

        // Valeurs de configuration globales (à terme, à récupérer d'une config plus dynamique)
        const MAX_SALLES_SUPERVISEES_MAR_GLOBAL = 3;
        const MAX_SALLES_EN_PRINCIPAL_MAR_GLOBAL = 1;

        const planningData = await prisma.blocDayPlanning.findUnique({
            where: { id: planningId },
            include: {
                site: true, // Accès direct aux champs de Site, pas de sous-relation siteConfiguration
                assignments: {
                    include: {
                        operatingRoom: { include: { operatingSector: true } }, // Modifié ici
                        surgeon: true,
                        staffAssignments: {
                            include: {
                                user: true // Accès direct aux champs de User (comme canSuperviseOphtalmo)
                            }
                        }
                    }
                },
            }
        });

        if (!planningData) {
            console.error(`[Validation Engine] Planning with id ${planningId} not found.`);
            return { isValid: false, conflicts: [] };
        }

        const planning = planningData as Omit<NonNullable<typeof planningData>, 'site'> & {
            site: NonNullable<typeof planningData.site>; // Assurer que site est non-null si planningData est là
        };

        if (!planning.site) { // Ce check est redondant si siteId est obligatoire et valide
            console.error(`[Validation Engine] Planning with id ${planningId} has missing critical data (site).`);
            return { isValid: false, conflicts: [] };
        }

        const { date } = planning;
        const site = planning.site; // Garanti non-null par le typage et le check ci-dessus
        const assignments = planning.assignments;

        // Règle 1: Personnel Absent (MAR, IADE, Chirurgien)
        for (const assignment of assignments) {
            const period = assignment.period;

            if (assignment.chirurgienId && assignment.surgeon) {
                const surgeonAbsences = await prisma.absence.findMany({
                    where: {
                        chirurgienId: assignment.chirurgienId,
                        startDate: { lte: date },
                        endDate: { gte: date },
                        status: LeaveStatus.APPROVED,
                    }
                });
                for (const absence of surgeonAbsences) {
                    // Appel corrigé : retire absence.startPeriod et absence.endPeriod
                    if (this.isPersonnelAbsentForPeriod(date, period, absence.startDate, absence.endDate)) {
                        conflictsToCreate.push({
                            blocDayPlanningId: planning.id,
                            relatedRoomAssignmentId: assignment.id,
                            relatedSurgeonId: assignment.chirurgienId,
                            type: 'PERSONNEL_ABSENT',
                            message: `Le chirurgien ${assignment.surgeon.prenom} ${assignment.surgeon.nom} (ID: ${assignment.chirurgienId}) est absent (${absence.reason}) pendant la période ${period} le ${date.toISOString().split('T')[0]}. Absence du ${absence.startDate.toISOString().split('T')[0]} au ${absence.endDate.toISOString().split('T')[0]}.`, // Correction: lastName -> nom
                            severity: ConflictSeverity.ERROR,
                            isResolved: false,
                        });
                    }
                }
            }

            for (const staff of assignment.staffAssignments) {
                if (staff.userId && staff.user) {
                    const userAbsences = await prisma.absence.findMany({
                        where: {
                            userId: staff.userId,
                            startDate: { lte: date },
                            endDate: { gte: date },
                            status: LeaveStatus.APPROVED,
                        }
                    });
                    for (const absence of userAbsences) {
                        // Appel corrigé : retire absence.startPeriod et absence.endPeriod
                        if (this.isPersonnelAbsentForPeriod(date, period, absence.startDate, absence.endDate)) {
                            conflictsToCreate.push({
                                blocDayPlanningId: planning.id,
                                relatedStaffAssignmentId: staff.id,
                                relatedUserId: staff.userId,
                                type: 'PERSONNEL_ABSENT',
                                message: `L'utilisateur ${staff.user.prenom} ${staff.user.nom} (ID: ${staff.userId}, Rôle: ${staff.role}) est absent (${absence.reason}) pendant la période ${period} le ${date.toISOString().split('T')[0]}. Absence du ${absence.startDate.toISOString().split('T')[0]} au ${absence.endDate.toISOString().split('T')[0]}.`, // Correction: name -> prenom, nom
                                severity: ConflictSeverity.ERROR,
                                isResolved: false,
                            });
                        }
                    }
                }
            }
        }
        // Fin Règle 1


        // Règle 2: Double Affectation du Personnel (MAR, IADE)
        const staffAssignmentsByPeriod: { [key in Period]?: { [userId: number]: { assignment: BlocStaffAssignment & { user: User | null }, room: OperatingRoom, roomAssignmentId: string }[] } } = {};

        for (const roomAssignment of assignments) {
            if (!roomAssignment.operatingRoom) {
                console.warn(`[Validation R2] Room assignment ${roomAssignment.id} for planning ${planning.id} has no operating room data. Skipping.`);
                continue;
            }
            const period = roomAssignment.period;
            if (!staffAssignmentsByPeriod[period]) {
                staffAssignmentsByPeriod[period] = {};
            }

            for (const staff of roomAssignment.staffAssignments) {
                if (staff.userId && staff.user) {
                    if (!staffAssignmentsByPeriod[period]![staff.userId]) {
                        staffAssignmentsByPeriod[period]![staff.userId] = [];
                    }
                    staffAssignmentsByPeriod[period]![staff.userId].push({
                        assignment: staff as BlocStaffAssignment & { user: User },
                        room: roomAssignment.operatingRoom,
                        roomAssignmentId: roomAssignment.id
                    });
                }
            }
        }

        for (const periodKey of Object.keys(staffAssignmentsByPeriod)) {
            const period = periodKey as Period;
            const usersInPeriod = staffAssignmentsByPeriod[period];
            if (!usersInPeriod) continue;

            for (const userIdStr of Object.keys(usersInPeriod)) {
                const userId = parseInt(userIdStr, 10);
                if (isNaN(userId) || !Object.prototype.hasOwnProperty.call(usersInPeriod, userIdStr)) continue;

                const assignmentsForUser = usersInPeriod[userId];

                if (assignmentsForUser && assignmentsForUser.length > 1) {
                    const user = assignmentsForUser[0].assignment.user;
                    const roomNames = assignmentsForUser.map(a => `${a.room.name} (ID: ${a.room.id})`).join(', ');

                    // Début Solution Palliative pour isFivOrConsultation (R2)
                    // TODO: Remplacer par une méthode fiable (champ dédié sur OperatingRoom ou via allowedSpecialties/supervisionRules)
                    let isSpecialOrConsultation = false;
                    if (user && assignmentsForUser.some(a => {
                        const roomType = a.room && 'type' in a.room ? a.room.type : undefined;
                        if (roomType) {
                            return roomType === 'CONSULTATION' || roomType === 'GARDE' || roomType === 'ASTREINTE';
                        }
                        const roomName = a.room?.name || '';
                        return typeof roomName === 'string' && (
                            roomName.toLowerCase().includes('consultation') ||
                            roomName.toLowerCase().includes('consult') ||
                            roomName.toLowerCase().includes('garde') ||
                            roomName.toLowerCase().includes('astreinte')
                        );
                    })) {
                        isSpecialOrConsultation = true;
                    }
                    // Fin Solution Palliative

                    const severity = isSpecialOrConsultation ? ConflictSeverity.WARNING : ConflictSeverity.ERROR;
                    const message = `L'utilisateur ${user?.prenom || ''} ${user?.nom || `ID ${userId}`} est affecté à plusieurs salles (${roomNames}) sur la période ${period} le ${date.toISOString().split('T')[0]}. ${isSpecialOrConsultation ? 'Une des salles est de type spécial (Consultation/Garde/Astreinte), générant un avertissement.' : 'Cela constitue une double affectation bloquante.'}`;

                    conflictsToCreate.push({
                        blocDayPlanningId: planning.id,
                        relatedUserId: userId,
                        // On pourrait lier à la première affectation problématique, ou créer un conflit par affectation.
                        // Pour garder simple, un conflit par utilisateur doublement affecté par période.
                        // relatedStaffAssignmentId: assignmentsForUser[0].assignment.id, 
                        type: 'DOUBLE_AFFECTATION_PERSONNEL',
                        message,
                        severity,
                        isResolved: false,
                    });
                }
            }
        }
        // Fin Règle 2


        // Règle 3: Max Salles Supervisées par MAR (selon config)
        // (Précisions : 1 principale + 2 supervisions IADE, OU 3 supervisions IADE seules)
        // const config = site.siteConfiguration; // Incorrect, siteConfiguration n'existe pas directement
        const maxSallesSuperviseesGlobal = MAX_SALLES_SUPERVISEES_MAR_GLOBAL;
        const maxSallesEnPrincipalMAR = MAX_SALLES_EN_PRINCIPAL_MAR_GLOBAL;

        // V1 specific limits - ideally these would come from config (e.g. sector.rules or site.configuration)
        const maxSallesSuperviseesEndoMAR = 2;
        const maxSallesSuperviseesOphtalmoMAR = 3;

        const marAssignmentsByPeriod: {
            [key in Period]?: {
                [userId: number]: {
                    primaryCount: number,
                    supervisionCount: number,
                    supervisionEndoCount: number, // Added for R3/R8 Endo specific
                    supervisionOphtalmoCount: number, // Added for R3/R8 Ophtalmo specific
                    supervisionStandardCount: number, // Added for R8 Ophtalmo specific
                    isPrincipalInOphtalmo: boolean, // Added for R8 Ophtalmo specific
                    assignments: (BlocStaffAssignment & { user: User | null, room: OperatingRoom & { operatingSector: OperatingSector | null } })[]
                }
            }
        } = {};

        for (const roomAssignment of assignments) {
            if (!roomAssignment.operatingRoom || !roomAssignment.operatingRoom.operatingSector) continue; // Sector is needed for type // Modifié ici
            const period = roomAssignment.period;
            const sectorType = roomAssignment.operatingRoom.operatingSector && // Modifié ici
                'category' in roomAssignment.operatingRoom.operatingSector && // Modifié ici
                typeof roomAssignment.operatingRoom.operatingSector.category === 'string' // Modifié ici
                ? roomAssignment.operatingRoom.operatingSector.category // Modifié ici
                : this.getSectorTypeFromName(roomAssignment.operatingRoom.operatingSector?.name || ''); // Modifié ici

            if (!marAssignmentsByPeriod[period]) {
                marAssignmentsByPeriod[period] = {};
            }

            for (const staff of roomAssignment.staffAssignments) {
                if (staff.userId && staff.role === BlocStaffRole.MAR && staff.user) {
                    if (!marAssignmentsByPeriod[period]![staff.userId]) {
                        marAssignmentsByPeriod[period]![staff.userId] = {
                            primaryCount: 0,
                            supervisionCount: 0,
                            supervisionEndoCount: 0,
                            supervisionOphtalmoCount: 0,
                            supervisionStandardCount: 0,
                            isPrincipalInOphtalmo: false,
                            assignments: []
                        };
                    }

                    const marRecord = marAssignmentsByPeriod[period]![staff.userId];
                    if (staff.isPrimaryAnesthetist) {
                        marRecord.primaryCount++;
                        if (sectorType === 'OPHTALMOLOGIE') {
                            marRecord.isPrincipalInOphtalmo = true;
                        }
                    } else {
                        marRecord.supervisionCount++;
                        if (sectorType === 'ENDOSCOPIE') {
                            marRecord.supervisionEndoCount++;
                        } else if (sectorType === 'OPHTALMOLOGIE') {
                            marRecord.supervisionOphtalmoCount++;
                        } else {
                            marRecord.supervisionStandardCount++;
                        }
                    }
                    // Explicitly cast room to include sector for type safety
                    const roomWithSector = roomAssignment.operatingRoom as OperatingRoom & { operatingSector: OperatingSector | null }; // Modifié ici
                    marRecord.assignments.push({ ...staff, room: roomWithSector });
                }
            }
        }

        for (const period of Object.keys(marAssignmentsByPeriod) as Period[]) {
            const marsInPeriod = marAssignmentsByPeriod[period as Period];
            if (!marsInPeriod) continue;
            for (const userIdStr of Object.keys(marsInPeriod)) {
                const userId = parseInt(userIdStr, 10);
                const marData = marsInPeriod[userId];
                const user = marData.assignments[0]?.user; // Récupérer l'info utilisateur

                // Conflit si plus de salles en principal que permis
                if (marData.primaryCount > maxSallesEnPrincipalMAR) {
                    conflictsToCreate.push({
                        blocDayPlanningId: planning.id,
                        relatedUserId: userId,
                        type: 'MAR_EXCEED_MAX_SALLES_PRINCIPALES',
                        message: `Le MAR ${user?.prenom || ''} ${user?.nom || `ID ${userId}`} est anesthésiste principal dans ${marData.primaryCount} salles (${marData.assignments.filter(a => a.isPrimaryAnesthetist).map(a => a.room.name).join(', ')}) sur la période ${period}, excédant le maximum de ${maxSallesEnPrincipalMAR}.`, // Correction: name -> prenom, nom
                        severity: ConflictSeverity.ERROR,
                        isResolved: false,
                    });
                }

                // Calculer l'impact total basé sur la règle (1P + 2S ou 3S)
                // Si 1P est déjà pris, il reste X-1 pour supervision. Sinon, X pour supervision.
                // La règle la plus simple est un nombre global max de salles "touchées".
                // Si la config est plus fine (ex: 1P autorise N supervisions, 0P autorise M supervisions), adapter ici.
                // Pour l'instant, on utilise `maxSallesSuperviseesGlobal`.
                // Une interprétation plus directe de "1P+2S ou 3S" pour un max global de 3:
                // - Si primaryCount = 1, alors supervisionCount ne doit pas dépasser 2.
                // - Si primaryCount = 0, alors supervisionCount ne doit pas dépasser 3.

                let maxAllowedSupervisions = maxSallesSuperviseesGlobal; // Par défaut 3 supervisions si 0 principal
                if (marData.primaryCount >= maxSallesEnPrincipalMAR) { // Si le MAR a déjà son slot de principal (typiquement 1)
                    maxAllowedSupervisions = maxSallesSuperviseesGlobal - marData.primaryCount; // Alors il lui reste N-P slots pour supervision
                    // Exemple: maxGlobal = 3, maxPrincipal = 1. Si primaryCount = 1, maxAllowedSupervisions = 2.
                }
                // Assurons nous que maxAllowedSupervisions n'est pas négatif si primaryCount > maxSallesSuperviseesGlobal (ce qui serait déjà un conflit)
                maxAllowedSupervisions = Math.max(0, maxAllowedSupervisions);


                if (marData.primaryCount === 0 && marData.supervisionCount > maxSallesSuperviseesGlobal) {
                    conflictsToCreate.push({
                        blocDayPlanningId: planning.id,
                        relatedUserId: userId,
                        type: 'MAR_EXCEED_MAX_SALLES_SUPERVISEES',
                        message: `Le MAR ${user?.prenom || ''} ${user?.nom || `ID ${userId}`} supervise ${marData.supervisionCount} salles (sans être principal ailleurs) sur la période ${period} (${marData.assignments.map(a => a.room.name).join(', ')}), excédant le maximum de ${maxSallesSuperviseesGlobal} supervisions seules.`, // Correction: name -> prenom, nom
                        severity: ConflictSeverity.ERROR,
                        isResolved: false,
                    });
                } else if (marData.primaryCount >= maxSallesEnPrincipalMAR && marData.supervisionCount > maxAllowedSupervisions) {
                    conflictsToCreate.push({
                        blocDayPlanningId: planning.id,
                        relatedUserId: userId,
                        type: 'MAR_EXCEED_MAX_SALLES_SUPERVISEES',
                        message: `Le MAR ${user?.prenom || ''} ${user?.nom || `ID ${userId}`} est principal dans ${marData.primaryCount} salle(s) et supervise ${marData.supervisionCount} autres salles sur la période ${period} (${marData.assignments.map(a => a.room.name).join(', ')}), excédant le maximum de ${maxAllowedSupervisions} supervisions autorisées en plus de l\'activité principale.`, // Correction: name -> prenom, nom
                        severity: ConflictSeverity.ERROR,
                        isResolved: false,
                    });
                }

                // Specific check for Endo supervision count
                if (marData.supervisionEndoCount > maxSallesSuperviseesEndoMAR) {
                    conflictsToCreate.push({
                        blocDayPlanningId: planning.id,
                        relatedUserId: userId,
                        type: 'MAR_EXCEED_MAX_SALLES_SUPERVISEES_ENDO',
                        message: `Le MAR ${user?.prenom || ''} ${user?.nom || `ID ${userId}`} supervise ${marData.supervisionEndoCount} salles d\'endoscopie sur la période ${period}, excédant le maximum de ${maxSallesSuperviseesEndoMAR}.`, // Correction: name -> prenom, nom
                        severity: ConflictSeverity.ERROR,
                        isResolved: false,
                    });
                }

                // Specific check for Ophtalmo supervision count
                if (marData.supervisionOphtalmoCount > maxSallesSuperviseesOphtalmoMAR) {
                    conflictsToCreate.push({
                        blocDayPlanningId: planning.id,
                        relatedUserId: userId,
                        type: 'MAR_EXCEED_MAX_SALLES_SUPERVISEES_OPHTALMO',
                        message: `Le MAR ${user?.prenom || ''} ${user?.nom || `ID ${userId}`} supervise ${marData.supervisionOphtalmoCount} salles d\'ophtalmologie sur la période ${period}, excédant le maximum de ${maxSallesSuperviseesOphtalmoMAR}.`, // Correction: name -> prenom, nom
                        severity: ConflictSeverity.ERROR,
                        isResolved: false,
                    });
                }

                // R8 Ophtalmo specific: Check if MAR principal in Ophtalmo supervises standard bloc rooms
                if (marData.isPrincipalInOphtalmo && marData.supervisionStandardCount > 0) {
                    conflictsToCreate.push({
                        blocDayPlanningId: planning.id,
                        relatedUserId: userId,
                        type: 'MAR_PRINCIPAL_OPHTALMO_SUPERVISING_STANDARD_BLOC',
                        message: `Le MAR ${user?.prenom || ''} ${user?.nom || `ID ${userId}`} est anesthésiste principal en ophtalmologie et supervise également ${marData.supervisionStandardCount} salle(s) de bloc standard sur la période ${period}. Ceci est déconseillé.`, // Correction: name -> prenom, nom
                        severity: ConflictSeverity.WARNING,
                        isResolved: false,
                    });
                }
            }
        }
        // Fin Règle 3 (et une partie de R8 intégrée)


        // TODO: Implémenter les autres règles (R4 à R8)
        // R4: Cohérence Secteurs et Contiguïté
        // R5: Incompatibilités et Préférences Utilisateurs
        // R6: Incompatibilités Chirurgiens
        // R7: Présence et Affectation IADE
        // R8: Règles Spécifiques Ophtalmo/Endoscopie

        // R4: Cohérence Secteurs et Contiguïté
        // Vérifier que les MAR affectés à plusieurs salles dans un même secteur sont dans des salles contiguës
        const contiguityCheckBySector: { [sectorId: string]: { [period: string]: { [userId: number]: OperatingRoom[] } } } = {};

        for (const roomAssignment of assignments) {
            if (!roomAssignment.operatingRoom || !roomAssignment.operatingRoom.operatingSector) continue; // Modifié ici

            const sectorId = roomAssignment.operatingRoom.operatingSector.id; // Modifié ici
            const period = roomAssignment.period;

            if (!contiguityCheckBySector[sectorId]) {
                contiguityCheckBySector[sectorId] = {};
            }

            if (!contiguityCheckBySector[sectorId][period]) {
                contiguityCheckBySector[sectorId][period] = {};
            }

            // Pour chaque MAR affecté à cette salle
            for (const staff of roomAssignment.staffAssignments) {
                if (staff.userId && staff.role === BlocStaffRole.MAR) {
                    if (!contiguityCheckBySector[sectorId][period][staff.userId]) {
                        contiguityCheckBySector[sectorId][period][staff.userId] = [];
                    }
                    contiguityCheckBySector[sectorId][period][staff.userId].push(roomAssignment.operatingRoom);
                }
            }
        }

        // Vérifier les contraintes de contiguïté pour les secteurs qui l'exigent
        for (const sectorId in contiguityCheckBySector) {
            const sector = await prisma.operatingSector.findUnique({
                where: { id: parseInt(sectorId) }
            });

            if (!sector || !sector.rules) continue;

            // Utilisez getSectorRules pour accéder aux propriétés de façon typée
            const sectorRules = getSectorRules(sector.rules);
            if (!sectorRules.requireContiguousRooms) continue;

            for (const period in contiguityCheckBySector[sectorId]) {
                for (const userId in contiguityCheckBySector[sectorId][period]) {
                    const userRooms = contiguityCheckBySector[sectorId][period][parseInt(userId)];

                    if (userRooms.length <= 1) continue;

                    const user = await prisma.user.findUnique({
                        where: { id: parseInt(userId) }
                    });

                    let requiresContiguous = false; // Désactivé par défaut temporairement
                    // La variable sectorRules est déjà initialisée plus haut, pas besoin de la réinitialiser
                    requiresContiguous = sectorRules.requireContiguousRooms === true;

                    if (requiresContiguous) {
                        // Au lieu de cet appel à areRoomsContiguous, utiliser la fonction plus robuste de notre module
                        const roomIds = userRooms.map(r => r.id.toString());
                        const contiguityMap = sectorRules.contiguityMap;
                        const areRoomsContiguous = contiguityMap ? areRoomsContiguousLib(roomIds, contiguityMap) : this.areRoomsContiguousLegacy(userRooms);

                        if (!areRoomsContiguous) {
                            // Créer un conflit pour chaque salle non contiguë
                            for (const roomInViolation of userRooms) { // Renommé room en roomInViolation pour éviter conflit de scope
                                const roomAssignmentForConflict = assignments.find(a => // Renommé roomAssignment
                                    a.operatingRoomId === roomInViolation.id && a.period === period as Period
                                );

                                if (roomAssignmentForConflict) {
                                    conflictsToCreate.push({
                                        blocDayPlanningId: planning.id,
                                        relatedRoomAssignmentId: roomAssignmentForConflict.id,
                                        relatedUserId: parseInt(userId),
                                        type: 'CONTIGUITY_VIOLATION',
                                        message: `Le MAR ${user?.prenom || ''} ${user?.nom || `ID ${userId}`} est affecté à des salles non contiguës (${userRooms.map(r => r.name).join(', ')}) dans le secteur ${sector.name} pour la période ${period}`,
                                        severity: ConflictSeverity.ERROR,
                                        isResolved: false,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        // R5: Incompatibilités et Préférences Utilisateurs
        // Vérification des incompatibilités entre personnel (récupération via méthode privée déjà définie)
        for (const period of Object.keys(Period)) {
            const roomsInPeriod = assignments.filter(a => a.period === period);

            // Pour chaque paire de salles
            for (let i = 0; i < roomsInPeriod.length; i++) {
                const roomA = roomsInPeriod[i];

                // Vérifier les chirurgiens
                const surgeonA = roomA.surgeon;

                for (let j = i + 1; j < roomsInPeriod.length; j++) {
                    const roomB = roomsInPeriod[j];
                    const surgeonB = roomB.surgeon;

                    // Vérifier l'incompatibilité entre les chirurgiens
                    if (surgeonA && surgeonB) {
                        const incompatibilityLevel = await this.getIncompatibilityLevel(
                            undefined, surgeonA.id,
                            undefined, surgeonB.id,
                            date
                        );

                        if (incompatibilityLevel === 'BLOQUANT') {
                            conflictsToCreate.push({
                                blocDayPlanningId: planning.id,
                                relatedRoomAssignmentId: roomA.id,
                                relatedSurgeonId: surgeonA.id,
                                type: 'SURGEON_INCOMPATIBILITY',
                                message: `Incompatibilité bloquante entre les chirurgiens ${surgeonA.prenom} ${surgeonA.nom} et ${surgeonB.prenom} ${surgeonB.nom} sur la période ${period}`,
                                severity: ConflictSeverity.ERROR,
                                isResolved: false,
                            });

                            // Créer également un conflit pour l'autre salle
                            conflictsToCreate.push({
                                blocDayPlanningId: planning.id,
                                relatedRoomAssignmentId: roomB.id,
                                relatedSurgeonId: surgeonB.id,
                                type: 'SURGEON_INCOMPATIBILITY',
                                message: `Incompatibilité bloquante entre les chirurgiens ${surgeonB.prenom} ${surgeonB.nom} et ${surgeonA.prenom} ${surgeonA.nom} sur la période ${period}`,
                                severity: ConflictSeverity.ERROR,
                                isResolved: false,
                            });
                        } else if (incompatibilityLevel === 'PREFERENTIEL') {
                            conflictsToCreate.push({
                                blocDayPlanningId: planning.id,
                                relatedRoomAssignmentId: roomA.id,
                                relatedSurgeonId: surgeonA.id,
                                type: 'SURGEON_PREF_INCOMPATIBILITY',
                                message: `Incompatibilité préférentielle entre les chirurgiens ${surgeonA.prenom} ${surgeonA.nom} et ${surgeonB.prenom} ${surgeonB.nom} sur la période ${period}`,
                                severity: ConflictSeverity.WARNING,
                                isResolved: false,
                            });
                        }
                    }

                    // Vérifier l'incompatibilité entre le personnel médical (MAR, IADE)
                    for (const staffA of roomA.staffAssignments) {
                        if (!staffA.userId) continue;

                        for (const staffB of roomB.staffAssignments) {
                            if (!staffB.userId) continue;

                            // Incompatibilité entre personnel médical
                            const staffIncompatibilityLevel = await this.getIncompatibilityLevel(
                                staffA.userId, undefined,
                                staffB.userId, undefined,
                                date
                            );

                            if (staffIncompatibilityLevel === 'BLOQUANT') {
                                conflictsToCreate.push({
                                    blocDayPlanningId: planning.id,
                                    relatedStaffAssignmentId: staffA.id,
                                    relatedUserId: staffA.userId,
                                    type: 'STAFF_INCOMPATIBILITY',
                                    message: `Incompatibilité bloquante entre les membres du personnel ID ${staffA.userId} et ID ${staffB.userId} sur la période ${period}`,
                                    severity: ConflictSeverity.ERROR,
                                    isResolved: false,
                                });
                            } else if (staffIncompatibilityLevel === 'PREFERENTIEL') {
                                conflictsToCreate.push({
                                    blocDayPlanningId: planning.id,
                                    relatedStaffAssignmentId: staffA.id,
                                    relatedUserId: staffA.userId,
                                    type: 'STAFF_PREF_INCOMPATIBILITY',
                                    message: `Incompatibilité préférentielle entre les membres du personnel ID ${staffA.userId} et ID ${staffB.userId} sur la période ${period}`,
                                    severity: ConflictSeverity.WARNING,
                                    isResolved: false,
                                });
                            }

                            // Vérifier également l'incompatibilité entre chirurgien et personnel médical
                            if (surgeonA) {
                                const surgeonStaffIncompatibilityLevel = await this.getIncompatibilityLevel(
                                    staffB.userId, undefined,
                                    undefined, surgeonA.id,
                                    date
                                );

                                if (surgeonStaffIncompatibilityLevel === 'BLOQUANT') {
                                    conflictsToCreate.push({
                                        blocDayPlanningId: planning.id,
                                        relatedRoomAssignmentId: roomA.id,
                                        relatedSurgeonId: surgeonA.id,
                                        type: 'SURGEON_STAFF_INCOMPATIBILITY',
                                        message: `Incompatibilité bloquante entre le chirurgien ${surgeonA.prenom} ${surgeonA.nom} et le personnel ID ${staffB.userId} sur la période ${period}`,
                                        severity: ConflictSeverity.ERROR,
                                        isResolved: false,
                                    });
                                } else if (surgeonStaffIncompatibilityLevel === 'PREFERENTIEL') {
                                    conflictsToCreate.push({
                                        blocDayPlanningId: planning.id,
                                        relatedRoomAssignmentId: roomA.id,
                                        relatedSurgeonId: surgeonA.id,
                                        type: 'SURGEON_STAFF_PREF_INCOMPATIBILITY',
                                        message: `Incompatibilité préférentielle entre le chirurgien ${surgeonA.prenom} ${surgeonA.nom} et le personnel ID ${staffB.userId} sur la période ${period}`,
                                        severity: ConflictSeverity.WARNING,
                                        isResolved: false,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        // R6: Vérifier la présence obligatoire d'un MAR avec chirurgien
        for (const roomAssignment of assignments) {
            if (roomAssignment.chirurgienId) {
                // Chirurgien présent dans cette salle, vérifier s'il y a un MAR
                const hasMAR = roomAssignment.staffAssignments.some(
                    staff => staff.role === BlocStaffRole.MAR
                );

                if (!hasMAR) {
                    conflictsToCreate.push({
                        blocDayPlanningId: planning.id,
                        relatedRoomAssignmentId: roomAssignment.id,
                        relatedSurgeonId: roomAssignment.chirurgienId,
                        type: 'MISSING_MAR_FOR_SURGEON',
                        message: `Absence de MAR pour le chirurgien dans la salle ${roomAssignment.operatingRoom?.name || roomAssignment.operatingRoomId} pour la période ${roomAssignment.period}`,
                        severity: ConflictSeverity.ERROR,
                        isResolved: false,
                    });
                }
            }
        }

        // R7: Présence et Affectation IADE
        // Vérifier le nombre d'IADEs affectés et leur disponibilité
        const roomsWithIADEDataByPeriod: { [key: string]: { roomAssignment: BlocRoomAssignment, iadeCount: number, marCount: number } } = {};

        for (const roomAssignment of assignments) {
            const key = `${roomAssignment.operatingRoomId}-${roomAssignment.period}`;
            const iadeCount = roomAssignment.staffAssignments.filter(
                staff => staff.role === BlocStaffRole.IADE
            ).length;

            const marCount = roomAssignment.staffAssignments.filter(
                staff => staff.role === BlocStaffRole.MAR
            ).length;

            roomsWithIADEDataByPeriod[key] = { roomAssignment, iadeCount, marCount };

            // Règle: Si un chirurgien est présent, au moins un IADE ou un MAR doit être affecté
            if (roomAssignment.chirurgienId && iadeCount === 0 && marCount === 0) {
                conflictsToCreate.push({
                    blocDayPlanningId: planning.id,
                    relatedRoomAssignmentId: roomAssignment.id,
                    type: 'MISSING_ANESTHESIA_STAFF',
                    message: `Absence de personnel d'anesthésie (IADE ou MAR) pour la salle ${roomAssignment.operatingRoom?.name || roomAssignment.operatingRoomId} avec chirurgien pour la période ${roomAssignment.period}`,
                    severity: ConflictSeverity.ERROR,
                    isResolved: false,
                });
            }

            // Vérifier les règles spécifiques du secteur concernant le nombre d'IADEs requis
            if (roomAssignment.operatingRoom?.operatingSector) { // Modifié ici
                const sector = roomAssignment.operatingRoom.operatingSector; // Modifié ici
                const sectorRules = getSectorRules(sector.rules);
                const minIADESectorRequis = sectorRules.minIADEPerRoom;

                if (minIADESectorRequis !== undefined && iadeCount < minIADESectorRequis) {
                    conflictsToCreate.push({
                        blocDayPlanningId: planning.id,
                        relatedRoomAssignmentId: roomAssignment.id,
                        type: 'INSUFFICIENT_IADE_COUNT',
                        message: `Nombre insuffisant d'IADEs (${iadeCount}) pour la salle ${roomAssignment.operatingRoom.name} du secteur ${sector.name} qui exige minimum ${minIADESectorRequis} IADEs par salle`,
                        severity: ConflictSeverity.ERROR,
                        isResolved: false,
                    });
                }
            }
        }

        // R8: Règles Spécifiques par type de secteur
        for (const roomAssignment of assignments) {
            const room = roomAssignment.operatingRoom;
            if (!room || !room.operatingSector) continue; // Modifié ici

            const sector = room.operatingSector; // Modifié ici

            // Début Solution Palliative pour sectorType (R8)
            // TODO: Remplacer par une méthode fiable (champ dédié sur OperatingSector ou propriété structurée dans sector.rules)
            const sectorNameLower = sector.name.toLowerCase();
            let sectorType = 'STANDARD';
            if (sectorNameLower.includes('hyperaseptique')) sectorType = 'HYPERASEPTIQUE';
            else if (sectorNameLower.includes('ophtalmo')) sectorType = 'OPHTALMOLOGIE';
            else if (sectorNameLower.includes('endo')) sectorType = 'ENDOSCOPIE';
            // Fin Solution Palliative

            // Règles spécifiques pour secteur hyperaseptique
            if (sectorType === 'HYPERASEPTIQUE') {
                // Vérifier le nombre minimum de personnel requis en hyperaseptique
                const totalStaff = roomAssignment.staffAssignments.length;
                const minStaffRequired = 3; // Exemple: au moins 3 personnes par salle en hyperaseptique

                if (totalStaff < minStaffRequired) {
                    conflictsToCreate.push({
                        blocDayPlanningId: planning.id,
                        relatedRoomAssignmentId: roomAssignment.id,
                        type: 'INSUFFICIENT_STAFF_HYPERASEPTIC',
                        message: `Personnel insuffisant (${totalStaff}) pour une salle du secteur hyperaseptique ${sector.name} qui exige minimum ${minStaffRequired} personnes`,
                        severity: ConflictSeverity.ERROR,
                        isResolved: false,
                    });
                }
            }

            // Règles spécifiques pour l'ophtalmologie
            else if (sectorType === 'OPHTALMOLOGIE') {
                // En ophtalmologie, vérifier la présence d'un personnel formé en ophtalmologie
                const hasOphtalmoTrainedStaff = roomAssignment.staffAssignments.some(sa =>
                    sa.user && sa.user.canSuperviseOphtalmo // Utilisation du champ booléen direct
                );

                if (!hasOphtalmoTrainedStaff && roomAssignment.chirurgienId) {
                    conflictsToCreate.push({
                        blocDayPlanningId: planning.id,
                        relatedRoomAssignmentId: roomAssignment.id,
                        type: 'MISSING_SPECIAL_SKILL_OPHTALMO',
                        message: `Absence de personnel formé en ophtalmologie pour la salle ${room.name} du secteur ophtalmologie ${sector.name}`,
                        severity: ConflictSeverity.ERROR,
                        isResolved: false,
                    });
                }
            }

            // Règles spécifiques pour l'endoscopie
            else if (sectorType === 'ENDOSCOPIE') {
                // En endoscopie, vérifier la présence d'un personnel formé en endoscopie
                const hasEndoscopeTrainedStaff = roomAssignment.staffAssignments.some(sa =>
                    sa.user && sa.user.canSuperviseEndo // Utilisation du champ booléen direct
                );

                if (!hasEndoscopeTrainedStaff && roomAssignment.chirurgienId) {
                    conflictsToCreate.push({
                        blocDayPlanningId: planning.id,
                        relatedRoomAssignmentId: roomAssignment.id,
                        type: 'MISSING_SPECIAL_SKILL_ENDOSCOPIE',
                        message: `Absence de personnel formé en endoscopie pour la salle ${room.name} du secteur endoscopie ${sector.name}`,
                        severity: ConflictSeverity.WARNING,
                        isResolved: false,
                    });
                }

                // R8 Endo specific: Avertissement si IADE manque en endo avec MAR
                const hasMAR = roomAssignment.staffAssignments.some(staff => staff.role === BlocStaffRole.MAR);
                const hasIADE = roomAssignment.staffAssignments.some(staff => staff.role === BlocStaffRole.IADE);

                if (hasMAR && !hasIADE && roomAssignment.chirurgienId) { // chirurgienId check to ensure the room is active/used
                    conflictsToCreate.push({
                        blocDayPlanningId: planning.id,
                        relatedRoomAssignmentId: roomAssignment.id,
                        type: 'MISSING_IADE_IN_ENDO_WITH_MAR',
                        message: `La salle d'endoscopie ${room.name} (secteur ${sector.name}) est opérée par un MAR sans IADE. La présence d'un IADE est recommandée.`,
                        severity: ConflictSeverity.WARNING,
                        isResolved: false,
                    });
                }
            } // Fin du else if (sectorType === 'ENDOSCOPIE')
        } // Fin de la boucle for (const roomAssignment of assignments) pour R8

        // Création groupée des conflits en base de données
        if (conflictsToCreate.length > 0) {
            await prisma.blocPlanningConflict.createMany({
                data: conflictsToCreate,
                skipDuplicates: true, // Au cas où la logique générerait des doublons exacts
            });
        }

        // Récupérer tous les conflits (y compris ceux qui viennent d'être créés)
        const allConflictsForPlanning = await prisma.blocPlanningConflict.findMany({
            where: { blocDayPlanningId: planning.id }
        });

        // Mise à jour du statut du planning en fonction des conflits
        // après leur création effective.
        if (allConflictsForPlanning.length > 0) {
            const hasErrors = allConflictsForPlanning.some(c => c.severity === ConflictSeverity.ERROR);
            // Utiliser des statuts existants. Si erreurs => DRAFT. Si warnings => DRAFT.
            // La distinction se fait par la présence de conflits de sévérité ERROR ou WARNING.
            if (planning.status !== BlocPlanningStatus.VALIDATED &&
                planning.status !== BlocPlanningStatus.LOCKED &&
                planning.status !== BlocPlanningStatus.ARCHIVED // Ne pas écraser les statuts finaux
            ) {
                await prisma.blocDayPlanning.update({
                    where: { id: planningId },
                    // Si des erreurs existent, on reste en DRAFT (ou un statut spécifique comme DRAFT_WITH_ERRORS si défini).
                    // Pour l'instant, on ne change pas le statut s'il y a juste des warnings, 
                    // ou on le remet en DRAFT s'il était autre chose et qu'il y a des erreurs.
                    // Si le statut est déjà DRAFT, on le laisse DRAFT.
                    // Si des erreurs bloquantes sont présentes, le statut devrait refléter un problème.
                    // Pour l'instant, si le statut n'est pas final et qu'il y a des conflits (erreurs ou warnings),
                    // on s'assure qu'il est DRAFT pour indiquer qu'il nécessite une attention.
                    data: { status: BlocPlanningStatus.DRAFT }
                });
            }
        } else {
            // Si le planning était en DRAFT et n'a plus de conflits,
            // il reste DRAFT. Le passage à VALIDATED est une action manuelle.
            // Si le planning était dans un état indiquant des problèmes (ex: un ancien statut CONFLICT/WARNING qui n'existe plus)
            // et qu'il n'y a plus de conflits, il est raisonnable de le repasser à DRAFT.
            // Cette partie est délicate sans statuts comme DRAFT_WITH_ERRORS.
            // Pour l'instant, si pas de conflit et statut non final, on s'assure qu'il est DRAFT.
            if (planning.status !== BlocPlanningStatus.VALIDATED &&
                planning.status !== BlocPlanningStatus.LOCKED &&
                planning.status !== BlocPlanningStatus.ARCHIVED &&
                planning.status !== BlocPlanningStatus.DRAFT // S'il est déjà DRAFT, pas besoin d'update
            ) {
                await prisma.blocDayPlanning.update({
                    where: { id: planningId },
                    data: { status: BlocPlanningStatus.DRAFT }
                });
            }
        }

        return {
            isValid: !allConflictsForPlanning.some(c => c.severity === ConflictSeverity.ERROR),
            conflicts: allConflictsForPlanning
        };
    }

    async updateBlocDayPlanningStatus(planningId: string, status: BlocPlanningStatus, userId: number): Promise<BlocDayPlanning> {
        const planning = await this.getBlocDayPlanningById(planningId);
        if (!planning) {
            throw new Error(`Planning ${planningId} non trouvé.`);
        }

        // Logique de validation avant de changer de statut
        if (status === BlocPlanningStatus.VALIDATED || status === BlocPlanningStatus.LOCKED) {
            // Vérifier s'il y a des conflits ERROR non résolus/forcés
            const unresolvedErrors = planning.conflicts.some(c =>
                c.severity === ConflictSeverity.ERROR && !c.isResolved && !c.isForceResolved
            );
            if (unresolvedErrors) {
                throw new Error(`Impossible de passer le planning à '${status}' car il contient des conflits bloquants non résolus.`);
            }
        }

        // 🔐 CORRECTION TODO CRITIQUE : Ajouter logique de permissions pour changements de statut
        await this.verifyStatusChangePermissions(userId, planningId, status);

        // TODO: Tracer l'historique des changements de statut si nécessaire (nouveau modèle ?)

        return prisma.blocDayPlanning.update({
            where: { id: planningId },
            data: {
                status,
                ...(status === BlocPlanningStatus.VALIDATED && { validatedAt: new Date(), validatedByUserId: userId }),
                ...(status === BlocPlanningStatus.LOCKED && { lockedAt: new Date(), lockedByUserId: userId }),
            }
        });
    }

    async addOrUpdateStaffAssignment(
        blocRoomAssignmentId: string,
        userId: number,
        role: BlocStaffRole,
        isPrimaryAnesthetist: boolean,
        initiatorUserId: number // Personne qui initie le changement
    ): Promise<BlocStaffAssignment> {
        const roomAssignment = await prisma.blocRoomAssignment.findUnique({
            where: { id: blocRoomAssignmentId },
            include: { blocDayPlanning: true }
        });

        if (!roomAssignment) {
            throw new Error("Affectation de salle non trouvée.");
        }
        if (roomAssignment.blocDayPlanning.status !== BlocPlanningStatus.DRAFT) {
            // Ou autre logique, ex: permettre modif sur certains statuts avec droits spécifiques
            throw new Error("L'affectation ne peut être modifiée que si le planning est en mode brouillon (DRAFT).");
        }

        // 🔐 CORRECTION TODO CRITIQUE : Vérifier si l'utilisateur a les droits de faire cette modification
        await this.verifyStaffModificationPermissions(initiatorUserId, roomAssignment.blocDayPlanning.siteId);

        // 🔐 CORRECTION TODO CRITIQUE : Gérer le cas "update" si une affectation pour cet userId+role existe déjà pour ce blocRoomAssignmentId
        // Logique d'update/replace améliorée avec gestion des erreurs

        //       Actuellement, cela va créer une nouvelle entrée. Faut-il supprimer l'ancienne ou la mettre à jour ?

        // Logique d'update/replace simple: si une affectation pour ce user existe déjà sur ce room assignment, la supprimer.
        // Cela permet une forme de mise à jour par remplacement.
        // Attention: ne distingue pas par rôle pour la suppression. Si un user peut avoir plusieurs rôles sur la même room (peu probable), cela les supprimerait tous.
        // Pour une gestion plus fine, il faudrait un `findUnique` sur `blocRoomAssignmentId_userId_role` si une telle contrainte unique existait.
        const existingAssignment = await prisma.blocStaffAssignment.findFirst({
            where: {
                blocRoomAssignmentId: blocRoomAssignmentId,
                userId: userId,
                // role: role, // Si on veut être plus spécifique au rôle lors du remplacement
            }
        });
        if (existingAssignment) {
            await prisma.blocStaffAssignment.delete({ where: { id: existingAssignment.id } });
        }

        const assignment = await prisma.blocStaffAssignment.create({
            data: { blocRoomAssignmentId, userId, role, isPrimaryAnesthetist }
        });

        await this.validateEntireBlocDayPlanning(roomAssignment.blocDayPlanningId);
        return assignment;
    }

    async removeStaffAssignment(staffAssignmentId: string, initiatorUserId: number): Promise<void> {
        const staffAssignment = await prisma.blocStaffAssignment.findUnique({
            where: { id: staffAssignmentId },
            include: { blocRoomAssignment: { include: { blocDayPlanning: true } } }
        });

        if (!staffAssignment) {
            throw new Error("Affectation de personnel non trouvée.");
        }
        if (staffAssignment.blocRoomAssignment.blocDayPlanning.status !== BlocPlanningStatus.DRAFT) {
            throw new Error("L'affectation ne peut être supprimée que si le planning est en mode brouillon (DRAFT).");
        }

        // 🔐 CORRECTION TODO CRITIQUE : Vérifier si l'utilisateur a les droits de faire cette suppression
        await this.verifyStaffModificationPermissions(initiatorUserId, staffAssignment.blocRoomAssignment.blocDayPlanning.siteId);

        // TODO: Vérifier si l'utilisateur (initiatorUserId) a les droits de faire cette suppression.

        await prisma.blocStaffAssignment.delete({ where: { id: staffAssignmentId } });
        await this.validateEntireBlocDayPlanning(staffAssignment.blocRoomAssignment.blocDayPlanningId);
    }


    async resolveConflict(conflictId: string, resolutionNotes: string, userId: number): Promise<BlocPlanningConflict> {
        const updatedConflict = await prisma.blocPlanningConflict.update({
            where: { id: conflictId },
            data: {
                isResolved: true,
                resolvedAt: new Date(),
                resolvedByUserId: userId,
                resolutionNotes
            },
            include: { blocDayPlanning: true } // Inclure pour revalider le statut du planning
        });

        // Optionnel: Re-évaluer le statut du planning parent après résolution.
        // Par exemple, si c'était le dernier conflit bloquant.
        if (updatedConflict.blocDayPlanningId) {
            await this.checkAndUpdatePlanningStatusAfterConflictChange(updatedConflict.blocDayPlanningId);
        }
        return updatedConflict;
    }

    async forceResolveConflict(conflictId: string, forceResolutionNotes: string, userId: number): Promise<BlocPlanningConflict> {
        const conflict = await prisma.blocPlanningConflict.findUnique({ where: { id: conflictId } });
        if (!conflict) throw new Error("Conflit non trouvé");
        if (conflict.severity !== ConflictSeverity.ERROR) {
            throw new Error("Seuls les conflits de type ERROR peuvent être forcés.");
        }
        const updatedConflict = await prisma.blocPlanningConflict.update({
            where: { id: conflictId },
            data: {
                isForceResolved: true,
                forceResolvedAt: new Date(),
                forceResolvedByUserId: userId,
                forceResolutionNotes,
                isResolved: true,
                resolvedAt: new Date(),
                resolvedByUserId: userId,
                resolutionNotes: forceResolutionNotes, // Mettre aussi dans les notes de résolution standard
            },
            include: { blocDayPlanning: true }
        });

        if (updatedConflict.blocDayPlanningId) {
            await this.checkAndUpdatePlanningStatusAfterConflictChange(updatedConflict.blocDayPlanningId);
        }
        return updatedConflict;
    }

    // Nouvelle méthode utilitaire pour vérifier le statut du planning après un changement de conflit
    private async checkAndUpdatePlanningStatusAfterConflictChange(planningId: string): Promise<void> {
        const planning = await this.getBlocDayPlanningById(planningId);
        if (!planning) return;

        const hasUnresolvedErrors = planning.conflicts.some(c =>
            c.severity === ConflictSeverity.ERROR && !c.isResolved && !c.isForceResolved
        );

        console.log(`Planning ${planningId} re-vérifié après résolution/forçage de conflit. Erreurs bloquantes restantes: ${hasUnresolvedErrors}`);

        // Logique de changement de statut (Exemple - à adapter selon les besoins):
        // Si le planning est actuellement dans un état "avec erreurs" (ex: VALIDATED_WITH_ERRORS, DRAFT_WITH_ERRORS - statuts à définir)
        // et qu'il n'y a plus d'erreurs bloquantes, on pourrait envisager de le passer à un état "propre".
        // Par exemple, si on avait un statut VALIDATED_WITH_ERRORS, on pourrait le passer à VALIDATED.
        // if (planning.status === HypotheticalStatus.VALIDATED_WITH_ERRORS && !hasUnresolvedErrors) {
        //     await this.updateBlocDayPlanningStatus(planningId, BlocPlanningStatus.VALIDATED, SYSTEM_USER_ID_PLACEHOLDER); 
        // }
        // Ou si le planning est DRAFT et qu'on veut introduire DRAFT_CLEAN vs DRAFT_ERRORS.
        // Pour l'instant, cette fonction reste informative.
    }

    // --- R5: Placeholder pour la vérification d'incompatibilité ---
    private async getIncompatibilityLevel(
        userId1: number | undefined,
        surgeonId1: number | undefined,
        userId2: number | undefined,
        surgeonId2: number | undefined,
        date: Date
    ): Promise<IncompatibilityType | null> { // Type de retour mis à jour pour correspondre à l'enum Prisma
        // Assurer que nous avons bien deux "personnes" distinctes à comparer
        if ((!userId1 && !surgeonId1) || (!userId2 && !surgeonId2)) {
            return null; // Pas assez d'information pour une comparaison
        }
        // Éviter de se comparer à soi-même si les IDs et les types correspondent
        if (userId1 && userId1 === userId2) return null;
        if (surgeonId1 && surgeonId1 === surgeonId2) return null;
        // Cas où un User est aussi un Surgeon (userId1 lié à surgeonId1) et comparé à lui-même via l'autre ID.
        // Cette logique dépend de si un User peut être directement lié à un Surgeon ayant le même "individu".
        // Pour l'instant, la comparaison simple par ID de type User/Surgeon est maintenue.

        // Construire les conditions de base pour chaque personne
        const p1IsUser = !!userId1;
        const p1IsSurgeon = !!surgeonId1;
        const p2IsUser = !!userId2;
        const p2IsSurgeon = !!surgeonId2;

        // Conditions pour la recherche croisée (p1 vs p2) et (p2 vs p1)
        const queryConditions: Prisma.PersonnelIncompatibilityWhereInput[] = [];

        // Condition 1: (personne1 comme user1/surgeon1) ET (personne2 comme user2/surgeon2)
        queryConditions.push({
            AND: [
                p1IsUser ? { user1Id: userId1 } : { surgeon1Id: surgeonId1 },
                p2IsUser ? { user2Id: userId2 } : { surgeon2Id: surgeonId2 },
                {
                    OR: [
                        { startDate: null },
                        { startDate: { lte: date } },
                    ],
                },
                {
                    OR: [
                        { endDate: null },
                        { endDate: { gte: date } },
                    ],
                },
            ]
        });

        // Condition 2: (personne2 comme user1/surgeon1) ET (personne1 comme user2/surgeon2) - Inversion
        // Uniquement si personne1 et personne2 ne sont pas identiques (déjà vérifié par ID plus haut si même type)
        if (!(userId1 === userId2 && p1IsUser && p2IsUser) && !(surgeonId1 === surgeonId2 && p1IsSurgeon && p2IsSurgeon)) {
            queryConditions.push({
                AND: [
                    p2IsUser ? { user1Id: userId2 } : { surgeon1Id: surgeonId2 }, // personne2 devient personne1 dans la table
                    p1IsUser ? { user2Id: userId1 } : { surgeon2Id: surgeonId1 }, // personne1 devient personne2 dans la table
                    {
                        OR: [
                            { startDate: null },
                            { startDate: { lte: date } },
                        ],
                    },
                    {
                        OR: [
                            { endDate: null },
                            { endDate: { gte: date } },
                        ],
                    },
                ]
            });
        }

        try {
            const incompatibility = await prisma.personnelIncompatibility.findFirst({
                where: {
                    OR: queryConditions
                },
                orderBy: {
                    // Prioriser BLOQUANT si jamais plusieurs règles s'appliquaient (ne devrait pas arriver avec une bonne gestion des données)
                    // Pour cela, il faudrait que l'enum IncompatibilityType ait un ordre intrinsèque ou qu'on mappe les strings
                    // Pour l'instant, on prend la première trouvée. Ou on peut trier par un champ 'priority' si ajouté au modèle.
                    // Si BLOQUANT est "plus petit" que PREFERENTIEL alphabétiquement, type: 'asc' fonctionnerait.
                    // Actuellement IncompatibilityType est { BLOQUANT, PREFERENTIEL }. BLOQUANT < PREFERENTIEL.
                    type: 'asc'
                }
            });

            if (incompatibility) {
                return incompatibility.type; // Retourne directement la valeur de l'enum Prisma (BLOQUANT ou PREFERENTIEL)
            }
        } catch (error) {
            // En cas d'erreur inattendue lors de la requête, logguer et retourner null
            console.error("Erreur lors de la vérification des incompatibilités (R5) :", error);
            return null;
        }

        return null;
    }

    // --- Fonctions utilitaires ---
    private mapDateToDayOfWeek(date: Date): DayOfWeek {
        const day = date.getDay(); // 0 (Dimanche) - 6 (Samedi)
        const map: Record<number, DayOfWeek> = {
            0: DayOfWeek.SUNDAY, 1: DayOfWeek.MONDAY, 2: DayOfWeek.TUESDAY,
            3: DayOfWeek.WEDNESDAY, 4: DayOfWeek.THURSDAY, 5: DayOfWeek.FRIDAY,
            6: DayOfWeek.SATURDAY
        };
        return map[day];
    }

    private getWeekNumber(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }

    private getWeekType(date: Date): WeekType {
        return this.getWeekNumber(date) % 2 === 0 ? WeekType.EVEN : WeekType.ODD;
    }

    private isDateInRange(checkDate: Date, startDate: Date, endDate: Date, period: Period): boolean {
        // Simplifié: ne vérifie que le jour, pas la période exacte (matin/après-midi) pour l'absence
        // Une logique plus fine serait nécessaire si les absences sont à la demi-journée
        const checkDay = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
        const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        return checkDay >= startDay && checkDay <= endDay;
    }

    // Modifiée pour plus de précision avec les périodes et pour être utilisée par R1
    private isPersonnelAbsentForPeriod(
        planningDate: Date,
        planningPeriod: Period,
        absenceStartDate: Date,
        absenceEndDate: Date
        // absenceStartPeriod?: Period | null, // Retirés pour l'instant
        // absenceEndPeriod?: Period | null    // Retirés pour l'instant
    ): boolean {
        const planningDateTime = new Date(planningDate);
        planningDateTime.setHours(0, 0, 0, 0); // Comparer uniquement les dates

        const normAbsenceStartDate = new Date(absenceStartDate);
        normAbsenceStartDate.setHours(0, 0, 0, 0);
        const normAbsenceEndDate = new Date(absenceEndDate);
        normAbsenceEndDate.setHours(0, 0, 0, 0);

        // Si la date du planning est entre la date de début et de fin d'absence (strictement ou égal)
        if (planningDateTime >= normAbsenceStartDate && planningDateTime <= normAbsenceEndDate) {
            // Pour une logique plus fine avec les périodes, il faudrait les startPeriod/endPeriod de l'absence.
            // Sans cela, on considère que si le jour correspond, l'absence couvre toute la journée pour simplifier.
            // Ou, si l'on veut être plus précis et que les absences sont toujours pour des jours complets si les périodes ne sont pas spécifiées :
            // Cas 1: Absence sur plusieurs jours pleins couvrant le jour du planning
            if (planningDateTime > normAbsenceStartDate && planningDateTime < normAbsenceEndDate) {
                return true; // Absent toute la journée
            }
            // Cas 2: Absence commence ou se termine ce jour-là.
            // Sans les Period de l'absence, on assume que si c'est le même jour, c'est pour toute la journée.
            if (planningDateTime.getTime() === normAbsenceStartDate.getTime() || planningDateTime.getTime() === normAbsenceEndDate.getTime()) {
                // TODO: Affiner avec les periodes de l'absence si elles sont disponibles et nécessaires.
                // Pour l'instant, on simplifie : si c'est le même jour, c'est un conflit pour la période planifiée.
                // Cela pourrait être trop restrictif si une absence se termine le matin et le planning est l'après-midi.
                // Pour la V1 de correction du linter, on accepte cette simplification.
                // Idéalement, si absenceStartPeriod/EndPeriod ne sont pas sur le modèle Absence, 
                // il faudrait une convention (ex: une absence sur un jour X sans période = journée entière).
                return true;
            }
        }

        return false;
    }

    /**
     * Factorisation de la transformation et validation des salles d'opération.
     */
    private transformAndValidateRooms(
        roomsData: (Prisma.OperatingRoomGetPayload<{ include: { operatingSector: { include: { site: true } } } }> | Prisma.OperatingRoomGetPayload<EmptyObject>)[],
        includeRelations: boolean
    ): LegacyOperatingRoom[] {
        console.log('[BlocPlanningService.transformAndValidateRooms] Reçu pour transformation (premiers 2 si dispo):', JSON.stringify(roomsData.slice(0, 2)));
        console.log(`[BlocPlanningService.transformAndValidateRooms] Nombre total de salles reçues pour transformation: ${roomsData.length}`);
        if (!roomsData || roomsData.length === 0) {
            console.warn('[BlocPlanningService.transformAndValidateRooms] Aucune donnée de salle reçue pour transformation.');
            return [];
        }

        const validatedRoomsInternal = roomsData.map((room: any, index: number) => {
            if (index < 2) { // Loguer seulement pour les deux premières pour éviter la verbosité
                console.log(`[BlocPlanningService.transformAndValidateRooms] Salle ${index} brute reçue par map:`, JSON.stringify(room));
            }
            const roomForValidation: Partial<Omit<LegacyOperatingRoom, 'type'> & { type?: string, siteId?: string }> = {
                id: typeof room.id === 'number' ? room.id : undefined,
                name: typeof room.name === 'string' ? room.name : 'Nom manquant',
                number: typeof room.number === 'string' ? room.number : 'Numéro manquant',
                sectorId: typeof room.operatingSectorId === 'number' || room.operatingSectorId === null ? room.operatingSectorId : undefined, // Modifié ici (champ direct)
                sector: typeof room.operatingSector === 'string' || room.operatingSector === null ? room.operatingSector : undefined, // Modifié ici (relation)
                colorCode: typeof room.colorCode === 'string' || room.colorCode === null ? room.colorCode : undefined,
                isActive: typeof room.isActive === 'boolean' ? room.isActive : true,
                supervisionRules: typeof room.supervisionRules === 'object' && room.supervisionRules !== null ? room.supervisionRules : {},
                createdAt: room.createdAt instanceof Date ? room.createdAt : undefined,
                updatedAt: room.updatedAt instanceof Date ? room.updatedAt : undefined,
                displayOrder: typeof room.displayOrder === 'number' ? room.displayOrder : undefined,
                type: typeof room.type === 'string' ? room.type : undefined, // Pass as string, Zod will validate against enum
                siteId: undefined,
            };

            if (includeRelations && room.operatingSector && room.operatingSector.site && typeof room.operatingSector.site.id === 'string') { // Modifié ici
                roomForValidation.siteId = room.operatingSector.site.id; // Modifié ici
            }

            const parseResult = OperatingRoomSchema.safeParse(roomForValidation);

            if (index < 2) { // Loguer seulement pour les deux premières
                console.log(`[BlocPlanningService.transformAndValidateRooms] Salle ${index} - roomForValidation:`, JSON.stringify(roomForValidation));
                if (!parseResult.success) {
                    console.warn(`[BlocPlanningService.transformAndValidateRooms] Salle ${index} - Échec de validation Zod (ID: ${room?.id}, Nom: ${room?.name}):`, JSON.stringify(parseResult.error.flatten()));
                } else {
                    console.log(`[BlocPlanningService.transformAndValidateRooms] Salle ${index} - Succès de validation Zod (ID: ${room?.id}, Nom: ${room?.name}). Données validées:`, JSON.stringify(parseResult.data));
                }
            }

            if (!parseResult.success) {
                // Ne loguer l'erreur que si ce n'est pas l'une des deux premières (déjà loguée en détail)
                if (index >= 2) {
                    console.warn(`Échec de validation Zod pour la salle (ID: ${room?.id}, Nom: ${room?.name}), elle sera ignorée:`, parseResult.error.flatten());
                }
                return null;
            }

            const validatedRoom = parseResult.data as LegacyOperatingRoom;

            if (includeRelations && room.operatingSector) { // Modifié ici
                (validatedRoom as any).sectorName = typeof room.operatingSector.name === 'string' ? room.operatingSector.name : 'Secteur inconnu'; // Modifié ici
                if (room.operatingSector.site) { // Modifié ici
                    (validatedRoom as any).siteName = typeof room.operatingSector.site.name === 'string' ? room.operatingSector.site.name : 'Site inconnu'; // Modifié ici
                }
            } else if (roomForValidation.sector) { // Conservé car roomForValidation.sector peut exister si includeRelations est faux
                (validatedRoom as any).sectorName = roomForValidation.sector;
            }

            return validatedRoom;
        });
        return validatedRoomsInternal.filter((r): r is LegacyOperatingRoom => r !== null);
    }


    /**
     * Récupère toutes les salles d'opération, triées par Site -> Secteur -> Salle
     */
    async getAllOperatingRooms(includeRelations = true): Promise<LegacyOperatingRoom[]> {
        try {
            const includeArgs = includeRelations ? { operatingSector: { include: { site: true } } } : undefined;
            console.log('[BlocPlanningService.getAllOperatingRooms] Arguments d\'include pour Prisma:', JSON.stringify(includeArgs));

            const roomsData = await prisma.operatingRoom.findMany({
                include: includeArgs,
                orderBy: [
                    ...(includeRelations ? [
                        { operatingSector: { site: { displayOrder: 'asc' } } as any },
                        { operatingSector: { site: { name: 'asc' } } as any },
                        { operatingSector: { displayOrder: 'asc' } as any },
                        { operatingSector: { name: 'asc' } as any },
                    ] : []),
                    { displayOrder: 'asc' },
                    { name: 'asc' }
                ]
            });

            console.log('[BlocPlanningService.getAllOperatingRooms] Données brutes de Prisma (premiers 2 si dispo):', JSON.stringify(roomsData.slice(0, 2)));
            console.log(`[BlocPlanningService.getAllOperatingRooms] Nombre total de salles récupérées de Prisma: ${roomsData.length}`);

            if (roomsData.length === 0) {
                console.warn('[BlocPlanningService.getAllOperatingRooms] Aucune salle récupérée de Prisma.');
            }

            const transformedRooms = this.transformAndValidateRooms(roomsData as any, includeRelations);
            console.log(`[BlocPlanningService.getAllOperatingRooms] Nombre de salles après transformation/validation: ${transformedRooms.length}`);
            return transformedRooms;
        } catch (error) {
            console.error("[BlocPlanningService.getAllOperatingRooms] Erreur lors de la récupération des salles d'opération: ", error);
            // Ne pas simplement jeter l'erreur ici pour voir si le catch plus haut (dans la route API) le fait
            // throw new Error("Impossible de récupérer les salles d'opération"); 
            return []; // Retourner un tableau vide en cas d'erreur ici pour éviter de planter et voir si l'API renvoie quand même 200
        }
    }

    /**
     * Récupère les salles d'opération actives
     */
    async getActiveOperatingRooms(includeRelations = true): Promise<LegacyOperatingRoom[]> {
        try {
            const includeArgs = includeRelations ? { operatingSector: { include: { site: true } } } : undefined;
            const roomsData = await prisma.operatingRoom.findMany({
                where: {
                    isActive: true
                },
                include: includeArgs,
                orderBy: [
                    ...(includeRelations ? [
                        { operatingSector: { site: { displayOrder: 'asc' } } as any },
                        { operatingSector: { site: { name: 'asc' } } as any },
                        { operatingSector: { displayOrder: 'asc' } as any },
                        { operatingSector: { name: 'asc' } as any },
                    ] : []),
                    { displayOrder: 'asc' },
                    { name: 'asc' }
                ]
            });
            return this.transformAndValidateRooms(roomsData as any, includeRelations);
        } catch (error) {
            console.error("Erreur lors de la récupération des salles d'opération actives: ", error);
            throw new Error("Impossible de récupérer les salles d'opération actives");
        }
    }

    /**
     * Factorisation de la transformation et validation des secteurs opératoires.
     */
    private transformAndValidateSectors(
        sectorsData: (Prisma.OperatingSectorGetPayload<{ include: { site: true, rooms: true } }> | Prisma.OperatingSectorGetPayload<EmptyObject>)[],
        includeRelations: boolean
    ): LegacyOperatingSector[] { // LegacyOperatingSector est OperatingSector de BlocModels.ts
        const validatedSectors = sectorsData.map((sector: any) => {
            const sectorForValidation: Partial<LegacyOperatingSector> & { siteId?: string, rooms?: any[] } = {
                id: sector.id,
                name: sector.name,
                colorCode: sector.colorCode,
                isActive: sector.isActive,
                description: sector.description,
                rules: (sector.rules && typeof sector.rules === 'object' && !Array.isArray(sector.rules)) ? sector.rules as Record<string, any> : {},
                createdAt: sector.createdAt,
                updatedAt: sector.updatedAt,
                displayOrder: sector.displayOrder === null ? undefined : sector.displayOrder,
                siteId: sector.siteId === null ? undefined : sector.siteId,
            };

            if (includeRelations && sector.site) {
                if (sector.site.id && sectorForValidation.siteId === undefined) {
                    sectorForValidation.siteId = sector.site.id;
                }
            }

            const parseResult = OperatingSectorSchema.safeParse(sectorForValidation);
            if (!parseResult.success) {
                console.warn(`Données invalides pour le secteur ID ${sector.id}, il sera ignoré:`, parseResult.error.flatten());
                return null;
            }

            const validatedSector = parseResult.data as LegacyOperatingSector;
            if (includeRelations && sector.rooms) {
                (validatedSector as any).rooms = sector.rooms.map((r: any) => ({ id: r.id, name: r.name, number: r.number, displayOrder: r.displayOrder }));
            }

            return validatedSector;
        });
        return validatedSectors.filter((s): s is LegacyOperatingSector => s !== null);
    }

    /**
     * Récupère tous les secteurs opératoires, triés par Site -> Secteur
     */
    async getAllOperatingSectors(includeRelations = true): Promise<LegacyOperatingSector[]> {
        try {
            const includeArgs = includeRelations ? { site: true, rooms: { orderBy: { displayOrder: Prisma.SortOrder.asc } } } : undefined;
            const sectorsData = await prisma.operatingSector.findMany({
                include: includeArgs,
                orderBy: [
                    { displayOrder: { sort: 'asc', nulls: 'last' } },
                    { name: 'asc' }
                ]
            });
            // Correction de l'appel de fonction
            return this.transformAndValidateSectors(sectorsData as any, includeRelations);
        } catch (error) {
            console.error("Erreur lors de la récupération des secteurs opératoires: ", error);
            throw new Error("Impossible de récupérer les secteurs opératoires");
        }
    }

    /**
     * Vérifie si un ensemble de salles opératoires sont contiguës selon les règles du secteur
     * @param rooms Liste des salles à vérifier
     * @param sector Le secteur auquel appartiennent les salles
     * @returns true si les salles sont contiguës, false sinon
     */
    private areRoomsContiguousLegacy(rooms: OperatingRoom[], sector?: OperatingSector): boolean { // Le paramètre ici est bien OperatingSector, pas de changement.
        if (rooms.length <= 1) return true;

        // Si on a le secteur et qu'il a une carte de contiguïté, l'utiliser
        if (sector) { // ici sector est le paramètre de la fonction
            const sectorRules = getSectorRules(sector.rules); // sector est le paramètre
            const contiguityMap = sectorRules.contiguityMap;

            if (contiguityMap) {
                const roomIds = rooms.map(r => r.id.toString());
                return areRoomsContiguousLib(roomIds, contiguityMap);
            }
        }

        // Logique par défaut basée sur les numéros des salles
        const sortedRooms = [...rooms].sort((a, b) => {
            const numA = this.extractRoomNumber(a.name);
            const numB = this.extractRoomNumber(b.name);
            return numA - numB;
        });

        // Vérifier si les numéros sont consécutifs
        for (let i = 1; i < sortedRooms.length; i++) {
            const prevNum = this.extractRoomNumber(sortedRooms[i - 1].name);
            const currNum = this.extractRoomNumber(sortedRooms[i].name);

            if (currNum - prevNum !== 1) {
                return false;
            }
        }

        return true;
    }

    /**
     * Détermine le type d'un secteur basé sur son nom (solution temporaire)
     * @deprecated À remplacer par l'utilisation directe du champ category
     */
    private getSectorTypeFromName(sectorName: string): string {
        const normalizedName = sectorName.toLowerCase();

        if (normalizedName.includes('ophtalm')) {
            return 'OPHTALMOLOGIE';
        } else if (normalizedName.includes('endoscopie') || normalizedName.includes('endo')) {
            return 'ENDOSCOPIE';
        } else if (normalizedName.includes('hyperaseptique') || normalizedName.includes('hyper aseptique')) {
            return 'HYPERASEPTIQUE';
        }

        return 'STANDARD';
    }

    /**
     * Détermine le type d'un secteur basé sur sa catégorie ou son nom
     * @param sector Le secteur dont on veut déterminer le type
     * @returns Le type de secteur
     * @deprecated Utiliser directement le champ category ou déterminer à partir du nom
     */
    private getSectorType(sector: OperatingSector): string { // Le paramètre ici est bien OperatingSector
        // Si le secteur a une catégorie définie, l'utiliser
        if (sector && typeof sector === 'object' && 'category' in sector && sector.category) { // sector est le paramètre
            return String(sector.category); // sector est le paramètre
        }

        // Sinon, utiliser l'ancien système basé sur le nom
        return this.getSectorTypeFromName(sector.name); // sector est le paramètre
    }

    /**
     * Extrait le numéro d'une salle à partir de son nom
     * @param roomName Nom de la salle (ex: "Salle 1", "Bloc 5", "OR-7")
     * @returns Le numéro de la salle ou 0 si non trouvé
     */
    private extractRoomNumber(roomName: string): number {
        const match = roomName.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    }

    /**
     * 🔐 NOUVELLE MÉTHODE : Vérifie les permissions pour les changements de statut
     */
    private async verifyStatusChangePermissions(userId: number, planningId: string, newStatus: BlocPlanningStatus): Promise<void> {
        // Récupérer l'utilisateur et ses rôles
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true }
        });

        if (!user) {
            throw new Error("Utilisateur non trouvé pour vérification des permissions.");
        }

        // Récupérer le planning actuel
        const planning = await prisma.blocDayPlanning.findUnique({
            where: { id: planningId },
            select: { status: true, siteId: true }
        });

        if (!planning) {
            throw new Error("Planning non trouvé pour vérification des permissions.");
        }

        // Définir les règles de permissions par rôle et transition
        const canChangeStatus = this.canUserChangeStatus(user.role, planning.status, newStatus);

        if (!canChangeStatus) {
            throw new Error(`Permissions insuffisantes pour passer le planning de '${planning.status}' à '${newStatus}'. Rôle requis : ${this.getRequiredRoleForStatusChange(planning.status, newStatus)}`);
        }
    }

    /**
     * 🔐 NOUVELLE MÉTHODE : Vérifie les permissions pour les modifications de personnel
     */
    private async verifyStaffModificationPermissions(userId: number, siteId: string): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true }
        });

        if (!user) {
            throw new Error("Utilisateur non trouvé pour vérification des permissions.");
        }

        // Seuls les administrateurs et chefs de service peuvent modifier les affectations de personnel
        const allowedRoles = ['ADMIN_TOTAL', 'ADMIN_PARTIEL', 'CHEF_SERVICE', 'CADRE_BLOC'];

        if (!allowedRoles.includes(user.role)) {
            throw new Error(`Permissions insuffisantes pour modifier le personnel du bloc. Rôle requis : ${allowedRoles.join(', ')}`);
        }
    }

    /**
     * 🔐 NOUVELLE MÉTHODE : Détermine si un utilisateur peut changer un statut
     */
    private canUserChangeStatus(userRole: string, currentStatus: BlocPlanningStatus, newStatus: BlocPlanningStatus): boolean {
        // Règles de permissions par rôle
        const permissionMatrix: Record<string, boolean | Record<string, string[]>> = {
            'ADMIN_TOTAL': true, // Peut tout faire
            'ADMIN_PARTIEL': {
                'DRAFT': ['VALIDATED', 'LOCKED'],
                'VALIDATED': ['DRAFT', 'LOCKED'],
                'LOCKED': ['VALIDATED']
            },
            'CHEF_SERVICE': {
                'DRAFT': ['VALIDATED'],
                'VALIDATED': ['DRAFT']
            },
            'CADRE_BLOC': {
                'DRAFT': ['VALIDATED'],
                'VALIDATED': ['DRAFT']
            }
        };

        if (userRole === 'ADMIN_TOTAL') return true;

        const userPermissions = permissionMatrix[userRole];
        if (!userPermissions || typeof userPermissions === 'boolean') return false;

        const allowedTransitions = (userPermissions as Record<string, string[]>)[currentStatus];
        return Array.isArray(allowedTransitions) && allowedTransitions.includes(newStatus);
    }

    /**
     * 🔐 NOUVELLE MÉTHODE : Retourne le rôle requis pour un changement de statut
     */
    private getRequiredRoleForStatusChange(currentStatus: BlocPlanningStatus, newStatus: BlocPlanningStatus): string {
        if (newStatus === BlocPlanningStatus.LOCKED) {
            return 'ADMIN_TOTAL ou ADMIN_PARTIEL';
        }
        if (currentStatus === BlocPlanningStatus.LOCKED) {
            return 'ADMIN_TOTAL ou ADMIN_PARTIEL';
        }
        return 'CHEF_SERVICE, CADRE_BLOC ou ADMIN';
    }
} // Fin de la classe BlocPlanningService

// Exporter une instance du service
export const blocPlanningService = new BlocPlanningService(); 