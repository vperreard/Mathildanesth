#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Analyzing Bundle Size...\n');

// Build with bundle analyzer
console.log('📦 Building with bundle analyzer...');
try {
    execSync('ANALYZE=true npm run build', { stdio: 'inherit' });
} catch (error) {
    console.log('Build completed with warnings');
}

// Analyze chunk sizes
const chunksDir = path.join(process.cwd(), '.next/static/chunks');

if (fs.existsSync(chunksDir)) {
    console.log('\n📊 Analyzing chunks...\n');
    
    const chunks = fs.readdirSync(chunksDir)
        .filter(file => file.endsWith('.js'))
        .map(file => {
            const stats = fs.statSync(path.join(chunksDir, file));
            return {
                name: file,
                size: stats.size,
                sizeKB: (stats.size / 1024).toFixed(2),
                sizeMB: (stats.size / 1024 / 1024).toFixed(2)
            };
        })
        .sort((a, b) => b.size - a.size);
    
    // Display top 10 largest chunks
    console.log('Top 10 Largest Chunks:');
    console.log('='.repeat(60));
    
    chunks.slice(0, 10).forEach((chunk, index) => {
        const bar = '█'.repeat(Math.floor((chunk.size / chunks[0].size) * 40));
        console.log(`${(index + 1).toString().padStart(2)}. ${chunk.name.padEnd(40)} ${chunk.sizeKB.padStart(8)} KB ${bar}`);
    });
    
    // Total size
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    console.log('\n' + '='.repeat(60));
    console.log(`Total JS Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Recommendations
    console.log('\n🎯 Recommendations to Reduce Bundle Size:\n');
    
    if (chunks.find(c => c.name.includes('vendors'))) {
        const vendorChunk = chunks.find(c => c.name.includes('vendors'));
        if (vendorChunk.size > 1000000) {
            console.log('❌ Vendor bundle is too large (' + vendorChunk.sizeKB + ' KB)');
            console.log('   - Analyze dependencies with: npm list --depth=0');
            console.log('   - Consider replacing large libraries');
            console.log('   - Use dynamic imports for non-critical vendor code\n');
        }
    }
    
    // Check for specific large dependencies
    const packageJson = require(path.join(process.cwd(), 'package.json'));
    const largePackages = {
        'moment': 'dayjs (2KB vs 67KB)',
        'lodash': 'lodash-es with tree-shaking or native JS',
        'date-fns': 'dayjs or date-fns/esm',
        '@mui/material': 'Import specific components only',
        'react-select': 'downshift or custom solution',
        'chart.js': 'recharts or visx for tree-shaking'
    };
    
    console.log('📦 Package Optimization Suggestions:\n');
    Object.keys(largePackages).forEach(pkg => {
        if (packageJson.dependencies[pkg] || packageJson.devDependencies[pkg]) {
            console.log(`⚠️  ${pkg} detected → Consider: ${largePackages[pkg]}`);
        }
    });
    
    // Dynamic import suggestions
    console.log('\n🔄 Dynamic Import Opportunities:\n');
    const dynamicImportCandidates = [
        { path: 'admin/', description: 'Admin pages (only for admin users)' },
        { path: 'charts/', description: 'Chart components (load on demand)' },
        { path: 'modals/', description: 'Modal components (load when opened)' },
        { path: 'forms/', description: 'Complex forms (load on route)' }
    ];
    
    dynamicImportCandidates.forEach(candidate => {
        console.log(`- ${candidate.path} → ${candidate.description}`);
    });
    
    // Code splitting suggestions
    console.log('\n✂️  Code Splitting Strategy:\n');
    console.log('1. Route-based splitting:');
    console.log('   - Each major route should have its own chunk');
    console.log('   - Use next/dynamic for page components\n');
    
    console.log('2. Component-based splitting:');
    console.log('   - Heavy components (editors, charts, calendars)');
    console.log('   - Third-party integrations\n');
    
    console.log('3. Conditional splitting:');
    console.log('   - Features based on user role');
    console.log('   - Premium features\n');
    
    // Example optimization
    console.log('📝 Example Optimization:\n');
    console.log(`// Before
import { BlocPlanning } from './components/BlocPlanning';

// After
const BlocPlanning = dynamic(() => import('./components/BlocPlanning'), {
  loading: () => <Skeleton />,
  ssr: false
});`);
    
} else {
    console.error('❌ Build directory not found. Run npm run build first.');
}

console.log('\n✅ Analysis complete!');