import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { exportSimulationResults, exportLeaveData, exportPlanningData } from '@/services/exportServiceV2';
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

    let blob: Blob;

    switch (format) {
        case 'pdf':
            blob = await exportToPDF(data, finalFileName);
            break;
        case 'csv':
            blob = await exportToExcel(data, finalFileName);
            break;
        default:
            throw new Error('Format d\'export non supporté');
    }

    return blob;
}

/**
 * Exporte les résultats de simulation en PDF
 */
async function exportToPDF(data: SimulationExportData, fileName: string): Promise<Blob> {
    // Créer un nouveau document PDF
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Ajouter l'en-tête
    doc.setFontSize(20);
    doc.text('Résultats de Simulation', 105, 15, { align: 'center' });

    // Informations sur le scénario
    doc.setFontSize(12);
    doc.text(`Scénario: ${data.scenarioName}`, 14, 30);

    if (data.scenarioDescription) {
        doc.setFontSize(10);
        doc.text(`Description: ${data.scenarioDescription}`, 14, 38);
    }

    const createdDate = typeof data.createdAt === 'string'
        ? new Date(data.createdAt)
        : data.createdAt;

    doc.setFontSize(10);
    doc.text(`Date de création: ${dateFormat(createdDate, 'PPP', { locale: fr })}`, 14, 46);
    doc.text(`Statut: ${data.status}`, 14, 54);

    // Ajouter le taux de couverture
    if (data.periodCoverage !== undefined) {
        doc.text(`Taux de couverture: ${data.periodCoverage}%`, 14, 62);
    }

    // Statistiques clés
    if (data.statistics && Object.keys(data.statistics).length > 0) {
        doc.setFontSize(14);
        doc.text('Statistiques clés', 14, 75);

        const statsData = Object.entries(data.statistics).map(([key, value]) => [
            key,
            typeof value === 'object' ? JSON.stringify(value) : String(value)
        ]);

        if (statsData.length > 0) {
            doc.autoTable({
                startY: 80,
                head: [['Métrique', 'Valeur']],
                body: statsData,
                theme: 'grid',
                headStyles: { fillColor: [66, 139, 202] }
            });
        }
    }

    // Ajouter les conflits
    if (data.conflicts && data.conflicts.length > 0) {
        const currentY = doc.previousAutoTable?.finalY || 85;
        doc.setFontSize(14);
        doc.text('Conflits détectés', 14, currentY + 10);

        const conflictsData = data.conflicts.map(conflict => [
            conflict.type || 'Non spécifié',
            conflict.description || 'Aucune description',
            conflict.severity || 'medium',
            conflict.affectedUsers ? conflict.affectedUsers.join(', ') : '-'
        ]);

        doc.autoTable({
            startY: currentY + 15,
            head: [['Type', 'Description', 'Sévérité', 'Utilisateurs affectés']],
            body: conflictsData,
            theme: 'grid',
            headStyles: { fillColor: [217, 83, 79] }
        });
    }

    // Ajouter les affectations par utilisateur
    if (data.userAssignments && data.userAssignments.length > 0) {
        const currentY = doc.previousAutoTable?.finalY || 85;
        doc.setFontSize(14);
        doc.text('Affectations par utilisateur', 14, currentY + 10);

        const assignmentsData = data.userAssignments.map(user => [
            user.userName || 'Inconnu',
            user.assignments.toString(),
            user.hours ? user.hours.toFixed(1) + 'h' : '0h',
            user.conflicts.toString()
        ]);

        doc.autoTable({
            startY: currentY + 15,
            head: [['Nom', 'Affectations', 'Heures', 'Conflits']],
            body: assignmentsData,
            theme: 'grid',
            headStyles: { fillColor: [91, 192, 222] }
        });
    }

    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
            `Exporté le ${dateFormat(new Date(), 'PPP, HH:mm', { locale: fr })} - Page ${i} sur ${pageCount}`,
            105,
            287,
            { align: 'center' }
        );
    }

    // Convertir en Blob
    return doc.output('blob');
}

/**
 * Exporte les résultats de simulation en Excel
 */
async function exportToExcel(data: SimulationExportData, fileName: string): Promise<Blob> {
    // Créer un nouveau workbook
    const workbook = XLSX.utils.book_new();

    // Feuille d'informations générales
    const infoData = [
        ['Nom du scénario', data.scenarioName],
        ['Description', data.scenarioDescription || ''],
        ['Créé le', typeof data.createdAt === 'string'
            ? new Date(data.createdAt).toLocaleString('fr-FR')
            : data.createdAt.toLocaleString('fr-FR')],
        ['Statut', data.status],
        ['Taux de couverture', data.periodCoverage !== undefined ? `${data.periodCoverage}%` : 'N/A']
    ];

    const infoSheet = XLSX.utils.aoa_to_sheet(infoData);
    XLSX.utils.book_append_sheet(workbook, infoSheet, 'Informations');

    // Feuille de statistiques
    if (data.statistics && Object.keys(data.statistics).length > 0) {
        const statsData = [['Métrique', 'Valeur']];

        Object.entries(data.statistics).forEach(([key, value]) => {
            statsData.push([
                key,
                typeof value === 'object' ? JSON.stringify(value) : String(value)
            ]);
        });

        const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
        XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistiques');
    }

    // Feuille des conflits
    if (data.conflicts && data.conflicts.length > 0) {
        const conflictsData = [['Type', 'Description', 'Sévérité', 'Utilisateurs affectés', 'Date', 'Résolution suggérée']];

        data.conflicts.forEach(conflict => {
            conflictsData.push([
                conflict.type || 'Non spécifié',
                conflict.description || 'Aucune description',
                conflict.severity || 'medium',
                conflict.affectedUsers ? conflict.affectedUsers.join(', ') : '',
                conflict.date || '',
                conflict.resolution || ''
            ]);
        });

        const conflictsSheet = XLSX.utils.aoa_to_sheet(conflictsData);
        XLSX.utils.book_append_sheet(workbook, conflictsSheet, 'Conflits');
    }

    // Feuille des affectations par utilisateur
    if (data.userAssignments && data.userAssignments.length > 0) {
        const assignmentsData = [['Nom', 'Affectations', 'Heures', 'Conflits']];

        data.userAssignments.forEach(user => {
            assignmentsData.push([
                user.userName || 'Inconnu',
                user.assignments,
                user.hours ? user.hours.toFixed(1) : 0,
                user.conflicts
            ]);
        });

        const assignmentsSheet = XLSX.utils.aoa_to_sheet(assignmentsData);
        XLSX.utils.book_append_sheet(workbook, assignmentsSheet, 'Affectations');
    }

    // Convertir en Blob
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Télécharge un Blob dans le navigateur
 */
export function downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
} 