#!/bin/bash

# Script de génération des icônes PWA pour Mathildanesth
# Basé sur l'icône existante icon-144x144.png

SOURCE_ICON="public/icons/icon-144x144.png"
ICON_DIR="public/icons"

echo "🏥 Génération des icônes PWA médicales pour Mathildanesth..."

# Vérifier si ImageMagick ou sips (macOS) est disponible
if command -v convert >/dev/null 2>&1; then
    RESIZE_CMD="convert"
    echo "✅ ImageMagick détecté"
elif command -v sips >/dev/null 2>&1; then
    RESIZE_CMD="sips"
    echo "✅ sips (macOS) détecté"
else
    echo "❌ Erreur: Ni ImageMagick ni sips n'est disponible"
    echo "Sur macOS: brew install imagemagick"
    echo "Sur Ubuntu: sudo apt-get install imagemagick"
    exit 1
fi

# Vérifier que l'icône source existe
if [ ! -f "$SOURCE_ICON" ]; then
    echo "❌ Erreur: L'icône source $SOURCE_ICON n'existe pas"
    exit 1
fi

# Tailles d'icônes PWA requises
SIZES=(72 96 128 144 152 192 384 512)

# Créer le dossier s'il n'existe pas
mkdir -p "$ICON_DIR"

echo "📱 Génération des icônes..."

for size in "${SIZES[@]}"; do
    output_file="$ICON_DIR/icon-${size}x${size}.png"
    
    if [ "$RESIZE_CMD" = "convert" ]; then
        # Utilise ImageMagick
        convert "$SOURCE_ICON" -resize "${size}x${size}" "$output_file"
    else
        # Utilise sips (macOS)
        sips -z "$size" "$size" "$SOURCE_ICON" --out "$output_file" >/dev/null 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        echo "  ✅ Généré: icon-${size}x${size}.png"
    else
        echo "  ❌ Erreur lors de la génération de icon-${size}x${size}.png"
    fi
done

# Créer favicon.ico à partir de l'icône 144x144
if [ "$RESIZE_CMD" = "convert" ]; then
    convert "$SOURCE_ICON" -resize "32x32" "public/favicon.ico"
    echo "  ✅ Généré: favicon.ico"
fi

# Afficher les tailles générées
echo ""
echo "📊 Récapitulatif des icônes générées:"
ls -la "$ICON_DIR" | grep "icon-" | awk '{print "  " $9 " - " $5 " bytes"}'

echo ""
echo "🎉 Génération terminée!"
echo "Les icônes sont prêtes pour votre PWA médicale."
echo ""
echo "📝 Pour vérifier la PWA:"
echo "  1. Lancez 'npm run dev'"
echo "  2. Ouvrez les DevTools > Application > Manifest"
echo "  3. Testez l'installation de l'app"