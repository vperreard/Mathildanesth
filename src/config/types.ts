/**
 * Types pour la configuration de l'application
 */

export interface Theme {
    id: string;
    name: string;
    colors: {
        primary: string;
        secondary: string;
        background: string;
        text: string;
        border: string;
        success: string;
        warning: string;
        error: string;
        info: string;
    };
    fonts: {
        heading: string;
        body: string;
    };
    spacing: {
        small: string;
        medium: string;
        large: string;
    };
    borderRadius: {
        small: string;
        medium: string;
        large: string;
    };
    shadows: {
        small: string;
        medium: string;
        large: string;
    };
}

export interface ApiConfig {
    baseUrl: string;
    endpoints: Record<string, any>;
    headers: Record<string, string>;
} 