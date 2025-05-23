describe('Déboguer authentification', () => {
    it('Vérifie la structure de la page de connexion', () => {
        // Visiter la page avec un timeout augmenté
        cy.visit('/', { timeout: 60000, failOnStatusCode: false });

        // Prendre une capture d'écran de la page
        cy.screenshot('debug/login-page');

        // Lister tous les éléments de la page
        cy.document().then((doc) => {
            // Afficher le HTML de la page pour comprendre sa structure
            cy.log('STRUCTURE DE LA PAGE');
            cy.log(doc.body.innerHTML.substring(0, 1000)); // Afficher les 1000 premiers caractères

            // Chercher tous les champs de type email et password
            cy.log('CHAMPS DE FORMULAIRE');
            const inputFields = Array.from(doc.querySelectorAll('input'));
            inputFields.forEach(field => {
                cy.log(`Type: ${field.type}, ID: ${field.id}, Name: ${field.name}, Data-test: ${field.getAttribute('data-test')}`);
            });

            // Chercher tous les boutons
            cy.log('BOUTONS');
            const buttons = Array.from(doc.querySelectorAll('button'));
            buttons.forEach(button => {
                cy.log(`Text: ${button.textContent}, Type: ${button.type}, ID: ${button.id}, Data-test: ${button.getAttribute('data-test')}`);
            });
        });
    });
}); 