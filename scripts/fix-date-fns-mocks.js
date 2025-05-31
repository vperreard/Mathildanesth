#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Mock complet de date-fns à injecter
const DATE_FNS_MOCK = `// Mock complet de date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, format) => {
    if (!date) return '';
    const d = new Date(date);
    if (format === 'yyyy-MM-dd') return d.toISOString().split('T')[0];
    if (format === 'dd/MM/yyyy') return d.toLocaleDateString('fr-FR');
    if (format === 'HH:mm') return d.toTimeString().substring(0, 5);
    return d.toISOString();
  }),
  formatISO: jest.fn((date) => new Date(date).toISOString()),
  formatDistance: jest.fn(() => '2 heures'),
  formatRelative: jest.fn(() => "aujourd'hui à 10:00"),
  parse: jest.fn((dateString) => new Date(dateString)),
  parseISO: jest.fn((dateString) => new Date(dateString)),
  addDays: jest.fn((date, amount) => {
    const result = new Date(date);
    result.setDate(result.getDate() + amount);
    return result;
  }),
  addMonths: jest.fn((date, amount) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + amount);
    return result;
  }),
  subMonths: jest.fn((date, amount) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() - amount);
    return result;
  }),
  addYears: jest.fn((date, amount) => {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + amount);
    return result;
  }),
  subDays: jest.fn((date, amount) => {
    const result = new Date(date);
    result.setDate(result.getDate() - amount);
    return result;
  }),
  isAfter: jest.fn((date1, date2) => new Date(date1) > new Date(date2)),
  isBefore: jest.fn((date1, date2) => new Date(date1) < new Date(date2)),
  isEqual: jest.fn((date1, date2) => new Date(date1).getTime() === new Date(date2).getTime()),
  isSameDay: jest.fn((date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
  }),
  isValid: jest.fn((date) => !isNaN(new Date(date).getTime())),
  isWeekend: jest.fn((date) => {
    const day = new Date(date).getDay();
    return day === 0 || day === 6;
  }),
  getYear: jest.fn((date) => new Date(date).getFullYear()),
  getMonth: jest.fn((date) => new Date(date).getMonth()),
  getDate: jest.fn((date) => new Date(date).getDate()),
  getDay: jest.fn((date) => new Date(date).getDay()),
  getHours: jest.fn((date) => new Date(date).getHours()),
  getMinutes: jest.fn((date) => new Date(date).getMinutes()),
  setYear: jest.fn((date, year) => {
    const d = new Date(date);
    d.setFullYear(year);
    return d;
  }),
  setMonth: jest.fn((date, month) => {
    const d = new Date(date);
    d.setMonth(month);
    return d;
  }),
  startOfDay: jest.fn((date) => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }),
  endOfDay: jest.fn((date) => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }),
  startOfWeek: jest.fn((date) => {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1);
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }),
  endOfWeek: jest.fn((date) => {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? 0 : 7);
    result.setDate(diff);
    result.setHours(23, 59, 59, 999);
    return result;
  }),
  startOfMonth: jest.fn((date) => {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
  }),
  endOfMonth: jest.fn((date) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1, 0);
    result.setHours(23, 59, 59, 999);
    return result;
  }),
  differenceInDays: jest.fn((date1, date2) => {
    const diffTime = new Date(date1).getTime() - new Date(date2).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }),
  differenceInHours: jest.fn((date1, date2) => {
    const diffTime = new Date(date1).getTime() - new Date(date2).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }),
  differenceInMinutes: jest.fn((date1, date2) => {
    const diffTime = new Date(date1).getTime() - new Date(date2).getTime();
    return Math.ceil(diffTime / (1000 * 60));
  }),
  eachDayOfInterval: jest.fn(({ start, end }) => {
    const days = [];
    const current = new Date(start);
    const endDate = new Date(end);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }),
  max: jest.fn((...dates) => new Date(Math.max(...dates.map(d => new Date(d).getTime())))),
  min: jest.fn((...dates) => new Date(Math.min(...dates.map(d => new Date(d).getTime()))))
}));

`;

// Trouver tous les fichiers de test avec erreurs date-fns
function findTestFilesWithDateFnsErrors() {
  try {
    const result = execSync('npm test 2>&1 | grep -l "dateFns\\|date_fns" || true', { encoding: 'utf8' });
    return result.split('\\n').filter(Boolean);
  } catch (error) {
    console.log('Recherche par analyse de code...');
    
    // Fallback: chercher les fichiers qui importent date-fns
    const result = execSync('find src -name "*.test.*" -exec grep -l "date-fns" {} \\; 2>/dev/null || true', { encoding: 'utf8' });
    return result.split('\\n').filter(Boolean);
  }
}

// Ajouter le mock à un fichier de test
function addDateFnsMock(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier si le mock existe déjà
    if (content.includes('jest.mock(\'date-fns\'')) {
      console.log(\`✓ Mock déjà présent dans \${filePath}\`);
      return false;
    }
    
    // Trouver où insérer le mock (avant les imports React)
    const lines = content.split('\\n');
    let insertIndex = 0;
    
    // Chercher la première ligne d'import React ou de test
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('import React') || 
          lines[i].includes('import { render') ||
          lines[i].includes('describe(')) {
        insertIndex = i;
        break;
      }
    }
    
    // Insérer le mock
    lines.splice(insertIndex, 0, DATE_FNS_MOCK);
    
    fs.writeFileSync(filePath, lines.join('\\n'));
    console.log(\`✅ Mock ajouté à \${filePath}\`);
    return true;
  } catch (error) {
    console.error(\`❌ Erreur avec \${filePath}:\`, error.message);
    return false;
  }
}

// Script principal
function main() {
  console.log('🔍 Recherche des fichiers de test avec erreurs date-fns...');
  
  // Liste manuelle des fichiers problématiques identifiés
  const problematicFiles = [
    'src/modules/leaves/components/__tests__/LeaveForm.comprehensive.test.tsx',
    'src/components/ui/__tests__/calendar.comprehensive.test.tsx',
    'src/components/requests/__tests__/UnifiedRequestForm.test.tsx',
    'src/app/planning/hebdomadaire/__tests__/page.test.tsx'
  ];
  
  let fixed = 0;
  
  for (const file of problematicFiles) {
    if (fs.existsSync(file)) {
      if (addDateFnsMock(file)) {
        fixed++;
      }
    } else {
      console.log(\`⚠️  Fichier non trouvé: \${file}\`);
    }
  }
  
  console.log(\`\\n📊 Résumé: \${fixed} fichiers corrigés\`);
  
  if (fixed > 0) {
    console.log('\\n🧪 Exécution d\\'un test rapide...');
    try {
      execSync('npm test -- src/modules/leaves/utils/__tests__/dateCalculations.test.ts --silent', { stdio: 'inherit' });
      console.log('✅ Test de validation réussi!');
    } catch (error) {
      console.log('⚠️  Il peut y avoir d\\'autres erreurs à corriger');
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { addDateFnsMock, DATE_FNS_MOCK };