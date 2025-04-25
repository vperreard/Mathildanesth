// Types d'événements dans le calendrier
export var CalendarEventType;
(function (CalendarEventType) {
    CalendarEventType["LEAVE"] = "LEAVE";
    CalendarEventType["DUTY"] = "DUTY";
    CalendarEventType["ON_CALL"] = "ON_CALL";
    CalendarEventType["ASSIGNMENT"] = "ASSIGNMENT";
})(CalendarEventType || (CalendarEventType = {}));
// Types de vues du calendrier
export var CalendarViewType;
(function (CalendarViewType) {
    CalendarViewType["MONTH"] = "dayGridMonth";
    CalendarViewType["WEEK"] = "timeGridWeek";
    CalendarViewType["DAY"] = "timeGridDay";
    CalendarViewType["LIST"] = "listWeek";
    CalendarViewType["TIMELINE"] = "timelineWeek";
})(CalendarViewType || (CalendarViewType = {}));
// Format d'export
export var CalendarExportFormat;
(function (CalendarExportFormat) {
    CalendarExportFormat["PDF"] = "PDF";
    CalendarExportFormat["EXCEL"] = "EXCEL";
    CalendarExportFormat["CSV"] = "CSV";
    CalendarExportFormat["ICS"] = "ICS";
})(CalendarExportFormat || (CalendarExportFormat = {}));
