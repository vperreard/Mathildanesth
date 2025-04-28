import { connectToDatabase } from '@/lib/mongodb';
import { defaultRules } from '@/modules/rules/seeds/defaultRules';

/**
 * Script pour initialiser les règles par défaut dans la base de données
 */
async function seedRules() {
    try {
        console.log('Démarrage de l\'initialisation des règles...');

        // Connexion à la base de données
        const { db } = await connectToDatabase();
        const rulesCollection = db.collection('rules');

        // Vérifier si des règles existent déjà
        const existingRules = await rulesCollection.countDocuments();

        if (existingRules > 0) {
            console.log(`${existingRules} règles existent déjà dans la base de données.`);
            console.log('Voulez-vous uniquement ajouter les règles par défaut manquantes? (y/n)');

            // Dans un script réel, vous utiliseriez une entrée utilisateur
            // Pour cet exemple, nous supposons que la réponse est "y"
            const onlyAddMissing = true;

            if (onlyAddMissing) {
                // Ajouter uniquement les règles par défaut qui n'existent pas déjà
                for (const rule of defaultRules) {
                    const existingRule = await rulesCollection.findOne({ name: rule.name, type: rule.type });

                    if (!existingRule) {
                        await rulesCollection.insertOne(rule);
                        console.log(`Règle ajoutée: ${rule.name}`);
                    } else {
                        console.log(`Règle ignorée (existe déjà): ${rule.name}`);
                    }
                }
            } else {
                console.log('Opération annulée.');
            }
        } else {
            // Aucune règle n'existe, ajouter toutes les règles par défaut
            await rulesCollection.insertMany(defaultRules);
            console.log(`${defaultRules.length} règles par défaut ont été ajoutées.`);
        }

        console.log('Initialisation des règles terminée avec succès!');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation des règles:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

// Exécuter le script
seedRules(); 