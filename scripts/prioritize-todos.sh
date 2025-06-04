#!/bin/bash

# Script de priorisation des TODO/FIXME - Mathildanesth
# Usage: ./scripts/prioritize-todos.sh [--export-json]

set -e

WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$WORKSPACE_ROOT"

echo "🔍 PRIORISATION DES TODO/FIXME - MATHILDANESTH"
echo "Démarrage de l'analyse à $(date)"
echo "Workspace: $WORKSPACE_ROOT"
echo

# Vérifier que ripgrep est installé
if ! command -v rg &> /dev/null; then
    echo "❌ ripgrep (rg) n'est pas installé. Installation requise."
    echo "   macOS: brew install ripgrep"
    echo "   Ubuntu: apt install ripgrep"
    exit 1
fi

# Fonction pour compter et catégoriser les TODO/FIXME
categorize_todos() {
    local pattern="$1"
    local category="$2"
    local priority="$3"
    
    echo "=== $category ($priority) ==="
    
    local count=$(rg -i "$pattern" \
        --glob "*.ts" --glob "*.tsx" --glob "*.js" --glob "*.jsx" \
        --glob "!node_modules/**" \
        --glob "!.next/**" \
        --glob "!coverage/**" \
        --glob "!dist/**" \
        --glob "!build/**" \
        --count-matches 2>/dev/null | \
        awk -F: '{sum += $2} END {print sum+0}')
    
    echo "Total trouvé: $count"
    echo
    
    if [ "$count" -gt 0 ]; then
        rg -i "$pattern" \
            --glob "*.ts" --glob "*.tsx" --glob "*.js" --glob "*.jsx" \
            --glob "!node_modules/**" \
            --glob "!.next/**" \
            --glob "!coverage/**" \
            --glob "!dist/**" \
            --glob "!build/**" \
            -n --no-heading \
            2>/dev/null | head -20
        
        if [ "$count" -gt 20 ]; then
            echo "... et $((count - 20)) autres occurrences"
        fi
    fi
    
    echo
    return $count
}

# Catégories par priorité critique - patterns simplifiés
echo "🚨 PRIORITÉ CRITIQUE - SÉCURITÉ"
categorize_todos "TODO.*(auth|permission|security|vérif|droits|admin)" "Sécurité/Authentification" "CRITIQUE"
security_count=$?

echo "🔥 PRIORITÉ HAUTE - API PRODUCTION"
categorize_todos "TODO.*(API|route|endpoint|remplacer.*mock|appel.*réel)" "APIs et Routes" "HAUTE"
api_count=$?

echo "⚠️ PRIORITÉ HAUTE - TYPES MANQUANTS"
categorize_todos "TODO.*(type|typage|prisma|@ts)" "Types et Prisma" "HAUTE"
types_count=$?

echo "📊 PRIORITÉ MOYENNE - FONCTIONNALITÉS"
categorize_todos "TODO.*(implement|ajouter|gérer|logique)" "Implémentations manquantes" "MOYENNE"
impl_count=$?

echo "📝 PRIORITÉ BASSE - DOCUMENTATION"
categorize_todos "TODO.*(doc|comment|guide|readme)" "Documentation" "BASSE"
doc_count=$?

# Compter tous les TODO/FIXME restants
echo "📋 TOUS LES TODO/FIXME"
categorize_todos "(TODO|FIXME)" "Tous TODO/FIXME" "GLOBAL"
all_todos=$?

# Calcul des totaux
total_critical=$((security_count + api_count))
total_high=$((types_count))
total_medium=$((impl_count))
total_low=$((doc_count))
total_categorized=$((total_critical + total_high + total_medium + total_low))

echo "📊 RÉSUMÉ PAR PRIORITÉ"
echo "========================"
echo "🚨 CRITIQUE (Sécurité + API): $total_critical"
echo "⚠️  HAUTE (Types): $total_high"
echo "📊 MOYENNE (Implémentation): $total_medium"
echo "📝 BASSE (Documentation): $total_low"
echo "📈 TOTAL CATÉGORISÉ: $total_categorized"
echo "📋 TOTAL GLOBAL: $all_todos"
echo "🔍 NON CATÉGORISÉS: $((all_todos - total_categorized))"
echo

# Recommandations d'action
echo "🎯 PLAN D'ACTION RECOMMANDÉ"
echo "============================"

if [ $total_critical -gt 0 ]; then
    echo "1. 🚨 URGENT - Traiter les $total_critical TODO critiques (sécurité/API)"
    echo "   Délai: Cette semaine"
fi

if [ $total_high -gt 0 ]; then
    echo "2. ⚠️  IMPORTANT - Résoudre les $total_high TODO de types"
    echo "   Délai: Ce mois"
fi

if [ $total_medium -gt 0 ]; then
    echo "3. 📊 PLANIFIÉ - Implémenter les $total_medium fonctionnalités manquantes"
    echo "   Délai: Prochains sprints"
fi

if [ $total_low -gt 0 ]; then
    echo "4. 📝 CONTINU - Améliorer la documentation ($total_low TODO)"
    echo "   Délai: En continu"
fi

if [ $((all_todos - total_categorized)) -gt 0 ]; then
    echo "5. 🔍 ANALYSE - Catégoriser les $((all_todos - total_categorized)) TODO restants"
    echo "   Délai: Prochaine session d'audit"
fi

echo

# Export JSON si demandé
if [[ "$1" == "--export-json" ]]; then
    json_file="technical-debt-todos-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$json_file" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "workspace": "$WORKSPACE_ROOT",
  "summary": {
    "total_global": $all_todos,
    "total_categorized": $total_categorized,
    "uncategorized": $((all_todos - total_categorized)),
    "critical": $total_critical,
    "high": $total_high,
    "medium": $total_medium,
    "low": $total_low
  },
  "categories": {
    "security": $security_count,
    "api": $api_count,
    "types": $types_count,
    "implementation": $impl_count,
    "documentation": $doc_count
  },
  "recommendations": [
    "Traiter $total_critical TODO critiques en priorité",
    "Résoudre $total_high TODO de types ce mois",
    "Planifier $total_medium implémentations manquantes",
    "Améliorer documentation ($total_low TODO) en continu",
    "Catégoriser $((all_todos - total_categorized)) TODO restants"
  ]
}
EOF
    
    echo "📄 Export JSON créé: $json_file"
fi

# Code de sortie basé sur la criticité
if [ $total_critical -gt 10 ]; then
    echo "❌ ALERTE: Plus de 10 TODO critiques détectés!"
    exit 2
elif [ $total_critical -gt 5 ]; then
    echo "⚠️  ATTENTION: $total_critical TODO critiques nécessitent une action rapide"
    exit 1
else
    echo "✅ Niveau de TODO critiques acceptable ($total_critical)"
    exit 0
fi 