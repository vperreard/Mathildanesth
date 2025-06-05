import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import {
    AnyCalendarEvent,
    CalendarFilters,
    CalendarSettings,
    CalendarViewType
} from '../types/event';
import { RootState } from '../../../store/store';
import { fetchCalendarEvents } from '../services/calendrierService';
import { startOfMonth, endOfMonth } from 'date-fns';

// État initial du store
interface CalendarState {
    events: AnyCalendarEvent[];
    filteredEvents: AnyCalendarEvent[];
    loading: boolean;
    error: string | null;
    selectedEventId: string | null;
    view: CalendarViewType;
    currentRange: {
        start: string;
        end: string;
    };
    filters: CalendarFilters;
    settings: CalendarSettings;
    lastUpdated: number | null;
}

// Valeurs par défaut
const DEFAULT_SETTINGS: CalendarSettings = {
    locale: 'fr',
    firstDay: 1,
    businessHours: {
        startTime: '08:00',
        endTime: '18:00',
        daysOfWeek: [1, 2, 3, 4, 5]
    },
    nowIndicator: true,
    snapDuration: '00:15:00',
    slotDuration: '00:30:00',
    slotLabelInterval: '01:00:00',
    slotLabelFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    },
    slotMinTime: '08:00:00',
    slotMaxTime: '20:00:00'
};

const now = new Date();
const initialState: CalendarState = {
    events: [],
    filteredEvents: [],
    loading: false,
    error: null,
    selectedEventId: null,
    view: CalendarViewType.MONTH,
    currentRange: {
        start: startOfMonth(now).toISOString(),
        end: endOfMonth(now).toISOString()
    },
    filters: {
        eventTypes: [],
        dateRange: {
            start: startOfMonth(now),
            end: endOfMonth(now)
        }
    },
    settings: DEFAULT_SETTINGS,
    lastUpdated: null
};

// Thunk pour charger les événements
export const fetchEvents = createAsyncThunk(
    'calendar/fetchEvents',
    async (filters: CalendarFilters, { rejectWithValue }) => {
        try {
            return await fetchCalendarEvents(filters);
        } catch (error: unknown) {
            return rejectWithValue((error as Error).message);
        }
    }
);

// Slice du calendrier
const calendarSlice = createSlice({
    name: 'calendar',
    initialState,
    reducers: {
        // Définir la vue du calendrier
        setView(state, action: PayloadAction<CalendarViewType>) {
            state.view = action.payload;
        },

        // Définir la plage de dates
        setDateRange(state, action: PayloadAction<{ start: Date; end: Date }>) {
            state.currentRange = {
                start: action.payload.start.toISOString(),
                end: action.payload.end.toISOString()
            };

            // Mettre à jour les filtres également
            state.filters.dateRange = action.payload;
        },

        // Mettre à jour les filtres
        updateFilters(state, action: PayloadAction<Partial<CalendarFilters>>) {
            state.filters = {
                ...state.filters,
                ...action.payload
            };
        },

        // Réinitialiser les filtres
        resetFilters(state) {
            state.filters = {
                ...initialState.filters,
                dateRange: {
                    start: new Date(state.currentRange.start),
                    end: new Date(state.currentRange.end)
                }
            };
        },

        // Mettre à jour les paramètres
        updateSettings(state, action: PayloadAction<Partial<CalendarSettings>>) {
            state.settings = {
                ...state.settings,
                ...action.payload
            };
        },

        // Sélectionner un événement
        selectEvent(state, action: PayloadAction<string | null>) {
            state.selectedEventId = action.payload;
        },

        // Appliquer des filtres aux événements déjà chargés
        applyFilters(state) {
            state.filteredEvents = filterEvents(state.events, state.filters);
        },

        // Ajouter un événement
        addEvent(state, action: PayloadAction<AnyCalendarEvent>) {
            state.events.push(action.payload);
            state.filteredEvents = filterEvents(state.events, state.filters);
            state.lastUpdated = Date.now();
        },

        // Mettre à jour un événement
        updateEvent(state, action: PayloadAction<{ id: string; event: Partial<AnyCalendarEvent> }>) {
            const { id, event } = action.payload;
            const index = state.events.findIndex(e => e.id === id);

            if (index !== -1) {
                state.events[index] = { ...state.events[index], ...event };
                state.filteredEvents = filterEvents(state.events, state.filters);
                state.lastUpdated = Date.now();
            }
        },

        // Supprimer un événement
        removeEvent(state, action: PayloadAction<string>) {
            state.events = state.events.filter(e => e.id !== action.payload);
            state.filteredEvents = filterEvents(state.events, state.filters);
            state.lastUpdated = Date.now();
        }
    },
    extraReducers: (builder) => {
        builder
            // Gestion de l'état pendant le chargement
            .addCase(fetchEvents.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            // Gestion de l'état en cas de succès
            .addCase(fetchEvents.fulfilled, (state, action) => {
                state.loading = false;
                state.events = action.payload;
                state.filteredEvents = filterEvents(action.payload, state.filters);
                state.lastUpdated = Date.now();
            })
            // Gestion de l'état en cas d'erreur
            .addCase(fetchEvents.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

// Fonction utilitaire pour filtrer les événements
function filterEvents(events: AnyCalendarEvent[], filters: CalendarFilters): AnyCalendarEvent[] {
    return events.filter(event => {
        // Filtrer par type d'événement
        if (filters.eventTypes.length > 0 && !filters.eventTypes.includes(event.type)) {
            return false;
        }

        // Filtrer par utilisateur
        if (filters.userIds && filters.userIds.length > 0 && !filters.userIds.includes(event.userId)) {
            return false;
        }

        // Filtrer par type de congé
        if (filters.leaveTypes && filters.leaveTypes.length > 0 &&
            event.type === CalendarEventType.LEAVE &&
            'leaveType' in event &&
            !filters.leaveTypes.includes((event as any).leaveType)) {
            return false;
        }

        // Filtrer par statut de congé
        if (filters.leaveStatuses && filters.leaveStatuses.length > 0 &&
            event.type === CalendarEventType.LEAVE &&
            'status' in event &&
            !filters.leaveStatuses.includes((event as any).status)) {
            return false;
        }

        // Filtrer par lieu
        if (filters.locationIds && filters.locationIds.length > 0 &&
            'locationId' in event &&
            (event as any).locationId &&
            !filters.locationIds.includes((event as any).locationId)) {
            return false;
        }

        // Filtrer par équipe
        if (filters.teamIds && filters.teamIds.length > 0 &&
            'teamId' in event &&
            (event as any).teamId &&
            !filters.teamIds.includes((event as any).teamId)) {
            return false;
        }

        // Filtrer par plage de dates
        if (filters.dateRange) {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);

            // Vérifier si l'événement est en dehors de la plage de dates
            if (eventEnd < filters.dateRange.start || eventStart > filters.dateRange.end) {
                return false;
            }
        }

        // Si l'événement a passé tous les filtres, le conserver
        return true;
    });
}

// Exporter les actions
export const {
    setView,
    setDateRange,
    updateFilters,
    resetFilters,
    updateSettings,
    selectEvent,
    applyFilters,
    addEvent,
    updateEvent,
    removeEvent
} = calendarSlice.actions;

// Exporter les sélecteurs
export const selectCalendarEvents = (state: RootState) => state.calendar.events;
export const selectFilteredEvents = (state: RootState) => state.calendar.filteredEvents;
export const selectCalendarLoading = (state: RootState) => state.calendar.loading;
export const selectCalendarError = (state: RootState) => state.calendar.error;
export const selectSelectedEventId = (state: RootState) => state.calendar.selectedEventId;
export const selectCalendarView = (state: RootState) => state.calendar.view;
export const selectCurrentRange = (state: RootState) => ({
    start: new Date(state.calendar.currentRange.start),
    end: new Date(state.calendar.currentRange.end)
});
export const selectCalendarFilters = (state: RootState) => state.calendar.filters;
export const selectCalendarSettings = (state: RootState) => state.calendar.settings;
export const selectLastUpdated = (state: RootState) => state.calendar.lastUpdated;

// Sélecteur pour trouver un événement par ID
export const selectEventById = (state: RootState, id: string) =>
    state.calendar.events.find(event => event.id === id);

// Exporter le reducer
export default calendarSlice.reducer; 