# Spécifications API - Système de Trames

## OpenAPI 3.0 Specification

```yaml
openapi: 3.0.3
info:
  title: Mathilda - API Système de Trames
  description: API pour la gestion des modèles de trames et leur application aux plannings
  version: 1.0.0
  contact:
    name: Équipe Développement Mathilda
    
servers:
  - url: /api
    description: API Mathilda

paths:
  /trame-modeles:
    get:
      summary: Lister les modèles de trame
      tags: [TrameModeles]
      parameters:
        - name: siteId
          in: query
          schema:
            type: string
          description: Filtrer par site
        - name: isActive
          in: query
          schema:
            type: boolean
          description: Filtrer par statut actif
        - name: includeAffectations
          in: query
          schema:
            type: boolean
            default: false
          description: Inclure les affectations dans la réponse
      responses:
        '200':
          description: Liste des modèles de trame
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/TrameModele'
        '401':
          $ref: '#/components/responses/Unauthorized'
          
    post:
      summary: Créer un nouveau modèle de trame
      tags: [TrameModeles]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTrameModeleRequest'
      responses:
        '201':
          description: Modèle de trame créé
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TrameModele'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'
        '409':
          $ref: '#/components/responses/Conflict'

  /trame-modeles/{trameModeleId}:
    parameters:
      - name: trameModeleId
        in: path
        required: true
        schema:
          type: integer
        description: ID du modèle de trame
        
    get:
      summary: Récupérer un modèle de trame
      tags: [TrameModeles]
      responses:
        '200':
          description: Détails du modèle de trame
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TrameModeleDetailed'
        '404':
          $ref: '#/components/responses/NotFound'
          
    put:
      summary: Mettre à jour un modèle de trame
      tags: [TrameModeles]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateTrameModeleRequest'
      responses:
        '200':
          description: Modèle de trame mis à jour
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TrameModele'
        '400':
          $ref: '#/components/responses/BadRequest'
        '404':
          $ref: '#/components/responses/NotFound'
        '409':
          $ref: '#/components/responses/Conflict'
          
    delete:
      summary: Supprimer un modèle de trame
      tags: [TrameModeles]
      responses:
        '200':
          description: Modèle de trame supprimé
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                    example: "Modèle de trame supprimé avec succès"
        '404':
          $ref: '#/components/responses/NotFound'

  /trame-modeles/{trameModeleId}/affectations:
    parameters:
      - name: trameModeleId
        in: path
        required: true
        schema:
          type: integer
          
    get:
      summary: Lister les affectations d'un modèle de trame
      tags: [Affectations]
      responses:
        '200':
          description: Liste des affectations
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/AffectationModeleDetailed'
                  
    post:
      summary: Créer une nouvelle affectation
      tags: [Affectations]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateAffectationRequest'
      responses:
        '201':
          description: Affectation créée
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AffectationModeleDetailed'

  /trame-modeles/{trameModeleId}/apply:
    parameters:
      - name: trameModeleId
        in: path
        required: true
        schema:
          type: integer
          
    post:
      summary: Appliquer un modèle de trame à une plage de dates
      tags: [Application]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ApplyTrameRequest'
      responses:
        '200':
          description: Application réussie
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApplyTrameResult'
        '207':
          description: Application partiellement réussie
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApplyTrameResult'
                
    get:
      summary: Prévisualiser l'application d'un modèle de trame
      tags: [Application]
      parameters:
        - name: startDate
          in: query
          required: true
          schema:
            type: string
            format: date
        - name: endDate
          in: query
          required: true
          schema:
            type: string
            format: date
        - name: siteId
          in: query
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Prévisualisation de l'application
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/ApplyTrameResult'
                  - type: object
                    properties:
                      preview:
                        type: boolean
                        example: true

  /activity-types:
    get:
      summary: Lister les types d'activité
      tags: [ActivityTypes]
      parameters:
        - name: active
          in: query
          schema:
            type: boolean
        - name: code
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Liste des types d'activité
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/ActivityType'
                  
    post:
      summary: Créer un nouveau type d'activité
      tags: [ActivityTypes]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateActivityTypeRequest'
      responses:
        '201':
          description: Type d'activité créé
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ActivityType'

components:
  schemas:
    TrameModele:
      type: object
      properties:
        id:
          type: integer
          example: 1
        name:
          type: string
          example: "Trame Bloc Principal"
        description:
          type: string
          nullable: true
          example: "Trame standard pour le bloc opératoire principal"
        siteId:
          type: string
          nullable: true
          example: "site-123"
        isActive:
          type: boolean
          example: true
        dateDebutEffet:
          type: string
          format: date-time
          example: "2024-01-01T00:00:00.000Z"
        dateFinEffet:
          type: string
          format: date-time
          nullable: true
          example: "2024-12-31T23:59:59.999Z"
        recurrenceType:
          $ref: '#/components/schemas/RecurrenceTypeTrame'
        joursSemaineActifs:
          type: array
          items:
            type: integer
            minimum: 1
            maximum: 7
          example: [1, 2, 3, 4, 5]
          description: "Jours actifs (1=Lundi, 7=Dimanche)"
        typeSemaine:
          $ref: '#/components/schemas/TypeSemaineTrame'
        roles:
          type: array
          items:
            $ref: '#/components/schemas/TrameRoleType'
        detailsJson:
          type: object
          nullable: true
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
          
    TrameModeleDetailed:
      allOf:
        - $ref: '#/components/schemas/TrameModele'
        - type: object
          properties:
            site:
              $ref: '#/components/schemas/Site'
            affectations:
              type: array
              items:
                $ref: '#/components/schemas/AffectationModeleDetailed'
                
    AffectationModele:
      type: object
      properties:
        id:
          type: integer
        trameModeleId:
          type: integer
        activityTypeId:
          type: string
        jourSemaine:
          $ref: '#/components/schemas/DayOfWeek'
        periode:
          $ref: '#/components/schemas/Period'
        typeSemaine:
          $ref: '#/components/schemas/TypeSemaineTrame'
        operatingRoomId:
          type: integer
          nullable: true
        priorite:
          type: integer
          minimum: 1
          maximum: 10
          default: 5
        isActive:
          type: boolean
          default: true
        detailsJson:
          type: object
          nullable: true
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
          
    AffectationModeleDetailed:
      allOf:
        - $ref: '#/components/schemas/AffectationModele'
        - type: object
          properties:
            activityType:
              $ref: '#/components/schemas/ActivityType'
            operatingRoom:
              $ref: '#/components/schemas/OperatingRoom'
            personnelRequis:
              type: array
              items:
                $ref: '#/components/schemas/PersonnelRequisModeleDetailed'
                
    PersonnelRequisModele:
      type: object
      properties:
        id:
          type: integer
        affectationModeleId:
          type: integer
        roleGenerique:
          type: string
          example: "MAR"
        professionalRoleId:
          type: string
          nullable: true
        specialtyId:
          type: integer
          nullable: true
        nombreRequis:
          type: integer
          minimum: 1
          default: 1
        personnelHabituelUserId:
          type: integer
          nullable: true
        personnelHabituelSurgeonId:
          type: integer
          nullable: true
        personnelHabituelNomExterne:
          type: string
          nullable: true
        notes:
          type: string
          nullable: true
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
          
    PersonnelRequisModeleDetailed:
      allOf:
        - $ref: '#/components/schemas/PersonnelRequisModele'
        - type: object
          properties:
            professionalRoleConfig:
              type: object
              nullable: true
            specialty:
              $ref: '#/components/schemas/Specialty'
            userHabituel:
              $ref: '#/components/schemas/User'
            surgeonHabituel:
              $ref: '#/components/schemas/Surgeon'
              
    ActivityType:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        description:
          type: string
          nullable: true
        category:
          $ref: '#/components/schemas/ActivityCategory'
        color:
          type: string
          nullable: true
        icon:
          type: string
          nullable: true
        isActive:
          type: boolean
        code:
          type: string
        defaultDurationHours:
          type: number
          nullable: true
        defaultPeriod:
          $ref: '#/components/schemas/Period'
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
          
    CreateTrameModeleRequest:
      type: object
      required:
        - name
        - dateDebutEffet
        - joursSemaineActifs
        - recurrenceType
        - typeSemaine
      properties:
        name:
          type: string
          example: "Trame Bloc Principal"
        description:
          type: string
          example: "Trame standard pour le bloc opératoire principal"
        siteId:
          type: string
          example: "site-123"
        dateDebutEffet:
          type: string
          format: date-time
          example: "2024-01-01T00:00:00.000Z"
        dateFinEffet:
          type: string
          format: date-time
          nullable: true
        recurrenceType:
          $ref: '#/components/schemas/RecurrenceTypeTrame'
        joursSemaineActifs:
          type: array
          items:
            type: integer
            minimum: 1
            maximum: 7
          example: [1, 2, 3, 4, 5]
        typeSemaine:
          $ref: '#/components/schemas/TypeSemaineTrame'
        isActive:
          type: boolean
          default: true
        detailsJson:
          type: object
          nullable: true
          
    UpdateTrameModeleRequest:
      type: object
      properties:
        name:
          type: string
        description:
          type: string
        siteId:
          type: string
        dateDebutEffet:
          type: string
          format: date-time
        dateFinEffet:
          type: string
          format: date-time
          nullable: true
        recurrenceType:
          $ref: '#/components/schemas/RecurrenceTypeTrame'
        joursSemaineActifs:
          type: array
          items:
            type: integer
            minimum: 1
            maximum: 7
        typeSemaine:
          $ref: '#/components/schemas/TypeSemaineTrame'
        isActive:
          type: boolean
        detailsJson:
          type: object
          nullable: true
          
    CreateAffectationRequest:
      type: object
      required:
        - activityTypeId
        - jourSemaine
        - periode
        - typeSemaine
      properties:
        activityTypeId:
          type: string
        jourSemaine:
          $ref: '#/components/schemas/DayOfWeek'
        periode:
          $ref: '#/components/schemas/Period'
        typeSemaine:
          $ref: '#/components/schemas/TypeSemaineTrame'
        operatingRoomId:
          type: integer
          nullable: true
        priorite:
          type: integer
          minimum: 1
          maximum: 10
          default: 5
        isActive:
          type: boolean
          default: true
        detailsJson:
          type: object
          nullable: true
        personnelRequis:
          type: array
          items:
            type: object
            required:
              - roleGenerique
            properties:
              roleGenerique:
                type: string
              professionalRoleId:
                type: string
                nullable: true
              specialtyId:
                type: integer
                nullable: true
              nombreRequis:
                type: integer
                default: 1
              personnelHabituelUserId:
                type: integer
                nullable: true
              personnelHabituelSurgeonId:
                type: integer
                nullable: true
              personnelHabituelNomExterne:
                type: string
                nullable: true
              notes:
                type: string
                nullable: true
                
    CreateActivityTypeRequest:
      type: object
      required:
        - name
        - code
      properties:
        name:
          type: string
        code:
          type: string
        description:
          type: string
        category:
          $ref: '#/components/schemas/ActivityCategory'
        icon:
          type: string
        color:
          type: string
        isActive:
          type: boolean
          default: true
        defaultDurationHours:
          type: number
        defaultPeriod:
          $ref: '#/components/schemas/Period'
          
    ApplyTrameRequest:
      type: object
      required:
        - startDate
        - endDate
        - siteId
      properties:
        startDate:
          type: string
          format: date
          example: "2024-01-01"
        endDate:
          type: string
          format: date
          example: "2024-01-31"
        siteId:
          type: string
          example: "site-123"
        options:
          type: object
          properties:
            forceOverwrite:
              type: boolean
              default: false
              description: "Écrase les plannings existants"
            skipExistingAssignments:
              type: boolean
              default: false
              description: "Ignore les affectations existantes"
            includeInactive:
              type: boolean
              default: false
              description: "Inclut les affectations inactives"
            dryRun:
              type: boolean
              default: false
              description: "Mode simulation sans persistance"
              
    ApplyTrameResult:
      type: object
      properties:
        success:
          type: boolean
        message:
          type: string
        planningsCreated:
          type: integer
          description: "Nombre de BlocDayPlanning créés"
        assignmentsCreated:
          type: integer
          description: "Nombre de BlocRoomAssignment créés"
        errors:
          type: array
          items:
            type: string
        warnings:
          type: array
          items:
            type: string
            
    # Enums
    RecurrenceTypeTrame:
      type: string
      enum: [AUCUNE, HEBDOMADAIRE]
      
    TypeSemaineTrame:
      type: string
      enum: [TOUTES, PAIRES, IMPAIRES]
      
    TrameRoleType:
      type: string
      enum: [MAR, IADE, CHIRURGIEN, TOUS]
      
    DayOfWeek:
      type: string
      enum: [MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY]
      
    Period:
      type: string
      enum: [MATIN, APRES_MIDI, JOURNEE_ENTIERE]
      
    ActivityCategory:
      type: string
      enum: [BLOC_OPERATOIRE, CONSULTATION, GARDE, ASTREINTE, REUNION, FORMATION, ADMINISTRATIF, AUTRE]
      
    # Entités de référence (simplifiées)
    Site:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        isActive:
          type: boolean
          
    OperatingRoom:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        number:
          type: string
        isActive:
          type: boolean
        siteId:
          type: string
          
    Specialty:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        
    User:
      type: object
      properties:
        id:
          type: integer
        nom:
          type: string
        prenom:
          type: string
        email:
          type: string
        
    Surgeon:
      type: object
      properties:
        id:
          type: integer
        nom:
          type: string
        prenom:
          type: string
        email:
          type: string

  responses:
    Unauthorized:
      description: Non autorisé - Token manquant ou invalide
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
                example: "Non autorisé - Token invalide"
                
    BadRequest:
      description: Requête invalide
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
                example: "Les champs requis sont manquants"
                
    NotFound:
      description: Ressource non trouvée
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
                example: "Modèle de trame non trouvé"
                
    Conflict:
      description: Conflit de données
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
                example: "Un modèle de trame avec ce nom existe déjà"
                
    InternalServerError:
      description: Erreur interne du serveur
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                type: string
                example: "Erreur interne du serveur"
              details:
                type: string
                
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      
security:
  - BearerAuth: []
```

## Exemples d'utilisation des APIs

### 1. Créer un modèle de trame

```bash
curl -X POST /api/trame-modeles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Trame Bloc Principal",
    "description": "Trame standard pour le bloc opératoire principal",
    "siteId": "site-123",
    "dateDebutEffet": "2024-01-01T00:00:00.000Z",
    "recurrenceType": "HEBDOMADAIRE",
    "joursSemaineActifs": [1, 2, 3, 4, 5],
    "typeSemaine": "TOUTES"
  }'
```

### 2. Ajouter une affectation

```bash
curl -X POST /api/trame-modeles/1/affectations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activityTypeId": "chirurgie-generale",
    "jourSemaine": "MONDAY",
    "periode": "MATIN",
    "typeSemaine": "TOUTES",
    "operatingRoomId": 1,
    "personnelRequis": [
      {
        "roleGenerique": "CHIRURGIEN",
        "nombreRequis": 1,
        "personnelHabituelSurgeonId": 42
      },
      {
        "roleGenerique": "IADE",
        "nombreRequis": 1
      }
    ]
  }'
```

### 3. Prévisualiser l'application

```bash
curl -X GET "/api/trame-modeles/1/apply?startDate=2024-01-01&endDate=2024-01-31&siteId=site-123" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Appliquer la trame

```bash
curl -X POST /api/trame-modeles/1/apply \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "siteId": "site-123",
    "options": {
      "forceOverwrite": false,
      "skipExistingAssignments": true,
      "dryRun": false
    }
  }'
```

## Codes d'erreur spécifiques

| Code | Description | Résolution |
|------|-------------|------------|
| `TRAME_NOT_FOUND` | Modèle de trame non trouvé | Vérifier l'ID du modèle |
| `TRAME_INACTIVE` | Modèle de trame inactif | Activer le modèle ou utiliser `includeInactive` |
| `INVALID_DATE_RANGE` | Plage de dates invalide | Vérifier que startDate < endDate |
| `DATE_OUT_OF_EFFECT` | Dates hors période d'effet | Ajuster les dates ou la période d'effet |
| `NO_APPLICABLE_DATES` | Aucune date applicable | Vérifier la récurrence et les jours actifs |
| `SITE_MISMATCH` | Site non compatible | Vérifier la cohérence des sites |
| `ACTIVITY_TYPE_NOT_FOUND` | Type d'activité non trouvé | Créer le type d'activité manquant |
| `OPERATING_ROOM_NOT_FOUND` | Salle d'opération non trouvée | Vérifier l'ID de la salle |
| `ASSIGNMENT_CONFLICT` | Conflit d'affectation | Utiliser `forceOverwrite` ou `skipExistingAssignments` |
| `PERSONNEL_NOT_AVAILABLE` | Personnel habituel non disponible | Vérifier la disponibilité du personnel |

## Bonnes pratiques d'utilisation

### Authentification

- Utilisez toujours un token Bearer valide
- Les opérations de modification nécessitent des droits admin (`ADMIN_TOTAL` ou `ADMIN_PARTIEL`)

### Gestion des erreurs

```javascript
try {
  const response = await fetch('/api/trame-modeles/1/apply', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(applyData)
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    // Gestion des erreurs HTTP
    switch (response.status) {
      case 400:
        console.error('Données invalides:', result.error);
        break;
      case 404:
        console.error('Trame non trouvée:', result.error);
        break;
      case 409:
        console.error('Conflit:', result.error);
        break;
      default:
        console.error('Erreur inattendue:', result.error);
    }
    return;
  }
  
  // Gestion du succès
  if (result.success) {
    console.log(`✅ ${result.planningsCreated} plannings créés`);
  } else {
    console.warn('⚠️ Application partielle:', result.errors);
  }
  
  // Gestion des avertissements
  if (result.warnings.length > 0) {
    console.warn('Avertissements:', result.warnings);
  }
  
} catch (error) {
  console.error('Erreur réseau:', error);
}
```

### Pagination (future)

Pour de grandes collections, la pagination sera ajoutée :

```javascript
const response = await fetch('/api/trame-modeles?page=1&limit=20&sort=name');
```

### Validation côté client

```javascript
function validateTrameData(data) {
  const errors = [];
  
  if (!data.name?.trim()) {
    errors.push('Le nom est requis');
  }
  
  if (!data.dateDebutEffet) {
    errors.push('La date de début d\'effet est requise');
  }
  
  if (!Array.isArray(data.joursSemaineActifs) || data.joursSemaineActifs.length === 0) {
    errors.push('Au moins un jour de semaine doit être actif');
  }
  
  if (data.joursSemaineActifs?.some(day => day < 1 || day > 7)) {
    errors.push('Les jours de semaine doivent être entre 1 (Lundi) et 7 (Dimanche)');
  }
  
  return errors;
}
```

Cette spécification complète fournit toutes les informations nécessaires pour intégrer et utiliser le système de trames via les APIs.