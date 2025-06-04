#!/bin/bash

# Script d'audit de la dette technique - Mathildanesth
# Usage: ./scripts/audit-technical-debt.sh [--summary] [--export-json]

set -e

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$WORKSPACE_ROOT"

OUTPUT_DIR="logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
AUDIT_FILE="$OUTPUT_DIR/technical-debt-audit-$TIMESTAMP.txt"
JSON_FILE="$OUTPUT_DIR/technical-debt-audit-$TIMESTAMP.json"

# Créer le dossier de logs s'il n'existe pas
mkdir -p "$OUTPUT_DIR"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les en-têtes
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Fonction pour compter et afficher les occurrences
count_and_display() {
    local pattern="$1"
    local title="$2"
    local color="$3"
    
    print_header "$title"
    
    # Recherche avec ripgrep pour de meilleures performances
    if command -v rg &> /dev/null; then
        local results=$(rg -n --type ts --type tsx --type js --type jsx "$pattern" src/ || true)
        local count=$(echo "$results" | grep -c . || echo "0")
        
        echo -e "${color}Total trouvé: $count${NC}"
        echo ""
        
        if [ "$count" -gt 0 ]; then
            echo "$results" | while IFS= read -r line; do
                if [ -n "$line" ]; then
                    file=$(echo "$line" | cut -d: -f1)
                    line_num=$(echo "$line" | cut -d: -f2)
                    content=$(echo "$line" | cut -d: -f3-)
                    echo -e "  ${YELLOW}$file:$line_num${NC} - $(echo "$content" | xargs)"
                fi
            done
        fi
        
        return $count
    else
        # Fallback avec grep si ripgrep n'est pas disponible
        local results=$(find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -n "$pattern" 2>/dev/null || true)
        local count=$(echo "$results" | grep -c . || echo "0")
        
        echo -e "${color}Total trouvé: $count${NC}"
        echo ""
        
        if [ "$count" -gt 0 ]; then
            echo "$results" | while IFS= read -r line; do
                if [ -n "$line" ]; then
                    echo -e "  ${YELLOW}$line${NC}"
                fi
            done
        fi
        
        return $count
    fi
}

# Fonction pour analyser le contexte des @ts-ignore
analyze_ts_ignore_context() {
    print_header "ANALYSE CONTEXTUELLE DES @ts-ignore"
    
    if command -v rg &> /dev/null; then
        rg -A 3 -B 1 "@ts-ignore" src/ --type ts --type tsx | while IFS= read -r line; do
            echo "$line"
        done
    fi
}

# Fonction pour analyser les TODO/FIXME par catégorie
analyze_todos_by_category() {
    print_header "ANALYSE DES TODO/FIXME PAR CATÉGORIE"
    
    echo -e "${YELLOW}Catégories identifiées:${NC}"
    
    # TODO simples
    local simple_todos=$(rg -i "todo:?\s*(fix|add|remove|update|implement)\s+\w+" src/ --type ts --type tsx --type js --type jsx -c 2>/dev/null || echo "0")
    echo "  - TODO simples: $simple_todos"
    
    # FIXME critiques
    local critical_fixmes=$(rg -i "fixme:?\s*(bug|error|critical|urgent)" src/ --type ts --type tsx --type js --type jsx -c 2>/dev/null || echo "0")
    echo "  - FIXME critiques: $critical_fixmes"
    
    # TODO d'architecture
    local arch_todos=$(rg -i "todo:?\s*(refactor|architecture|design|pattern)" src/ --type ts --type tsx --type js --type jsx -c 2>/dev/null || echo "0")
    echo "  - TODO architecture: $arch_todos"
}

# Fonction pour générer des suggestions de priorité
generate_priority_suggestions() {
    print_header "SUGGESTIONS DE PRIORITÉ"
    
    echo -e "${GREEN}Priorité HAUTE (résolution rapide):${NC}"
    echo "  - @ts-ignore sur des propriétés simples"
    echo "  - @ts-ignore avec 'any' explicite"
    echo "  - TODO de documentation manquante"
    
    echo -e "${YELLOW}Priorité MOYENNE:${NC}"
    echo "  - @ts-ignore sur des types complexes mais documentés"
    echo "  - FIXME avec solution évidente"
    echo "  - TODO de refactoring localisé"
    
    echo -e "${RED}Priorité BASSE (tickets GitHub):${NC}"
    echo "  - @ts-ignore sur des intégrations tierces"
    echo "  - TODO d'architecture majeure"
    echo "  - FIXME nécessitant une analyse approfondie"
}

# Fonction pour exporter en JSON
export_to_json() {
    print_header "EXPORT JSON"
    
    cat > "$JSON_FILE" << EOF
{
  "audit_date": "$(date -Iseconds)",
  "workspace": "$WORKSPACE_ROOT",
  "summary": {
    "ts_ignore_count": $ts_ignore_count,
    "todo_count": $todo_count,
    "fixme_count": $fixme_count,
    "total_debt_items": $((ts_ignore_count + todo_count + fixme_count))
  },
  "targets": {
    "ts_ignore_target": $((ts_ignore_count / 2)),
    "todo_fixme_target": $(((todo_count + fixme_count) * 2 / 5))
  },
  "files_analyzed": [
EOF
    
    find src/ -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | head -20 | sed 's/.*/"&"/' | paste -sd ',' >> "$JSON_FILE"
    
    cat >> "$JSON_FILE" << EOF
  ]
}
EOF
    
    echo "Export JSON créé: $JSON_FILE"
}

# MAIN EXECUTION
echo -e "${BLUE}🔍 AUDIT DE LA DETTE TECHNIQUE - MATHILDANESTH${NC}"
echo "Démarrage de l'audit à $(date)"
echo "Workspace: $WORKSPACE_ROOT"

# Rediriger la sortie vers le fichier de log
exec > >(tee "$AUDIT_FILE")

# Compter les @ts-ignore
count_and_display "@ts-ignore" "@TS-IGNORE OCCURRENCES" "$RED"
ts_ignore_count=$?

# Compter les TODO
count_and_display "TODO" "TODO OCCURRENCES" "$YELLOW" 
todo_count=$?

# Compter les FIXME
count_and_display "FIXME" "FIXME OCCURRENCES" "$RED"
fixme_count=$?

# Analyses contextuelles
analyze_ts_ignore_context
analyze_todos_by_category
generate_priority_suggestions

# Résumé final
print_header "RÉSUMÉ DE L'AUDIT"
total_debt=$((ts_ignore_count + todo_count + fixme_count))
ts_ignore_target=$((ts_ignore_count / 2))
todo_fixme_target=$(((todo_count + fixme_count) * 2 / 5))

echo -e "${RED}📊 SITUATION ACTUELLE:${NC}"
echo "  - @ts-ignore: $ts_ignore_count"
echo "  - TODO: $todo_count" 
echo "  - FIXME: $fixme_count"
echo "  - Total dette technique: $total_debt éléments"

echo -e "\n${GREEN}🎯 OBJECTIFS:${NC}"
echo "  - Réduire @ts-ignore à: < $ts_ignore_target (réduction de 50%)"
echo "  - Réduire TODO/FIXME à: < $todo_fixme_target (réduction de 60%)"

echo -e "\n${BLUE}📁 RAPPORT SAUVEGARDÉ:${NC}"
echo "  - Détails: $AUDIT_FILE"

# Export JSON si demandé
if [[ "$1" == "--export-json" ]] || [[ "$2" == "--export-json" ]]; then
    export_to_json
fi

echo -e "\n${GREEN}✅ Audit terminé avec succès!${NC}" 