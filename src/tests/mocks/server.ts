/* 
 * Serveur MSW désactivé temporairement pour permettre l'exécution des tests
 * Cette désactivation est une solution de contournement en attendant de résoudre
 * les problèmes d'importation de 'msw/node'
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// This configures a request mocking server with the given request handlers.
export const server = setupServer(...handlers);

// Re-exporter les fonctions d'aide si nécessaire (optionnel)
export { http } from 'msw'; 