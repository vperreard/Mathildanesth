import React, { useState, useEffect } from 'react';
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
    CircularProgress,
    Pagination,
    Typography,
    Chip,
    Alert,
    Paper
} from '@mui/material';
import { LeaveStatus, LeaveType } from '@/modules/conges/types/leave';
import { useDebounceFilters } from '../hooks/useDebounceFilters';
import { useLeavesList } from '../hooks/useLeaveQueries';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { SortDirection } from '../hooks/useLeaveListFilteringSorting';

// Style pour les rangées alternées
const getRowStyle = (index: number) => ({
    backgroundColor: index % 2 ? 'rgba(0, 0, 0, 0.03)' : 'transparent'
});

// Composant pour afficher le statut avec une puce colorée
const StatusChip = ({ status }: { status: LeaveStatus }) => {
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';

    switch (status) {
        case LeaveStatus.APPROVED:
            color = 'success';
            break;
        case LeaveStatus.PENDING:
            color = 'warning';
            break;
        case LeaveStatus.REJECTED:
            color = 'error';
            break;
        case LeaveStatus.CANCELLED:
            color = 'default';
            break;
    }

    return <Chip label={status} color={color} size="small" />;
};

/**
 * Liste des congés optimisée avec React Query et debounce
 */
const OptimizedLeavesList: React.FC = () => {
    // Gestion des filtres avec debounce
    const {
        inputFilters,
        debouncedFilters,
        isDebouncing,
        updateFilter,
        resetFilters
    } = useDebounceFilters({
        page: 1,
        limit: 20,
        sortBy: 'startDate',
        sortOrder: 'desc' as SortDirection
    }, { delay: 400 });

    // Récupération des données avec React Query
    const {
        data,
        isLoading,
        isFetching,
        error,
        isError,
        refetch
    } = useLeavesList(debouncedFilters);

    // État local pour la pagination
    const [page, setPage] = useState<number>(1);

    // Mettre à jour les filtres quand la pagination change
    const handlePageChange = (_: React.ChangeEvent<unknown>, newPage: number) => {
        setPage(newPage);
        updateFilter('page', newPage);
    };

    // Mettre à jour les filtres quand le tri change
    const handleSortChange = (field: string) => {
        const newDirection = field === inputFilters.sortBy && inputFilters.sortOrder === 'asc'
            ? 'desc'
            : 'asc';

        updateFilter('sortBy', field);
        updateFilter('sortOrder', newDirection as SortDirection);
    };

    // Réinitialiser l'état local quand les données filtres debounced changent
    useEffect(() => {
        setPage(debouncedFilters.page || 1);
    }, [debouncedFilters.page]);

    // Afficher un message d'erreur s'il y a une erreur
    if (isError) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                Erreur lors du chargement des congés: {error instanceof Error ? error.message : 'Erreur inconnue'}
            </Alert>
        );
    }

    return (
        <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Liste des congés</Typography>
                <Button
                    variant="outlined"
                    onClick={() => resetFilters()}
                    disabled={isLoading}
                >
                    Réinitialiser les filtres
                </Button>
            </Box>

            {(isLoading || isFetching || isDebouncing) && (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                        {isLoading ? 'Chargement des données...' : 'Mise à jour...'}
                    </Typography>
                </Box>
            )}

            <Table stickyHeader aria-label="Liste des congés">
                <TableHead>
                    <TableRow>
                        <TableCell sortDirection={inputFilters.sortBy === 'userName' ? inputFilters.sortOrder : false}>
                            <TableSortLabel
                                active={inputFilters.sortBy === 'userName'}
                                direction={inputFilters.sortBy === 'userName' ? inputFilters.sortOrder : 'asc'}
                                onClick={() => handleSortChange('userName')}
                            >
                                Utilisateur
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={inputFilters.sortBy === 'type' ? inputFilters.sortOrder : false}>
                            <TableSortLabel
                                active={inputFilters.sortBy === 'type'}
                                direction={inputFilters.sortBy === 'type' ? inputFilters.sortOrder : 'asc'}
                                onClick={() => handleSortChange('type')}
                            >
                                Type
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={inputFilters.sortBy === 'startDate' ? inputFilters.sortOrder : false}>
                            <TableSortLabel
                                active={inputFilters.sortBy === 'startDate'}
                                direction={inputFilters.sortBy === 'startDate' ? inputFilters.sortOrder : 'asc'}
                                onClick={() => handleSortChange('startDate')}
                            >
                                Début
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={inputFilters.sortBy === 'endDate' ? inputFilters.sortOrder : false}>
                            <TableSortLabel
                                active={inputFilters.sortBy === 'endDate'}
                                direction={inputFilters.sortBy === 'endDate' ? inputFilters.sortOrder : 'asc'}
                                onClick={() => handleSortChange('endDate')}
                            >
                                Fin
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={inputFilters.sortBy === 'status' ? inputFilters.sortOrder : false}>
                            <TableSortLabel
                                active={inputFilters.sortBy === 'status'}
                                direction={inputFilters.sortBy === 'status' ? inputFilters.sortOrder : 'asc'}
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
                                value={inputFilters.search || ''}
                                onChange={(e) => updateFilter('search', e.target.value)}
                                placeholder="Rechercher..."
                                fullWidth
                                size="small"
                            />
                        </TableCell>
                        <TableCell>
                            <Select
                                variant="standard"
                                value={inputFilters.type || ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    updateFilter('type', value ? value as LeaveType : undefined);
                                }}
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
                                value={inputFilters.startDate || ''}
                                onChange={(e) => updateFilter('startDate', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                size="small"
                                label="À partir du"
                                InputProps={{ style: { marginTop: '16px' } }}
                            />
                        </TableCell>
                        <TableCell>
                            <TextField
                                variant="standard"
                                type="date"
                                value={inputFilters.endDate || ''}
                                onChange={(e) => updateFilter('endDate', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                size="small"
                                label="Jusqu'au"
                                InputProps={{ style: { marginTop: '16px' } }}
                            />
                        </TableCell>
                        <TableCell>
                            <Select
                                variant="standard"
                                value={inputFilters.status || ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    updateFilter('status', value ? value as LeaveStatus : undefined);
                                }}
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
                    ) : !data || data.items.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} align="center">
                                <Box p={3}>
                                    <Typography variant="body1">Aucun congé trouvé.</Typography>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.items.map((leave, index) => (
                            <TableRow key={leave.id} sx={getRowStyle(index)}>
                                <TableCell>{leave.userName}</TableCell>
                                <TableCell>{leave.type}</TableCell>
                                <TableCell>{formatDateForDisplay(leave.startDate)}</TableCell>
                                <TableCell>{formatDateForDisplay(leave.endDate)}</TableCell>
                                <TableCell>
                                    <StatusChip status={leave.status as LeaveStatus} />
                                </TableCell>
                                <TableCell>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        href={`/conges/${leave.id}`}
                                        sx={{ mr: 1 }}
                                    >
                                        Détails
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {data && data.totalPages > 0 && (
                <Box display="flex" justifyContent="center" p={2}>
                    <Pagination
                        count={data.totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        disabled={isLoading || isFetching}
                    />
                </Box>
            )}

            {data && (
                <Box display="flex" justifyContent="flex-end" mt={2}>
                    <Typography variant="body2" color="textSecondary">
                        Affichage de {(data.page - 1) * data.limit + 1} à {Math.min(data.page * data.limit, data.total)} sur {data.total} congés
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default OptimizedLeavesList; 