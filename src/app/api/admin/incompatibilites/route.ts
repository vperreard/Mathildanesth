import { NextResponse } from 'next/server';
import { PrismaClient, PersonnelIncompatibility, User, Surgeon, IncompatibilityType } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schéma de validation pour la création (sera utilisé pour le POST plus tard)
const createIncompatibilitySchema = z.object({
    user1Id: z.number().int().optional(),
    surgeon1Id: z.number().int().optional(),
    user2Id: z.number().int().optional(),
    surgeon2Id: z.number().int().optional(),
    type: z.nativeEnum(IncompatibilityType),
    reason: z.string().optional().nullable(),
    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
    createdById: z.number().int(), // Assumant que l'ID de l'utilisateur connecté est passé
}).refine(data => data.user1Id || data.surgeon1Id, {
    message: "Either user1Id or surgeon1Id must be provided",
    path: ["user1Id"],
}).refine(data => data.user2Id || data.surgeon2Id, {
    message: "Either user2Id or surgeon2Id must be provided",
    path: ["user2Id"],
});

// Type pour l'affichage, incluant les noms formatés
export interface DisplayPersonnelIncompatibility extends PersonnelIncompatibility {
    personnel1Display: string;
    personnel2Display: string;
    createdByUserDisplay?: string;
}

async function formatName(person: User | Surgeon | null): Promise<string> {
    if (!person) return 'N/A';
    if ('professionalRole' in person) { // C'est un User
        return `${person.prenom} ${person.nom} (${person.professionalRole})`;
    }
    // C'est un Surgeon (ou devrait l'être si pas un User)
    return `${person.prenom} ${person.nom} (Chirurgien)`;
}

export async function GET(request: Request) {
    try {
        const incompatibilities = await prisma.personnelIncompatibility.findMany({
            include: {
                user1: true,
                surgeon1: true,
                user2: true,
                surgeon2: true,
                createdByUser: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const displayIncompatibilities: DisplayPersonnelIncompatibility[] = await Promise.all(
            incompatibilities.map(async (incompat) => {
                const p1 = incompat.user1Id ? incompat.user1 : incompat.surgeon1;
                const p2 = incompat.user2Id ? incompat.user2 : incompat.surgeon2;

                return {
                    ...incompat,
                    personnel1Display: await formatName(p1),
                    personnel2Display: await formatName(p2),
                    createdByUserDisplay: incompat.createdByUser
                        ? `${incompat.createdByUser.prenom} ${incompat.createdByUser.nom}`
                        : 'Système',
                };
            })
        );

        return NextResponse.json(displayIncompatibilities);
    } catch (error) {
        console.error("Error fetching incompatibilities:", error);
        return NextResponse.json(
            { error: "Impossible de récupérer les incompatibilités." },
            { status: 500 }
        );
    }
}

// Le POST sera ajouté ici plus tard 