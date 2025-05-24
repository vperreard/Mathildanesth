'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useAuthPerformanceMetrics, measureExecutionTime } from '@/hooks/usePerformanceMetrics';
import Link from 'next/link';

const LoginPage: React.FC = () => {
    const [loginData, setLoginData] = useState({
        login: '',
        password: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { login, isAuthenticated, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const { recordAuthStep } = useAuthPerformanceMetrics();

    // Redirection automatique si déjà connecté
    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            recordAuthStep('redirect');
            router.replace('/');
        }
    }, [isAuthenticated, authLoading, router, recordAuthStep]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLoginData(prev => ({
            ...prev,
            [name]: value,
        }));
        // Effacer l'erreur dès que l'utilisateur tape
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isLoading) return; // Éviter les soumissions multiples

        recordAuthStep('login_start');
        setError(null);
        setIsLoading(true);

        try {
            // Mesurer le temps d'exécution de la connexion
            const { executionTime } = await measureExecutionTime(
                async () => {
                    recordAuthStep('api_call');
                    return await login(loginData);
                },
                'Login Process'
            );

            // Log de performance si > 1000ms
            if (executionTime > 1000) {
                console.warn(`⚠️ Login took ${executionTime.toFixed(2)}ms - performance issue detected`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    };

    // Mémoiser le contenu pour éviter les re-rendus inutiles
    const errorDisplay = useMemo(() => {
        if (!error) return null;

        return (
            <div className="mb-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }, [error]);

    const isFormValid = useMemo(() => {
        return loginData.login.trim() && loginData.password.trim();
    }, [loginData.login, loginData.password]);

    // Afficher un loader pendant la vérification auth initiale
    if (authLoading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
                <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Vérification en cours...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">Connexion</h1>

                {errorDisplay}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="mb-4">
                        <label htmlFor="login" className="block text-sm font-medium text-gray-700">
                            Identifiant
                        </label>
                        <input
                            type="text"
                            id="login"
                            name="login"
                            value={loginData.login}
                            onChange={handleChange}
                            required
                            autoComplete="username"
                            spellCheck={false}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
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
                            value={loginData.password}
                            onChange={handleChange}
                            required
                            autoComplete="current-password"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !isFormValid}
                        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Connexion en cours...
                            </span>
                        ) : (
                            'Se connecter'
                        )}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-gray-600">
                    <p>
                        Pour toute assistance, veuillez contacter l'administrateur système.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage; 