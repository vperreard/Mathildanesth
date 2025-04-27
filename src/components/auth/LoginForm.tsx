import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface LoginFormProps {
    onLoginSuccess?: () => void;
    idPrefix?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, idPrefix = '' }) => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { login: authLogin, isLoading } = useAuth();

    const emailId = `${idPrefix}email`;
    const passwordId = `${idPrefix}password`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await authLogin({ login, password });
            if (onLoginSuccess) {
                onLoginSuccess();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur de connexion');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulaire de connexion" role="form">
            <div>
                <label htmlFor={emailId} className="block text-sm font-medium text-gray-700">
                    Identifiant
                </label>
                <input
                    type="text"
                    id={emailId}
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    aria-required="true"
                />
            </div>

            <div>
                <label htmlFor={passwordId} className="block text-sm font-medium text-gray-700">
                    Mot de passe
                </label>
                <input
                    type="password"
                    id={passwordId}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    aria-required="true"
                />
            </div>

            {error && (
                <div className="text-red-600 text-sm" role="alert">
                    {error}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                aria-busy={isLoading ? 'true' : 'false'}
            >
                {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
        </form>
    );
}; 