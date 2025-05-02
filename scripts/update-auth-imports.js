#!/usr/bin/env node

/**
 * Script pour mettre à jour automatiquement les imports du hook useAuth
 * Ce script recherche et remplace les imports directs depuis @/context/AuthContext
 * par des imports depuis @/hooks/useAuth
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

// Extensions de fichiers à traiter
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx'];

// Motifs de recherche et remplacement
const importPatterns = [
    {
        // Import nommé: import { useAuth } from '@/context/AuthContext';
        regex: /import\s*{\s*useAuth\s*}(\s*,\s*{[^}]*})?\s*from\s*['"]@\/context\/AuthContext['"]\s*;?/g,
        replacement: (match, otherImports) => {
            if (otherImports) {
                // Si d'autres imports existent, conservez-les depuis AuthContext
                return `import { useAuth } from '@/hooks/useAuth';\nimport ${otherImports} from '@/context/AuthContext';`;
            } else {
                return `import { useAuth } from '@/hooks/useAuth';`;
            }
        }
    },
    {
        // Import avec alias: import { useAuth as useAuthHook } from '@/context/AuthContext';
        regex: /import\s*{\s*useAuth\s+as\s+([^,}]*)\s*}(\s*,\s*{[^}]*})?\s*from\s*['"]@\/context\/AuthContext['"]\s*;?/g,
        replacement: (match, alias, otherImports) => {
            if (otherImports) {
                return `import { useAuth as ${alias} } from '@/hooks/useAuth';\nimport ${otherImports} from '@/context/AuthContext';`;
            } else {
                return `import { useAuth as ${alias} } from '@/hooks/useAuth';`;
            }
        }
    },
    {
        // Import default désaffecté (au cas où): import useAuth from '@/context/AuthContext';
        regex: /import\s+useAuth\s+from\s*['"]@\/context\/AuthContext['"]\s*;?/g,
        replacement: `import useAuth from '@/hooks/useAuth';`
    }
];

// Fonction pour vérifier si un chemin doit être ignoré
function shouldIgnorePath(filePath) {
    const ignorePaths = [
        'node_modules',
        '.git',
        '.next',
        'build',
        'dist',
        'scripts/update-auth-imports.js',
        'src/hooks/useAuth.ts'
    ];
    return ignorePaths.some(ignorePath => filePath.includes(ignorePath));
}

// Fonction pour traiter récursivement les fichiers
async function processDirectory(directoryPath) {
    if (shouldIgnorePath(directoryPath)) return;

    const files = await readdir(directoryPath);

    for (const file of files) {
        const filePath = path.join(directoryPath, file);
        const fileStat = await stat(filePath);

        if (fileStat.isDirectory()) {
            await processDirectory(filePath);
        } else if (
            fileExtensions.includes(path.extname(filePath)) &&
            !shouldIgnorePath(filePath)
        ) {
            await processFile(filePath);
        }
    }
}

// Fonction pour traiter un fichier individuel
async function processFile(filePath) {
    try {
        let content = await readFile(filePath, 'utf8');
        let originalContent = content;
        let hasChanged = false;

        for (const pattern of importPatterns) {
            if (pattern.regex.test(content)) {
                content = content.replace(pattern.regex, pattern.replacement);
                hasChanged = true;
            }
        }

        if (hasChanged) {
            await writeFile(filePath, content, 'utf8');
            console.log(`✅ Mise à jour des imports dans: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Erreur lors du traitement de ${filePath}:`, error);
    }
}

// Fonction principale
async function main() {
    const rootDir = path.resolve(__dirname, '..');
    console.log('🔍 Recherche et mise à jour des imports useAuth...');

    try {
        await processDirectory(rootDir);
        console.log('✨ Mise à jour des imports terminée avec succès!');
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour des imports:', error);
        process.exit(1);
    }
}

// Exécuter le script
main(); 