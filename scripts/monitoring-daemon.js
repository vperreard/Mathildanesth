#!/usr/bin/env node

// Daemon de monitoring pour surveillance continue

const { healthCheckService } = require('../src/lib/monitoring/healthCheck');
const { alertingService } = require('../src/lib/monitoring/alerting');
const fs = require('fs');
const path = require('path');

class MonitoringDaemon {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.checkIntervalMs = 60 * 1000; // 1 minute par défaut
        this.logFile = path.join(__dirname, '../logs/monitoring.log');
        this.metricsFile = path.join(__dirname, '../logs/metrics.jsonl');
        
        // Créer les dossiers de logs si nécessaire
        this.ensureLogDirectories();
        
        // Gestionnaire de signaux pour arrêt propre
        process.on('SIGINT', () => this.stop());
        process.on('SIGTERM', () => this.stop());
    }

    ensureLogDirectories() {
        const logsDir = path.dirname(this.logFile);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
    }

    async start() {
        if (this.isRunning) {
            console.log('Monitoring daemon is already running');
            return;
        }

        console.log('🚀 Starting monitoring daemon...');
        this.isRunning = true;
        
        // Premier check immédiat
        await this.performCheck();
        
        // Puis checks périodiques
        this.intervalId = setInterval(() => {
            this.performCheck().catch(error => {
                console.error('Check failed:', error);
                this.log('ERROR', `Check failed: ${error.message}`);
            });
        }, this.checkIntervalMs);

        this.log('INFO', 'Monitoring daemon started');
        console.log(`✅ Monitoring daemon running (check interval: ${this.checkIntervalMs}ms)`);
    }

    async stop() {
        if (!this.isRunning) {
            return;
        }

        console.log('🛑 Stopping monitoring daemon...');
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.log('INFO', 'Monitoring daemon stopped');
        console.log('✅ Monitoring daemon stopped');
        process.exit(0);
    }

    async performCheck() {
        try {
            const startTime = Date.now();
            
            // Effectuer le health check
            const metrics = await healthCheckService.getMetrics();
            const checkDuration = Date.now() - startTime;
            
            // Traiter les alertes
            const triggeredAlerts = alertingService.processHealthMetrics(metrics);
            
            // Logs
            const logLevel = metrics.status === 'unhealthy' ? 'ERROR' : 
                            metrics.status === 'degraded' ? 'WARN' : 'INFO';
            
            this.log(logLevel, `Health check completed in ${checkDuration}ms - Status: ${metrics.status} (Score: ${metrics.overallScore})`);
            
            if (triggeredAlerts.length > 0) {
                this.log('ALERT', `${triggeredAlerts.length} new alerts triggered`);
                triggeredAlerts.forEach(alert => {
                    this.log('ALERT', `${alert.type.toUpperCase()}: ${alert.service} - ${alert.message}`);
                });
            }

            // Sauvegarder les métriques
            await this.saveMetrics(metrics, checkDuration, triggeredAlerts.length);
            
            // Affichage console condensé
            const statusEmoji = metrics.status === 'healthy' ? '🟢' : 
                               metrics.status === 'degraded' ? '🟡' : '🔴';
            
            console.log(`${statusEmoji} ${new Date().toISOString()} - ${metrics.status} (${metrics.overallScore}%) - ${triggeredAlerts.length} alerts`);

        } catch (error) {
            this.log('ERROR', `Health check error: ${error.message}`);
            console.error('❌ Health check failed:', error.message);
        }
    }

    async saveMetrics(metrics, checkDuration, alertCount) {
        try {
            const metricsEntry = {
                timestamp: new Date().toISOString(),
                status: metrics.status,
                overallScore: metrics.overallScore,
                checkDuration,
                alertCount,
                checks: {
                    database: {
                        status: metrics.checks.database?.status,
                        responseTime: metrics.checks.database?.responseTime
                    },
                    redis: {
                        status: metrics.checks.redis?.status,
                        responseTime: metrics.checks.redis?.responseTime
                    },
                    memory: {
                        status: metrics.checks.memory?.status,
                        usagePercent: metrics.checks.memory?.details?.usagePercent
                    },
                    disk: {
                        status: metrics.checks.disk?.status,
                        freeSpaceGB: metrics.checks.disk?.details?.freeSpaceGB
                    }
                }
            };

            // Ajouter la ligne de métriques (JSONL format)
            fs.appendFileSync(this.metricsFile, JSON.stringify(metricsEntry) + '\n');

        } catch (error) {
            console.error('Failed to save metrics:', error);
        }
    }

    log(level, message) {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} [${level}] ${message}\n`;
        
        try {
            fs.appendFileSync(this.logFile, logEntry);
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    setCheckInterval(intervalMs) {
        this.checkIntervalMs = intervalMs;
        
        if (this.isRunning && this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = setInterval(() => {
                this.performCheck().catch(error => {
                    console.error('Check failed:', error);
                    this.log('ERROR', `Check failed: ${error.message}`);
                });
            }, this.checkIntervalMs);
        }
        
        console.log(`Check interval updated to ${intervalMs}ms`);
    }

    async getRecentMetrics(hours = 24) {
        try {
            const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
            const metricsData = fs.readFileSync(this.metricsFile, 'utf8');
            
            const metrics = metricsData
                .split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line))
                .filter(metric => new Date(metric.timestamp) > cutoffTime);

            return metrics;

        } catch (error) {
            console.error('Failed to read metrics:', error);
            return [];
        }
    }

    async generateReport(hours = 24) {
        const metrics = await this.getRecentMetrics(hours);
        
        if (metrics.length === 0) {
            console.log('No metrics available for report');
            return;
        }

        const totalChecks = metrics.length;
        const healthyChecks = metrics.filter(m => m.status === 'healthy').length;
        const degradedChecks = metrics.filter(m => m.status === 'degraded').length;
        const unhealthyChecks = metrics.filter(m => m.status === 'unhealthy').length;
        
        const avgScore = metrics.reduce((sum, m) => sum + m.overallScore, 0) / totalChecks;
        const avgCheckDuration = metrics.reduce((sum, m) => sum + m.checkDuration, 0) / totalChecks;
        const totalAlerts = metrics.reduce((sum, m) => sum + m.alertCount, 0);

        const report = {
            period: `${hours}h`,
            summary: {
                totalChecks,
                healthyChecks,
                degradedChecks,
                unhealthyChecks,
                uptime: ((healthyChecks + degradedChecks) / totalChecks * 100).toFixed(2) + '%',
                avgScore: avgScore.toFixed(1),
                avgCheckDuration: avgCheckDuration.toFixed(0) + 'ms',
                totalAlerts
            },
            trends: {
                worstPeriod: metrics.reduce((worst, current) => 
                    current.overallScore < worst.overallScore ? current : worst),
                bestPeriod: metrics.reduce((best, current) => 
                    current.overallScore > best.overallScore ? current : best)
            }
        };

        console.log('\n📊 MONITORING REPORT');
        console.log('====================');
        console.log(`Period: Last ${hours} hours`);
        console.log(`Total checks: ${totalChecks}`);
        console.log(`Uptime: ${report.summary.uptime}`);
        console.log(`Average score: ${report.summary.avgScore}%`);
        console.log(`Total alerts: ${totalAlerts}`);
        console.log(`Average check duration: ${report.summary.avgCheckDuration}`);
        console.log('\nStatus distribution:');
        console.log(`  🟢 Healthy: ${healthyChecks} (${(healthyChecks/totalChecks*100).toFixed(1)}%)`);
        console.log(`  🟡 Degraded: ${degradedChecks} (${(degradedChecks/totalChecks*100).toFixed(1)}%)`);
        console.log(`  🔴 Unhealthy: ${unhealthyChecks} (${(unhealthyChecks/totalChecks*100).toFixed(1)}%)`);

        return report;
    }
}

// Interface CLI
if (require.main === module) {
    const daemon = new MonitoringDaemon();
    const command = process.argv[2];

    switch (command) {
        case 'start':
            daemon.start();
            break;
            
        case 'report':
            const hours = parseInt(process.argv[3]) || 24;
            daemon.generateReport(hours).then(() => process.exit(0));
            break;
            
        case 'test':
            daemon.performCheck().then(() => {
                console.log('Test check completed');
                process.exit(0);
            });
            break;
            
        default:
            console.log('Usage:');
            console.log('  npm run monitoring:start  - Start monitoring daemon');
            console.log('  npm run monitoring:report [hours] - Generate report');
            console.log('  npm run monitoring:test   - Run single test check');
            process.exit(1);
    }
}

module.exports = { MonitoringDaemon };