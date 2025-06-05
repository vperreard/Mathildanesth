import React, { useState, useEffect } from 'react';
import { logger } from "../../lib/logger";
import { useAuth } from '@/hooks/useAuth';

interface HeaderLoginFormProps {
    idPrefix?: string;
}

export const HeaderLoginForm: React.FC<HeaderLoginFormProps> = ({ idPrefix = '' }) => {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    const { login: authLogin, isLoading } = useAuth();

    // Éviter les problèmes d'hydratation
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const emailId = `${idPrefix}email`;
    const passwordId = `${idPrefix}password`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authLogin({ login, password });
        } catch (err: unknown) {
            logger.error('Erreur de connexion:', err);
        }
    };

    // Afficher un placeholder pendant l'hydratation
    if (!isMounted) {
        return (
            <div className="h-8 w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" aria-label="Chargement du profil" role="status"></div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex">
            <div className="flex flex-col mr-2 space-y-1">
                <div className="relative">
                    <label htmlFor={emailId} className="sr-only">Identifiant</label>
                    <input
                        type="text"
                        id={emailId}
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        required
                        placeholder="Identifiant"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 h-6"
                    />
                </div>

                <div className="relative">
                    <label htmlFor={passwordId} className="sr-only">Mot de passe</label>
                    <input
                        type="password"
                        id={passwordId}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Mot de passe"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 h-6"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="px-2 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 self-center h-10 text-[10px]"
            >
                {isLoading ? '...' : 'Connexion'}
            </button>
        </form>
    );
}; 