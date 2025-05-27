/**
 * Utilitaires pour la gestion des requêtes (congés, affectations, etc.)
 * Ces fonctions permettent de filtrer les requêtes selon différents critères
 */

// Types de requêtes
export type RequestType = 'congés' | 'affectations' | 'autres';
export type RequestStatus = 'en-attente' | 'approuvée' | 'refusée';

// Interface pour représenter une requête
export interface Request {
    id: string;
    type: RequestType;
    status: RequestStatus;
    userId: string;
    userName: string;
    userAvatar?: string;
    title: string;
    description: string;
    dateSubmitted: string;
    dates?: { start: string; end: string };
}

/**
 * Filtre les requêtes pour le calendrier
 * Les requêtes refusées ne sont jamais incluses dans le calendrier
 * 
 * @param requests Liste de toutes les requêtes
 * @param types Types de requêtes à inclure (si undefined, inclut tous les types)
 * @param userId ID de l'utilisateur pour filtrer les requêtes (si undefined, inclut toutes les requêtes)
 * @returns Liste des requêtes filtrées pour affichage sur le calendrier
 */
export function filterRequestsForCalendar(
    requests: Request[],
    types?: RequestType[],
    userId?: string
): Request[] {
    return requests.filter(request => {
        // Exclure toutes les requêtes refusées
        if (request.status === 'refusée') {
            return false;
        }

        // Filtrer par type si spécifié
        if (types && !types.includes(request.type)) {
            return false;
        }

        // Filtrer par utilisateur si spécifié
        if (userId && request.userId !== userId) {
            return false;
        }

        return true;
    });
}

/**
 * Filtre les requêtes pour l'affichage dans une liste administrative
 * Inclut les requêtes refusées uniquement si explicitement demandé
 * 
 * @param requests Liste de toutes les requêtes
 * @param options Options de filtrage
 * @returns Liste des requêtes filtrées
 */
export function filterRequestsForAdmin(
    requests: Request[],
    options: {
        types?: RequestType[];
        status?: RequestStatus[];
        userId?: string;
        includeRefused?: boolean;
        searchQuery?: string;
    }
): Request[] {
    const { types, status, userId, includeRefused = false, searchQuery } = options;

    return requests.filter(request => {
        // Exclure les requêtes refusées si pas explicitement incluses
        if (request.status === 'refusée' && !includeRefused && (!status || !status.includes('refusée'))) {
            return false;
        }

        // Filtrer par type si spécifié
        if (types && types.length > 0 && !types.includes(request.type)) {
            return false;
        }

        // Filtrer par statut si spécifié
        if (status && status.length > 0 && !status.includes(request.status)) {
            return false;
        }

        // Filtrer par utilisateur si spécifié
        if (userId && request.userId !== userId) {
            return false;
        }

        // Filtrer par texte de recherche si spécifié
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                request.title.toLowerCase().includes(query) ||
                request.description.toLowerCase().includes(query) ||
                request.userName.toLowerCase().includes(query)
            );
        }

        return true;
    });
}

/**
 * Format une requête pour l'affichage sur un calendrier
 * 
 * @param request Requête à formater
 * @returns Objet formaté pour le calendrier
 */
export function formatRequestForCalendar(request: Request) {
    // Ne jamais inclure les requêtes refusées
    if (request.status === 'refusée' || !request.dates) {
        return null;
    }

    // Déterminer la couleur en fonction du statut
    let backgroundColor = '';
    let borderColor = '';
    let textColor = '#fff';

    if (request.status === 'en-attente') {
        backgroundColor = 'rgba(234, 179, 8, 0.2)';
        borderColor = '#f59e0b';
        textColor = '#b45309';
    } else if (request.status === 'approuvée') {
        backgroundColor = 'rgba(5, 150, 105, 0.2)';
        borderColor = '#10b981';
        textColor = '#065f46';
    }

    return {
        id: request.id,
        title: request.title,
        start: request.dates.start,
        end: request.dates.end,
        allDay: true,
        backgroundColor,
        borderColor,
        textColor,
        extendedProps: {
            type: request.type,
            status: request.status,
            userId: request.userId,
            userName: request.userName,
            description: request.description
        }
    };
} 