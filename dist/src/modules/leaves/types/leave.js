/**
 * Types de congés
 */
export var LeaveType;
(function (LeaveType) {
    LeaveType["ANNUAL"] = "ANNUAL";
    LeaveType["RECOVERY"] = "RECOVERY";
    LeaveType["TRAINING"] = "TRAINING";
    LeaveType["SICK"] = "SICK";
    LeaveType["MATERNITY"] = "MATERNITY";
    LeaveType["SPECIAL"] = "SPECIAL";
    LeaveType["UNPAID"] = "UNPAID";
    LeaveType["OTHER"] = "OTHER"; // Autre
})(LeaveType || (LeaveType = {}));
/**
 * Statut des demandes de congés
 */
export var LeaveStatus;
(function (LeaveStatus) {
    LeaveStatus["DRAFT"] = "DRAFT";
    LeaveStatus["PENDING"] = "PENDING";
    LeaveStatus["APPROVED"] = "APPROVED";
    LeaveStatus["REJECTED"] = "REJECTED";
    LeaveStatus["CANCELLED"] = "CANCELLED"; // Annulé
})(LeaveStatus || (LeaveStatus = {}));
