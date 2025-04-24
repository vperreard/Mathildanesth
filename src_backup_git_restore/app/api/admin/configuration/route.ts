import { NextResponse } from 'next/server';

// Stockage simulé de la configuration globale
let configStore = {
    defaultLeaveDuration: 10,
    maxOverlaps: 2,
    notificationEmail: 'admin@example.com'
};

// Gestion de la méthode GET
export async function GET() {
    return NextResponse.json(configStore);
}

// Gestion de la méthode PUT
export async function PUT(request: Request) {
    try {
        const updatedConfig = await request.json();
        configStore = {
            ...configStore,
            ...updatedConfig
        };
        return NextResponse.json({ message: 'Configuration mise à jour avec succès' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}
