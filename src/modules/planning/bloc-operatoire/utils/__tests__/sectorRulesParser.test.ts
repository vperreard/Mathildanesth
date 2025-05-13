import { getSectorRules, areRoomsContiguous, areAllRoomsConnected } from '../sectorRulesParser';

describe('sectorRulesParser', () => {
    describe('getSectorRules', () => {
        it('should return empty object for null or undefined', () => {
            expect(getSectorRules(null)).toEqual({});
            expect(getSectorRules(undefined)).toEqual({});
        });

        it('should extract requireContiguousRooms', () => {
            const rules = { requireContiguousRooms: true };
            expect(getSectorRules(rules)).toEqual({ requireContiguousRooms: true });
        });

        it('should extract minIADEPerRoom', () => {
            const rules = { minIADEPerRoom: 2 };
            expect(getSectorRules(rules)).toEqual({ minIADEPerRoom: 2 });
        });

        it('should extract contiguityMap', () => {
            const rules = { contiguityMap: { '1': ['2', '3'], '2': ['1', '4'] } };
            expect(getSectorRules(rules)).toEqual({
                contiguityMap: { '1': ['2', '3'], '2': ['1', '4'] }
            });
        });

        it('should handle invalid values', () => {
            const rules = {
                requireContiguousRooms: 'not-a-boolean',
                minIADEPerRoom: 'not-a-number',
                contiguityMap: 'not-an-object'
            };
            expect(getSectorRules(rules)).toEqual({});
        });
    });

    describe('areRoomsContiguous', () => {
        const contiguityMap = {
            '1': ['2', '3'],
            '2': ['1', '4'],
            '3': ['1'],
            '4': ['2']
        };

        it('should return true for contiguous rooms', () => {
            expect(areRoomsContiguous('1', '2', contiguityMap)).toBe(true);
            expect(areRoomsContiguous('2', '1', contiguityMap)).toBe(true);
            expect(areRoomsContiguous(1, 3, contiguityMap)).toBe(true);
        });

        it('should return false for non-contiguous rooms', () => {
            expect(areRoomsContiguous('1', '4', contiguityMap)).toBe(false);
            expect(areRoomsContiguous('3', '4', contiguityMap)).toBe(false);
        });

        it('should return false when contiguityMap is undefined', () => {
            expect(areRoomsContiguous('1', '2')).toBe(false);
        });
    });

    describe('areAllRoomsConnected', () => {
        const contiguityMap = {
            '1': ['2', '3'],
            '2': ['1', '4'],
            '3': ['1', '5'],
            '4': ['2'],
            '5': ['3'],
            '6': ['7'],
            '7': ['6']
        };

        it('should return true for connected subsets of rooms', () => {
            expect(areAllRoomsConnected(['1', '2', '3', '4', '5'], contiguityMap)).toBe(true);
            expect(areAllRoomsConnected(['6', '7'], contiguityMap)).toBe(true);
            expect(areAllRoomsConnected(['1', '2', '4'], contiguityMap)).toBe(true);
        });

        it('should return false for disconnected subsets of rooms', () => {
            expect(areAllRoomsConnected(['1', '6'], contiguityMap)).toBe(false);
            expect(areAllRoomsConnected(['1', '2', '3', '6'], contiguityMap)).toBe(false);
        });

        it('should handle edge cases', () => {
            expect(areAllRoomsConnected([], contiguityMap)).toBe(true);
            expect(areAllRoomsConnected(['1'], contiguityMap)).toBe(true);
        });
    });
}); 