import {
    DutyType,
    DutyStatus,
    PriorityLevel,
    Duty,
    DutyPreference,
    DutyUnavailability,
    DutyUnavailabilityCreateData,
    DutyUnavailabilityUpdateData,
    DutyUnavailabilityProcessData,
    DutyUnavailabilityFilter,
    DutyUnavailabilityConflict,
    DutySubstitutionRequest,
    DutyReport
} from '../duty';

describe('Duty Types', () => {
    describe('DutyType enum', () => {
        it('contient tous les types de garde attendus', () => {
            expect(DutyType.JOUR).toBe('JOUR');
            expect(DutyType.NUIT).toBe('NUIT');
            expect(DutyType.WEEKEND).toBe('WEEKEND');
            expect(DutyType.JOUR_FERIE).toBe('JOUR_FERIE');
            expect(DutyType.ASTREINTE).toBe('ASTREINTE');
            expect(DutyType.URGENCES).toBe('URGENCES');
            expect(DutyType.REANIMATION).toBe('REANIMATION');
            expect(DutyType.EVENEMENT_SPECIAL).toBe('EVENEMENT_SPECIAL');
        });

        it('a exactement 8 types de garde', () => {
            const dutyTypes = Object.values(DutyType);
            expect(dutyTypes).toHaveLength(8);
        });

        it('tous les types sont en majuscules avec underscores', () => {
            Object.values(DutyType).forEach(type => {
                expect(type).toMatch(/^[A-Z_]+$/);
            });
        });
    });

    describe('DutyStatus enum', () => {
        it('contient tous les statuts attendus', () => {
            expect(DutyStatus.PLANIFIEE).toBe('PLANIFIEE');
            expect(DutyStatus.CONFIRMEE).toBe('CONFIRMEE');
            expect(DutyStatus.EN_COURS).toBe('EN_COURS');
            expect(DutyStatus.TERMINEE).toBe('TERMINEE');
            expect(DutyStatus.ANNULEE).toBe('ANNULEE');
            expect(DutyStatus.MODIFIEE).toBe('MODIFIEE');
        });

        it('a exactement 6 statuts', () => {
            const statuses = Object.values(DutyStatus);
            expect(statuses).toHaveLength(6);
        });
    });

    describe('PriorityLevel enum', () => {
        it('contient tous les niveaux de priorité', () => {
            expect(PriorityLevel.BASSE).toBe('BASSE');
            expect(PriorityLevel.NORMALE).toBe('NORMALE');
            expect(PriorityLevel.HAUTE).toBe('HAUTE');
            expect(PriorityLevel.CRITIQUE).toBe('CRITIQUE');
        });

        it('a exactement 4 niveaux de priorité', () => {
            const priorities = Object.values(PriorityLevel);
            expect(priorities).toHaveLength(4);
        });
    });

    describe('Duty interface', () => {
        it('peut créer une garde basique', () => {
            const duty: Duty = {
                id: 'duty-123',
                type: DutyType.JOUR,
                serviceId: 'service-1',
                startTime: new Date('2025-05-27T08:00:00Z'),
                endTime: new Date('2025-05-27T20:00:00Z'),
                status: DutyStatus.PLANIFIEE,
                priorityLevel: PriorityLevel.NORMALE,
                substitutionAllowed: true,
                exchangeAllowed: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'admin-1',
                updatedBy: 'admin-1'
            };

            expect(duty.id).toBe('duty-123');
            expect(duty.type).toBe(DutyType.JOUR);
            expect(duty.status).toBe(DutyStatus.PLANIFIEE);
            expect(duty.substitutionAllowed).toBe(true);
        });

        it('peut inclure un médecin assigné', () => {
            const duty: Duty = {
                id: 'duty-456',
                type: DutyType.NUIT,
                serviceId: 'service-2',
                startTime: new Date('2025-05-27T20:00:00Z'),
                endTime: new Date('2025-05-28T08:00:00Z'),
                assignedDoctorId: 'dr-123',
                status: DutyStatus.CONFIRMEE,
                priorityLevel: PriorityLevel.HAUTE,
                requiredSkills: ['reanimation', 'urgences'],
                notes: 'Garde de nuit avec astreinte',
                substitutionAllowed: false,
                exchangeAllowed: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'admin-1',
                updatedBy: 'admin-1'
            };

            expect(duty.assignedDoctorId).toBe('dr-123');
            expect(duty.requiredSkills).toContain('reanimation');
            expect(duty.notes).toContain('nuit');
        });

        it('peut inclure une récurrence', () => {
            const duty: Duty = {
                id: 'duty-789',
                type: DutyType.WEEKEND,
                serviceId: 'service-3',
                startTime: new Date('2025-05-31T08:00:00Z'),
                endTime: new Date('2025-06-01T08:00:00Z'),
                status: DutyStatus.PLANIFIEE,
                priorityLevel: PriorityLevel.NORMALE,
                recurrence: {
                    type: 'HEBDOMADAIRE',
                    interval: 1,
                    daysOfWeek: [6, 0], // Samedi et dimanche
                    endDate: new Date('2025-12-31'),
                    maxOccurrences: 26
                },
                substitutionAllowed: true,
                exchangeAllowed: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'admin-1',
                updatedBy: 'admin-1'
            };

            expect(duty.recurrence?.type).toBe('HEBDOMADAIRE');
            expect(duty.recurrence?.daysOfWeek).toEqual([6, 0]);
            expect(duty.recurrence?.maxOccurrences).toBe(26);
        });

        it('peut inclure une compensation', () => {
            const duty: Duty = {
                id: 'duty-comp',
                type: DutyType.JOUR_FERIE,
                serviceId: 'service-4',
                startTime: new Date('2025-05-01T08:00:00Z'),
                endTime: new Date('2025-05-01T20:00:00Z'),
                status: DutyStatus.CONFIRMEE,
                priorityLevel: PriorityLevel.HAUTE,
                compensation: {
                    baseAmount: 500,
                    currency: 'EUR',
                    bonus: 100,
                    extraHours: 4
                },
                substitutionAllowed: true,
                exchangeAllowed: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'admin-1',
                updatedBy: 'admin-1'
            };

            expect(duty.compensation?.baseAmount).toBe(500);
            expect(duty.compensation?.currency).toBe('EUR');
            expect(duty.compensation?.bonus).toBe(100);
        });
    });

    describe('DutyPreference interface', () => {
        it('peut créer des préférences de garde', () => {
            const preference: DutyPreference = {
                id: 'pref-123',
                doctorId: 'dr-456',
                preferredServiceIds: ['service-1', 'service-2'],
                preferredDutyTypes: [DutyType.JOUR, DutyType.WEEKEND],
                preferredDays: [1, 2, 3, 4, 5], // Lundi à vendredi
                maxDutiesPerMonth: 8,
                maxNightDutiesPerMonth: 2,
                maxWeekendDutiesPerMonth: 2,
                avoidDutyTypes: [DutyType.NUIT],
                advanceNoticeRequired: 7,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(preference.doctorId).toBe('dr-456');
            expect(preference.preferredDutyTypes).toContain(DutyType.JOUR);
            expect(preference.maxDutiesPerMonth).toBe(8);
            expect(preference.avoidDutyTypes).toContain(DutyType.NUIT);
        });

        it('peut inclure des créneaux horaires préférés', () => {
            const preference: DutyPreference = {
                id: 'pref-456',
                doctorId: 'dr-789',
                preferredTimeSlots: [
                    {
                        startTime: '08:00',
                        endTime: '16:00',
                        days: [1, 2, 3, 4, 5]
                    },
                    {
                        startTime: '09:00',
                        endTime: '17:00',
                        days: [6, 0]
                    }
                ],
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(preference.preferredTimeSlots).toHaveLength(2);
            expect(preference.preferredTimeSlots?.[0].startTime).toBe('08:00');
            expect(preference.preferredTimeSlots?.[1].days).toEqual([6, 0]);
        });
    });

    describe('DutyUnavailability interface', () => {
        it('peut créer une indisponibilité de garde', () => {
            const unavailability: DutyUnavailability = {
                id: 'unavail-123',
                doctorId: 'dr-123',
                startDate: new Date('2025-06-01'),
                endDate: new Date('2025-06-07'),
                unavailableFor: 'BOTH',
                recurrenceType: 'NONE',
                reason: 'Congés d\'été',
                status: 'PENDING',
                priority: 'MEDIUM',
                isFlexible: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(unavailability.doctorId).toBe('dr-123');
            expect(unavailability.unavailableFor).toBe('BOTH');
            expect(unavailability.status).toBe('PENDING');
            expect(unavailability.reason).toContain('Congés');
        });

        it('peut inclure des détails de récurrence', () => {
            const unavailability: DutyUnavailability = {
                id: 'unavail-456',
                doctorId: 'dr-456',
                startDate: new Date('2025-06-01'),
                endDate: new Date('2025-06-02'),
                unavailableFor: 'DUTY_ONLY',
                recurrenceType: 'WEEKLY',
                recurrenceDetails: {
                    daysOfWeek: [1], // Lundi
                    interval: 1,
                    endRecurrenceDate: new Date('2025-12-31'),
                    exceptions: [new Date('2025-07-14')] // Exception pour un lundi férié
                },
                status: 'APPROVED',
                priority: 'LOW',
                approvedBy: 'admin-1',
                approvedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(unavailability.recurrenceDetails?.daysOfWeek).toEqual([1]);
            expect(unavailability.recurrenceDetails?.exceptions).toHaveLength(1);
            expect(unavailability.approvedBy).toBe('admin-1');
        });
    });

    describe('DutySubstitutionRequest interface', () => {
        it('peut créer une demande de substitution', () => {
            const request: DutySubstitutionRequest = {
                id: 'sub-123',
                dutyId: 'duty-456',
                requestingDoctorId: 'dr-123',
                requestedAt: new Date(),
                reason: 'Urgence familiale',
                status: 'EN_ATTENTE',
                urgency: 'URGENTE',
                responseDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
                compensationOffered: {
                    type: 'ECHANGE',
                    description: 'Échange avec garde du weekend suivant',
                    exchangeDutyId: 'duty-789'
                },
                notificationSent: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(request.reason).toContain('familiale');
            expect(request.urgency).toBe('URGENTE');
            expect(request.compensationOffered?.type).toBe('ECHANGE');
            expect(request.notificationSent).toBe(true);
        });

        it('peut inclure des réponses de médecins', () => {
            const request: DutySubstitutionRequest = {
                id: 'sub-456',
                dutyId: 'duty-789',
                requestingDoctorId: 'dr-456',
                requestedAt: new Date(),
                reason: 'Formation',
                status: 'APPROUVEE',
                urgency: 'NORMALE',
                responses: [
                    {
                        doctorId: 'dr-789',
                        accepted: true,
                        comment: 'Disponible pour la substitution',
                        respondedAt: new Date()
                    },
                    {
                        doctorId: 'dr-101',
                        accepted: false,
                        comment: 'Déjà pris ce jour-là',
                        respondedAt: new Date(),
                        counterOffer: {
                            type: 'PARTIEL',
                            description: 'Disponible seulement le matin'
                        }
                    }
                ],
                notificationSent: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(request.responses).toHaveLength(2);
            expect(request.responses?.[0].accepted).toBe(true);
            expect(request.responses?.[1].counterOffer?.type).toBe('PARTIEL');
        });
    });

    describe('DutyReport interface', () => {
        it('peut créer un rapport de garde', () => {
            const report: DutyReport = {
                id: 'report-123',
                dutyId: 'duty-456',
                doctorId: 'dr-123',
                serviceId: 'service-1',
                actualStartTime: new Date('2025-05-27T08:00:00Z'),
                actualEndTime: new Date('2025-05-27T20:00:00Z'),
                patientsSeen: 15,
                workloadRating: 4,
                submitted: true,
                submittedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(report.patientsSeen).toBe(15);
            expect(report.workloadRating).toBe(4);
            expect(report.submitted).toBe(true);
        });

        it('peut inclure des procédures et incidents', () => {
            const report: DutyReport = {
                id: 'report-456',
                dutyId: 'duty-789',
                doctorId: 'dr-456',
                serviceId: 'service-2',
                actualStartTime: new Date('2025-05-27T20:00:00Z'),
                actualEndTime: new Date('2025-05-28T08:00:00Z'),
                patientsSeen: 8,
                proceduresPerformed: [
                    {
                        type: 'Intubation',
                        count: 3,
                        comments: 'Procédures d\'urgence'
                    },
                    {
                        type: 'Anesthésie générale',
                        count: 5
                    }
                ],
                incidents: [
                    {
                        type: 'Complication anesthésique',
                        description: 'Réaction allergique inattendue',
                        time: new Date('2025-05-27T22:30:00Z'),
                        actionsToken: 'Épinéphrine administrée, surveillance renforcée',
                        followUpRequired: true
                    }
                ],
                workloadRating: 5,
                submitted: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(report.proceduresPerformed).toHaveLength(2);
            expect(report.incidents).toHaveLength(1);
            expect(report.incidents?.[0].followUpRequired).toBe(true);
        });
    });

    describe('Type utilities', () => {
        it('DutyUnavailabilityCreateData exclut les champs système', () => {
            const createData: DutyUnavailabilityCreateData = {
                doctorId: 'dr-123',
                startDate: new Date(),
                endDate: new Date(),
                unavailableFor: 'BOTH',
                priority: 'MEDIUM'
            };

            // TypeScript vérifie que ces champs ne sont pas autorisés dans DutyUnavailabilityCreateData
            expect(createData.doctorId).toBe('dr-123');
            expect(createData.unavailableFor).toBe('BOTH');
            
            // Vérification que le type n'inclut pas les champs système
            const expectedExcludedKeys = ['id', 'status', 'approvedBy', 'approvedAt', 'rejectionReason', 'adminComments', 'createdAt', 'updatedAt'];
            expectedExcludedKeys.forEach(key => {
                expect(createData).not.toHaveProperty(key);
            });
        });

        it('DutyUnavailabilityUpdateData permet les champs optionnels', () => {
            const updateData: DutyUnavailabilityUpdateData = {
                reason: 'Nouveau motif',
                priority: 'HIGH'
            };

            expect(updateData.reason).toBe('Nouveau motif');
            expect(updateData.priority).toBe('HIGH');
        });

        it('DutyUnavailabilityProcessData a la structure attendue', () => {
            const processData: DutyUnavailabilityProcessData = {
                status: 'APPROVED',
                adminComments: 'Demande validée',
                alternativeProposal: {
                    alternativeDates: [new Date()],
                    comments: 'Alternative proposée'
                }
            };

            expect(processData.status).toBe('APPROVED');
            expect(processData.alternativeProposal?.comments).toBe('Alternative proposée');
        });
    });

    describe('Intégration et validation de cohérence', () => {
        it('les enums sont compatibles avec les interfaces', () => {
            const duty: Duty = {
                id: 'test',
                type: DutyType.URGENCES,
                serviceId: 'service',
                startTime: new Date(),
                endTime: new Date(),
                status: DutyStatus.EN_COURS,
                priorityLevel: PriorityLevel.CRITIQUE,
                substitutionAllowed: false,
                exchangeAllowed: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'admin',
                updatedBy: 'admin'
            };

            expect(Object.values(DutyType)).toContain(duty.type);
            expect(Object.values(DutyStatus)).toContain(duty.status);
            expect(Object.values(PriorityLevel)).toContain(duty.priorityLevel);
        });

        it('les structures sont sérialisables JSON', () => {
            const duty: Duty = {
                id: 'duty-json',
                type: DutyType.JOUR,
                serviceId: 'service-1',
                startTime: new Date('2025-05-27T08:00:00Z'),
                endTime: new Date('2025-05-27T20:00:00Z'),
                status: DutyStatus.PLANIFIEE,
                priorityLevel: PriorityLevel.NORMALE,
                substitutionAllowed: true,
                exchangeAllowed: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: 'admin',
                updatedBy: 'admin'
            };

            const json = JSON.stringify(duty);
            const parsed = JSON.parse(json);

            expect(parsed.id).toBe('duty-json');
            expect(parsed.type).toBe(DutyType.JOUR);
            expect(parsed.status).toBe(DutyStatus.PLANIFIEE);
        });

        it('les filtres fonctionnent avec les types', () => {
            const duties: Duty[] = [
                {
                    id: '1',
                    type: DutyType.JOUR,
                    serviceId: 'service-1',
                    startTime: new Date(),
                    endTime: new Date(),
                    status: DutyStatus.PLANIFIEE,
                    priorityLevel: PriorityLevel.NORMALE,
                    substitutionAllowed: true,
                    exchangeAllowed: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    createdBy: 'admin',
                    updatedBy: 'admin'
                },
                {
                    id: '2',
                    type: DutyType.NUIT,
                    serviceId: 'service-1',
                    startTime: new Date(),
                    endTime: new Date(),
                    status: DutyStatus.CONFIRMEE,
                    priorityLevel: PriorityLevel.HAUTE,
                    substitutionAllowed: true,
                    exchangeAllowed: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    createdBy: 'admin',
                    updatedBy: 'admin'
                }
            ];

            const nightDuties = duties.filter(d => d.type === DutyType.NUIT);
            const confirmedDuties = duties.filter(d => d.status === DutyStatus.CONFIRMEE);
            const highPriorityDuties = duties.filter(d => d.priorityLevel === PriorityLevel.HAUTE);

            expect(nightDuties).toHaveLength(1);
            expect(confirmedDuties).toHaveLength(1);
            expect(highPriorityDuties).toHaveLength(1);
        });
    });
});