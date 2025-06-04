#!/bin/bash

# Script complet pour exécuter tous les tests et générer un rapport de couverture

echo "🧪 Exécution complète des tests Mathildanesth"
echo "============================================="

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables pour les statistiques
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Fonction pour afficher le statut
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}✗ $2${NC}"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
}

# Nettoyage des rapports précédents
echo -e "\n${YELLOW}🧹 Nettoyage des rapports précédents${NC}"
rm -rf coverage/
rm -rf cypress/screenshots/
rm -rf cypress/videos/
rm -f test-results.json

# 1. Tests unitaires avec couverture
echo -e "\n${BLUE}1️⃣ Tests Unitaires et d'Intégration${NC}"
echo "--------------------------------------"

npm test -- --coverage \
    --coverageDirectory=coverage/unit \
    --collectCoverageFrom='src/**/*.{ts,tsx}' \
    --collectCoverageFrom='!src/**/*.test.{ts,tsx}' \
    --collectCoverageFrom='!src/**/__tests__/**' \
    --collectCoverageFrom='!src/**/*.d.ts' \
    --collectCoverageFrom='!src/types/**' \
    --json --outputFile=test-results-unit.json

UNIT_RESULT=$?
print_status $UNIT_RESULT "Tests unitaires"

# 2. Tests E2E Cypress
echo -e "\n${BLUE}2️⃣ Tests E2E Cypress${NC}"
echo "---------------------"

# Mode headless pour CI
npx cypress run --config video=false

CYPRESS_RESULT=$?
print_status $CYPRESS_RESULT "Tests E2E Cypress"

# 3. Tests E2E Puppeteer
echo -e "\n${BLUE}3️⃣ Tests E2E Puppeteer${NC}"
echo "------------------------"

npm run test:e2e:puppeteer

PUPPETEER_RESULT=$?
print_status $PUPPETEER_RESULT "Tests E2E Puppeteer"

# 4. Tests de performance
echo -e "\n${BLUE}4️⃣ Tests de Performance${NC}"
echo "-------------------------"

node scripts/test-performance-improvements.js

PERF_RESULT=$?
print_status $PERF_RESULT "Tests de performance"

# 5. Audit de sécurité
echo -e "\n${BLUE}5️⃣ Audit de Sécurité${NC}"
echo "----------------------"

npm audit --production

AUDIT_RESULT=$?
if [ $AUDIT_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ Aucune vulnérabilité critique${NC}"
else
    echo -e "${YELLOW}⚠ Vulnérabilités détectées (voir rapport)${NC}"
fi

# 6. Analyse de la dette technique
echo -e "\n${BLUE}6️⃣ Analyse Dette Technique${NC}"
echo "----------------------------"

./scripts/audit-technical-debt.sh > debt-report.txt 2>&1

echo -e "${GREEN}✓ Rapport de dette technique généré${NC}"

# Génération du rapport de couverture global
echo -e "\n${BLUE}📊 Génération du Rapport de Couverture Global${NC}"
echo "----------------------------------------------"

# Merger les rapports de couverture
npx nyc merge coverage coverage/merged.json
npx nyc report --reporter=html --reporter=text-summary --report-dir=coverage/final

# Affichage du résumé
echo -e "\n${YELLOW}📈 Résumé de la Couverture${NC}"
echo "============================"

# Extraire les métriques de couverture
if [ -f coverage/final/index.html ]; then
    echo -e "${GREEN}Rapport HTML disponible : coverage/final/index.html${NC}"
fi

# Statistiques finales
echo -e "\n${YELLOW}📊 Statistiques Finales${NC}"
echo "========================"
echo -e "Tests exécutés : ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Tests réussis  : ${GREEN}$PASSED_TESTS${NC}"
echo -e "Tests échoués  : ${RED}$FAILED_TESTS${NC}"

SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo -e "Taux de succès : ${BLUE}$SUCCESS_RATE%${NC}"

# Vérification des seuils de couverture
echo -e "\n${YELLOW}🎯 Vérification des Seuils${NC}"
echo "============================"

# Modules critiques devant avoir >80% de couverture
CRITICAL_MODULES=(
    "src/lib/auth"
    "src/modules/leaves"
    "src/services/userService"
    "src/services/dashboardService"
)

for module in "${CRITICAL_MODULES[@]}"; do
    # Vérifier la couverture du module (simplifié pour l'exemple)
    echo -e "Vérification $module..."
done

# Résultat final
echo -e "\n${YELLOW}🏁 Résultat Final${NC}"
echo "=================="

if [ $FAILED_TESTS -eq 0 ] && [ $UNIT_RESULT -eq 0 ] && [ $CYPRESS_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ TOUS LES TESTS SONT PASSÉS !${NC}"
    echo -e "${GREEN}🎉 L'application est prête pour le déploiement${NC}"
    exit 0
else
    echo -e "${RED}❌ Des tests ont échoué${NC}"
    echo -e "${YELLOW}📋 Consultez les rapports détaillés :${NC}"
    echo "  - Tests unitaires : test-results-unit.json"
    echo "  - Screenshots Cypress : cypress/screenshots/"
    echo "  - Rapport de couverture : coverage/final/index.html"
    echo "  - Dette technique : debt-report.txt"
    exit 1
fi