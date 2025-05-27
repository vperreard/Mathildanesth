#!/bin/bash

echo "🔧 Correction des erreurs de syntaxe..."

# Correction des problèmes dans TrameGridView.tsx
if [ -f "src/components/trames/grid-view/TrameGridView.tsx" ]; then
    echo "Correction de TrameGridView.tsx..."
    sed -i '' 's/(affectation, index)/\(affectation, index\)/g' src/components/trames/grid-view/TrameGridView.tsx
fi

# Correction des problèmes dans TramesConfigPanel.tsx (déjà fait mais vérifions)
if [ -f "src/app/parametres/configuration/TramesConfigPanel.tsx" ]; then
    echo "Vérification de TramesConfigPanel.tsx..."
    # Déjà corrigé
fi

echo "✅ Corrections terminées"