#!/usr/bin/env node

/**
 * Daemon de monitoring de performance
 * Surveille en continu les métriques et génère des alertes
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class PerformanceMonitoringDaemon {
    constructor(config = {}) {
        this.config = {
            checkInterval: config.checkInterval || 30000, // 30 secondes
            alertThresholds: {
                responseTime: config.responseTime || 2000, // 2s
                errorRate: config.errorRate || 0.05, // 5%
                memoryUsage: config.memoryUsage || 0.8, // 80%
                diskUsage: config.diskUsage || 0.9, // 90%
                ...config.alertThresholds
            },
            endpoints: config.endpoints || [
                'http://localhost:3000',
                'http://localhost:3000/api/health',
                'http://localhost:3000/auth/connexion'
            ],
            logFile: config.logFile || path.join(__dirname, '../results/monitoring.log'),
            alertFile: config.alertFile || path.join(__dirname, '../results/alerts.json'),
            ...config
        };
        
        this.metrics = [];
        this.alerts = [];
        this.isRunning = false;
        
        this.setupSignalHandlers();
        this.ensureDirectories();
    }

    setupSignalHandlers() {
        process.on('SIGTERM', () => this.stop());
        process.on('SIGINT', () => this.stop());
        process.on('uncaughtException', (error) => {
            this.log('ERROR', `Uncaught exception: ${error.message}`);
            this.stop();
        });
    }

    ensureDirectories() {
        const dirs = [
            path.dirname(this.config.logFile),
            path.dirname(this.config.alertFile)
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    log(level, message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message}\n`;
        
        console.log(logEntry.trim());
        fs.appendFileSync(this.config.logFile, logEntry);
    }

    async start() {
        if (this.isRunning) {
            this.log('WARNING', 'Monitoring daemon already running');
            return;
        }

        this.isRunning = true;
        this.log('INFO', 'Starting performance monitoring daemon');
        this.log('INFO', `Check interval: ${this.config.checkInterval}ms`);
        this.log('INFO', `Monitoring endpoints: ${this.config.endpoints.join(', ')}`);

        // Démarrer le cycle de monitoring
        this.monitoringInterval = setInterval(() => {
            this.performChecks().catch(error => {
                this.log('ERROR', `Monitoring check failed: ${error.message}`);
            });
        }, this.config.checkInterval);

        // Premier check immédiat
        await this.performChecks();
    }

    async stop() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        this.log('INFO', 'Stopping performance monitoring daemon');

        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }

        // Générer rapport final
        await this.generateFinalReport();
        
        process.exit(0);
    }

    async performChecks() {
        const checkStart = Date.now();
        
        try {
            // Vérifications des endpoints
            await this.checkEndpoints();
            
            // Vérifications système
            await this.checkSystemMetrics();
            
            // Vérifications des performances
            await this.checkPerformanceMetrics();
            
            // Analyser les métriques et générer alertes
            await this.analyzeMetrics();
            
            const checkDuration = Date.now() - checkStart;
            this.log('INFO', `Monitoring check completed in ${checkDuration}ms`);
            
        } catch (error) {
            this.log('ERROR', `Monitoring check error: ${error.message}`);
        }
    }

    async checkEndpoints() {
        const results = await Promise.allSettled(
            this.config.endpoints.map(endpoint => this.checkEndpoint(endpoint))
        );

        results.forEach((result, index) => {
            const endpoint = this.config.endpoints[index];
            
            if (result.status === 'fulfilled') {
                this.addMetric('endpoint_check', endpoint, result.value);
            } else {
                this.log('ERROR', `Endpoint check failed: ${endpoint} - ${result.reason}`);
                this.createAlert('endpoint_down', `Endpoint ${endpoint} is down`, {
                    endpoint,
                    error: result.reason.message
                });
            }
        });
    }

    async checkEndpoint(url) {
        const start = Date.now();
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                timeout: 10000, // 10 secondes
                headers: {
                    'User-Agent': 'PerformanceMonitor/1.0'
                }
            });
            
            const responseTime = Date.now() - start;
            const status = response.status;
            
            const metric = {
                responseTime,
                status,
                success: status >= 200 && status < 400
            };
            
            // Vérifier les seuils
            if (responseTime > this.config.alertThresholds.responseTime) {
                this.createAlert('slow_response', `Slow response from ${url}`, {
                    url,
                    responseTime,
                    threshold: this.config.alertThresholds.responseTime
                });
            }
            
            if (!metric.success) {
                this.createAlert('http_error', `HTTP error from ${url}`, {
                    url,
                    status,
                    responseTime
                });
            }
            
            return metric;
            
        } catch (error) {
            throw new Error(`Failed to check ${url}: ${error.message}`);
        }
    }

    async checkSystemMetrics() {
        try {
            // Vérifier l'utilisation mémoire
            const memoryUsage = process.memoryUsage();
            const memoryPercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
            
            this.addMetric('memory_usage', 'heap', {
                used: memoryUsage.heapUsed,
                total: memoryUsage.heapTotal,
                percent: memoryPercent
            });
            
            if (memoryPercent > this.config.alertThresholds.memoryUsage) {
                this.createAlert('high_memory', 'High memory usage detected', {
                    percent: memoryPercent,
                    threshold: this.config.alertThresholds.memoryUsage
                });
            }
            
            // Vérifier l'espace disque
            await this.checkDiskUsage();
            
        } catch (error) {
            this.log('ERROR', `System metrics check failed: ${error.message}`);
        }
    }

    async checkDiskUsage() {
        return new Promise((resolve) => {
            const df = spawn('df', ['-h', '/']);
            let output = '';
            
            df.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            df.on('close', () => {
                try {
                    const lines = output.split('\n');
                    const diskLine = lines[1];
                    const parts = diskLine.split(/\s+/);
                    const usagePercent = parseInt(parts[4]) / 100;
                    
                    this.addMetric('disk_usage', 'root', {
                        used: parts[2],
                        total: parts[1],
                        percent: usagePercent
                    });
                    
                    if (usagePercent > this.config.alertThresholds.diskUsage) {
                        this.createAlert('high_disk', 'High disk usage detected', {
                            percent: usagePercent,
                            threshold: this.config.alertThresholds.diskUsage
                        });
                    }
                    
                } catch (error) {
                    this.log('ERROR', `Disk usage parsing failed: ${error.message}`);
                }
                
                resolve();
            });
        });
    }

    async checkPerformanceMetrics() {
        try {
            // Lire les métriques de performance des tests
            const performanceFiles = [
                path.join(__dirname, '../results/performance.json'),
                path.join(__dirname, '../results/puppeteer-performance.json')
            ];
            
            for (const file of performanceFiles) {
                if (fs.existsSync(file)) {
                    const metrics = JSON.parse(fs.readFileSync(file, 'utf8'));
                    this.analyzePerformanceFile(metrics, file);
                }
            }
            
        } catch (error) {
            this.log('ERROR', `Performance metrics check failed: ${error.message}`);
        }
    }

    analyzePerformanceFile(metrics, filename) {
        const recentMetrics = metrics.filter(m => 
            Date.now() - m.timestamp < 300000 // 5 minutes
        );
        
        if (recentMetrics.length === 0) return;
        
        // Analyser les métriques lentes
        const slowMetrics = recentMetrics.filter(m => m.status === 'SLOW');
        const errorRate = slowMetrics.length / recentMetrics.length;
        
        if (errorRate > this.config.alertThresholds.errorRate) {
            this.createAlert('high_error_rate', 'High performance error rate detected', {
                errorRate,
                threshold: this.config.alertThresholds.errorRate,
                slowCount: slowMetrics.length,
                totalCount: recentMetrics.length,
                source: path.basename(filename)
            });
        }
        
        // Analyser les tendances
        const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
        
        this.addMetric('performance_trend', path.basename(filename), {
            avgResponseTime,
            errorRate,
            totalMetrics: recentMetrics.length
        });
    }

    addMetric(type, name, data) {
        const metric = {
            type,
            name,
            data,
            timestamp: Date.now()
        };
        
        this.metrics.push(metric);
        
        // Garder seulement les 1000 dernières métriques
        if (this.metrics.length > 1000) {
            this.metrics = this.metrics.slice(-1000);
        }
    }

    createAlert(type, message, data = {}) {
        const alert = {
            id: `${type}_${Date.now()}`,
            type,
            message,
            data,
            timestamp: Date.now(),
            severity: this.getAlertSeverity(type)
        };
        
        this.alerts.push(alert);
        this.log('ALERT', `${alert.severity}: ${message}`);
        
        // Sauvegarder les alertes
        this.saveAlerts();
        
        // Envoyer notification si critique
        if (alert.severity === 'CRITICAL') {
            this.sendCriticalAlert(alert);
        }
    }

    getAlertSeverity(type) {
        const severityMap = {
            endpoint_down: 'CRITICAL',
            high_memory: 'HIGH',
            high_disk: 'HIGH',
            slow_response: 'MEDIUM',
            http_error: 'MEDIUM',
            high_error_rate: 'HIGH'
        };
        
        return severityMap[type] || 'LOW';
    }

    saveAlerts() {
        try {
            fs.writeFileSync(this.config.alertFile, JSON.stringify(this.alerts, null, 2));
        } catch (error) {
            this.log('ERROR', `Failed to save alerts: ${error.message}`);
        }
    }

    sendCriticalAlert(alert) {
        // Ici on pourrait envoyer des notifications (email, Slack, etc.)
        console.error(`🚨 CRITICAL ALERT: ${alert.message}`);
        
        // Exemple: webhook
        if (process.env.ALERT_WEBHOOK_URL) {
            fetch(process.env.ALERT_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alert)
            }).catch(error => {
                this.log('ERROR', `Failed to send webhook alert: ${error.message}`);
            });
        }
    }

    async analyzeMetrics() {
        // Analyser les tendances et patterns
        const recentMetrics = this.metrics.filter(m => 
            Date.now() - m.timestamp < 300000 // 5 minutes
        );
        
        if (recentMetrics.length < 10) return; // Pas assez de données
        
        // Détecter les anomalies
        this.detectAnomalies(recentMetrics);
    }

    detectAnomalies(metrics) {
        // Grouper par type de métrique
        const metricsByType = {};
        metrics.forEach(m => {
            if (!metricsByType[m.type]) {
                metricsByType[m.type] = [];
            }
            metricsByType[m.type].push(m);
        });
        
        // Analyser chaque type
        Object.entries(metricsByType).forEach(([type, typeMetrics]) => {
            if (type === 'endpoint_check') {
                this.analyzeEndpointTrend(typeMetrics);
            }
        });
    }

    analyzeEndpointTrend(metrics) {
        const responseTimes = metrics
            .filter(m => m.data.responseTime)
            .map(m => m.data.responseTime);
        
        if (responseTimes.length < 5) return;
        
        const avg = responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length;
        const recent = responseTimes.slice(-3);
        const recentAvg = recent.reduce((sum, rt) => sum + rt, 0) / recent.length;
        
        // Si les temps de réponse récents sont 50% plus lents que la moyenne
        if (recentAvg > avg * 1.5) {
            this.createAlert('performance_degradation', 'Performance degradation detected', {
                avgResponseTime: avg,
                recentAvgResponseTime: recentAvg,
                degradation: ((recentAvg / avg - 1) * 100).toFixed(1) + '%'
            });
        }
    }

    async generateFinalReport() {
        const report = {
            summary: {
                totalMetrics: this.metrics.length,
                totalAlerts: this.alerts.length,
                criticalAlerts: this.alerts.filter(a => a.severity === 'CRITICAL').length,
                monitoringDuration: Date.now() - (this.metrics[0]?.timestamp || Date.now())
            },
            alerts: this.alerts,
            recentMetrics: this.metrics.slice(-100)
        };
        
        const reportFile = path.join(__dirname, '../results/monitoring-report.json');
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        this.log('INFO', `Final monitoring report saved to: ${reportFile}`);
    }
}

// CLI Interface
if (require.main === module) {
    const command = process.argv[2] || 'start';
    
    const daemon = new PerformanceMonitoringDaemon({
        checkInterval: process.env.CHECK_INTERVAL || 30000,
        alertThresholds: {
            responseTime: process.env.RESPONSE_TIME_THRESHOLD || 2000,
            errorRate: process.env.ERROR_RATE_THRESHOLD || 0.05,
            memoryUsage: process.env.MEMORY_THRESHOLD || 0.8,
            diskUsage: process.env.DISK_THRESHOLD || 0.9
        }
    });
    
    switch (command) {
        case 'start':
            daemon.start();
            break;
        case 'stop':
            daemon.stop();
            break;
        case 'status':
            console.log('Monitoring daemon status: ', daemon.isRunning ? 'RUNNING' : 'STOPPED');
            break;
        default:
            console.log('Usage: node performance-monitoring-daemon.js [start|stop|status]');
            process.exit(1);
    }
}

module.exports = PerformanceMonitoringDaemon;