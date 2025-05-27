// Redirections pour maintenir la compatibilité avec les anciennes URLs

export const blocOperatoireRedirects = [
  // Redirections depuis l'ancienne version user
  {
    source: '/bloc-operatoire',
    destination: '/bloc-operatoire',
    permanent: true,
  },
  {
    source: '/bloc-operatoire/planning',
    destination: '/bloc-operatoire/planning',
    permanent: true,
  },
  {
    source: '/bloc-operatoire/salles',
    destination: '/bloc-operatoire/salles',
    permanent: true,
  },
  {
    source: '/bloc-operatoire/trameModeles',
    destination: '/bloc-operatoire/trameModeles',
    permanent: true,
  },
  {
    source: '/bloc-operatoire/regles-supervision',
    destination: '/bloc-operatoire/regles',
    permanent: true,
  },
  
  // Redirections depuis l'ancienne version admin
  {
    source: '/admin/bloc-operatoire',
    destination: '/bloc-operatoire',
    permanent: true,
  },
  {
    source: '/admin/bloc-operatoire/salles',
    destination: '/bloc-operatoire/salles',
    permanent: true,
  },
  {
    source: '/admin/bloc-operatoire/secteurs',
    destination: '/bloc-operatoire/secteurs',
    permanent: true,
  },
  {
    source: '/admin/bloc-operatoire/regles-supervision',
    destination: '/bloc-operatoire/regles',
    permanent: true,
  },
];

// Middleware pour gérer les redirections côté client
export function handleBlocOperatoireRedirect(pathname: string): string | null {
  const redirect = blocOperatoireRedirects.find(r => r.source === pathname);
  return redirect ? redirect.destination : null;
}