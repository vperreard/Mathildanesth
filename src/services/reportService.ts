import axios from 'axios';
import { logger } from "../lib/logger";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface ReportConfig {
    type: 'pdf' | 'excel' | 'csv';
    title: string;
    data: unknown[];
    columns: {
        key: string;
        label: string;
        type: 'text' | 'number' | 'date' | 'boolean';
    }[];
    filters?: {
        key: string;
        value: unknown;
    }[];
    sort?: {
        key: string;
        direction: 'asc' | 'desc';
    };
}

class ReportService {
    private static instance: ReportService;

    private constructor() { }

    public static getInstance(): ReportService {
        if (!ReportService.instance) {
            ReportService.instance = new ReportService();
        }
        return ReportService.instance;
    }

    public async generateReport(config: ReportConfig): Promise<Blob> {
        try {
            const response = await axios.post('http://localhost:3000/api/reports/generate', config, {
                responseType: 'blob',
            });

            return response.data;
        } catch (error: unknown) {
            logger.error('Erreur lors de la génération du rapport:', { error: error });
            throw error;
        }
    }

    public async downloadReport(config: ReportConfig): Promise<void> {
        try {
            const blob = await this.generateReport(config);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${config.title}_${format(new Date(), 'yyyy-MM-dd', { locale: fr })}.${config.type}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error: unknown) {
            logger.error('Erreur lors du téléchargement du rapport:', { error: error });
            throw error;
        }
    }

    public async getReportTemplates(): Promise<any[]> {
        try {
            const response = await axios.get('http://localhost:3000/api/reports/modèles');
            return response.data;
        } catch (error: unknown) {
            logger.error('Erreur lors de la récupération des modèles de rapport:', { error: error });
            throw error;
        }
    }

    public async saveReportTemplate(modèle: unknown): Promise<void> {
        try {
            await axios.post('http://localhost:3000/api/reports/modèles', modèle);
        } catch (error: unknown) {
            logger.error('Erreur lors de la sauvegarde du modèle de rapport:', { error: error });
            throw error;
        }
    }
}

export const reportService = ReportService.getInstance(); 