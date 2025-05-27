#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const finalCleanupFixes = [
  // Fix specific syntax issues found in build errors
  {
    pattern: /garde\/vacation\s*:/g,
    replacement: 'affectation:'
  },
  {
    pattern: /{\s*garde\/vacation\s*}/g,
    replacement: '{ affectation }'
  },
  {
    pattern: /{\s*garde\/vacation\s*,/g,
    replacement: '{ affectation,'
  },
  {
    pattern: /,\s*garde\/vacation\s*}/g,
    replacement: ', affectation }'
  },
  {
    pattern: /\bgarde\/vacation\./g,
    replacement: 'affectation.'
  },
  {
    pattern: /\bgarde\/vacation\s*=/g,
    replacement: 'affectation ='
  },
  {
    pattern: /\(garde\/vacation\)/g,
    replacement: '(affectation)'
  },
  {
    pattern: /\(\s*garde\/vacation\s*\)/g,
    replacement: '(affectation)'
  },
  {
    pattern: /\[\s*garde\/vacation\s*\]/g,
    replacement: '[affectation]'
  },
  
  // Fix any remaining spaces in variable names
  {
    pattern: /\btableau de service(?=\s*[\.\[\(,;])/g,
    replacement: 'trameModele'
  },
  {
    pattern: /\btableaux de service(?=\s*[\.\[\(,;])/g,
    replacement: 'trameModeles'
  },
  
  // Fix destructuring patterns
  {
    pattern: /\(\s*{\s*garde\/vacation\s*}\s*\)/g,
    replacement: '({ affectation })'
  },
  {
    pattern: /\(\s*{\s*tableau de service\s*}\s*\)/g,
    replacement: '({ trameModele })'
  }
];

function fixSyntaxInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    finalCleanupFixes.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Final cleanup in: ${filePath}`);
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

console.log('🔧 Running final cleanup...');

const srcPath = path.join(__dirname, '..', 'src');
const totalFixed = fixSyntaxInDirectory(srcPath);

console.log(`\n✅ Final cleanup completed on ${totalFixed} files`);