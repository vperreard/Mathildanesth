// Système d'alerte pour monitoring en temps réel

interface Alert {
    id: string;
    type: 'error' | 'warning' | 'info';
    service: string;
    message: string;
    timestamp: number;
    resolved: boolean;
    details?: any;
}

interface AlertRule {
    id: string;
    name: string;
    condition: (metrics: any) => boolean;
    severity: 'critical' | 'warning' | 'info';
    description: string;
    cooldownMs: number;
    enabled: boolean;
}

export class AlertingService {
    private static instance: AlertingService;
    private alerts: Map<string, Alert> = new Map();
    private alertHistory: Alert[] = [];
    private lastAlertTime: Map<string, number> = new Map();
    
    private alertRules: AlertRule[] = [
        {
            id: 'database_slow',
            name: 'Database Response Time',
            condition: (metrics) => metrics.checks?.database?.responseTime > 1000,
            severity: 'warning',
            description: 'Database responding slowly (>1s)',
            cooldownMs: 5 * 60 * 1000, // 5 minutes
            enabled: true
        },
        {
            id: 'database_down',
            name: 'Database Connection',
            condition: (metrics) => metrics.checks?.database?.status === 'error',
            severity: 'critical',
            description: 'Database connection failed',
            cooldownMs: 1 * 60 * 1000, // 1 minute
            enabled: true
        },
        {
            id: 'redis_down',
            name: 'Redis Connection',
            condition: (metrics) => metrics.checks?.redis?.status === 'error',
            severity: 'critical',
            description: 'Redis connection failed',
            cooldownMs: 2 * 60 * 1000, // 2 minutes
            enabled: true
        },
        {
            id: 'memory_high',
            name: 'High Memory Usage',
            condition: (metrics) => {
                const memDetails = metrics.checks?.memory?.details;
                return memDetails?.usagePercent > 80;
            },
            severity: 'warning',
            description: 'Memory usage above 80%',
            cooldownMs: 10 * 60 * 1000, // 10 minutes
            enabled: true
        },
        {
            id: 'memory_critical',
            name: 'Critical Memory Usage',
            condition: (metrics) => {
                const memDetails = metrics.checks?.memory?.details;
                return memDetails?.usagePercent > 90;
            },
            severity: 'critical',
            description: 'Memory usage above 90%',
            cooldownMs: 5 * 60 * 1000, // 5 minutes
            enabled: true
        },
        {
            id: 'disk_low',
            name: 'Low Disk Space',
            condition: (metrics) => {
                const diskDetails = metrics.checks?.disk?.details;
                return diskDetails?.freeSpaceGB < 5;
            },
            severity: 'warning',
            description: 'Disk space below 5GB',
            cooldownMs: 30 * 60 * 1000, // 30 minutes
            enabled: true
        },
        {
            id: 'overall_unhealthy',
            name: 'System Unhealthy',
            condition: (metrics) => metrics.status === 'unhealthy',
            severity: 'critical',
            description: 'Overall system health is unhealthy',
            cooldownMs: 3 * 60 * 1000, // 3 minutes
            enabled: true
        }
    ];

    public static getInstance(): AlertingService {
        if (!AlertingService.instance) {
            AlertingService.instance = new AlertingService();
        }
        return AlertingService.instance;
    }

    processHealthMetrics(metrics: any): Alert[] {
        const triggeredAlerts: Alert[] = [];
        const currentTime = Date.now();

        this.alertRules.forEach(rule => {
            if (!rule.enabled) return;

            const isTriggered = rule.condition(metrics);
            const alertId = `${rule.id}_${rule.name}`;
            const lastAlertTime = this.lastAlertTime.get(alertId) || 0;
            const isInCooldown = (currentTime - lastAlertTime) < rule.cooldownMs;

            if (isTriggered && !isInCooldown) {
                const alert: Alert = {
                    id: alertId,
                    type: rule.severity === 'critical' ? 'error' : 
                          rule.severity === 'warning' ? 'warning' : 'info',
                    service: rule.name,
                    message: rule.description,
                    timestamp: currentTime,
                    resolved: false,
                    details: this.extractRelevantDetails(metrics, rule)
                };

                this.alerts.set(alertId, alert);
                this.alertHistory.push(alert);
                this.lastAlertTime.set(alertId, currentTime);
                triggeredAlerts.push(alert);

                // Déclencher les notifications
                this.sendNotification(alert);
            } else if (!isTriggered && this.alerts.has(alertId)) {
                // Résoudre l'alerte si la condition n'est plus vraie
                const existingAlert = this.alerts.get(alertId);
                if (existingAlert && !existingAlert.resolved) {
                    existingAlert.resolved = true;
                    existingAlert.timestamp = currentTime;
                    this.sendResolutionNotification(existingAlert);
                }
            }
        });

        return triggeredAlerts;
    }

    private extractRelevantDetails(metrics: any, rule: AlertRule): any {
        switch (rule.id) {
            case 'database_slow':
            case 'database_down':
                return {
                    responseTime: metrics.checks?.database?.responseTime,
                    details: metrics.checks?.database?.details
                };
            case 'memory_high':
            case 'memory_critical':
                return metrics.checks?.memory?.details;
            case 'disk_low':
                return metrics.checks?.disk?.details;
            case 'overall_unhealthy':
                return {
                    overallScore: metrics.overallScore,
                    failedChecks: Object.entries(metrics.checks || {})
                        .filter(([_, check]: [string, any]) => check.status === 'error')
                        .map(([name, _]) => name)
                };
            default:
                return null;
        }
    }

    private async sendNotification(alert: Alert): Promise<void> {
        try {
            // Log l'alerte
            console.error(`🚨 ALERT: ${alert.service} - ${alert.message}`, alert.details);

            // En production, ici on enverrait des notifications via :
            // - Email
            // - Slack/Teams
            // - SMS pour les alertes critiques
            // - Webhook vers système de monitoring externe

            if (alert.type === 'error') {
                await this.sendCriticalAlert(alert);
            } else {
                await this.sendStandardAlert(alert);
            }

            // Sauvegarder en base pour historique
            await this.saveAlertToDatabase(alert);

        } catch (error) {
            console.error('Failed to send alert notification:', error);
        }
    }

    private async sendCriticalAlert(alert: Alert): Promise<void> {
        // Notifications immédiates pour les alertes critiques
        console.error(`🔥 CRITICAL ALERT: ${alert.message}`);
        
        // Ici on implémenterait :
        // - SMS aux administrateurs
        // - Appel téléphonique automatique
        // - Notification push prioritaire
        // - Escalade automatique si pas de réponse
    }

    private async sendStandardAlert(alert: Alert): Promise<void> {
        // Notifications standard
        console.warn(`⚠️  ALERT: ${alert.message}`);
        
        // Ici on implémenterait :
        // - Email aux équipes
        // - Message Slack
        // - Notification dans l'interface admin
    }

    private async sendResolutionNotification(alert: Alert): Promise<void> {
        console.info(`✅ RESOLVED: ${alert.service} - ${alert.message}`);
        
        // Notifications de résolution
        // - Email de confirmation
        // - Mise à jour statut dans Slack
        // - Notification dans l'interface
    }

    private async saveAlertToDatabase(alert: Alert): Promise<void> {
        try {
            // Sauvegarder l'alerte en base pour historique et analyse
            const { prisma } = await import('@/lib/prisma');
            
            await prisma.alertLog.create({
                data: {
                    alertId: alert.id,
                    type: alert.type,
                    service: alert.service,
                    message: alert.message,
                    details: JSON.stringify(alert.details),
                    timestamp: new Date(alert.timestamp),
                    resolved: alert.resolved,
                }
            });
        } catch (error) {
            console.error('Failed to save alert to database:', error);
        }
    }

    getActiveAlerts(): Alert[] {
        return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
    }

    getAlertHistory(limit: number = 100): Alert[] {
        return this.alertHistory
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    acknowledgeAlert(alertId: string, userId: string): boolean {
        const alert = this.alerts.get(alertId);
        if (alert && !alert.resolved) {
            alert.details = { ...alert.details, acknowledgedBy: userId, acknowledgedAt: Date.now() };
            console.info(`Alert ${alertId} acknowledged by user ${userId}`);
            return true;
        }
        return false;
    }

    resolveAlert(alertId: string, userId: string, resolution?: string): boolean {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.resolved = true;
            alert.timestamp = Date.now();
            alert.details = { 
                ...alert.details, 
                resolvedBy: userId, 
                resolvedAt: Date.now(),
                resolution 
            };
            console.info(`Alert ${alertId} resolved by user ${userId}: ${resolution || 'No resolution provided'}`);
            return true;
        }
        return false;
    }

    addCustomRule(rule: AlertRule): void {
        this.alertRules.push(rule);
    }

    updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
        const ruleIndex = this.alertRules.findIndex(r => r.id === ruleId);
        if (ruleIndex !== -1) {
            this.alertRules[ruleIndex] = { ...this.alertRules[ruleIndex], ...updates };
            return true;
        }
        return false;
    }

    getAlertStatistics(hours: number = 24): any {
        const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
        const recentAlerts = this.alertHistory.filter(alert => alert.timestamp > cutoffTime);

        return {
            total: recentAlerts.length,
            byType: {
                critical: recentAlerts.filter(a => a.type === 'error').length,
                warning: recentAlerts.filter(a => a.type === 'warning').length,
                info: recentAlerts.filter(a => a.type === 'info').length,
            },
            byService: recentAlerts.reduce((acc, alert) => {
                acc[alert.service] = (acc[alert.service] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            resolved: recentAlerts.filter(a => a.resolved).length,
            averageResolutionTime: this.calculateAverageResolutionTime(recentAlerts)
        };
    }

    private calculateAverageResolutionTime(alerts: Alert[]): number {
        const resolvedAlerts = alerts.filter(a => a.resolved && a.details?.resolvedAt);
        if (resolvedAlerts.length === 0) return 0;

        const totalResolutionTime = resolvedAlerts.reduce((sum, alert) => {
            return sum + (alert.details.resolvedAt - alert.timestamp);
        }, 0);

        return totalResolutionTime / resolvedAlerts.length;
    }
}

export const alertingService = AlertingService.getInstance();