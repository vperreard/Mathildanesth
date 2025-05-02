// ***********************************************************
// Support pour les tests de composants
// ***********************************************************

// Import des commandes personnalisées
import './commands';
import '@cypress/code-coverage/support';
import '@testing-library/cypress/add-commands';

// Import du supporteur de montage de composants React
import { mount } from 'cypress/react';

// Déclarer globalement la commande mount
declare global {
    namespace Cypress {
        interface Chainable {
            mount: typeof mount;
        }
    }
}

// Ajouter la commande mount à Cypress
Cypress.Commands.add('mount', mount);

// Ici, vous pouvez ajouter d'autres configurations spécifiques aux tests de composants
// comme les fournisseurs de contexte, les mocks, etc. 