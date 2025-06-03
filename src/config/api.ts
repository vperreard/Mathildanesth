/**
 * Configuration de l'API
 */
export const apiConfig = {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
    endpoints: {
        users: {
            active: '/utilisateurs/active',
            byId: (id: string) => `/utilisateurs/${id}`,
            update: (id: string) => `/utilisateurs/${id}`,
            create: '/utilisateurs',
            delete: (id: string) => `/utilisateurs/${id}`
        },
        user: {
            preferences: '/api/user/preferences'
        },
        attributions: {
            list: '/affectations',
            byId: (id: string) => `/affectations/${id}`,
            create: '/affectations',
            update: (id: string) => `/affectations/${id}`,
            delete: (id: string) => `/affectations/${id}`,
            byDateRange: (startDate: string, endDate: string) =>
                `/affectations?startDate=${startDate}&endDate=${endDate}`,
            batch: '/affectations/batch'
        },
        planning: {
            generate: '/planning/generate',
            validate: '/planning/validate',
            approve: '/planning/approve',
            reject: '/planning/reject'
        },
        dashboard: {
            leaveStatistics: '/tableau-de-bord/leave-statistics',
            teamAvailability: '/tableau-de-bord/team-availability',
            leaveReports: '/tableau-de-bord/leave-reports',
            peakPeriods: '/tableau-de-bord/peak-periods',
            leaveTrends: '/tableau-de-bord/leave-trends'
        }
    },
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// Points d'entrée API exportés pour l'utilisation dans les services
export const API_ENDPOINTS = {
    // Authentification
    LOGIN: `${apiConfig.baseUrl}/auth/login`,
    LOGOUT: `${apiConfig.baseUrl}/auth/logout`,
    REGISTER: `${apiConfig.baseUrl}/auth/register`,
    ME: `${apiConfig.baseUrl}/auth/me`,

    // Utilisateurs
    USERS: `${apiConfig.baseUrl}/utilisateurs`,
    USER: (id: string) => `${apiConfig.baseUrl}/utilisateurs/${id}`,

    // Congés
    LEAVES: `${apiConfig.baseUrl}/conges`,
    LEAVE: (id: string) => `${apiConfig.baseUrl}/conges/${id}`,
    LEAVE_REQUESTS: `${apiConfig.baseUrl}/leave-requests`,
    LEAVE_REQUEST: (id: string) => `${apiConfig.baseUrl}/leave-requests/${id}`,

    // Dashboard et statistiques
    LEAVE_STATISTICS: `${apiConfig.baseUrl}${apiConfig.endpoints.dashboard.leaveStatistics}`,
    TEAM_AVAILABILITY: `${apiConfig.baseUrl}${apiConfig.endpoints.dashboard.teamAvailability}`,
    LEAVE_REPORTS: `${apiConfig.baseUrl}${apiConfig.endpoints.dashboard.leaveReports}`,
    PEAK_PERIODS: `${apiConfig.baseUrl}${apiConfig.endpoints.dashboard.peakPeriods}`,
    LEAVE_TRENDS: `${apiConfig.baseUrl}${apiConfig.endpoints.dashboard.leaveTrends}`,
}; 