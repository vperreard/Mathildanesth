/**
 * Configuration centralisée des endpoints API
 * Évite les URLs hardcodées et facilite la maintenance
 */

// Base URL de l'API - utilise l'environnement ou fallback sur l'URL relative
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Endpoints pour les trames et modèles
export const TRAME_ENDPOINTS = {
  // Routes principales
  TRAME_MODELES: '/api/trame-modeles',
  TRAME_MODELE_BY_ID: (id: string) => `/api/trame-modeles/${id}`,
  
  // Routes des affectations
  AFFECTATIONS: (trameId: string) => `/api/trame-modeles/${trameId}/affectations`,
  AFFECTATIONS_BATCH: (trameId: string) => `/api/trame-modeles/${trameId}/affectations/batch`,
  AFFECTATIONS_INDIVIDUELLES: (trameId: string) => `/api/trame-modeles/${trameId}/affectations-individuelles`,
  AFFECTATION_BY_ID: (trameId: string, affectationId: string) => `/api/trame-modeles/${trameId}/affectations/${affectationId}`,
  
  // Routes d'application
  APPLY_TRAME: (trameId: string) => `/api/trame-modeles/${trameId}/apply`,
  
  // Routes legacy (à migrer progressivement)
  TRAMES_LEGACY: '/api/trames',
  AFFECTATIONS_LEGACY: '/api/affectations',
};

// Endpoints pour les salles et secteurs
export const OPERATING_ENDPOINTS = {
  ROOMS: '/api/operating-rooms',
  SECTORS: '/api/operating-sectors',
  SITES: '/api/sites',
};

// Endpoints pour les utilisateurs et chirurgiens
export const USER_ENDPOINTS = {
  USERS: '/api/users',
  SURGEONS: '/api/surgeons',
  ACTIVITY_TYPES: '/api/admin/activity-types',
};

// Endpoints d'authentification
export const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  SESSION: '/api/auth/session',
};

// Helper pour construire une URL complète
export const buildApiUrl = (endpoint: string): string => {
  // Si l'endpoint commence déjà par http, le retourner tel quel
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // Sinon, combiner avec la base URL
  const baseUrl = API_BASE_URL || '';
  
  // S'assurer qu'il n'y a pas de double slash
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${cleanBase}${cleanEndpoint}`;
};

// Helper pour les headers standards
export const getApiHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};