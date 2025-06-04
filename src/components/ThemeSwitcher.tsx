'use client';

import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();

    return (
        <button
            className={`relative flex items-center justify-center p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${theme === 'light'
                ? 'text-gray-600 hover:bg-gray-100'
                : 'text-gray-400 hover:bg-slate-700'
                }`}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={theme === 'light' ? 'Passer au thème sombre' : 'Passer au thème clair'}
            style={{ width: '36px', height: '36px' }}
        >
            {theme === 'light' ? (
                <Moon className="h-5 w-5" style={{ width: '20px', height: '20px' }} />
            ) : (
                <Sun className="h-5 w-5" style={{ width: '20px', height: '20px' }} />
            )}
        </button>
    );
} 