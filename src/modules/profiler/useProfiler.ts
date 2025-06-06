import { useEffect, useCallback, useRef, useState } from 'react';
import { profilerService } from './profilerService';
import { MetricType, ProfilerConfig, ProfilingSession, ProfilerReport } from './types';

/**
 * Hook pour utiliser le profileur dans les composants React
 */
export function useProfiler(componentName: string) {
    const [isActive, setIsActive] = useState<boolean>(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const renderMetricId = useRef<string | null>(null);
    const sessionRef = useRef<ProfilingSession | null>(null);
    const reportRef = useRef<ProfilerReport | null>(null);

    // Démarrer une session de profilage
    const startProfiling = useCallback(() => {
        const id = profilerService.startSession();
        if (id) {
            setSessionId(id);
            setIsActive(true);

            // Commencer à mesurer le rendu du composant
            renderMetricId.current = profilerService.startMetric(
                MetricType.COMPONENT_RENDER,
                componentName
            );
        }
        return id;
    }, [componentName]);

    // Arrêter la session de profilage
    const stopProfiling = useCallback(() => {
        // Terminer la mesure du rendu du composant si elle est en cours
        if (renderMetricId.current) {
            profilerService.endMetric(renderMetricId.current);
            renderMetricId.current = null;
        }

        // Arrêter la session
        const session = profilerService.stopSession();
        if (session) {
            sessionRef.current = session;

            // Générer automatiquement un rapport
            const report = profilerService.generateReport(session);
            reportRef.current = report;
        }

        setIsActive(false);
        setSessionId(null);

        return sessionRef.current;
    }, []);

    // Mesurer une fonction
    const measureFunction = useCallback(<T extends (...args: unknown[]) => any>(
        func: T,
        name: string,
        type: MetricType = MetricType.COMPONENT_RENDER,
        metadata?: Record<string, unknown>
    ) => {
        return profilerService.wrapFunction(func, type, `${componentName}.${name}`, metadata);
    }, [componentName]);

    // Mesurer manuellement un bloc de code
    const measure = useCallback((
        name: string,
        type: MetricType = MetricType.COMPONENT_RENDER,
        metadata?: Record<string, unknown>
    ) => {
        const metricId = profilerService.startMetric(type, `${componentName}.${name}`, metadata);

        return () => {
            if (metricId) {
                profilerService.endMetric(metricId);
            }
        };
    }, [componentName]);

    // Configurer le profileur
    const configure = useCallback((config: Partial<ProfilerConfig>) => {
        profilerService.configure(config);
    }, []);

    // Générer un rapport
    const generateReport = useCallback(() => {
        if (sessionRef.current) {
            const report = profilerService.generateReport(sessionRef.current);
            reportRef.current = report;
            return report;
        }
        return null;
    }, []);

    // Récupérer le dernier rapport
    const getLastReport = useCallback(() => {
        return reportRef.current;
    }, []);

    // Nettoyer lors du démontage du composant
    useEffect(() => {
        return () => {
            if (isActive) {
                stopProfiling();
            }
        };
    }, [isActive, stopProfiling]);

    // Mesurer le temps de rendu pour les mises à jour du composant
    useEffect(() => {
        if (isActive) {
            // Terminer la mesure précédente si elle existe
            if (renderMetricId.current) {
                profilerService.endMetric(renderMetricId.current);
            }

            // Démarrer une nouvelle mesure
            renderMetricId.current = profilerService.startMetric(
                MetricType.COMPONENT_RENDER,
                componentName,
                { update: true }
            );
        }
    }, [componentName, isActive]);

    return {
        isActive,
        sessionId,
        startProfiling,
        stopProfiling,
        measureFunction,
        measure,
        configure,
        generateReport,
        getLastReport
    };
} 