// src/types/user.ts
// Patterns de travail
export var WorkPatternType;
(function (WorkPatternType) {
    WorkPatternType["FULL_TIME"] = "FULL_TIME";
    WorkPatternType["ALTERNATING_WEEKS"] = "ALTERNATING_WEEKS";
    WorkPatternType["ALTERNATING_MONTHS"] = "ALTERNATING_MONTHS";
    WorkPatternType["SPECIFIC_DAYS"] = "SPECIFIC_DAYS";
})(WorkPatternType || (WorkPatternType = {}));
// Types de semaines/mois
export var WeekType;
(function (WeekType) {
    WeekType["EVEN"] = "EVEN";
    WeekType["ODD"] = "ODD";
    WeekType["ALL"] = "ALL";
})(WeekType || (WeekType = {}));
// Enum pour les jours de la semaine (utilisé dans le frontend)
export var DayOfWeek;
(function (DayOfWeek) {
    DayOfWeek["LUNDI"] = "LUNDI";
    DayOfWeek["MARDI"] = "MARDI";
    DayOfWeek["MERCREDI"] = "MERCREDI";
    DayOfWeek["JEUDI"] = "JEUDI";
    DayOfWeek["VENDREDI"] = "VENDREDI";
    DayOfWeek["SAMEDI"] = "SAMEDI";
    DayOfWeek["DIMANCHE"] = "DIMANCHE";
})(DayOfWeek || (DayOfWeek = {}));
