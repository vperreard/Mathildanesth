#!/bin/bash

# Script automatique pour lancer les tests Cypress et générer un rapport pour Claude
# Usage: ./scripts/cypress-auto-fix.sh

echo "🤖 Lancement automatique des tests Cypress"
echo "=========================================="
echo ""

# Configuration
REPORT_FILE="CYPRESS_TEST_RESULTS.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Début du rapport
cat > "$REPORT_FILE" << EOF
# Résultats des Tests Cypress E2E
Généré le: $TIMESTAMP

## 📊 Résumé Exécutif

EOF

# Fonction pour exécuter un groupe de tests
run_test_group() {
    local name=$1
    local spec=$2
    local temp_file="temp_test_output.json"
    
    echo "🧪 Test: $name"
    
    # Exécuter le test
    npx cypress run --spec "$spec" --reporter json --quiet > "$temp_file" 2>&1
    
    # Analyser le résultat
    if [ -f "$temp_file" ]; then
        local total=$(grep -o '"tests":[0-9]*' "$temp_file" | cut -d: -f2 | head -1)
        local passing=$(grep -o '"passes":[0-9]*' "$temp_file" | cut -d: -f2 | head -1)
        local failing=$(grep -o '"failures":[0-9]*' "$temp_file" | cut -d: -f2 | head -1)
        
        # Ajouter au rapport
        echo "### $name" >> "$REPORT_FILE"
        echo "- Total: $total tests" >> "$REPORT_FILE"
        echo "- ✅ Réussis: $passing" >> "$REPORT_FILE"
        echo "- ❌ Échoués: $failing" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        
        # Si des tests échouent, extraire les erreurs
        if [ "$failing" -gt 0 ]; then
            echo "**Erreurs principales:**" >> "$REPORT_FILE"
            echo '```' >> "$REPORT_FILE"
            grep -A 2 '"message":\|"expected":\|"actual":' "$temp_file" | head -15 >> "$REPORT_FILE"
            echo '```' >> "$REPORT_FILE"
            echo "" >> "$REPORT_FILE"
        fi
    fi
    
    rm -f "$temp_file"
}

# Tests principaux
echo "## 🧪 Résultats par Catégorie" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Login/Auth
run_test_group "Authentification (login.spec.ts)" "cypress/e2e/login.spec.ts"
run_test_group "Auth complète" "cypress/e2e/auth/**/*.{js,ts}"

# Congés
run_test_group "Gestion des congés" "cypress/e2e/leaves/**/*.{js,ts}"

# Bloc opératoire
run_test_group "Bloc opératoire" "cypress/e2e/bloc-operatoire/**/*.{js,ts}"

# Ajouter les corrections nécessaires
cat >> "$REPORT_FILE" << 'EOF'

## 🔧 Corrections Nécessaires

### 1. Problème API Login (Erreur 500)
**Fichier**: `/api/auth/login`
- L'API retourne une erreur 500 au lieu de 200
- Vérifier la connexion à la base de données
- Vérifier les variables d'environnement

### 2. Sélecteurs Manquants
**Ajouter dans les composants React:**
```jsx
// OptimizedLoginPage.tsx
<input data-testid="login-email-input" ... />
<input data-testid="login-password-input" ... />
<button data-testid="login-submit-button" ... />
<a data-testid="forgot-password-link" ... />

// Composants de congés
<button data-testid="create-leave-button" ... />
<select data-testid="leave-type-select" ... />
<input data-testid="leave-start-date" ... />
<input data-testid="leave-end-date" ... />

// Composants bloc opératoire
<div data-testid="planning-grid" ... />
<div data-testid="surgeons-list" ... />
<div data-testid="slot-monday-morning-room1" ... />
```

### 3. Fixtures Manquantes
Vérifier que les fixtures suivantes existent:
- `cypress/fixtures/users.json`
- `cypress/fixtures/operatingRooms.json`
- `cypress/fixtures/surgeons.json`
- `cypress/fixtures/leaves.json`

### 4. Tasks Cypress Non Configurées
Les tasks `resetTestDatabase` et `seedTestData` doivent être implémentées dans `cypress.config.js`

## 📝 Script pour Corriger Automatiquement

Pour appliquer les corrections de base:
```bash
# Ajouter les data-testid dans OptimizedLoginPage
sed -i '' 's/<input type="text"/<input type="text" data-testid="login-email-input"/g' src/app/auth/login/OptimizedLoginPage.tsx
sed -i '' 's/<input type="password"/<input type="password" data-testid="login-password-input"/g' src/app/auth/login/OptimizedLoginPage.tsx
sed -i '' 's/<button type="submit"/<button type="submit" data-testid="login-submit-button"/g' src/app/auth/login/OptimizedLoginPage.tsx
```

EOF

# Afficher le rapport
echo ""
echo "✅ Tests terminés ! Rapport généré dans: $REPORT_FILE"
echo ""
echo "📋 Résumé rapide:"
tail -30 "$REPORT_FILE" | grep -E "✅|❌|Total:"

echo ""
echo "Pour voir le rapport complet:"
echo "cat $REPORT_FILE"