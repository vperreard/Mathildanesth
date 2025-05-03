// Test automatique de création et modification de salle d'opération avec le secteur Endoscopie
// Version CommonJS pour une compatibilité maximale
const axios = require('axios');

// Configuration de base
const API_BASE_URL = 'http://localhost:3000';

async function run() {
    try {
        console.log('=== Test automatique pour le secteur Endoscopie (CJS) ===');
        console.log(`URL de base: ${API_BASE_URL}`);

        // 1. Récupérer les secteurs
        console.log('1. Récupération des secteurs...');
        const sectorsRes = await axios.get(`${API_BASE_URL}/api/operating-sectors`, {
            headers: { 'x-user-role': 'ADMIN_TOTAL' }
        });
        console.log(`✅ ${sectorsRes.data.length} secteurs récupérés`);

        // Rechercher le secteur Endoscopie
        const endoscopieSector = sectorsRes.data.find(s =>
            s.name.toLowerCase().includes('endoscopie') ||
            s.name.toLowerCase().includes('endo')
        );

        if (!endoscopieSector) {
            console.error('❌ Secteur Endoscopie non trouvé!');
            console.log('Secteurs disponibles:', JSON.stringify(sectorsRes.data, null, 2));
            return;
        }

        console.log(`Secteur Endoscopie trouvé: ID=${endoscopieSector.id}, Nom=${endoscopieSector.name}`);

        // 2. Créer une salle avec le secteur Endoscopie
        console.log('2. Création d\'une salle de test dans le secteur Endoscopie...');
        const testRoom = {
            name: 'Salle Test Endoscopie',
            number: `E-${Date.now().toString().substring(8)}`,
            sector: endoscopieSector.name,
            sectorId: endoscopieSector.id,
            colorCode: '#00FF00',
            isActive: true,
            supervisionRules: {}
        };

        console.log("Données de test pour création:", JSON.stringify(testRoom, null, 2));

        const createRes = await axios.post(`${API_BASE_URL}/api/operating-rooms`, testRoom, {
            headers: {
                'x-user-role': 'ADMIN_TOTAL',
                'Content-Type': 'application/json'
            }
        });

        const createdRoomId = createRes.data.id;
        console.log(`✅ Salle créée avec ID ${createdRoomId}`);
        console.log("Réponse complète:", JSON.stringify(createRes.data, null, 2));

        // 3. Modifier la salle
        console.log('3. Modification de la salle...');
        const updateRes = await axios.put(`${API_BASE_URL}/api/operating-rooms/${createdRoomId}`, {
            ...testRoom,
            name: 'Salle Test Endoscopie Modifiée',
            colorCode: '#0000FF'
        }, {
            headers: {
                'x-user-role': 'ADMIN_TOTAL',
                'Content-Type': 'application/json'
            }
        });
        console.log(`✅ Salle modifiée`);
        console.log("Réponse complète:", JSON.stringify(updateRes.data, null, 2));

        // 4. Supprimer la salle
        console.log('4. Suppression de la salle...');
        await axios.delete(`${API_BASE_URL}/api/operating-rooms/${createdRoomId}`, {
            headers: { 'x-user-role': 'ADMIN_TOTAL' }
        });
        console.log(`✅ Salle supprimée`);

        console.log('=== TOUS LES TESTS ONT RÉUSSI ===');
    } catch (error) {
        console.error('❌ TEST ÉCHOUÉ:', error.message);
        if (error.response) {
            console.error('Détails:', error.response.data);
            console.error('Status:', error.response.status);
        }
        if (error.request) {
            console.error('Requête sans réponse. Serveur démarré?');
        }
    }
}

run(); 