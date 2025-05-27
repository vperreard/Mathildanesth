#!/bin/bash

# Script pour nettoyer Chrome et démarrer l'app proprement

echo "🧹 Nettoyage et démarrage de Mathildanesth..."

# Tuer tous les processus Chrome
echo "📍 Fermeture de Chrome..."
pkill -f "Google Chrome" 2>/dev/null || true

# Attendre un peu
sleep 2

# Vérifier si le port 3000 est occupé et le libérer si possible
echo "🔍 Vérification du port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Attendre un peu
sleep 1

# Démarrer Next.js sur le port 3000
echo "🚀 Démarrage du serveur Next.js sur le port 3000..."
PORT=3000 npm run dev &
SERVER_PID=$!

# Attendre que le serveur démarre et capturer le port réel
echo "⏳ Attente du démarrage du serveur..."
sleep 5

# Vérifier sur quel port le serveur a démarré
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    PORT_TO_USE=3000
else
    # Si pas sur 3000, chercher le port utilisé
    PORT_TO_USE=$(lsof -Pan -p $SERVER_PID -i | grep LISTEN | grep -oE ':[0-9]+' | grep -oE '[0-9]+' | head -1)
    if [ -z "$PORT_TO_USE" ]; then
        PORT_TO_USE=3000  # Fallback
    fi
fi

# Ouvrir Chrome avec un profil temporaire propre
echo "🌐 Ouverture de Chrome avec profil propre sur le port $PORT_TO_USE..."
open -n -a "Google Chrome" --args \
  --user-data-dir="/tmp/mathildanesth-chrome-profile" \
  --no-first-run \
  --no-default-browser-check \
  "http://localhost:$PORT_TO_USE"

echo "✅ Mathildanesth est lancé sur http://localhost:$PORT_TO_USE"
echo "💡 Utilisez Ctrl+C pour arrêter le serveur"

# Garder le script actif
wait