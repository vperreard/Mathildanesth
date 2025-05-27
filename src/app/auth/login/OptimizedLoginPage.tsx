'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Lazy load heavy dependencies
const useAuth = dynamic(() => import('@/hooks/useAuth').then(mod => ({ default: mod.useAuth })), {
    ssr: false,
    loading: () => null
}) as any;

// Minimal CSS styles inline for faster load
const styles = {
    container: 'flex min-h-screen flex-col items-center justify-center bg-gray-100',
    card: 'w-full max-w-md rounded-lg bg-white p-8 shadow-md',
    title: 'mb-6 text-center text-2xl font-bold text-gray-800',
    error: 'mb-4 rounded-md bg-red-50 p-4',
    errorText: 'text-sm text-red-700',
    label: 'block text-sm font-medium text-gray-700',
    input: 'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm',
    button: 'w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
    spinner: 'animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'
};

const OptimizedLoginPage: React.FC = () => {
    const [loginData, setLoginData] = useState({ login: '', password: '' });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Optimized form submission
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isLoading || !loginData.login.trim() || !loginData.password.trim()) return;
        
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData),
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur de connexion');
            }

            // Redirect on success
            router.replace(data.redirectUrl || '/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
        } finally {
            setIsLoading(false);
        }
    }, [loginData, isLoading, router]);

    // Optimized input handler
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLoginData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    }, [error]);

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Connexion</h1>

                {error && (
                    <div className={styles.error} data-testid="login-error-message">
                        <p className={styles.errorText}>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="mb-4">
                        <label htmlFor="login" className={styles.label}>
                            Identifiant
                        </label>
                        <input
                            type="text"
                            id="login"
                            name="login"
                            data-testid="login-email-input"
                            value={loginData.login}
                            onChange={handleChange}
                            required
                            autoComplete="username"
                            className={styles.input}
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="password" className={styles.label}>
                            Mot de passe
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            data-testid="login-password-input"
                            value={loginData.password}
                            onChange={handleChange}
                            required
                            autoComplete="current-password"
                            className={styles.input}
                        />
                    </div>

                    <button
                        type="submit"
                        data-testid="login-submit-button"
                        disabled={isLoading || !loginData.login.trim() || !loginData.password.trim()}
                        className={styles.button}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <div className={styles.spinner}></div>
                                Connexion...
                            </span>
                        ) : (
                            'Se connecter'
                        )}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-gray-600">
                    <p>Pour toute assistance, veuillez contacter l'administrateur.</p>
                </div>
            </div>
        </div>
    );
};

export default OptimizedLoginPage;