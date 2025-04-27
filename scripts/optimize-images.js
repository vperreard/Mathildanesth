/**
 * Script d'optimisation d'images
 * 
 * Ce script:
 * 1. Recherche toutes les images dans le dossier public/ (et ses sous-dossiers)
 * 2. Optimise les images JPEG, PNG en réduisant leur taille
 * 3. Convertit les images au format WebP pour une meilleure compression
 * 4. Conserve les originaux avec un suffixe .original
 * 
 * Utilisation: node scripts/optimize-images.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const sharp = require('sharp');
const glob = promisify(require('glob'));

// Configuration
const PUBLIC_DIR = path.join(__dirname, '../public');
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];
const QUALITY = {
    jpeg: 85,
    png: 85,
    webp: 80
};

// Vérifier si le dossier public existe
if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    console.log(`Dossier public/ créé à ${PUBLIC_DIR}`);
}

// Fonction pour optimiser une image
async function optimizeImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const filename = path.basename(filePath, ext);
    const dir = path.dirname(filePath);

    // Sauvegarde du fichier original
    const originalFilePath = path.join(dir, `${filename}.original${ext}`);
    if (!fs.existsSync(originalFilePath)) {
        fs.copyFileSync(filePath, originalFilePath);
        console.log(`Sauvegarde créée: ${originalFilePath}`);
    }

    try {
        // Charger l'image avec sharp
        let image = sharp(filePath);
        let metadata = await image.metadata();

        // Optimiser selon le type d'image
        if (ext === '.jpg' || ext === '.jpeg') {
            await image
                .jpeg({ quality: QUALITY.jpeg, progressive: true })
                .toFile(path.join(dir, `${filename}.tmp${ext}`));
        } else if (ext === '.png') {
            await image
                .png({ quality: QUALITY.png, compressionLevel: 9 })
                .toFile(path.join(dir, `${filename}.tmp${ext}`));
        } else if (ext === '.gif') {
            // Pour les GIF, on ne fait rien car sharp n'optimise pas bien les GIFs animés
            console.log(`Pas d'optimisation pour GIF: ${filePath}`);
            return;
        }

        // Remplacer l'original par la version optimisée
        fs.renameSync(path.join(dir, `${filename}.tmp${ext}`), filePath);

        // Créer version WebP (sauf pour SVG)
        if (ext !== '.svg') {
            await image
                .webp({ quality: QUALITY.webp })
                .toFile(path.join(dir, `${filename}.webp`));
            console.log(`Version WebP créée: ${filename}.webp`);
        }

        console.log(`Image optimisée: ${filePath}`);
    } catch (error) {
        console.error(`Erreur lors de l'optimisation de ${filePath}:`, error);
    }
}

// Fonction principale
async function main() {
    try {
        console.log('Début de l'optimisation des images...');

    // Récupérer toutes les images dans le dossier public
    let imagePaths = [];

        for (const ext of IMAGE_EXTENSIONS) {
            const images = await glob(`${PUBLIC_DIR}/**/*${ext}`);
            imagePaths = [...imagePaths, ...images];
        }

        console.log(`${imagePaths.length} images trouvées.`);

        // Optimiser chaque image
        for (const imagePath of imagePaths) {
            await optimizeImage(imagePath);
        }

        console.log('Optimisation des images terminée!');
    } catch (error) {
        console.error('Erreur lors de l'optimisation des images: ', error);
  }
}

// Exécuter le script
main(); 