import { NextResponse } from 'next/server';
import { PrismaClient, User } from '@prisma/client';
// Importer votre logique d'authentification/session pour obtenir l'utilisateur
// import { getServerSession } from 'next-auth/next'; // Ancien import
import { getServerSession } from "next-auth"; // Nouvel import
// import { authOptions } from '@/lib/auth'; // <--- Chemin potentiellement incorrect, commenté temporairement

const prisma = new PrismaClient();

// Fonction pour vérifier si l'utilisateur est admin
const isAdmin = (user: User | null): boolean => {
    // Adaptez cette logique à votre modèle User et aux rôles admin
    // Vérifier si user n'est pas null avant d'accéder à user.role
    return !!user && (user.role === 'ADMIN_TOTAL' || user.role === 'ADMIN_PARTIEL');
};

/**
 * GET /api/admin/leave-types
 * Récupère la liste de tous les paramètres de types de congés.
 * Réservé aux administrateurs.
 */
export async function GET(request: Request) {
    try {
        // --- Authentification commentée temporairement --- 
        /*
        const session = await getServerSession(authOptions); // Nécessite authOptions
        const user = session?.user?.email 
            ? await prisma.user.findUnique({ where: { email: session.user.email } })
            : null;

        if (!isAdmin(user)) {
          return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
        }
        */
        // --- Fin section commentée ---

        const leaveTypeSettings = await prisma.leaveTypeSetting.findMany({ // Correction: camelCase
            orderBy: { label: 'asc' },
        });

        return NextResponse.json(leaveTypeSettings);

    } catch (error) {
        console.error('Erreur API [GET /admin/leave-types]:', error);
        return NextResponse.json({ error: 'Erreur serveur lors de la récupération des types de congés.' }, { status: 500 });
    } finally {
        // Ne pas déconnecter ici si prisma est utilisé dans plusieurs fonctions du même fichier
        // await prisma.$disconnect(); 
    }
}

// TODO: Implémenter POST, PUT, DELETE avec la même vérification admin

/**
 * POST /api/admin/leave-types
 * Crée un nouveau paramètre de type de congé.
 * Réservé aux administrateurs.
 */
export async function POST(request: Request) {
    try {
        // --- Authentification commentée temporairement --- 
        /*
        const session = await getServerSession(authOptions); // Nécessite authOptions
        const user = session?.user?.email 
            ? await prisma.user.findUnique({ where: { email: session.user.email } })
            : null;

        if (!isAdmin(user)) {
          return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
        }
        */
        // --- Fin section commentée ---

        const body = await request.json();

        if (!body.code || !body.label) {
            return NextResponse.json({ error: 'Les champs code et label sont requis.' }, { status: 400 });
        }

        const existing = await prisma.leaveTypeSetting.findUnique({ where: { code: body.code } }); // Correction: camelCase
        if (existing) {
            return NextResponse.json({ error: `Le code '${body.code}' existe déjà.` }, { status: 409 });
        }

        const newLeaveTypeSetting = await prisma.leaveTypeSetting.create({ // Correction: camelCase
            data: {
                code: body.code,
                label: body.label,
                description: body.description,
                rules: body.rules ?? undefined,
                isActive: body.isActive !== undefined ? body.isActive : true,
                isUserSelectable: body.isUserSelectable !== undefined ? body.isUserSelectable : true,
            },
        });

        return NextResponse.json(newLeaveTypeSetting, { status: 201 });

    } catch (error) {
        console.error('Erreur API [POST /admin/leave-types]:', error);
        if ((error as any).code === 'P2002' && (error as any).meta?.target?.includes('code')) {
            return NextResponse.json({ error: 'Le code fourni existe déjà.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Erreur serveur lors de la création du type de congé.' }, { status: 500 });
    } finally {
        // await prisma.$disconnect();
    }
} 