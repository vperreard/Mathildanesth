import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import glob from 'glob';

const INPUT_DIR = 'public'; // Répertoire contenant les images originales
const OUTPUT_DIR = 'public/optimized'; // Répertoire de sortie pour les images optimisées
const SIZES = [640, 750, 828, 1080, 1200, 1920]; // Tailles courantes pour les appareils
const QUALITY = 80;

// Création du dossier de sortie s'il n'existe pas
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Trouve toutes les images dans le répertoire source
const imageFiles = glob.sync(`${INPUT_DIR}/**/*.{jpg,jpeg,png}`);

// Génère une version placeholder de très petite taille pour l'effet blur
async function generatePlaceholder(imagePath, outputPath) {
    await sharp(imagePath)
        .resize(10) // Très petite taille
        .blur(3) // Ajoute un flou
        .toBuffer()
        .then(data => {
            fs.writeFileSync(
                `${outputPath.replace(/\.[^/.]+$/, '')}_placeholder.jpg`,
                data
            );
            console.log(`Placeholder généré pour ${path.basename(imagePath)}`);
        });
}

// Fonction principale d'optimisation
async function optimizeImage(imagePath) {
    const filename = path.basename(imagePath);
    const outputBasePath = path.join(OUTPUT_DIR, filename.replace(/\.[^/.]+$/, ''));

    try {
        // Générer le placeholder
        await generatePlaceholder(imagePath, outputBasePath);

        // Créer différentes tailles
        for (const size of SIZES) {
            // Format AVIF (haute qualité, petite taille)
            await sharp(imagePath)
                .resize(size)
                .avif({ quality: QUALITY })
                .toFile(`${outputBasePath}_${size}.avif`);

            // Format WebP (bon support, bonne compression)
            await sharp(imagePath)
                .resize(size)
                .webp({ quality: QUALITY })
                .toFile(`${outputBasePath}_${size}.webp`);

            // JPEG comme fallback
            await sharp(imagePath)
                .resize(size)
                .jpeg({ quality: QUALITY, mozjpeg: true })
                .toFile(`${outputBasePath}_${size}.jpg`);
        }

        console.log(`Image optimisée: ${filename}`);
    } catch (error) {
        console.error(`Erreur lors de l'optimisation de ${filename}:`, error);
    }
}

// Traite chaque image
async function processAllImages() {
    console.log(`Optimisation de ${imageFiles.length} images...`);

    const promises = imageFiles.map(imagePath => optimizeImage(imagePath));
    await Promise.all(promises);

    console.log('Optimisation terminée!');
}

processAllImages(); 