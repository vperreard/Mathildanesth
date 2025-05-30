#!/bin/bash

# 🚀 SCRIPT DEMARRAGE ENVIRONNEMENT TEST
echo "🚀 Démarrage environnement test Mathildanesth..."

# Vérifier si le serveur tourne déjà
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Serveur déjà démarré sur port 3000"
else
    echo "🔄 Démarrage du serveur dev..."
    npm run dev &
    
    # Attendre que le serveur soit prêt
    echo "⏳ Attente du serveur..."
    while ! curl -s http://localhost:3000 > /dev/null; do
        sleep 2
        echo "   ... en attente"
    done
    echo "✅ Serveur prêt !"
fi

# Optionnel: Seeder la base de données de test
if [ "$1" == "--seed" ]; then
    echo "🌱 Seeding base de données de test..."
    npm run seed
fi

echo "🎯 Environnement prêt pour les tests !"
echo ""
echo "Commands disponibles:"
echo "  npm run cypress:open     # Interface Cypress"
echo "  npm run cypress:run      # Tests headless"
echo "  npm run test:e2e         # Tests Puppeteer"
echo ""
