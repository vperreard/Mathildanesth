#!/usr/bin/env node

// Script pour lancer Jest sans les warnings punycode
const { spawn } = require('child_process');

// Supprimer les warnings de dépréciation Node.js
process.env.NODE_NO_WARNINGS = '1';
process.env.NODE_OPTIONS = '--disable-warning=DEP0040';

// Lancer Jest avec les bonnes options
const args = process.argv.slice(2);
const jestCommand = spawn('npx', ['jest', ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_NO_WARNINGS: '1',
    NODE_OPTIONS: '--disable-warning=DEP0040'
  }
});

jestCommand.on('close', (code) => {
  process.exit(code);
});

jestCommand.on('error', (error) => {
  console.error('Error running jest:', error);
  process.exit(1);
});