#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to search for
const DEBT_PATTERNS = ['TODO', 'FIXME', 'HACK', '@todo', '@fixme', '@hack'];

// Directories to exclude
const EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  'coverage',
  'dist',
  '.git',
  'build',
  'out',
  'public',
  '.cache',
];

// File extensions to include
const INCLUDE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];

// Categories and their keywords
const CATEGORY_KEYWORDS = {
  CRITICAL: [
    'security',
    'auth',
    'password',
    'token',
    'jwt',
    'authentication',
    'authorization',
    'encrypt',
    'decrypt',
    'permission',
    'role',
    'sql injection',
    'xss',
    'csrf',
    'vulnerability',
    'exploit',
    'data leak',
    'sensitive',
    'credentials',
    'secret',
  ],
  HIGH: [
    'performance',
    'memory leak',
    'bug',
    'error',
    'crash',
    'broken',
    'critical',
    'urgent',
    'asap',
    'blocking',
    'prod',
    'production',
    'data loss',
    'corruption',
    'race condition',
    'deadlock',
  ],
  MEDIUM: [
    'refactor',
    'cleanup',
    'optimize',
    'improve',
    'enhancement',
    'deprecated',
    'legacy',
    'migration',
    'upgrade',
    'tech debt',
    'duplicate',
    'redundant',
    'consistency',
  ],
  LOW: [
    'comment',
    'docs',
    'documentation',
    'typo',
    'style',
    'format',
    'rename',
    'cosmetic',
    'ui',
    'ux',
    'nice to have',
    'later',
    'future',
    'maybe',
    'consider',
  ],
};

function categorizeDebt(content, filePath) {
  const lowerContent = content.toLowerCase();
  const lowerPath = filePath.toLowerCase();

  // Check for critical patterns in file path
  if (lowerPath.includes('auth') || lowerPath.includes('security')) {
    for (const keyword of CATEGORY_KEYWORDS.CRITICAL) {
      if (lowerContent.includes(keyword)) {
        return 'CRITICAL';
      }
    }
  }

  // Check content for category keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        return category;
      }
    }
  }

  return 'MEDIUM'; // Default category
}

function extractContext(lines, lineIndex, contextLines = 2) {
  const start = Math.max(0, lineIndex - contextLines);
  const end = Math.min(lines.length - 1, lineIndex + contextLines);

  return lines.slice(start, end + 1).map((line, idx) => ({
    lineNumber: start + idx + 1,
    content: line,
    isTarget: start + idx === lineIndex,
  }));
}

function findTechDebt() {
  const results = {
    summary: {
      total: 0,
      byCategory: {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
      },
      byType: {},
    },
    items: [],
  };

  // Build glob patterns for each extension
  const patterns = INCLUDE_EXTENSIONS.map(ext => `**/*${ext}`);
  const files = [];

  patterns.forEach(pattern => {
    const matchedFiles = glob.sync(pattern, {
      nodir: true,
      ignore: EXCLUDE_DIRS.map(dir => `**/${dir}/**`),
    });
    files.push(...matchedFiles);
  });

  console.log(`Found ${files.length} files to analyze...`);

  files.forEach((file, fileIndex) => {
    if (fileIndex % 100 === 0) {
      console.log(`Processing file ${fileIndex + 1}/${files.length}...`);
    }

    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, lineIndex) => {
        DEBT_PATTERNS.forEach(pattern => {
          if (line.includes(pattern)) {
            const debtContent = line.trim();
            const category = categorizeDebt(debtContent, file);
            const context = extractContext(lines, lineIndex);

            results.items.push({
              file: file,
              line: lineIndex + 1,
              type: pattern,
              category: category,
              content: debtContent,
              context: context,
            });

            results.summary.total++;
            results.summary.byCategory[category]++;
            results.summary.byType[pattern] = (results.summary.byType[pattern] || 0) + 1;
          }
        });
      });
    } catch (error) {
      console.error(`Error processing file ${file}:`, error.message);
    }
  });

  // Sort items by category priority
  const categoryPriority = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  results.items.sort((a, b) => {
    const priorityDiff = categoryPriority[a.category] - categoryPriority[b.category];
    if (priorityDiff !== 0) return priorityDiff;
    return a.file.localeCompare(b.file);
  });

  return results;
}

function generateReport(results) {
  const timestamp = new Date().toISOString();

  const report = {
    timestamp,
    projectPath: process.cwd(),
    summary: results.summary,
    criticalItems: results.items.filter(item => item.category === 'CRITICAL'),
    highPriorityItems: results.items.filter(item => item.category === 'HIGH'),
    allItems: results.items,
  };

  // Save full report
  fs.writeFileSync(
    path.join(__dirname, '..', 'tech-debt-report.json'),
    JSON.stringify(report, null, 2)
  );

  // Generate summary report
  const summaryText = `
# Tech Debt Audit Report
Generated: ${timestamp}

## Summary
- Total TODOs/FIXMEs: ${results.summary.total}
- CRITICAL: ${results.summary.byCategory.CRITICAL}
- HIGH: ${results.summary.byCategory.HIGH}
- MEDIUM: ${results.summary.byCategory.MEDIUM}
- LOW: ${results.summary.byCategory.LOW}

## By Type
${Object.entries(results.summary.byType)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join('\n')}

## Critical Items (${report.criticalItems.length})
${report.criticalItems
  .slice(0, 10)
  .map(
    item =>
      `\n### ${item.file}:${item.line}
Category: ${item.category}
Type: ${item.type}
Content: ${item.content}
Context:
${item.context
  .map(ctx => `${ctx.lineNumber}: ${ctx.isTarget ? '>>>' : '   '} ${ctx.content}`)
  .join('\n')}`
  )
  .join('\n')}

${report.criticalItems.length > 10 ? `\n... and ${report.criticalItems.length - 10} more critical items` : ''}

## Next Steps
1. Review all CRITICAL items in tech-debt-report.json
2. Create tickets for each critical item
3. Start resolving from most critical to least
`;

  fs.writeFileSync(path.join(__dirname, '..', 'tech-debt-summary.md'), summaryText);

  return { report, summaryText };
}

// Main execution
console.log('Starting tech debt audit...');
console.log('Excluding directories:', EXCLUDE_DIRS.join(', '));
console.log('Including file extensions:', INCLUDE_EXTENSIONS.join(', '));
console.log('');

const results = findTechDebt();
const { summaryText } = generateReport(results);

console.log('\n' + summaryText);
console.log('\nFull report saved to: tech-debt-report.json');
console.log('Summary saved to: tech-debt-summary.md');
