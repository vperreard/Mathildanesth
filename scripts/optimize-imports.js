#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Optimizing imports in the codebase...\n');

// Patterns to optimize
const optimizations = [
    // Framer Motion
    {
        from: /import\s+\{([^}]+)\}\s+from\s+['"]framer-motion['"]/g,
        to: (match, imports) => {
            console.log('  ⚡ Optimizing framer-motion import');
            return match; // Keep as is for now, framer-motion is already well optimized
        }
    },
    // Lodash
    {
        from: /import\s+\{([^}]+)\}\s+from\s+['"]lodash['"]/g,
        to: (match, imports) => {
            console.log('  ⚡ Optimizing lodash import');
            const funcs = imports.split(',').map(f => f.trim());
            return funcs.map(func => `import ${func} from 'lodash/${func}'`).join('\n');
        }
    },
    // Date-fns
    {
        from: /import\s+\{([^}]+)\}\s+from\s+['"]date-fns['"]/g,
        to: (match, imports) => {
            console.log('  ⚡ Optimizing date-fns import');
            return match.replace('date-fns', 'date-fns/esm');
        }
    },
    // MUI Icons
    {
        from: /import\s+\{([^}]+)\}\s+from\s+['"]@mui\/icons-material['"]/g,
        to: (match, imports) => {
            console.log('  ⚡ Optimizing MUI icons import');
            const icons = imports.split(',').map(i => i.trim());
            return icons.map(icon => `import ${icon} from '@mui/icons-material/${icon}'`).join('\n');
        }
    },
    // React Icons
    {
        from: /import\s+\{([^}]+)\}\s+from\s+['"]react-icons\/([^'"]+)['"]/g,
        to: (match, imports, iconSet) => {
            console.log(`  ⚡ Optimizing react-icons/${iconSet} import`);
            return match; // Keep as is, react-icons is already optimized
        }
    }
];

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

// Optimize a single file
function optimizeFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    optimizations.forEach(({ from, to }) => {
        const newContent = content.replace(from, to);
        if (newContent !== content) {
            content = newContent;
            modified = true;
        }
    });
    
    if (modified) {
        console.log(`✅ Optimized: ${path.relative(process.cwd(), filePath)}`);
        // fs.writeFileSync(filePath, content, 'utf8');
        console.log('  (Dry run - uncomment writeFileSync to apply changes)');
    }
    
    return modified;
}

// Main execution
const srcDir = path.join(process.cwd(), 'src');
const files = findFiles(srcDir);

console.log(`Found ${files.length} files to analyze\n`);

let optimizedCount = 0;
files.forEach(file => {
    if (optimizeFile(file)) {
        optimizedCount++;
    }
});

console.log(`\n✨ Summary: ${optimizedCount} files would be optimized`);
console.log('\n💡 Additional recommendations:');
console.log('1. Use dynamic imports for heavy components:');
console.log('   const HeavyComponent = dynamic(() => import("./HeavyComponent"))');
console.log('\n2. Lazy load route components:');
console.log('   const AdminPage = lazy(() => import("./pages/admin"))');
console.log('\n3. Consider using lighter alternatives:');
console.log('   - moment → dayjs (2KB vs 67KB)');
console.log('   - lodash → lodash-es or native JS');
console.log('   - chart.js → recharts (tree-shakeable)');
console.log('\n4. Enable production optimizations:');
console.log('   - npm run build (production mode)');
console.log('   - Enable gzip/brotli compression');
console.log('   - Use CDN for static assets');