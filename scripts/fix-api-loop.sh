#!/bin/bash
# Script pour diagnostiquer et arrêter les boucles d'API

echo "🔍 Diagnostic boucle API /api/sites"
echo "=================================="

echo "1. Recherche des composants qui appellent /api/sites..."
grep -r "api/sites" src --include="*.tsx" --include="*.ts" | grep -v node_modules | head -10

echo ""
echo "2. Recherche des hooks problématiques..."
grep -r "useEffect.*\[\]" src --include="*.tsx" | grep -B2 -A2 "api/sites" | head -20

echo ""
echo "3. Solution temporaire:"
echo "   - Fermer l'onglet du navigateur"
echo "   - Arrêter le serveur dev (Ctrl+C)"
echo "   - Redémarrer avec: npm run dev"

echo ""
echo "4. Pour éviter les boucles:"
echo "   - Toujours ajouter des dépendances dans useEffect"
echo "   - Utiliser des guards pour éviter les re-renders"
echo "   - Implémenter un cache ou debounce"