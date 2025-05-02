import {
    parseDate,
    formatDate,
    isValidDateObject,
    isValidDateString,
    isDateBefore,
    isDateAfter,
    areDatesSameDay,
    getStartOfDay,
    getEndOfDay,
    addDaysToDate,
    getDifferenceInDays,
    DEFAULT_DATE_FORMAT,
    ISO_DATE_FORMAT
} from './dateUtils';

describe('dateUtils', () => {

    // --- Validation Tests ---
    describe('isValidDateObject', () => {
        it('should return true for valid Date objects', () => {
            expect(isValidDateObject(new Date())).toBe(true);
            expect(isValidDateObject(new Date(2023, 10, 21))).toBe(true);
        });

        it('should return false for invalid Date objects', () => {
            expect(isValidDateObject(new Date('invalid date string'))).toBe(false);
        });

        it('should return false for non-Date values', () => {
            expect(isValidDateObject(null)).toBe(false);
            expect(isValidDateObject(undefined)).toBe(false);
            expect(isValidDateObject('2023-10-21')).toBe(false);
            expect(isValidDateObject(1666303200000)).toBe(false);
            expect(isValidDateObject({})).toBe(false);
        });
    });

    describe('isValidDateString', () => {
        it('should return true for valid date strings (ISO, default format)', () => {
            expect(isValidDateString('2023-10-27T10:00:00.000Z')).toBe(true);
            expect(isValidDateString('2023-10-27')).toBe(true);
            expect(isValidDateString('27/10/2023')).toBe(true);
        });

        it('should return true for valid timestamps', () => {
            expect(isValidDateString(1666864800000)).toBe(true); // 27 Oct 2022
        });

        it('should return false for invalid date strings', () => {
            expect(isValidDateString('invalid date')).toBe(false);
            expect(isValidDateString('27-10-2023')).toBe(false); // Format non géré par défaut
            expect(isValidDateString('10/27/2023')).toBe(false); // Format US
        });

        it('should return false for null/undefined', () => {
            expect(isValidDateString(null)).toBe(false);
            expect(isValidDateString(undefined)).toBe(false);
        });
    });

    // --- Parsing Tests ---
    describe('parseDate', () => {
        it('should parse valid ISO strings', () => {
            const date = parseDate('2023-10-27T12:00:00.000Z');
            expect(isValidDateObject(date)).toBe(true);
            expect(date?.toISOString()).toBe('2023-10-27T12:00:00.000Z');
        });

        it('should parse valid yyyy-MM-dd strings', () => {
            const date = parseDate('2023-10-27');
            expect(isValidDateObject(date)).toBe(true);
            expect(date?.getFullYear()).toBe(2023);
            expect(date?.getMonth()).toBe(9); // Mois est 0-indexé
            expect(date?.getDate()).toBe(27);
        });

        it('should parse valid dd/MM/yyyy strings', () => {
            const date = parseDate('27/10/2023');
            expect(isValidDateObject(date)).toBe(true);
            expect(date?.getFullYear()).toBe(2023);
            expect(date?.getMonth()).toBe(9);
            expect(date?.getDate()).toBe(27);
        });

        it('should parse valid timestamps', () => {
            const timestamp = 1666864800000; // 27 Oct 2022 10:00:00 GMT
            const date = parseDate(timestamp);
            expect(isValidDateObject(date)).toBe(true);
            expect(date?.getTime()).toBe(timestamp);
        });

        it('should return the same Date object if passed a valid Date', () => {
            const originalDate = new Date();
            const date = parseDate(originalDate);
            expect(date).toBe(originalDate);
        });

        it('should return null for invalid inputs', () => {
            expect(parseDate('invalid')).toBeNull();
            expect(parseDate('27-10-2023')).toBeNull();
            expect(parseDate(null)).toBeNull();
            expect(parseDate(undefined)).toBeNull();
            expect(parseDate(new Date('invalid'))).toBeNull();
        });
    });

    // --- Formatting Tests ---
    describe('formatDate', () => {
        const testDate = new Date(2023, 9, 27, 14, 30); // 27 Oct 2023 14:30

        it('should format date with default format (dd/MM/yyyy)', () => {
            expect(formatDate(testDate)).toBe('27/10/2023');
            expect(formatDate('2023-10-27T14:30:00.000Z')).toBe('27/10/2023');
        });

        it('should format date with ISO format', () => {
            expect(formatDate(testDate, ISO_DATE_FORMAT)).toBe('2023-10-27');
        });

        it('should format date with custom format', () => {
            expect(formatDate(testDate, 'PPPPpppp')).toContain('vendredi 27 octobre 2023'); // Format long avec heure
        });

        it('should return empty string for invalid dates', () => {
            expect(formatDate(null)).toBe('');
            expect(formatDate(undefined)).toBe('');
            expect(formatDate('invalid')).toBe('');
        });
    });

    // --- Comparison Tests ---
    describe('isDateBefore', () => {
        it('should return true if date1 is before date2', () => {
            expect(isDateBefore('2023-10-26', '2023-10-27')).toBe(true);
            expect(isDateBefore(new Date(2023, 9, 26), new Date(2023, 9, 27))).toBe(true);
        });

        it('should return false if date1 is not before date2', () => {
            expect(isDateBefore('2023-10-27', '2023-10-27')).toBe(false);
            expect(isDateBefore('2023-10-28', '2023-10-27')).toBe(false);
        });
        it('should return false for invalid dates', () => {
            expect(isDateBefore('invalid', '2023-10-27')).toBe(false);
            expect(isDateBefore('2023-10-27', 'invalid date')).toBe(false);
        });
    });

    describe('areDatesSameDay', () => {
        it('should return true if dates are on the same day (ignoring time)', () => {
            expect(areDatesSameDay('2023-10-27T10:00:00Z', '2023-10-27T18:00:00Z')).toBe(true);
            expect(areDatesSameDay(new Date(2023, 9, 27, 8), new Date(2023, 9, 27, 16))).toBe(true);
        });

        it('should return false if dates are on different days', () => {
            expect(areDatesSameDay('2023-10-26', '2023-10-27')).toBe(false);
        });
        it('should return false for invalid dates', () => {
            expect(areDatesSameDay('invalid', '2023-10-27')).toBe(false);
        });
    });

    // --- Manipulation Tests ---
    describe('addDaysToDate', () => {
        it('should add days correctly', () => {
            const date = addDaysToDate('2023-10-27', 3);
            expect(formatDate(date)).toBe('30/10/2023');
        });
        it('should subtract days correctly', () => {
            const date = addDaysToDate('2023-10-27', -2);
            expect(formatDate(date)).toBe('25/10/2023');
        });
        it('should return null for invalid input date', () => {
            expect(addDaysToDate('invalid', 3)).toBeNull();
        });
    });

    // Add more tests for getStartOfDay, getEndOfDay, getDifferenceInDays, etc.

}); 