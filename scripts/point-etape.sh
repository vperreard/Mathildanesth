#!/bin/bash
# scripts/point-etape.sh - Point d'étape complet du projet Mathildanesth

set -e

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$WORKSPACE_ROOT"

OUTPUT_DIR="logs/point-etape"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$OUTPUT_DIR/point-etape-$TIMESTAMP.md"

# Créer le dossier de logs s'il n'existe pas
mkdir -p "$OUTPUT_DIR"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonction pour l'en-tête
print_header() {
    echo -e "\n${BLUE}## $1${NC}"
    echo "## $1" >> "$REPORT_FILE"
}

# Fonction pour les sous-sections
print_subsection() {
    echo -e "\n${CYAN}### $1${NC}"
    echo "### $1" >> "$REPORT_FILE"
}

# Fonction pour les résultats
print_result() {
    local status="$1"
    local message="$2"
    local color="$3"
    
    echo -e "${color}$status${NC} $message"
    echo "$status $message" >> "$REPORT_FILE"
}

# Initialiser le rapport
cat > "$REPORT_FILE" << EOF
# 📊 Point d'Étape Projet - $(date +"%d/%m/%Y %H:%M")

> **Rapport automatique** - Analyse objective de l'état du projet Mathildanesth

---

EOF

echo -e "${PURPLE}🔍 POINT D'ÉTAPE PROJET MATHILDANESTH${NC}"
echo -e "${PURPLE}========================================${NC}"
echo "📅 Date: $(date)"
echo "📁 Workspace: $WORKSPACE_ROOT"
echo "📄 Rapport: $REPORT_FILE"

# 1. ANALYSE DU CODE
print_header "1. ANALYSE DU CODE"

echo "" >> "$REPORT_FILE"

# Architecture
print_subsection "Architecture"
APP_ROUTES=$(find src/app/api -name "route.ts" 2>/dev/null | wc -l)
APP_PAGES=$(find src/app -name "page.tsx" 2>/dev/null | wc -l)
COMPONENTS=$(find src/components -name "*.tsx" 2>/dev/null | wc -l)
MODULES=$(find src/modules -type d -maxdepth 1 2>/dev/null | grep -v "^src/modules$" | wc -l)

print_result "✅" "Routes API App Router: $APP_ROUTES"
print_result "✅" "Pages App Router: $APP_PAGES"
print_result "📦" "Composants React: $COMPONENTS"
print_result "🏗️" "Modules métier: $MODULES"

# Qualité du code
print_subsection "Qualité du Code"
TS_FILES=$(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)
TS_IGNORE=$(grep -r "@ts-ignore" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
ANY_TYPES=$(grep -r ": any\|as any" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)
TODO_COUNT=$(grep -r "TODO\|FIXME" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l)

print_result "📝" "Fichiers TypeScript: $TS_FILES"
if [ "$TS_IGNORE" -le 5 ]; then
    print_result "✅" "@ts-ignore: $TS_IGNORE (excellent)"
elif [ "$TS_IGNORE" -le 15 ]; then
    print_result "⚠️" "@ts-ignore: $TS_IGNORE (acceptable)"
else
    print_result "❌" "@ts-ignore: $TS_IGNORE (à réduire)"
fi

if [ "$ANY_TYPES" -le 20 ]; then
    print_result "✅" "Types 'any': $ANY_TYPES (bon)"
elif [ "$ANY_TYPES" -le 50 ]; then
    print_result "⚠️" "Types 'any': $ANY_TYPES (à améliorer)"
else
    print_result "❌" "Types 'any': $ANY_TYPES (problématique)"
fi

if [ "$TODO_COUNT" -le 30 ]; then
    print_result "✅" "TODO/FIXME: $TODO_COUNT (maîtrisé)"
elif [ "$TODO_COUNT" -le 80 ]; then
    print_result "⚠️" "TODO/FIXME: $TODO_COUNT (normal)"
else
    print_result "❌" "TODO/FIXME: $TODO_COUNT (nombreux)"
fi

# 2. TESTS
print_header "2. PASSAGE DES TESTS"

TEST_FILES=$(find src -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | wc -l)
TOTAL_FILES=$(find src -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)
COVERAGE_RATIO=$(echo "scale=1; $TEST_FILES * 100 / $TOTAL_FILES" | bc 2>/dev/null || echo "N/A")

print_subsection "Couverture de Tests"
print_result "📋" "Fichiers de test: $TEST_FILES"
print_result "📊" "Ratio de couverture: ${COVERAGE_RATIO}%"

if [ "$COVERAGE_RATIO" != "N/A" ]; then
    COVERAGE_INT=${COVERAGE_RATIO%.*}
    if [ "$COVERAGE_INT" -ge 70 ]; then
        print_result "✅" "Couverture excellente (>70%)"
    elif [ "$COVERAGE_INT" -ge 40 ]; then
        print_result "⚠️" "Couverture correcte (40-70%)"
    else
        print_result "❌" "Couverture insuffisante (<40%)"
    fi
fi

# Test du build
print_subsection "Build et Compilation"
echo "Test de compilation en cours..."
if npm run build > /dev/null 2>&1; then
    print_result "✅" "Build Next.js: SUCCÈS"
else
    print_result "❌" "Build Next.js: ÉCHEC"
fi

# 3. PERFORMANCES
print_header "3. PERFORMANCES"

print_subsection "Métriques de Base"
BUNDLE_SIZE=$(du -sh .next/static 2>/dev/null | cut -f1 || echo "N/A")
NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1 || echo "N/A")

print_result "📦" "Taille bundle: $BUNDLE_SIZE"
print_result "📁" "node_modules: $NODE_MODULES_SIZE"

# 4. ROADMAP ET TODO
print_header "4. ROADMAP ET TODO"

print_subsection "Fichiers de Suivi"
ROADMAP_FILES=$(find . -name "*roadmap*" -o -name "*ROADMAP*" 2>/dev/null | head -5 | wc -l)
TODO_FILES=$(find docs -name "*TODO*" -o -name "*todo*" 2>/dev/null | head -3 | wc -l)

print_result "🗺️" "Fichiers roadmap: $ROADMAP_FILES"
print_result "📝" "Fichiers TODO: $TODO_FILES"

# Analyse des TODO critiques de sécurité
if [ -f "docs/04_roadmap/URGENT_TODO_ACTION_PLAN.md" ]; then
    SECURITY_TODOS=$(grep -c "TODO de sécurité" docs/04_roadmap/URGENT_TODO_ACTION_PLAN.md 2>/dev/null || echo "0")
    if [ "$SECURITY_TODOS" -gt 0 ]; then
        print_result "🚨" "TODO de sécurité critiques détectés dans le plan d'action"
    fi
fi

# 5. IMPLÉMENTATIONS RÉCENTES
print_header "5. IMPLÉMENTATIONS RÉCENTES"

print_subsection "Commits Récents (7 derniers jours)"
RECENT_COMMITS=$(git log --since="7 days ago" --oneline 2>/dev/null | wc -l || echo "N/A")
if [ "$RECENT_COMMITS" != "N/A" ]; then
    print_result "📝" "Commits récents: $RECENT_COMMITS"
    if [ "$RECENT_COMMITS" -gt 0 ]; then
        echo "" >> "$REPORT_FILE"
        echo "Derniers commits:" >> "$REPORT_FILE"
        git log --since="7 days ago" --oneline --pretty=format:"- %s (%ar)" 2>/dev/null | head -5 >> "$REPORT_FILE" || true
    fi
fi

# Migration App Router
if [ ! -d "src/pages/api" ]; then
    print_result "✅" "Migration App Router: COMPLÈTE"
else
    print_result "⚠️" "Migration App Router: EN COURS"
fi

# 6. BILAN OBJECTIF
print_header "6. BILAN OBJECTIF"

cat >> "$REPORT_FILE" << EOF

### Points Forts
- Architecture Next.js moderne (App Router)
- Base de code TypeScript structurée
- Modules métier organisés
- Scripts d'audit et de monitoring

### Points d'Amélioration
EOF

echo -e "\n${GREEN}### POINTS FORTS${NC}"
echo "- Architecture Next.js moderne (App Router)"
echo "- Base de code TypeScript structurée" 
echo "- Modules métier organisés"
echo "- Scripts d'audit et de monitoring"

echo -e "\n${YELLOW}### POINTS D'AMÉLIORATION${NC}"
if [ "$TS_IGNORE" -gt 10 ]; then
    echo "- Réduire les @ts-ignore ($TS_IGNORE occurrences)"
    echo "- Réduire les @ts-ignore ($TS_IGNORE occurrences)" >> "$REPORT_FILE"
fi

if [ "$COVERAGE_RATIO" != "N/A" ] && [ "${COVERAGE_RATIO%.*}" -lt 50 ]; then
    echo "- Améliorer la couverture de tests (${COVERAGE_RATIO}%)"
    echo "- Améliorer la couverture de tests (${COVERAGE_RATIO}%)" >> "$REPORT_FILE"
fi

if [ "$TODO_COUNT" -gt 50 ]; then
    echo "- Traiter les TODO/FIXME prioritaires ($TODO_COUNT éléments)"
    echo "- Traiter les TODO/FIXME prioritaires ($TODO_COUNT éléments)" >> "$REPORT_FILE"
fi

# 7. PRÉCONISATIONS
print_header "7. PRÉCONISATIONS"

cat >> "$REPORT_FILE" << EOF

### Priorité Immédiate (Cette semaine)
EOF

echo -e "\n${RED}### PRIORITÉ IMMÉDIATE (Cette semaine)${NC}"

# Analyser la situation et donner des recommandations
if [ -f "docs/04_roadmap/URGENT_TODO_ACTION_PLAN.md" ]; then
    echo "1. 🚨 Traiter les TODO de sécurité critiques"
    echo "1. 🚨 Traiter les TODO de sécurité critiques" >> "$REPORT_FILE"
fi

if [ "$TS_IGNORE" -gt 15 ]; then
    echo "2. 🔧 Réduire les @ts-ignore les plus simples"
    echo "2. 🔧 Réduire les @ts-ignore les plus simples" >> "$REPORT_FILE"
fi

echo "3. ✅ Continuer les tests de validation"
echo "3. ✅ Continuer les tests de validation" >> "$REPORT_FILE"

cat >> "$REPORT_FILE" << EOF

### Priorité Moyenne (Prochaines semaines)
- Améliorer la couverture de tests
- Optimiser les performances
- Documentation des modules

### Priorité Basse (Backlog)
- Refactoring majeur si nécessaire
- Nouvelles fonctionnalités
- Optimisations avancées

---

**Rapport généré automatiquement le $(date)**
EOF

echo -e "\n${BLUE}### PRIORITÉ MOYENNE (Prochaines semaines)${NC}"
echo "- Améliorer la couverture de tests"
echo "- Optimiser les performances" 
echo "- Documentation des modules"

echo -e "\n${PURPLE}### PRIORITÉ BASSE (Backlog)${NC}"
echo "- Refactoring majeur si nécessaire"
echo "- Nouvelles fonctionnalités"
echo "- Optimisations avancées"

# 8. RÉCAPITULATIF
print_header "8. RÉCAPITULATIF"

echo -e "${GREEN}📊 Score global du projet:${NC}"
SCORE=0

# Calcul du score
[ "$APP_ROUTES" -gt 5 ] && SCORE=$((SCORE + 15))
[ "$TS_IGNORE" -le 10 ] && SCORE=$((SCORE + 20))
[ "$ANY_TYPES" -le 30 ] && SCORE=$((SCORE + 15))
[ "$TODO_COUNT" -le 50 ] && SCORE=$((SCORE + 10))
[ "$COVERAGE_RATIO" != "N/A" ] && [ "${COVERAGE_RATIO%.*}" -ge 40 ] && SCORE=$((SCORE + 20))
[ ! -d "src/pages/api" ] && SCORE=$((SCORE + 20))

if [ "$SCORE" -ge 80 ]; then
    echo -e "   ${GREEN}🏆 Excellent ($SCORE/100)${NC}"
elif [ "$SCORE" -ge 60 ]; then
    echo -e "   ${YELLOW}👍 Bon ($SCORE/100)${NC}"
elif [ "$SCORE" -ge 40 ]; then
    echo -e "   ${YELLOW}⚠️  Correct ($SCORE/100)${NC}"
else
    echo -e "   ${RED}❌ À améliorer ($SCORE/100)${NC}"
fi

echo ""
echo -e "${BLUE}📄 Rapport détaillé sauvegardé: $REPORT_FILE${NC}"
echo ""
echo -e "${PURPLE}💡 Pour lancer un point d'étape: ./scripts/point-etape.sh${NC}"
echo ""

# Proposer des actions immédiates
if [ "$TS_IGNORE" -gt 15 ] || [ "$TODO_COUNT" -gt 80 ]; then
    echo -e "${YELLOW}⚡ Actions suggérées maintenant:${NC}"
    [ "$TS_IGNORE" -gt 15 ] && echo "   ./scripts/audit-technical-debt.sh"
    [ -f "docs/04_roadmap/URGENT_TODO_ACTION_PLAN.md" ] && echo "   Consulter: docs/04_roadmap/URGENT_TODO_ACTION_PLAN.md"
fi

echo -e "\n${GREEN}✅ Point d'étape terminé!${NC}" 