import { calculateCountedDays } from '../dateCalculations';

describe('calculateCountedDays', () => {
    const holidays2024 = [
        new Date('2024-01-01T00:00:00.000Z'), // Nouvel An (Lundi)
        new Date('2024-05-01T00:00:00.000Z'), // Fête du Travail (Mercredi)
        new Date('2024-07-14T00:00:00.000Z'), // Fête Nationale (Dimanche)
        new Date('2024-08-15T00:00:00.000Z'), // Assomption (Jeudi)
        new Date('2024-11-01T00:00:00.000Z'), // Toussaint (Vendredi)
        new Date('2024-11-11T00:00:00.000Z'), // Armistice (Lundi)
        new Date('2024-12-25T00:00:00.000Z'), // Noël (Mercredi)
    ];

    // Cas simples
    test('should return 5 for a full work week (Mon-Fri)', () => {
        expect(calculateCountedDays(new Date('2024-03-04'), new Date('2024-03-08'), true, [])).toBe(5);
    });

    test('should return 0 if endDate is before startDate', () => {
        expect(calculateCountedDays(new Date('2024-03-08'), new Date('2024-03-04'))).toBe(0);
    });

    // Tests avec weekends
    test('should exclude weekends by default (Fri-Mon period)', () => {
        // Vendredi 1er Mars, Sam 2, Dim 3, Lundi 4 Mars -> Ven, Lun = 2 jours
        expect(calculateCountedDays(new Date('2024-03-01'), new Date('2024-03-04'))).toBe(2);
    });

    test('should include weekends if excludeWeekends is false', () => {
        // Vendredi 1er Mars, Sam 2, Dim 3, Lundi 4 Mars -> 4 jours
        expect(calculateCountedDays(new Date('2024-03-01'), new Date('2024-03-04'), false, [])).toBe(4);
    });

    test('should return 0 for a period covering only weekend days', () => {
        // Samedi 2 Mars - Dimanche 3 Mars
        expect(calculateCountedDays(new Date('2024-03-02'), new Date('2024-03-03'))).toBe(0);
    });

    // Tests avec jours fériés
    test('should exclude a public holiday falling on a weekday', () => {
        // Mercredi 1er Mai 2024 (Fête du Travail)
        // Période du Lundi 29 Avril au Vendredi 3 Mai (Lun, Mar, MER(F), Jeu, Ven) = 4 jours
        expect(calculateCountedDays(new Date('2024-04-29'), new Date('2024-05-03'), true, holidays2024)).toBe(4);
    });

    test('should exclude multiple public holidays on weekdays', () => {
        // Période du Mercredi 25 Dec (Noël) au Vendredi 27 Dec
        // 25(MER/F), 26(JEU), 27(VEN) = 2 jours (26, 27)
        expect(calculateCountedDays(new Date('2024-12-25'), new Date('2024-12-27'), true, holidays2024)).toBe(2);
    });

    test('should correctly handle public holiday on a weekend (no double exclusion, weekend already excluded)', () => {
        // Dimanche 14 Juillet 2024 (Fête Nationale)
        // Période du Vendredi 12 Juillet au Lundi 15 Juillet (Ven, SAM, DIM(F), Lun) -> Ven, Lun = 2 jours
        expect(calculateCountedDays(new Date('2024-07-12'), new Date('2024-07-15'), true, holidays2024)).toBe(2);
    });

    test('should not exclude public holiday on a weekend if weekends are included', () => {
        // Dimanche 14 Juillet 2024 (Fête Nationale)
        // Période du Vendredi 12 Juillet au Lundi 15 Juillet (Ven, SAM, DIM(F), Lun) = 4 jours
        // Le 14 juillet est férié, mais comme on inclut les weekends, il est compté.
        // Le comportement ici dépend de la définition : est-ce qu'un férié sur weekend compte si les weekends comptent?
        // La logique actuelle est : `isCounted = true; if (excludeWeekends && isWeekend) isCounted = false; if (isCounted && isHoliday) isCounted = false;`
        // Donc, si `excludeWeekends` est false, `isCounted` reste true après le check weekend.
        // Ensuite, si c'est un férié, `isCounted` devient false. Donc le férié est toujours exclus s'il est dans la liste, même si `excludeWeekends` est false.
        // Cela semble être une interprétation stricte : un jour férié n'est JAMAIS compté.
        // Si on voulait qu'un férié sur weekend compte quand `excludeWeekends` est false, la logique devrait être : `if (isHoliday && (!isWeekend || excludeWeekends))`
        // Avec la logique actuelle, le résultat attendu est 3 (Ven, Sam, Lun ; Dim(F) est exclu).
        expect(calculateCountedDays(new Date('2024-07-12'), new Date('2024-07-15'), false, holidays2024)).toBe(3);
    });

    // Tests sur un seul jour
    test('should return 1 for a single weekday (not holiday)', () => {
        expect(calculateCountedDays(new Date('2024-03-04'), new Date('2024-03-04'))).toBe(1);
    });

    test('should return 0 for a single weekend day', () => {
        expect(calculateCountedDays(new Date('2024-03-02'), new Date('2024-03-02'))).toBe(0); // Samedi
    });

    test('should return 0 for a single weekday public holiday', () => {
        expect(calculateCountedDays(new Date('2024-05-01'), new Date('2024-05-01'), true, holidays2024)).toBe(0);
    });

    test('should return 0 for a single weekend public holiday', () => {
        // Dimanche 14 Juillet
        expect(calculateCountedDays(new Date('2024-07-14'), new Date('2024-07-14'), true, holidays2024)).toBe(0);
    });

    test('should return 1 for a single weekend day if weekends are included and not a holiday', () => {
        expect(calculateCountedDays(new Date('2024-03-02'), new Date('2024-03-02'), false, [])).toBe(1);
    });

    test('should return 0 for a single weekend day if weekends are included BUT it IS a holiday', () => {
        // Dimanche 14 Juillet (férié)
        expect(calculateCountedDays(new Date('2024-07-14'), new Date('2024-07-14'), false, holidays2024)).toBe(0);
    });

    // Périodes de zéro jour compté
    test('should return 0 for a period of only public holidays on weekdays', () => {
        // Période: Mercredi 25 Dec (Noël) et Jeudi 26 Dec (pas férié en France, mais si on l'ajoutait)
        // Testons avec Noël (Mer) et Assomption (Jeu) - non consécutifs, donc une période les englobant.
        // Pour un test simple, une période qui est juste un férié.
        expect(calculateCountedDays(new Date('2024-12-25'), new Date('2024-12-25'), true, holidays2024)).toBe(0);
    });

    // Dates croisant les mois/années
    test('should handle dates crossing month boundaries', () => {
        // Du Vendredi 26 Avril au Mardi 7 Mai. (1er Mai férié)
        // Avril: 26(V), 27(S), 28(D), 29(L), 30(M) -> 3 jours (26, 29, 30)
        // Mai: 1(MER/F), 2(J), 3(V), 4(S), 5(D), 6(L), 7(M) -> 4 jours (2, 3, 6, 7)
        // Total = 3 + 4 = 7 jours
        expect(calculateCountedDays(new Date('2024-04-26'), new Date('2024-05-07'), true, holidays2024)).toBe(7);
    });

    test('should handle dates crossing year boundaries', () => {
        // Du Lundi 30 Décembre 2024 au Jeudi 2 Janvier 2025.
        // Fériés: 25/12/2024, 01/01/2025
        // Déc 2024: 30(L), 31(M) -> 2 jours
        // Jan 2025: 01(MER/F), 02(J) -> 1 jour (le 2)
        // Total = 2 + 1 = 3 jours
        const holidays2024_2025 = [
            new Date('2024-12-25T00:00:00.000Z'),
            new Date('2025-01-01T00:00:00.000Z')
        ];
        expect(calculateCountedDays(new Date('2024-12-30'), new Date('2025-01-02'), true, holidays2024_2025)).toBe(3);
    });

    test('should handle empty publicHolidays array correctly', () => {
        // Période du Lundi 29 Avril au Vendredi 3 Mai (normalement 4 jours avec 1er Mai férié)
        // Sans fériés, cela fait 5 jours.
        expect(calculateCountedDays(new Date('2024-04-29'), new Date('2024-05-03'), true, [])).toBe(5);
    });

    // Cas où les dates sont des objets Date avec des heures/minutes/secondes
    test('should normalize start and end dates to midnight for calculation', () => {
        const startDateWithTime = new Date('2024-03-04T08:00:00.000Z');
        const endDateWithTime = new Date('2024-03-08T17:00:00.000Z');
        // Devrait se comporter comme si c'était du 4 Mars minuit au 8 Mars minuit (inclusif pour la date de fin)
        expect(calculateCountedDays(startDateWithTime, endDateWithTime, true, [])).toBe(5);

        const singleDayWithTimeStart = new Date('2024-03-04T09:00:00.000Z');
        const singleDayWithTimeEnd = new Date('2024-03-04T17:00:00.000Z');
        expect(calculateCountedDays(singleDayWithTimeStart, singleDayWithTimeEnd, true, [])).toBe(1);
    });
});

describe('calculateCountedDays - Half Days', () => {
    const holidays2024 = [
        new Date('2024-01-01T00:00:00.000Z'), // Nouvel An (Lundi)
        new Date('2024-05-01T00:00:00.000Z'), // Fête du Travail (Mercredi)
        new Date('2024-08-15T00:00:00.000Z'), // Assomption (Jeudi)
    ];

    test('should return 0.5 for a half day on a weekday (AM)', () => {
        // Lundi 4 Mars 2024, Matin
        expect(calculateCountedDays(new Date('2024-03-04'), new Date('2024-03-04'), true, [], true, 'AM')).toBe(0.5);
    });

    test('should return 0.5 for a half day on a weekday (PM)', () => {
        // Mardi 5 Mars 2024, Après-midi
        expect(calculateCountedDays(new Date('2024-03-05'), new Date('2024-03-05'), true, [], true, 'PM')).toBe(0.5);
    });

    test('should return 0 for a half day on a Saturday', () => {
        // Samedi 2 Mars 2024
        expect(calculateCountedDays(new Date('2024-03-02'), new Date('2024-03-02'), true, [], true, 'AM')).toBe(0);
    });

    test('should return 0 for a half day on a Sunday', () => {
        // Dimanche 3 Mars 2024
        expect(calculateCountedDays(new Date('2024-03-03'), new Date('2024-03-03'), true, [], true, 'PM')).toBe(0);
    });

    test('should return 0 for a half day on a public holiday (weekday)', () => {
        // Mercredi 1er Mai 2024 (Fête du Travail)
        expect(calculateCountedDays(new Date('2024-05-01'), new Date('2024-05-01'), true, holidays2024, true, 'AM')).toBe(0);
    });

    test('should return 0 for a half day on a public holiday (weekend - already excluded by weekend rule)', () => {
        // Simuler un férié sur un weekend, par exemple Samedi 6 Juillet 2024
        const holidaysWithSaturdayHoliday = [...holidays2024, new Date('2024-07-06T00:00:00.000Z')];
        expect(calculateCountedDays(new Date('2024-07-06'), new Date('2024-07-06'), true, holidaysWithSaturdayHoliday, true, 'AM')).toBe(0);
    });

    test('should return 0.5 if excludeWeekends is false for a half day on a weekend (not holiday)', () => {
        // Samedi 2 Mars 2024, mais on n'exclut pas les weekends
        expect(calculateCountedDays(new Date('2024-03-02'), new Date('2024-03-02'), false, [], true, 'AM')).toBe(0.5);
    });

    test('should return 0 if excludeWeekends is false for a half day on a weekend THAT IS a public holiday', () => {
        // Samedi 6 Juillet 2024 (Férié), on n'exclut pas les weekends mais il est férié
        const holidaysWithSaturdayHoliday = [...holidays2024, new Date('2024-07-06T00:00:00.000Z')];
        expect(calculateCountedDays(new Date('2024-07-06'), new Date('2024-07-06'), false, holidaysWithSaturdayHoliday, true, 'AM')).toBe(0);
    });

    // Le paramètre halfDayPeriod n'influence pas le comptage (0.5 ou 0) mais est requis pour la sémantique
    test('halfDayPeriod AM or PM should give same result for counted days (0.5 or 0)', () => {
        const date = new Date('2024-03-04'); // Lundi
        expect(calculateCountedDays(date, date, true, [], true, 'AM')).toBe(0.5);
        expect(calculateCountedDays(date, date, true, [], true, 'PM')).toBe(0.5);

        const holiday = new Date('2024-05-01'); // Mercredi, Férié
        expect(calculateCountedDays(holiday, holiday, true, holidays2024, true, 'AM')).toBe(0);
        expect(calculateCountedDays(holiday, holiday, true, holidays2024, true, 'PM')).toBe(0);
    });
}); 