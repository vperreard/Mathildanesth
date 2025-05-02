import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Configurer le serveur de mock avec les handlers par défaut
export const server = setupServer(...handlers); 