#!/bin/bash

echo "=== Test API pour le secteur Endoscopie ==="

# 1. Récupérer les secteurs
echo "1. Récupération des secteurs..."
SECTORS_RESPONSE=$(curl -s -H "x-user-role: ADMIN_TOTAL" http://localhost:3000/api/operating-sectors)
echo "Réponse secteurs: $SECTORS_RESPONSE"

# 2. Créer une nouvelle salle dans le secteur Endoscopie
echo "2. Création d'une salle dans le secteur Endoscopie..."
CREATE_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "x-user-role: ADMIN_TOTAL" \
  -d '{"name":"Test Salle Endo","number":"E-123","sector":"Endoscopie","colorCode":"#FF0000","isActive":true,"supervisionRules":{}}' \
  http://localhost:3000/api/operating-rooms)

echo "Réponse création: $CREATE_RESPONSE"

# Extraire l'ID de la salle créée
ROOM_ID=$(echo $CREATE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$ROOM_ID" ]; then
  echo "Erreur: Impossible d'extraire l'ID de la salle"
  exit 1
fi

echo "ID de la salle créée: $ROOM_ID"

# 3. Modifier la salle
echo "3. Modification de la salle..."
UPDATE_RESPONSE=$(curl -s -X PUT \
  -H "Content-Type: application/json" \
  -H "x-user-role: ADMIN_TOTAL" \
  -d '{"name":"Test Salle Endo Modifiée","number":"E-123","sector":"Endoscopie","colorCode":"#00FF00","isActive":true,"supervisionRules":{}}' \
  http://localhost:3000/api/operating-rooms/$ROOM_ID)

echo "Réponse modification: $UPDATE_RESPONSE"

# 4. Supprimer la salle
echo "4. Suppression de la salle..."
DELETE_RESPONSE=$(curl -s -X DELETE \
  -H "x-user-role: ADMIN_TOTAL" \
  http://localhost:3000/api/operating-rooms/$ROOM_ID)

echo "Réponse suppression: $DELETE_RESPONSE"

echo "=== Test terminé ===" 