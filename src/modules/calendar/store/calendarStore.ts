import { create } from 'zustand';
import { logger } from "../../../lib/logger";
import { persist } from 'zustand/middleware';
import {
    AnyCalendarEvent,
    CalendarFilters,
    CalendarSettings,
    CalendarViewType
} from '../types/event';
import { calendarService } from '../services/calendrierService';
import { startOfMonth, endOfMonth, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfDay, endOfDay, addDays, subDays } from 'date-fns';
import {
    DEFAULT_FILTERS,
    DEFAULT_SETTINGS,
    CACHE_TTL,
    createCacheKey
} from './calendrierStoreConfig';

export interface CalendarState {
    // Événements et données
    events: AnyCalendarEvent[];
    loading: boolean;
    error: Error | null;

    // Filtres
    filters: CalendarFilters;

    // Navigation et vue
    view: CalendarViewType;
    currentRange: { start: Date; end: Date };

    // Paramètres
    settings: CalendarSettings;
    userSettings?: any;

    // Cache
    lastFetched: Record<string, number>;

    // Actions
    setEvents: (events: AnyCalendarEvent[]) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: Error | null) => void;
    updateFilters: (filters: Partial<CalendarFilters>) => void;
    setView: (view: CalendarViewType) => void;
    setDateRange: (range: { start: Date; end: Date }) => void;
    updateSettings: (settings: Partial<CalendarSettings>) => void;
    fetchEvents: () => Promise<void>;
    invalidateCache: () => void;
    navigateToPrevious: () => void;
    navigateToNext: () => void;
    navigateToToday: () => void;
}

export const useCalendarStore = create<CalendarState>()(
    persist(
        (set, get) => ({
            // État initial
            events: [],
            loading: false,
            error: null,
            filters: DEFAULT_FILTERS,
            view: CalendarViewType.MONTH,
            currentRange: {
                start: startOfMonth(new Date()),
                end: endOfMonth(new Date())
            },
            settings: DEFAULT_SETTINGS,
            lastFetched: {},

            // Actions
            setEvents: (events) => set({ events }),
            setLoading: (loading) => set({ loading }),
            setError: (error) => set({ error }),

            updateFilters: (partialFilters) => {
                set((state) => ({
                    filters: {
                        ...state.filters,
                        ...partialFilters
                    }
                }));
                // Récupérer les événements automatiquement après changement de filtres
                get().fetchEvents();
            },

            setView: (view) => {
                const { currentRange } = get();
                const now = new Date();
                let newRange = { start: currentRange.start, end: currentRange.end };

                // Ajuster la plage de dates en fonction de la nouvelle vue
                switch (view) {
                    case CalendarViewType.MONTH:
                        newRange = {
                            start: startOfMonth(currentRange.start),
                            end: endOfMonth(currentRange.start)
                        };
                        break;
                    case CalendarViewType.WEEK:
                        newRange = {
                            start: startOfWeek(currentRange.start, { weekStartsOn: 1 }),
                            end: endOfWeek(currentRange.start, { weekStartsOn: 1 })
                        };
                        break;
                    case CalendarViewType.DAY:
                        newRange = {
                            start: startOfDay(currentRange.start),
                            end: endOfDay(currentRange.start)
                        };
                        break;
                    case CalendarViewType.LIST:
                        // Pour la vue liste, on prend un mois par défaut
                        newRange = {
                            start: startOfMonth(currentRange.start),
                            end: endOfMonth(currentRange.start)
                        };
                        break;
                }

                set({
                    view,
                    currentRange: newRange,
                    filters: {
                        ...get().filters,
                        dateRange: newRange
                    }
                });

                // Charger les données pour la nouvelle vue
                get().fetchEvents();
            },

            setDateRange: (range) => {
                set((state) => ({
                    currentRange: range,
                    filters: {
                        ...state.filters,
                        dateRange: range
                    }
                }));
                // Récupérer les événements automatiquement après changement de dates
                get().fetchEvents();
            },

            updateSettings: (partialSettings) => {
                set((state) => ({
                    settings: {
                        ...state.settings,
                        ...partialSettings
                    }
                }));
            },

            fetchEvents: async () => {
                const state = get();
                const cacheKey = createCacheKey(state.filters);
                const now = Date.now();

                // Vérifier si les données sont en cache et encore valides
                if (
                    state.lastFetched[cacheKey] &&
                    now - state.lastFetched[cacheKey] < CACHE_TTL &&
                    state.events.length > 0
                ) {
                    // Utiliser les données en cache
                    return;
                }

                // Si pas de cache valide, charger depuis l'API
                set({ loading: true, error: null });

                try {
                    const events = await calendarService.getEvents(state.filters);
                    set({
                        events,
                        loading: false,
                        lastFetched: {
                            ...state.lastFetched,
                            [cacheKey]: now
                        }
                    });
                } catch (err) {
                    const error = err instanceof Error ? err : new Error('Erreur inconnue');
                    set({ error, loading: false });
                    logger.error('Erreur lors du chargement des événements:', error);
                }
            },

            invalidateCache: () => {
                set({ lastFetched: {} });
                get().fetchEvents();
            },

            navigateToPrevious: () => {
                const { view, currentRange } = get();
                let newStart, newEnd;

                switch (view) {
                    case CalendarViewType.MONTH:
                        newStart = subMonths(currentRange.start, 1);
                        newEnd = endOfMonth(newStart);
                        break;
                    case CalendarViewType.WEEK:
                        newStart = subWeeks(currentRange.start, 1);
                        newEnd = endOfWeek(newStart, { weekStartsOn: 1 });
                        break;
                    case CalendarViewType.DAY:
                        newStart = subDays(currentRange.start, 1);
                        newEnd = endOfDay(newStart);
                        break;
                    case CalendarViewType.LIST:
                        newStart = subMonths(currentRange.start, 1);
                        newEnd = endOfMonth(newStart);
                        break;
                    default:
                        newStart = currentRange.start;
                        newEnd = currentRange.end;
                }

                get().setDateRange({ start: newStart, end: newEnd });
            },

            navigateToNext: () => {
                const { view, currentRange } = get();
                let newStart, newEnd;

                switch (view) {
                    case CalendarViewType.MONTH:
                        newStart = addMonths(currentRange.start, 1);
                        newEnd = endOfMonth(newStart);
                        break;
                    case CalendarViewType.WEEK:
                        newStart = addWeeks(currentRange.start, 1);
                        newEnd = endOfWeek(newStart, { weekStartsOn: 1 });
                        break;
                    case CalendarViewType.DAY:
                        newStart = addDays(currentRange.start, 1);
                        newEnd = endOfDay(newStart);
                        break;
                    case CalendarViewType.LIST:
                        newStart = addMonths(currentRange.start, 1);
                        newEnd = endOfMonth(newStart);
                        break;
                    default:
                        newStart = currentRange.start;
                        newEnd = currentRange.end;
                }

                get().setDateRange({ start: newStart, end: newEnd });
            },

            navigateToToday: () => {
                const { view } = get();
                const today = new Date();
                let newStart, newEnd;

                switch (view) {
                    case CalendarViewType.MONTH:
                        newStart = startOfMonth(today);
                        newEnd = endOfMonth(today);
                        break;
                    case CalendarViewType.WEEK:
                        newStart = startOfWeek(today, { weekStartsOn: 1 });
                        newEnd = endOfWeek(today, { weekStartsOn: 1 });
                        break;
                    case CalendarViewType.DAY:
                        newStart = startOfDay(today);
                        newEnd = endOfDay(today);
                        break;
                    case CalendarViewType.LIST:
                        newStart = startOfMonth(today);
                        newEnd = endOfMonth(today);
                        break;
                    default:
                        newStart = today;
                        newEnd = today;
                }

                get().setDateRange({ start: newStart, end: newEnd });
            },
        }),
        {
            name: 'calendar-store', // nom du stockage dans localStorage
            partialize: (state) => ({
                // Ne stocker que les paramètres et la vue dans localStorage
                settings: state.settings,
                view: state.view
            })
        }
    )
); 