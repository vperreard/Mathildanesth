#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing module imports...\n');

// Mapping of incorrect imports to correct ones
const importMappings = {
    '@/modules/conges/': '@/modules/leaves/',
    'from \'@/modules/conges': 'from \'@/modules/leaves',
    'from "@/modules/conges': 'from "@/modules/leaves',
};

// Find all TypeScript/JavaScript files
function findFiles(dir, pattern = /\.(ts|tsx|js|jsx)$/) {
    const files = [];
    
    function walk(currentDir) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            
            // Skip node_modules, .next, etc.
            if (entry.name.startsWith('.') || 
                entry.name === 'node_modules' || 
                entry.name === 'dist' ||
                entry.name === '.next') {
                continue;
            }
            
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile() && pattern.test(entry.name)) {
                files.push(fullPath);
            }
        }
    }
    
    walk(dir);
    return files;
}

// Fix imports in a single file
function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    Object.entries(importMappings).forEach(([from, to]) => {
        if (content.includes(from)) {
            content = content.replaceAll(from, to);
            modified = true;
        }
    });
    
    if (modified) {
        console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
        fs.writeFileSync(filePath, content, 'utf8');
    }
    
    return modified;
}

// Main execution
const srcDir = path.join(process.cwd(), 'src');
const files = findFiles(srcDir);

console.log(`Found ${files.length} files to check\n`);

let fixedCount = 0;
files.forEach(file => {
    if (fixFile(file)) {
        fixedCount++;
    }
});

console.log(`\n✨ Fixed ${fixedCount} files with incorrect module imports`);