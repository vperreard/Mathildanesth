'use client';

import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import Button from '@/components/ui/button';

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();

    return (
        <Button
            variant={theme === 'light' ? "ghost" : "ghost"}
            className={`h-10 w-10 rounded-full transition-colors duration-200 ${theme === 'light'
                ? 'text-primary-600 hover:text-secondary-600 hover:bg-primary-50'
                : 'text-gray-400 hover:text-gray-100 dark:hover:bg-slate-700'
                }`}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={theme === 'light' ? 'Passer au thème sombre' : 'Passer au thème clair'}
        >
            {theme === 'light' ? (
                <Moon className="h-7 w-7 text-secondary-600 hover:text-tertiary-500" />
            ) : (
                <Sun className="h-7 w-7" />
            )}
        </Button>
    );
} 