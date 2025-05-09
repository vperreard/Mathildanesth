'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeContextType {
    theme: string;
    setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<string>('light'); // Default theme

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            setThemeState(storedTheme);
            document.documentElement.classList.toggle('dark', storedTheme === 'dark');
        } else {
            // Optional: Set theme based on system preference if no theme is stored
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const initialTheme = prefersDark ? 'dark' : 'light';
            setThemeState(initialTheme);
            localStorage.setItem('theme', initialTheme);
            document.documentElement.classList.toggle('dark', initialTheme === 'dark');
        }
    }, []);

    const setTheme = (newTheme: string) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
} 