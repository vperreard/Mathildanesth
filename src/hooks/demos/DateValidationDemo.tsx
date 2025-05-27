import React, { useState, useEffect } from 'react';
import { useDateValidation, DateRange } from '../useDateValidation';
import { addDays, format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Composant de démonstration pour le hook useDateValidation
export default function DateValidationDemo() {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [userId, setUserId] = useState<string>('user123');
    const [shiftType, setShiftType] = useState<string>('jour');
    const [resetKey, setResetKey] = useState<number>(0);
    const [testCase, setTestCase] = useState<string>('default');

    // Récupérer le hook de validation des dates
    const {
        validateDate,
        validateDateRange,
        validateLeaveRequest,
        validateShiftAssignment,
        detectConflicts,
        hasError,
        getErrorMessage,
        setContext,
        resetAll,
        context
    } = useDateValidation();

    // Générer des données de test réalistes
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Jours fériés français pour l'année en cours
    const currentYear = today.getFullYear();
    const joursFeries = [
        new Date(currentYear, 0, 1),   // Jour de l'an
        new Date(currentYear, 4, 1),   // Fête du travail
        new Date(currentYear, 4, 8),   // Victoire 1945
        new Date(currentYear, 6, 14),  // Fête nationale
        new Date(currentYear, 7, 15),  // Assomption
        new Date(currentYear, 10, 1),  // Toussaint
        new Date(currentYear, 10, 11), // Armistice
        new Date(currentYear, 11, 25)  // Noël
    ];

    // Périodes de blackout (périodes bloquées)
    const blackoutPeriods: DateRange[] = [
        { start: addDays(today, 10), end: addDays(today, 15), label: 'Maintenance système', type: 'maintenance' },
        { start: addDays(today, 20), end: addDays(today, 25), label: 'Fermeture annuelle', type: 'closure' }
    ];

    // Événements existants pour tester les conflits
    const existingEvents: DateRange[] = [
        { start: addDays(today, 5), end: addDays(today, 8), label: 'Congés user123', type: 'leave_user123' },
        { start: addDays(today, 12), end: addDays(today, 12), label: 'Garde jour user123', type: 'shift_user123' },
        { start: addDays(today, 16), end: addDays(today, 18), label: 'Formation user123', type: 'training_user123' },
        { start: addDays(today, 7), end: addDays(today, 10), label: 'Congés user456', type: 'leave_user456' }
    ];

    // Périodes de repos obligatoire (24h après une garde)
    const restPeriods: DateRange[] = [
        {
            start: addDays(today, 12),
            end: addDays(today, 13),
            label: 'Repos après garde user123',
            type: 'rest_period'
        }
    ];

    // Réinitialiser le formulaire
    const handleReset = () => {
        setStartDate(null);
        setEndDate(null);
        resetAll();
        setResetKey(prev => prev + 1);
    };

    // Configurer différents scénarios de test
    useEffect(() => {
        handleReset();

        switch (testCase) {
            case 'default':
                // Configuration par défaut
                setContext({ usedDays: 10 });
                break;
            case 'quota-low':
                // Quota de congés bas
                setContext({ usedDays: 22 });
                break;
            case 'blackout':
                // Sélectionner une date dans une période de blackout
                setStartDate(addDays(today, 12));
                setEndDate(addDays(today, 17));
                break;
            case 'conflict':
                // Conflit avec un événement existant
                setStartDate(addDays(today, 6));
                setEndDate(addDays(today, 9));
                break;
            case 'rest-period':
                // Période de repos obligatoire après une garde
                setStartDate(addDays(today, 13));
                break;
            case 'valid-leave':
                // Demande de congé valide
                setStartDate(addDays(today, 30));
                setEndDate(addDays(today, 35));
                break;
        }
    }, [testCase, setContext, resetAll]);

    // Valider une demande de congés
    const handleValidateLeave = () => {
        if (startDate && endDate) {
            validateLeaveRequest(
                startDate,
                endDate,
                userId,
                {
                    availableDaysPerYear: 25,
                    minAdvanceNotice: 3,
                    businessDaysOnly: true,
                    holidays: joursFeries,
                    blackoutPeriods
                }
            );
        }
    };

    // Valider une affectation de garde
    const handleValidateShift = () => {
        if (startDate) {
            validateShiftAssignment(
                startDate,
                shiftType,
                userId,
                {
                    blackoutPeriods: [...blackoutPeriods, ...restPeriods]
                }
            );
        }
    };

    // Détecter les conflits
    const handleDetectConflicts = () => {
        if (startDate) {
            detectConflicts(
                userId,
                startDate,
                'new_event',
                existingEvents
            );
        }
    };

    // Formater une date pour l'affichage
    const formatDateStr = (date: Date | null) => {
        if (!date) return 'Non sélectionnée';
        return format(date, 'EEEE d MMMM yyyy', { locale: fr });
    };

    return (
        <div className="date-validation-demo">
            <h1>Démonstration de Validation des Dates</h1>

            <div className="scenario-selector">
                <h2>Scénarios de test</h2>
                <div className="button-group">
                    <button onClick={() => setTestCase('default')}>Par défaut</button>
                    <button onClick={() => setTestCase('quota-low')}>Quota faible</button>
                    <button onClick={() => setTestCase('blackout')}>Période bloquée</button>
                    <button onClick={() => setTestCase('conflict')}>Conflit</button>
                    <button onClick={() => setTestCase('rest-period')}>Période de repos</button>
                    <button onClick={() => setTestCase('valid-leave')}>Congé valide</button>
                </div>
            </div>

            <div className="demo-container" key={resetKey}>
                <div className="form-section">
                    <h2>Données de test</h2>
                    <div className="form-group">
                        <label>Utilisateur:</label>
                        <select value={userId} onChange={(e) => setUserId(e.target.value)}>
                            <option value="user123">Utilisateur 123</option>
                            <option value="user456">Utilisateur 456</option>
                            <option value="user789">Utilisateur 789</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Type de garde:</label>
                        <select value={shiftType} onChange={(e) => setShiftType(e.target.value)}>
                            <option value="jour">Jour</option>
                            <option value="nuit">Nuit</option>
                            <option value="24h">24 heures</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Date de début:</label>
                        <input
                            type="date"
                            value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                            onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : null)}
                        />
                        {hasError(`leave_start_${userId}`) && (
                            <div className="error">{getErrorMessage(`leave_start_${userId}`)}</div>
                        )}
                        {hasError(`shift_${shiftType}_${userId}`) && (
                            <div className="error">{getErrorMessage(`shift_${shiftType}_${userId}`)}</div>
                        )}
                        {hasError(`conflict_new_event_${userId}`) && (
                            <div className="error">{getErrorMessage(`conflict_new_event_${userId}`)}</div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Date de fin:</label>
                        <input
                            type="date"
                            value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                            onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : null)}
                        />
                        {hasError(`leave_end_${userId}`) && (
                            <div className="error">{getErrorMessage(`leave_end_${userId}`)}</div>
                        )}
                    </div>

                    <div className="button-group">
                        <button onClick={handleValidateLeave}>Valider congés</button>
                        <button onClick={handleValidateShift}>Valider garde</button>
                        <button onClick={handleDetectConflicts}>Détecter conflits</button>
                        <button onClick={handleReset}>Réinitialiser</button>
                    </div>
                </div>

                <div className="result-section">
                    <h2>Résultats</h2>

                    <div className="result-item">
                        <h3>Dates sélectionnées</h3>
                        <p><strong>Début:</strong> {formatDateStr(startDate)}</p>
                        <p><strong>Fin:</strong> {formatDateStr(endDate)}</p>
                        {startDate && endDate && (
                            <p><strong>Durée:</strong> {
                                context.businessDaysCount !== undefined
                                    ? `${context.businessDaysCount} jours ouvrables (${context.totalDaysCount} jours calendaires)`
                                    : `${context.totalDaysCount || '?'} jours`
                            }</p>
                        )}
                    </div>

                    <div className="result-item">
                        <h3>Contexte de validation</h3>
                        <p><strong>Jours utilisés:</strong> {context.usedDays || 0} jours</p>
                        <p><strong>Jours restants:</strong> {context.remainingDays !== undefined ? context.remainingDays : 'N/A'}</p>
                        {context.conflicts && context.conflicts.length > 0 && (
                            <div>
                                <p><strong>Conflits détectés:</strong></p>
                                <ul>
                                    {context.conflicts.map((conflict, index) => (
                                        <li key={index}>
                                            {conflict.label || `${format(conflict.start, 'dd/MM/yyyy')} - ${format(conflict.end, 'dd/MM/yyyy')}`}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="result-item">
                        <h3>Événements existants</h3>
                        <ul>
                            {existingEvents.map((event, index) => (
                                <li key={index} className={event.type?.includes(userId) ? 'highlight' : ''}>
                                    {event.label}: {format(event.start, 'dd/MM/yyyy')} - {format(event.end, 'dd/MM/yyyy')}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="result-item">
                        <h3>Périodes bloquées</h3>
                        <ul>
                            {blackoutPeriods.map((period, index) => (
                                <li key={index}>
                                    {period.label}: {format(period.start, 'dd/MM/yyyy')} - {format(period.end, 'dd/MM/yyyy')}
                                </li>
                            ))}
                            {restPeriods.map((period, index) => (
                                <li key={`rest-${index}`} className="rest-period">
                                    {period.label}: {format(period.start, 'dd/MM/yyyy')} - {format(period.end, 'dd/MM/yyyy')}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .date-validation-demo {
          font-family: Arial, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        
        h1 {
          color: #333;
          text-align: center;
          margin-bottom: 30px;
        }
        
        h2 {
          color: #555;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        
        .demo-container {
          display: flex;
          gap: 40px;
        }
        
        .form-section {
          flex: 1;
        }
        
        .result-section {
          flex: 1;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: bold;
        }
        
        select, input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        
        .button-group {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        
        button {
          padding: 10px 15px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        button:hover {
          background-color: #0051c2;
        }
        
        .error {
          color: #e10000;
          margin-top: 5px;
          font-size: 14px;
          background-color: #fff5f5;
          padding: 8px;
          border-radius: 4px;
          border-left: 3px solid #e10000;
        }
        
        .result-item {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        h3 {
          margin-top: 0;
          color: #333;
          font-size: 18px;
        }
        
        ul {
          padding-left: 20px;
        }
        
        li {
          margin-bottom: 5px;
        }
        
        .highlight {
          background-color: #ffffdd;
          padding: 3px 5px;
          border-radius: 3px;
        }
        
        .rest-period {
          background-color: #fff0f0;
          padding: 3px 5px;
          border-radius: 3px;
        }
        
        .scenario-selector {
          margin-bottom: 30px;
        }
      `}</style>
        </div>
    );
} 