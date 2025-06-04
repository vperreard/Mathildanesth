#!/bin/bash

# Script de Health Check pour Mathildanesth
# Vérifie l'état de santé global du projet

set -e

echo "🏥 HEALTH CHECK - MATHILDANESTH"
echo "================================"
echo "Date: $(date)"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compteurs
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Fonction pour afficher le résultat d'un check
check_result() {
    local status=$1
    local message=$2
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $message"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}✗${NC} $message"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $message"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
    fi
}

echo -e "${BLUE}1. VÉRIFICATION DES DÉPENDANCES${NC}"
echo "--------------------------------"

# Check Node version
NODE_VERSION=$(node -v)
if [[ $NODE_VERSION == v18.* ]] || [[ $NODE_VERSION == v20.* ]]; then
    check_result "PASS" "Node.js version: $NODE_VERSION"
else
    check_result "WARN" "Node.js version: $NODE_VERSION (recommandé: v18.x ou v20.x)"
fi

# Check npm version
NPM_VERSION=$(npm -v)
check_result "PASS" "npm version: $NPM_VERSION"

# Check des vulnérabilités
echo ""
echo -e "${BLUE}2. SÉCURITÉ${NC}"
echo "------------"

AUDIT_OUTPUT=$(npm audit --json 2>/dev/null || echo '{"metadata":{"vulnerabilities":{"total":999}}}')
TOTAL_VULNS=$(echo $AUDIT_OUTPUT | jq -r '.metadata.vulnerabilities.total // 999')
CRITICAL_VULNS=$(echo $AUDIT_OUTPUT | jq -r '.metadata.vulnerabilities.critical // 0')
HIGH_VULNS=$(echo $AUDIT_OUTPUT | jq -r '.metadata.vulnerabilities.high // 0')

if [ "$TOTAL_VULNS" -eq 0 ]; then
    check_result "PASS" "Aucune vulnérabilité détectée"
elif [ "$CRITICAL_VULNS" -gt 0 ]; then
    check_result "FAIL" "Vulnérabilités: $TOTAL_VULNS total ($CRITICAL_VULNS critiques, $HIGH_VULNS high)"
elif [ "$HIGH_VULNS" -gt 0 ]; then
    check_result "WARN" "Vulnérabilités: $TOTAL_VULNS total ($HIGH_VULNS high)"
else
    check_result "WARN" "Vulnérabilités: $TOTAL_VULNS total (non critiques)"
fi

# Check Prisma
echo ""
echo -e "${BLUE}3. BASE DE DONNÉES${NC}"
echo "-------------------"

if npx prisma validate >/dev/null 2>&1; then
    check_result "PASS" "Schema Prisma valide"
else
    check_result "FAIL" "Schema Prisma invalide"
fi

# Check si Prisma client est généré
if [ -d "node_modules/.prisma/client" ]; then
    check_result "PASS" "Prisma Client généré"
else
    check_result "FAIL" "Prisma Client non généré (exécuter: npx prisma generate)"
fi

# Check des tests
echo ""
echo -e "${BLUE}4. TESTS${NC}"
echo "---------"

# Exécuter un test simple pour vérifier que Jest fonctionne
if npm test -- --listTests >/dev/null 2>&1; then
    check_result "PASS" "Configuration Jest valide"
    
    # Compter les tests
    TEST_COUNT=$(npm test -- --listTests 2>/dev/null | wc -l)
    check_result "PASS" "Tests disponibles: $TEST_COUNT fichiers"
else
    check_result "FAIL" "Configuration Jest invalide"
fi

# Check TypeScript
echo ""
echo -e "${BLUE}5. QUALITÉ DU CODE${NC}"
echo "-------------------"

# Vérifier la compilation TypeScript
if npx tsc --noEmit >/dev/null 2>&1; then
    check_result "PASS" "Code TypeScript compile sans erreur"
else
    TSC_ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0")
    check_result "WARN" "Erreurs TypeScript: $TSC_ERRORS"
fi

# Check ESLint
if npm run lint >/dev/null 2>&1; then
    check_result "PASS" "Aucune erreur ESLint"
else
    LINT_ERRORS=$(npm run lint 2>&1 | grep -c "error" || echo "0")
    check_result "WARN" "Erreurs ESLint détectées: $LINT_ERRORS"
fi

# Check environnement
echo ""
echo -e "${BLUE}6. ENVIRONNEMENT${NC}"
echo "-----------------"

if [ -f ".env" ]; then
    check_result "PASS" "Fichier .env présent"
else
    check_result "FAIL" "Fichier .env manquant"
fi

if [ -f ".env.example" ]; then
    check_result "PASS" "Fichier .env.example présent"
else
    check_result "WARN" "Fichier .env.example manquant"
fi

# Check build
echo ""
echo -e "${BLUE}7. BUILD${NC}"
echo "---------"

if [ -d ".next" ]; then
    BUILD_AGE=$(find .next -maxdepth 0 -mtime +7 | wc -l)
    if [ "$BUILD_AGE" -eq 0 ]; then
        check_result "PASS" "Build Next.js récent (< 7 jours)"
    else
        check_result "WARN" "Build Next.js ancien (> 7 jours)"
    fi
else
    check_result "WARN" "Aucun build Next.js trouvé"
fi

# Résumé
echo ""
echo -e "${BLUE}RÉSUMÉ${NC}"
echo "======="
echo "Total des vérifications: $TOTAL_CHECKS"
echo -e "${GREEN}Réussies: $PASSED_CHECKS${NC}"
echo -e "${YELLOW}Avertissements: $WARNING_CHECKS${NC}"
echo -e "${RED}Échecs: $FAILED_CHECKS${NC}"

# Score de santé
HEALTH_SCORE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
echo ""
echo -n "Score de santé: "

if [ $HEALTH_SCORE -ge 90 ]; then
    echo -e "${GREEN}${HEALTH_SCORE}% - EXCELLENT${NC}"
    EXIT_CODE=0
elif [ $HEALTH_SCORE -ge 70 ]; then
    echo -e "${YELLOW}${HEALTH_SCORE}% - BON${NC}"
    EXIT_CODE=0
elif [ $HEALTH_SCORE -ge 50 ]; then
    echo -e "${YELLOW}${HEALTH_SCORE}% - MOYEN${NC}"
    EXIT_CODE=1
else
    echo -e "${RED}${HEALTH_SCORE}% - CRITIQUE${NC}"
    EXIT_CODE=2
fi

# Actions recommandées
if [ $FAILED_CHECKS -gt 0 ] || [ $WARNING_CHECKS -gt 0 ]; then
    echo ""
    echo -e "${BLUE}ACTIONS RECOMMANDÉES:${NC}"
    
    if [ "$TOTAL_VULNS" -gt 0 ] && [ "$TOTAL_VULNS" -ne 999 ]; then
        echo "• Exécuter: npm audit fix"
    fi
    
    if [ ! -d "node_modules/.prisma/client" ]; then
        echo "• Exécuter: npx prisma generate"
    fi
    
    if [ ! -f ".env" ]; then
        echo "• Créer le fichier .env (copier depuis .env.example)"
    fi
    
    if [ ! -d ".next" ] || [ "$BUILD_AGE" -gt 0 ]; then
        echo "• Exécuter: npm run build"
    fi
fi

echo ""
echo "Health check terminé à $(date +%H:%M:%S)"
exit $EXIT_CODE