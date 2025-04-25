/**
 * Types de règles pour la gestion du planning
 */
export var RuleType;
(function (RuleType) {
    RuleType["LEAVE"] = "leave";
    RuleType["DUTY"] = "duty";
    RuleType["SUPERVISION"] = "supervision";
    RuleType["ASSIGNMENT"] = "assignment";
    RuleType["ON_CALL"] = "onCall";
})(RuleType || (RuleType = {}));
/**
 * Priorité des règles
 */
export var RulePriority;
(function (RulePriority) {
    RulePriority["LOW"] = "LOW";
    RulePriority["MEDIUM"] = "MEDIUM";
    RulePriority["HIGH"] = "HIGH";
    RulePriority["CRITICAL"] = "CRITICAL"; // Règle critique (ne peut jamais être ignorée)
})(RulePriority || (RulePriority = {}));
export var RuleSeverity;
(function (RuleSeverity) {
    RuleSeverity["LOW"] = "low";
    RuleSeverity["MEDIUM"] = "medium";
    RuleSeverity["HIGH"] = "high";
})(RuleSeverity || (RuleSeverity = {}));
export var RotationStrategy;
(function (RotationStrategy) {
    RotationStrategy["ROUND_ROBIN"] = "roundRobin";
    RotationStrategy["LEAST_RECENTLY_ASSIGNED"] = "leastRecentlyAssigned";
    RotationStrategy["BALANCED_LOAD"] = "balancedLoad";
})(RotationStrategy || (RotationStrategy = {}));
