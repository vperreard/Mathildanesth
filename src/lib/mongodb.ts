import { MongoClient, Db } from 'mongodb';

let cachedDb: Db | null = null;
let cachedClient: MongoClient | null = null;

if (!process.env.MONGODB_URI) {
    throw new Error('Veuillez définir la variable d\'environnement MONGODB_URI');
}

export async function connectToDatabase() {
    // Si la base de données est déjà connectée, la renvoyer
    if (cachedDb && cachedClient) {
        return { db: cachedDb, client: cachedClient };
    }

    // Connecter à la base de données
    const client = new MongoClient(process.env.MONGODB_URI as string);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'mathildanesth');

    // Mettre en cache la connexion pour les requêtes futures
    cachedDb = db;
    cachedClient = client;

    return { db, client };
} 