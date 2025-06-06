import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format as dateFormat } from 'date-fns';
import { fr } from 'date-fns/locale';

// Ajout pour résoudre les problèmes de typage avec jsPDF
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: unknown) => jsPDF;
        previousAutoTable?: {
            finalY: number;
        };
    }
}

// Types génériques pour l'export
export interface ExportOptions {
    format: 'csv' | 'excel' | 'pdf' | 'json';
    fileName?: string;
    filters?: Record<string, unknown>;
    columns?: string[];
    includeMetadata?: boolean;
    dateRange?: {
        start: Date;
        end: Date;
    };
    groupBy?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ExportData {
    headers: string[];
    rows: unknown[][];
    metadata?: {
        exportDate: Date;
        filters: Record<string, unknown>;
        totalCount: number;
        exportedCount: number;
        user?: string;
    };
}

/**
 * Service d'export avancé avec filtres et options multiples
 */
export class AdvancedExportService {
    /**
     * Export générique de données
     */
    static async export(data: unknown[], options: ExportOptions): Promise<Blob> {
        // Préparer les données
        const preparedData = this.prepareData(data, options);
        
        // Exporter selon le format
        switch (options.format) {
            case 'csv':
                return this.exportToCSV(preparedData, options);
            case 'excel':
                return this.exportToExcel(preparedData, options);
            case 'pdf':
                return this.exportToPDF(preparedData, options);
            case 'json':
                return this.exportToJSON(preparedData, options);
            default:
                throw new Error(`Format d'export non supporté: ${options.format}`);
        }
    }

    /**
     * Prépare les données pour l'export
     */
    private static prepareData(data: unknown[], options: ExportOptions): ExportData {
        let filteredData = [...data];

        // Appliquer les filtres
        if (options.filters) {
            filteredData = this.applyFilters(filteredData, options.filters);
        }

        // Appliquer la plage de dates
        if (options.dateRange) {
            filteredData = this.applyDateRange(filteredData, options.dateRange);
        }

        // Grouper les données
        if (options.groupBy) {
            filteredData = this.groupData(filteredData, options.groupBy);
        }

        // Trier les données
        if (options.sortBy) {
            filteredData = this.sortData(filteredData, options.sortBy, options.sortOrder);
        }

        // Extraire les colonnes
        const headers = options.columns || this.extractHeaders(filteredData[0]);
        const rows = filteredData.map(item => 
            headers.map(header => this.getCellValue(item, header))
        );

        // Préparer les métadonnées
        const metadata = options.includeMetadata ? {
            exportDate: new Date(),
            filters: options.filters || {},
            totalCount: data.length,
            exportedCount: filteredData.length,
            user: 'Utilisateur actuel' // À remplacer par l'utilisateur réel
        } : undefined;

        return { headers, rows, metadata };
    }

    /**
     * Applique les filtres aux données
     */
    private static applyFilters(data: unknown[], filters: Record<string, unknown>): unknown[] {
        return data.filter(item => {
            for (const [key, value] of Object.entries(filters)) {
                if (value === null || value === undefined || value === '') continue;
                
                const itemValue = this.getNestedValue(item, key);
                
                // Gestion des différents types de filtres
                if (Array.isArray(value)) {
                    if (!value.includes(itemValue)) return false;
                } else if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
                    if (itemValue < value.min || itemValue > value.max) return false;
                } else if (typeof value === 'string' && typeof itemValue === 'string') {
                    if (!itemValue.toLowerCase().includes(value.toLowerCase())) return false;
                } else if (itemValue !== value) {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Applique un filtre de plage de dates
     */
    private static applyDateRange(data: unknown[], dateRange: { start: Date; end: Date }): unknown[] {
        return data.filter(item => {
            // Chercher automatiquement les champs de date
            const dateFields = ['date', 'createdAt', 'startDate', 'endDate'];
            for (const field of dateFields) {
                const dateValue = this.getNestedValue(item, field);
                if (dateValue) {
                    const date = new Date(dateValue);
                    if (date >= dateRange.start && date <= dateRange.end) {
                        return true;
                    }
                }
            }
            return false;
        });
    }

    /**
     * Groupe les données par un champ
     */
    private static groupData(data: unknown[], groupBy: string): unknown[] {
        const grouped = data.reduce((acc, item) => {
            const key = this.getNestedValue(item, groupBy) || 'Non défini';
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(item);
            return acc;
        }, {} as Record<string, any[]>);

        // Transformer en tableau plat avec séparateurs de groupe
        const result: unknown[] = [];
        for (const [group, items] of Object.entries(grouped)) {
            result.push({ _isGroupHeader: true, _groupName: group, _count: items.length });
            result.push(...items);
        }
        return result;
    }

    /**
     * Trie les données
     */
    private static sortData(data: unknown[], sortBy: string, order: 'asc' | 'desc' = 'asc'): unknown[] {
        return [...data].sort((a, b) => {
            const aValue = this.getNestedValue(a, sortBy);
            const bValue = this.getNestedValue(b, sortBy);
            
            if (aValue === bValue) return 0;
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;
            
            const result = aValue < bValue ? -1 : 1;
            return order === 'asc' ? result : -result;
        });
    }

    /**
     * Export en CSV
     */
    private static async exportToCSV(data: ExportData, options: ExportOptions): Promise<Blob> {
        const rows = [data.headers, ...data.rows];
        
        // Ajouter les métadonnées si demandé
        if (data.metadata) {
            rows.unshift(['']);
            rows.unshift([`Date d'export: ${dateFormat(data.metadata.exportDate, 'PPP', { locale: fr })}`]);
            rows.unshift([`Total: ${data.metadata.totalCount}, Exportés: ${data.metadata.exportedCount}`]);
            rows.unshift(['']);
        }
        
        const csvContent = rows.map(row => 
            row.map(cell => {
                const cellStr = String(cell || '');
                // Échapper les guillemets et entourer de guillemets si nécessaire
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return `"${cellStr.replace(/"/g, '""')}"`;
                }
                return cellStr;
            }).join(',')
        ).join('\n');
        
        return new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    }

    /**
     * Export en Excel
     */
    private static async exportToExcel(data: ExportData, options: ExportOptions): Promise<Blob> {
        const wb = XLSX.utils.book_new();
        
        // Feuille principale
        const mainData = [data.headers, ...data.rows];
        const ws = XLSX.utils.aoa_to_sheet(mainData);
        
        // Ajuster la largeur des colonnes
        const colWidths = data.headers.map((header, i) => {
            const maxLength = Math.max(
                header.length,
                ...data.rows.map(row => String(row[i] || '').length)
            );
            return { wch: Math.min(maxLength + 2, 50) };
        });
        ws['!cols'] = colWidths;
        
        // Appliquer un style à l'en-tête
        const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (!ws[cellAddress]) continue;
            ws[cellAddress].s = {
                font: { bold: true },
                fill: { fgColor: { rgb: 'E0E0E0' } },
                alignment: { horizontal: 'center' }
            };
        }
        
        XLSX.utils.book_append_sheet(wb, ws, 'Données');
        
        // Ajouter une feuille de métadonnées si demandé
        if (data.metadata) {
            const metaData = [
                ['Informations d\'export'],
                [''],
                ['Date d\'export', dateFormat(data.metadata.exportDate, 'PPP', { locale: fr })],
                ['Total des enregistrements', data.metadata.totalCount],
                ['Enregistrements exportés', data.metadata.exportedCount],
                [''],
                ['Filtres appliqués'],
                ...Object.entries(data.metadata.filters).map(([key, value]) => [key, String(value)])
            ];
            
            const metaWs = XLSX.utils.aoa_to_sheet(metaData);
            XLSX.utils.book_append_sheet(wb, metaWs, 'Métadonnées');
        }
        
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }

    /**
     * Export en PDF
     */
    private static async exportToPDF(data: ExportData, options: ExportOptions): Promise<Blob> {
        const doc = new jsPDF({
            orientation: data.headers.length > 6 ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Titre
        const title = options.fileName || 'Export de données';
        doc.setFontSize(16);
        doc.text(title, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

        // Métadonnées
        if (data.metadata) {
            doc.setFontSize(10);
            doc.text(`Date d'export: ${dateFormat(data.metadata.exportDate, 'PPP', { locale: fr })}`, 14, 25);
            doc.text(`Total: ${data.metadata.totalCount} | Exportés: ${data.metadata.exportedCount}`, 14, 30);
        }

        // Table de données
        const tableOptions = {
            startY: data.metadata ? 40 : 25,
            head: [data.headers],
            body: data.rows,
            styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: 'linebreak'
            },
            headStyles: {
                fillColor: [66, 66, 66],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { left: 14, right: 14 }
        };

        doc.autoTable(tableOptions);

        // Numéros de page
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(
                `Page ${i} sur ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        return doc.output('blob');
    }

    /**
     * Export en JSON
     */
    private static async exportToJSON(data: ExportData, options: ExportOptions): Promise<Blob> {
        const jsonData = {
            metadata: data.metadata,
            headers: data.headers,
            data: data.rows.map(row => {
                const obj: Record<string, unknown> = {};
                data.headers.forEach((header, index) => {
                    obj[header] = row[index];
                });
                return obj;
            })
        };
        
        const jsonString = JSON.stringify(jsonData, null, 2);
        return new Blob([jsonString], { type: 'application/json' });
    }

    /**
     * Extrait les en-têtes d'un objet
     */
    private static extractHeaders(obj: unknown): string[] {
        if (!obj) return [];
        
        const headers = new Set<string>();
        
        const extract = (item: unknown, prefix = '') => {
            for (const [key, value] of Object.entries(item)) {
                if (key.startsWith('_')) continue; // Ignorer les propriétés internes
                
                const fullKey = prefix ? `${prefix}.${key}` : key;
                
                if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                    extract(value, fullKey);
                } else {
                    headers.add(fullKey);
                }
            }
        };
        
        extract(obj);
        return Array.from(headers);
    }

    /**
     * Obtient une valeur imbriquée d'un objet
     */
    private static getNestedValue(obj: unknown, path: string): any {
        return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
    }

    /**
     * Formate la valeur d'une cellule
     */
    private static getCellValue(obj: unknown, path: string): string {
        const value = this.getNestedValue(obj, path);
        
        if (value === null || value === undefined) return '';
        if (value instanceof Date) return dateFormat(value, 'dd/MM/yyyy');
        if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'object') return JSON.stringify(value);
        
        return String(value);
    }
}

/**
 * Helper functions pour des exports spécifiques
 */

export async function exportUsers(users: unknown[], options: Partial<ExportOptions> = {}) {
    const defaultOptions: ExportOptions = {
        format: 'excel',
        fileName: `utilisateurs_${dateFormat(new Date(), 'yyyy-MM-dd')}`,
        columns: ['name', 'email', 'role', 'createdAt', 'lastLogin'],
        includeMetadata: true,
        ...options
    };
    
    return AdvancedExportService.export(users, defaultOptions);
}

export async function exportLeaves(leaves: unknown[], options: Partial<ExportOptions> = {}) {
    const defaultOptions: ExportOptions = {
        format: 'excel',
        fileName: `conges_${dateFormat(new Date(), 'yyyy-MM-dd')}`,
        columns: ['user.name', 'type.name', 'startDate', 'endDate', 'status', 'duration'],
        includeMetadata: true,
        ...options
    };
    
    return AdvancedExportService.export(leaves, defaultOptions);
}

export async function exportPlanning(planning: unknown[], options: Partial<ExportOptions> = {}) {
    const defaultOptions: ExportOptions = {
        format: 'excel',
        fileName: `planning_${dateFormat(new Date(), 'yyyy-MM-dd')}`,
        columns: ['date', 'user.name', 'site.name', 'room.name', 'shift', 'role'],
        includeMetadata: true,
        sortBy: 'date',
        sortOrder: 'asc',
        ...options
    };
    
    return AdvancedExportService.export(planning, defaultOptions);
}