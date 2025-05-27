// Configuration des liens de navigation regroupés par catégorie
export const navigationGroups = [
    {
        name: 'Planning',
        links: [
            { href: '/planning/generator', label: 'Générateur' },
            { href: '/planning/hebdomadaire', label: 'Hebdomadaire' },
            { href: '/planning/simulateur', label: 'Simulateur' },
            { href: '/calendrier', label: 'Calendrier' },
            { href: '/conges', label: 'Congés' },
            { href: '/consultations', label: 'Consultations' },
        ]
    },
    {
        name: 'Documentation',
        links: [
            { href: '/documentation', label: 'Guide utilisateur' },
            { href: '/docs', label: 'Documentation technique' },
        ]
    },
    {
        name: 'Administration',
        links: [
            { href: '/utilisateurs', label: 'Utilisateurs' },
            { href: '/parametres', label: 'Paramètres' },
            { href: '/parametres/configuration', label: 'Panneau de configuration' },
            { href: '/parametres/trames', label: 'Trames' },
            { href: '/bloc-operatoire', label: 'Bloc Opératoire' },
            { href: '/admin/planning-rules', label: 'Règles de Planning' },
            { href: '/admin/performance', label: 'Monitoring Performance' },
            { href: '/parametres/hopitaux', label: 'Hôpitaux' },
            { href: '/parametres/chirurgiens', label: 'Chirurgiens' },
            { href: '/parametres/sites', label: 'Sites' },
            { href: '/parametres/specialites', label: 'Spécialités' },
            { href: '/parametres/types-conges', label: 'Types de Congés' },
            { href: '/parametres/requetes', label: 'Types de Requêtes' },
        ]
    }
];

// Pour la compatibilité avec le code existant, on garde la liste plate
export const navigationLinks = [
    { href: '/', label: 'Accueil' },
    ...navigationGroups.flatMap(group => group.links)
];

// Liens qui nécessitent des droits d'administration
export const adminLinks = [
    '/parametres',
    '/utilisateurs',
    '/parametres/chirurgiens',
    '/parametres/configuration',
    '/parametres/configuration/fatigue',
    '/admin/bloc-operatoire',
    '/admin/planning-rules',
    '/admin/performance',
    '/statistiques',
    '/parametres/trames',
];

// Vérifier si un lien fait partie du groupe d'administration
export const isAdminGroup = (groupName: string) => groupName === 'Administration';

// Liens pour le menu mobile (peut être différent du menu desktop)
export const mobileNavigationLinks = navigationLinks; 