/**
 * Types de fréquence de travail
 */
export var WorkFrequency;
(function (WorkFrequency) {
    WorkFrequency["FULL_TIME"] = "FULL_TIME";
    WorkFrequency["PART_TIME"] = "PART_TIME";
    WorkFrequency["ALTERNATE_WEEKS"] = "ALTERNATE_WEEKS";
    WorkFrequency["ALTERNATE_MONTHS"] = "ALTERNATE_MONTHS";
    WorkFrequency["CUSTOM"] = "CUSTOM"; // Configuration personnalisée
})(WorkFrequency || (WorkFrequency = {}));
/**
 * Jours de la semaine
 */
export var Weekday;
(function (Weekday) {
    Weekday[Weekday["MONDAY"] = 1] = "MONDAY";
    Weekday[Weekday["TUESDAY"] = 2] = "TUESDAY";
    Weekday[Weekday["WEDNESDAY"] = 3] = "WEDNESDAY";
    Weekday[Weekday["THURSDAY"] = 4] = "THURSDAY";
    Weekday[Weekday["FRIDAY"] = 5] = "FRIDAY";
    Weekday[Weekday["SATURDAY"] = 6] = "SATURDAY";
    Weekday[Weekday["SUNDAY"] = 0] = "SUNDAY";
})(Weekday || (Weekday = {}));
/**
 * Type de semaine pour alternance
 */
export var WeekType;
(function (WeekType) {
    WeekType["EVEN"] = "EVEN";
    WeekType["ODD"] = "ODD";
    WeekType["BOTH"] = "BOTH"; // Les deux types de semaine
})(WeekType || (WeekType = {}));
/**
 * Type de mois pour alternance
 */
export var MonthType;
(function (MonthType) {
    MonthType["EVEN"] = "EVEN";
    MonthType["ODD"] = "ODD";
    MonthType["BOTH"] = "BOTH"; // Tous les mois
})(MonthType || (MonthType = {}));
