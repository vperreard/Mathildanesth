'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const SimpleLoginPage: React.FC = () => {
    const [loginData, setLoginData] = useState({ login: '', password: '' });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { login: authLogin } = useAuth();

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[SimpleLoginPage] Form submitted', { login: loginData.login });
        
        if (isLoading || !loginData.login.trim() || !loginData.password.trim()) {
            console.log('[SimpleLoginPage] Validation failed', { isLoading, loginEmpty: !loginData.login.trim(), passwordEmpty: !loginData.password.trim() });
            return;
        }
        
        setError(null);
        setIsLoading(true);

        try {
            // Utiliser le même hook que le header pour partager l'état
            await authLogin(loginData);
            console.log('[SimpleLoginPage] Login successful via auth hook');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    }, [loginData, isLoading, router]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLoginData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">Connexion</h1>

                {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-4" data-testid="login-error-message" data-cy="error-message">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="mb-4">
                        <label htmlFor="login" className="block text-sm font-medium text-gray-700">
                            Identifiant
                        </label>
                        <input
                            type="text"
                            id="login"
                            name="login"
                            data-testid="login-email-input"
                            data-cy="email-input"
                            value={loginData.login}
                            onChange={handleChange}
                            disabled={isLoading}
                            required
                            autoComplete="username"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            data-testid="login-password-input"
                            data-cy="password-input"
                            value={loginData.password}
                            onChange={handleChange}
                            disabled={isLoading}
                            required
                            autoComplete="current-password"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm disabled:opacity-50"
                        />
                    </div>

                    <button
                        type="submit"
                        data-testid="login-submit-button"
                        data-cy="submit-button"
                        disabled={isLoading || !loginData.login.trim() || !loginData.password.trim()}
                        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Connexion...
                            </span>
                        ) : (
                            'Se connecter'
                        )}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-gray-600">
                    <a href="/auth/reset-password" data-cy="forgot-password-link" className="text-blue-600 hover:underline">
                        Mot de passe oublié ?
                    </a>
                    <p className="mt-2">Pour toute assistance, veuillez contacter l'administrateur.</p>
                </div>
            </div>
        </div>
    );
};

export default SimpleLoginPage;