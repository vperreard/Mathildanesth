#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutonomousTestRunner {
    constructor() {
        this.isRunning = false;
        this.cycleCount = 0;
        this.maxRetries = 3;
        this.bugFixEnabled = true;
        console.log('🤖 Autonomous Test Runner Initialized');
    }

    async start() {
        this.isRunning = true;
        console.log('\n🚀 Starting Autonomous E2E Testing...');
        console.log('📋 This will:');
        console.log('   1. Run comprehensive E2E tests');
        console.log('   2. Analyze and fix discovered bugs');
        console.log('   3. Restart testing until all errors are resolved');
        console.log('   4. Never stop (as requested)');
        console.log('\n⏹️  Press Ctrl+C to stop\n');

        while (this.isRunning) {
            this.cycleCount++;
            console.log(`\n🔄 ======== CYCLE ${this.cycleCount} ========`);
            
            try {
                // Step 1: Run the autonomous navigation test
                const testResult = await this.runNavigationTest();
                
                // Step 2: Analyze results and apply fixes if needed
                if (!testResult.success && this.bugFixEnabled) {
                    console.log('\n🔧 Bugs detected, attempting automatic fixes...');
                    const fixResult = await this.runBugFixer();
                    
                    if (fixResult.success) {
                        console.log('✅ Bugs fixed, continuing to next cycle...');
                    } else {
                        console.log('⚠️ Some bugs could not be auto-fixed');
                    }
                } else if (testResult.success) {
                    console.log('🎉 All tests passed! Application is stable.');
                    console.log('   Continuing monitoring...');
                }

                // Step 3: Brief pause before next cycle
                await this.sleep(5000);
                
            } catch (error) {
                console.error(`💥 Error in cycle ${this.cycleCount}:`, error.message);
                await this.sleep(10000); // Longer pause on error
            }
        }
    }

    async runNavigationTest() {
        console.log('🧪 Running autonomous navigation tests...');
        
        return new Promise((resolve) => {
            const testProcess = spawn('npm', ['run', 'test:autonomous'], {
                stdio: 'inherit',
                shell: true
            });

            testProcess.on('close', (code) => {
                const success = code === 0;
                console.log(`\n📊 Navigation test ${success ? 'PASSED' : 'FAILED'} (exit code: ${code})`);
                
                resolve({
                    success,
                    exitCode: code,
                    cycle: this.cycleCount
                });
            });

            testProcess.on('error', (error) => {
                console.error('❌ Test process error:', error);
                resolve({
                    success: false,
                    error: error.message,
                    cycle: this.cycleCount
                });
            });
        });
    }

    async runBugFixer() {
        console.log('🔧 Running autonomous bug fixer...');
        
        return new Promise((resolve) => {
            const fixerProcess = spawn('node', ['scripts/autonomous-bug-fixer.js'], {
                stdio: 'inherit',
                shell: true
            });

            fixerProcess.on('close', (code) => {
                const success = code === 0;
                console.log(`\n🛠️ Bug fixer ${success ? 'COMPLETED' : 'FAILED'} (exit code: ${code})`);
                
                resolve({
                    success,
                    exitCode: code
                });
            });

            fixerProcess.on('error', (error) => {
                console.error('❌ Bug fixer error:', error);
                resolve({
                    success: false,
                    error: error.message
                });
            });
        });
    }

    async checkApplicationHealth() {
        console.log('🏥 Checking application health...');
        
        try {
            // Try to fetch the main page
            const response = await fetch('http://localhost:3001');
            if (response.ok) {
                console.log('✅ Application is responding');
                return true;
            } else {
                console.log(`⚠️ Application returned status: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log('❌ Application is not responding:', error.message);
            return false;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    stop() {
        this.isRunning = false;
        console.log('\n🛑 Stopping autonomous test runner...');
    }

    generateStatusReport() {
        const report = {
            timestamp: new Date().toISOString(),
            cycleCount: this.cycleCount,
            isRunning: this.isRunning,
            bugFixEnabled: this.bugFixEnabled
        };

        const reportPath = './results/autonomous-status.json';
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📄 Status report saved: ${reportPath}`);
        return report;
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Received shutdown signal');
    if (runner) {
        runner.stop();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Received termination signal');
    if (runner) {
        runner.stop();
    }
    process.exit(0);
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

// Start the runner
const runner = new AutonomousTestRunner();
runner.start().catch(error => {
    console.error('💥 Runner crashed:', error);
    process.exit(1);
});