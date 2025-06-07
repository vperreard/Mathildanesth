/**
 * Route translations mapping
 * Maps English routes to French equivalents
 */

export interface RouteTranslation {
  old: string;
  new: string;
  label?: {
    en: string;
    fr: string;
  };
}

export const ROUTE_TRANSLATIONS: RouteTranslation[] = [
  // Authentication routes
  {
    old: '/login',
    new: '/connexion',
    label: { en: 'Login', fr: 'Connexion' }
  },
  {
    old: '/auth/reset-password',
    new: '/auth/reinitialiser-mot-de-passe',
    label: { en: 'Reset Password', fr: 'Réinitialiser le mot de passe' }
  },

  // Dashboard
  {
    old: '/dashboard',
    new: '/tableau-bord',
    label: { en: 'Dashboard', fr: 'Tableau de bord' }
  },

  // Admin routes
  {
    old: '/admin/command-center',
    new: '/admin/centre-commande',
    label: { en: 'Command Center', fr: 'Centre de Commande' }
  },
  {
    old: '/admin/emergency-replacement',
    new: '/admin/remplacement-urgence',
    label: { en: 'Emergency Replacement', fr: 'Remplacement d\'Urgence' }
  },
  {
    old: '/admin/performance',
    new: '/admin/performances',
    label: { en: 'Performance', fr: 'Performances' }
  },
  {
    old: '/admin/planning-generator',
    new: '/admin/generateur-planning',
    label: { en: 'Planning Generator', fr: 'Générateur de Planning' }
  },
  {
    old: '/admin/planning-rules',
    new: '/admin/regles-planning',
    label: { en: 'Planning Rules', fr: 'Règles de Planning' }
  },
  {
    old: '/admin/schedule-rules',
    new: '/admin/regles-horaires',
    label: { en: 'Schedule Rules', fr: 'Règles Horaires' }
  },
  {
    old: '/admin/skills',
    new: '/admin/competences',
    label: { en: 'Skills', fr: 'Compétences' }
  },
  {
    old: '/admin/team-configurations',
    new: '/admin/configurations-equipes',
    label: { en: 'Team Configurations', fr: 'Configurations d\'Équipes' }
  },
  {
    old: '/admin/site-assignments',
    new: '/admin/affectations-sites',
    label: { en: 'Site Assignments', fr: 'Affectations de Sites' }
  },
  {
    old: '/admin/rules',
    new: '/admin/regles',
    label: { en: 'Rules', fr: 'Règles' }
  },

  // Simulation sub-routes
  {
    old: '/admin/simulations/new',
    new: '/admin/simulations/nouvelle',
    label: { en: 'New Simulation', fr: 'Nouvelle Simulation' }
  },
  {
    old: '/admin/simulations/history',
    new: '/admin/simulations/historique',
    label: { en: 'Simulation History', fr: 'Historique des Simulations' }
  },

  // Other routes
  {
    old: '/quota-management',
    new: '/gestion-quotas',
    label: { en: 'Quota Management', fr: 'Gestion des Quotas' }
  },

  // Test/Development routes (lower priority)
  {
    old: '/test-auth',
    new: '/test-authentification',
    label: { en: 'Test Auth', fr: 'Test Authentification' }
  },
  {
    old: '/design-system',
    new: '/systeme-design',
    label: { en: 'Design System', fr: 'Système de Design' }
  },
  {
    old: '/drag-and-drop-demo',
    new: '/demo-glisser-deposer',
    label: { en: 'Drag and Drop Demo', fr: 'Démo Glisser-Déposer' }
  }
];

// Helper function to get French route
export function getFrenchRoute(englishRoute: string): string {
  const translation = ROUTE_TRANSLATIONS.find(t => t.old === englishRoute);
  return translation ? translation.new : englishRoute;
}

// Helper function to get route label
export function getRouteLabel(route: string, locale: 'en' | 'fr' = 'fr'): string {
  const translation = ROUTE_TRANSLATIONS.find(
    t => t.old === route || t.new === route
  );
  if (translation && translation.label) {
    return translation.label[locale];
  }
  // Fallback: return the last segment of the route, capitalized
  const segments = route.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || '';
  return lastSegment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Navigation label translations
export const NAVIGATION_LABELS = {
  // Admin groups
  'Command Center': 'Centre de Commande',
  'Analytics': 'Analyses',
  'Emergency Mode': 'Mode Urgence',
  'Planning Assistant': 'Assistant Planning',
  
  // Quick links
  'Week Planning': 'Planning Hebdomadaire',
  'New Request': 'Nouvelle Demande',
  'Urgent Validation': 'Validation Urgente',
  'Generate Planning': 'Générer Planning',
  'My Shifts': 'Mes Gardes',
  'Shift Exchanges': 'Échanges Gardes',
  'My Assignments': 'Mes Vacations',
  'Training': 'Formations',
  
  // Common labels
  'Dashboard': 'Tableau de bord',
  'Profile': 'Profil',
  'Settings': 'Paramètres',
  'Logout': 'Déconnexion',
  'Login': 'Connexion',
  'Home': 'Accueil',
  'Back': 'Retour',
  'Menu': 'Menu',
  'Close': 'Fermer',
  'Search': 'Rechercher',
  'Notifications': 'Notifications',
  'Help': 'Aide',
  'Documentation': 'Documentation',
  'Support': 'Support'
};

// Helper function to translate label
export function translateLabel(label: string): string {
  return NAVIGATION_LABELS[label as keyof typeof NAVIGATION_LABELS] || label;
}