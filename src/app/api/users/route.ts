import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client'; // Importer l'enum Role de Prisma

// GET /api/users - Récupérer les utilisateurs, potentiellement filtrés par rôle
export async function GET(request: NextRequest) {
    try {
        // Vérifier la session utilisateur
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
        // TODO: Ajouter une vérification de rôle si nécessaire (ex: seul un admin peut lister tous les users)

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
                { nom: 'asc' },  // Correction: utiliser nom
                { prenom: 'asc' } // Correction: utiliser prenom
            ],
            select: { // Sélectionner les champs nécessaires pour l'interface Personnel
                id: true,
                nom: true,    // Correction: utiliser nom
                prenom: true, // Correction: utiliser prenom
                email: true,
                role: true,
                // Ajouter d'autres champs si nécessaire
                // specialties: true, // Si les spécialités sont sur le User et non Surgeon
            }
        });

        // Mapper le résultat Prisma vers l'interface Personnel attendue par le frontend
        const personnelList = users.map(user => ({
            id: user.id.toString(), // Assurer que l'ID est une chaîne si nécessaire
            nom: user.nom || '',    // Correction: utiliser nom
            prenom: user.prenom || '', // Correction: utiliser prenom
            email: user.email,
            role: user.role,
            // specialties: user.specialties ? user.specialties.map(s => ({ id: s.id, name: s.name })) : [],
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