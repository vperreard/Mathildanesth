import { themes, getThemeColors, applyTheme } from '../themes';

describe('Themes Configuration', () => {
    describe('themes object', () => {
        it('should contain light and dark themes', () => {
            expect(themes).toHaveProperty('light');
            expect(themes).toHaveProperty('dark');
        });

        it('should have valid structure for light theme', () => {
            expect(themes.light).toHaveProperty('colors');
            expect(themes.light.colors).toHaveProperty('primary');
            expect(themes.light.colors).toHaveProperty('background');
        });

        it('should have valid structure for dark theme', () => {
            expect(themes.dark).toHaveProperty('colors');
            expect(themes.dark.colors).toHaveProperty('primary');
            expect(themes.dark.colors).toHaveProperty('background');
        });
    });

    describe('getThemeColors', () => {
        it('should return light theme colors by default', () => {
            const colors = getThemeColors();
            expect(colors).toEqual(themes.light.colors);
        });

        it('should return light theme colors when specified', () => {
            const colors = getThemeColors('light');
            expect(colors).toEqual(themes.light.colors);
        });

        it('should return dark theme colors when specified', () => {
            const colors = getThemeColors('dark');
            expect(colors).toEqual(themes.dark.colors);
        });

        it('should fallback to light theme for invalid theme name', () => {
            const colors = getThemeColors('invalid' as any);
            expect(colors).toEqual(themes.light.colors);
        });
    });

    describe('applyTheme', () => {
        let documentElement: any;

        beforeEach(() => {
            documentElement = {
                style: {
                    setProperty: jest.fn()
                }
            };
            Object.defineProperty(document, 'documentElement', {
                value: documentElement,
                configurable: true
            });
        });

        it('should apply light theme CSS variables', () => {
            applyTheme('light');
            expect(documentElement.style.setProperty).toHaveBeenCalled();
        });

        it('should apply dark theme CSS variables', () => {
            applyTheme('dark');
            expect(documentElement.style.setProperty).toHaveBeenCalled();
        });
    });
});