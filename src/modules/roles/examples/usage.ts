import { ProfessionalRoleConfigService } from '../services/professional-role-config.service';
import { logger } from "../../../lib/logger";
import { DisplayPreferences } from '../types/professional-role-config';

async function example() {
    const service = new ProfessionalRoleConfigService();

    // Définir les préférences d'affichage pour le rôle MAR
    const marPreferences: DisplayPreferences = {
        color: '#2196F3',
        icon: 'doctor',
        order: 1,
        visibility: {
            calendar: true,
            dashboard: true,
            planning: true
        }
    };
    await service.updateDisplayPreferences('MAR', marPreferences);

    // Définir les préférences d'affichage pour le rôle IADE
    const iadePreferences: DisplayPreferences = {
        color: '#4CAF50',
        icon: 'nurse',
        order: 2,
        visibility: {
            calendar: true,
            dashboard: true,
            planning: true
        }
    };
    await service.updateDisplayPreferences('IADE', iadePreferences);

    // Récupérer les préférences d'un rôle spécifique
    const marConfig = await service.getDisplayPreferences('MAR');
    logger.info('Préférences MAR:', marConfig);

    // Récupérer tous les rôles avec leurs préférences
    const allRoles = await service.getAllRolesWithPreferences();
    logger.info('Tous les rôles:', allRoles);
} 