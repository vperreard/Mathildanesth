#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const finalFixes = [
  // Fix React references inside function bodies
  {
    pattern: /\bif\s*\(\s*tableau de service\./g,
    replacement: 'if (trameModele.'
  },
  {
    pattern: /\btableau de service\./g,
    replacement: 'trameModele.'
  },
  
  // Fix destructuring and state declarations
  {
    pattern: /\[tableaux de service,\s*/g,
    replacement: '[trameModeles, '
  },
  {
    pattern: /setTrames\]\s*=\s*useState<Tableau de service\[\]>/g,
    replacement: 'setTrames] = useState<TrameModele[]>'
  },
  {
    pattern: /useState<Tableau de service\s*\|\s*null>/g,
    replacement: 'useState<TrameModele | null>'
  },
  
  // Fix import paths with French terms
  {
    pattern: /'\.\.\/\.\.\/\.\.\/types\/attribution'/g,
    replacement: "'../../../types/assignment'"
  },
  
  // Fix references to variables with spaces
  {
    pattern: /setSelectedTrame\s*\(\s*tableau de service/g,
    replacement: 'setSelectedTrame(trameModele'
  },
  
  // Fix variable names in logic
  {
    pattern: /\btableau de service\b(?!\s*:)/g,
    replacement: 'trameModele'
  },
  {
    pattern: /\btableaux de service\b(?!\s*:)/g,
    replacement: 'trameModeles'
  }
];

function fixSyntaxInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    finalFixes.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed final syntax in: ${filePath}`);
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

console.log('🔧 Fixing final syntax errors...');

const srcPath = path.join(__dirname, '..', 'src');
const totalFixed = fixSyntaxInDirectory(srcPath);

console.log(`\n✅ Fixed final syntax in ${totalFixed} files`);