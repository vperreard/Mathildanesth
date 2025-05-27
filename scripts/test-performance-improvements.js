#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Performance targets
const PERFORMANCE_TARGETS = {
    authPage: {
        firstPaint: 500,
        fullyLoaded: 1000,
        interactive: 800
    },
    planningPage: {
        firstPaint: 1000,
        fullyLoaded: 2000,
        interactive: 1500
    },
    apiResponses: {
        average: 200,
        p95: 500
    },
    bundleSize: {
        mainChunk: 500, // KB
        totalJS: 1000 // KB
    }
};

async function measurePageMetrics(page, url, name) {
    console.log(`\n📊 Testing ${name}...`);
    
    const metrics = {
        navigation: {},
        paint: {},
        resources: {},
        memory: {}
    };
    
    // Start measuring
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Get performance metrics
    const perfData = await page.evaluate(() => {
        const timing = performance.timing;
        const paint = performance.getEntriesByType('paint');
        const resources = performance.getEntriesByType('resource');
        
        return {
            navigation: {
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                loadComplete: timing.loadEventEnd - timing.navigationStart,
                firstByte: timing.responseStart - timing.navigationStart,
                domInteractive: timing.domInteractive - timing.navigationStart,
            },
            paint: {
                firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
                firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
            },
            resources: {
                count: resources.length,
                totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
                jsSize: resources
                    .filter(r => r.name.includes('.js'))
                    .reduce((sum, r) => sum + (r.transferSize || 0), 0),
                cssSize: resources
                    .filter(r => r.name.includes('.css'))
                    .reduce((sum, r) => sum + (r.transferSize || 0), 0),
                imageSize: resources
                    .filter(r => r.initiatorType === 'img')
                    .reduce((sum, r) => sum + (r.transferSize || 0), 0),
            },
            memory: performance.memory ? {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
            } : null
        };
    });
    
    return { name, url, ...perfData };
}

async function testAPIPerformance(page) {
    console.log('\n🌐 Testing API Performance...');
    
    const apiCalls = [];
    
    // Intercept network requests
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/')) {
            const timing = await response.request().timing();
            apiCalls.push({
                url: url.split('?')[0], // Remove query params
                status: response.status(),
                duration: timing ? (timing.responseEnd - timing.requestStart) : 100,
                size: parseInt(response.headers()['content-length'] || '0')
            });
        }
    });
    
    // Navigate to trigger API calls
    await page.goto('http://localhost:3000/bloc-operatoire', { waitUntil: 'networkidle' });
    
    // Group by endpoint
    const apiMetrics = {};
    apiCalls.forEach(call => {
        if (!apiMetrics[call.url]) {
            apiMetrics[call.url] = {
                calls: 0,
                totalDuration: 0,
                durations: [],
                avgSize: 0
            };
        }
        
        apiMetrics[call.url].calls++;
        apiMetrics[call.url].totalDuration += call.duration;
        apiMetrics[call.url].durations.push(call.duration);
        apiMetrics[call.url].avgSize = call.size;
    });
    
    // Calculate metrics
    Object.keys(apiMetrics).forEach(endpoint => {
        const metric = apiMetrics[endpoint];
        metric.average = metric.totalDuration / metric.calls;
        metric.durations.sort((a, b) => a - b);
        metric.p95 = metric.durations[Math.floor(metric.durations.length * 0.95)] || metric.average;
    });
    
    return apiMetrics;
}

function evaluatePerformance(metrics, targets) {
    const results = [];
    
    // Auth page evaluation
    if (metrics.authPage) {
        const auth = metrics.authPage;
        results.push({
            category: 'Auth Page',
            metrics: [
                {
                    name: 'First Paint',
                    value: Math.round(auth.paint.firstPaint),
                    target: targets.authPage.firstPaint,
                    unit: 'ms',
                    status: auth.paint.firstPaint <= targets.authPage.firstPaint ? '✅' : '❌'
                },
                {
                    name: 'Fully Loaded',
                    value: Math.round(auth.navigation.loadComplete),
                    target: targets.authPage.fullyLoaded,
                    unit: 'ms',
                    status: auth.navigation.loadComplete <= targets.authPage.fullyLoaded ? '✅' : '❌'
                },
                {
                    name: 'Interactive',
                    value: Math.round(auth.navigation.domInteractive),
                    target: targets.authPage.interactive,
                    unit: 'ms',
                    status: auth.navigation.domInteractive <= targets.authPage.interactive ? '✅' : '❌'
                }
            ]
        });
    }
    
    // Planning page evaluation
    if (metrics.planningPage) {
        const planning = metrics.planningPage;
        results.push({
            category: 'Planning Page',
            metrics: [
                {
                    name: 'First Paint',
                    value: Math.round(planning.paint.firstPaint),
                    target: targets.planningPage.firstPaint,
                    unit: 'ms',
                    status: planning.paint.firstPaint <= targets.planningPage.firstPaint ? '✅' : '❌'
                },
                {
                    name: 'Fully Loaded',
                    value: Math.round(planning.navigation.loadComplete),
                    target: targets.planningPage.fullyLoaded,
                    unit: 'ms',
                    status: planning.navigation.loadComplete <= targets.planningPage.fullyLoaded ? '✅' : '❌'
                },
                {
                    name: 'JS Bundle Size',
                    value: Math.round(planning.resources.jsSize / 1024),
                    target: targets.bundleSize.totalJS,
                    unit: 'KB',
                    status: planning.resources.jsSize / 1024 <= targets.bundleSize.totalJS ? '✅' : '❌'
                }
            ]
        });
    }
    
    // API performance evaluation
    if (metrics.apiMetrics) {
        const apiValues = Object.values(metrics.apiMetrics);
        const avgResponseTime = apiValues.reduce((sum, api) => sum + api.average, 0) / apiValues.length;
        const maxP95 = Math.max(...apiValues.map(api => api.p95));
        
        results.push({
            category: 'API Performance',
            metrics: [
                {
                    name: 'Average Response',
                    value: Math.round(avgResponseTime),
                    target: targets.apiResponses.average,
                    unit: 'ms',
                    status: avgResponseTime <= targets.apiResponses.average ? '✅' : '❌'
                },
                {
                    name: 'P95 Response',
                    value: Math.round(maxP95),
                    target: targets.apiResponses.p95,
                    unit: 'ms',
                    status: maxP95 <= targets.apiResponses.p95 ? '✅' : '❌'
                }
            ]
        });
    }
    
    return results;
}

async function main() {
    console.log('🚀 Performance Testing - Mathildanesth\n');
    console.log('Testing against performance targets...');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        const metrics = {};
        
        // Test auth page
        metrics.authPage = await measurePageMetrics(
            page, 
            'http://localhost:3000/auth/login',
            'Auth Page'
        );
        
        // Test planning page
        metrics.planningPage = await measurePageMetrics(
            page,
            'http://localhost:3000/bloc-operatoire',
            'Planning Page'
        );
        
        // Test API performance
        metrics.apiMetrics = await testAPIPerformance(page);
        
        // Evaluate performance
        const evaluation = evaluatePerformance(metrics, PERFORMANCE_TARGETS);
        
        // Display results
        console.log('\n' + '='.repeat(60));
        console.log('📊 PERFORMANCE TEST RESULTS');
        console.log('='.repeat(60) + '\n');
        
        evaluation.forEach(category => {
            console.log(`\n${category.category}`);
            console.log('-'.repeat(40));
            
            category.metrics.forEach(metric => {
                const diff = metric.value - metric.target;
                const diffStr = diff > 0 ? `+${diff}` : diff.toString();
                
                console.log(
                    `${metric.status} ${metric.name.padEnd(20)} ${metric.value.toString().padStart(6)}${metric.unit} ` +
                    `(target: ${metric.target}${metric.unit}, ${diffStr}${metric.unit})`
                );
            });
        });
        
        // Summary
        const totalTests = evaluation.reduce((sum, cat) => sum + cat.metrics.length, 0);
        const passedTests = evaluation.reduce((sum, cat) => 
            sum + cat.metrics.filter(m => m.status === '✅').length, 0
        );
        
        console.log('\n' + '='.repeat(60));
        console.log(`SUMMARY: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests * 100)}%)`);
        console.log('='.repeat(60));
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            targets: PERFORMANCE_TARGETS,
            metrics,
            evaluation,
            summary: {
                totalTests,
                passedTests,
                successRate: Math.round(passedTests/totalTests * 100)
            }
        };
        
        await fs.writeFile(
            path.join(process.cwd(), 'performance-test-results.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('\n✅ Detailed report saved to performance-test-results.json');
        
        // Exit with appropriate code
        process.exit(passedTests === totalTests ? 0 : 1);
        
    } catch (error) {
        console.error('❌ Error during performance testing:', error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

// Check if server is running
async function checkServer() {
    try {
        const response = await fetch('http://localhost:3000');
        return response.ok;
    } catch {
        return false;
    }
}

// Run tests
(async () => {
    const serverRunning = await checkServer();
    if (!serverRunning) {
        console.error('❌ Development server is not running.');
        console.log('Please start the server with: npm run dev');
        process.exit(1);
    }
    
    await main();
})();