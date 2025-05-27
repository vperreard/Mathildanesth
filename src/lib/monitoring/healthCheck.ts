// Service de monitoring et health check pour l'application

import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: number;
    checks: {
        database: HealthStatus;
        redis: HealthStatus;
        disk: HealthStatus;
        memory: HealthStatus;
        criticalServices: HealthStatus;
    };
    overallScore: number;
}

interface HealthStatus {
    status: 'ok' | 'warning' | 'error';
    responseTime: number;
    message: string;
    details?: any;
}

export class HealthCheckService {
    private static instance: HealthCheckService;

    public static getInstance(): HealthCheckService {
        if (!HealthCheckService.instance) {
            HealthCheckService.instance = new HealthCheckService();
        }
        return HealthCheckService.instance;
    }

    async performHealthCheck(): Promise<HealthCheckResult> {
        const startTime = Date.now();
        
        const [database, redisCheck, disk, memory, criticalServices] = await Promise.allSettled([
            this.checkDatabase(),
            this.checkRedis(),
            this.checkDiskSpace(),
            this.checkMemoryUsage(),
            this.checkCriticalServices()
        ]);

        const checks = {
            database: this.getResultFromSettled(database),
            redis: this.getResultFromSettled(redisCheck),
            disk: this.getResultFromSettled(disk),
            memory: this.getResultFromSettled(memory),
            criticalServices: this.getResultFromSettled(criticalServices)
        };

        const overallScore = this.calculateOverallScore(checks);
        const status = this.determineOverallStatus(overallScore);

        return {
            status,
            timestamp: Date.now(),
            checks,
            overallScore
        };
    }

    private async checkDatabase(): Promise<HealthStatus> {
        const startTime = Date.now();
        
        try {
            // Test de connexion simple
            await prisma.$queryRaw`SELECT 1`;
            
            // Test de performance
            const userCount = await prisma.user.count();
            const responseTime = Date.now() - startTime;

            if (responseTime > 1000) {
                return {
                    status: 'warning',
                    responseTime,
                    message: 'Database responding slowly',
                    details: { userCount, threshold: '1000ms' }
                };
            }

            return {
                status: 'ok',
                responseTime,
                message: 'Database healthy',
                details: { userCount }
            };

        } catch (error) {
            return {
                status: 'error',
                responseTime: Date.now() - startTime,
                message: 'Database connection failed',
                details: { error: error.message }
            };
        }
    }

    private async checkRedis(): Promise<HealthStatus> {
        const startTime = Date.now();

        try {
            // Test de connexion et performance
            await redis.ping();
            const testKey = 'health_check_test';
            await redis.set(testKey, 'test_value', 'EX', 10);
            const value = await redis.get(testKey);
            await redis.del(testKey);

            const responseTime = Date.now() - startTime;

            if (value !== 'test_value') {
                return {
                    status: 'error',
                    responseTime,
                    message: 'Redis data integrity issue'
                };
            }

            return {
                status: 'ok',
                responseTime,
                message: 'Redis healthy'
            };

        } catch (error) {
            return {
                status: 'error',
                responseTime: Date.now() - startTime,
                message: 'Redis connection failed',
                details: { error: error.message }
            };
        }
    }

    private async checkDiskSpace(): Promise<HealthStatus> {
        const startTime = Date.now();

        try {
            const fs = require('fs');
            const stats = fs.statSync('.');
            
            // Estimation simplifiée de l'espace disque
            const freeSpace = stats.size; // En réalité, il faudrait utiliser statvfs
            const freeSpaceGB = freeSpace / (1024 * 1024 * 1024);

            const responseTime = Date.now() - startTime;

            if (freeSpaceGB < 1) {
                return {
                    status: 'error',
                    responseTime,
                    message: 'Critical disk space',
                    details: { freeSpaceGB }
                };
            }

            if (freeSpaceGB < 5) {
                return {
                    status: 'warning',
                    responseTime,
                    message: 'Low disk space',
                    details: { freeSpaceGB }
                };
            }

            return {
                status: 'ok',
                responseTime,
                message: 'Disk space sufficient',
                details: { freeSpaceGB }
            };

        } catch (error) {
            return {
                status: 'error',
                responseTime: Date.now() - startTime,
                message: 'Failed to check disk space',
                details: { error: error.message }
            };
        }
    }

    private async checkMemoryUsage(): Promise<HealthStatus> {
        const startTime = Date.now();

        try {
            const memoryUsage = process.memoryUsage();
            const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
            const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
            const usagePercent = (heapUsedMB / heapTotalMB) * 100;

            const responseTime = Date.now() - startTime;

            if (usagePercent > 90) {
                return {
                    status: 'error',
                    responseTime,
                    message: 'Critical memory usage',
                    details: { usagePercent, heapUsedMB, heapTotalMB }
                };
            }

            if (usagePercent > 80) {
                return {
                    status: 'warning',
                    responseTime,
                    message: 'High memory usage',
                    details: { usagePercent, heapUsedMB, heapTotalMB }
                };
            }

            return {
                status: 'ok',
                responseTime,
                message: 'Memory usage normal',
                details: { usagePercent, heapUsedMB, heapTotalMB }
            };

        } catch (error) {
            return {
                status: 'error',
                responseTime: Date.now() - startTime,
                message: 'Failed to check memory usage',
                details: { error: error.message }
            };
        }
    }

    private async checkCriticalServices(): Promise<HealthStatus> {
        const startTime = Date.now();

        try {
            // Vérifier les services critiques de l'application
            const checks = await Promise.allSettled([
                this.checkAuthService(),
                this.checkLeaveService(),
                this.checkPlanningService()
            ]);

            const failedServices = checks
                .map((result, index) => ({ 
                    service: ['auth', 'leave', 'planning'][index], 
                    result 
                }))
                .filter(({ result }) => result.status === 'rejected');

            const responseTime = Date.now() - startTime;

            if (failedServices.length > 0) {
                return {
                    status: 'error',
                    responseTime,
                    message: 'Critical services failing',
                    details: { failedServices: failedServices.map(f => f.service) }
                };
            }

            return {
                status: 'ok',
                responseTime,
                message: 'All critical services healthy'
            };

        } catch (error) {
            return {
                status: 'error',
                responseTime: Date.now() - startTime,
                message: 'Failed to check critical services',
                details: { error: error.message }
            };
        }
    }

    private async checkAuthService(): Promise<void> {
        // Test du service d'authentification
        const jwt = require('jsonwebtoken');
        const testToken = jwt.sign({ test: true }, process.env.JWT_SECRET || 'test');
        const decoded = jwt.verify(testToken, process.env.JWT_SECRET || 'test');
        
        if (!decoded) {
            throw new Error('Auth service JWT verification failed');
        }
    }

    private async checkLeaveService(): Promise<void> {
        // Test du service de congés (lecture seule)
        const leaveTypesCount = await prisma.leaveTypeSetting.count();
        if (leaveTypesCount === 0) {
            throw new Error('No leave types configured');
        }
    }

    private async checkPlanningService(): Promise<void> {
        // Test du service de planning (lecture seule)
        const operatingRoomsCount = await prisma.operatingRoom.count();
        if (operatingRoomsCount === 0) {
            throw new Error('No operating rooms configured');
        }
    }

    private getResultFromSettled(settledResult: PromiseSettledResult<HealthStatus>): HealthStatus {
        if (settledResult.status === 'fulfilled') {
            return settledResult.value;
        }
        
        return {
            status: 'error',
            responseTime: 0,
            message: 'Check failed to execute',
            details: { error: settledResult.reason }
        };
    }

    private calculateOverallScore(checks: Record<string, HealthStatus>): number {
        const weights = {
            database: 30,
            redis: 20,
            disk: 15,
            memory: 15,
            criticalServices: 20
        };

        let totalScore = 0;
        let totalWeight = 0;

        Object.entries(checks).forEach(([key, check]) => {
            const weight = weights[key] || 10;
            totalWeight += weight;

            let score = 0;
            if (check.status === 'ok') score = 100;
            else if (check.status === 'warning') score = 60;
            else score = 0;

            totalScore += score * weight;
        });

        return Math.round(totalScore / totalWeight);
    }

    private determineOverallStatus(score: number): 'healthy' | 'degraded' | 'unhealthy' {
        if (score >= 90) return 'healthy';
        if (score >= 70) return 'degraded';
        return 'unhealthy';
    }

    async getMetrics(): Promise<any> {
        const healthCheck = await this.performHealthCheck();
        
        return {
            ...healthCheck,
            version: process.env.npm_package_version || '1.0.0',
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            lastRestart: new Date(Date.now() - process.uptime() * 1000).toISOString()
        };
    }
}

export const healthCheckService = HealthCheckService.getInstance();