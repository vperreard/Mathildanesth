import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { CalendarExportFormat } from '../../../modules/calendar/types/event';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import ical from 'ical-generator';

// Fonction pour obtenir un chemin de fichier temporaire
const getTempFilePath = (extension: string): string => {
    const tempDir = path.join(process.cwd(), 'tmp');

    // Créer le répertoire temporaire s'il n'existe pas
    if (!fs.existsSync(tempDir)) {
        fs.mkdir(tempDir, { recursive: true });
    }

    return path.join(tempDir, `calendar_export_${Date.now()}.${extension}`);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    try {
        const options = req.body;

        // Réutiliser la logique de récupération des événements de l'API /api/calendar
        // Pour simplifier, nous supposons que nous avons déjà les événements
        const eventsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/calendar`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': req.headers.cookie || ''
            }
        });

        if (!eventsResponse.ok) {
            throw new Error(`Erreur lors de la récupération des événements: ${eventsResponse.statusText}`);
        }

        const events = await eventsResponse.json();

        // Filtrer les événements en fonction des options d'export
        let filteredEvents = events;

        // Filtrer par types d'événements
        if (!options.includeAllEvents && options.eventTypes?.length > 0) {
            filteredEvents = filteredEvents.filter(event => options.eventTypes.includes(event.type));
        }

        // Filtrer par plage de dates
        if (options.dateRange) {
            const startDate = new Date(options.dateRange.start);
            const endDate = new Date(options.dateRange.end);

            filteredEvents = filteredEvents.filter(event => {
                const eventStart = new Date(event.start);
                const eventEnd = new Date(event.end);

                return (eventStart <= endDate && eventEnd >= startDate);
            });
        }

        // Générer le fichier d'export selon le format demandé
        let filePath: string;
        let fileName: string;
        let contentType: string;

        switch (options.format) {
            case CalendarExportFormat.EXCEL:
                filePath = await exportToExcel(filteredEvents, options);
                fileName = (options.fileName || `calendrier_${format(new Date(), 'yyyy-MM-dd')}`) + '.xlsx';
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                break;

            case CalendarExportFormat.PDF:
                filePath = await exportToPDF(filteredEvents, options);
                fileName = (options.fileName || `calendrier_${format(new Date(), 'yyyy-MM-dd')}`) + '.pdf';
                contentType = 'application/pdf';
                break;

            case CalendarExportFormat.CSV:
                filePath = await exportToCSV(filteredEvents, options);
                fileName = (options.fileName || `calendrier_${format(new Date(), 'yyyy-MM-dd')}`) + '.csv';
                contentType = 'text/csv';
                break;

            case CalendarExportFormat.ICS:
                filePath = await exportToICS(filteredEvents, options);
                fileName = (options.fileName || `calendrier_${format(new Date(), 'yyyy-MM-dd')}`) + '.ics';
                contentType = 'text/calendar';
                break;

            default:
                return res.status(400).json({ error: 'Format d\'export non pris en charge' });
        }

        // Lire le fichier généré
        const fileBuffer = await fs.readFile(filePath);

        // Configurer les en-têtes de réponse
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        // Envoyer le fichier
        res.send(fileBuffer);

        // Supprimer le fichier temporaire
        await fs.unlink(filePath);
    } catch (error) {
        console.error('Erreur lors de l\'export du calendrier:', error);
        res.status(500).json({ error: 'Erreur lors de l\'export du calendrier' });
    }
}

// Fonction pour exporter au format Excel
async function exportToExcel(events: any[], options: any): Promise<string> {
    // Générer le fichier Excel
    const filePath = getTempFilePath('xlsx');

    // Transformer les événements en lignes pour Excel
    const rows = events.map(event => ({
        'Type': getEventTypeLabel(event.type),
        'Titre': event.title,
        'Début': format(new Date(event.start), 'dd/MM/yyyy HH:mm', { locale: fr }),
        'Fin': format(new Date(event.end), 'dd/MM/yyyy HH:mm', { locale: fr }),
        'Utilisateur': event.user ? `${event.user.firstName} ${event.user.lastName}` : '',
        'Description': event.description || ''
    }));

    // Créer un workbook
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Calendrier');

    // Écrire le fichier
    XLSX.writeFile(workbook, filePath);

    return filePath;
}

// Fonction pour exporter au format PDF
async function exportToPDF(events: any[], options: any): Promise<string> {
    // Générer le fichier PDF
    const filePath = getTempFilePath('pdf');

    // Créer un document PDF
    const doc = new jsPDF();

    // Ajouter un titre
    doc.setFontSize(16);
    doc.text('Calendrier', 14, 20);

    // Ajouter la période
    if (options.dateRange) {
        doc.setFontSize(11);
        const fromDate = format(new Date(options.dateRange.start), 'dd/MM/yyyy', { locale: fr });
        const toDate = format(new Date(options.dateRange.end), 'dd/MM/yyyy', { locale: fr });
        doc.text(`Période: du ${fromDate} au ${toDate}`, 14, 30);
    }

    // Transformer les événements en lignes pour le tableau
    const tableRows = events.map(event => [
        getEventTypeLabel(event.type),
        event.title,
        format(new Date(event.start), 'dd/MM/yyyy HH:mm', { locale: fr }),
        format(new Date(event.end), 'dd/MM/yyyy HH:mm', { locale: fr }),
        event.user ? `${event.user.firstName} ${event.user.lastName}` : '',
        event.description || ''
    ]);

    // Ajouter le tableau
    (doc as any).autoTable({
        startY: 40,
        head: [['Type', 'Titre', 'Début', 'Fin', 'Utilisateur', 'Description']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [33, 150, 243] }
    });

    // Sauvegarder le PDF
    await fs.writeFile(filePath, Buffer.from(doc.output('arraybuffer')));

    return filePath;
}

// Fonction pour exporter au format CSV
async function exportToCSV(events: any[], options: any): Promise<string> {
    // Générer le fichier CSV
    const filePath = getTempFilePath('csv');

    // Entêtes CSV
    const headers = ['Type', 'Titre', 'Début', 'Fin', 'Utilisateur', 'Description'];

    // Transformer les événements en lignes CSV
    const rows = events.map(event => [
        getEventTypeLabel(event.type),
        event.title,
        format(new Date(event.start), 'dd/MM/yyyy HH:mm', { locale: fr }),
        format(new Date(event.end), 'dd/MM/yyyy HH:mm', { locale: fr }),
        event.user ? `${event.user.firstName} ${event.user.lastName}` : '',
        event.description || ''
    ]);

    // Créer le contenu CSV
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Écrire le fichier
    await fs.writeFile(filePath, csvContent, 'utf8');

    return filePath;
}

// Fonction pour exporter au format iCalendar
async function exportToICS(events: any[], options: any): Promise<string> {
    // Générer le fichier ICS
    const filePath = getTempFilePath('ics');

    // Créer un calendrier iCalendar
    const cal = ical({
        domain: 'mathildanesth.com',
        name: 'Calendrier Mathildanesth',
        timezone: 'Europe/Paris'
    });

    // Ajouter les événements au calendrier
    events.forEach(event => {
        cal.createEvent({
            start: new Date(event.start),
            end: new Date(event.end),
            summary: event.title,
            description: event.description || '',
            allDay: event.allDay,
            location: getEventLocation(event),
            categories: [getEventTypeLabel(event.type)]
        });
    });

    // Générer le contenu ICS
    const icsString = cal.toString();

    // Écrire le fichier
    await fs.writeFile(filePath, icsString, 'utf8');

    return filePath;
}

// Fonction utilitaire pour obtenir l'étiquette du type d'événement
function getEventTypeLabel(type: string): string {
    switch (type) {
        case 'LEAVE':
            return 'Congé';
        case 'DUTY':
            return 'Garde';
        case 'ON_CALL':
            return 'Astreinte';
        case 'ASSIGNMENT':
            return 'Affectation';
        default:
            return 'Événement';
    }
}

// Fonction utilitaire pour obtenir la localisation d'un événement
function getEventLocation(event: any): string {
    if (event.locationName) {
        return event.locationName;
    }

    return '';
} 