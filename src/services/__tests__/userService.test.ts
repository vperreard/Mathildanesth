import { UserService } from '../userService';
import { UserServicePrisma } from '../userService-prisma';

// Mock the Prisma service
jest.mock('../userService-prisma', () => ({
    UserServicePrisma: {
        createUser: jest.fn(),
        findUserById: jest.fn(),
        findUserByLogin: jest.fn(),
        findUserByEmail: jest.fn(),
        updateUser: jest.fn(),
        deleteUser: jest.fn(),
        hardDeleteUser: jest.fn(),
        searchUsers: jest.fn(),
        getAllActiveUsers: jest.fn(),
        getUserStats: jest.fn(),
        getUserPermissions: jest.fn(),
        assignRole: jest.fn(),
        removeRole: jest.fn(),
        getUserActivity: jest.fn(),
        updateLastLogin: jest.fn()
    },
    cleanupPrisma: jest.fn()
}));

describe('UserService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockUser = {
        id: 1,
        login: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        roles: [],
        teams: [],
        specialties: [],
        leaves: [],
        skills: [],
        activityTypes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
    };

    describe('createUser', () => {
        it('should delegate to UserServicePrisma.createUser', async () => {
            const userData = {
                login: 'newuser',
                email: 'new@example.com',
                password: 'password123',
                firstName: 'New',
                lastName: 'User'
            };

            (UserServicePrisma.createUser as jest.Mock).mockResolvedValue(mockUser);

            const result = await UserService.createUser(userData);

            expect(UserServicePrisma.createUser).toHaveBeenCalledWith(userData);
            expect(result).toBe(mockUser);
        });
    });

    describe('findUserById', () => {
        it('should delegate to UserServicePrisma.findUserById', async () => {
            (UserServicePrisma.findUserById as jest.Mock).mockResolvedValue(mockUser);

            const result = await UserService.findUserById(1);

            expect(UserServicePrisma.findUserById).toHaveBeenCalledWith(1);
            expect(result).toBe(mockUser);
        });

        it('should return null if user not found', async () => {
            (UserServicePrisma.findUserById as jest.Mock).mockResolvedValue(null);

            const result = await UserService.findUserById(999);

            expect(UserServicePrisma.findUserById).toHaveBeenCalledWith(999);
            expect(result).toBeNull();
        });
    });

    describe('findUserByLogin', () => {
        it('should delegate to UserServicePrisma.findUserByLogin', async () => {
            (UserServicePrisma.findUserByLogin as jest.Mock).mockResolvedValue(mockUser);

            const result = await UserService.findUserByLogin('testuser');

            expect(UserServicePrisma.findUserByLogin).toHaveBeenCalledWith('testuser');
            expect(result).toBe(mockUser);
        });
    });

    describe('findUserByEmail', () => {
        it('should delegate to UserServicePrisma.findUserByEmail', async () => {
            (UserServicePrisma.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);

            const result = await UserService.findUserByEmail('test@example.com');

            expect(UserServicePrisma.findUserByEmail).toHaveBeenCalledWith('test@example.com');
            expect(result).toBe(mockUser);
        });
    });

    describe('updateUser', () => {
        it('should delegate to UserServicePrisma.updateUser', async () => {
            const updateData = {
                firstName: 'Updated',
                lastName: 'Name'
            };

            const updatedUser = { ...mockUser, ...updateData };
            (UserServicePrisma.updateUser as jest.Mock).mockResolvedValue(updatedUser);

            const result = await UserService.updateUser(1, updateData);

            expect(UserServicePrisma.updateUser).toHaveBeenCalledWith(1, updateData);
            expect(result).toBe(updatedUser);
        });
    });

    describe('deleteUser', () => {
        it('should delegate to UserServicePrisma.deleteUser', async () => {
            (UserServicePrisma.deleteUser as jest.Mock).mockResolvedValue(true);

            const result = await UserService.deleteUser(1);

            expect(UserServicePrisma.deleteUser).toHaveBeenCalledWith(1);
            expect(result).toBe(true);
        });

        it('should return false if deletion fails', async () => {
            (UserServicePrisma.deleteUser as jest.Mock).mockResolvedValue(false);

            const result = await UserService.deleteUser(999);

            expect(UserServicePrisma.deleteUser).toHaveBeenCalledWith(999);
            expect(result).toBe(false);
        });
    });

    describe('hardDeleteUser', () => {
        it('should delegate to UserServicePrisma.hardDeleteUser', async () => {
            (UserServicePrisma.hardDeleteUser as jest.Mock).mockResolvedValue(true);

            const result = await UserService.hardDeleteUser(1);

            expect(UserServicePrisma.hardDeleteUser).toHaveBeenCalledWith(1);
            expect(result).toBe(true);
        });
    });

    describe('searchUsers', () => {
        it('should delegate to UserServicePrisma.searchUsers with filters', async () => {
            const filters = {
                search: 'test',
                roleId: 1,
                teamId: 2,
                includeDeleted: false
            };

            const searchResult = {
                users: [mockUser],
                total: 1,
                page: 1,
                pageSize: 20
            };

            (UserServicePrisma.searchUsers as jest.Mock).mockResolvedValue(searchResult);

            const result = await UserService.searchUsers(filters);

            expect(UserServicePrisma.searchUsers).toHaveBeenCalledWith(filters);
            expect(result).toBe(searchResult);
        });

        it('should use empty filters object by default', async () => {
            const searchResult = {
                users: [],
                total: 0,
                page: 1,
                pageSize: 20
            };

            (UserServicePrisma.searchUsers as jest.Mock).mockResolvedValue(searchResult);

            const result = await UserService.searchUsers();

            expect(UserServicePrisma.searchUsers).toHaveBeenCalledWith({});
            expect(result).toBe(searchResult);
        });
    });

    describe('getAllActiveUsers', () => {
        it('should delegate to UserServicePrisma.getAllActiveUsers', async () => {
            const activeUsers = [mockUser, { ...mockUser, id: 2, login: 'user2' }];
            (UserServicePrisma.getAllActiveUsers as jest.Mock).mockResolvedValue(activeUsers);

            const result = await UserService.getAllActiveUsers();

            expect(UserServicePrisma.getAllActiveUsers).toHaveBeenCalled();
            expect(result).toBe(activeUsers);
            expect(result).toHaveLength(2);
        });

        it('should return empty array if no active users', async () => {
            (UserServicePrisma.getAllActiveUsers as jest.Mock).mockResolvedValue([]);

            const result = await UserService.getAllActiveUsers();

            expect(UserServicePrisma.getAllActiveUsers).toHaveBeenCalled();
            expect(result).toEqual([]);
        });
    });

    describe('error handling', () => {
        it('should propagate errors from UserServicePrisma', async () => {
            const error = new Error('Database error');
            (UserServicePrisma.createUser as jest.Mock).mockRejectedValue(error);

            await expect(UserService.createUser({
                login: 'test',
                email: 'test@example.com',
                password: 'password',
                firstName: 'Test',
                lastName: 'User'
            })).rejects.toThrow('Database error');
        });
    });
});