import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface LoginFormProps {
    onLoginSuccess?: () => void;
}

// Extension de l'interface AuthError pour inclure un champ optionnel
interface ExtendedAuthError {
    message: string;
    field?: 'username' | 'password';
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error } = useAuth();
    const usernameErrorId = "username-error";
    const passwordErrorId = "password-error";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const success = await login(username, password);
        if (success && onLoginSuccess) {
            onLoginSuccess();
        }
    };

    // Traiter error comme ExtendedAuthError
    const authError = error as ExtendedAuthError | null;

    return (
        <form onSubmit={handleSubmit} className="space-y-4" aria-label="Formulaire de connexion" role="form">
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Identifiant
                </label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    aria-describedby={authError && authError.field === 'username' ? usernameErrorId : undefined}
                    aria-invalid={authError && authError.field === 'username' ? 'true' : 'false'}
                    aria-required="true"
                />
                {authError && authError.field === 'username' && (
                    <div id={usernameErrorId} className="text-red-600 text-sm mt-1" role="alert">
                        {authError.message}
                    </div>
                )}
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Mot de passe
                </label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    aria-describedby={authError && authError.field === 'password' ? passwordErrorId : undefined}
                    aria-invalid={authError && authError.field === 'password' ? 'true' : 'false'}
                    aria-required="true"
                />
                {authError && authError.field === 'password' && (
                    <div id={passwordErrorId} className="text-red-600 text-sm mt-1" role="alert">
                        {authError.message}
                    </div>
                )}
            </div>

            {authError && !authError.field && (
                <div className="text-red-600 text-sm" role="alert">
                    {authError.message}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                aria-busy={isLoading ? 'true' : 'false'}
                aria-disabled={isLoading ? 'true' : 'false'}
            >
                {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
        </form>
    );
}; 