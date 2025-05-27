import React, { useMemo, useState } from 'react';
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
import { LeaveStatus, LeaveType, LeaveWithUser } from '@/modules/conges/types/leave';
import { User } from '@/types/user';
import {
    useLeaveListFilteringSorting,
    SortableFilterableKeys,
    SortDirection,
    FilterValues,
    SortState
} from '../hooks/useLeaveListFilteringSorting';

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

interface LeavesListProps {
    leaves: LeaveWithUser[];
    isLoading: boolean;
    error: string | null;
    onEditLeaveClick: (leave: LeaveWithUser) => void;
    onCancelLeaveClick: (leave: LeaveWithUser) => void;
}

const LeavesList: React.FC<LeavesListProps> = ({
    leaves,
    isLoading,
    error,
    onEditLeaveClick,
    onCancelLeaveClick
}) => {
    const [filter, setFilter] = useState<FilterValues>({});
    const [sort, setSort] = useState<SortState>({ field: 'startDate', direction: 'desc' });

    const handleFilterChange = (filterName: SortableFilterableKeys, value: string) => {
        setFilter(prev => ({ ...prev, [filterName]: value }));
    };

    const handleSortChange = (field: SortableFilterableKeys) => {
        setSort(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const filteredAndSortedLeaves = useLeaveListFilteringSorting({ leaves, filter, sort });

    return (
        <>
            <Table stickyHeader aria-label="Liste des congés">
                <TableHead>
                    <TableRow>
                        <TableCell sortDirection={sort.field === 'user' ? sort.direction : false}>
                            <TableSortLabel
                                active={sort.field === 'user'}
                                direction={sort.field === 'user' ? sort.direction : 'asc'}
                                onClick={() => handleSortChange('user')}
                            >
                                Utilisateur
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={sort.field === 'type' ? sort.direction : false}>
                            <TableSortLabel
                                active={sort.field === 'type'}
                                direction={sort.field === 'type' ? sort.direction : 'asc'}
                                onClick={() => handleSortChange('type')}
                            >
                                Type
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={sort.field === 'startDate' ? sort.direction : false}>
                            <TableSortLabel
                                active={sort.field === 'startDate'}
                                direction={sort.field === 'startDate' ? sort.direction : 'asc'}
                                onClick={() => handleSortChange('startDate')}
                            >
                                Début
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={sort.field === 'endDate' ? sort.direction : false}>
                            <TableSortLabel
                                active={sort.field === 'endDate'}
                                direction={sort.field === 'endDate' ? sort.direction : 'asc'}
                                onClick={() => handleSortChange('endDate')}
                            >
                                Fin
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={sort.field === 'status' ? sort.direction : false}>
                            <TableSortLabel
                                active={sort.field === 'status'}
                                direction={sort.field === 'status' ? sort.direction : 'asc'}
                                onClick={() => handleSortChange('status')}
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
                                value={filter.user || ''}
                                onChange={(e) => handleFilterChange('user', e.target.value)}
                                placeholder="Filtrer par nom..."
                                fullWidth
                                size="small"
                            />
                        </TableCell>
                        <TableCell>
                            <Select
                                variant="standard"
                                value={filter.type || ''}
                                onChange={(e) => handleFilterChange('type', e.target.value)}
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
                                value={filter.startDate || ''}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
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
                                value={filter.endDate || ''}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
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
                                value={filter.status || ''}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
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
                    ) : filteredAndSortedLeaves.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} align="center">Aucune demande ne correspond aux critères.</TableCell>
                        </TableRow>
                    ) : (
                        filteredAndSortedLeaves.map((leave) => (
                            <TableRow key={leave.id} hover>
                                <TableCell>
                                    {leave.user && (leave.user.prenom || leave.user.nom)
                                        ? `${leave.user.prenom || ''} ${leave.user.nom || ''}`.trim()
                                        : 'Utilisateur inconnu'}
                                </TableCell>
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