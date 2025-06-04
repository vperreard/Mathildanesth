#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📊 Bundle Size Report\n');

// Get current package.json dependencies
const packageJson = require(path.join(process.cwd(), 'package.json'));
const deps = packageJson.dependencies || {};

// Large dependencies to check
const largeDeps = {
    '@fullcalendar': { size: '~2MB', alternative: 'react-big-calendar or custom' },
    'recharts': { size: '~500KB', alternative: 'd3 + custom components' },
    'framer-motion': { size: '~150KB', alternative: 'CSS animations or react-spring' },
    '@mui/material': { size: '~500KB', alternative: 'Tailwind UI components' },
    'lodash': { size: '~70KB', alternative: 'lodash-es or native JS' },
    'moment': { size: '~280KB', alternative: 'dayjs (2KB)' },
    'chart.js': { size: '~200KB', alternative: 'visx or custom SVG' },
    '@hello-pangea/dnd': { size: '~180KB', alternative: 'react-sortable-hoc' },
};

console.log('🔍 Checking large dependencies:\n');

let totalEstimatedSize = 0;
Object.entries(largeDeps).forEach(([dep, info]) => {
    const hasPackage = Object.keys(deps).some(d => d.startsWith(dep));
    if (hasPackage) {
        console.log(`❌ ${dep.padEnd(20)} ${info.size.padEnd(10)} → Consider: ${info.alternative}`);
        const sizeKB = parseInt(info.size.match(/\d+/)[0]) * (info.size.includes('MB') ? 1024 : 1);
        totalEstimatedSize += sizeKB;
    }
});

console.log(`\n📦 Estimated size from large deps: ~${(totalEstimatedSize / 1024).toFixed(1)}MB`);

// Check for duplicate packages
console.log('\n🔍 Checking for duplicate packages:\n');
try {
    const duplicates = execSync('npm ls --depth=0 --json 2>/dev/null || true', { encoding: 'utf8' });
    const parsed = JSON.parse(duplicates);
    
    const packages = new Map();
    
    function checkDuplicates(deps) {
        Object.entries(deps || {}).forEach(([name, info]) => {
            if (packages.has(name)) {
                console.log(`⚠️  Duplicate: ${name} (multiple versions)`);
            } else {
                packages.set(name, info.version);
            }
        });
    }
    
    checkDuplicates(parsed.dependencies);
} catch (e) {
    console.log('Could not check for duplicates');
}

// Optimization recommendations
console.log('\n💡 Top Optimization Recommendations:\n');

const recommendations = [
    {
        title: '1. Implement Code Splitting',
        code: `// pages/admin/[...slug].tsx
const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});`
    },
    {
        title: '2. Optimize Calendar Page (8.92MB)',
        code: `// Split calendar components
const Calendar = dynamic(() => import('@fullcalendar/react'));
const DayGridPlugin = dynamic(() => import('@fullcalendar/daygrid'));`
    },
    {
        title: '3. Use Lighter Alternatives',
        code: `// Replace moment with dayjs
import dayjs from 'dayjs';
const formatted = dayjs(date).format('YYYY-MM-DD');`
    },
    {
        title: '4. Tree-shake imports',
        code: `// Instead of: import * as React from 'react';
import React, { useState, useEffect } from 'react';`
    }
];

recommendations.forEach(rec => {
    console.log(`${rec.title}:`);
    console.log(`\`\`\`javascript\n${rec.code}\n\`\`\`\n`);
});

// Bundle size goals
console.log('🎯 Bundle Size Goals:\n');
console.log('- Total JS: < 50MB (currently likely > 100MB)');
console.log('- Calendar page: < 1MB (currently 8.92MB)');
console.log('- Initial load: < 200KB');
console.log('- Lazy load everything else');

console.log('\n✅ Run `ANALYZE=true npm run build` for detailed analysis');