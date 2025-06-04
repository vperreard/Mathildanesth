#!/bin/bash

# Script pour exécuter les tests d'intégration des API routes et services

echo "🧪 Exécution des tests d'intégration..."
echo "========================================="

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Fonction pour afficher le statut
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Tests des API routes
echo -e "\n${YELLOW}📁 Tests des API Routes${NC}"
echo "------------------------"

# Auth routes
echo -e "\n🔐 Tests Authentication:"
npm test -- src/tests/integration/api/auth/login.test.ts --silent
print_status $? "Login endpoint"

npm test -- src/tests/integration/api/auth/me.test.ts --silent
print_status $? "Me endpoint"

npm test -- src/tests/integration/api/auth/logout.test.ts --silent
print_status $? "Logout endpoint"

npm test -- src/tests/integration/api/auth/change-password.test.ts --silent
print_status $? "Change password endpoint"

# Leaves routes
echo -e "\n🌴 Tests Leaves:"
npm test -- src/tests/integration/api/leaves/route.test.ts --silent
print_status $? "Leaves CRUD"

npm test -- src/tests/integration/api/leaves/types.test.ts --silent
print_status $? "Leave types"

npm test -- src/tests/integration/api/leaves/quotas.test.ts --silent
print_status $? "Leave quotas"

# Planning routes
echo -e "\n📅 Tests Planning:"
npm test -- src/tests/integration/api/planning/generate.test.ts --silent
print_status $? "Planning generation"

npm test -- src/tests/integration/api/planning/bloc.test.ts --silent
print_status $? "Bloc planning"

# Tests des services
echo -e "\n${YELLOW}⚙️  Tests des Services${NC}"
echo "---------------------"

npm test -- src/services/__tests__/userService.test.ts --silent
print_status $? "User Service"

npm test -- src/services/__tests__/dashboardService.test.ts --silent
print_status $? "Dashboard Service"

npm test -- src/services/__tests__/calendarService.test.ts --silent
print_status $? "Calendar Service"

# Génération du rapport de couverture
echo -e "\n${YELLOW}📊 Génération du rapport de couverture${NC}"
echo "--------------------------------------"

# Exécution avec couverture pour les modules critiques
npm test -- --coverage \
    --collectCoverageFrom='src/app/api/**/*.{ts,tsx}' \
    --collectCoverageFrom='src/services/**/*.{ts,tsx}' \
    --collectCoverageFrom='src/lib/auth*.{ts,tsx}' \
    --collectCoverageFrom='!src/**/*.test.{ts,tsx}' \
    --collectCoverageFrom='!src/**/__tests__/**' \
    --coverageThreshold='{"global":{"branches":70,"functions":70,"lines":70,"statements":70}}' \
    --silent

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Tous les tests sont passés avec succès!${NC}"
    echo -e "${GREEN}📈 Couverture de code atteinte: ≥70%${NC}"
else
    echo -e "\n${RED}❌ Des tests ont échoué ou la couverture est insuffisante${NC}"
    echo -e "${YELLOW}💡 Vérifiez les erreurs ci-dessus et ajoutez des tests si nécessaire${NC}"
fi

# Résumé
echo -e "\n${YELLOW}📝 Résumé des tests créés${NC}"
echo "========================="
echo "✓ 4 tests pour les endpoints d'authentification"
echo "✓ 3 tests pour les endpoints de congés"  
echo "✓ 2 tests pour les endpoints de planning"
echo "✓ 3 tests pour les services critiques"
echo ""
echo "Total: 12 nouveaux fichiers de tests d'intégration"

# Afficher le chemin du rapport de couverture
echo -e "\n${YELLOW}📂 Rapport de couverture disponible dans:${NC}"
echo "coverage/lcov-report/index.html"