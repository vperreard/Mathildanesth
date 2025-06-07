'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Inline styles for consistency with login page
const styles = {
    container: 'flex min-h-screen flex-col items-center justify-center bg-gray-100',
    card: 'w-full max-w-md rounded-lg bg-white p-8 shadow-md',
    title: 'mb-6 text-center text-2xl font-bold text-gray-800',
    success: 'mb-4 rounded-md bg-green-50 p-4',
    successText: 'text-sm text-green-700',
    label: 'block text-sm font-medium text-gray-700',
    input: 'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm',
    button: 'w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
    spinner: 'animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2',
    backLink: 'text-blue-600 hover:underline text-sm'
};

const ResetPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const router = useRouter();

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isLoading || !email.trim()) return;
        
        setIsLoading(true);

        // Simulate API call delay
        setTimeout(() => {
            setIsLoading(false);
            setIsSubmitted(true);
        }, 1000);
    }, [email, isLoading]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    }, []);

    if (isSubmitted) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <h1 className={styles.title}>Instructions envoyées</h1>
                    
                    <div className={styles.success} data-cy="notification-success">
                        <p className={styles.successText}>
                            Instructions envoyées à votre adresse email. Vérifiez votre boîte de réception.
                        </p>
                    </div>

                    <div className="text-center">
                        <button
                            onClick={() => router.push('/auth/connexion')}
                            className={styles.backLink}
                        >
                            ← Retour à la connexion
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Réinitialiser le mot de passe</h1>
                
                <p className="mb-6 text-sm text-gray-600 text-center">
                    Saisissez votre adresse email pour recevoir les instructions de réinitialisation.
                </p>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="mb-6">
                        <label htmlFor="email" className={styles.label}>
                            Adresse email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            data-cy="email-input"
                            value={email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                            className={styles.input}
                            placeholder="votre.email@exemple.com"
                        />
                    </div>

                    <button
                        type="submit"
                        data-cy="submit-button"
                        disabled={isLoading || !email.trim()}
                        className={styles.button}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <div className={styles.spinner}></div>
                                Envoi en cours...
                            </span>
                        ) : (
                            'Envoyer les instructions'
                        )}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => router.push('/auth/connexion')}
                        className={styles.backLink}
                    >
                        ← Retour à la connexion
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;