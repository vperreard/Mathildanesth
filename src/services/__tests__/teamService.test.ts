import { TeamService, teamService } from '../teamService';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findMany: jest.fn()
        },
        surgeon: {
            findMany: jest.fn()
        }
    }
}));

describe('TeamService', () => {
    let service: TeamService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new TeamService();
    });

    const mockUser = {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
        professionalRole: 'IADE',
        sites: [{ id: 'site-1', name: 'Site 1' }],
        leaves: []
    };

    const mockSurgeon = {
        id: 'surgeon-1',
        name: 'Dr. Smith',
        email: 'smith@example.com',
        sites: [{ id: 'site-1', name: 'Site 1' }],
        specialties: ['Orthopédie', 'Traumatologie']
    };

    describe('getTeamBySite', () => {
        it('should return team members for a specific site', async () => {
            const users = [
                mockUser,
                { ...mockUser, id: 'user-2', name: 'Jane Smith' }
            ];

            (prisma.user.findMany as jest.Mock).mockResolvedValue(users);

            const result = await service.getTeamBySite('site-1');

            expect(prisma.user.findMany).toHaveBeenCalledWith({
                where: {
                    sites: {
                        some: {
                            id: 'site-1'
                        }
                    }
                },
                include: {
                    sites: true
                }
            });

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: 'user-1',
                name: 'John Doe',
                email: 'john@example.com',
                role: 'USER',
                professionalRole: 'IADE',
                sites: [{ id: 'site-1', name: 'Site 1' }],
                skills: []
            });
        });

        it('should return empty array if no users found', async () => {
            (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

            const result = await service.getTeamBySite('site-999');

            expect(result).toEqual([]);
        });

        it('should handle users without professionalRole', async () => {
            const userWithoutRole = { ...mockUser, professionalRole: null };
            (prisma.user.findMany as jest.Mock).mockResolvedValue([userWithoutRole]);

            const result = await service.getTeamBySite('site-1');

            expect(result[0].professionalRole).toBeUndefined();
        });
    });

    describe('getTeamByRole', () => {
        it('should return team members by professional role', async () => {
            const iadeUsers = [
                mockUser,
                { ...mockUser, id: 'user-2', name: 'Another IADE' }
            ];

            (prisma.user.findMany as jest.Mock).mockResolvedValue(iadeUsers);

            const result = await service.getTeamByRole('IADE');

            expect(prisma.user.findMany).toHaveBeenCalledWith({
                where: {
                    professionalRole: 'IADE'
                },
                include: {
                    sites: true
                }
            });

            expect(result).toHaveLength(2);
            expect(result.every(member => member.professionalRole === 'IADE')).toBe(true);
        });

        it('should filter by both role and site', async () => {
            (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

            const result = await service.getTeamByRole('IADE', 'site-1');

            expect(prisma.user.findMany).toHaveBeenCalledWith({
                where: {
                    professionalRole: 'IADE',
                    sites: {
                        some: {
                            id: 'site-1'
                        }
                    }
                },
                include: {
                    sites: true
                }
            });

            expect(result).toHaveLength(1);
        });
    });

    describe('getAvailableTeamMembers', () => {
        it('should return only users not on leave', async () => {
            const users = [
                mockUser,
                { ...mockUser, id: 'user-2', name: 'On Leave', leaves: [{ id: 'leave-1' }] }
            ];

            (prisma.user.findMany as jest.Mock).mockResolvedValue(users);

            const testDate = new Date('2025-06-04');
            const result = await service.getAvailableTeamMembers(testDate);

            expect(prisma.user.findMany).toHaveBeenCalledWith({
                where: {},
                include: {
                    sites: true,
                    leaves: {
                        where: {
                            startDate: { lte: testDate },
                            endDate: { gte: testDate },
                            status: { in: ['PENDING', 'APPROVED'] }
                        }
                    }
                }
            });

            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('John Doe');
        });

        it('should filter by site and role when provided', async () => {
            (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

            const testDate = new Date('2025-06-04');
            const result = await service.getAvailableTeamMembers(testDate, 'site-1', 'IADE');

            expect(prisma.user.findMany).toHaveBeenCalledWith({
                where: {
                    sites: {
                        some: {
                            id: 'site-1'
                        }
                    },
                    professionalRole: 'IADE'
                },
                include: expect.any(Object)
            });

            expect(result).toBeDefined();
        });

        it('should return empty array if all users are on leave', async () => {
            const usersOnLeave = [
                { ...mockUser, leaves: [{ id: 'leave-1' }] },
                { ...mockUser, id: 'user-2', leaves: [{ id: 'leave-2' }] }
            ];

            (prisma.user.findMany as jest.Mock).mockResolvedValue(usersOnLeave);

            const result = await service.getAvailableTeamMembers(new Date());

            expect(result).toEqual([]);
        });
    });

    describe('getSurgeonTeamMembers', () => {
        it('should return surgeons as team members', async () => {
            const surgeons = [mockSurgeon, { ...mockSurgeon, id: 'surgeon-2', name: 'Dr. Jones' }];

            (prisma.surgeon.findMany as jest.Mock).mockResolvedValue(surgeons);

            const result = await service.getSurgeonTeamMembers();

            expect(prisma.surgeon.findMany).toHaveBeenCalledWith({
                where: {},
                include: {
                    sites: true
                }
            });

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: 'surgeon-1',
                name: 'Dr. Smith',
                email: 'smith@example.com',
                role: 'SURGEON',
                professionalRole: 'SURGEON',
                sites: [{ id: 'site-1', name: 'Site 1' }],
                skills: ['Orthopédie', 'Traumatologie']
            });
        });

        it('should filter by site when provided', async () => {
            (prisma.surgeon.findMany as jest.Mock).mockResolvedValue([mockSurgeon]);

            const result = await service.getSurgeonTeamMembers('site-1');

            expect(prisma.surgeon.findMany).toHaveBeenCalledWith({
                where: {
                    sites: {
                        some: {
                            id: 'site-1'
                        }
                    }
                },
                include: {
                    sites: true
                }
            });

            expect(result).toHaveLength(1);
        });

        it('should handle surgeons without email or specialties', async () => {
            const surgeonNoEmail = { ...mockSurgeon, email: null, specialties: null };
            (prisma.surgeon.findMany as jest.Mock).mockResolvedValue([surgeonNoEmail]);

            const result = await service.getSurgeonTeamMembers();

            expect(result[0].email).toBe('');
            expect(result[0].skills).toEqual([]);
        });
    });

    describe('createTeam', () => {
        it('should create a team with members', async () => {
            const members = [mockUser, { ...mockUser, id: 'user-2', name: 'Member 2' }];
            (prisma.user.findMany as jest.Mock).mockResolvedValue(members);

            const teamData = {
                name: 'Test Team',
                description: 'A test team',
                siteId: 'site-1',
                memberIds: ['user-1', 'user-2']
            };

            const result = await service.createTeam(teamData);

            expect(prisma.user.findMany).toHaveBeenCalledWith({
                where: {
                    id: { in: ['user-1', 'user-2'] }
                },
                include: {
                    sites: true
                }
            });

            expect(result).toMatchObject({
                name: 'Test Team',
                description: 'A test team',
                siteId: 'site-1',
                members: expect.any(Array)
            });
            expect(result.members).toHaveLength(2);
            expect(result.id).toMatch(/^team-\d+$/);
            expect(result.createdAt).toBeInstanceOf(Date);
            expect(result.updatedAt).toBeInstanceOf(Date);
        });

        it('should create team without optional fields', async () => {
            (prisma.user.findMany as jest.Mock).mockResolvedValue([mockUser]);

            const result = await service.createTeam({
                name: 'Minimal Team',
                memberIds: ['user-1']
            });

            expect(result.description).toBeUndefined();
            expect(result.siteId).toBeUndefined();
            expect(result.members).toHaveLength(1);
        });
    });

    describe('singleton instance', () => {
        it('should export a singleton instance', () => {
            expect(teamService).toBeInstanceOf(TeamService);
        });
    });
});