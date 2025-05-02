import axios from 'axios';
import { CONFIG } from '@/config';

/**
 * Structure représentant un jour férié
 */
export interface PublicHoliday {
    date: Date;
    name: string;
    isWorkingDay: boolean;
}

/**
 * Récupère les jours fériés pour une période donnée
 * @param startYear Année de début (incluse)
 * @param endYear Année de fin (incluse)
 * @returns Liste des jours fériés
 */
export async function getPublicHolidays(startYear: number, endYear: number): Promise<Date[]> {
    try {
        // URL de l'API française des jours fériés (exemple)
        const response = await axios.get(`${CONFIG.API_BASE_URL}/api/holidays?startYear=${startYear}&endYear=${endYear}`);

        // Convertir les dates en objets Date
        return response.data.map((holiday: any) => new Date(holiday.date));
    } catch (error) {
        console.error('Erreur lors de la récupération des jours fériés:', error);

        // En cas d'erreur, retourner une liste vide pour ne pas bloquer les fonctionnalités
        return [];
    }
}

/**
 * Vérifie si une date est un jour férié
 * @param date Date à vérifier
 * @param holidays Liste des jours fériés
 * @returns true si la date est un jour férié
 */
export function isPublicHoliday(date: Date, holidays: Date[]): boolean {
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);

    return holidays.some(holiday => {
        const holidayDate = new Date(holiday);
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate.getTime() === dateToCheck.getTime();
    });
}

/**
 * Récupère la liste des jours fériés français pour une année donnée
 * Implémentation locale pour fonctionner en mode hors-ligne ou pour les tests
 * @param year Année pour laquelle récupérer les jours fériés
 * @returns Liste des jours fériés
 */
export function getFrenchPublicHolidays(year: number): Date[] {
    const holidays: Date[] = [];

    // Jours fériés fixes
    holidays.push(new Date(year, 0, 1));   // Jour de l'an (1er janvier)
    holidays.push(new Date(year, 4, 1));   // Fête du travail (1er mai)
    holidays.push(new Date(year, 4, 8));   // Victoire 1945 (8 mai)
    holidays.push(new Date(year, 6, 14));  // Fête nationale (14 juillet)
    holidays.push(new Date(year, 7, 15));  // Assomption (15 août)
    holidays.push(new Date(year, 10, 1));  // Toussaint (1er novembre)
    holidays.push(new Date(year, 10, 11)); // Armistice (11 novembre)
    holidays.push(new Date(year, 11, 25)); // Noël (25 décembre)

    // Jours fériés variables (nécessitent un calcul)
    // Pour les implémenter correctement, il faudrait ajouter le calcul de Pâques
    // puis calculer les autres jours fériés en fonction (lundi de Pâques, Ascension, etc.)

    return holidays;
} 