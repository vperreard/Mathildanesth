# Principes et Guide de Développement API Backend

## Introduction

Ce document détaille les principes de conception, les conventions et les meilleures pratiques pour le développement des API backend de Mathildanesth. L'objectif est de maintenir une API cohérente, sécurisée, performante et facile à utiliser pour les développeurs frontend et potentiellement pour des intégrations futures.
Les API sont principalement construites en utilisant les **Route Handlers** de Next.js dans le répertoire `src/app/api/`.

## Principes de Conception API

- **RESTful :** Suivre autant que possible les principes REST (Representational State Transfer) pour la conception des ressources et des actions.
  - Utiliser les méthodes HTTP de manière sémantique : `GET` (lecture), `POST` (création), `PUT` (mise à jour complète), `PATCH` (mise à jour partielle), `DELETE` (suppression).
  - Utiliser des URLs basées sur les ressources (ex: `/api/users`, `/api/leaves/{leaveId}`).
- **Stateless :** Chaque requête API doit contenir toutes les informations nécessaires pour être traitée, sans dépendre d'un état de session côté serveur (l'état de la session utilisateur est géré via des tokens, par exemple JWT avec NextAuth.js).
- **Cohérence :** Maintenir une structure et des conventions cohérentes à travers toutes les API.
- **Sécurité :** La sécurité est primordiale (voir section dédiée ci-dessous et le document `../01_Architecture_Generale/05_Securite_Permissions.md`).
- **Performance :** Concevoir des API efficaces, en évitant les requêtes inutiles en base de données et en optimisant les traitements.

## Structure et Conventions des Routes API

- **Localisation :** Les handlers de route API se trouvent dans `src/app/api/`.
  - Exemple : `src/app/api/users/[userId]/route.ts` correspondrait à `/api/users/{userId}`.
- **Nommage des Routes :**
  - Utiliser des noms de ressources au pluriel (ex: `/api/leaves`, `/api/operating-rooms`).
  - Utiliser le `kebab-case` pour les segments de route si nécessaire (ex: `/api/team-configurations`).
- **Organisation des Fichiers :**
  - Chaque ressource principale a généralement son propre dossier (ex: `src/app/api/leaves/`).
  - Les opérations sur une ressource spécifique (ex: par ID) sont dans un sous-dossier avec un segment dynamique (ex: `src/app/api/leaves/[leaveId]/route.ts`).
  - Chaque fichier `route.ts` exporte des fonctions nommées correspondant aux méthodes HTTP (ex: `export async function GET(request: Request) { ... }`).

## Format des Requêtes et Réponses

- **Format :** JSON est le format standard pour les corps de requête et de réponse.
  - `Content-Type: application/json` pour les requêtes avec corps.
  - Les API doivent retourner des réponses avec `Content-Type: application/json`.
- **Structure des Réponses de Succès :**
  - `GET` (collection) : Tableau d'objets.
  - `GET` (ressource unique) : Objet unique.
  - `POST`, `PUT`, `PATCH` : Généralement, l'objet créé ou modifié est retourné.
  - `DELETE` : Souvent une réponse vide avec un statut 204 (No Content) ou un message de confirmation.
- **Codes de Statut HTTP :** Utiliser les codes de statut HTTP de manière sémantique.
  - `200 OK` : Succès général pour `GET`, `PUT`, `PATCH`.
  - `201 Created` : Création réussie (`POST`).
  - `204 No Content` : Succès sans corps de réponse (`DELETE`).
  - `400 Bad Request` : Erreur côté client (ex: validation des données échouée).
  - `401 Unauthorized` : Authentification requise ou échouée.
  - `403 Forbidden` : Authentifié mais non autorisé à accéder à la ressource.
  - `404 Not Found` : Ressource non trouvée.
  - `409 Conflict` : Conflit avec l'état actuel de la ressource (ex: duplication).
  - `500 Internal Server Error` : Erreur inattendue côté serveur.

## Validation des Données

- **Validation Systématique :** Toutes les données entrantes (corps de requête, paramètres d'URL, query params) DOIVENT être validées côté serveur avant d'être traitées.
- **Outil :** [Zod](https://zod.dev/) est l'outil privilégié pour la validation de schémas de données.

  - Définir des schémas Zod pour les corps de requête attendus.
  - En cas d'échec de validation, retourner une réponse `400 Bad Request` avec des détails sur les erreurs de validation.

  ```typescript
  // Exemple de validation avec Zod dans un route handler
  import { z } from 'zod';

  const createLeaveSchema = z.object({
    userId: z.string(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    reason: z.string().min(1),
  });

  export async function POST(request: Request) {
    try {
      const json = await request.json();
      const data = createLeaveSchema.parse(json);
      // ... logique de création ...
      return Response.json({ message: 'Leave created', data }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Response.json({ errors: error.errors }, { status: 400 });
      }
      // ... autre gestion d'erreur ...
      return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
  }
  ```

## Authentification et Autorisation

- **Authentification :** Gérée par NextAuth.js (voir `../01_Architecture_Generale/05_Securite_Permissions.md`).
  - La session utilisateur peut être récupérée dans les Route Handlers via `getServerSession` de NextAuth.js.
  - Les API protégées doivent vérifier la présence d'une session valide et retourner `401 Unauthorized` si absente.
- **Autorisation :** Basée sur les rôles et permissions (RBAC).

  - Après authentification, vérifier si l'utilisateur a le rôle ou les permissions nécessaires pour effectuer l'action demandée.
  - Retourner `403 Forbidden` si l'utilisateur n'est pas autorisé.
  - La logique de vérification des permissions doit être centralisée autant que possible (ex: via des middlewares ou des fonctions utilitaires).

  ```typescript
  // Exemple de protection de route
  import { getServerSession } from 'next-auth/next';
  import { authOptions } from '@/lib/authOptions'; // Votre configuration NextAuth

  export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Exemple de vérification de rôle (simplifié)
    // @ts-ignore // session.user.role n'est pas typé par défaut
    if (session.user?.role !== 'ADMIN') {
      return Response.json({ message: 'Forbidden' }, { status: 403 });
    }

    // ... logique de la route ...
    return Response.json({ data: 'Contenu protégé' });
  }
  ```

## Gestion des Erreurs

- Utiliser des blocs `try...catch` dans les handlers pour capturer les erreurs.
- Retourner des codes de statut HTTP appropriés et des messages d'erreur clairs en JSON.
- Pour les erreurs serveur (`5xx`), éviter de divulguer des détails d'implémentation sensibles au client.
- Utiliser un service de logging centralisé (ex: `errorLoggingService.ts`) pour enregistrer les erreurs serveur avec suffisamment de contexte pour le débogage (voir `../01_Architecture_Generale/04_Gestion_Erreurs_Logging.md`).

## Pagination, Filtrage, Tri

- Pour les API retournant des listes de ressources, implémenter la pagination (ex: via les query params `page` et `limit`, ou `offset` et `limit`).
- Permettre le filtrage et le tri des résultats via des query params (ex: `/api/leaves?status=PENDING&sortBy=startDate&order=asc`).
- Valider et nettoyer tous les query params.

## Accès à la Base de Données

- Utiliser Prisma comme ORM pour interagir avec la base de données.
- Placer la logique d'accès aux données dans des **services** (ex: `src/modules/leaves/services/leaveService.ts`) plutôt que directement dans les Route Handlers pour une meilleure séparation des préoccupations et testabilité.
- Optimiser les requêtes Prisma (sélection des champs, utilisation des `include`, gestion des problèmes N+1).

## Versioning (Optionnel)

Si des changements majeurs incompatibles avec les versions précédentes de l'API sont introduits, envisager un versioning (ex: `/api/v2/users`). Pour l'instant, cela n'est pas formellement implémenté.

## Documentation des API

- Une documentation claire des API est cruciale.
- Envisager l'utilisation d'outils comme Swagger/OpenAPI pour générer une documentation interactive à partir du code ou de schémas (peut être une étape future).
- Pour l'instant, maintenir des descriptions claires dans des fichiers Markdown ou via JSDoc dans le code des Route Handlers.

## Tests des API

- Les API doivent être testées.
- Utiliser Jest et Supertest (ou des requêtes `fetch` dans les tests Jest) pour tester les Route Handlers.
- Les tests doivent couvrir les cas de succès, les erreurs de validation, les problèmes d'authentification/autorisation, et les cas limites.

En suivant ces principes, nous pouvons construire un backend robuste et maintenable pour Mathildanesth.
