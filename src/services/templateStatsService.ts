// Service pour les statistiques des modèles de simulation

export interface TemplateUsageStats {
    templateId: string;
    templateName: string;
    usageCount: number;
    lastUsed: string;
}

export interface CategoryUsageStats {
    category: string;
    count: number;
    percentage: number;
}

export interface TemplateStats {
    totalTemplates: number;
    totalUsage: number;
    mostUsedTemplates: TemplateUsageStats[];
    categoryBreakdown: CategoryUsageStats[];
    recentlyUsed: TemplateUsageStats[];
}

/**
 * Récupère les statistiques d'utilisation des modèles
 */
export async function fetchTemplateStats(): Promise<TemplateStats> {
    try {
        const response = await fetch('http://localhost:3000/api/simulations/modèles/stats');

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des statistiques');
        }

        return await response.json() as TemplateStats;
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);

        // Retourner des données simulées en cas d'erreur
        return getMockStats();
    }
}

/**
 * Génère des statistiques fictives pour le développement et les tests
 */
function getMockStats(): TemplateStats {
    return {
        totalTemplates: 24,
        totalUsage: 187,
        mostUsedTemplates: [
            { templateId: '1', templateName: 'Planning vacances d\'été', usageCount: 42, lastUsed: '2023-08-15' },
            { templateId: '2', templateName: 'Planning Noël', usageCount: 38, lastUsed: '2023-12-10' },
            { templateId: '3', templateName: 'Planning vacances scolaires', usageCount: 31, lastUsed: '2023-10-22' },
            { templateId: '4', templateName: 'Effectif réduit weekend', usageCount: 27, lastUsed: '2023-11-05' },
            { templateId: '5', templateName: 'Période formation', usageCount: 21, lastUsed: '2023-09-18' },
        ],
        categoryBreakdown: [
            { category: 'Vacances scolaires', count: 8, percentage: 33 },
            { category: 'Effectif réduit', count: 6, percentage: 25 },
            { category: 'Planning été', count: 4, percentage: 17 },
            { category: 'Congés exceptionnels', count: 3, percentage: 12.5 },
            { category: 'Autre', count: 3, percentage: 12.5 },
        ],
        recentlyUsed: [
            { templateId: '7', templateName: 'Planning hiver 2024', usageCount: 12, lastUsed: '2023-12-18' },
            { templateId: '9', templateName: 'Effectif weekend janvier', usageCount: 8, lastUsed: '2023-12-15' },
            { templateId: '2', templateName: 'Planning Noël', usageCount: 38, lastUsed: '2023-12-10' },
        ]
    };
}

/**
 * Exporte les statistiques au format CSV
 */
export function exportStatsAsCSV(stats: TemplateStats): string {
    let csv = 'Catégorie,Nombre,Pourcentage\n';

    // Ajouter les données de répartition par catégorie
    stats.categoryBreakdown.forEach(category => {
        csv += `"${category.category}",${category.count},${category.percentage}%\n`;
    });

    csv += '\nTemplate,Utilisations,Dernière utilisation\n';

    // Ajouter les données des modèles les plus utilisés
    stats.mostUsedTemplates.forEach(modèle => {
        const lastUsedDate = new Date(modèle.lastUsed).toLocaleDateString();
        csv += `"${modèle.templateName}",${modèle.usageCount},"${lastUsedDate}"\n`;
    });

    return csv;
}

/**
 * Télécharge les statistiques sous forme de fichier CSV
 */
export function downloadStatsAsCSV(stats: TemplateStats, filename: string = 'modèle-stats.csv'): void {
    const csv = exportStatsAsCSV(stats);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
} 