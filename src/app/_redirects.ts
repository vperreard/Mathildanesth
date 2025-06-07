import { NextRequest, NextResponse } from 'next/server';

// Redirections 301 pour les routes obsolètes
export const redirects = {
  '/demo': '/',
  '/diagnostic': '/admin',
  '/admin/utilisateurs': '/utilisateurs',
  '/admin/chirurgiens': '/parametres/chirurgiens',
  // Bloc-opératoire unifiées
  '/admin/bloc-operatoire': '/bloc-operatoire',
  '/admin/bloc-operatoire/salles': '/bloc-operatoire/salles',
  '/admin/bloc-operatoire/secteurs': '/bloc-operatoire/secteurs',
  '/admin/bloc-operatoire/regles-supervision': '/bloc-operatoire/regles',
  '/bloc-operatoire/regles-supervision': '/bloc-operatoire/regles',
  // Unification des systèmes de demandes
  '/requetes': '/demandes',
  '/admin/demandes-old': '/admin/demandes',
  '/notifications/echanges': '/demandes?type=ASSIGNMENT_SWAP',
  '/conges/demander': '/demandes/nouvelle?type=LEAVE',
  '/planning/echanges': '/demandes?type=ASSIGNMENT_SWAP',
  
  // Nouvelles redirections pour routes en français
  '/login': '/connexion',
  '/auth/reset-password': '/auth/reinitialiser-mot-de-passe',
  '/dashboard': '/tableau-bord',
  '/admin/command-center': '/admin/centre-commande',
  '/admin/emergency-replacement': '/admin/remplacement-urgence',
  '/admin/performance': '/admin/performances',
  '/admin/planning-generator': '/admin/generateur-planning',
  '/admin/planning-rules': '/admin/regles-planning',
  '/admin/schedule-rules': '/admin/regles-horaires',
  '/admin/skills': '/admin/competences',
  '/admin/team-configurations': '/admin/configurations-equipes',
  '/admin/site-assignments': '/admin/affectations-sites',
  '/admin/rules': '/admin/regles',
  '/admin/analytics': '/admin/analyses',
  '/quota-management': '/gestion-quotas',
  '/test-auth': '/test-authentification',
  '/design-system': '/systeme-design',
  '/drag-and-drop-demo': '/demo-glisser-deposer',
} as const;

export function handleRedirects(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  
  // Vérifier si la route nécessite une redirection
  if (pathname in redirects) {
    const url = request.nextUrl.clone();
    url.pathname = redirects[pathname as keyof typeof redirects];
    return NextResponse.redirect(url, 301);
  }
  
  return null;
}