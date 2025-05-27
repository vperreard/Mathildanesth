#!/bin/bash

echo "🧹 Préparation de Mathildanesth..."

# Tuer le processus sur le port 3000
echo "🔍 Libération du port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Attendre un peu
sleep 2

# Démarrer Next.js
echo "🚀 Démarrage de Mathildanesth sur le port 3000..."
npm run dev &

# Attendre le démarrage
sleep 4

# Ouvrir Chrome
echo "🌐 Ouverture de Chrome..."
open -a "Google Chrome" http://localhost:3000

echo "✅ Mathildanesth est lancé sur http://localhost:3000"
echo "💡 Utilisez Ctrl+C pour arrêter le serveur"

# Garder le script actif
wait