#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const additionalFixes = [
  // Fix interface declarations with spaces
  {
    pattern: /interface\s+Tableau de service\s*{/g,
    replacement: 'interface TrameModele {'
  },
  {
    pattern: /interface\s+Tableaux de service\s*{/g,
    replacement: 'interface TrameModeles {'
  },
  
  // Fix function parameters with spaces
  {
    pattern: /\(\s*tableau de service\s*:/g,
    replacement: '(trameModele:'
  },
  {
    pattern: /\(\s*tableaux de service\s*:/g,
    replacement: '(trameModeles:'
  },
  
  // Fix object property access with spaces
  {
    pattern: /\.tableaux de service\b/g,
    replacement: '.trames'
  },
  {
    pattern: /\.tableau de service\b/g,
    replacement: '.trame'
  },
  
  // Fix variable declarations with spaces
  {
    pattern: /const\s+tableau de service\s*=/g,
    replacement: 'const trameModele ='
  },
  {
    pattern: /let\s+tableau de service\s*=/g,
    replacement: 'let trameModele ='
  },
  {
    pattern: /var\s+tableau de service\s*=/g,
    replacement: 'var trameModele ='
  },
  
  // Fix type annotations with spaces
  {
    pattern: /:\s*Tableau de service\b/g,
    replacement: ': TrameModele'
  },
  {
    pattern: /:\s*Tableaux de service\b/g,
    replacement: ': TrameModeles'
  },
  
  // Fix function names with spaces
  {
    pattern: /tableau de service\s*\(/g,
    replacement: 'trameModele('
  },
  
  // Fix destructuring with spaces
  {
    pattern: /{\s*tableau de service\s*}/g,
    replacement: '{ trameModele }'
  },
  {
    pattern: /{\s*tableaux de service\s*}/g,
    replacement: '{ trameModeles }'
  },
  
  // Fix import paths with spaces
  {
    pattern: /@\/components\/tableaux de service\//g,
    replacement: '@/components/trames/'
  },
  {
    pattern: /@\/modules\/modèles\//g,
    replacement: '@/modules/templates/'
  },
  {
    pattern: /@\/services\/tableaux de service/g,
    replacement: '@/services/trames'
  },
  
  // Fix array access with spaces
  {
    pattern: /\[tableau de service\]/g,
    replacement: '[trameModele]'
  },
  {
    pattern: /\[tableaux de service\]/g,
    replacement: '[trameModeles]'
  }
];

function fixSyntaxInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    additionalFixes.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed additional syntax in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function fixSyntaxInDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let totalFixed = 0;
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      totalFixed += fixSyntaxInDirectory(fullPath);
    } else if (file.isFile() && /\.(tsx?|jsx?)$/.test(file.name)) {
      if (fixSyntaxInFile(fullPath)) {
        totalFixed++;
      }
    }
  }
  
  return totalFixed;
}

console.log('🔧 Fixing remaining syntax errors...');

const srcPath = path.join(__dirname, '..', 'src');
const totalFixed = fixSyntaxInDirectory(srcPath);

console.log(`\n✅ Fixed additional syntax in ${totalFixed} files`);