#!/usr/bin/env node

const puppeteer = require('puppeteer');
require('dotenv').config({ path: '.env.local' });

async function debugLogin() {
  console.log('🔍 Debug de la page de connexion\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    slowMo: 500  // Ralentir pour voir ce qui se passe
  });
  
  const page = await browser.newPage();
  
  // Activer les logs console
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  try {
    console.log('1. Navigation vers /auth/connexion...');
    await page.goto('http://localhost:3000/auth/connexion', {
      waitUntil: 'networkidle2'
    });
    
    console.log('2. Recherche des éléments du formulaire...');
    
    // Vérifier tous les inputs
    const inputs = await page.evaluate(() => {
      const allInputs = document.querySelectorAll('input');
      return Array.from(allInputs).map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        value: input.value
      }));
    });
    
    console.log('Inputs trouvés:', JSON.stringify(inputs, null, 2));
    
    // Vérifier les boutons
    const buttons = await page.evaluate(() => {
      const allButtons = document.querySelectorAll('button');
      return Array.from(allButtons).map(button => ({
        type: button.type,
        text: button.textContent.trim(),
        className: button.className
      }));
    });
    
    console.log('\nBoutons trouvés:', JSON.stringify(buttons, null, 2));
    
    // Essayer de trouver les champs de différentes façons
    const loginField = await page.$('input[name="login"]') || 
                       await page.$('input#login') ||
                       await page.$('input[type="text"]');
                       
    const passwordField = await page.$('input[name="password"]') ||
                          await page.$('input#password') ||
                          await page.$('input[type="password"]');
    
    console.log('\n3. Champs trouvés:');
    console.log('- Login field:', !!loginField);
    console.log('- Password field:', !!passwordField);
    
    if (loginField && passwordField) {
      console.log('\n4. Tentative de connexion...');
      console.log('- Login:', process.env.TEST_USER_LOGIN || 'NON DÉFINI');
      console.log('- Password:', process.env.TEST_USER_PASSWORD ? '***' : 'NON DÉFINI');
      
      await loginField.type(process.env.TEST_USER_LOGIN || 'admin');
      await passwordField.type(process.env.TEST_USER_PASSWORD || 'password');
      
      // Chercher le bouton submit
      const submitButton = await page.$('button[type="submit"]') ||
                          await page.$('button:contains("Connexion")') ||
                          await page.$('button:contains("Se connecter")');
      
      if (submitButton) {
        console.log('\n5. Clic sur le bouton de connexion...');
        await submitButton.click();
        
        // Attendre la navigation ou une erreur
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const currentUrl = page.url();
        console.log('\n6. URL après clic:', currentUrl);
        
        // Vérifier s'il y a un message d'erreur
        const errorMessage = await page.evaluate(() => {
          const error = document.querySelector('[data-cy="error-message"]') ||
                       document.querySelector('.error') ||
                       document.querySelector('.text-red-700');
          return error ? error.textContent : null;
        });
        
        if (errorMessage) {
          console.log('❌ Message d\'erreur:', errorMessage);
        }
      } else {
        console.log('❌ Bouton de connexion non trouvé');
      }
    } else {
      console.log('❌ Champs de connexion non trouvés');
    }
    
    console.log('\n7. Analyse de la page finale...');
    const pageContent = await page.evaluate(() => document.body.innerText);
    console.log('Contenu de la page (extrait):', pageContent.substring(0, 200));
    
  } catch (error) {
    console.error('Erreur:', error.message);
  }
  
  console.log('\n✅ Debug terminé. Gardez le navigateur ouvert pour inspecter.');
  // Ne pas fermer le navigateur pour permettre l'inspection
}

debugLogin().catch(console.error);