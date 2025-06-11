/**
 * Service d'export des trames en PDF et Excel
 * Génère des documents formatés pour l'impression et l'analyse
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toastManager } from '@/lib/toast-manager';

export interface ExportOptions {
  format: 'pdf' | 'excel';
  includePersonnel: boolean;
  includeInactive: boolean;
  weekType?: 'ALL' | 'EVEN' | 'ODD';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface TrameExportData {
  trameName: string;
  site: string;
  weekType: string;
  rooms: Array<{
    id: string;
    name: string;
    sector: string;
  }>;
  affectations: Array<{
    roomId: string;
    dayOfWeek: number;
    period: string;
    activityType: string;
    personnel: Array<{
      name: string;
      role: string;
    }>;
    isActive: boolean;
    weekType: string;
  }>;
}

const DAYS_OF_WEEK = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const PERIODS = {
  MORNING: 'Matin',
  AFTERNOON: 'Après-midi',
  FULL_DAY: '24h',
};

export class TrameExportService {
  /**
   * Exporte une trame selon le format spécifié
   */
  async exportTrame(data: TrameExportData, options: ExportOptions): Promise<void> {
    try {
      if (options.format === 'pdf') {
        await this.exportToPDF(data, options);
      } else {
        await this.exportToExcel(data, options);
      }
    } catch (error) {
      console.error('Export error:', error);
      toastManager.error(`Erreur lors de l'export ${options.format.toUpperCase()}`);
      throw error;
    }
  }

  /**
   * Export en PDF avec mise en page professionnelle
   */
  private async exportToPDF(data: TrameExportData, options: ExportOptions): Promise<void> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Couleurs du thème
    const primaryColor = [59, 130, 246]; // blue-500
    const secondaryColor = [100, 116, 139]; // slate-500
    const lightBg = [248, 250, 252]; // slate-50

    // En-tête du document
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 297, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(data.trameName, 15, 12);
    
    doc.setFontSize(10);
    doc.text(`Site: ${data.site}`, 200, 8);
    doc.text(`Semaines: ${this.getWeekTypeLabel(data.weekType)}`, 200, 13);
    doc.text(`Généré le: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 200, 18);

    // Préparer les données pour le tableau
    const tableData: any[][] = [];
    const headers = ['Salle/Secteur', ...DAYS_OF_WEEK.slice(1), 'Dimanche']; // Commence par lundi

    // Organiser les affectations par salle et jour
    const affectationsByRoom = new Map<string, Map<number, any[]>>();
    
    data.affectations.forEach(aff => {
      if (!options.includeInactive && !aff.isActive) return;
      if (options.weekType && options.weekType !== 'ALL' && aff.weekType !== options.weekType && aff.weekType !== 'ALL') return;

      const room = data.rooms.find(r => r.id === aff.roomId);
      if (!room) return;

      if (!affectationsByRoom.has(aff.roomId)) {
        affectationsByRoom.set(aff.roomId, new Map());
      }
      
      const roomAffectations = affectationsByRoom.get(aff.roomId)!;
      if (!roomAffectations.has(aff.dayOfWeek)) {
        roomAffectations.set(aff.dayOfWeek, []);
      }
      
      roomAffectations.get(aff.dayOfWeek)!.push(aff);
    });

    // Construire les lignes du tableau
    let currentSector = '';
    affectationsByRoom.forEach((dayMap, roomId) => {
      const room = data.rooms.find(r => r.id === roomId)!;
      
      // Ajouter une ligne de secteur si nécessaire
      if (room.sector !== currentSector) {
        currentSector = room.sector;
        tableData.push([
          { content: currentSector, colSpan: 8, styles: { fillColor: lightBg, fontStyle: 'bold' } }
        ]);
      }

      // Ligne pour la salle
      const roomRow: any[] = [room.name];
      
      // Pour chaque jour (lundi à dimanche)
      for (let day = 1; day <= 7; day++) {
        const dayIndex = day === 7 ? 0 : day; // Dimanche = 0
        const affectations = dayMap.get(dayIndex) || [];
        
        if (affectations.length === 0) {
          roomRow.push('');
        } else {
          const content = affectations.map(aff => {
            const period = PERIODS[aff.period as keyof typeof PERIODS];
            const personnel = options.includePersonnel && aff.personnel.length > 0
              ? '\n' + aff.personnel.map(p => `${p.name} (${p.role})`).join('\n')
              : '';
            return `${aff.activityType} - ${period}${personnel}`;
          }).join('\n\n');
          
          roomRow.push(content);
        }
      }
      
      tableData.push(roomRow);
    });

    // Générer le tableau
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 25,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 40 }, // Colonne salle/secteur
      },
      didDrawCell: (data) => {
        // Colorer les cellules selon le type d'activité
        if (data.section === 'body' && data.column.index > 0) {
          const cellText = data.cell.text.join(' ');
          if (cellText.includes('24h')) {
            doc.setFillColor(99, 102, 241, 20); // indigo très léger
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          }
        }
      },
    });

    // Pied de page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setTextColor(...secondaryColor);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} / ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Sauvegarder le PDF
    const fileName = `trame_${data.trameName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
    doc.save(fileName);
    toastManager.success('Export PDF généré avec succès');
  }

  /**
   * Export en Excel avec plusieurs feuilles
   */
  private async exportToExcel(data: TrameExportData, options: ExportOptions): Promise<void> {
    const wb = XLSX.utils.book_new();

    // Feuille 1: Vue planning
    const planningData: any[][] = [];
    
    // En-tête
    planningData.push(['Planning des Trames - ' + data.trameName]);
    planningData.push(['Site:', data.site]);
    planningData.push(['Type de semaine:', this.getWeekTypeLabel(data.weekType)]);
    planningData.push(['Date export:', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })]);
    planningData.push([]); // Ligne vide

    // Headers du tableau
    planningData.push(['Salle/Secteur', ...DAYS_OF_WEEK.slice(1), 'Dimanche']);

    // Organiser les données comme pour le PDF
    const affectationsByRoom = new Map<string, Map<number, any[]>>();
    
    data.affectations.forEach(aff => {
      if (!options.includeInactive && !aff.isActive) return;
      if (options.weekType && options.weekType !== 'ALL' && aff.weekType !== options.weekType && aff.weekType !== 'ALL') return;

      const room = data.rooms.find(r => r.id === aff.roomId);
      if (!room) return;

      if (!affectationsByRoom.has(aff.roomId)) {
        affectationsByRoom.set(aff.roomId, new Map());
      }
      
      const roomAffectations = affectationsByRoom.get(aff.roomId)!;
      if (!roomAffectations.has(aff.dayOfWeek)) {
        roomAffectations.set(aff.dayOfWeek, []);
      }
      
      roomAffectations.get(aff.dayOfWeek)!.push(aff);
    });

    // Construire les lignes
    let currentSector = '';
    affectationsByRoom.forEach((dayMap, roomId) => {
      const room = data.rooms.find(r => r.id === roomId)!;
      
      // Ligne de secteur
      if (room.sector !== currentSector) {
        currentSector = room.sector;
        planningData.push([currentSector, '', '', '', '', '', '', '']);
      }

      // Ligne de salle
      const roomRow: any[] = [room.name];
      
      for (let day = 1; day <= 7; day++) {
        const dayIndex = day === 7 ? 0 : day;
        const affectations = dayMap.get(dayIndex) || [];
        
        if (affectations.length === 0) {
          roomRow.push('');
        } else {
          const content = affectations.map(aff => {
            const period = PERIODS[aff.period as keyof typeof PERIODS];
            const personnel = options.includePersonnel && aff.personnel.length > 0
              ? ` - ${aff.personnel.map(p => p.name).join(', ')}`
              : '';
            return `${aff.activityType} (${period})${personnel}`;
          }).join(' | ');
          
          roomRow.push(content);
        }
      }
      
      planningData.push(roomRow);
    });

    // Créer la feuille planning
    const wsPlanning = XLSX.utils.aoa_to_sheet(planningData);
    
    // Définir les largeurs de colonnes
    wsPlanning['!cols'] = [
      { wch: 25 }, // Salle/Secteur
      { wch: 30 }, // Lundi
      { wch: 30 }, // Mardi
      { wch: 30 }, // Mercredi
      { wch: 30 }, // Jeudi
      { wch: 30 }, // Vendredi
      { wch: 30 }, // Samedi
      { wch: 30 }, // Dimanche
    ];

    XLSX.utils.book_append_sheet(wb, wsPlanning, 'Planning');

    // Feuille 2: Détail des affectations
    if (options.includePersonnel) {
      const detailData: any[][] = [];
      
      detailData.push(['Détail des Affectations']);
      detailData.push([]);
      detailData.push(['Salle', 'Secteur', 'Jour', 'Période', 'Type activité', 'Personnel', 'Rôle', 'Statut', 'Type semaine']);

      data.affectations.forEach(aff => {
        if (!options.includeInactive && !aff.isActive) return;

        const room = data.rooms.find(r => r.id === aff.roomId);
        if (!room) return;

        if (aff.personnel.length === 0) {
          detailData.push([
            room.name,
            room.sector,
            DAYS_OF_WEEK[aff.dayOfWeek],
            PERIODS[aff.period as keyof typeof PERIODS],
            aff.activityType,
            'Non assigné',
            '',
            aff.isActive ? 'Actif' : 'Inactif',
            this.getWeekTypeLabel(aff.weekType),
          ]);
        } else {
          aff.personnel.forEach(person => {
            detailData.push([
              room.name,
              room.sector,
              DAYS_OF_WEEK[aff.dayOfWeek],
              PERIODS[aff.period as keyof typeof PERIODS],
              aff.activityType,
              person.name,
              person.role,
              aff.isActive ? 'Actif' : 'Inactif',
              this.getWeekTypeLabel(aff.weekType),
            ]);
          });
        }
      });

      const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
      XLSX.utils.book_append_sheet(wb, wsDetail, 'Détails');
    }

    // Feuille 3: Statistiques
    const statsData: any[][] = [];
    
    statsData.push(['Statistiques du Planning']);
    statsData.push([]);
    
    // Compter les affectations par type
    const statsByType = new Map<string, number>();
    const statsByDay = new Map<number, number>();
    const statsByPeriod = new Map<string, number>();
    
    data.affectations.forEach(aff => {
      if (!options.includeInactive && !aff.isActive) return;
      
      statsByType.set(aff.activityType, (statsByType.get(aff.activityType) || 0) + 1);
      statsByDay.set(aff.dayOfWeek, (statsByDay.get(aff.dayOfWeek) || 0) + 1);
      statsByPeriod.set(aff.period, (statsByPeriod.get(aff.period) || 0) + 1);
    });

    statsData.push(['Par type d\'activité:']);
    statsByType.forEach((count, type) => {
      statsData.push(['', type, count]);
    });
    
    statsData.push([]);
    statsData.push(['Par jour:']);
    for (let i = 0; i < 7; i++) {
      statsData.push(['', DAYS_OF_WEEK[i], statsByDay.get(i) || 0]);
    }
    
    statsData.push([]);
    statsData.push(['Par période:']);
    statsByPeriod.forEach((count, period) => {
      statsData.push(['', PERIODS[period as keyof typeof PERIODS], count]);
    });

    const wsStats = XLSX.utils.aoa_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');

    // Sauvegarder le fichier
    const fileName = `trame_${data.trameName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toastManager.success('Export Excel généré avec succès');
  }

  /**
   * Helper pour obtenir le label du type de semaine
   */
  private getWeekTypeLabel(weekType: string): string {
    switch (weekType) {
      case 'ALL':
        return 'Toutes les semaines';
      case 'EVEN':
        return 'Semaines paires';
      case 'ODD':
        return 'Semaines impaires';
      default:
        return weekType;
    }
  }
}