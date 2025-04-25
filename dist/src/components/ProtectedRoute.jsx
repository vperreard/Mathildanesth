'use client';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
var ProtectedRoute = function (_a) {
    var children = _a.children, allowedRoles = _a.allowedRoles;
    var _b = useAuth(), user = _b.user, isLoading = _b.isLoading;
    var router = useRouter();
    console.log("ProtectedRoute - Check:", { isLoading: isLoading, user: !!user, userId: user === null || user === void 0 ? void 0 : user.id, userRole: user === null || user === void 0 ? void 0 : user.role, path: typeof window !== 'undefined' ? window.location.pathname : 'SSR', allowedRoles: allowedRoles });
    useEffect(function () {
        // Uniquement agir quand le chargement initial est terminé
        if (!isLoading) {
            if (!user) {
                console.log('ProtectedRoute Effect: User NULL et !isLoading -> Redirection vers /auth/login');
                router.replace('/auth/login'); // CORRIGÉ: Rediriger vers la bonne page
            }
            // Si l'utilisateur est chargé et que des rôles spécifiques sont requis
            else if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
                console.log("ProtectedRoute Effect: R\u00F4le non autoris\u00E9 (".concat(user.role, ") -> Redirection vers /"));
                router.replace('/'); // Rediriger vers une page d'accueil ou "non autorisé"
            }
        }
    }, [user, isLoading, router, allowedRoles]);
    // Si le chargement initial est en cours, afficher un loader
    if (isLoading) {
        console.log("ProtectedRoute - Rendering: LOADING (isLoading)");
        return <div className="flex justify-center items-center min-h-screen">Chargement de l'authentification...</div>;
    }
    // Si le chargement est terminé mais que l'utilisateur n'est pas encore défini (état transitoire)
    // ou si l'utilisateur n'a pas le bon rôle (avant que l'effet ne redirige)
    if (!user || (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
        console.log("ProtectedRoute - Rendering: LOADING (user null ou rôle invalide post-isLoading)");
        // Afficher un loader ou null pour éviter d'afficher le contenu protégé prématurément
        // Cela empêche un flash de contenu avant la redirection par useEffect.
        return <div className="flex justify-center items-center min-h-screen">Vérification de l'accès...</div>;
    }
    // Si l'utilisateur est authentifié et a le bon rôle
    console.log("ProtectedRoute - Rendering: AUTHORIZED - Affichage children");
    return <>{children}</>; // Afficher le contenu protégé
};
export default ProtectedRoute;
