import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';
import { themes, defaultTheme, darkTheme } from '@/config/themes';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('useTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should use default theme when no saved theme exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useTheme());

      expect(result.current.currentTheme).toEqual(defaultTheme);
      expect(result.current.themes).toEqual(themes);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('dashboard-theme');
    });

    it('should load saved theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      
      const { result } = renderHook(() => useTheme());

      expect(result.current.currentTheme).toEqual(darkTheme);
    });

    it('should fallback to default theme if saved theme is invalid', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme-id');
      
      const { result } = renderHook(() => useTheme());

      expect(result.current.currentTheme).toEqual(defaultTheme);
    });
  });

  describe('changeTheme', () => {
    it('should change theme and save to localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.changeTheme('dark');
      });

      expect(result.current.currentTheme).toEqual(darkTheme);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('dashboard-theme', 'dark');
    });

    it('should not change theme if theme ID is invalid', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useTheme());
      const initialTheme = result.current.currentTheme;

      act(() => {
        result.current.changeTheme('invalid-theme');
      });

      expect(result.current.currentTheme).toEqual(initialTheme);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle theme switching between multiple themes', () => {
      const { result } = renderHook(() => useTheme());

      // Switch to dark theme
      act(() => {
        result.current.changeTheme('dark');
      });
      expect(result.current.currentTheme.id).toBe('dark');

      // Switch to light theme
      act(() => {
        result.current.changeTheme('light');
      });
      expect(result.current.currentTheme.id).toBe('light');

      // Switch to modern theme
      act(() => {
        result.current.changeTheme('modern');
      });
      expect(result.current.currentTheme.id).toBe('modern');
    });
  });

  describe('getThemeVariable', () => {
    it('should return theme variable value for simple path', () => {
      const { result } = renderHook(() => useTheme());

      const primaryColor = result.current.getThemeVariable('colors.primary');
      expect(primaryColor).toBe(defaultTheme.colors.primary);
    });

    it('should return theme variable value for nested path', () => {
      const { result } = renderHook(() => useTheme());

      const headingFont = result.current.getThemeVariable('fonts.heading');
      expect(headingFont).toBe(defaultTheme.fonts.heading);
    });

    it('should return empty string for invalid path', () => {
      const { result } = renderHook(() => useTheme());

      const invalidValue = result.current.getThemeVariable('invalid.path');
      expect(invalidValue).toBe('');
    });

    it('should return empty string for partially invalid path', () => {
      const { result } = renderHook(() => useTheme());

      const invalidValue = result.current.getThemeVariable('colors.invalid');
      expect(invalidValue).toBe('');
    });

    it('should work with single-level path', () => {
      const { result } = renderHook(() => useTheme());

      const themeId = result.current.getThemeVariable('id');
      expect(themeId).toBe(defaultTheme.id);
    });

    it('should work with different theme variables', () => {
      const { result } = renderHook(() => useTheme());

      // Test spacing
      expect(result.current.getThemeVariable('spacing.medium')).toBe('1rem');
      
      // Test border radius
      expect(result.current.getThemeVariable('borderRadius.small')).toBe('0.25rem');
      
      // Test shadows
      expect(result.current.getThemeVariable('shadows.medium')).toBe(defaultTheme.shadows.medium);
    });

    it('should reflect current theme after theme change', () => {
      const { result } = renderHook(() => useTheme());

      // Initial theme
      const initialPrimary = result.current.getThemeVariable('colors.primary');
      expect(initialPrimary).toBe(defaultTheme.colors.primary);

      // Change to dark theme
      act(() => {
        result.current.changeTheme('dark');
      });

      const darkPrimary = result.current.getThemeVariable('colors.primary');
      expect(darkPrimary).toBe(darkTheme.colors.primary);
      expect(darkPrimary).not.toBe(initialPrimary);
    });
  });

  describe('Theme availability', () => {
    it('should expose all available themes', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current.themes).toHaveLength(5);
      expect(result.current.themes.map(t => t.id)).toEqual([
        'default',
        'dark', 
        'light',
        'modern',
        'minimal'
      ]);
    });

    it('should have consistent theme structure', () => {
      const { result } = renderHook(() => useTheme());

      result.current.themes.forEach(theme => {
        expect(theme).toHaveProperty('id');
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('colors');
        expect(theme).toHaveProperty('fonts');
        expect(theme).toHaveProperty('spacing');
        expect(theme).toHaveProperty('borderRadius');
        expect(theme).toHaveProperty('shadows');
      });
    });
  });

  describe('Persistence', () => {
    it('should persist theme changes across hook re-renders', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      
      const { result, rerender } = renderHook(() => useTheme());

      expect(result.current.currentTheme.id).toBe('dark');

      // Re-render hook
      rerender();
      
      expect(result.current.currentTheme.id).toBe('dark');
    });

    it('should call localStorage on every theme change', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.changeTheme('dark');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.changeTheme('light');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
      expect(localStorageMock.setItem).toHaveBeenLastCalledWith('dashboard-theme', 'light');
    });
  });

  describe('Edge cases', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('LocalStorage error');
      });

      expect(() => {
        renderHook(() => useTheme());
      }).not.toThrow();
    });

    it('should handle setItem errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useTheme());

      expect(() => {
        act(() => {
          result.current.changeTheme('dark');
        });
      }).not.toThrow();
    });

    it('should handle empty string theme ID', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.changeTheme('');
      });

      // Should not change from default theme
      expect(result.current.currentTheme).toEqual(defaultTheme);
    });

    it('should handle getThemeVariable with empty string path', () => {
      const { result } = renderHook(() => useTheme());

      const value = result.current.getThemeVariable('');
      expect(value).toBe(''); // Empty path returns empty string
    });

    it('should handle null theme ID gracefully', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.changeTheme(null as any);
      });

      expect(result.current.currentTheme).toEqual(defaultTheme);
    });

    it('should handle undefined theme ID gracefully', () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.changeTheme(undefined as any);
      });

      expect(result.current.currentTheme).toEqual(defaultTheme);
    });
  });

  describe('CSS Variables Integration', () => {
    it('should provide theme variables in CSS-friendly format', () => {
      const { result } = renderHook(() => useTheme());

      // Check that theme variables can be used for CSS-in-JS
      const primaryColor = result.current.getThemeVariable('colors.primary');
      expect(typeof primaryColor).toBe('string');
      expect(primaryColor).toMatch(/^#[0-9a-fA-F]{6}$|^rgb\(|^hsl\(|^var\(/);
    });

    it('should work with CSS custom property syntax', () => {
      const { result } = renderHook(() => useTheme());

      // Test theme switching with CSS variable extraction
      act(() => {
        result.current.changeTheme('dark');
      });

      const backgroundColor = result.current.getThemeVariable('colors.background');
      expect(backgroundColor).toBeTruthy();
      expect(typeof backgroundColor).toBe('string');
    });
  });

  describe('Theme Switching Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const renderCallback = jest.fn();
      
      renderHook(() => {
        renderCallback();
        return useTheme();
      });

      // Should render once on mount
      expect(renderCallback).toHaveBeenCalledTimes(1);
    });

    it('should maintain referential equality for theme objects when not changed', () => {
      const { result, rerender } = renderHook(() => useTheme());
      
      const firstTheme = result.current.currentTheme;
      const firstThemes = result.current.themes;
      
      rerender();
      
      const secondTheme = result.current.currentTheme;
      const secondThemes = result.current.themes;
      
      expect(firstTheme).toBe(secondTheme);
      expect(firstThemes).toBe(secondThemes);
    });
  });
});