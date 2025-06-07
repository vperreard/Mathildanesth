import { NextRequest, NextResponse } from 'next/server';
import { getAuthPerformanceStats } from '@/lib/auth/optimized-auth-server-utils';
import { OptimizedAuthCache } from '@/lib/auth/optimized-auth-cache';
import { checkUserRole } from '@/lib/auth-server-utils';

export async function GET(req: NextRequest) {
  try {
    // Only admins can view performance stats
    const roleCheck = await checkUserRole(['ADMIN_TOTAL']);
    if (!roleCheck.hasRequiredRole) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Get performance stats
    const performanceStats = getAuthPerformanceStats();
    const cacheStats = await OptimizedAuthCache.getStats();

    return NextResponse.json({
      performance: performanceStats,
      cache: cacheStats,
      recommendations: generateRecommendations(performanceStats, cacheStats)
    });
  } catch (error) {
    console.error('Performance endpoint error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}

function generateRecommendations(perfStats: any, cacheStats: any) {
  const recommendations = [];

  // Check if login is slow
  if (perfStats.operationStats?.loginEndpoint?.avg > 1000) {
    recommendations.push({
      type: 'performance',
      severity: 'high',
      message: 'Login endpoint exceeds 1s target',
      suggestion: 'Consider reducing bcrypt rounds or using argon2'
    });
  }

  // Check cache effectiveness
  const cacheHitRate = perfStats.operationStats?.cacheHit?.count / 
    (perfStats.operationStats?.cacheHit?.count + perfStats.operationStats?.cacheMiss?.count);
  
  if (cacheHitRate < 0.7) {
    recommendations.push({
      type: 'cache',
      severity: 'medium',
      message: `Low cache hit rate: ${(cacheHitRate * 100).toFixed(1)}%`,
      suggestion: 'Increase cache TTL or implement cache warming'
    });
  }

  // Check for slow database queries
  if (perfStats.operationStats?.findUser?.avg > 200) {
    recommendations.push({
      type: 'database',
      severity: 'high',
      message: 'Slow user queries detected',
      suggestion: 'Add index on user.login column'
    });
  }

  return recommendations;
}