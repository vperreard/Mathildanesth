import { 
  Calendar, 
  Clock, 
  Users, 
  MessageCircle, 
  User, 
  HelpCircle,
  BarChart3,
  UserCheck,
  FileText,
  Settings,
  Stethoscope,
  Building2,
  ClipboardList,
  Activity,
  AlertTriangle,
  Home,
  ChevronRight
} from 'lucide-react';

// Configuration de navigation médicale simplifiée
export interface NavigationItem {
  href: string;
  label: string;
  icon?: any;
  description?: string;
  roles?: string[];
  badge?: string;
}

export interface NavigationGroup {
  name: string;
  icon?: any;
  items: NavigationItem[];
  roles?: string[];
}

// NAVIGATION UTILISATEUR SIMPLIFIÉE - 6 PAGES MAXIMUM
export const userNavigation: NavigationItem[] = [
  {
    href: '/',
    label: '🏠 Accueil',
    icon: Activity,
    description: 'Tableau de bord personnel'
  },
  {
    href: '/planning',
    label: '📅 Mon Planning',
    icon: Calendar,
    description: 'Mes gardes, vacations et équipe'
  },
  {
    href: '/conges',
    label: '🌴 Mes Congés',
    icon: Clock,
    description: 'Demandes, soldes et historique'
  },
  {
    href: '/demandes',
    label: '📋 Mes Demandes',
    icon: FileText,
    description: 'Toutes vos demandes unifiées'
  },
  {
    href: '/notifications',
    label: '🔔 Notifications',
    icon: MessageCircle,
    description: 'Messages et alertes'
  },
  {
    href: '/profil',
    label: '👤 Mon Profil',
    icon: User,
    description: 'Paramètres et préférences'
  }
];

// NAVIGATION ADMIN SIMPLIFIÉE - 4 CATÉGORIES MAXIMUM
export const adminNavigation: NavigationGroup[] = [
  {
    name: '📊 Command Center',
    icon: BarChart3,
    items: [
      {
        href: '/admin/command-center',
        label: 'Vue d\'ensemble',
        icon: Activity,
        description: 'Dashboard unifié avec métriques temps réel'
      },
      {
        href: '/admin/urgences',
        label: 'Mode Urgence',
        icon: AlertTriangle,
        description: 'Remplacements express et alertes'
      },
      {
        href: '/admin/analytics',
        label: 'Analytics',
        icon: BarChart3,
        description: 'Tendances et prédictions'
      }
    ]
  },
  {
    name: '👥 Gestion',
    icon: Users,
    items: [
      {
        href: '/utilisateurs',
        label: 'Personnel',
        icon: Users,
        description: 'MARs, IADEs, chirurgiens'
      },
      {
        href: '/bloc-operatoire',
        label: 'Bloc Opératoire',
        icon: Building2,
        description: 'Salles, secteurs, planning'
      },
      {
        href: '/admin/demandes',
        label: 'Demandes',
        icon: FileText,
        description: 'Gestion unifiée des demandes'
      },
      {
        href: '/admin/conges',
        label: 'Congés',
        icon: UserCheck,
        description: 'Validation et quotas'
      },
      {
        href: '/admin/planning-generator',
        label: 'Assistant Planning',
        icon: ClipboardList,
        description: 'Génération intelligente'
      }
    ]
  },
  {
    name: '📈 Rapports',
    icon: FileText,
    items: [
      {
        href: '/admin/rapports',
        label: 'Analyses',
        icon: FileText,
        description: 'Rapports congés et planning'
      },
      {
        href: '/admin/exports',
        label: 'Exports',
        icon: FileText,
        description: 'CSV, Excel, PDF'
      },
      {
        href: '/admin/kpi',
        label: 'Indicateurs',
        icon: BarChart3,
        description: 'KPI et métriques'
      }
    ]
  },
  {
    name: '⚙️ Configuration',
    icon: Settings,
    items: [
      {
        href: '/admin/planning-rules',
        label: 'Règles Métier',
        icon: Settings,
        description: 'Contraintes et validation'
      },
      {
        href: '/admin/templates-medicaux',
        label: 'Templates Médicaux',
        icon: ClipboardList,
        description: 'Modèles par spécialité'
      },
      {
        href: '/admin/configuration',
        label: 'Système',
        icon: Settings,
        description: 'Configuration générale'
      }
    ]
  }
];

// Navigation par rôle
export const getNavigationByRole = (userRole: string): NavigationItem[] => {
  const baseNavigation = [...userNavigation];
  
  switch (userRole) {
    case 'ADMIN_TOTAL':
      return [
        ...baseNavigation,
        ...adminNavigation.flatMap(group => group.items)
      ];
    
    case 'ADMIN_PARTIEL':
      return [
        ...baseNavigation,
        ...adminNavigation
          .filter(group => ['Tableaux de Bord', 'Gestion des Équipes'].includes(group.name))
          .flatMap(group => group.items)
      ];
    
    case 'MAR':
    case 'IADE':
      return [
        ...baseNavigation,
        {
          href: '/planning/equipe',
          label: 'Planning Équipe',
          icon: Users,
          description: 'Voir le planning de l\'équipe'
        }
      ];
    
    default:
      return baseNavigation;
  }
};

// Liens rapides selon le rôle
export const getQuickLinks = (userRole: string): NavigationItem[] => {
  const commonLinks = [
    {
      href: '/planning/semaine',
      label: 'Planning Semaine',
      icon: Calendar
    },
    {
      href: '/demandes/nouvelle',
      label: 'Nouvelle Demande',
      icon: FileText
    }
  ];

  switch (userRole) {
    case 'ADMIN_TOTAL':
    case 'ADMIN_PARTIEL':
      return [
        ...commonLinks,
        {
          href: '/admin/conges/validation',
          label: 'Validation Urgente',
          icon: UserCheck,
          badge: 'urgent'
        },
        {
          href: '/planning/generation',
          label: 'Générer Planning',
          icon: ClipboardList
        }
      ];
    
    case 'MAR':
      return [
        ...commonLinks,
        {
          href: '/planning/gardes',
          label: 'Mes Gardes',
          icon: Activity
        },
        {
          href: '/planning/echanges',
          label: 'Échanges Gardes',
          icon: Users
        }
      ];
    
    case 'IADE':
      return [
        ...commonLinks,
        {
          href: '/planning/vacations',
          label: 'Mes Vacations',
          icon: Clock
        },
        {
          href: '/formation',
          label: 'Formations',
          icon: FileText
        }
      ];
    
    default:
      return commonLinks;
  }
};

// Terminologie médicale - mapping pour les remplacements
export const medicalTerminology = {
  // Ancien → Nouveau
  'TrameModeles': 'TrameModeles',
  'trameModeles': 'trameModeles',
  'TrameModele': 'TrameModele',
  'trameModele': 'trameModele',
  
  'Affectations': 'Affectations',
  'affectations': 'affectations',
  'Affectation': 'Affectation',
  'affectation': 'affectation',
  
  'Créneaux': 'Créneaux',
  'slots': 'slots',
  'Créneau': 'Créneau',
  'slot': 'slot',
  
  'Organisateur de planning': 'Organisateur de planning',
  'organisateur de planning': 'organisateur de planning',
  'Organisateur': 'Organisateur',
  'organisateur': 'organisateur',
  
  'Modèles': 'Modèles',
  'templates': 'templates',
  'Modèle': 'Modèle',
  'template': 'template',
  
  'Attributions': 'Attributions',
  'attributions': 'attributions',
  'Attribution': 'Attribution',
  'attribution': 'attribution',
  
  'PlanningMedical': 'PlanningMedical',
  'planningMedical': 'planningMedical',
  'Planification': 'Planification',
  'planification': 'planification'
};

// Breadcrumbs contextuels
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: any;
}

export const getBreadcrumbs = (pathname: string, userRole: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Accueil', href: '/', icon: Activity }
  ];

  // Mapping des segments vers terminologie médicale
  const segmentMapping: Record<string, string> = {
    'planning': 'Mon Planning',
    'conges': 'Mes Congés',
    'demandes': 'Mes Demandes',
    'admin': 'Administration',
    'parametres': 'Configuration',
    'utilisateurs': 'Personnel Médical',
    'chirurgiens': 'Chirurgiens',
    'bloc-operatoire': 'Bloc Opératoire',
    'trameModeles': 'Tableaux de Service',
    'affectations': 'Affectations',
    'rapports': 'Rapports',
    'dashboard': 'Tableau de Bord'
  };

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = segmentMapping[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    breadcrumbs.push({
      label,
      href: index === segments.length - 1 ? undefined : currentPath
    });
  });

  return breadcrumbs;
};

// Vérification des droits d'accès
export const hasAccess = (userRole: string, href: string): boolean => {
  // Liens toujours accessibles
  const publicPaths = ['/planning', '/conges', '/demandes', '/notifications', '/profil', '/aide'];
  if (publicPaths.some(path => href.startsWith(path))) {
    return true;
  }

  // Liens admin
  const adminPaths = ['/admin', '/parametres', '/utilisateurs'];
  if (adminPaths.some(path => href.startsWith(path))) {
    return ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(userRole);
  }

  // Liens admin total uniquement
  const adminTotalPaths = ['/admin/performance', '/parametres/regles'];
  if (adminTotalPaths.some(path => href.startsWith(path))) {
    return userRole === 'ADMIN_TOTAL';
  }

  return true;
};

// Configuration responsive
export const mobileNavigationItems = (userRole: string): NavigationItem[] => {
  return getNavigationByRole(userRole).slice(0, 5); // 5 items max sur mobile
};

export default {
  userNavigation,
  adminNavigation,
  getNavigationByRole,
  getQuickLinks,
  getBreadcrumbs,
  hasAccess,
  mobileNavigationItems,
  medicalTerminology
};