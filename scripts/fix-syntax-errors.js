#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const syntaxFixes = [
  // Fix function parameters
  {
    pattern: /\(gardes\/vacations:/g,
    replacement: '(affectations:'
  },
  {
    pattern: /\(nouvelles gardes\/vacations:/g,
    replacement: '(nouvellesAffectations:'
  },
  {
    pattern: /gardes\/vacations\s*:/g,
    replacement: 'affectations:'
  },
  
  // Fix variable declarations
  {
    pattern: /const gardes\/vacations\s*=/g,
    replacement: 'const affectations ='
  },
  {
    pattern: /let gardes\/vacations\s*=/g,
    replacement: 'let affectations ='
  },
  {
    pattern: /var gardes\/vacations\s*=/g,
    replacement: 'var affectations ='
  },
  
  // Fix interface properties
  {
    pattern: /gardes\/vacations\s*\??\s*:/g,
    replacement: 'affectations:'
  },
  {
    pattern: /tableaux de service\s*\??\s*:/g,
    replacement: 'trames:'
  },
  
  // Fix object destructuring
  {
    pattern: /{\s*gardes\/vacations\s*}/g,
    replacement: '{ affectations }'
  },
  {
    pattern: /{\s*gardes\/vacations\s*,/g,
    replacement: '{ affectations,'
  },
  {
    pattern: /,\s*gardes\/vacations\s*}/g,
    replacement: ', affectations }'
  },
  
  // Fix arrow function parameters
  {
    pattern: /\(\s*gardes\/vacations\s*\)\s*=>/g,
    replacement: '(affectations) =>'
  },
  
  // Fix array/object access
  {
    pattern: /\.gardes\/vacations\b/g,
    replacement: '.affectations'
  },
  
  // Fix type annotations
  {
    pattern: /:\s*Gardes\/Vacations\b/g,
    replacement: ': Affectations'
  },
  {
    pattern: /:\s*Tableaux de service\b/g,
    replacement: ': Trames'
  },
  
  // Fix generic types
  {
    pattern: /<Gardes\/Vacations>/g,
    replacement: '<Affectations>'
  },
  {
    pattern: /<Tableaux de service>/g,
    replacement: '<Trames>'
  }
];

function fixSyntaxInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    syntaxFixes.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed syntax in: ${filePath}`);
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

console.log('🔧 Fixing syntax errors caused by terminology replacement...');

const srcPath = path.join(__dirname, '..', 'src');
const totalFixed = fixSyntaxInDirectory(srcPath);

console.log(`\n✅ Fixed syntax in ${totalFixed} files`);
console.log('🚀 Ready to test build...');