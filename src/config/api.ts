/**
 * Configuration de l'API
 */
export const apiConfig = {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    endpoints: {
        users: {
            active: '/users/active',
            byId: (id: string) => `/users/${id}`,
            update: (id: string) => `/users/${id}`,
            create: '/users',
            delete: (id: string) => `/users/${id}`
        },
        user: {
            preferences: '/user/preferences'
        },
        assignments: {
            list: '/assignments',
            byId: (id: string) => `/assignments/${id}`,
            create: '/assignments',
            update: (id: string) => `/assignments/${id}`,
            delete: (id: string) => `/assignments/${id}`,
            byDateRange: (startDate: string, endDate: string) =>
                `/assignments?startDate=${startDate}&endDate=${endDate}`,
            batch: '/assignments/batch'
        },
        planning: {
            generate: '/planning/generate',
            validate: '/planning/validate',
            approve: '/planning/approve',
            reject: '/planning/reject'
        },
        dashboard: {
            leaveStatistics: '/dashboard/leave-statistics',
            teamAvailability: '/dashboard/team-availability',
            leaveReports: '/dashboard/leave-reports',
            peakPeriods: '/dashboard/peak-periods',
            leaveTrends: '/dashboard/leave-trends'
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
    USERS: `${apiConfig.baseUrl}/users`,
    USER: (id: string) => `${apiConfig.baseUrl}/users/${id}`,

    // Congés
    LEAVES: `${apiConfig.baseUrl}/leaves`,
    LEAVE: (id: string) => `${apiConfig.baseUrl}/leaves/${id}`,
    LEAVE_REQUESTS: `${apiConfig.baseUrl}/leave-requests`,
    LEAVE_REQUEST: (id: string) => `${apiConfig.baseUrl}/leave-requests/${id}`,

    // Dashboard et statistiques
    LEAVE_STATISTICS: `${apiConfig.baseUrl}${apiConfig.endpoints.dashboard.leaveStatistics}`,
    TEAM_AVAILABILITY: `${apiConfig.baseUrl}${apiConfig.endpoints.dashboard.teamAvailability}`,
    LEAVE_REPORTS: `${apiConfig.baseUrl}${apiConfig.endpoints.dashboard.leaveReports}`,
    PEAK_PERIODS: `${apiConfig.baseUrl}${apiConfig.endpoints.dashboard.peakPeriods}`,
    LEAVE_TRENDS: `${apiConfig.baseUrl}${apiConfig.endpoints.dashboard.leaveTrends}`,
}; 