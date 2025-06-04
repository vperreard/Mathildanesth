État actuel de la correction du build:

## Progrès réalisé:

- ✅ Corrigé les problèmes de params dynamiques dans les routes API (conversion vers Promise<{}>)
- ✅ Déplacé authOptions dans un fichier séparé (/lib/auth/authOptions.ts)
- ✅ Corrigé les imports d'authOptions dans 18 fichiers
- ✅ Corrigé les problèmes avec SimulationProgress (export type)
- ✅ Corrigé de nombreuses routes API pour Next.js 14

## Problèmes restants:

- ❌ Plusieurs routes utilisent encore withAuth qui n'est pas compatible avec Next.js 14
- Routes identifiées avec withAuth:
  - /api/trame-modeles/[trameModeleId]/affectations/route.ts
  - /api/trame-modeles/[trameModeleId]/apply/route.ts
  - /api/leaves/[leaveId]/approve/route.ts
  - /api/leaves/route.ts
  - /api/admin/security/audit-logs/route.ts
  - /api/users/[userId]/route.ts
  - /api/auth/logout/route.ts
  - /api/auth/login/route.ts

## Prochaines étapes:

1. Refactoriser toutes les routes utilisant withAuth pour utiliser l'authentification directe
2. Vérifier que toutes les routes API suivent le format Next.js 14
3. Relancer le build pour validation finale

Le build est proche de fonctionner, mais il reste encore du travail pour adapter toutes les routes à Next.js 14.
