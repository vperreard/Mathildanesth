import { Theme } from './types';

// Définition des thèmes de l'application
export const defaultTheme: Theme = {
    id: 'default',
    name: 'Par défaut',
    colors: {
        primary: '#3B82F6',
        secondary: '#6B7280',
        background: '#FFFFFF',
        text: '#1F2937',
        border: '#E5E7EB',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6'
    },
    fonts: {
        heading: 'Inter, sans-serif',
        body: 'Inter, sans-serif'
    },
    spacing: {
        small: '0.5rem',
        medium: '1rem',
        large: '1.5rem'
    },
    borderRadius: {
        small: '0.25rem',
        medium: '0.5rem',
        large: '1rem'
    },
    shadows: {
        small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        large: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }
};

export const darkTheme: Theme = {
    id: 'dark',
    name: 'Sombre',
    colors: {
        primary: '#60A5FA',
        secondary: '#9CA3AF',
        background: '#1F2937',
        text: '#F9FAFB',
        border: '#374151',
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
        info: '#60A5FA'
    },
    fonts: {
        heading: 'Inter, sans-serif',
        body: 'Inter, sans-serif'
    },
    spacing: {
        small: '0.5rem',
        medium: '1rem',
        large: '1.5rem'
    },
    borderRadius: {
        small: '0.25rem',
        medium: '0.5rem',
        large: '1rem'
    },
    shadows: {
        small: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        medium: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        large: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
    }
};

export const lightTheme: Theme = {
    id: 'light',
    name: 'Clair',
    colors: {
        primary: '#2563EB',
        secondary: '#4B5563',
        background: '#F9FAFB',
        text: '#111827',
        border: '#D1D5DB',
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
        info: '#2563EB'
    },
    fonts: {
        heading: 'Inter, sans-serif',
        body: 'Inter, sans-serif'
    },
    spacing: {
        small: '0.5rem',
        medium: '1rem',
        large: '1.5rem'
    },
    borderRadius: {
        small: '0.25rem',
        medium: '0.5rem',
        large: '1rem'
    },
    shadows: {
        small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        large: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }
};

export const modernTheme: Theme = {
    id: 'modern',
    name: 'Moderne',
    colors: {
        primary: '#7C3AED',
        secondary: '#6B7280',
        background: '#F3F4F6',
        text: '#1F2937',
        border: '#E5E7EB',
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
        info: '#2563EB'
    },
    fonts: {
        heading: 'Poppins, sans-serif',
        body: 'Inter, sans-serif'
    },
    spacing: {
        small: '0.5rem',
        medium: '1rem',
        large: '1.5rem'
    },
    borderRadius: {
        small: '0.5rem',
        medium: '1rem',
        large: '1.5rem'
    },
    shadows: {
        small: '0 2px 4px rgba(0, 0, 0, 0.05)',
        medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
        large: '0 10px 15px rgba(0, 0, 0, 0.1)'
    }
};

export const minimalTheme: Theme = {
    id: 'minimal',
    name: 'Minimal',
    colors: {
        primary: '#000000',
        secondary: '#4B5563',
        background: '#FFFFFF',
        text: '#000000',
        border: '#E5E7EB',
        success: '#000000',
        warning: '#000000',
        error: '#000000',
        info: '#000000'
    },
    fonts: {
        heading: 'Helvetica, sans-serif',
        body: 'Helvetica, sans-serif'
    },
    spacing: {
        small: '0.25rem',
        medium: '0.5rem',
        large: '1rem'
    },
    borderRadius: {
        small: '0',
        medium: '0',
        large: '0'
    },
    shadows: {
        small: 'none',
        medium: 'none',
        large: 'none'
    }
};

export const themes: Theme[] = [
    defaultTheme,
    darkTheme,
    lightTheme,
    modernTheme,
    minimalTheme
]; 