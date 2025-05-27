import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Stockage en mémoire des métriques (à remplacer par Redis en production)
const metricsStore: any[] = [];
const MAX_METRICS = 10000;

export async function POST(req: NextRequest) {
  try {
    // Authentification optionnelle pour les métriques internes
    const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    let userId = null;
    
    if (authToken) {
      const authResult = await verifyAuthToken(authToken);
      if (authResult.authenticated) {
        userId = authResult.userId;
      }
    }

    const metric = await req.json();
    
    // Ajouter les métadonnées
    const enrichedMetric = {
      ...metric,
      userId,
      userAgent: req.headers.get('user-agent'),
      clientIp: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      receivedAt: new Date().toISOString()
    };

    // Stocker la métrique
    metricsStore.push(enrichedMetric);
    
    // Limiter la taille du store
    if (metricsStore.length > MAX_METRICS) {
      metricsStore.splice(0, metricsStore.length - MAX_METRICS);
    }

    // Si c'est une dégradation de performance critique, logger dans la DB
    if (metric.type === 'performance_degradation' && metric.degradation > 50) {
      await prisma.auditLog.create({
        data: {
          action: 'PERFORMANCE_ALERT',
          entityType: 'system',
          entityId: metric.operation,
          userId,
          details: JSON.stringify(metric)
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing metric:', error);
    return NextResponse.json(
      { error: 'Failed to store metric' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Authentification requise pour consulter les métriques
    const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const authResult = await verifyAuthToken(authToken);
    if (!authResult.authenticated || authResult.role !== 'ADMIN_TOTAL') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type');
    const operation = searchParams.get('operation');
    const last = parseInt(searchParams.get('last') || '100');

    // Filtrer les métriques
    let filtered = metricsStore;
    
    if (type) {
      filtered = filtered.filter(m => m.type === type);
    }
    
    if (operation) {
      filtered = filtered.filter(m => m.operation === operation);
    }

    // Retourner les dernières métriques
    const results = filtered.slice(-last);

    // Calculer les statistiques
    const stats = {
      total: filtered.length,
      byType: {} as Record<string, number>,
      byOperation: {} as Record<string, number>,
      averageDuration: 0,
      slowestOperations: [] as any[]
    };

    // Grouper par type
    filtered.forEach(m => {
      if (m.type) {
        stats.byType[m.type] = (stats.byType[m.type] || 0) + 1;
      }
      if (m.operation) {
        stats.byOperation[m.operation] = (stats.byOperation[m.operation] || 0) + 1;
      }
    });

    // Calculer la durée moyenne et les opérations les plus lentes
    const durations = filtered
      .filter(m => m.duration)
      .map(m => ({ operation: m.operation, duration: m.duration }));
    
    if (durations.length > 0) {
      stats.averageDuration = durations.reduce((sum, d) => sum + d.duration, 0) / durations.length;
      stats.slowestOperations = durations
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10);
    }

    return NextResponse.json({
      metrics: results,
      stats
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}