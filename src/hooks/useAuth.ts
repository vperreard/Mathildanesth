import { useState } from 'react';

interface AuthError {
    message: string;
}

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<AuthError | null>(null);

    const login = async (username: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            // TODO: Implémenter la logique d'authentification réelle
            // Pour l'instant, simulation d'une requête
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (username === 'mathilda' && password === 'password') {
                return true;
            }

            throw new Error('Identifiants invalides');
        } catch (err) {
            setError(err instanceof Error ? { message: err.message } : { message: 'Une erreur est survenue' });
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        login,
        isLoading,
        error
    };
}; 