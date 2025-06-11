#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3002/api/users?limit=100&isActive=true';

async function testUsersAPI() {
    console.log('🔍 Test de l\'API /api/users');
    console.log('URL:', API_URL);
    
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        console.log('\n📊 Réponse:');
        console.log('- Status:', response.status);
        console.log('- Success:', data.success);
        console.log('- Nombre d\'utilisateurs:', data.data?.length || 0);
        
        if (data.data && data.data.length > 0) {
            console.log('\n👥 Premier utilisateur:');
            const firstUser = data.data[0];
            console.log('- ID:', firstUser.id);
            console.log('- Nom:', firstUser.nom);
            console.log('- Prénom:', firstUser.prenom);
            console.log('- Email:', firstUser.email);
            console.log('- Role:', firstUser.role);
            console.log('- Professional Role:', firstUser.professionalRole);
            console.log('- Actif:', firstUser.actif);
            
            console.log('\n🔍 Tous les rôles professionnels trouvés:');
            const roles = [...new Set(data.data.map(u => u.professionalRole))];
            roles.forEach(role => {
                const count = data.data.filter(u => u.professionalRole === role).length;
                console.log(`- ${role}: ${count} utilisateur(s)`);
            });
        } else {
            console.log('\n⚠️ Aucun utilisateur trouvé dans la réponse');
            console.log('Réponse complète:', JSON.stringify(data, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

testUsersAPI();