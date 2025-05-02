import {
    isValidDateObject,
    isValidDateString,
    parseDate,
    formatDate,
    isDateBefore,
    isDateAfter,
    areDatesSameDay,
    isDateWeekend,
    getDaysBetween,
    isSameDay
} from '../dateUtils';

describe('Service de validation des dates', () => {
    describe('isValidDateObject', () => {
        test('retourne true pour un objet Date valide', () => {
            expect(isValidDateObject(new Date())).toBe(true);
        });

        test('retourne false pour une date invalide', () => {
            expect(isValidDateObject(new Date('invalid date'))).toBe(false);
        });

        test('retourne false pour des valeurs non-Date', () => {
            expect(isValidDateObject('2023-01-01')).toBe(false);
            expect(isValidDateObject(123456789)).toBe(false);
            expect(isValidDateObject(null)).toBe(false);
            expect(isValidDateObject(undefined)).toBe(false);
            expect(isValidDateObject({})).toBe(false);
        });
    });

    describe('isValidDateString', () => {
        test('retourne true pour les chaînes de date valides', () => {
            expect(isValidDateString('2023-01-01')).toBe(true);
            expect(isValidDateString('01/01/2023')).toBe(true);
            expect(isValidDateString('2023-01-01T12:00:00.000Z')).toBe(true);
        });

        test('retourne false pour les chaînes de date invalides', () => {
            expect(isValidDateString('not a date')).toBe(false);
            expect(isValidDateString('2023-13-45')).toBe(false);
            expect(isValidDateString('')).toBe(false);
        });

        test('retourne false pour null et undefined', () => {
            expect(isValidDateString(null)).toBe(false);
            expect(isValidDateString(undefined)).toBe(false);
        });
    });

    describe('parseDate', () => {
        test('parse correctement les formats de date ISO', () => {
            const date = parseDate('2023-05-15');
            expect(date).toBeInstanceOf(Date);
            expect(date?.getFullYear()).toBe(2023);
            expect(date?.getMonth()).toBe(4); // 0-indexed (mai = 4)
            expect(date?.getDate()).toBe(15);
        });

        test('parse correctement le format dd/MM/yyyy', () => {
            const date = parseDate('15/05/2023');
            expect(date).toBeInstanceOf(Date);
            expect(date?.getFullYear()).toBe(2023);
            expect(date?.getMonth()).toBe(4);
            expect(date?.getDate()).toBe(15);
        });

        test('retourne l\'objet Date original si une Date est passée', () => {
            const originalDate = new Date(2023, 4, 15);
            const parsedDate = parseDate(originalDate);
            expect(parsedDate).toBe(originalDate);
        });

        test('retourne null pour les entrées invalides', () => {
            expect(parseDate('not a date')).toBeNull();
            expect(parseDate('')).toBeNull();
            expect(parseDate(null)).toBeNull();
            expect(parseDate(undefined)).toBeNull();
        });
    });

    describe('formatDate', () => {
        test('formate correctement une date au format par défaut', () => {
            const date = new Date(2023, 4, 15); // 15 mai 2023
            expect(formatDate(date)).toBe('15/05/2023');
        });

        test('formate correctement une date avec un format personnalisé', () => {
            const date = new Date(2023, 4, 15);
            expect(formatDate(date, 'dd MMMM yyyy')).toBe('15 mai 2023');
        });

        test('retourne une chaîne vide pour les dates invalides', () => {
            expect(formatDate(null)).toBe('');
            expect(formatDate(undefined)).toBe('');
            expect(formatDate('invalid date')).toBe('');
        });
    });

    describe('isDateBefore et isDateAfter', () => {
        test('isDateBefore retourne correctement si une date est antérieure à une autre', () => {
            const earlierDate = new Date(2023, 0, 1);
            const laterDate = new Date(2023, 0, 2);

            expect(isDateBefore(earlierDate, laterDate)).toBe(true);
            expect(isDateBefore(laterDate, earlierDate)).toBe(false);
            expect(isDateBefore(earlierDate, earlierDate)).toBe(false); // Même date
        });

        test('isDateAfter retourne correctement si une date est postérieure à une autre', () => {
            const earlierDate = new Date(2023, 0, 1);
            const laterDate = new Date(2023, 0, 2);

            expect(isDateAfter(laterDate, earlierDate)).toBe(true);
            expect(isDateAfter(earlierDate, laterDate)).toBe(false);
            expect(isDateAfter(earlierDate, earlierDate)).toBe(false); // Même date
        });

        test('les deux fonctions retournent false pour les entrées invalides', () => {
            const validDate = new Date();

            expect(isDateBefore(null, validDate)).toBe(false);
            expect(isDateBefore(validDate, null)).toBe(false);
            expect(isDateBefore('invalid', validDate)).toBe(false);

            expect(isDateAfter(null, validDate)).toBe(false);
            expect(isDateAfter(validDate, null)).toBe(false);
            expect(isDateAfter('invalid', validDate)).toBe(false);
        });
    });

    describe('areDatesSameDay', () => {
        test('retourne true pour des dates au même jour, indépendamment de l\'heure', () => {
            const date1 = new Date(2023, 4, 15, 9, 0, 0);
            const date2 = new Date(2023, 4, 15, 17, 30, 0);

            expect(areDatesSameDay(date1, date2)).toBe(true);
        });

        test('retourne false pour des dates à des jours différents', () => {
            const date1 = new Date(2023, 4, 15);
            const date2 = new Date(2023, 4, 16);

            expect(areDatesSameDay(date1, date2)).toBe(false);
        });

        test('retourne false pour les entrées invalides', () => {
            const validDate = new Date();

            expect(areDatesSameDay(null, validDate)).toBe(false);
            expect(areDatesSameDay(validDate, null)).toBe(false);
            expect(areDatesSameDay('invalid', validDate)).toBe(false);
        });
    });

    describe('isDateWeekend', () => {
        test('retourne true pour les samedis et dimanches', () => {
            // Samedi
            const saturday = new Date(2023, 4, 13); // 13 mai 2023 (samedi)
            expect(isDateWeekend(saturday)).toBe(true);

            // Dimanche
            const sunday = new Date(2023, 4, 14); // 14 mai 2023 (dimanche)
            expect(isDateWeekend(sunday)).toBe(true);
        });

        test('retourne false pour les jours de la semaine', () => {
            // Lundi-Vendredi
            const monday = new Date(2023, 4, 15); // 15 mai 2023 (lundi)
            expect(isDateWeekend(monday)).toBe(false);

            const friday = new Date(2023, 4, 19); // 19 mai 2023 (vendredi)
            expect(isDateWeekend(friday)).toBe(false);
        });

        test('retourne false pour les entrées invalides', () => {
            expect(isDateWeekend(null)).toBe(false);
            expect(isDateWeekend(undefined)).toBe(false);
            expect(isDateWeekend('invalid')).toBe(false);
        });
    });

    describe('getDaysBetween', () => {
        test('calcule correctement le nombre de jours entre deux dates (incluses)', () => {
            const startDate = new Date(2023, 4, 1);
            const endDate = new Date(2023, 4, 5);

            // 1 mai au 5 mai = 5 jours (inclus)
            expect(getDaysBetween(startDate, endDate)).toBe(5);
        });

        test('retourne 1 pour le même jour', () => {
            const sameDay = new Date(2023, 4, 1);
            expect(getDaysBetween(sameDay, sameDay)).toBe(1);
        });

        test('fonctionne correctement avec les dates dans l\'ordre inverse', () => {
            const startDate = new Date(2023, 4, 1);
            const endDate = new Date(2023, 4, 5);

            expect(getDaysBetween(endDate, startDate)).toBe(5);
        });
    });

    describe('isSameDay', () => {
        test('retourne true pour deux dates le même jour', () => {
            const date1 = new Date(2023, 4, 15, 9, 0);
            const date2 = new Date(2023, 4, 15, 17, 30);

            expect(isSameDay(date1, date2)).toBe(true);
        });

        test('retourne false pour des dates à des jours différents', () => {
            const date1 = new Date(2023, 4, 15);
            const date2 = new Date(2023, 4, 16);

            expect(isSameDay(date1, date2)).toBe(false);
        });
    });
}); 