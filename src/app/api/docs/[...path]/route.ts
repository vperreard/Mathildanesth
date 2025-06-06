import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: filePath } = await params;

    if (!filePath || !Array.isArray(filePath)) {
      return NextResponse.json({ error: 'Chemin du fichier non valide' }, { status: 400 });
    }

    // Construction du chemin complet vers le fichier dans le dossier src/docs
    const fullPath = path.join(process.cwd(), 'src', 'docs', ...filePath);

    // Vérification que le fichier existe
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }

    // Lecture du fichier
    const fileContent = fs.readFileSync(fullPath, 'utf8');

    // Retour du contenu avec le bon type MIME
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600', // Cache pendant 1 heure
      },
    });
  } catch (error: unknown) {
    logger.error('Erreur lors de la lecture du fichier de documentation:', { error: error });
    return NextResponse.json({ error: 'Erreur lors de la lecture du fichier' }, { status: 500 });
  }
}
