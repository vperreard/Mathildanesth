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