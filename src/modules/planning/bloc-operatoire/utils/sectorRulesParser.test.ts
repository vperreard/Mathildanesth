import { describe, expect, it } from '@jest/globals';
import { JsonValue } from '@prisma/client/runtime/library';
import { getSectorRules, areRoomsContiguous, areAllRoomsConnected } from './sectorRulesParser';

describe('sectorRulesParser', () => {
    describe('getSectorRules', () => {
        it('should handle null or undefined input', () => {
            expect(getSectorRules(null)).toEqual({});
            expect(getSectorRules(undefined)).toEqual({});
        });

        it('should handle non-object input', () => {
            expect(getSectorRules('not an object' as unknown as JsonValue)).toEqual({});
            expect(getSectorRules([] as unknown as JsonValue)).toEqual({});
            expect(getSectorRules(123 as unknown as JsonValue)).toEqual({});
        });

        it('should extract contiguityMap from rules', () => {
            const rules = {
                contiguityMap: {
                    '1': ['2', '3'],
                    '2': ['1', '4'],
                    '3': ['1', '5'],
                    '4': ['2'],
                    '5': ['3']
                },
                maxRoomsPerSupervisor: 3
            };

            const result = getSectorRules(rules as unknown as JsonValue);

            expect(result.contiguityMap).toEqual(rules.contiguityMap);
            expect(result.maxRoomsPerSupervisor).toBe(3);
        });

        it('should extract requireContiguousRooms from rules', () => {
            const rules = {
                requireContiguousRooms: true,
                maxRoomsPerSupervisor: 2
            };

            const result = getSectorRules(rules as unknown as JsonValue);

            expect(result.requireContiguousRooms).toBe(true);
            expect(result.maxRoomsPerSupervisor).toBe(2);
        });

        it('should handle missing properties', () => {
            const rules = {
                someOtherProperty: 'value'
            };

            const result = getSectorRules(rules as unknown as JsonValue);

            expect(result.contiguityMap).toBeUndefined();
            expect(result.requireContiguousRooms).toBeUndefined();
            expect(result.maxRoomsPerSupervisor).toBeUndefined();
        });
    });

    describe('areRoomsContiguous', () => {
        const contiguityMap = {
            '1': ['2', '3'],
            '2': ['1', '4'],
            '3': ['1', '5'],
            '4': ['2'],
            '5': ['3']
        };

        it('should return true for a single room', () => {
            const result = areRoomsContiguous(['1'], contiguityMap);
            expect(result).toBe(true);
        });

        it('should return true for directly connected rooms', () => {
            const result = areRoomsContiguous(['1', '2'], contiguityMap);
            expect(result).toBe(true);
        });

        it('should return true for indirectly connected rooms', () => {
            const result = areRoomsContiguous(['1', '4'], contiguityMap);
            expect(result).toBe(true);
        });

        it('should return true for multiple connected rooms', () => {
            const result = areRoomsContiguous(['1', '2', '3'], contiguityMap);
            expect(result).toBe(true);
        });

        it('should return false for disconnected rooms', () => {
            const result = areRoomsContiguous(['1', '6'], contiguityMap);
            expect(result).toBe(false);
        });

        it('should handle undefined contiguity map', () => {
            const result = areRoomsContiguous(['1', '2'], undefined);
            expect(result).toBe(true);
        });
    });

    describe('areAllRoomsConnected', () => {
        it('should handle empty room list', () => {
            const result = areAllRoomsConnected([]);
            expect(result).toBe(true);
        });

        it('should handle single room', () => {
            const result = areAllRoomsConnected([{ id: 1, number: '1' }]);
            expect(result).toBe(true);
        });

        it('should determine if rooms are sequential by number', () => {
            const rooms = [
                { id: 1, number: '1' },
                { id: 2, number: '2' },
                { id: 3, number: '3' }
            ];
            const result = areAllRoomsConnected(rooms);
            expect(result).toBe(true);
        });

        it('should handle non-sequential rooms', () => {
            const rooms = [
                { id: 1, number: '1' },
                { id: 3, number: '3' },
                { id: 5, number: '5' }
            ];
            const result = areAllRoomsConnected(rooms);
            expect(result).toBe(false);
        });

        it('should handle non-numeric room numbers', () => {
            const rooms = [
                { id: 1, number: 'A' },
                { id: 2, number: 'B' },
                { id: 3, number: 'C' }
            ];
            const result = areAllRoomsConnected(rooms);
            expect(result).toBe(true);
        });

        it('should handle mixed numeric and non-numeric room numbers', () => {
            const rooms = [
                { id: 1, number: '1' },
                { id: 2, number: 'A' },
                { id: 3, number: '2' }
            ];
            const result = areAllRoomsConnected(rooms);
            expect(result).toBe(false);
        });
    });
}); 