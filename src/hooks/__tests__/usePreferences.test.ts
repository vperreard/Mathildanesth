import { renderHook, act } from '@testing-library/react';
import { usePreferences } from '../usePreferences';
import { preferencesService, UserPreferences } from '@/services/preferencesService';

jest.mock('@/services/preferencesService', () => ({
  preferencesService: {
    getPreferences: jest.fn(),
    savePreferences: jest.fn(),
    getWidgetDefaults: jest.fn(),
    updateWidgetDefaults: jest.fn(),
  }
}));

const mockPreferencesService = preferencesService as jest.Mocked<typeof preferencesService>;

const mockInitialPreferences: UserPreferences = {
  theme: 'default',
  layout: 'grid',
  widgetDefaults: {
    calendar: {
      size: { width: 2, height: 2 },
      config: {
        view: 'month',
        showWeekends: true
      }
    },
    chart: {
      size: { width: 2, height: 2 },
      config: {
        showLegend: true,
        showTooltip: true
      }
    }
  },
  notifications: {
    enabled: true,
    sound: true,
    email: true
  },
  display: {
    showWeekends: true,
    showHolidays: true,
    timeFormat: '24h',
    dateFormat: 'DD/MM/YYYY'
  }
};

describe('usePreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPreferencesService.getPreferences.mockReturnValue(mockInitialPreferences);
    mockPreferencesService.savePreferences.mockImplementation(() => {});
    mockPreferencesService.getWidgetDefaults.mockImplementation((type: string) => 
      mockInitialPreferences.widgetDefaults[type] || {}
    );
    mockPreferencesService.updateWidgetDefaults.mockImplementation(() => {});
  });

  describe('initialization', () => {
    it('should initialize with preferences from service', () => {
      const { result } = renderHook(() => usePreferences());

      expect(result.current.preferences).toEqual(mockInitialPreferences);
      expect(mockPreferencesService.getPreferences).toHaveBeenCalledTimes(2); // Once in useState, once in useEffect
    });

    it('should handle empty preferences gracefully', () => {
      const emptyPreferences = {} as UserPreferences;
      mockPreferencesService.getPreferences.mockReturnValue(emptyPreferences);

      const { result } = renderHook(() => usePreferences());

      expect(result.current.preferences).toEqual(emptyPreferences);
    });

    it('should handle service errors gracefully', () => {
      mockPreferencesService.getPreferences.mockImplementation(() => {
        throw new Error('Service error');
      });

      expect(() => {
        renderHook(() => usePreferences());
      }).toThrow('Service error');
    });
  });

  describe('updatePreferences', () => {
    it('should update partial preferences', () => {
      const { result } = renderHook(() => usePreferences());

      const newPreferences = {
        theme: 'dark',
        layout: 'free' as const
      };

      act(() => {
        result.current.updatePreferences(newPreferences);
      });

      expect(mockPreferencesService.savePreferences).toHaveBeenCalledWith(newPreferences);
      expect(result.current.preferences).toEqual({
        ...mockInitialPreferences,
        ...newPreferences
      });
    });

    it('should handle nested object updates', () => {
      const { result } = renderHook(() => usePreferences());

      const newNotifications = {
        notifications: {
          enabled: false,
          sound: true,
          email: false
        }
      };

      act(() => {
        result.current.updatePreferences(newNotifications);
      });

      expect(result.current.preferences.notifications).toEqual(newNotifications.notifications);
    });

    it('should handle empty update gracefully', () => {
      const { result } = renderHook(() => usePreferences());
      const originalPreferences = result.current.preferences;

      act(() => {
        result.current.updatePreferences({});
      });

      expect(mockPreferencesService.savePreferences).toHaveBeenCalledWith({});
      expect(result.current.preferences).toEqual(originalPreferences);
    });

    it('should handle service save errors', () => {
      const { result } = renderHook(() => usePreferences());
      mockPreferencesService.savePreferences.mockImplementation(() => {
        throw new Error('Save failed');
      });

      expect(() => {
        act(() => {
          result.current.updatePreferences({ theme: 'dark' });
        });
      }).toThrow('Save failed');
    });
  });

  describe('getWidgetDefaults', () => {
    it('should return widget defaults for existing type', () => {
      const { result } = renderHook(() => usePreferences());

      const calendarDefaults = result.current.getWidgetDefaults('calendar');

      expect(calendarDefaults).toEqual({
        size: { width: 2, height: 2 },
        config: {
          view: 'month',
          showWeekends: true
        }
      });
      expect(mockPreferencesService.getWidgetDefaults).toHaveBeenCalledWith('calendar');
    });

    it('should return empty object for non-existing type', () => {
      mockPreferencesService.getWidgetDefaults.mockReturnValue({});
      const { result } = renderHook(() => usePreferences());

      const nonExistingDefaults = result.current.getWidgetDefaults('nonExisting');

      expect(nonExistingDefaults).toEqual({});
      expect(mockPreferencesService.getWidgetDefaults).toHaveBeenCalledWith('nonExisting');
    });

    it('should handle service errors gracefully', () => {
      mockPreferencesService.getWidgetDefaults.mockImplementation(() => {
        throw new Error('Get defaults failed');
      });
      const { result } = renderHook(() => usePreferences());

      expect(() => {
        result.current.getWidgetDefaults('calendar');
      }).toThrow('Get defaults failed');
    });
  });

  describe('updateWidgetDefaults', () => {
    it('should update widget defaults for existing type', () => {
      const { result } = renderHook(() => usePreferences());

      const newCalendarDefaults = {
        size: { width: 3, height: 3 },
        config: {
          view: 'week',
          showWeekends: false
        }
      };

      act(() => {
        result.current.updateWidgetDefaults('calendar', newCalendarDefaults);
      });

      expect(mockPreferencesService.updateWidgetDefaults).toHaveBeenCalledWith('calendar', newCalendarDefaults);
      expect(result.current.preferences.widgetDefaults.calendar).toEqual({
        ...mockInitialPreferences.widgetDefaults.calendar,
        ...newCalendarDefaults
      });
    });

    it('should create new widget defaults for non-existing type', () => {
      const { result } = renderHook(() => usePreferences());

      const newWidgetDefaults = {
        size: { width: 1, height: 1 },
        config: {
          refreshInterval: 5000,
          autoUpdate: true
        }
      };

      act(() => {
        result.current.updateWidgetDefaults('newWidget', newWidgetDefaults);
      });

      expect(mockPreferencesService.updateWidgetDefaults).toHaveBeenCalledWith('newWidget', newWidgetDefaults);
      expect(result.current.preferences.widgetDefaults.newWidget).toEqual(newWidgetDefaults);
    });

    it('should handle partial updates', () => {
      const { result } = renderHook(() => usePreferences());

      const partialUpdate = { 
        size: { width: 1, height: 1 } 
      };

      act(() => {
        result.current.updateWidgetDefaults('calendar', partialUpdate);
      });

      expect(result.current.preferences.widgetDefaults.calendar).toEqual({
        size: { width: 1, height: 1 },
        config: {
          view: 'month',
          showWeekends: true
        }
      });
    });

    it('should handle service update errors', () => {
      mockPreferencesService.updateWidgetDefaults.mockImplementation(() => {
        throw new Error('Update failed');
      });
      const { result } = renderHook(() => usePreferences());

      expect(() => {
        act(() => {
          result.current.updateWidgetDefaults('calendar', { size: { width: 1, height: 1 } });
        });
      }).toThrow('Update failed');
    });
  });

  describe('state consistency', () => {
    it('should maintain state consistency across multiple updates', () => {
      const { result } = renderHook(() => usePreferences());

      act(() => {
        result.current.updatePreferences({ theme: 'dark' });
      });

      act(() => {
        result.current.updateWidgetDefaults('calendar', { 
          config: { view: 'week', showWeekends: false } 
        });
      });

      act(() => {
        result.current.updatePreferences({ layout: 'free' });
      });

      expect(result.current.preferences).toEqual({
        ...mockInitialPreferences,
        theme: 'dark',
        layout: 'free',
        widgetDefaults: {
          ...mockInitialPreferences.widgetDefaults,
          calendar: {
            ...mockInitialPreferences.widgetDefaults.calendar,
            config: { view: 'week', showWeekends: false }
          }
        }
      });
    });

    it('should not mutate original preferences object', () => {
      const { result } = renderHook(() => usePreferences());
      const originalPreferences = result.current.preferences;

      act(() => {
        result.current.updatePreferences({ theme: 'dark' });
      });

      expect(originalPreferences).not.toBe(result.current.preferences);
      expect(originalPreferences.theme).toBe('default'); // Original unchanged
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined widget type', () => {
      const { result } = renderHook(() => usePreferences());

      expect(() => {
        result.current.getWidgetDefaults(null as any);
      }).not.toThrow();

      expect(() => {
        act(() => {
          result.current.updateWidgetDefaults(undefined as any, {});
        });
      }).not.toThrow();
    });

    it('should handle deeply nested preference updates', () => {
      const { result } = renderHook(() => usePreferences());

      const deepUpdate = {
        display: {
          ...mockInitialPreferences.display,
          timeFormat: '12h' as const,
          showWeekends: false
        }
      };

      act(() => {
        result.current.updatePreferences(deepUpdate);
      });

      expect(result.current.preferences.display).toEqual(deepUpdate.display);
    });
  });
});