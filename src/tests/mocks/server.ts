import { setupServer } from 'msw/node';
// import { handlers } from './handlers'; // Mauvais chemin
import { handlers } from '../../mocks/handlers'; // Chemin corrigé vers les handlers centralisés

// Configurer le serveur de mock avec les handlers par défaut
export const server = setupServer(...handlers); 