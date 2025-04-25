/**
 * Types d'actions de workflow
 */
export var WorkflowActionType;
(function (WorkflowActionType) {
    WorkflowActionType["SUBMIT"] = "SUBMIT";
    WorkflowActionType["APPROVE"] = "APPROVE";
    WorkflowActionType["REJECT"] = "REJECT";
    WorkflowActionType["CANCEL"] = "CANCEL";
    WorkflowActionType["REQUEST_CHANGES"] = "REQUEST_CHANGES";
    WorkflowActionType["COMMENT"] = "COMMENT"; // Ajouter un commentaire
})(WorkflowActionType || (WorkflowActionType = {}));
