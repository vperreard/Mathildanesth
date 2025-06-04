import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/middleware/authorization';
import { logger } from '@/lib/logger';
import { withAdminRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/admin/security/audit-logs
 * Récupérer les logs de sécurité - ADMIN uniquement
 */
const getHandler = withAuth({
    requireAuth: true,
    allowedRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL'],
})(async (req: NextRequest) => {
    try {
        const { searchParams } = new URL(req.url);
        
        // Paramètres de filtrage
        const userId = searchParams.get('userId');
        const action = searchParams.get('action');
        const severity = searchParams.get('severity');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        
        // Construire les conditions de filtrage
        const where: any = {};
        
        if (userId) {
            where.userId = parseInt(userId);
        }
        
        if (action) {
            where.action = { contains: action };
        }
        
        if (severity) {
            where.severity = severity;
        }
        
        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) {
                where.timestamp.gte = new Date(startDate);
            }
            if (endDate) {
                where.timestamp.lte = new Date(endDate);
            }
        }
        
        // Récupérer le nombre total
        const total = await prisma.auditSecurityLog.count({ where });
        
        // Récupérer les logs avec pagination
        const logs = await prisma.auditSecurityLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        login: true
                    }
                }
            },
            orderBy: { timestamp: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        });
        
        return NextResponse.json({
            data: logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        logger.error('Error fetching audit logs', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
});

/**
 * POST /api/admin/security/audit-logs/export
 * Exporter les logs de sécurité - ADMIN TOTAL uniquement
 */
const postHandler = withAuth({
    requireAuth: true,
    allowedRoles: ['ADMIN_TOTAL'],
    resourceType: 'audit_logs',
    action: 'export'
})(async (req: NextRequest) => {
    try {
        const { startDate, endDate, format = 'json' } = await req.json();
        
        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'Start date and end date are required' },
                { status: 400 }
            );
        }
        
        // Récupérer tous les logs pour la période
        const logs = await prisma.auditSecurityLog.findMany({
            where: {
                timestamp: {
                    gte: new Date(startDate),
                    lte: new Date(endDate)
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        login: true,
                        email: true
                    }
                }
            },
            orderBy: { timestamp: 'desc' }
        });
        
        // Format CSV si demandé
        if (format === 'csv') {
            const csv = convertToCSV(logs);
            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="security-audit-logs-${startDate}-${endDate}.csv"`
                }
            });
        }
        
        // Format JSON par défaut
        return NextResponse.json({
            exportDate: new Date().toISOString(),
            period: { startDate, endDate },
            totalRecords: logs.length,
            data: logs
        });
        
    } catch (error) {
        logger.error('Error exporting audit logs', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
});

function convertToCSV(logs: any[]): string {
    const headers = [
        'ID',
        'Date/Time',
        'User ID',
        'User Name',
        'Action',
        'Resource',
        'Severity',
        'Success',
        'IP Address',
        'Details'
    ];
    
    const rows = logs.map(log => [
        log.id,
        log.timestamp.toISOString(),
        log.userId || 'N/A',
        log.user ? `${log.user.prenom} ${log.user.nom}` : 'N/A',
        log.action,
        log.resource,
        log.severity,
        log.success ? 'Yes' : 'No',
        log.ipAddress || 'N/A',
        JSON.stringify(log.details || {})
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csvContent;
}

// Export des handlers avec rate limiting
export const GET = withAdminRateLimit(getHandler);
export const POST = withAdminRateLimit(postHandler);