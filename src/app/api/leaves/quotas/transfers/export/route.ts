import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { QuotaTransferReportOptions } from '@/modules/leaves/types/quota';
import ExcelJS from 'exceljs';
import { PDFDocument, rgb } from 'pdf-lib';
import { parse as csvParse, stringify as csvStringify } from 'csv-string';
import { formatDate } from '@/utils/dateUtils';

const prisma = new PrismaClient();

/**
 * GET /api/leaves/quotas/transfers/export
 * Exporte un rapport de transferts de quotas au format demandé
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        // Vérifier les autorisations
        const isAdmin = ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(session.user.role);
        const isManager = ['MANAGER'].includes(session.user.role);

        if (!isAdmin && !isManager) {
            return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
        }

        // Récupérer le format demandé
        const { searchParams } = new URL(req.url);
        const format = searchParams.get('format') || 'pdf';

        if (!['pdf', 'csv', 'excel'].includes(format)) {
            return NextResponse.json(
                { error: 'Format non supporté. Utilisez pdf, csv ou excel.' },
                { status: 400 }
            );
        }

        // Récupérer les options de rapport
        const options: QuotaTransferReportOptions = await req.json();

        // Construire la requête
        const whereClause: any = {};

        // Filtres de date
        if (options.startDate && options.endDate) {
            whereClause.transferDate = {
                gte: new Date(options.startDate),
                lte: new Date(options.endDate)
            };
        } else if (options.startDate) {
            whereClause.transferDate = {
                gte: new Date(options.startDate)
            };
        } else if (options.endDate) {
            whereClause.transferDate = {
                lte: new Date(options.endDate)
            };
        }

        // Filtres de type de congé
        if (options.leaveTypes && options.leaveTypes.length > 0) {
            whereClause.OR = [
                { fromType: { in: options.leaveTypes } },
                { toType: { in: options.leaveTypes } }
            ];
        }

        // Filtres de département (si l'utilisateur a les droits)
        if (isAdmin && options.departments && options.departments.length > 0) {
            whereClause.user = {
                departmentId: { in: options.departments }
            };
        }

        // Filtres de statut
        if (options.status && options.status.length > 0) {
            whereClause.status = { in: options.status };
        }

        // Si c'est un manager, limiter aux utilisateurs de son département
        if (isManager && !isAdmin) {
            const manager = await prisma.user.findFirst({
                where: { id: parseInt(session.user.id) }
            });

            if (manager?.departmentId) {
                whereClause.user = {
                    ...whereClause.user,
                    departmentId: manager.departmentId
                };
            }
        }

        // Récupérer les transferts
        const transfers = await prisma.quotaTransfer.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        email: true,
                        department: true
                    }
                },
                approvedBy: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        email: true
                    }
                }
            },
            orderBy: {
                transferDate: 'desc'
            }
        });

        // Obtenir le titre du rapport
        const reportTitle = `Rapport des transferts de quotas ${options.startDate ? 'du ' + formatDate(new Date(options.startDate)) : ''} ${options.startDate && options.endDate ? 'au' : ''
            } ${options.endDate ? formatDate(new Date(options.endDate)) : ''}`.trim();

        // Générer le rapport selon le format demandé
        if (format === 'excel') {
            return await generateExcelReport(transfers, reportTitle);
        } else if (format === 'csv') {
            return await generateCsvReport(transfers, reportTitle);
        } else {
            return await generatePdfReport(transfers, reportTitle);
        }
    } catch (error) {
        console.error(`Erreur lors de l'exportation du rapport :`, error);
        return NextResponse.json(
            { error: `Erreur lors de l'exportation du rapport` },
            { status: 500 }
        );
    }
}

/**
 * Génère un rapport Excel
 */
async function generateExcelReport(transfers: any[], reportTitle: string): Promise<NextResponse> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Mathildanesth';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Transferts de quotas');

    // Définir les en-têtes
    worksheet.columns = [
        { header: 'ID', key: 'id', width: 15 },
        { header: 'Utilisateur', key: 'userName', width: 25 },
        { header: 'Département', key: 'departmentName', width: 20 },
        { header: 'Type source', key: 'fromType', width: 15 },
        { header: 'Type destination', key: 'toType', width: 15 },
        { header: 'Jours transférés', key: 'amount', width: 15 },
        { header: 'Jours convertis', key: 'convertedAmount', width: 15 },
        { header: 'Date de transfert', key: 'transferDate', width: 20 },
        { header: 'Statut', key: 'status', width: 15 },
        { header: 'Approuvé par', key: 'approvedBy', width: 25 },
        { header: 'Date d\'approbation', key: 'approvalDate', width: 20 },
        { header: 'Raison', key: 'reason', width: 30 }
    ];

    // Ajouter le titre
    worksheet.mergeCells('A1:L1');
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = reportTitle;
    titleRow.getCell(1).font = { bold: true, size: 16 };
    titleRow.height = 25;

    // Styliser les en-têtes
    const headerRow = worksheet.getRow(2);
    headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6E6' }
        };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // Ajouter les données
    transfers.forEach(transfer => {
        worksheet.addRow({
            id: transfer.id,
            userName: `${transfer.user.prenom} ${transfer.user.nom}`,
            departmentName: transfer.user.department?.name || '',
            fromType: transfer.fromType,
            toType: transfer.toType,
            amount: transfer.amount,
            convertedAmount: transfer.convertedAmount,
            transferDate: formatDate(transfer.transferDate),
            status: transfer.status,
            approvedBy: transfer.approvedBy ? `${transfer.approvedBy.prenom} ${transfer.approvedBy.nom}` : '',
            approvalDate: transfer.approvalDate ? formatDate(transfer.approvalDate) : '',
            reason: transfer.reason || ''
        });
    });

    // Formater les cellules numériques
    worksheet.getColumn('amount').numFmt = '0.00';
    worksheet.getColumn('convertedAmount').numFmt = '0.00';

    // Générer le buffer Excel
    const buffer = await workbook.xlsx.writeBuffer();

    // Créer la réponse
    const response = new NextResponse(buffer);
    response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    response.headers.set('Content-Disposition', `attachment; filename="transferts_quotas_${new Date().toISOString().split('T')[0]}.xlsx"`);

    return response;
}

/**
 * Génère un rapport CSV
 */
async function generateCsvReport(transfers: any[], reportTitle: string): Promise<NextResponse> {
    // Préparer les données
    const headers = [
        'ID', 'Utilisateur', 'Département', 'Type source', 'Type destination',
        'Jours transférés', 'Jours convertis', 'Date de transfert', 'Statut',
        'Approuvé par', 'Date d\'approbation', 'Raison'
    ];

    const rows = transfers.map(transfer => [
        transfer.id,
        `${transfer.user.prenom} ${transfer.user.nom}`,
        transfer.user.department?.name || '',
        transfer.fromType,
        transfer.toType,
        transfer.amount.toString(),
        transfer.convertedAmount.toString(),
        formatDate(transfer.transferDate),
        transfer.status,
        transfer.approvedBy ? `${transfer.approvedBy.prenom} ${transfer.approvedBy.nom}` : '',
        transfer.approvalDate ? formatDate(transfer.approvalDate) : '',
        transfer.reason || ''
    ]);

    // Ajouter le titre comme commentaire
    const csvContent = `# ${reportTitle}\n` + csvStringify([headers, ...rows]);

    // Créer la réponse
    const response = new NextResponse(csvContent);
    response.headers.set('Content-Type', 'text/csv; charset=utf-8');
    response.headers.set('Content-Disposition', `attachment; filename="transferts_quotas_${new Date().toISOString().split('T')[0]}.csv"`);

    return response;
}

/**
 * Génère un rapport PDF
 */
async function generatePdfReport(transfers: any[], reportTitle: string): Promise<NextResponse> {
    // Créer un document PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 paysage

    const { width, height } = page.getSize();
    const fontSize = 10;
    const titleFontSize = 16;
    const margin = 40;
    const rowHeight = 20;
    const columnWidths = [80, 120, 100, 80, 80, 60, 60, 80, 60, 80, 80, 100];

    // Dessiner le titre
    page.drawText(reportTitle, {
        x: margin,
        y: height - margin,
        size: titleFontSize,
        color: rgb(0, 0, 0)
    });

    // Dessiner les en-têtes
    const headers = [
        'ID', 'Utilisateur', 'Département', 'Type source', 'Type destination',
        'Jours', 'Convertis', 'Date transfert', 'Statut', 'Approuvé par',
        'Date approbation', 'Raison'
    ];

    let currentX = margin;
    for (let i = 0; i < headers.length; i++) {
        page.drawText(headers[i], {
            x: currentX,
            y: height - margin - 30,
            size: fontSize,
            color: rgb(0, 0, 0)
        });
        currentX += columnWidths[i];
    }

    // Dessiner une ligne horizontale sous les en-têtes
    page.drawLine({
        start: { x: margin, y: height - margin - 35 },
        end: { x: width - margin, y: height - margin - 35 },
        color: rgb(0, 0, 0),
        thickness: 1
    });

    // Dessiner les données
    let currentY = height - margin - 35 - rowHeight;
    for (const transfer of transfers) {
        // Vérifier si on a besoin d'une nouvelle page
        if (currentY < margin) {
            const newPage = pdfDoc.addPage([842, 595]);
            page = newPage;
            currentY = height - margin;

            // Redessiner les en-têtes sur la nouvelle page
            currentX = margin;
            for (let i = 0; i < headers.length; i++) {
                page.drawText(headers[i], {
                    x: currentX,
                    y: height - margin - 30,
                    size: fontSize,
                    color: rgb(0, 0, 0)
                });
                currentX += columnWidths[i];
            }

            // Redessiner la ligne sous les en-têtes
            page.drawLine({
                start: { x: margin, y: height - margin - 35 },
                end: { x: width - margin, y: height - margin - 35 },
                color: rgb(0, 0, 0),
                thickness: 1
            });

            currentY = height - margin - 35 - rowHeight;
        }

        // Données de la ligne
        const rowData = [
            transfer.id,
            `${transfer.user.prenom} ${transfer.user.nom}`,
            transfer.user.department?.name || '',
            transfer.fromType,
            transfer.toType,
            transfer.amount.toString(),
            transfer.convertedAmount.toString(),
            formatDate(transfer.transferDate),
            transfer.status,
            transfer.approvedBy ? `${transfer.approvedBy.prenom} ${transfer.approvedBy.nom}` : '',
            transfer.approvalDate ? formatDate(transfer.approvalDate) : '',
            transfer.reason || ''
        ];

        // Dessiner la ligne
        currentX = margin;
        for (let i = 0; i < rowData.length; i++) {
            page.drawText(rowData[i].substring(0, 20) + (rowData[i].length > 20 ? '...' : ''), {
                x: currentX,
                y: currentY,
                size: fontSize,
                color: rgb(0, 0, 0)
            });
            currentX += columnWidths[i];
        }

        // Ligne horizontale en dessous de chaque ligne de données
        if (transfers.indexOf(transfer) < transfers.length - 1) {
            page.drawLine({
                start: { x: margin, y: currentY - 5 },
                end: { x: width - margin, y: currentY - 5 },
                color: rgb(0.8, 0.8, 0.8),
                thickness: 0.5
            });
        }

        currentY -= rowHeight;
    }

    // Dessiner une ligne horizontale de fin
    page.drawLine({
        start: { x: margin, y: currentY - 5 },
        end: { x: width - margin, y: currentY - 5 },
        color: rgb(0, 0, 0),
        thickness: 1
    });

    // Informations en pied de page
    page.drawText(`Généré le ${formatDate(new Date())} - Mathildanesth`, {
        x: margin,
        y: margin / 2,
        size: fontSize - 2,
        color: rgb(0.5, 0.5, 0.5)
    });

    // Obtenir le PDF sous forme de bytes
    const pdfBytes = await pdfDoc.save();

    // Créer la réponse
    const response = new NextResponse(pdfBytes);
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `attachment; filename="transferts_quotas_${new Date().toISOString().split('T')[0]}.pdf"`);

    return response;
} 