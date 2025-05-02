import { useState, useEffect } from 'react';
import { LeaveType } from '../types/leave';

interface LeaveTypeOption {
    value: LeaveType;
    label: string;
}

/**
 * Hook pour récupérer la liste des types de congés avec leurs labels
 */
export function useLeaveTypes() {
    const [leaveTypes, setLeaveTypes] = useState<LeaveTypeOption[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Types de congés disponibles avec leurs labels
        const types: LeaveTypeOption[] = [
            { value: LeaveType.ANNUAL, label: 'Congés annuels' },
            { value: LeaveType.RECOVERY, label: 'Récupération' },
            { value: LeaveType.TRAINING, label: 'Formation' },
            { value: LeaveType.SICK, label: 'Maladie' },
            { value: LeaveType.MATERNITY, label: 'Maternité' },
            { value: LeaveType.SPECIAL, label: 'Congés spéciaux' },
            { value: LeaveType.UNPAID, label: 'Sans solde' },
            { value: LeaveType.OTHER, label: 'Autre' }
        ];

        setLeaveTypes(types);
        setLoading(false);
    }, []);

    return {
        leaveTypes,
        loading,
        error
    };
} 