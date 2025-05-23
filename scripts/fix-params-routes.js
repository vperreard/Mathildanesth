#!/usr/bin/env node

/**
 * Script pour corriger automatiquement le problème d'utilisation des paramètres
 * dynamiques dans les routes Next.js.
 * 
 * Ce script recherche les modèles où params.id est extrait sans await puis
 * applique la correction en ajoutant await Promise.resolve(params).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const API_ROUTES_DIR = path.join(__dirname, '..', 'src', 'app', 'api');
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Compteurs pour les statistiques
let fileCount = 0;
let fixedCount = 0;

/**
 * Recherche tous les fichiers route.ts dans les dossiers avec des paramètres dynamiques
 */
function findDynamicRouteFiles(dir) {
    let files = [];

    // Lire le contenu du répertoire
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
            // Si c'est un dossier avec des crochets (paramètre dynamique)
            if (item.includes('[') && item.includes(']')) {
                // Vérifier s'il contient un fichier route.ts
                const routeFilePath = path.join(itemPath, 'route.ts');
                if (fs.existsSync(routeFilePath)) {
                    files.push(routeFilePath);
                }
            }

            // Chercher récursivement dans le dossier
            files = files.concat(findDynamicRouteFiles(itemPath));
        }
    }

    return files;
}

/**
 * Corrige le fichier en remplaçant les extractions de params non-awaited
 */
function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let fixed = false;

    // Chercher les patterns typiques d'extraction de params sans await
    const matches = content.match(/const\s*{([^}]*)}\s*=\s*params(\s*);/g);

    if (matches && matches.length > 0) {
        if (VERBOSE) {
            console.log(`\n📝 Analyzing ${filePath.replace(process.cwd(), '')}`);
            console.log(`   Found ${matches.length} potential params extractions`);
        }

        // Remplacer chaque occurrence
        for (const match of matches) {
            // Ne remplacer que s'il n'y a pas déjà un await Promise.resolve
            if (!content.includes(`const ${match.match(/{\s*([^}]*)\s*}/)[0]} = await Promise.resolve(params)`)) {
                const replacement = match.replace('= params', '= await Promise.resolve(params)');
                content = content.replace(match, replacement);
                fixed = true;

                if (VERBOSE) {
                    console.log(`   🔧 Fixed: "${match.trim()}" → "${replacement.trim()}"`);
                }
            }
        }

        // Ne rien faire en mode dry run
        if (fixed && !DRY_RUN) {
            fs.writeFileSync(filePath, content);
            fixedCount++;

            if (!VERBOSE) {
                console.log(`✅ Fixed: ${filePath.replace(process.cwd(), '')}`);
            }
        } else if (fixed && DRY_RUN) {
            console.log(`🔍 Would fix: ${filePath.replace(process.cwd(), '')}`);
        }
    }

    fileCount++;
    return fixed;
}

// Point d'entrée principal
console.log('🔎 Recherche des fichiers de route dynamiques...');
const routeFiles = findDynamicRouteFiles(API_ROUTES_DIR);
console.log(`🗂  Trouvé ${routeFiles.length} fichiers de route potentiellement impactés.`);

// Parcourir et corriger les fichiers
console.log(`\n${DRY_RUN ? '🔍 DRY RUN' : '🔧 FIXING'} les extractions de params non-awaited...`);

for (const file of routeFiles) {
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