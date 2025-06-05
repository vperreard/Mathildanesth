import {
    getDayPlanning,
    validateDayPlanning,
    saveDayPlanning,
    getAllOperatingRooms,
    getOperatingRoomById,
    blocPlanningService
} from '../blocPlanningService';

describe('blocPlanningService', () => {
    let consoleWarnSpy: jest.SpyInstance;
    let originalEnv: string | undefined;

    beforeEach(() => {
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'test';
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
        process.env.NODE_ENV = originalEnv;
    });

    describe('getDayPlanning', () => {
        it('should return empty array by default', async () => {
            const result = await getDayPlanning('2025-06-04', 'room-1');
            
            expect(result).toEqual([]);
            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });

        it('should handle forced error in test environment', async () => {
            const result = await getDayPlanning('FORCE_ERROR');
            
            expect(result).toEqual([]);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'getDayPlanning fallback used:',
                expect.any(Error)
            );
        });

        it('should handle various argument combinations', async () => {
            const testCases = [
                [],
                ['2025-06-04'],
                ['2025-06-04', 'room-1', { shift: 'morning' }],
                [null, undefined, {}]
            ];

            for (const args of testCases) {
                const result = await getDayPlanning(...args);
                expect(result).toEqual([]);
            }
        });
    });

    describe('validateDayPlanning', () => {
        it('should return valid planning by default', async () => {
            const result = await validateDayPlanning({
                date: '2025-06-04',
                assignments: []
            });
            
            expect(result).toEqual({
                valid: true,
                violations: []
            });
            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });

        it('should handle forced error in test environment', async () => {
            const result = await validateDayPlanning('FORCE_ERROR');
            
            expect(result).toEqual({
                valid: true,
                violations: []
            });
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'validateDayPlanning fallback used:',
                expect.any(Error)
            );
        });

        it('should maintain result structure regardless of input', async () => {
            const inputs = [
                { assignments: [{ id: 1 }] },
                [],
                null,
                undefined,
                'invalid'
            ];

            for (const input of inputs) {
                const result = await validateDayPlanning(input);
                expect(result).toHaveProperty('valid', true);
                expect(result).toHaveProperty('violations');
                expect(Array.isArray(result.violations)).toBe(true);
            }
        });
    });

    describe('saveDayPlanning', () => {
        it('should return true by default', async () => {
            const result = await saveDayPlanning({
                date: '2025-06-04',
                roomId: 'room-1',
                assignments: []
            });
            
            expect(result).toBe(true);
            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });

        it('should handle forced error in test environment', async () => {
            const result = await saveDayPlanning('FORCE_ERROR');
            
            expect(result).toBe(true);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'saveDayPlanning fallback used:',
                expect.any(Error)
            );
        });

        it('should always return true regardless of input', async () => {
            const inputs = [
                { valid: false },
                null,
                undefined,
                [],
                'string',
                12345
            ];

            for (const input of inputs) {
                const result = await saveDayPlanning(input);
                expect(result).toBe(true);
            }
        });
    });

    describe('getAllOperatingRooms', () => {
        it('should return empty array by default', async () => {
            const result = await getAllOperatingRooms();
            
            expect(result).toEqual([]);
            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });

        it('should handle forced error in test environment', async () => {
            const result = await getAllOperatingRooms('FORCE_ERROR');
            
            expect(result).toEqual([]);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'getAllOperatingRooms fallback used:',
                expect.any(Error)
            );
        });

        it('should accept optional parameters', async () => {
            const result = await getAllOperatingRooms({ includeInactive: true });
            
            expect(result).toEqual([]);
            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });
    });

    describe('getOperatingRoomById', () => {
        it('should return null by default', async () => {
            const result = await getOperatingRoomById('room-123');
            
            expect(result).toBeNull();
            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });

        it('should handle forced error in test environment', async () => {
            const result = await getOperatingRoomById('FORCE_ERROR');
            
            expect(result).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'getOperatingRoomById fallback used:',
                expect.any(Error)
            );
        });

        it('should return null for any input', async () => {
            const inputs = [
                'room-1',
                123,
                null,
                undefined,
                { id: 'room-1' }
            ];

            for (const input of inputs) {
                const result = await getOperatingRoomById(input);
                expect(result).toBeNull();
            }
        });
    });

    describe('blocPlanningService object', () => {
        it('should export all functions as service methods', () => {
            expect(blocPlanningService).toEqual({
                getDayPlanning: expect.any(Function),
                validateDayPlanning: expect.any(Function),
                saveDayPlanning: expect.any(Function),
                getAllOperatingRooms: expect.any(Function),
                getOperatingRoomById: expect.any(Function)
            });
        });

        it('should have methods that work identically to exported functions', async () => {
            const planningResult = await blocPlanningService.getDayPlanning();
            expect(planningResult).toEqual([]);

            const validationResult = await blocPlanningService.validateDayPlanning();
            expect(validationResult).toEqual({ valid: true, violations: [] });

            const saveResult = await blocPlanningService.saveDayPlanning();
            expect(saveResult).toBe(true);

            const roomsResult = await blocPlanningService.getAllOperatingRooms();
            expect(roomsResult).toEqual([]);

            const roomResult = await blocPlanningService.getOperatingRoomById('123');
            expect(roomResult).toBeNull();
        });
    });

    describe('error handling in non-test environment', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'production';
        });

        it('should not throw errors in production', async () => {
            // Even with FORCE_ERROR, should not throw in production
            const results = await Promise.all([
                getDayPlanning('FORCE_ERROR'),
                validateDayPlanning('FORCE_ERROR'),
                saveDayPlanning('FORCE_ERROR'),
                getAllOperatingRooms('FORCE_ERROR'),
                getOperatingRoomById('FORCE_ERROR')
            ]);

            expect(results[0]).toEqual([]);
            expect(results[1]).toEqual({ valid: true, violations: [] });
            expect(results[2]).toBe(true);
            expect(results[3]).toEqual([]);
            expect(results[4]).toBeNull();
            
            // Should not log warnings in production with FORCE_ERROR
            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });
    });
});