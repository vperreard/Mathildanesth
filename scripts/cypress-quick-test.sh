#!/bin/bash

echo "🚀 Test rapide Cypress - Génération du rapport"
echo "============================================="

# Variables
REPORT_FILE="cypress-test-report.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Début du rapport
cat > "$REPORT_FILE" << EOF
# Rapport de Test Cypress
Date: $TIMESTAMP

## 🔍 Vérification de l'environnement

### Application Status
EOF

# Vérifier si l'app tourne
if lsof -i :3000 >/dev/null 2>&1; then
    echo "✅ Application en cours d'exécution sur le port 3000" >> "$REPORT_FILE"
else
    echo "❌ Application NON DÉTECTÉE sur le port 3000" >> "$REPORT_FILE"
fi

# Vérifier la page de login
echo -e "\n### Page de Login" >> "$REPORT_FILE"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/login)
echo "Status HTTP: $HTTP_STATUS" >> "$REPORT_FILE"

# Récupérer le HTML et chercher les sélecteurs
echo -e "\n### Sélecteurs trouvés sur la page de login:" >> "$REPORT_FILE"
curl -s http://localhost:3000/auth/login | grep -o 'data-testid="[^"]*"' | sort | uniq >> "$REPORT_FILE" 2>/dev/null || echo "Aucun data-testid trouvé" >> "$REPORT_FILE"

# Lancer un test simple
echo -e "\n## 🧪 Test de Login (login.spec.ts)\n" >> "$REPORT_FILE"
echo "Lancement du test..." >> "$REPORT_FILE"

# Capturer la sortie du test
npx cypress run --spec "cypress/e2e/login.spec.ts" --reporter json 2>&1 | tee cypress-test-output.log

# Analyser les résultats
echo -e "\n### Résultats du test:" >> "$REPORT_FILE"
if grep -q "All specs passed" cypress-test-output.log; then
    echo "✅ TOUS LES TESTS PASSENT" >> "$REPORT_FILE"
else
    echo "❌ TESTS ÉCHOUÉS" >> "$REPORT_FILE"
    
    # Extraire les erreurs
    echo -e "\n### Erreurs principales:" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    grep -A 2 "AssertionError\|Error:" cypress-test-output.log | head -20 >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    
    # Extraire les sélecteurs manquants
    echo -e "\n### Sélecteurs manquants:" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
    grep "Expected to find element" cypress-test-output.log | sed 's/.*Expected to find element: //' | sort | uniq >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
fi

# Screenshots
echo -e "\n### Screenshots générés:" >> "$REPORT_FILE"
ls -la cypress/screenshots/**/*.png 2>/dev/null | wc -l | xargs -I {} echo "{} captures d'écran" >> "$REPORT_FILE"

# Recommandations
echo -e "\n## 🔧 Actions nécessaires pour réparer les tests\n" >> "$REPORT_FILE"

# Analyser ce qui manque
if ! grep -q "data-testid" "$REPORT_FILE"; then
    echo "1. **Ajouter les data-testid manquants** dans OptimizedLoginPage.tsx:" >> "$REPORT_FILE"
    echo "   - data-testid=\"login-email-input\"" >> "$REPORT_FILE"
    echo "   - data-testid=\"login-password-input\"" >> "$REPORT_FILE"
    echo "   - data-testid=\"login-submit-button\"" >> "$REPORT_FILE"
fi

# Nettoyer
rm -f cypress-test-output.log

echo -e "\n---\nRapport généré dans: $REPORT_FILE" >> "$REPORT_FILE"

# Afficher le rapport
echo ""
echo "✅ Rapport généré ! Contenu :"
echo "=============================="
cat "$REPORT_FILE"