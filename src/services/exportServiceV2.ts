import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { format as dateFormat } from 'date-fns';
import { fr } from 'date-fns/locale';

// Ajout pour résoudre les problèmes de typage avec jsPDF
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
        previousAutoTable?: {
            finalY: number;
        };
    }
}

// Types pour les données à exporter
interface SimulationResultExportOptions {
    format: 'pdf' | 'csv';
    includeRawData?: boolean;
    fileName?: string;
}

interface SimulationExportData {
    id: string;
    scenarioName: string;
    scenarioDescription?: string;
    createdAt: Date | string;
    status: string;
    statistics: any;
    conflicts: Array<any>;
    userAssignments: Array<any>;
    periodCoverage?: number;
}

/**
 * Fonction principale pour exporter les résultats de simulation
 */
export async function exportSimulationResults(
    data: SimulationExportData,
    options: SimulationResultExportOptions
): Promise<Blob> {
    const { format, fileName } = options;

    // Formater le nom du fichier
    const defaultFileName = `simulation_${data.scenarioName.replace(/\s+/g, '_')}_${dateFormat(
        new Date(),
        'yyyy-MM-dd'
    )}`;
    const finalFileName = fileName || defaultFileName;

    if (format === 'pdf') {
        return exportToPDF(data, finalFileName);
    } else {
        return exportToCSV(data, finalFileName);
    }
}

/**
 * Export en PDF
 */
function exportToPDF(data: SimulationExportData, fileName: string): Blob {
    const pdf = new jsPDF();
    let yPosition = 20;

    // En-tête
    pdf.setFontSize(20);
    pdf.text('Résultats de Simulation', 20, yPosition);
    yPosition += 15;

    // Informations générales
    pdf.setFontSize(12);
    pdf.text(`Scénario: ${data.scenarioName}`, 20, yPosition);
    yPosition += 8;
    
    if (data.scenarioDescription) {
        pdf.setFontSize(10);
        pdf.text(`Description: ${data.scenarioDescription}`, 20, yPosition);
        yPosition += 8;
    }

    pdf.text(`Date: ${dateFormat(new Date(data.createdAt), 'dd MMMM yyyy', { locale: fr })}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Statut: ${data.status}`, 20, yPosition);
    yPosition += 15;

    // Statistiques
    if (data.statistics) {
        pdf.setFontSize(14);
        pdf.text('Statistiques', 20, yPosition);
        yPosition += 10;

        pdf.autoTable({
            startY: yPosition,
            head: [['Métrique', 'Valeur']],
            body: Object.entries(data.statistics).map(([key, value]) => [
                formatStatKey(key),
                formatStatValue(value)
            ])
        });

        yPosition = pdf.previousAutoTable?.finalY ? pdf.previousAutoTable.finalY + 10 : yPosition + 30;
    }

    // Conflits
    if (data.conflicts && data.conflicts.length > 0) {
        pdf.setFontSize(14);
        pdf.text('Conflits détectés', 20, yPosition);
        yPosition += 10;

        pdf.autoTable({
            startY: yPosition,
            head: [['Type', 'Description', 'Sévérité']],
            body: data.conflicts.map(conflict => [
                conflict.type || 'Non spécifié',
                conflict.description || 'Aucune description',
                conflict.severity || 'Moyenne'
            ])
        });

        yPosition = pdf.previousAutoTable?.finalY ? pdf.previousAutoTable.finalY + 10 : yPosition + 30;
    }

    // Affectations utilisateurs (limité aux 10 premiers)
    if (data.userAssignments && data.userAssignments.length > 0) {
        pdf.setFontSize(14);
        pdf.text('Affectations des utilisateurs (Top 10)', 20, yPosition);
        yPosition += 10;

        const limitedAssignments = data.userAssignments.slice(0, 10);

        pdf.autoTable({
            startY: yPosition,
            head: [['Utilisateur', 'Rôle', 'Nombre d\'affectations']],
            body: limitedAssignments.map(assignment => [
                assignment.userName || 'Inconnu',
                assignment.role || 'Non défini',
                assignment.assignmentCount?.toString() || '0'
            ])
        });
    }

    return pdf.output('blob');
}

/**
 * Export en CSV
 */
function exportToCSV(data: SimulationExportData, fileName: string): Blob {
    const csvData: any[] = [];

    // En-tête général
    csvData.push(['Résultats de Simulation']);
    csvData.push([]);
    csvData.push(['Scénario', data.scenarioName]);
    if (data.scenarioDescription) {
        csvData.push(['Description', data.scenarioDescription]);
    }
    csvData.push(['Date', dateFormat(new Date(data.createdAt), 'dd/MM/yyyy')]);
    csvData.push(['Statut', data.status]);
    csvData.push([]);

    // Statistiques
    if (data.statistics) {
        csvData.push(['Statistiques']);
        csvData.push(['Métrique', 'Valeur']);
        Object.entries(data.statistics).forEach(([key, value]) => {
            csvData.push([formatStatKey(key), formatStatValue(value)]);
        });
        csvData.push([]);
    }

    // Conflits
    if (data.conflicts && data.conflicts.length > 0) {
        csvData.push(['Conflits détectés']);
        csvData.push(['Type', 'Description', 'Sévérité']);
        data.conflicts.forEach(conflict => {
            csvData.push([
                conflict.type || 'Non spécifié',
                conflict.description || 'Aucune description',
                conflict.severity || 'Moyenne'
            ]);
        });
        csvData.push([]);
    }

    // Affectations utilisateurs
    if (data.userAssignments && data.userAssignments.length > 0) {
        csvData.push(['Affectations des utilisateurs']);
        csvData.push(['Utilisateur', 'Rôle', 'Nombre d\'affectations']);
        data.userAssignments.forEach(assignment => {
            csvData.push([
                assignment.userName || 'Inconnu',
                assignment.role || 'Non défini',
                assignment.assignmentCount?.toString() || '0'
            ]);
        });
    }

    // Convertir en CSV
    const csv = Papa.unparse(csvData);
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Fonctions utilitaires
 */
function formatStatKey(key: string): string {
    const translations: Record<string, string> = {
        totalAssignments: 'Total des affectations',
        conflictCount: 'Nombre de conflits',
        averageLoad: 'Charge moyenne',
        coverageRate: 'Taux de couverture',
        userCount: 'Nombre d\'utilisateurs',
        periodCoverage: 'Couverture de la période'
    };
    return translations[key] || key;
}

function formatStatValue(value: any): string {
    if (typeof value === 'number') {
        if (value % 1 !== 0) {
            return value.toFixed(2);
        }
        return value.toString();
    }
    if (typeof value === 'boolean') {
        return value ? 'Oui' : 'Non';
    }
    return String(value);
}

/**
 * Export des données de congés
 */
export async function exportLeaveData(
    leaves: any[],
    format: 'csv' | 'pdf',
    fileName?: string
): Promise<Blob> {
    const defaultFileName = `conges_${dateFormat(new Date(), 'yyyy-MM-dd')}`;
    const finalFileName = fileName || defaultFileName;

    if (format === 'pdf') {
        return exportLeavesToPDF(leaves, finalFileName);
    } else {
        return exportLeavesToCSV(leaves, finalFileName);
    }
}

/**
 * Export des congés en CSV
 */
function exportLeavesToCSV(leaves: any[], fileName: string): Blob {
    const csvData = leaves.map(leave => ({
        'ID': leave.id,
        'Utilisateur': leave.userName || leave.user?.name || 'Inconnu',
        'Type': leave.type,
        'Date début': dateFormat(new Date(leave.startDate), 'dd/MM/yyyy'),
        'Date fin': dateFormat(new Date(leave.endDate), 'dd/MM/yyyy'),
        'Statut': leave.status,
        'Jours': leave.days || 0,
        'Raison': leave.reason || ''
    }));

    const csv = Papa.unparse(csvData);
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Export des congés en PDF
 */
function exportLeavesToPDF(leaves: any[], fileName: string): Blob {
    const pdf = new jsPDF();
    
    pdf.setFontSize(20);
    pdf.text('Liste des Congés', 20, 20);
    
    pdf.setFontSize(10);
    pdf.text(`Généré le: ${dateFormat(new Date(), 'dd MMMM yyyy', { locale: fr })}`, 20, 30);

    const tableData = leaves.map(leave => [
        leave.id,
        leave.userName || leave.user?.name || 'Inconnu',
        leave.type,
        dateFormat(new Date(leave.startDate), 'dd/MM/yyyy'),
        dateFormat(new Date(leave.endDate), 'dd/MM/yyyy'),
        leave.status,
        leave.days?.toString() || '0'
    ]);

    pdf.autoTable({
        startY: 40,
        head: [['ID', 'Utilisateur', 'Type', 'Début', 'Fin', 'Statut', 'Jours']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
    });

    return pdf.output('blob');
}

/**
 * Export des données de planning
 */
export async function exportPlanningData(
    planning: any[],
    format: 'csv' | 'pdf',
    fileName?: string
): Promise<Blob> {
    const defaultFileName = `planning_${dateFormat(new Date(), 'yyyy-MM-dd')}`;
    const finalFileName = fileName || defaultFileName;

    if (format === 'pdf') {
        return exportPlanningToPDF(planning, finalFileName);
    } else {
        return exportPlanningToCSV(planning, finalFileName);
    }
}

/**
 * Export du planning en CSV
 */
function exportPlanningToCSV(planning: any[], fileName: string): Blob {
    const csvData = planning.map(entry => ({
        'Date': dateFormat(new Date(entry.date), 'dd/MM/yyyy'),
        'Utilisateur': entry.userName || 'Non assigné',
        'Poste': entry.position || '',
        'Horaire': entry.schedule || '',
        'Lieu': entry.location || '',
        'Statut': entry.status || 'Planifié'
    }));

    const csv = Papa.unparse(csvData);
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Export du planning en PDF
 */
function exportPlanningToPDF(planning: any[], fileName: string): Blob {
    const pdf = new jsPDF('landscape');
    
    pdf.setFontSize(20);
    pdf.text('Planning', 20, 20);
    
    pdf.setFontSize(10);
    pdf.text(`Généré le: ${dateFormat(new Date(), 'dd MMMM yyyy', { locale: fr })}`, 20, 30);

    const tableData = planning.map(entry => [
        dateFormat(new Date(entry.date), 'dd/MM/yyyy'),
        entry.userName || 'Non assigné',
        entry.position || '',
        entry.schedule || '',
        entry.location || '',
        entry.status || 'Planifié'
    ]);

    pdf.autoTable({
        startY: 40,
        head: [['Date', 'Utilisateur', 'Poste', 'Horaire', 'Lieu', 'Statut']],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 152, 219] }
    });

    return pdf.output('blob');
}