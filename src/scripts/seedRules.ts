import { connectToDatabase } from '@/lib/mongodb';
import { defaultRules } from '@/modules/rules/seeds/defaultRules';

/**
 * Script pour initialiser les règles par défaut dans la base de données
 */
export async function seedRules() {
    try {
        console.log('Démarrage de l\'initialisation des règles...');

        // Connexion à la base de données
        const { db } = await connectToDatabase();
        const rulesCollection = db.collection('rules');

        // Vérifier si des règles existent déjà
        const existingRules = await rulesCollection.countDocuments();

        if (existingRules > 0) {
            console.log(`${existingRules} règles existent déjà dans la base de données.`);
            console.log('Vérification des règles manquantes...');

            // Récupérer toutes les règles existantes
            const existingRulesData = await rulesCollection.find().toArray();
            const existingRuleNames = existingRulesData.map(rule => rule.name);

            // Filtrer les règles à ajouter (celles qui n'existent pas encore)
            const rulesToAdd = defaultRules.filter(
                rule => !existingRuleNames.includes(rule.name)
            );

            if (rulesToAdd.length > 0) {
                await rulesCollection.insertMany(rulesToAdd);
                console.log(`${rulesToAdd.length} nouvelles règles ont été ajoutées.`);
            } else {
                console.log('Aucune nouvelle règle à ajouter.');
            }
        } else {
            // Aucune règle n'existe, ajouter toutes les règles par défaut
            await rulesCollection.insertMany(defaultRules);
            console.log(`${defaultRules.length} règles par défaut ont été ajoutées.`);
        }

        console.log('Initialisation des règles terminée avec succès!');
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'initialisation des règles:', error);
        throw error;
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    seedRules()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Erreur lors du seed des règles:', error);
            process.exit(1);
        });
} 