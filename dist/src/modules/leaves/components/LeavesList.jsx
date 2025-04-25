var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel, TextField, Select, MenuItem, Button, Box, CircularProgress } from '@mui/material';
import { LeaveStatus, LeaveType } from '@/modules/leaves/types/leave';
var formatDateForDisplay = function (dateString) {
    if (!dateString)
        return '';
    try {
        var date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        if (isNaN(date.getTime())) {
            return 'Date invalide';
        }
        return date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
    }
    catch (e) {
        console.error("Erreur de formatage de date pour affichage:", e);
        return 'Date invalide';
    }
};
var formatDateForInput = function (dateString) {
    if (!dateString)
        return '';
    try {
        var date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        if (isNaN(date.getTime())) {
            return '';
        }
        return date.toISOString().split('T')[0];
    }
    catch (e) {
        console.error("Erreur de formatage de date pour input:", e);
        return '';
    }
};
var LeavesList = function (_a) {
    var leaves = _a.leaves, isLoading = _a.isLoading, error = _a.error, currentFilter = _a.currentFilter, onFilterChange = _a.onFilterChange, currentSort = _a.currentSort, onSortChange = _a.onSortChange, onEditLeaveClick = _a.onEditLeaveClick, onCancelLeaveClick = _a.onCancelLeaveClick;
    var sortedLeaves = useMemo(function () {
        if (!Array.isArray(leaves)) {
            console.warn("LeavesList: 'leaves' prop n'est pas un tableau.");
            return [];
        }
        var sorted = __spreadArray([], leaves, true).sort(function (a, b) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
            var field = currentSort.field;
            var aValue = null;
            var bValue = null;
            try {
                if (field === 'user') {
                    // Vérifier les deux possibilités (firstName/lastName ou prenom/nom)
                    // @ts-ignore - Support de la double structure de nommage
                    var aFirstName = ((_a = a.user) === null || _a === void 0 ? void 0 : _a.firstName) || ((_b = a.user) === null || _b === void 0 ? void 0 : _b.prenom) || '';
                    // @ts-ignore - Support de la double structure de nommage
                    var aLastName = ((_c = a.user) === null || _c === void 0 ? void 0 : _c.lastName) || ((_d = a.user) === null || _d === void 0 ? void 0 : _d.nom) || '';
                    // @ts-ignore - Support de la double structure de nommage
                    var bFirstName = ((_e = b.user) === null || _e === void 0 ? void 0 : _e.firstName) || ((_f = b.user) === null || _f === void 0 ? void 0 : _f.prenom) || '';
                    // @ts-ignore - Support de la double structure de nommage
                    var bLastName = ((_g = b.user) === null || _g === void 0 ? void 0 : _g.lastName) || ((_h = b.user) === null || _h === void 0 ? void 0 : _h.nom) || '';
                    aValue = "".concat(aFirstName, " ").concat(aLastName).trim().toLowerCase();
                    bValue = "".concat(bFirstName, " ").concat(bLastName).trim().toLowerCase();
                }
                else if (field === 'startDate' || field === 'endDate') {
                    aValue = a[field] ? new Date(a[field]) : null;
                    bValue = b[field] ? new Date(b[field]) : null;
                    if (aValue && isNaN(aValue.getTime()))
                        aValue = null;
                    if (bValue && isNaN(bValue.getTime()))
                        bValue = null;
                    if (aValue === null && bValue === null)
                        return 0;
                    if (aValue === null)
                        return currentSort.direction === 'asc' ? 1 : -1;
                    if (bValue === null)
                        return currentSort.direction === 'asc' ? -1 : 1;
                    if (aValue < bValue)
                        return currentSort.direction === 'asc' ? -1 : 1;
                    if (aValue > bValue)
                        return currentSort.direction === 'asc' ? 1 : -1;
                    return 0;
                }
                else if (field === 'type' || field === 'status') {
                    aValue = (_k = (_j = a[field]) === null || _j === void 0 ? void 0 : _j.toString().toLowerCase()) !== null && _k !== void 0 ? _k : '';
                    bValue = (_m = (_l = b[field]) === null || _l === void 0 ? void 0 : _l.toString().toLowerCase()) !== null && _m !== void 0 ? _m : '';
                }
                else {
                    aValue = (_p = (_o = a[field]) === null || _o === void 0 ? void 0 : _o.toString().toLowerCase()) !== null && _p !== void 0 ? _p : '';
                    bValue = (_r = (_q = b[field]) === null || _q === void 0 ? void 0 : _q.toString().toLowerCase()) !== null && _r !== void 0 ? _r : '';
                }
            }
            catch (e) {
                console.error("Erreur durant la r\u00E9cup\u00E9ration des valeurs pour le tri sur le champ ".concat(field, ":"), e);
                return 0;
            }
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                if (aValue < bValue)
                    return currentSort.direction === 'asc' ? -1 : 1;
                if (aValue > bValue)
                    return currentSort.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        return sorted;
    }, [leaves, currentSort]);
    var filteredLeaves = useMemo(function () {
        return sortedLeaves.filter(function (leave) {
            return Object.keys(currentFilter).every(function (key) {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                var filterValue = (_a = currentFilter[key]) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
                if (!filterValue)
                    return true;
                var leaveValue = '';
                try {
                    if (key === 'user') {
                        // Vérifier les deux possibilités (firstName/lastName ou prenom/nom)
                        // @ts-ignore - Support de la double structure de nommage
                        var firstName = ((_b = leave.user) === null || _b === void 0 ? void 0 : _b.firstName) || ((_c = leave.user) === null || _c === void 0 ? void 0 : _c.prenom) || '';
                        // @ts-ignore - Support de la double structure de nommage
                        var lastName = ((_d = leave.user) === null || _d === void 0 ? void 0 : _d.lastName) || ((_e = leave.user) === null || _e === void 0 ? void 0 : _e.nom) || '';
                        leaveValue = "".concat(firstName, " ").concat(lastName).trim().toLowerCase();
                    }
                    else if (key === 'startDate' || key === 'endDate') {
                        var date = leave[key];
                        if (date) {
                            var formattedDateForFilter = formatDateForInput(date);
                            return formattedDateForFilter === filterValue;
                        }
                        return false;
                    }
                    else if (key === 'type' || key === 'status') {
                        leaveValue = (_g = (_f = leave[key]) === null || _f === void 0 ? void 0 : _f.toString().toLowerCase()) !== null && _g !== void 0 ? _g : '';
                    }
                    else {
                        leaveValue = (_j = (_h = leave[key]) === null || _h === void 0 ? void 0 : _h.toString().toLowerCase()) !== null && _j !== void 0 ? _j : '';
                    }
                }
                catch (e) {
                    console.error("Erreur durant le filtrage sur le champ ".concat(key, ":"), e);
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
    return (<>
            <Table stickyHeader aria-label="Liste des congés">
                <TableHead>
                    <TableRow>
                        <TableCell sortDirection={currentSort.field === 'user' ? currentSort.direction : false}>
                            <TableSortLabel active={currentSort.field === 'user'} direction={currentSort.field === 'user' ? currentSort.direction : 'asc'} onClick={function () { return onSortChange('user'); }}>
                                Utilisateur
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={currentSort.field === 'type' ? currentSort.direction : false}>
                            <TableSortLabel active={currentSort.field === 'type'} direction={currentSort.field === 'type' ? currentSort.direction : 'asc'} onClick={function () { return onSortChange('type'); }}>
                                Type
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={currentSort.field === 'startDate' ? currentSort.direction : false}>
                            <TableSortLabel active={currentSort.field === 'startDate'} direction={currentSort.field === 'startDate' ? currentSort.direction : 'asc'} onClick={function () { return onSortChange('startDate'); }}>
                                Début
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={currentSort.field === 'endDate' ? currentSort.direction : false}>
                            <TableSortLabel active={currentSort.field === 'endDate'} direction={currentSort.field === 'endDate' ? currentSort.direction : 'asc'} onClick={function () { return onSortChange('endDate'); }}>
                                Fin
                            </TableSortLabel>
                        </TableCell>
                        <TableCell sortDirection={currentSort.field === 'status' ? currentSort.direction : false}>
                            <TableSortLabel active={currentSort.field === 'status'} direction={currentSort.field === 'status' ? currentSort.direction : 'asc'} onClick={function () { return onSortChange('status'); }}>
                                Statut
                            </TableSortLabel>
                        </TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>
                            <TextField variant="standard" value={currentFilter.user || ''} onChange={function (e) { return onFilterChange('user', e.target.value); }} placeholder="Filtrer par nom..." fullWidth size="small"/>
                        </TableCell>
                        <TableCell>
                            <Select variant="standard" value={currentFilter.type || ''} onChange={function (e) { return onFilterChange('type', e.target.value); }} displayEmpty fullWidth size="small">
                                <MenuItem value=""><em>Tous les types</em></MenuItem>
                                {Object.values(LeaveType).map(function (typeValue) { return (<MenuItem key={typeValue} value={typeValue}>{typeValue}</MenuItem>); })}
                            </Select>
                        </TableCell>
                        <TableCell>
                            <TextField variant="standard" type="date" value={currentFilter.startDate || ''} onChange={function (e) { return onFilterChange('startDate', e.target.value); }} InputLabelProps={{ shrink: true }} fullWidth size="small" label="Filtrer début" InputProps={{ style: { marginTop: '16px' } }}/>
                        </TableCell>
                        <TableCell>
                            <TextField variant="standard" type="date" value={currentFilter.endDate || ''} onChange={function (e) { return onFilterChange('endDate', e.target.value); }} InputLabelProps={{ shrink: true }} fullWidth size="small" label="Filtrer fin" InputProps={{ style: { marginTop: '16px' } }}/>
                        </TableCell>
                        <TableCell>
                            <Select variant="standard" value={currentFilter.status || ''} onChange={function (e) { return onFilterChange('status', e.target.value); }} displayEmpty fullWidth size="small">
                                <MenuItem value=""><em>Tous les statuts</em></MenuItem>
                                {Object.values(LeaveStatus).map(function (status) { return (<MenuItem key={status} value={status}>{status}</MenuItem>); })}
                            </Select>
                        </TableCell>
                        <TableCell />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {isLoading ? (<TableRow>
                            <TableCell colSpan={6} align="center">
                                <Box display="flex" justifyContent="center" alignItems="center" p={3}>
                                    <CircularProgress />
                                    <Box component="span" ml={2}>Chargement des données...</Box>
                                </Box>
                            </TableCell>
                        </TableRow>) : error ? (<TableRow>
                            <TableCell colSpan={6} align="center" style={{ color: 'red' }}>Erreur: {error}</TableCell>
                        </TableRow>) : filteredLeaves.length === 0 ? (<TableRow>
                            <TableCell colSpan={6} align="center">Aucune demande ne correspond aux critères.</TableCell>
                        </TableRow>) : (filteredLeaves.map(function (leave) { return (<TableRow key={leave.id} hover>
                                <TableCell>{leave.user ? "".concat(leave.user.prenom, " ").concat(leave.user.nom) : 'N/A'}</TableCell>
                                <TableCell>{leave.type}</TableCell>
                                <TableCell>{formatDateForDisplay(leave.startDate)}</TableCell>
                                <TableCell>{formatDateForDisplay(leave.endDate)}</TableCell>
                                <TableCell>{leave.status}</TableCell>
                                <TableCell>
                                    <Box display="flex" gap={1}>
                                        <Button variant="outlined" color="primary" size="small" onClick={function () { return onEditLeaveClick(leave); }} disabled={leave.status !== LeaveStatus.PENDING}>
                                            Modifier
                                        </Button>
                                        <Button variant="outlined" color="secondary" size="small" onClick={function () { return onCancelLeaveClick(leave); }} disabled={leave.status !== LeaveStatus.PENDING}>
                                            Annuler
                                        </Button>
                                    </Box>
                                </TableCell>
                            </TableRow>); }))}
                </TableBody>
            </Table>
        </>);
};
export default LeavesList;
