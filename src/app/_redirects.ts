import { NextRequest, NextResponse } from 'next/server';

// Redirections 301 pour les routes obsolètes
export const redirects = {
  '/demo': '/',
  '/diagnostic': '/admin',
  '/admin/users': '/utilisateurs',
  '/admin/surgeons': '/parametres/chirurgiens',
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