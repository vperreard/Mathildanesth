import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client'; // Importer l'enum Role de Prisma
import { checkUserRole, getAuthTokenServer } from '@/lib/auth-server-utils';
import type { UserRole as AuthUserRole } from '@/lib/auth-client-utils'; // Renommer pour éviter conflit

// GET /api/users - Récupérer les utilisateurs, potentiellement filtrés par rôle
export async function GET(request: NextRequest) {
    try {
        const token = await getAuthTokenServer();
        if (!token) {
            return NextResponse.json({ error: 'Token non fourni' }, { status: 401 });
        }

        // Pour l'instant, on vérifie juste si l'utilisateur est authentifié.
        // On pourrait affiner avec des rôles spécifiques si nécessaire.
        // Par exemple: ['ADMIN_TOTAL', 'ADMIN_PARTIEL'] pour lister tous les utilisateurs.
        // Ou vérifier si l'utilisateur demande ses propres informations.
        const { hasRequiredRole, user, error: authError } = await checkUserRole([
            'ADMIN_TOTAL', 'ADMIN_PARTIEL', 'USER', 'SUPER_ADMIN', 'CHIRURGIEN', 'ANESTHESISTE', 'IADE', 'IBODE', 'AS_BLOC', 'SECRETARY', 'SERVICE_CHIEF' // TODO: Ajuster les rôles autorisés
        ] as AuthUserRole[], token);

        if (!hasRequiredRole || !user) {
            return NextResponse.json({ error: authError || 'Non autorisé' }, { status: 401 });
        }

        // Récupérer le paramètre de requête 'role'
        const { searchParams } = new URL(request.url);
        const roleParam = searchParams.get('role')?.toUpperCase();

        // Construire la clause `where` pour Prisma
        let whereClause = {};
        if (roleParam && Object.values(Role).includes(roleParam as Role)) {
            // Assurer que roleParam est une valeur valide de l'enum Role
            whereClause = {
                role: roleParam as Role,
            };
        }
        // Optionnel: Ajouter d'autres filtres ici (ex: statut actif)
        // whereClause = { ...whereClause, status: 'ACTIVE' };

        const users = await prisma.user.findMany({
            where: whereClause,
            orderBy: [
                { nom: 'asc' },
                { prenom: 'asc' }
            ],
            select: { // Sélectionner les champs nécessaires pour l'interface Personnel
                id: true,
                nom: true,
                prenom: true,
                email: true,
                role: true,
            }
        });

        const personnelList = users.map(u => ({
            id: u.id.toString(),
            nom: u.nom || '',
            prenom: u.prenom || '',
            email: u.email,
            role: u.role,
        }));

        return NextResponse.json(personnelList);

    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la récupération des utilisateurs' },
            { status: 500 }
        );
    }
} 