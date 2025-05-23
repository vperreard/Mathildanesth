#!/usr/bin/env node

/**
 * Script pour corriger automatiquement le problème de metadata viewport
 * dans les fichiers Next.js App Router.
 * 
 * Ce script recherche les fichiers où viewport est inclus dans l'objet metadata
 * et déplace la configuration dans un export viewport séparé.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const APP_DIR = path.join(__dirname, '..', 'src', 'app');
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Compteurs pour les statistiques
let fileCount = 0;
let fixedCount = 0;

/**
 * Recherche tous les fichiers qui pourraient contenir des métadonnées avec viewport
 */
function findMetadataFiles(dir) {
    let files = [];

    // Trouver les fichiers qui contiennent "metadata" et "viewport"
    try {
        const cmd = `grep -l "metadata" $(find ${dir} -type f -name "*.tsx" -o -name "*.jsx" -o -name "*.ts") | xargs grep -l "viewport"`;
        const result = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        files = result.trim().split('\n').filter(Boolean);
    } catch (error) {
        // Si aucun fichier n'est trouvé, grep renvoie un code d'erreur
        return [];
    }

    return files;
}

/**
 * Corrige le fichier en extrayant viewport de l'objet metadata
 */
function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let fixed = false;

    // Vérifier si le fichier importe déjà Viewport
    const hasViewportImport = content.includes('Viewport') && content.includes('from \'next\'');

    // Chercher le pattern de metadata avec viewport à l'intérieur
    const metadataMatch = content.match(/export\s+const\s+metadata\s*(?::\s*Metadata)?\s*=\s*{[\s\S]*?viewport\s*:\s*{[\s\S]*?}[\s\S]*?};/);

    if (metadataMatch) {
        const metadataBlock = metadataMatch[0];

        // Extraire la configuration du viewport
        const viewportMatch = metadataBlock.match(/viewport\s*:\s*({[\s\S]*?})/);

        if (viewportMatch && viewportMatch[1]) {
            const viewportConfig = viewportMatch[1];

            if (VERBOSE) {
                console.log(`\n📝 Analyzing ${filePath.replace(process.cwd(), '')}`);
                console.log(`   Found viewport in metadata`);
            }

            // Créer la nouvelle déclaration de viewport
            let viewportDeclaration = `\nexport const viewport${hasViewportImport ? '' : ': any'} = ${viewportConfig};`;

            // Remplacer metadata en supprimant viewport
            const newMetadataBlock = metadataBlock.replace(/,?\s*viewport\s*:\s*{[\s\S]*?}/, '');

            // Mettre à jour le contenu
            let newContent = content.replace(metadataBlock, newMetadataBlock);

            // Ajouter l'import Viewport si nécessaire
            if (!hasViewportImport && content.includes('import') && content.includes('Metadata')) {
                // Modifier l'import existant de Metadata
                newContent = newContent.replace(
                    /import\s+{\s*Metadata\s*}\s+from\s+['"]next['"];/,
                    `import { Metadata, Viewport } from 'next';`
                );
            } else if (!hasViewportImport && !content.includes('Metadata')) {
                // Ajouter un nouvel import en haut du fichier
                newContent = `import { Viewport } from 'next';\n${newContent}`;
            }

            // Ajouter la déclaration de viewport après metadata
            newContent = newContent.replace(newMetadataBlock, `${newMetadataBlock}${viewportDeclaration}`);

            fixed = true;

            // Ne rien faire en mode dry run
            if (fixed && !DRY_RUN) {
                fs.writeFileSync(filePath, newContent);
                fixedCount++;

                if (!VERBOSE) {
                    console.log(`✅ Fixed: ${filePath.replace(process.cwd(), '')}`);
                } else {
                    console.log(`   🔧 Fixed: Moved viewport config to separate export`);
                }
            } else if (fixed && DRY_RUN) {
                console.log(`🔍 Would fix: ${filePath.replace(process.cwd(), '')}`);
            }
        }
    }

    fileCount++;
    return fixed;
}

// Point d'entrée principal
console.log('🔎 Recherche des fichiers avec metadata et viewport...');
const metadataFiles = findMetadataFiles(APP_DIR);
console.log(`🗂  Trouvé ${metadataFiles.length} fichiers potentiellement impactés.`);

// Parcourir et corriger les fichiers
console.log(`\n${DRY_RUN ? '🔍 DRY RUN' : '🔧 FIXING'} les configurations de viewport dans metadata...`);

for (const file of metadataFiles) {
    fixFile(file);
}

// Afficher un résumé
console.log('\n📊 Résumé:');
console.log(`   - Fichiers analysés: ${fileCount}`);
console.log(`   - Fichiers corrigés: ${fixedCount}`);

if (DRY_RUN) {
    console.log('\n💡 Exécutez sans --dry-run pour appliquer les corrections');
}

console.log('\n✨ Terminé!'); 