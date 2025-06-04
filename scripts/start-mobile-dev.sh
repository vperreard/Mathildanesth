#!/bin/bash

echo "🏥 Démarrage Mathildanesth - Mode Développement Mobile"
echo "===================================================="

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}📱 Initialisation de l'environnement mobile...${NC}"

# Vérifications préliminaires
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé"
    echo "   Assurez-vous d'être dans le répertoire Mathildanesth"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
    npm install
fi

# Nettoyage du cache Next.js
echo -e "${BLUE}🧹 Nettoyage du cache...${NC}"
rm -rf .next
rm -rf out

# Vérification des fichiers mobiles critiques
echo -e "${BLUE}✅ Vérification des composants mobiles...${NC}"

critical_files=(
    "src/styles/globals.css"
    "src/components/ui/MedicalCard.tsx"
    "src/components/layout/ProductionLayout.tsx"
    "public/manifest.json"
    "public/sw.js"
)

for file in "${critical_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "❌ $file manquant"
    fi
done

echo ""
echo -e "${BLUE}🚀 Démarrage du serveur de développement...${NC}"
echo ""
echo -e "${YELLOW}📱 URLs de test disponibles:${NC}"
echo "   Dashboard principal:    http://localhost:3000/"
echo "   Design System:          http://localhost:3000/design-system"
echo "   Demo Mobile:            http://localhost:3000/demo-mobile"
echo ""
echo -e "${YELLOW}📋 Tests mobiles recommandés:${NC}"
echo "   1. Ouvrir DevTools (F12)"
echo "   2. Cliquer sur l'icône mobile (Toggle device toolbar)"
echo "   3. Sélectionner iPhone 14 Pro ou Pixel 7"
echo "   4. Tester les touch targets et la navigation"
echo ""
echo -e "${YELLOW}🏥 Fonctionnalités médicales à tester:${NC}"
echo "   • Bottom navigation avec badges"
echo "   • Cards médicales (Guard, OnCall, Vacation, Rest)"
echo "   • Notifications contextuelles"
echo "   • Panel d'urgence"
echo "   • Actions rapides"
echo ""

# Démarrage avec gestion des erreurs
echo -e "${GREEN}▶️  Lancement en cours...${NC}"
echo ""

# Option pour désactiver temporairement les types stricts
export NEXT_TYPESCRIPT_BUILD_ERRORS=false

npm run dev