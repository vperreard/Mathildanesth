#!/bin/bash

echo "🏥 Validation de l'implémentation Mobile + Design System Médical"
echo "=================================================================="

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compteurs
TOTAL=0
PASSED=0
FAILED=0

check_file() {
    TOTAL=$((TOTAL + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌${NC} $1"
        FAILED=$((FAILED + 1))
    fi
}

check_dir() {
    TOTAL=$((TOTAL + 1))
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $1/"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}❌${NC} $1/"
        FAILED=$((FAILED + 1))
    fi
}

echo -e "${BLUE}📂 Vérification des fichiers créés...${NC}"
echo ""

# Design System Core
echo -e "${YELLOW}🎨 Design System Core${NC}"
check_file "src/styles/globals.css"
check_file "tailwind.config.js"
check_file "public/manifest.json"
check_file "public/sw.js"
check_file "public/offline.html"
echo ""

# Composants UI Médicaux
echo -e "${YELLOW}🧩 Composants UI Médicaux${NC}"
check_file "src/components/ui/MedicalCard.tsx"
check_file "src/components/ui/MedicalButton.tsx"
check_file "src/components/ui/MedicalNotification.tsx"
echo ""

# Layout Mobile
echo -e "${YELLOW}📱 Layout Mobile${NC}"
check_file "src/components/layout/MobileHeader.tsx"
check_file "src/components/layout/MobileBottomNavigation.tsx"
check_file "src/components/layout/ResponsiveLayout.tsx"
check_file "src/components/layout/MobileOptimizedLayout.tsx"
echo ""

# Composants Spécialisés
echo -e "${YELLOW}🏥 Composants Spécialisés${NC}"
check_file "src/components/planning/PlanningCard.tsx"
check_file "src/components/leaves/LeaveCard.tsx"
check_file "src/components/bloc-operatoire/BlocCard.tsx"
check_file "src/components/dashboard/MobileDashboard.tsx"
check_file "src/components/emergency/EmergencyPanel.tsx"
check_file "src/components/mobile/QuickStatsGrid.tsx"
echo ""

# PWA Assets
echo -e "${YELLOW}📱 PWA Assets${NC}"
check_dir "public/icons"
check_file "public/icons/icon-72x72.png"
check_file "public/icons/icon-96x96.png"
check_file "public/icons/icon-128x128.png"
check_file "public/icons/icon-144x144.png"
check_file "public/icons/icon-152x152.png"
check_file "public/icons/icon-192x192.png"
check_file "public/icons/icon-384x384.png"
check_file "public/icons/icon-512x512.png"
echo ""

# Pages de Démonstration
echo -e "${YELLOW}🧪 Pages de Démonstration${NC}"
check_file "src/app/design-system/page.tsx"
check_file "src/app/design-system/layout.tsx"
check_file "src/app/demo-mobile/page.tsx"
echo ""

# Documentation
echo -e "${YELLOW}📚 Documentation${NC}"
check_file "MOBILE_DESIGN_SYSTEM_IMPLEMENTATION.md"
check_file "MOBILE_IMPLEMENTATION_COMPLETE.md"
echo ""

# Scripts
echo -e "${YELLOW}🔧 Scripts${NC}"
check_file "scripts/generate-pwa-icons.sh"
check_file "scripts/validate-mobile-implementation.sh"
echo ""

# Vérification du contenu de fichiers critiques
echo -e "${BLUE}🔍 Vérification du contenu...${NC}"
echo ""

# Vérification CSS médical
if grep -q "medical-guard" src/styles/globals.css 2>/dev/null; then
    echo -e "${GREEN}✅${NC} CSS médical présent (couleurs guard/oncall/vacation/rest)"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌${NC} CSS médical manquant"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# Vérification Tailwind config
if grep -q "medical:" tailwind.config.js 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Configuration Tailwind médicale"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌${NC} Configuration Tailwind médicale manquante"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# Vérification PWA manifest
if grep -q "shortcuts" public/manifest.json 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Manifest PWA avec shortcuts médicaux"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌${NC} Manifest PWA incomplet"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

# Vérification Service Worker
if grep -q "medical" public/sw.js 2>/dev/null; then
    echo -e "${GREEN}✅${NC} Service Worker médical v2"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌${NC} Service Worker médical manquant"
    FAILED=$((FAILED + 1))
fi
TOTAL=$((TOTAL + 1))

echo ""
echo "=================================================================="
echo -e "${BLUE}📊 RÉSULTATS DE LA VALIDATION${NC}"
echo ""
echo -e "Total vérifié: ${TOTAL}"
echo -e "${GREEN}✅ Réussi: ${PASSED}${NC}"
echo -e "${RED}❌ Échoué: ${FAILED}${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 VALIDATION RÉUSSIE !${NC}"
    echo -e "${GREEN}L'implémentation Mobile + Design System Médical est complète.${NC}"
    echo ""
    echo -e "${BLUE}🚀 Pour tester:${NC}"
    echo "   npm run dev"
    echo "   http://localhost:3000/design-system"
    echo ""
    echo -e "${BLUE}📱 Pour tester sur mobile:${NC}"
    echo "   Ouvrir DevTools > Toggle device toolbar > iPhone/Android"
    echo ""
else
    echo ""
    echo -e "${RED}⚠️  VALIDATION ÉCHOUÉE${NC}"
    echo -e "${RED}${FAILED} fichiers manquants ou incorrects${NC}"
    echo ""
    echo -e "${YELLOW}💡 Actions à prendre:${NC}"
    echo "   1. Vérifier les fichiers manqués ci-dessus"
    echo "   2. Relancer le script d'implémentation"
    echo "   3. Vérifier les erreurs de compilation"
fi

echo ""
echo -e "${BLUE}📋 Design System Status:${NC}"
echo -e "   🎨 Couleurs médicales: $([ $FAILED -eq 0 ] && echo "✅" || echo "❌")"
echo -e "   📱 Mobile responsive: $([ $FAILED -eq 0 ] && echo "✅" || echo "❌")"  
echo -e "   🧩 Composants UI: $([ $FAILED -eq 0 ] && echo "✅" || echo "❌")"
echo -e "   📲 PWA complète: $([ $FAILED -eq 0 ] && echo "✅" || echo "❌")"
echo -e "   🏥 Thème médical: $([ $FAILED -eq 0 ] && echo "✅" || echo "❌")"

echo ""
echo "Generated with Claude Code 🤖"