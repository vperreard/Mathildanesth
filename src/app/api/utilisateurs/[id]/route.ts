import { prisma } from '../../../../lib/prisma'; // Import nommé
import { Role, ProfessionalRole, Prisma } from '@prisma/client';
import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
// import bcrypt from 'bcrypt'; // Import dynamique pour éviter les erreurs de bundling
import { headers } from 'next/headers';

// const prisma = prisma; // Supprimé

// Helper pour vérifier si l'utilisateur a AU MOINS l'un des rôles requis
const hasRequiredRole = async (requiredRoles: Role[] = [Role.ADMIN_TOTAL, Role.ADMIN_PARTIEL]): Promise<boolean> => {
    const headersList = await headers();
    const userRoleString = headersList.get('x-user-role');
    // Vérifier si le rôle existe et est inclus dans les rôles requis
    return !!userRoleString && requiredRoles.includes(userRoleString as Role);
};

// Helper pour récupérer l'ID de l'utilisateur depuis les headers
const getUserIdFromRequest = async (): Promise<number | null> => {
    const headersList = await headers();
    const userIdString = headersList.get('x-user-id');
    if (!userIdString) return null;
    const userId = parseInt(userIdString, 10);
    return isNaN(userId) ? null : userId;
};

interface RouteParams {
    params: { id: string };
}

// --- Fonction GET (Récupérer un utilisateur par ID) ---
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    // Vérification des droits (à ajuster selon votre logique)
    // Si seul un admin peut voir les détails d'un autre user, ou si l'user peut voir son propre profil
    // Exemple : if (!hasRequiredRole([Role.ADMIN_TOTAL]) && headers().get('x-user-id') !== params.id) ...

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
        return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { // Inclure champs existants
                id: true, nom: true, prenom: true, login: true, email: true, role: true, professionalRole: true,
                tempsPartiel: true, pourcentageTempsPartiel: true, workPattern: true, workOnMonthType: true,
                dateEntree: true, dateSortie: true, actif: true, createdAt: true, updatedAt: true, phoneNumber: true, alias: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }
        return NextResponse.json(user);
    } catch (error) {
        logger.error(`Erreur GET /api/utilisateurs/${id}:`, error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}

// --- Fonction PUT (Mettre à jour un utilisateur par ID) ---
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id, 10);
    if (isNaN(userId)) {
        return new NextResponse(JSON.stringify({ message: 'ID utilisateur invalide' }), { status: 400 });
    }

    // Utiliser les helpers corrigés
    const isAdmin = await hasRequiredRole([Role.ADMIN_TOTAL, Role.ADMIN_PARTIEL]);
    const requestingUserId = await getUserIdFromRequest();

    if (!requestingUserId) {
        // Si on ne peut pas identifier l'utilisateur, on refuse
        return new NextResponse(JSON.stringify({ message: 'Identification utilisateur échouée' }), { status: 401 });
    }

    // Soit un admin modifie, soit l'utilisateur modifie son propre profil
    if (!isAdmin && requestingUserId !== userId) {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }

    // Un ADMIN_PARTIEL ne peut pas modifier un ADMIN_TOTAL
    const isTotalAdmin = await hasRequiredRole([Role.ADMIN_TOTAL]); // Vérifie s'il est ADMIN_TOTAL
    const isPartialAdmin = await hasRequiredRole([Role.ADMIN_PARTIEL]); // Vérifie s'il est ADMIN_PARTIEL

    if (isPartialAdmin && !isTotalAdmin) { // Est PARTIEL mais pas TOTAL
        const userToEdit = await prisma.user.findUnique({ where: { id: userId } });
        if (userToEdit?.role === Role.ADMIN_TOTAL) {
            return new NextResponse(JSON.stringify({ message: 'Accès non autorisé à modifier un ADMIN_TOTAL' }), { status: 403 });
        }
    }

    try {
        const body = await request.json();
        const {
            nom, prenom, email, /* login, */ role, professionalRole, // Exclure login de la déstructuration principale
            tempsPartiel, pourcentageTempsPartiel,
            dateEntree, dateSortie, actif, password, phoneNumber, alias,
            // Récupérer explicitement workPattern et workOnMonthType si envoyés
            workPattern, workOnMonthType
        } = body;

        // --- Validation --- 
        if (!nom || !prenom || !email || !professionalRole) {
            return new NextResponse(JSON.stringify({ message: 'Nom, prénom, email et rôle professionnel sont requis.' }), { status: 400 });
        }
        // Seul un admin peut changer le rôle
        if (role && !isAdmin) { // Utiliser la variable isAdmin calculée plus haut
            return new NextResponse(JSON.stringify({ message: 'Seul un admin peut modifier le rôle.' }), { status: 403 });
        }
        if (role && !Object.values(Role).includes(role)) {
            return new NextResponse(JSON.stringify({ message: 'Rôle invalide.' }), { status: 400 });
        }
        if (professionalRole && !Object.values(ProfessionalRole).includes(professionalRole)) {
            return new NextResponse(JSON.stringify({ message: 'Rôle professionnel invalide.' }), { status: 400 });
        }

        // --- Préparation des données --- 
        const dataToUpdate: Prisma.UserUpdateInput = {};

        // Ajouter les champs seulement s'ils sont définis dans le body
        if (nom !== undefined) dataToUpdate.nom = nom;
        if (prenom !== undefined) dataToUpdate.prenom = prenom;
        if (email !== undefined) dataToUpdate.email = email;
        if (professionalRole !== undefined) dataToUpdate.professionalRole = professionalRole;
        if (tempsPartiel !== undefined) dataToUpdate.tempsPartiel = !!tempsPartiel;
        if (pourcentageTempsPartiel !== undefined) {
            dataToUpdate.pourcentageTempsPartiel = tempsPartiel === false ? null : (parseFloat(pourcentageTempsPartiel) || null);
        }
        if (alias !== undefined) dataToUpdate.alias = alias || null;
        if (dateEntree !== undefined) dataToUpdate.dateEntree = dateEntree ? new Date(dateEntree) : null;
        if (dateSortie !== undefined) dataToUpdate.dateSortie = dateSortie ? new Date(dateSortie) : null;
        if (actif !== undefined) dataToUpdate.actif = !!actif;
        if (phoneNumber !== undefined) dataToUpdate.phoneNumber = phoneNumber || null;
        if (workPattern !== undefined) dataToUpdate.workPattern = workPattern;
        if (workOnMonthType !== undefined) {
            dataToUpdate.workOnMonthType = tempsPartiel === false ? null : workOnMonthType;
        }

        // Ajouter le rôle seulement si l'utilisateur est admin
        if (role && isAdmin) { // Utiliser la variable isAdmin
            dataToUpdate.role = role;
        }

        // Si un nouveau mot de passe est fourni...
        if (password) {
            const saltRounds = 10;
            const bcrypt = await import('bcrypt');
            dataToUpdate.password = await bcrypt.default.hash(password, saltRounds);
            if (requestingUserId === userId) {
                dataToUpdate.mustChangePassword = false;
            }
        }

        // --- Mise à jour --- 
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate,
            select: {
                id: true, nom: true, prenom: true, email: true, login: true, role: true,
                professionalRole: true, actif: true, mustChangePassword: true,
                tempsPartiel: true, pourcentageTempsPartiel: true, alias: true,
                dateEntree: true, dateSortie: true, phoneNumber: true,
                workPattern: true, workOnMonthType: true,
            }
        });

        return NextResponse.json(updatedUser);

    } catch (error: any) {
        logger.error(`Erreur PUT /api/utilisateurs/${userId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                let field = 'inconnu';
                if (error.meta?.target?.includes('email')) field = 'email';
                if (error.meta?.target?.includes('login')) field = 'login';
                return new NextResponse(JSON.stringify({ message: `Le champ ${field} existe déjà.` }), { status: 409 });
            } else if (error.code === 'P2025') {
                return new NextResponse(JSON.stringify({ message: 'Utilisateur non trouvé' }), { status: 404 });
            }
        } else if (error instanceof Prisma.PrismaClientValidationError) {
            logger.error("Erreur de validation Prisma:", error.message);
            return new NextResponse(JSON.stringify({ message: 'Données invalides fournies.', details: error.message }), { status: 400 });
        }
        // Autres erreurs
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
}

// --- Fonction DELETE (Supprimer un utilisateur par ID) ---
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    // Vérification des droits (seuls admins peuvent supprimer)
    // if (!hasRequiredRole([Role.ADMIN_TOTAL])) {
    //     return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    // }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
        return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    try {
        await prisma.user.update({
            where: { id },
            data: { actif: false, dateSortie: new Date() },
        });
        return NextResponse.json({ message: 'Utilisateur désactivé avec succès' }, { status: 200 });
    } catch (error: any) {
        logger.error(`Erreur DELETE /api/utilisateurs/${id}:`, error);
        if (error.code === 'P2025') { // Record to delete does not exist
            return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Erreur lors de la suppression de l\'utilisateur', details: error.message }, { status: 500 });
    }
}

// --- Fonction POST pour le reset de mot de passe par Admin ---
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const targetUserId = parseInt(resolvedParams.id, 10);

    if (!(await hasRequiredRole([Role.ADMIN_TOTAL, Role.ADMIN_PARTIEL]))) {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }

    if (isNaN(targetUserId)) { return new NextResponse(JSON.stringify({ message: 'ID utilisateur invalide' }), { status: 400 }); }

    try {
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { login: true }
        });

        if (!targetUser) {
            return new NextResponse(JSON.stringify({ message: 'Utilisateur cible non trouvé' }), { status: 404 });
        }

        const newPassword = targetUser.login;
        const saltRounds = 10;
        const bcrypt = await import('bcrypt');
        const hashedPassword = await bcrypt.default.hash(newPassword, saltRounds);

        await prisma.user.update({
            where: { id: targetUserId },
            data: { password: hashedPassword },
        });

        return new NextResponse(JSON.stringify({ message: `Mot de passe réinitialisé à '${newPassword}'` }), { status: 200 });

    } catch (error: any) {
        logger.error(`Erreur POST reset-password /api/utilisateurs/${targetUserId}:`, error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur lors de la réinitialisation' }), { status: 500 });
    }
}

// TODO: Ajouter GET (pour récupérer un seul utilisateur) 