import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


/**
 * GET /api/conges/types
 * Récupère la liste des types de congés actifs et sélectionnables par les utilisateurs.
 * Accessible publiquement (par les utilisateurs connectés pour faire une demande).
 */
export async function GET(request: Request) {
    try {
        // Ici, on ne filtre pas par utilisateur, on renvoie tous les types configurés
        // comme actifs et sélectionnables. L'authentification (savoir QUI demande)
        // peut être gérée au niveau supérieur ou par un middleware si nécessaire,
        // mais pour lister les types disponibles, ce n'est pas forcément requis ici.

        const leaveTypeSettings = await prisma.leaveTypeSetting.findMany({
            where: {
                isActive: true,
                isUserSelectable: true, // Seulement ceux que l'utilisateur peut choisir
            },
            select: {
                // Sélectionner uniquement les champs nécessaires pour le formulaire
                id: true,
                code: true,
                label: true,
                description: true, // Peut être utile pour afficher une infobulle
                // On n'a probablement pas besoin des `rules` ici
            },
            orderBy: { label: 'asc' }, // Trier par libellé
        });

        return NextResponse.json(leaveTypeSettings);

    } catch (error) {
        console.error('Erreur API [GET /conges/types]:', error);
        return NextResponse.json({ error: 'Erreur serveur lors de la récupération des types de congés.' }, { status: 500 });
    } finally {
        // Envisager la déconnexion si prisma est instancié localement
        // await prisma.$disconnect(); 
    }
} 