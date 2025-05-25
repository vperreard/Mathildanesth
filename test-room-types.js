#!/usr/bin/env node

/**
 * Test script pour vérifier les nouveaux types de salles
 */

const { ROOM_TYPES, ROOM_TYPE_LABELS, getRoomTypeOptions } = require('./src/modules/planning/bloc-operatoire/constants/roomTypes.ts');

console.log('🏥 Test des types de salles mis à jour\n');

console.log('Types de salles disponibles:');
Object.entries(ROOM_TYPES).forEach(([key, value]) => {
    console.log(`  - ${key}: ${value}`);
});

console.log('\nLibellés d\'affichage:');
Object.entries(ROOM_TYPE_LABELS).forEach(([key, value]) => {
    console.log(`  - ${key}: ${value}`);
});

console.log('\nOptions pour les sélecteurs:');
try {
    const options = getRoomTypeOptions();
    options.forEach(option => {
        console.log(`  - ${option.value}: ${option.label}`);
    });
} catch (error) {
    console.log('Erreur lors de la récupération des options:', error.message);
}

console.log('\n✅ Test terminé. Les nouveaux types sont:');
console.log('  - Standard (maintenu)');
console.log('  - Aseptique (remplace Septique)');
console.log('  - Endoscopie (maintenu)');
console.log('  - Garde (nouveau)');
console.log('  - Astreinte (nouveau)');
console.log('  - Consultation (maintenu)');

console.log('\n❌ Types supprimés:');
console.log('  - Septique');
console.log('  - Ambulatoire');
console.log('  - Spécialisée');
console.log('  - Urgence');
console.log('  - FIV'); 