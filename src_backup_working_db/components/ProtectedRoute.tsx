'use client';

import { useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Role } from '@/types/user'; // Importer le type Role

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: Role[]; // Rôles optionnels autorisés pour cette route
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Si le chargement est terminé et qu'il n'y a pas d'utilisateur
        if (!isLoading && !user) {
            console.log('ProtectedRoute: Non authentifié, redirection vers /login');
            router.replace('/login'); // Rediriger vers la page de connexion
        }

        // Si l'utilisateur est chargé et que des rôles spécifiques sont requis
        if (!isLoading && user && allowedRoles && allowedRoles.length > 0) {
            // Vérifier si le rôle de l'utilisateur est dans les rôles autorisés
            if (!allowedRoles.includes(user.role)) {
                console.log(`ProtectedRoute: Rôle non autorisé (${user.role}), redirection vers /`);
                // Rediriger vers une page d'accueil ou une page "non autorisé"
                router.replace('/');
            }
        }
    }, [user, isLoading, router, allowedRoles]);

    // Afficher un état de chargement pendant la vérification
    if (isLoading || !user) {
        // Ou un spinner/skeleton screen plus élaboré
        return <div className="flex justify-center items-center min-h-screen">Chargement...</div>;
    }

    // Si l'utilisateur est authentifié et (pas de rôle requis OU rôle autorisé)
    if (user && (!allowedRoles || allowedRoles.includes(user.role))) {
        return <>{children}</>; // Afficher le contenu protégé
    }

    // Normalement, la redirection dans useEffect devrait gérer les cas non autorisés,
    // mais on retourne null comme fallback pour éviter d'afficher children par erreur.
    return null;
};

export default ProtectedRoute; 