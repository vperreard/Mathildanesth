import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Import nommé
import bcrypt from 'bcrypt';
import { checkUserRole } from '@/lib/auth-server-utils'; // Corrigé
import type { UserRole } from '@/lib/auth-client-utils'; // Corrigé
import { headers } from 'next/headers';
import { Role as PrismaRole, ProfessionalRole, Prisma } from '@prisma/client';
// Importer les types d'erreurs spécifiques
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

// Définir les enums localement pour éviter les problèmes d'import
enum Role {
    ADMIN_TOTAL = 'ADMIN_TOTAL',
    ADMIN_PARTIEL = 'ADMIN_PARTIEL',
    USER = 'USER'
}

// const prisma = new PrismaClient(); // Supprimé

// --- Fonction GET ---
export async function GET(request: Request) {
    // let prismaInstance: PrismaClient | null = null; // Supprimé
    try {
        // Lire le paramètre includeInactive de l'URL
        const { searchParams } = new URL(request.url);
        const includeInactive = searchParams.get('includeInactive') === 'true';

        // Définir la clause where en fonction du paramètre
        let whereClause: Prisma.UserWhereInput = {};
        if (!includeInactive) {
            whereClause.actif = true; // Filtrer par actif: true si includeInactive est false
        }

        // prismaInstance = new PrismaClient(); // Supprimé
        const users = await prisma.user.findMany({ // Utilise l'instance importée
            where: whereClause, // Appliquer la clause where
            orderBy: [
                { nom: 'asc' },
                { prenom: 'asc' },
            ],
            // Exclure le champ password des résultats par défaut
            select: {
                id: true,
                nom: true,
                prenom: true,
                login: true,
                email: true,
                role: true,
                professionalRole: true,
                tempsPartiel: true,
                pourcentageTempsPartiel: true,
                dateEntree: true,
                dateSortie: true,
                actif: true,
                createdAt: true,
                updatedAt: true,
            }
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error("Erreur GET /api/utilisateurs:", error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    } finally {
        // if (prismaInstance) await prismaInstance.$disconnect(); // Supprimé
    }
}

// --- Fonction POST ---
export async function POST(request: Request) {
    console.log("Requête POST /api/utilisateurs reçue"); // Log requête reçue

    const authCheck = await checkUserRole(['ADMIN_TOTAL', 'ADMIN_PARTIEL'] as UserRole[]);

    if (!authCheck.hasRequiredRole) {
        console.log("Vérification d'autorisation échouée:", authCheck.error);
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé', error: authCheck.error }), { status: 403 });
    }
    if (authCheck.user) {
        console.log(`Vérification d'autorisation réussie pour utilisateur ID: ${authCheck.user.id}, Role: ${authCheck.user.role}`);
    } else {
        // Gérer le cas où user est undefined même si hasRequiredRole est true (ne devrait pas arriver mais pour TypeScript)
        console.warn("Autorisation réussie mais objet utilisateur manquant dans authCheck.");
        return new NextResponse(JSON.stringify({ message: "Erreur interne lors de la vérification d'autorisation" }), { status: 500 });
    }

    try {
        const body = await request.json();
        // Récupérer les champs, en remplaçant joursTravailles par les nouveaux champs
        const {
            nom, prenom, email, role, professionalRole,
            tempsPartiel, pourcentageTempsPartiel,
            joursTravaillesSemainePaire,
            joursTravaillesSemaineImpaire,
            dateEntree, dateSortie, actif, password, phoneNumber, alias
        } = body;

        // Validation basique
        if (!nom || !prenom || !email || !role || !professionalRole || !password) {
            return new NextResponse(JSON.stringify({ message: 'Nom, prénom, email, rôle, rôle pro et mot de passe sont obligatoires.' }), { status: 400 });
        }
        if (!Object.values(PrismaRole).includes(role) || !Object.values(ProfessionalRole).includes(professionalRole)) {
            return new NextResponse(JSON.stringify({ message: 'Rôle invalide' }), { status: 400 });
        }
        if (tempsPartiel && (pourcentageTempsPartiel === null || pourcentageTempsPartiel === undefined)) {
            return new NextResponse(JSON.stringify({ message: 'Le pourcentage est requis si temps partiel est coché.' }), { status: 400 });
        }
        // Ajouter validation pour les nouveaux champs si nécessaire (ex: vérifier que ce sont bien des tableaux de strings)

        const login = (prenom.charAt(0) + nom).toLowerCase().replace(/\s+/g, '');
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Créer l'utilisateur avec les nouveaux champs
        const newUser = await prisma.user.create({
            data: {
                nom,
                prenom,
                login,
                email,
                alias: alias || null,
                phoneNumber: phoneNumber || null,
                password: hashedPassword,
                role,
                professionalRole,
                tempsPartiel: tempsPartiel ?? false,
                pourcentageTempsPartiel: pourcentageTempsPartiel ? parseFloat(pourcentageTempsPartiel) : null,
                joursTravaillesSemainePaire: joursTravaillesSemainePaire || [],
                joursTravaillesSemaineImpaire: joursTravaillesSemaineImpaire || [],
                dateEntree: dateEntree ? new Date(dateEntree) : null,
                dateSortie: dateSortie ? new Date(dateSortie) : null,
                actif: actif !== undefined ? !!actif : true,
                mustChangePassword: true,
            },
            select: {
                id: true,
                nom: true,
                prenom: true,
                login: true,
                email: true,
                alias: true,
                phoneNumber: true,
                role: true,
                professionalRole: true,
                tempsPartiel: true,
                pourcentageTempsPartiel: true,
                joursTravaillesSemainePaire: true,
                joursTravaillesSemaineImpaire: true,
                dateEntree: true,
                dateSortie: true,
                actif: true,
                createdAt: true,
                updatedAt: true,
                mustChangePassword: true,
            }
        });

        return new NextResponse(JSON.stringify(newUser), { status: 201 });

    } catch (error: any) {
        console.error("Erreur POST /api/utilisateurs:", error);
        // Utiliser les types importés directement
        if (error instanceof PrismaClientValidationError) {
            console.error("Erreur de validation Prisma:", error.message);
            return new NextResponse(JSON.stringify({ message: 'Données invalides fournies.', details: error.message }), { status: 400 });
        }
        if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
            const target = error.meta?.target as string[] | undefined;
            let message = 'Erreur de contrainte unique.';
            if (target?.includes('email')) message = 'Cet email est déjà utilisé';
            if (target?.includes('login')) message = 'Ce login est déjà utilisé';
            return new NextResponse(JSON.stringify({ message }), { status: 409 });
        }
        // Autres erreurs
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
}

// TODO: Ajouter les fonctions PUT, DELETE 