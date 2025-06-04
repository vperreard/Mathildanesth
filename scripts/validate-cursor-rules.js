#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validation des règles Cursor...\n');

// Lire la configuration principale
const configPath = '.cursor-config.json';
if (!fs.existsSync(configPath)) {
    console.error('❌ Fichier .cursor-config.json non trouvé');
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
let allValid = true;

// Valider chaque règle
for (const rule of config.rules) {
    console.log(`📋 Règle: ${rule.name}`);

    // Vérifier que le fichier de règle existe
    if (!fs.existsSync(rule.path)) {
        console.error(`   ❌ Fichier de règle manquant: ${rule.path}`);
        allValid = false;
        continue;
    }

    // Lire le fichier de règle
    try {
        const ruleContent = JSON.parse(fs.readFileSync(rule.path, 'utf8'));

        // Vérifier les fichiers référencés dans les actions
        if (ruleContent.actions) {
            for (const action of ruleContent.actions) {
                if (action.type === 'readFiles' && action.files) {
                    for (const file of action.files) {
                        if (fs.existsSync(file)) {
                            console.log(`   ✅ ${file}`);
                        } else {
                            console.error(`   ❌ Fichier manquant: ${file}`);
                            allValid = false;
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error(`   ❌ Erreur de parsing JSON: ${error.message}`);
        allValid = false;
    }

    console.log('');
}

// Résultat final
if (allValid) {
    console.log('🎉 Toutes les règles Cursor sont valides !');
    process.exit(0);
} else {
    console.error('💥 Certaines règles Cursor ont des problèmes');
    process.exit(1);
} 