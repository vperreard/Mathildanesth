#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

class AutonomousTestingDaemon {
    constructor() {
        this.cycleCount = 0;
        this.isRunning = false;
        this.maxCycles = process.env.MAX_CYCLES ? parseInt(process.env.MAX_CYCLES) : Infinity;
        this.delayBetweenCycles = process.env.CYCLE_DELAY ? parseInt(process.env.CYCLE_DELAY) : 30000; // 30 seconds
        this.testResults = [];
        this.bugDatabase = new Map();
        this.startTime = performance.now();
        
        // Create results directories
        this.ensureDirectories();
        
        console.log('🤖 Autonomous Testing Daemon Initialized');
        console.log(`📊 Max Cycles: ${this.maxCycles === Infinity ? 'Infinite' : this.maxCycles}`);
        console.log(`⏱️  Delay Between Cycles: ${this.delayBetweenCycles}ms`);
    }

    ensureDirectories() {
        const dirs = [
            './tests/e2e/screenshots',
            './results',
            './results/autonomous',
            './results/bug-reports'
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    async runTestCycle() {
        const cycleStartTime = performance.now();
        this.cycleCount++;
        
        console.log(`\n🔄 Starting Test Cycle ${this.cycleCount}...`);
        console.log(`🕒 Time: ${new Date().toISOString()}`);
        
        return new Promise((resolve) => {
            // Start development server first
            console.log('🚀 Starting development server...');
            const devServer = spawn('npm', ['run', 'dev'], {
                stdio: 'pipe',
                shell: true
            });

            let serverReady = false;

            // Wait for server to be ready
            const checkServer = setInterval(async () => {
                try {
                    const response = await fetch('http://localhost:3001');
                    if (response.ok || response.status < 500) {
                        serverReady = true;
                        clearInterval(checkServer);
                        console.log('✅ Development server is ready');
                        
                        // Run the autonomous tests
                        this.runAutonomousTests(devServer, cycleStartTime, resolve);
                    }
                } catch (error) {
                    // Server not ready yet, continue checking
                }
            }, 2000);

            // Timeout after 60 seconds
            setTimeout(() => {
                if (!serverReady) {
                    clearInterval(checkServer);
                    console.error('❌ Server failed to start within 60 seconds');
                    devServer.kill();
                    resolve({ success: false, error: 'Server timeout' });
                }
            }, 60000);
        });
    }

    runAutonomousTests(devServer, cycleStartTime, resolve) {
        console.log('🧪 Running autonomous E2E tests...');
        
        const testProcess = spawn('npm', ['run', 'test:e2e:puppeteer'], {
            stdio: 'pipe',
            shell: true,
            env: { ...process.env, HEADLESS: 'true' }
        });

        let testOutput = '';
        let testError = '';

        testProcess.stdout.on('data', (data) => {
            const output = data.toString();
            testOutput += output;
            console.log(output);
        });

        testProcess.stderr.on('data', (data) => {
            const error = data.toString();
            testError += error;
            console.error(error);
        });

        testProcess.on('close', (code) => {
            devServer.kill();
            
            const cycleEndTime = performance.now();
            const cycleDuration = cycleEndTime - cycleStartTime;
            
            const result = {
                cycle: this.cycleCount,
                timestamp: new Date().toISOString(),
                duration: Math.round(cycleDuration),
                exitCode: code,
                success: code === 0,
                output: testOutput,
                error: testError
            };

            this.testResults.push(result);
            this.analyzeResults(result);
            this.generateCycleReport(result);

            console.log(`\n📊 Cycle ${this.cycleCount} Complete:`);
            console.log(`   Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
            console.log(`   Duration: ${Math.round(result.duration / 1000)}s`);
            console.log(`   Exit Code: ${code}`);

            resolve(result);
        });
    }

    analyzeResults(result) {
        // Extract errors and bugs from test output
        const output = result.output + result.error;
        
        // Look for common error patterns
        const errorPatterns = [
            /Error: (.+)/gi,
            /Failed: (.+)/gi,
            /TypeError: (.+)/gi,
            /ReferenceError: (.+)/gi,
            /TimeoutError: (.+)/gi,
            /Navigation timeout: (.+)/gi,
            /Element not found: (.+)/gi
        ];

        errorPatterns.forEach(pattern => {
            const matches = output.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const bugKey = this.normalizeBugDescription(match);
                    if (this.bugDatabase.has(bugKey)) {
                        this.bugDatabase.get(bugKey).occurrences++;
                        this.bugDatabase.get(bugKey).lastSeen = result.timestamp;
                    } else {
                        this.bugDatabase.set(bugKey, {
                            description: match,
                            firstSeen: result.timestamp,
                            lastSeen: result.timestamp,
                            occurrences: 1,
                            cycles: [result.cycle]
                        });
                    }
                });
            }
        });
    }

    normalizeBugDescription(description) {
        // Normalize error descriptions to group similar issues
        return description
            .replace(/\d+/g, 'N') // Replace numbers with N
            .replace(/https?:\/\/[^\s]+/g, 'URL') // Replace URLs
            .replace(/file:\/\/[^\s]+/g, 'FILE') // Replace file paths
            .toLowerCase()
            .trim();
    }

    generateCycleReport(result) {
        const reportData = {
            cycle: result.cycle,
            timestamp: result.timestamp,
            duration: result.duration,
            success: result.success,
            totalCycles: this.cycleCount,
            uptime: Math.round((performance.now() - this.startTime) / 1000),
            bugs: Array.from(this.bugDatabase.entries()).map(([key, bug]) => ({
                key,
                ...bug
            }))
        };

        // Save individual cycle report
        const cycleReportPath = `./results/autonomous/cycle-${this.cycleCount}.json`;
        fs.writeFileSync(cycleReportPath, JSON.stringify(reportData, null, 2));

        // Update cumulative report
        const cumulativeReport = {
            daemonStartTime: new Date(this.startTime).toISOString(),
            currentTime: new Date().toISOString(),
            totalCycles: this.cycleCount,
            successfulCycles: this.testResults.filter(r => r.success).length,
            failedCycles: this.testResults.filter(r => !r.success).length,
            uniqueBugs: this.bugDatabase.size,
            totalBugOccurrences: Array.from(this.bugDatabase.values()).reduce((sum, bug) => sum + bug.occurrences, 0),
            averageCycleDuration: Math.round(this.testResults.reduce((sum, r) => sum + r.duration, 0) / this.testResults.length),
            recentResults: this.testResults.slice(-10), // Last 10 cycles
            bugSummary: Array.from(this.bugDatabase.entries())
                .map(([key, bug]) => ({ key, ...bug }))
                .sort((a, b) => b.occurrences - a.occurrences)
        };

        fs.writeFileSync('./results/autonomous/cumulative-report.json', JSON.stringify(cumulativeReport, null, 2));

        // Generate markdown summary
        const successRate = ((cumulativeReport.successfulCycles / cumulativeReport.totalCycles) * 100).toFixed(1);
        const markdownSummary = `# Autonomous Testing Dashboard

## Current Status: ${result.success ? '🟢 RUNNING' : '🔴 ISSUES DETECTED'}

### Summary Statistics
- **Total Cycles**: ${cumulativeReport.totalCycles}
- **Success Rate**: ${successRate}% (${cumulativeReport.successfulCycles}/${cumulativeReport.totalCycles})
- **Unique Bugs**: ${cumulativeReport.uniqueBugs}
- **Total Bug Occurrences**: ${cumulativeReport.totalBugOccurrences}
- **Average Cycle Duration**: ${Math.round(cumulativeReport.averageCycleDuration / 1000)}s
- **Daemon Uptime**: ${Math.round((performance.now() - this.startTime) / 1000 / 60)}min

### Top Bugs by Frequency
${cumulativeReport.bugSummary.slice(0, 5).map((bug, i) => 
    `${i + 1}. **${bug.description}** (${bug.occurrences} occurrences)`
).join('\n')}

### Recent Test Results
${cumulativeReport.recentResults.slice(-5).map(result => 
    `- Cycle ${result.cycle}: ${result.success ? '✅' : '❌'} (${Math.round(result.duration / 1000)}s)`
).join('\n')}

*Last Updated: ${new Date().toISOString()}*
`;

        fs.writeFileSync('./results/autonomous/dashboard.md', markdownSummary);
        
        console.log(`📄 Cycle report saved: ${cycleReportPath}`);
    }

    async start() {
        this.isRunning = true;
        console.log('\n🎯 Starting Autonomous Testing Daemon...');
        console.log('⏹️  Press Ctrl+C to stop');

        while (this.isRunning && this.cycleCount < this.maxCycles) {
            try {
                const result = await this.runTestCycle();
                
                if (this.cycleCount < this.maxCycles && this.isRunning) {
                    console.log(`⏳ Waiting ${this.delayBetweenCycles / 1000}s before next cycle...`);
                    await this.sleep(this.delayBetweenCycles);
                }
            } catch (error) {
                console.error('❌ Error in test cycle:', error);
                await this.sleep(this.delayBetweenCycles);
            }
        }

        console.log('\n🏁 Autonomous Testing Daemon Completed');
        this.generateFinalReport();
    }

    stop() {
        this.isRunning = false;
        console.log('\n🛑 Stopping Autonomous Testing Daemon...');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateFinalReport() {
        const finalReport = {
            summary: {
                totalCycles: this.cycleCount,
                successfulCycles: this.testResults.filter(r => r.success).length,
                failedCycles: this.testResults.filter(r => !r.success).length,
                totalDuration: Math.round((performance.now() - this.startTime) / 1000),
                uniqueBugsFound: this.bugDatabase.size
            },
            allResults: this.testResults,
            bugDatabase: Array.from(this.bugDatabase.entries()).map(([key, bug]) => ({ key, ...bug }))
        };

        fs.writeFileSync('./results/autonomous/final-report.json', JSON.stringify(finalReport, null, 2));
        
        console.log('\n📊 Final Report Generated');
        console.log(`   Total Cycles: ${finalReport.summary.totalCycles}`);
        console.log(`   Success Rate: ${((finalReport.summary.successfulCycles / finalReport.summary.totalCycles) * 100).toFixed(1)}%`);
        console.log(`   Bugs Found: ${finalReport.summary.uniqueBugsFound}`);
        console.log(`   Total Duration: ${Math.round(finalReport.summary.totalDuration / 60)}min`);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Received shutdown signal');
    if (daemon) {
        daemon.stop();
    }
    process.exit(0);
});

// Start the daemon
const daemon = new AutonomousTestingDaemon();
daemon.start().catch(error => {
    console.error('💥 Daemon crashed:', error);
    process.exit(1);
});