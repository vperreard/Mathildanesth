'use client';

import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import Button from '@/components/ui/button';

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();

    return (
        <Button
            variant={theme === 'light' ? "ghost" : "ghost"}
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={theme === 'light' ? 'Passer au thème sombre' : 'Passer au thème clair'}
            className={`rounded-full transition-colors duration-200 ${theme === 'light'
                    ? 'text-primary-600 hover:text-secondary-600 hover:bg-primary-50'
                    : 'text-gray-400 hover:text-gray-100 dark:hover:bg-slate-700'
                }`}
        >
            {theme === 'light' ? (
                <Moon className="h-6 w-6 text-secondary-600 hover:text-tertiary-500" />
            ) : (
                <Sun className="h-6 w-6" />
            )}
        </Button>
    );
} 