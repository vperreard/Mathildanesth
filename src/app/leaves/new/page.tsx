'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function NewLeavePage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
                router.push('/login');
            } else {
                // Rediriger vers la page principale des congés avec un paramètre pour ouvrir le formulaire
                router.push('/leaves?newRequest=true');
            }
        }
    }, [user, isLoading, router]);

    return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    );
} 