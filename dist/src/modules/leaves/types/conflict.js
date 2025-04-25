/**
 * Types de conflit
 */
export var ConflictType;
(function (ConflictType) {
    ConflictType["USER_LEAVE_OVERLAP"] = "USER_LEAVE_OVERLAP";
    ConflictType["TEAM_CAPACITY"] = "TEAM_CAPACITY";
    ConflictType["SPECIALTY_CAPACITY"] = "SPECIALTY_CAPACITY";
    ConflictType["DUTY_CONFLICT"] = "DUTY_CONFLICT";
    ConflictType["ON_CALL_CONFLICT"] = "ON_CALL_CONFLICT";
    ConflictType["ASSIGNMENT_CONFLICT"] = "ASSIGNMENT_CONFLICT";
    ConflictType["SPECIAL_PERIOD"] = "SPECIAL_PERIOD"; // Période spéciale (ex: vacances scolaires)
})(ConflictType || (ConflictType = {}));
/**
 * Sévérité des conflits
 */
export var ConflictSeverity;
(function (ConflictSeverity) {
    ConflictSeverity["INFO"] = "INFO";
    ConflictSeverity["WARNING"] = "WARNING";
    ConflictSeverity["ERROR"] = "ERROR"; // Erreur (bloquant)
})(ConflictSeverity || (ConflictSeverity = {}));
