/**
 * Types communs partagés dans toute l'application
 */

/**
 * Types de affectations/astreintes possibles (définition unifiée)
 * 
 * Cette énumération remplace les définitions précédemment dupliquées dans:
 * - src/types/attribution.ts
 * - src/types/shift.ts
 */
export enum ShiftType {
    // Consultations/Vacations (demi-journées)
    MATIN = 'MATIN',                    // Vacation 8h-13h
    APRES_MIDI = 'APRES_MIDI',          // Vacation 13h30-18h30

    // Gardes (journées complètes)
    JOUR = 'JOUR',                      // Garde de jour (période standard)
    NUIT = 'NUIT',                      // Garde de nuit
    GARDE_24H = 'GARDE_24H',            // Garde 8h-8h+1 (24h continues)
    GARDE_WEEKEND = 'GARDE_WEEKEND',    // Garde spécifique au weekend

    // Astreintes
    ASTREINTE = 'ASTREINTE',            // Astreinte générique
    ASTREINTE_SEMAINE = 'ASTREINTE_SEMAINE', // Astreinte en semaine
    ASTREINTE_WEEKEND = 'ASTREINTE_WEEKEND', // Astreinte le weekend

    // Spécifiques
    URGENCE = 'URGENCE',                // Garde d'urgence
    CONSULTATION = 'CONSULTATION',      // Consultation spéciale
}

/**
 * Mapping des types de shift vers leur durée en heures (approximative)
 * Utile pour les calculs de fatigue et de disponibilité
 */
export const SHIFT_DURATION: Record<ShiftType, number> = {
    [ShiftType.MATIN]: 5,               // 8h-13h
    [ShiftType.APRES_MIDI]: 5,          // 13h30-18h30
    [ShiftType.JOUR]: 12,               // Journée standard
    [ShiftType.NUIT]: 12,               // Nuit standard
    [ShiftType.GARDE_24H]: 24,          // 24h continues
    [ShiftType.GARDE_WEEKEND]: 24,      // 24h continues le weekend
    [ShiftType.ASTREINTE]: 24,          // 24h d'astreinte
    [ShiftType.ASTREINTE_SEMAINE]: 24,  // 24h d'astreinte en semaine
    [ShiftType.ASTREINTE_WEEKEND]: 24,  // 24h d'astreinte le weekend
    [ShiftType.URGENCE]: 12,            // Service d'urgence
    [ShiftType.CONSULTATION]: 4,        // Consultation spéciale
} 