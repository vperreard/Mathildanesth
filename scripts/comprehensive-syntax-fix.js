#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const comprehensiveFixes = [
  // Fix all remaining type casting issues
  {
    pattern: /as\s+Tableau de service/g,
    replacement: 'as TrameModele'
  },
  {
    pattern: /as\s+Tableaux de service/g,
    replacement: 'as TrameModele[]'
  },
  
  // Fix variable names in template literals and strings
  {
    pattern: /`[^`]*tableau de service[^`]*`/g,
    replacement: (match) => match.replace(/tableau de service/g, 'tableau de service')
  },
  {
    pattern: /'[^']*tableau de service[^']*'/g,
    replacement: (match) => match.replace(/tableau de service/g, 'tableau de service')
  },
  {
    pattern: /"[^"]*tableau de service[^"]*"/g,
    replacement: (match) => match.replace(/tableau de service/g, 'tableau de service')
  },
  
  // Fix any remaining variable references
  {
    pattern: /\btableau de service(?=\s*[\.\[\(])/g,
    replacement: 'trameModele'
  },
  {
    pattern: /\btableaux de service(?=\s*[\.\[\(])/g,
    replacement: 'trameModeles'
  },
  
  // Fix JSX attribute issues
  {
    pattern: /tableau de service=/g,
    replacement: 'trameModele='
  },
  {
    pattern: /tableaux de service=/g,
    replacement: 'trameModeles='
  },
  
  // Fix function calls
  {
    pattern: /\btableau de service\s*\(/g,
    replacement: 'trameModele('
  },
  {
    pattern: /\btableaux de service\s*\(/g,
    replacement: 'trameModeles('
  },
  
  // Fix remaining spaces in types
  {
    pattern: /:\s*Tableau de service(?!\w)/g,
    replacement: ': TrameModele'
  },
  {
    pattern: /:\s*Tableaux de service(?!\w)/g,
    replacement: ': TrameModele[]'
  },
  
  // Fix React component props
  {
    pattern: /{tableau de service}/g,
    replacement: '{trameModele}'
  },
  {
    pattern: /{tableaux de service}/g,
    replacement: '{trameModeles}'
  },
  
  // Fix array methods
  {
    pattern: /\.find\(\s*tableau de service\s*=>/g,
    replacement: '.find(trameModele =>'
  },
  {
    pattern: /\.filter\(\s*tableau de service\s*=>/g,
    replacement: '.filter(trameModele =>'
  },
  {
    pattern: /\.map\(\s*tableau de service\s*=>/g,
    replacement: '.map(trameModele =>'
  },
  {
    pattern: /\.forEach\(\s*tableau de service\s*=>/g,
    replacement: '.forEach(trameModele =>'
  }
];

function fixSyntaxInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    comprehensiveFixes.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed comprehensive syntax in: ${filePath}`);
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

console.log('🔧 Running comprehensive syntax fix...');

const srcPath = path.join(__dirname, '..', 'src');
const totalFixed = fixSyntaxInDirectory(srcPath);

console.log(`\n✅ Fixed comprehensive syntax in ${totalFixed} files`);