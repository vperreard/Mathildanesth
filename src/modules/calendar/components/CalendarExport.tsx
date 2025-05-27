import React, { useState, useEffect } from 'react';
import { CalendarEventType, CalendarExportFormat, ExportOptions } from '../types/event';
// import { exportCalendarEvents, downloadBlob } from '../services/calendrierService'; // COMMENTÉ
import { format as formatDate } from 'date-fns';
import { fr } from 'date-fns/locale';
// import { useDateValidation } from '../../../hooks/useDateValidation'; // COMMENTÉ

interface CalendarExportProps {
    events: any[]; // Les événements à exporter
    currentRange: {
        start: Date;
        end: Date;
    };
}

export const CalendarExport: React.FC<CalendarExportProps> = ({
    events,
    currentRange
}) => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [exportFormat, setExportFormat] = useState<CalendarExportFormat>(CalendarExportFormat.PDF);
    const [fileName, setFileName] = useState<string>(`calendrier_${formatDate(new Date(), 'yyyy-MM-dd')}`);
    const [includeAllEvents, setIncludeAllEvents] = useState<boolean>(true);
    const [selectedEventTypes, setSelectedEventTypes] = useState<CalendarEventType[]>(Object.values(CalendarEventType));
    const [useCustomDateRange, setUseCustomDateRange] = useState<boolean>(false);
    const [customDateRange, setCustomDateRange] = useState<{ start: string, end: string }>({
        start: formatDate(currentRange.start, 'yyyy-MM-dd'),
        end: formatDate(currentRange.end, 'yyyy-MM-dd')
    });
    const [dateErrors, setDateErrors] = useState<{ start?: string, end?: string }>({});

    // Intégration du hook de validation de dates
    /* // COMMENTÉ TEMPORAIREMENT
    const {
        validateDate,
        validateDateRange,
        getErrorMessage,
        hasError,
        resetErrors
    } = useDateValidation();
    */ // FIN COMMENTÉ TEMPORAIREMENT

    // Mise à jour du customDateRange quand currentRange change (pour initialisation/réinitialisation)
    useEffect(() => {
        if (currentRange.start && currentRange.end) {
            setCustomDateRange({
                start: formatDate(currentRange.start, 'yyyy-MM-dd'),
                end: formatDate(currentRange.end, 'yyyy-MM-dd')
            });
        }
    }, [currentRange]);

    const handleOpenModal = () => {
        setIsModalOpen(true);
        // resetErrors(); // COMMENTÉ TEMPORAIREMENT
        setDateErrors({});

        // Réinitialiser les valeurs par défaut
        setExportFormat(CalendarExportFormat.PDF);
        setFileName(`calendrier_${formatDate(new Date(), 'yyyy-MM-dd')}`);
        setIncludeAllEvents(true);
        setSelectedEventTypes(Object.values(CalendarEventType));
        setUseCustomDateRange(false);
        setCustomDateRange({
            start: formatDate(currentRange.start, 'yyyy-MM-dd'),
            end: formatDate(currentRange.end, 'yyyy-MM-dd')
        });
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    /* // COMMENTÉ TEMPORAIREMENT
    const validateDates = (): boolean => {
        if (!useCustomDateRange) return true;

        resetErrors();
        const errors: { start?: string, end?: string } = {};
        let isValid = true;

        // Valider la date de début
        const startDate = new Date(customDateRange.start);
        validateDate(startDate, 'exportStartDate', {
            required: true,
            allowPastDates: true
        });

        if (hasError('exportStartDate')) {
            errors.start = getErrorMessage('exportStartDate') || 'Date de début invalide';
            isValid = false;
        }

        // Valider la date de fin
        const endDate = new Date(customDateRange.end);
        validateDate(endDate, 'exportEndDate', {
            required: true,
            allowPastDates: true
        });

        if (hasError('exportEndDate')) {
            errors.end = getErrorMessage('exportEndDate') || 'Date de fin invalide';
            isValid = false;
        }

        // Valider la plage de dates
        if (isValid) {
            validateDateRange(
                startDate,
                endDate,
                'exportStartDate',
                'exportEndDate',
                { required: true }
            );

            if (hasError('exportStartDate') || hasError('exportEndDate')) {
                if (hasError('exportStartDate')) {
                    errors.start = getErrorMessage('exportStartDate') || 'Plage de dates invalide';
                }
                if (hasError('exportEndDate')) {
                    errors.end = getErrorMessage('exportEndDate') || 'Plage de dates invalide';
                }
                isValid = false;
            }
        }

        setDateErrors(errors);
        return isValid;
    };
    */ // FIN COMMENTÉ TEMPORAIREMENT

    const handleExport = async () => {
        // Valider les dates si une plage personnalisée est utilisée
        /* // COMMENTÉ TEMPORAIREMENT
        if (!validateDates()) {
            return;
        }
        */ // FIN COMMENTÉ TEMPORAIREMENT

        try {
            setIsLoading(true);

            // Préparer les options d'export
            const options: ExportOptions = {
                format: exportFormat,
                fileName,
                includeAllEvents,
                eventTypes: includeAllEvents ? undefined : selectedEventTypes,
                dateRange: useCustomDateRange
                    ? {
                        start: new Date(customDateRange.start),
                        end: new Date(customDateRange.end)
                    }
                    : currentRange
            };

            // Appeler le service d'export
            // const blob = await exportCalendarEvents(options); // COMMENTÉ
            const blob = new Blob(); // TEMPORAIRE pour éviter erreur de type

            // Générer le nom de fichier avec l'extension appropriée
            let fileExtension = '';
            switch (exportFormat) {
                case CalendarExportFormat.PDF:
                    fileExtension = '.pdf';
                    break;
                case CalendarExportFormat.EXCEL:
                    fileExtension = '.xlsx';
                    break;
                case CalendarExportFormat.CSV:
                    fileExtension = '.csv';
                    break;
                case CalendarExportFormat.ICS:
                    fileExtension = '.ics';
                    break;
            }

            // Télécharger le fichier
            // downloadBlob(blob, `${fileName}${fileExtension}`); // COMMENTÉ
            console.warn('La fonctionnalité d\'export est temporairement désactivée en raison d\'imports manquants.'); // TEMPORAIRE

            // Fermer le modal
            handleCloseModal();
        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            // TODO: Afficher un message d'erreur
        } finally {
            setIsLoading(false);
        }
    };

    const handleEventTypeToggle = (type: CalendarEventType) => {
        setSelectedEventTypes(prevTypes => {
            if (prevTypes.includes(type)) {
                return prevTypes.filter(t => t !== type);
            } else {
                return [...prevTypes, type];
            }
        });
    };

    const handleFormatChange = (format: CalendarExportFormat) => {
        setExportFormat(format);

        // Mettre à jour l'extension du fichier si le nom de fichier est basique
        if (fileName.match(/^calendrier_\d{4}-\d{2}-\d{2}$/)) {
            // Utiliser formatDate de date-fns pour éviter la confusion avec le nom de paramètre format
            const currentDate = new Date();
            const formattedDate = formatDate(currentDate, 'yyyy-MM-dd', { locale: fr });
            setFileName(`calendrier_${formattedDate}`);
        }
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCustomDateRange(prev => ({ ...prev, start: value }));

        // Valider la date au changement
        if (value) {
            const startDate = new Date(value);
            // validateDate(startDate, 'exportStartDate', {
            //     required: true,
            //     allowPastDates: true
            // });

            // Si la date de fin est déjà définie, valider la plage
            if (customDateRange.end) {
                // validateDateRange(
                //     startDate,
                //     new Date(customDateRange.end),
                //     'exportStartDate',
                //     'exportEndDate',
                //     { required: true }
                // );
            }

            // Mettre à jour les erreurs d'affichage
            setDateErrors(prev => ({
                ...prev,
                // start: hasError('exportStartDate') ? getErrorMessage('exportStartDate') || 'Date invalide' : undefined // Corrigé
            }));
        }
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCustomDateRange(prev => ({ ...prev, end: value }));

        // Valider la date au changement
        if (value) {
            const endDate = new Date(value);
            // validateDate(endDate, 'exportEndDate', { // Assurer que c'est commenté
            //     required: true,
            //     allowPastDates: true
            // });

            // Si la date de début est déjà définie, valider la plage
            if (customDateRange.start) {
                // validateDateRange( // Assurer que c'est commenté
                //     new Date(customDateRange.start),
                //     endDate,
                //     'exportStartDate',
                //     'exportEndDate',
                //     { required: true }
                // );
            }

            // Mettre à jour les erreurs d'affichage
            setDateErrors(prev => ({
                ...prev,
                // end: hasError('exportEndDate') ? getErrorMessage('exportEndDate') || 'Date invalide' : undefined // Corrigé
            }));
        }
    };

    return (
        <>
            <button
                onClick={handleOpenModal}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                <svg
                    className="mr-2 h-4 w-4 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exporter
            </button>

            {/* Modal d'export */}
            {isModalOpen && (
                <div className="fixed z-50 inset-0 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div
                            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="modal-headline"
                        >
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                                            Exporter le calendrier
                                        </h3>

                                        <div className="mt-4 space-y-4">
                                            {/* Format d'export */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Format
                                                </label>
                                                <div className="mt-1 grid grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleFormatChange(CalendarExportFormat.PDF)}
                                                        className={`px-3 py-2 text-sm font-medium rounded-md ${exportFormat === CalendarExportFormat.PDF
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-300'
                                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        PDF
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleFormatChange(CalendarExportFormat.EXCEL)}
                                                        className={`px-3 py-2 text-sm font-medium rounded-md ${exportFormat === CalendarExportFormat.EXCEL
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-300'
                                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        Excel
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleFormatChange(CalendarExportFormat.CSV)}
                                                        className={`px-3 py-2 text-sm font-medium rounded-md ${exportFormat === CalendarExportFormat.CSV
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-300'
                                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        CSV
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleFormatChange(CalendarExportFormat.ICS)}
                                                        className={`px-3 py-2 text-sm font-medium rounded-md ${exportFormat === CalendarExportFormat.ICS
                                                            ? 'bg-blue-50 text-blue-700 border border-blue-300'
                                                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        iCalendar (.ics)
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Nom du fichier */}
                                            <div>
                                                <label htmlFor="file-name" className="block text-sm font-medium text-gray-700">
                                                    Nom du fichier
                                                </label>
                                                <div className="mt-1">
                                                    <input
                                                        type="text"
                                                        name="file-name"
                                                        id="file-name"
                                                        value={fileName}
                                                        onChange={(e) => setFileName(e.target.value)}
                                                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                                    />
                                                </div>
                                            </div>

                                            {/* Sélection des événements */}
                                            <div>
                                                <div className="flex items-start">
                                                    <div className="flex items-center h-5">
                                                        <input
                                                            id="include-all-events"
                                                            name="include-all-events"
                                                            type="checkbox"
                                                            checked={includeAllEvents}
                                                            onChange={() => setIncludeAllEvents(!includeAllEvents)}
                                                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                        />
                                                    </div>
                                                    <div className="ml-3 text-sm">
                                                        <label htmlFor="include-all-events" className="font-medium text-gray-700">
                                                            Inclure tous les événements
                                                        </label>
                                                    </div>
                                                </div>

                                                {!includeAllEvents && (
                                                    <div className="mt-2 pl-7">
                                                        <p className="text-sm text-gray-500 mb-2">
                                                            Sélectionnez les types d&#39;événements à inclure:
                                                        </p>
                                                        <div className="space-y-2">
                                                            {Object.values(CalendarEventType).map((type) => (
                                                                <div key={type} className="flex items-start">
                                                                    <div className="flex items-center h-5">
                                                                        <input
                                                                            id={`event-type-${type}`}
                                                                            name={`event-type-${type}`}
                                                                            type="checkbox"
                                                                            checked={selectedEventTypes.includes(type)}
                                                                            onChange={() => handleEventTypeToggle(type)}
                                                                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                                        />
                                                                    </div>
                                                                    <div className="ml-3 text-sm">
                                                                        <label htmlFor={`event-type-${type}`} className="font-medium text-gray-700">
                                                                            {getEventTypeLabel(type)}
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Plage de dates personnalisée */}
                                            <div>
                                                <div className="flex items-start">
                                                    <div className="flex items-center h-5">
                                                        <input
                                                            id="custom-date-range"
                                                            name="custom-date-range"
                                                            type="checkbox"
                                                            checked={useCustomDateRange}
                                                            onChange={() => setUseCustomDateRange(!useCustomDateRange)}
                                                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                        />
                                                    </div>
                                                    <div className="ml-3 text-sm">
                                                        <label htmlFor="custom-date-range" className="font-medium text-gray-700">
                                                            Utiliser une plage de dates personnalisée
                                                        </label>
                                                    </div>
                                                </div>

                                                {useCustomDateRange && (
                                                    <div className="mt-2 pl-7 grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label htmlFor="date-start" className="block text-sm font-medium text-gray-700">
                                                                Date de début
                                                            </label>
                                                            <div className="mt-1">
                                                                <input
                                                                    type="date"
                                                                    name="date-start"
                                                                    id="date-start"
                                                                    value={customDateRange.start}
                                                                    onChange={handleStartDateChange}
                                                                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm ${dateErrors.start ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                                                                />
                                                                {dateErrors.start && (
                                                                    <p className="mt-1 text-sm text-red-600">
                                                                        {dateErrors.start}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label htmlFor="date-end" className="block text-sm font-medium text-gray-700">
                                                                Date de fin
                                                            </label>
                                                            <div className="mt-1">
                                                                <input
                                                                    type="date"
                                                                    name="date-end"
                                                                    id="date-end"
                                                                    value={customDateRange.end}
                                                                    onChange={handleEndDateChange}
                                                                    className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm ${dateErrors.end ? 'border-red-300' : 'border-gray-300'} rounded-md`}
                                                                />
                                                                {dateErrors.end && (
                                                                    <p className="mt-1 text-sm text-red-600">
                                                                        {dateErrors.end}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handleExport}
                                    disabled={isLoading}
                                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 ${isLoading
                                        ? 'bg-blue-300 text-white cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                        } sm:ml-3 sm:w-auto sm:text-sm`}
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Exportation...
                                        </>
                                    ) : (
                                        'Exporter'
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Fonction utilitaire pour obtenir l'étiquette d'un type d'événement
function getEventTypeLabel(type: CalendarEventType): string {
    switch (type) {
        case CalendarEventType.LEAVE:
            return 'Congés';
        case CalendarEventType.DUTY:
            return 'Gardes';
        case CalendarEventType.ON_CALL:
            return 'Astreintes';
        case CalendarEventType.ASSIGNMENT:
            return 'Gardes/Vacations';
        default:
            return 'Événement';
    }
} 