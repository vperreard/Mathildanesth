# API Trame Modèles - Affectations

Cette API permet de gérer les affectations individuelles des trames modèles pour l'EditeurTramesHebdomadaires.

## Endpoints

### GET /api/trame-modeles/[trameId]/affectations

Récupère toutes les affectations d'une trame modèle avec pagination et filtres.

**Paramètres de requête :**
- `page` (number) : Numéro de page (défaut: 1)
- `limit` (number) : Nombre d'éléments par page (défaut: 20, max: 100)
- `isActive` (string) : Filtrer par statut actif ('true' ou 'false')
- `startDate` (string) : Date de début minimum (format ISO)
- `endDate` (string) : Date de fin maximum (format ISO)
- `search` (string) : Recherche dans le nom et la description
- `sortBy` (string) : Champ de tri ('name', 'startDate', 'createdAt', 'updatedAt')
- `sortOrder` (string) : Ordre de tri ('asc' ou 'desc')

**Réponse :**
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string | null",
      "isActive": true,
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "string | null",
      "createdBy": 1,
      "createdAt": "string",
      "updatedAt": "string",
      "periods": [
        {
          "id": "string",
          "name": "string",
          "startTime": "08:00",
          "endTime": "12:00",
          "color": "#FF0000",
          "isActive": true,
          "isLocked": false,
          "createdAt": "string",
          "updatedAt": "string",
          "assignmentsCount": 0
        }
      ],
      "user": {
        "id": 1,
        "firstName": "string",
        "lastName": "string"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### POST /api/trame-modeles/[trameId]/affectations

Crée une nouvelle affectation pour une trame modèle.

**Permissions requises :** Admin uniquement

**Corps de la requête :**
```json
{
  "name": "string",
  "description": "string (optionnel)",
  "isActive": true,
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "string (optionnel)",
  "periods": [
    {
      "name": "string",
      "startTime": "08:00",
      "endTime": "12:00",
      "color": "#FF0000",
      "isActive": true,
      "isLocked": false
    }
  ]
}
```

**Réponse :** 201 Created avec l'objet créé

### PUT /api/trame-modeles/[trameId]/affectations/[affectationId]

Met à jour une affectation existante.

**Corps de la requête :**
```json
{
  "name": "string (optionnel)",
  "description": "string (optionnel)",
  "isActive": true,
  "startDate": "string (optionnel)",
  "endDate": "string (optionnel)"
}
```

**Réponse :** 200 OK avec l'objet mis à jour

### DELETE /api/trame-modeles/[trameId]/affectations/[affectationId]

Supprime une affectation.

**Permissions requises :** Admin uniquement

**Réponse :** 200 OK avec message de confirmation

**Note :** Une affectation ne peut pas être supprimée si elle a des assignments associés.

## Codes d'erreur

- `401 Unauthorized` : Token d'authentification manquant ou invalide
- `403 Forbidden` : Permissions insuffisantes
- `404 Not Found` : Affectation non trouvée
- `400 Bad Request` : Données invalides
- `409 Conflict` : Impossible de supprimer (affectation a des assignments)
- `500 Internal Server Error` : Erreur serveur

## Exemples d'utilisation

### Récupérer les affectations actives
```bash
GET /api/trame-modeles/123/affectations?isActive=true&sortBy=name&sortOrder=asc
```

### Créer une nouvelle affectation
```bash
POST /api/trame-modeles/123/affectations
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Trame Chirurgie Matin",
  "description": "Planning pour les chirurgies du matin",
  "isActive": true,
  "startDate": "2025-01-01T00:00:00.000Z",
  "periods": [
    {
      "name": "Bloc 1",
      "startTime": "08:00",
      "endTime": "12:00",
      "color": "#4CAF50"
    }
  ]
}
```

### Mettre à jour une affectation
```bash
PUT /api/trame-modeles/123/affectations/affectation-456
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Trame Chirurgie Matin - Mise à jour",
  "isActive": false
}
```

### Supprimer une affectation
```bash
DELETE /api/trame-modeles/123/affectations/affectation-456
Authorization: Bearer <token>
```