import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { promises as fs } from 'fs';
import path from 'path';
import { CalendarExportFormat } from '@/modules/calendrier/types/event';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { exportSimulationResults, exportLeaveData, exportPlanningData } from '@/services/exportServiceV2';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import ical from 'ical-generator';
import { auditService, AuditAction } from '@/services/OptimizedAuditService';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import * as ExcelJS from 'exceljs';
import { getServerSession } from '@/lib/auth/migration-shim';
import { authOptions } from '@/lib/auth/migration-shim';

// Fonction pour obtenir un chemin de fichier temporaire
const getTempFilePath = (extension: string): string => {
    const tempDir = path.join(process.cwd(), 'tmp');
    return path.join(tempDir, `calendar_export_${Date.now()}.${extension}`);
};

// Fonction pour créer le répertoire temporaire s'il n'existe pas
const ensureTempDir = async (): Promise<void> => {
    const tempDir = path.join(process.cwd(), 'tmp');
    try {
        await fs.access(tempDir);
    } catch {
        await fs.mkdir(tempDir, { recursive: true });
    }
};

export async function POST(request: NextRequest) {
    try {
        await ensureTempDir();

        const options = await request.json();

        // Vérifier l'authentification pour l'audit
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
        let currentUserId: number | undefined;
        
        if (token) {
            const authResult = await verifyAuthToken(token);
            if (authResult.authenticated) {
                currentUserId = authResult.userId;
            }
        }

        // Réutiliser la logique de récupération des événements de l'API /api/calendrier
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || request.nextUrl.origin;
        const eventsResponse = await fetch(`${baseUrl}/api/calendrier`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || ''
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
            filteredEvents = filteredEvents.filter((event: unknown) => options.eventTypes.includes(event.type));
        }

        // Filtrer par plage de dates
        if (options.dateRange) {
            const startDate = new Date(options.dateRange.start);
            const endDate = new Date(options.dateRange.end);

            filteredEvents = filteredEvents.filter((event: unknown) => {
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
                contentType = 'text/calendrier';
                break;

            default:
                return NextResponse.json(
                    { error: 'Format d\'export non pris en charge' },
                    { status: 400 }
                );
        }

        // Lire le fichier généré
        const fileBuffer = await fs.readFile(filePath);

        // Supprimer le fichier temporaire
        try {
            await fs.unlink(filePath);
        } catch (unlinkError: unknown) {
            logger.warn('Impossible de supprimer le fichier temporaire:', unlinkError);
        }

        // Log d'audit pour l'export
        await auditService.logAction({
            action: AuditAction.DATA_EXPORTED,
            entityId: 'calendar_export',
            entityType: 'Calendar',
            userId: currentUserId,
            details: {
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown',
                metadata: {
                    format: options.format,
                    fileName,
                    eventCount: filteredEvents.length,
                    dateRange: options.dateRange ? {
                        start: options.dateRange.start,
                        end: options.dateRange.end
                    } : null,
                    eventTypes: options.eventTypes || [],
                    includeAllEvents: options.includeAllEvents || false
                }
            }
        });

        // Retourner le fichier
        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${fileName}"`
            }
        });
    } catch (error: unknown) {
        logger.error('Erreur lors de l\'export du calendrier:', { error: error });
        
        // Log d'audit pour l'échec
        await auditService.logAction({
            action: AuditAction.ERROR_OCCURRED,
            entityId: 'calendar_export',
            entityType: 'Calendar',
            userId: currentUserId,
            severity: 'ERROR',
            success: false,
            details: {
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                action: 'calendar_export',
                metadata: {
                    format: options?.format
                }
            }
        });
        
        return NextResponse.json(
            { error: 'Erreur lors de l\'export du calendrier' },
            { status: 500 }
        );
    }
}

// Fonction pour exporter au format Excel
async function exportToExcel(events: unknown[], options: unknown): Promise<string> {
    const filePath = getTempFilePath('xlsx');

    // Transformer les événements en lignes pour Excel
    const rows = events.map((event: unknown) => ({
        'Type': getEventTypeLabel(event.type),
        'Titre': event.title,
        'Début': format(new Date(event.start), 'dd/MM/yyyy HH:mm', { locale: fr }),
        'Fin': format(new Date(event.end), 'dd/MM/yyyy HH:mm', { locale: fr }),
        'Utilisateur': event.user ? `${event.user.prenom} ${event.user.nom}` : '',
        'Description': event.description || ''
    }));

    // Créer un workbook avec ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Calendrier');

    // Ajouter les headers
    if (rows.length > 0) {
        const headers = Object.keys(rows[0]);
        worksheet.addRow(headers);
        
        // Ajouter les données
        rows.forEach(row => {
            worksheet.addRow(Object.values(row));
        });
    }

    // Écrire le fichier
    await workbook.xlsx.writeFile(filePath);

    return filePath;
}

// Fonction pour exporter au format PDF
async function exportToPDF(events: unknown[], options: unknown): Promise<string> {
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
    const tableRows = events.map((event: unknown) => [
        getEventTypeLabel(event.type),
        event.title,
        format(new Date(event.start), 'dd/MM/yyyy HH:mm', { locale: fr }),
        format(new Date(event.end), 'dd/MM/yyyy HH:mm', { locale: fr }),
        event.user ? `${event.user.prenom} ${event.user.nom}` : '',
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
async function exportToCSV(events: unknown[], options: unknown): Promise<string> {
    const filePath = getTempFilePath('csv');

    // Entêtes CSV
    const headers = ['Type', 'Titre', 'Début', 'Fin', 'Utilisateur', 'Description'];

    // Transformer les événements en lignes CSV
    const rows = events.map((event: unknown) => [
        getEventTypeLabel(event.type),
        `"${event.title.replace(/"/g, '""')}"`,
        format(new Date(event.start), 'dd/MM/yyyy HH:mm', { locale: fr }),
        format(new Date(event.end), 'dd/MM/yyyy HH:mm', { locale: fr }),
        event.user ? `"${event.user.prenom} ${event.user.nom}"` : '',
        `"${(event.description || '').replace(/"/g, '""')}"`
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

// Fonction pour exporter au format ICS
async function exportToICS(events: unknown[], options: unknown): Promise<string> {
    const filePath = getTempFilePath('ics');

    // Créer le calendrier ICS
    const calendar = ical({
        name: 'Calendrier Mathildanesth',
        description: 'Export du calendrier de planification'
    });

    // Ajouter chaque événement
    events.forEach((event: unknown) => {
        calendar.createEvent({
            start: new Date(event.start),
            end: new Date(event.end),
            summary: event.title,
            description: event.description || '',
            location: getEventLocation(event),
            allDay: event.allDay || false
        });
    });

    // Écrire le fichier
    await fs.writeFile(filePath, calendar.toString(), 'utf8');

    return filePath;
}

function getEventTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        'LEAVE': 'Congé',
        'DUTY': 'Garde',
        'ASSIGNMENT': 'Affectation',
        'ON_CALL': 'Astreinte',
        'TRAINING': 'Formation',
        'MEETING': 'Réunion'
    };
    return labels[type] || type;
}

function getEventLocation(event: unknown): string {
    if (event.operatingRoom) {
        return event.operatingRoom.name;
    }
    if (event.type === 'DUTY') {
        return 'Service de garde';
    }
    return '';
} 