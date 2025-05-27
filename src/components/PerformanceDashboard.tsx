'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { performanceMonitor } from '@/services/PerformanceMonitoringService';

interface PerformanceStats {
  operation: string;
  count: number;
  average: number;
  min: number;
  max: number;
  p95: number;
}

export function PerformanceDashboard() {
  const [stats, setStats] = useState<PerformanceStats[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Afficher seulement pour les admins
    if (user?.role === 'ADMIN_TOTAL') {
      const updateStats = () => {
        const report = performanceMonitor.generateReport();
        const operations = new Set(report.metrics.map(m => m.name));
        
        const newStats: PerformanceStats[] = [];
        operations.forEach(op => {
          const opStats = performanceMonitor.getStats(op);
          if (opStats) {
            newStats.push({ operation: op, ...opStats });
          }
        });
        
        setStats(newStats.sort((a, b) => b.average - a.average));
      };

      updateStats();
      const interval = setInterval(updateStats, 5000); // Mise à jour toutes les 5 secondes
      
      return () => clearInterval(interval);
    }
  }, [user]);

  if (user?.role !== 'ADMIN_TOTAL') {
    return null;
  }

  return (
    <>
      {/* Bouton flottant pour afficher/masquer le dashboard */}
      <button
        onClick={() => setShowDashboard(!showDashboard)}
        className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
        title="Performance Dashboard"
      >
        ⚡ Perf
      </button>

      {/* Dashboard */}
      {showDashboard && (
        <div className="fixed bottom-20 right-4 z-50 bg-white rounded-lg shadow-xl p-4 max-w-lg max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Performance Monitor</h3>
            <button
              onClick={() => setShowDashboard(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {stats.length === 0 ? (
            <p className="text-gray-500">Aucune métrique disponible</p>
          ) : (
            <div className="space-y-3">
              {stats.slice(0, 10).map((stat, index) => (
                <div key={stat.operation} className="border-b pb-2">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm">{stat.operation}</span>
                    <span className={`text-sm font-bold ${
                      stat.average > 1000 ? 'text-red-600' : 
                      stat.average > 500 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {stat.average.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    <span>Count: {stat.count}</span>
                    <span className="mx-2">|</span>
                    <span>Min: {stat.min.toFixed(0)}ms</span>
                    <span className="mx-2">|</span>
                    <span>Max: {stat.max.toFixed(0)}ms</span>
                    <span className="mx-2">|</span>
                    <span>P95: {stat.p95.toFixed(0)}ms</span>
                  </div>
                  {stat.average > 1000 && (
                    <div className="text-xs text-red-600 mt-1">
                      ⚠️ Performance critique détectée
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => {
                const report = performanceMonitor.exportMetrics();
                const blob = new Blob([report], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `performance-metrics-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              📥 Exporter les métriques
            </button>
          </div>
        </div>
      )}
    </>
  );
}