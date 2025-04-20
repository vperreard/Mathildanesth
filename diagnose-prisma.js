// Script de diagnostic pour Prisma
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== DIAGNOSTIC PRISMA ===');

// Vérifier l'existence des fichiers essentiels
console.log('\n1. Vérification des fichiers essentiels:');
const essentialFiles = [
    '.env',
    'prisma/schema.prisma',
    'package.json'
];

essentialFiles.forEach(file => {
    try {
        fs.accessSync(file, fs.constants.F_OK);
        console.log(`✅ ${file} existe`);
    } catch (err) {
        console.log(`❌ ${file} n'existe pas`);
    }
});

// Vérifier le contenu de .env
console.log('\n2. Vérification de .env:');
try {
    const envContent = fs.readFileSync('.env', 'utf8');
    if (envContent.includes('DATABASE_URL')) {
        console.log('✅ DATABASE_URL trouvé dans .env');
    } else {
        console.log('❌ DATABASE_URL non trouvé dans .env');
    }
} catch (err) {
    console.log('❌ Impossible de lire .env:', err.message);
}

// Vérifier l'installation de Prisma
console.log('\n3. Vérification de l\'installation de Prisma:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    if (packageJson.dependencies['@prisma/client']) {
        console.log(`✅ @prisma/client installé (version ${packageJson.dependencies['@prisma/client']})`);
    } else {
        console.log('❌ @prisma/client non installé');
    }

    if (packageJson.devDependencies['prisma']) {
        console.log(`✅ prisma installé (version ${packageJson.devDependencies['prisma']})`);
    } else if (packageJson.dependencies['prisma']) {
        console.log(`✅ prisma installé (version ${packageJson.dependencies['prisma']})`);
    } else {
        console.log('❌ prisma non installé');
    }
} catch (err) {
    console.log('❌ Impossible de lire package.json:', err.message);
}

// Vérifier le contenu du schema.prisma
console.log('\n4. Vérification du schema.prisma:');
try {
    const schemaContent = fs.readFileSync('prisma/schema.prisma', 'utf8');
    if (schemaContent.includes('provider = "prisma-client-js"')) {
        console.log('✅ Configuration du générateur trouvée');
    } else {
        console.log('❌ Configuration du générateur manquante');
    }

    if (schemaContent.includes('datasource db')) {
        console.log('✅ Configuration de la source de données trouvée');
    } else {
        console.log('❌ Configuration de la source de données manquante');
    }

    // Vérifier les références circulaires possibles
    const modelNames = [];
    const modelRefs = {};

    // Extraire les noms de modèles
    const modelMatches = schemaContent.matchAll(/model\s+(\w+)\s+{/g);
    for (const match of modelMatches) {
        modelNames.push(match[1]);
    }

    // Extraire les références
    modelNames.forEach(model => {
        modelRefs[model] = [];
        const regex = new RegExp(`\\b${model}\\b`, 'g');
        let match;
        let lineNum = 0;
        const lines = schemaContent.split('\n');

        for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(regex) && !lines[i].match(new RegExp(`model\\s+${model}`))) {
                modelRefs[model].push({ line: i + 1, content: lines[i].trim() });
            }
        }
    });

    console.log('\n5. Analyse des références entre modèles:');
    let circularRefFound = false;

    modelNames.forEach(model => {
        if (modelRefs[model].length > 0) {
            console.log(`\nModèle ${model} est référencé dans:`);
            modelRefs[model].forEach(ref => {
                console.log(`  Ligne ${ref.line}: ${ref.content}`);
            });
        }
    });

    // Vérifier les références circulaires simples (A → B → A)
    modelNames.forEach(modelA => {
        modelNames.forEach(modelB => {
            if (modelA !== modelB) {
                const ARefersToB = modelRefs[modelB].some(ref =>
                    ref.content.includes(`model ${modelA}`) ||
                    ref.content.includes(`${modelA}[]`) ||
                    ref.content.includes(`${modelA}?`)
                );

                const BRefersToA = modelRefs[modelA].some(ref =>
                    ref.content.includes(`model ${modelB}`) ||
                    ref.content.includes(`${modelB}[]`) ||
                    ref.content.includes(`${modelB}?`)
                );

                if (ARefersToB && BRefersToA) {
                    console.log(`\n⚠️ Référence circulaire potentielle détectée entre ${modelA} et ${modelB}`);
                    circularRefFound = true;
                }
            }
        });
    });

    if (!circularRefFound) {
        console.log('\n✅ Aucune référence circulaire simple détectée');
    }

} catch (err) {
    console.log('❌ Impossible de lire schema.prisma:', err.message);
}

console.log('\n=== FIN DU DIAGNOSTIC ==='); 