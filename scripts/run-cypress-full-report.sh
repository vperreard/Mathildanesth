#!/bin/bash

# Script pour lancer tous les tests Cypress et générer un rapport complet
# Usage: ./scripts/run-cypress-full-report.sh

echo "🚀 Début de l'exécution complète des tests Cypress"
echo "=================================================="
echo ""

# Définir les variables
PROJECT_ROOT="/Users/vincentperreard/Mathildanesth"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="$PROJECT_ROOT/cypress-full-report-$TIMESTAMP"
SUMMARY_FILE="$REPORT_DIR/SUMMARY.md"

# Créer le dossier de rapport
mkdir -p "$REPORT_DIR"
mkdir -p "$REPORT_DIR/screenshots"
mkdir -p "$REPORT_DIR/videos"
mkdir -p "$REPORT_DIR/logs"

# Fonction pour capturer les infos système
capture_system_info() {
    echo "📊 Capture des informations système..."
    cat > "$REPORT_DIR/system-info.txt" << EOF
=== INFORMATIONS SYSTÈME ===
Date: $(date)
Node Version: $(node -v)
NPM Version: $(npm -v)
Cypress Version: $(npx cypress --version 2>/dev/null || echo "Non installé")
Port 3000 Status: $(lsof -i :3000 >/dev/null 2>&1 && echo "Application en cours d'exécution" || echo "Application non démarrée")
Working Directory: $PROJECT_ROOT
EOF
}

# Fonction pour vérifier l'état de l'application
check_app_status() {
    echo "🔍 Vérification de l'état de l'application..."
    
    # Vérifier si l'app tourne
    if lsof -i :3000 >/dev/null 2>&1; then
        echo "✅ Application détectée sur le port 3000"
        
        # Tester la page de login
        curl -s -o "$REPORT_DIR/login-page.html" "http://localhost:3000/auth/login" || echo "⚠️ Impossible d'accéder à la page de login"
        
        # Extraire les sélecteurs de la page
        echo "📝 Extraction des sélecteurs data-testid de la page de login..." > "$REPORT_DIR/selectors-found.txt"
        grep -o 'data-testid="[^"]*"' "$REPORT_DIR/login-page.html" 2>/dev/null >> "$REPORT_DIR/selectors-found.txt" || echo "Aucun data-testid trouvé"
    else
        echo "❌ Application non détectée sur le port 3000"
        echo "   Essayez: npm run dev"
    fi
}

# Fonction pour lancer un groupe de tests
run_test_group() {
    local group_name=$1
    local spec_pattern=$2
    
    echo ""
    echo "🧪 Exécution des tests: $group_name"
    echo "----------------------------------------"
    
    # Créer un sous-dossier pour ce groupe
    mkdir -p "$REPORT_DIR/logs/$group_name"
    
    # Lancer les tests et capturer la sortie
    cd "$PROJECT_ROOT"
    npx cypress run --spec "$spec_pattern" \
        --reporter json \
        --reporter-options output="$REPORT_DIR/logs/$group_name/results.json" \
        > "$REPORT_DIR/logs/$group_name/output.log" 2>&1
    
    local exit_code=$?
    
    # Analyser les résultats
    if [ $exit_code -eq 0 ]; then
        echo "✅ $group_name: SUCCÈS"
    else
        echo "❌ $group_name: ÉCHEC (code: $exit_code)"
        
        # Extraire les erreurs principales
        echo "Erreurs principales:" >> "$REPORT_DIR/logs/$group_name/errors.txt"
        grep -E "(Error:|AssertionError:|failed)" "$REPORT_DIR/logs/$group_name/output.log" >> "$REPORT_DIR/logs/$group_name/errors.txt" 2>/dev/null
    fi
    
    # Copier les screenshots s'ils existent
    if [ -d "$PROJECT_ROOT/cypress/screenshots" ]; then
        cp -r "$PROJECT_ROOT/cypress/screenshots"/* "$REPORT_DIR/screenshots/" 2>/dev/null || true
    fi
    
    return $exit_code
}

# Fonction pour générer le résumé
generate_summary() {
    echo "📝 Génération du résumé..."
    
    cat > "$SUMMARY_FILE" << EOF
# Rapport Complet des Tests Cypress
Date: $(date)

## 🔍 État de l'Application
$(cat "$REPORT_DIR/system-info.txt")

## 📊 Résumé des Tests

| Groupe de Tests | Statut | Détails |
|-----------------|--------|---------|
EOF

    # Analyser chaque groupe de tests
    for group_dir in "$REPORT_DIR/logs"/*; do
        if [ -d "$group_dir" ]; then
            group_name=$(basename "$group_dir")
            
            # Vérifier si le test a réussi
            if grep -q "All specs passed" "$group_dir/output.log" 2>/dev/null; then
                echo "| $group_name | ✅ SUCCÈS | Tous les tests passent |" >> "$SUMMARY_FILE"
            else
                # Compter les échecs
                failures=$(grep -c "failing" "$group_dir/output.log" 2>/dev/null || echo "?")
                echo "| $group_name | ❌ ÉCHEC | $failures tests échoués |" >> "$SUMMARY_FILE"
            fi
        fi
    done

    cat >> "$SUMMARY_FILE" << EOF

## 🐛 Erreurs Principales

### Sélecteurs Manquants
\`\`\`
$(grep -h "Expected to find element" "$REPORT_DIR/logs"/*/output.log 2>/dev/null | sort | uniq || echo "Aucune erreur de sélecteur")
\`\`\`

### Timeouts
\`\`\`
$(grep -h "Timed out" "$REPORT_DIR/logs"/*/output.log 2>/dev/null | head -10 || echo "Aucun timeout")
\`\`\`

### Erreurs d'API
\`\`\`
$(grep -h -E "(500|404|401|403)" "$REPORT_DIR/logs"/*/output.log 2>/dev/null | head -10 || echo "Aucune erreur d'API")
\`\`\`

## 📸 Screenshots des Échecs
$(ls -la "$REPORT_DIR/screenshots" 2>/dev/null | grep -c ".png" || echo "0") captures d'écran générées

## 🔧 Actions Recommandées

1. **Sélecteurs manquants** : Ajouter les data-testid dans les composants React
2. **Timeouts** : Augmenter les timeouts ou ajouter des waitFor
3. **Erreurs API** : Vérifier que l'API est accessible et les endpoints existent

## 📁 Structure du Rapport
\`\`\`
$REPORT_DIR/
├── SUMMARY.md (ce fichier)
├── system-info.txt
├── login-page.html
├── selectors-found.txt
├── screenshots/
├── videos/
└── logs/
    ├── auth/
    ├── leaves/
    ├── bloc-operatoire/
    └── rules/
\`\`\`
EOF
}

# Fonction principale
main() {
    echo "🏁 Début du processus de test complet"
    
    # 1. Capturer les infos système
    capture_system_info
    
    # 2. Vérifier l'état de l'app
    check_app_status
    
    # 3. Lancer les différents groupes de tests
    echo ""
    echo "🚀 Lancement des tests par groupe..."
    
    # Tests d'authentification
    run_test_group "auth" "cypress/e2e/auth/**/*.{js,ts}" || true
    run_test_group "login" "cypress/e2e/login.spec.ts" || true
    
    # Tests des congés
    run_test_group "leaves" "cypress/e2e/leaves/**/*.{js,ts}" || true
    
    # Tests du bloc opératoire
    run_test_group "bloc-operatoire" "cypress/e2e/bloc-operatoire/**/*.{js,ts}" || true
    
    # Tests des règles métier
    run_test_group "rules" "cypress/e2e/rules/**/*.{js,ts}" || true
    
    # Tests de performance
    run_test_group "performance" "cypress/e2e/performance/**/*.{js,ts}" || true
    
    # 4. Générer le résumé final
    generate_summary
    
    # 5. Créer une archive
    echo ""
    echo "📦 Création de l'archive..."
    cd "$PROJECT_ROOT"
    tar -czf "cypress-report-$TIMESTAMP.tar.gz" "cypress-full-report-$TIMESTAMP"
    
    echo ""
    echo "✅ Rapport complet généré !"
    echo "📁 Dossier: $REPORT_DIR"
    echo "📄 Résumé: $SUMMARY_FILE"
    echo "📦 Archive: cypress-report-$TIMESTAMP.tar.gz"
    echo ""
    echo "👉 Pour partager avec Claude, copiez le contenu de:"
    echo "   cat $SUMMARY_FILE"
}

# Exécuter le script
main