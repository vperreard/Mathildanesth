#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to fix based on grep results
const filesToFix = [
    'src/app/api/utilisateurs/[id]/reset-password/route.ts',
    'src/app/api/trames/[id]/route.ts',
    'src/app/api/specialties/[id]/route.ts',
    'src/app/api/sectors/[id]/route.ts',
    'src/app/api/rules/[id]/route.ts',
    'src/app/api/planning-rules/[id]/route.ts',
    'src/app/api/notifications/[id]/read/route.ts',
    'src/app/api/chirurgiens/[id]/route.ts',
    'src/app/api/assignments/swap/[id]/route.ts',
    'src/app/api/assignments/swap/[id]/admin/route.ts',
    'src/app/api/assignment-types/[id]/route.ts',
    'src/app/api/admin/leaves/[id]/reject/route.ts'
];

const projectRoot = '/Users/vincentperreard/Mathildanesth';

filesToFix.forEach(filePath => {
    const fullPath = path.join(projectRoot, filePath);
    
    try {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Pattern 1: Fix function signatures with { params }: { params: { id: string } }
        content = content.replace(
            /\{\s*params\s*\}\s*:\s*\{\s*params:\s*\{\s*id:\s*string\s*\}\s*\}/g,
            '{ params }: { params: Promise<{ id: string }> }'
        );
        
        // Pattern 2: Fix access to params.id
        content = content.replace(
            /const\s+(\w+)\s*=\s*params\.id;/g,
            'const { id: $1 } = await params;'
        );
        
        // Pattern 3: Fix destructuring directly
        content = content.replace(
            /const\s+\{\s*id\s*\}\s*=\s*params;/g,
            'const { id } = await params;'
        );
        
        // Pattern 4: Fix if there's already await Promise.resolve(params)
        content = content.replace(
            /const\s+\{\s*id\s*\}\s*=\s*await\s+Promise\.resolve\(params\);/g,
            'const { id } = await params;'
        );
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Fixed: ${filePath}`);
    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
});

console.log('Done!');