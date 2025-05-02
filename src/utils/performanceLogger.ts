/**
 * Utilitaire de journalisation des performances pour suivre le temps d'exécution
 * et faciliter le débogage des problèmes de performance.
 */
export class PerformanceLogger {
    private serviceName: string;
    private timers: Map<string, number>;
    private verbose: boolean;
    private logFunction: (message: string) => void;

    /**
     * Crée un nouveau logger de performance
     * @param serviceName Nom du service à surveiller
     * @param options Options de configuration
     */
    constructor(
        serviceName: string,
        options: {
            verbose?: boolean;
            logFunction?: (message: string) => void;
        } = {}
    ) {
        this.serviceName = serviceName;
        this.timers = new Map();
        this.verbose = options.verbose !== undefined ? options.verbose : process.env.NODE_ENV !== 'production';
        this.logFunction = options.logFunction || console.log;
    }

    /**
     * Démarre un chronomètre
     * @param timerName Nom du chronomètre
     */
    public startTimer(timerName: string): void {
        this.timers.set(timerName, performance.now());
        if (this.verbose) {
            this.log(`[DÉBUT] ${timerName}`);
        }
    }

    /**
     * Arrête un chronomètre et enregistre le temps écoulé
     * @param timerName Nom du chronomètre
     * @param label Étiquette optionnelle pour le log
     * @returns Temps écoulé en millisecondes
     */
    public endTimer(timerName: string, label?: string): number {
        const startTime = this.timers.get(timerName);
        if (startTime === undefined) {
            this.log(`[ERREUR] Chronomètre "${timerName}" non démarré`);
            return 0;
        }

        const endTime = performance.now();
        const elapsedTime = endTime - startTime;

        const logLabel = label ? ` (${label})` : '';
        this.log(`[FIN] ${timerName}${logLabel}: ${elapsedTime.toFixed(2)}ms`);

        this.timers.delete(timerName);
        return elapsedTime;
    }

    /**
     * Enregistre un message dans les logs
     * @param message Message à enregistrer
     */
    public log(message: string): void {
        if (this.verbose) {
            this.logFunction(`[${this.serviceName}] ${message}`);
        }
    }

    /**
     * Mesure le temps d'exécution d'une fonction
     * @param name Nom de la fonction
     * @param fn Fonction à mesurer
     * @returns Résultat de la fonction
     */
    public async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
        this.startTimer(name);
        try {
            const result = await fn();
            this.endTimer(name);
            return result;
        } catch (error) {
            this.endTimer(name, 'erreur');
            throw error;
        }
    }

    /**
     * Active ou désactive le mode verbose
     * @param verbose True pour activer, false pour désactiver
     */
    public setVerbose(verbose: boolean): void {
        this.verbose = verbose;
    }

    /**
     * Capture les performances d'un ensemble de vérifications
     * @param timerName Nom du groupe de vérifications
     * @param checks Liste de vérifications à effectuer
     * @returns Résultats des vérifications
     */
    public async captureChecks<T>(
        timerName: string,
        checks: Array<() => Promise<T>>
    ): Promise<T[]> {
        this.startTimer(timerName);

        // Exécuter toutes les vérifications en parallèle
        const results = await Promise.all(checks.map(async (check, index) => {
            const checkName = `${timerName}-check-${index}`;
            return this.measure(checkName, check);
        }));

        this.endTimer(timerName, `${checks.length} vérifications`);
        return results;
    }

    /**
     * Génère un rapport de performance résumant les opérations
     * @param operations Liste des opérations avec leurs temps d'exécution
     * @returns Rapport formaté
     */
    public static generateReport(operations: Array<{ name: string; time: number }>): string {
        // Trier les opérations par temps d'exécution (de la plus lente à la plus rapide)
        const sortedOps = [...operations].sort((a, b) => b.time - a.time);

        // Calculer le temps total
        const totalTime = operations.reduce((sum, op) => sum + op.time, 0);

        // Générer le rapport
        let report = `=== RAPPORT DE PERFORMANCE ===\n`;
        report += `Temps total: ${totalTime.toFixed(2)}ms\n\n`;
        report += `Détail des opérations:\n`;

        sortedOps.forEach((op, index) => {
            const percentage = (op.time / totalTime * 100).toFixed(1);
            report += `${index + 1}. ${op.name}: ${op.time.toFixed(2)}ms (${percentage}%)\n`;
        });

        return report;
    }
} 