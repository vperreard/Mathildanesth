import React, { useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableSortLabel,
    TextField,
    Select,
    MenuItem,
    Button,
    Box,
    CircularProgress
} from '@mui/material';
import { LeaveStatus, LeaveType, LeaveWithUser } from '@/modules/leaves/types/leave';
import { User } from '@/types/user';

const formatDateForDisplay = (dateString: string | Date | undefined): string => {
    if (!dateString) return '';
    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        if (isNaN(date.getTime())) {
            return 'Date invalide';
        }
        return date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch (e) {
        console.error("Erreur de formatage de date pour affichage:", e);
        return 'Date invalide';
    }
};

const formatDateForInput = (dateString: string | Date | undefined): string => {
    if (!dateString) return '';
    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        if (isNaN(date.getTime())) {
            return '';
        }
        return date.toISOString().split('T')[0];
    } catch (e) {
        console.error("Erreur de formatage de date pour input:", e);
        return '';
    }
};

type SortableFilterableKeys = keyof LeaveWithUser | 'user' | 'type' | 'startDate' | 'endDate';

interface LeavesListProps {
    leaves: LeaveWithUser[];
    isLoading: boolean;
    error: string | null;
    currentFilter: Partial<Record<SortableFilterableKeys, string>>;
    onFilterChange: (filterName: SortableFilterableKeys, value: string) => void;
    currentSort: { field: SortableFilterableKeys; direction: 'asc' | 'desc' };
    onSortChange: (field: SortableFilterableKeys) => void;
    onEditLeaveClick: (leave: LeaveWithUser) => void;
    onCancelLeaveClick: (leave: LeaveWithUser) => void;
    userId?: string;
}

const LeavesList: React.FC<LeavesListProps> = ({
    leaves,
    isLoading,
    error,
    currentFilter,
    onFilterChange,
    currentSort,
    onSortChange,
    onEditLeaveClick,
    onCancelLeaveClick
}) => {
    const sortedLeaves = useMemo(() => {
        if (!Array.isArray(leaves)) {
            console.warn("LeavesList: 'leaves' prop n'est pas un tableau.");
            return [];
        }
        const sorted = [...leaves].sort((a, b) => {
            const field = currentSort.field;
            let aValue: string | number | Date | null = null;
            let bValue: string | number | Date | null = null;

            try {
                if (field === 'user') {
                    aValue = a.user ? `${a.user.prenom ?? ''} ${a.user.nom ?? ''}`.trim().toLowerCase() : '';
                    bValue = b.user ? `${b.user.prenom ?? ''} ${b.user.nom ?? ''}`.trim().toLowerCase() : '';
                } else if (field === 'startDate' || field === 'endDate') {
                    aValue = a[field] ? new Date(a[field]) : null;
                    bValue = b[field] ? new Date(b[field]) : null;
                    if (aValue && isNaN(aValue.getTime())) aValue = null;
                    if (bValue && isNaN(bValue.getTime())) bValue = null;

                    if (aValue === null && bValue === null) return 0;
                    if (aValue === null) return currentSort.direction === 'asc' ? 1 : -1;
                    if (bValue === null) return currentSort.direction === 'asc' ? -1 : 1;
                    if (aValue < bValue) return currentSort.direction === 'asc' ? -1 : 1;
                    if (aValue > bValue) return currentSort.direction === 'asc' ? 1 : -1;
                    return 0;
                } else if (field === 'type' || field === 'status') {
                    aValue = a[field]?.toString().toLowerCase() ?? '';
                    bValue = b[field]?.toString().toLowerCase() ?? '';
                } else {
                    aValue = (a as any)[field]?.toString().toLowerCase() ?? '';
                    bValue = (b as any)[field]?.toString().toLowerCase() ?? '';
                }
            } catch (e) {
                console.error(`Erreur durant la récupération des valeurs pour le tri sur le champ ${field}:`, e);
                return 0;
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                if (aValue < bValue) return currentSort.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return currentSort.direction === 'asc' ? 1 : -1;
            }

            return 0;
        });
        return sorted;
    }, [leaves, currentSort]);

    const filteredLeaves = useMemo(() => {
        return sortedLeaves.filter(leave => {
            return (Object.keys(currentFilter) as SortableFilterableKeys[]).every(key => {
                const filterValue = currentFilter[key]?.trim().toLowerCase();
                if (!filterValue) return true;

                let leaveValue: string = '';
                try {
                    if (key === 'user') {
                        leaveValue = leave.user ? `${leave.user.prenom ?? ''} ${leave.user.nom ?? ''}`.trim().toLowerCase() : '';
                    } else if (key === 'startDate' || key === 'endDate') {
                        const date = leave[key];
                        if (date) {
                            const formattedDateForFilter = formatDateForInput(date);
                            return formattedDateForFilter === filterValue;
                        }
                        return false;
                    } else if (key === 'type' || key === 'status') {
                        leaveValue = leave[key]?.toString().toLowerCase() ?? '';
                    } else {
                        leaveValue = (leave as any)[key]?.toString().toLowerCase() ?? '';
                    }
                } catch (e) {
                    console.error(`Erreur durant le filtrage sur le champ ${key}:`, e);
                    return false;
                }

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore - Le linter semble avoir du mal à résoudre correctement SortableFilterableKeys ici
                if (key !== 'startDate' && key !== 'endDate') {
                    return leaveValue.includes(filterValue);
                }
                return true;
            });
        });
    }, [sortedLeaves, currentFilter]);

    return (
        <>
            <Table stickyHeader aria-label="Liste des congés">
                <TableHead>
                    <TableRow>
                        <TableCell sortDirection={currentSort.field === 'user' ? currentSort.direction : false}>
                            <TableSortLabel
                                active={currentSort.field === 'user'}
                                direction={currentSort.field === 'user' ? currentSort.direction : 'asc'}
                                onClick={() => onSortChange('user')}
                            >
                                Utilisateur
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={currentSort.field === 'type' ? currentSort.direction : false}>
                            <TableSortLabel
                                active={currentSort.field === 'type'}
                                direction={currentSort.field === 'type' ? currentSort.direction : 'asc'}
                                onClick={() => onSortChange('type')}
                            >
                                Type
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={currentSort.field === 'startDate' ? currentSort.direction : false}>
                            <TableSortLabel
                                active={currentSort.field === 'startDate'}
                                direction={currentSort.field === 'startDate' ? currentSort.direction : 'asc'}
                                onClick={() => onSortChange('startDate')}
                            >
                                Début
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={currentSort.field === 'endDate' ? currentSort.direction : false}>
                            <TableSortLabel
                                active={currentSort.field === 'endDate'}
                                direction={currentSort.field === 'endDate' ? currentSort.direction : 'asc'}
                                onClick={() => onSortChange('endDate')}
                            >
                                Fin
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={currentSort.field === 'status' ? currentSort.direction : false}>
                            <TableSortLabel
                                active={currentSort.field === 'status'}
                                direction={currentSort.field === 'status' ? currentSort.direction : 'asc'}
                                onClick={() => onSortChange('status')}
                            >
                                Statut
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>
                            <TextField
                                variant="standard"
                                value={currentFilter.user || ''}
                                onChange={(e) => onFilterChange('user', e.target.value)}
                                placeholder="Filtrer par nom..."
                                fullWidth
                                size="small"
                            />
                        </TableCell>
                        <TableCell>
                            <Select
                                variant="standard"
                                value={currentFilter.type || ''}
                                onChange={(e) => onFilterChange('type', e.target.value)}
                                displayEmpty
                                fullWidth
                                size="small"
                            >
                                <MenuItem value=""><em>Tous les types</em></MenuItem>
                                {Object.values(LeaveType).map(typeValue => (
                                    <MenuItem key={typeValue} value={typeValue}>{typeValue}</MenuItem>
                                ))}
                            </Select>
                        </TableCell>
                        <TableCell>
                            <TextField
                                variant="standard"
                                type="date"
                                value={currentFilter.startDate || ''}
                                onChange={(e) => onFilterChange('startDate', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                size="small"
                                label="Filtrer début"
                                InputProps={{ style: { marginTop: '16px' } }}
                            />
                        </TableCell>
                        <TableCell>
                            <TextField
                                variant="standard"
                                type="date"
                                value={currentFilter.endDate || ''}
                                onChange={(e) => onFilterChange('endDate', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                size="small"
                                label="Filtrer fin"
                                InputProps={{ style: { marginTop: '16px' } }}
                            />
                        </TableCell>
                        <TableCell>
                            <Select
                                variant="standard"
                                value={currentFilter.status || ''}
                                onChange={(e) => onFilterChange('status', e.target.value)}
                                displayEmpty
                                fullWidth
                                size="small"
                            >
                                <MenuItem value=""><em>Tous les statuts</em></MenuItem>
                                {Object.values(LeaveStatus).map(status => (
                                    <MenuItem key={status} value={status}>{status}</MenuItem>
                                ))}
                            </Select>
                        </TableCell>
                        <TableCell />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={6} align="center">
                                <Box display="flex" justifyContent="center" alignItems="center" p={3}>
                                    <CircularProgress />
                                    <Box component="span" ml={2}>Chargement des données...</Box>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ) : error ? (
                        <TableRow>
                            <TableCell colSpan={6} align="center" style={{ color: 'red' }}>Erreur: {error}</TableCell>
                        </TableRow>
                    ) : filteredLeaves.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} align="center">Aucune demande ne correspond aux critères.</TableCell>
                        </TableRow>
                    ) : (
                        filteredLeaves.map((leave) => (
                            <TableRow key={leave.id} hover>
                                <TableCell>{leave.user ? `${leave.user.prenom} ${leave.user.nom}` : 'N/A'}</TableCell>
                                <TableCell>{leave.type}</TableCell>
                                <TableCell>{formatDateForDisplay(leave.startDate)}</TableCell>
                                <TableCell>{formatDateForDisplay(leave.endDate)}</TableCell>
                                <TableCell>{leave.status}</TableCell>
                                <TableCell>
                                    <Box display="flex" gap={1}>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            size="small"
                                            onClick={() => onEditLeaveClick(leave)}
                                            disabled={leave.status !== LeaveStatus.PENDING}
                                        >
                                            Modifier
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="secondary"
                                            size="small"
                                            onClick={() => onCancelLeaveClick(leave)}
                                            disabled={leave.status !== LeaveStatus.PENDING}
                                        >
                                            Annuler
                                        </Button>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </>
    );
};

export default LeavesList;