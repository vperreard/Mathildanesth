import { MongoClient, Db } from 'mongodb';

let cachedDb: Db | null = null;
let cachedClient: MongoClient | null = null;

// Utiliser une valeur par défaut si la variable d'environnement n'est pas définie
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'mathildanesth';

export async function connectToDatabase() {
    // Si la base de données est déjà connectée, la renvoyer
    if (cachedDb && cachedClient) {
        return { db: cachedDb, client: cachedClient };
    }

    try {
        // Connecter à la base de données
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db(MONGODB_DB);

        // Mettre en cache la connexion pour les requêtes futures
        cachedDb = db;
        cachedClient = client;

        return { db, client };
    } catch (error) {
        console.error('Erreur de connexion à MongoDB:', error);
        throw error;
    }
}

// Fonction pour fermer la connexion à la base de données
export async function closeDatabase() {
    if (cachedClient) {
        await cachedClient.close();
        cachedClient = null;
    }

    if (cachedDb) {
        cachedDb = null;
    }
} 