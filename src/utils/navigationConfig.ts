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
  Activity
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

// Menu utilisateur simplifié (5 liens max)
export const userNavigation: NavigationItem[] = [
  {
    href: '/planning',
    label: 'Mon Planning',
    icon: Calendar,
    description: 'Voir mes gardes et vacations'
  },
  {
    href: '/conges',
    label: 'Mes Congés',
    icon: Clock,
    description: 'Demandes et historique'
  },
  {
    href: '/notifications',
    label: 'Messages',
    icon: MessageCircle,
    description: 'Notifications et messages'
  },
  {
    href: '/profil',
    label: 'Mon Profil',
    icon: User,
    description: 'Paramètres personnels'
  },
  {
    href: '/aide',
    label: 'Aide',
    icon: HelpCircle,
    description: 'Guide et support'
  }
];

// Menu admin organisé en 4 catégories
export const adminNavigation: NavigationGroup[] = [
  {
    name: 'Tableaux de Bord',
    icon: BarChart3,
    items: [
      {
        href: '/admin/dashboard',
        label: 'Vue d\'ensemble',
        icon: Activity,
        description: 'Métriques et indicateurs'
      },
      {
        href: '/admin/performance',
        label: 'Performance',
        icon: BarChart3,
        description: 'Monitoring système'
      },
      {
        href: '/bloc-operatoire',
        label: 'Bloc Opératoire',
        icon: Building2,
        description: 'Gestion des salles'
      }
    ]
  },
  {
    name: 'Gestion des Équipes',
    icon: Users,
    items: [
      {
        href: '/utilisateurs',
        label: 'Personnel Médical',
        icon: Users,
        description: 'MARs, IADEs et équipes'
      },
      {
        href: '/parametres/chirurgiens',
        label: 'Chirurgiens',
        icon: Stethoscope,
        description: 'Gestion des praticiens'
      },
      {
        href: '/admin/conges',
        label: 'Validation Congés',
        icon: UserCheck,
        description: 'Approuver les demandes'
      },
      {
        href: '/planning/generation',
        label: 'Organisateur Planning',
        icon: ClipboardList,
        description: 'Génération automatique'
      }
    ]
  },
  {
    name: 'Rapports & Analyses',
    icon: FileText,
    items: [
      {
        href: '/admin/rapports/conges',
        label: 'Rapports Congés',
        icon: FileText,
        description: 'Analyses et statistiques'
      },
      {
        href: '/admin/rapports/planning',
        label: 'Rapports Planning',
        icon: Calendar,
        description: 'Couverture et répartition'
      },
      {
        href: '/admin/exports',
        label: 'Exports de Données',
        icon: FileText,
        description: 'Export CSV/Excel'
      }
    ]
  },
  {
    name: 'Configuration',
    icon: Settings,
    items: [
      {
        href: '/parametres/hopitaux',
        label: 'Sites Hospitaliers',
        icon: Building2,
        description: 'Configuration des sites'
      },
      {
        href: '/parametres/tableaux-service',
        label: 'Tableaux de Service',
        icon: ClipboardList,
        description: 'Modèles de planning'
      },
      {
        href: '/parametres/types-conges',
        label: 'Types de Congés',
        icon: Clock,
        description: 'Configuration congés'
      },
      {
        href: '/parametres/regles',
        label: 'Règles de Planification',
        icon: Settings,
        description: 'Contraintes métier'
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
      href: '/conges/demander',
      label: 'Demander Congé',
      icon: Clock
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
  'Trames': 'Tableaux de service',
  'trames': 'tableaux de service',
  'Trame': 'Tableau de service',
  'trame': 'tableau de service',
  
  'Affectations': 'Gardes/Vacations',
  'affectations': 'gardes/vacations',
  'Affectation': 'Garde/Vacation',
  'affectation': 'garde/vacation',
  
  'Slots': 'Créneaux',
  'slots': 'créneaux',
  'Slot': 'Créneau',
  'slot': 'créneau',
  
  'Planning Generator': 'Organisateur de planning',
  'planning generator': 'organisateur de planning',
  'Generator': 'Organisateur',
  'generator': 'organisateur',
  
  'Templates': 'Modèles',
  'templates': 'modèles',
  'Template': 'Modèle',
  'template': 'modèle',
  
  'Assignments': 'Attributions',
  'assignments': 'attributions',
  'Assignment': 'Attribution',
  'assignment': 'attribution',
  
  'Schedule': 'Planning médical',
  'schedule': 'planning médical',
  'Scheduling': 'Planification',
  'scheduling': 'planification'
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
    'admin': 'Administration',
    'parametres': 'Configuration',
    'utilisateurs': 'Personnel Médical',
    'chirurgiens': 'Chirurgiens',
    'bloc-operatoire': 'Bloc Opératoire',
    'trames': 'Tableaux de Service',
    'affectations': 'Gardes/Vacations',
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
  const publicPaths = ['/planning', '/conges', '/notifications', '/profil', '/aide'];
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