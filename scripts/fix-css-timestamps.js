#!/usr/bin/env node

/**
 * Fix CSS timestamp issues by intercepting and cleaning URLs
 * This is a temporary fix while we resolve the Service Worker cache issue
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Searching for files that might add timestamps to CSS...');

// Check if there are any other scripts that might be adding timestamps
const publicDir = path.join(__dirname, '../public');
const srcDir = path.join(__dirname, '../src');

// Look for any files that might be adding timestamps
const searchPatterns = [
    /\?v=\d+/g,           // ?v=timestamp
    /\?t=\d+/g,           // ?t=timestamp
    /\?_t=\d+/g,          // ?_t=timestamp
    /\.css\?/g,           // .css?anything
    /timestamp/gi,        // timestamp mentions
    /cache.*bust/gi,      // cache bust mentions
    /version.*param/gi    // version param mentions
];

function searchInFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const matches = [];
        
        searchPatterns.forEach(pattern => {
            const found = content.match(pattern);
            if (found) {
                matches.push({ pattern: pattern.toString(), found });
            }
        });
        
        if (matches.length > 0) {
            console.log(`\n📄 Found in ${filePath}:`);
            matches.forEach(m => console.log(`   Pattern: ${m.pattern} - Matches: ${m.found.length}`));
        }
    } catch (err) {
        // Ignore errors (binary files, etc.)
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Skip node_modules and .next
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                walkDir(filePath);
            }
        } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.jsx')) {
            searchInFile(filePath);
        }
    });
}

console.log('Searching in public directory...');
if (fs.existsSync(publicDir)) {
    walkDir(publicDir);
}

console.log('\nSearching in src directory...');
if (fs.existsSync(srcDir)) {
    walkDir(srcDir);
}

console.log('\n✅ Search complete!');
console.log('\n📌 Next steps:');
console.log('1. Clear browser cache completely');
console.log('2. Visit http://localhost:3000/unregister-sw.html');
console.log('3. Use Ctrl+F5 (Windows) or Cmd+Shift+R (Mac) to hard refresh');
console.log('4. Check DevTools > Application > Service Workers and unregister any remaining SW');