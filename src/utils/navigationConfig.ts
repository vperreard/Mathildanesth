// Configuration des liens de navigation regroupés par catégorie
export const navigationGroups = [
    {
        name: 'Planning',
        links: [
            { href: '/planning/generator', label: 'Générateur' },
            { href: '/planning/hebdomadaire', label: 'Hebdomadaire' },
            { href: '/planning/simulateur', label: 'Simulateur' },
            { href: '/calendar', label: 'Calendrier' },
            { href: '/leaves', label: 'Congés' },
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
            { href: '/parametres/trames', label: 'Trames Hebdomadaires' },
            { href: '/admin/bloc-operatoire', label: 'Bloc Opératoire' },
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
    '/parametres/configuration',
    '/parametres/configuration/fatigue',
    '/admin/bloc-operatoire',
    '/statistiques',
    '/parametres/trames',
];

// Vérifier si un lien fait partie du groupe d'administration
export const isAdminGroup = (groupName: string) => groupName === 'Administration';

// Liens pour le menu mobile (peut être différent du menu desktop)
export const mobileNavigationLinks = navigationLinks; 