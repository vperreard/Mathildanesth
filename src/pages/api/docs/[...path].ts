import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Récupération du chemin du fichier depuis les paramètres de la requête
        const { path: filePath } = req.query;

        if (!filePath || !Array.isArray(filePath)) {
            return res.status(400).json({ error: 'Chemin du fichier non valide' });
        }

        // Construction du chemin complet vers le fichier dans le dossier src/docs
        const fullPath = path.join(process.cwd(), 'src', 'docs', ...filePath);

        // Vérification que le fichier existe
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: 'Fichier non trouvé' });
        }

        // Lecture du fichier
        const fileContent = fs.readFileSync(fullPath, 'utf8');

        // Définition du type de contenu
        res.setHeader('Content-Type', 'text/markdown; charset=UTF-8');

        // Envoi du contenu du fichier
        res.status(200).send(fileContent);
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier de documentation:', error);
        res.status(500).json({ error: 'Erreur lors de la lecture du fichier' });
    }
} 