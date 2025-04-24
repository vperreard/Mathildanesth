'use client';

import { useState } from 'react';
// Importer axios n'est plus nécessaire si le contexte gère l'appel API
// import axios from 'axios';
// Importer useRouter n'est plus nécessaire si le contexte gère la redirection
// import { useRouter } from 'next/navigation'; 
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext'; // Importer le hook useAuth

export default function LoginPage() {
    const [loginInput, setLoginInput] = useState(''); // Renommer pour clarté
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    // const router = useRouter(); // Plus nécessaire ici
    const { login } = useAuth(); // Utiliser la fonction login du contexte

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!loginInput || !password) {
            setError('Le login et le mot de passe sont requis.');
            setIsLoading(false);
            return;
        }

        try {
            // Appeler la fonction login du contexte
            await login({ login: loginInput, password });
            // La redirection est gérée par le contexte après succès
            // router.push('/'); 

        } catch (err: any) {
            console.error("Erreur de connexion depuis la page:", err);
            // L'erreur est déjà formatée par le contexte
            setError(err.message || 'Échec de la connexion.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4">
            <motion.div
                className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-gray-100"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center space-x-2 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">M</span>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Connexion</h1>
                    </div>
                    <p className="text-gray-600">Connectez-vous à votre compte Mathildanesth</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <p className="text-center text-red-500 text-sm font-medium bg-red-50 p-3 rounded-md">{error}</p>}

                    <div>
                        <label htmlFor="login" className="block text-sm font-medium text-gray-700">Login</label>
                        <input
                            type="text"
                            id="login"
                            name="login"
                            value={loginInput}
                            onChange={(e) => setLoginInput(e.target.value.toLowerCase())}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="ex: vperreard"
                            autoComplete="username"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
} 