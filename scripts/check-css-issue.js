#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function checkCSSIssue() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Intercepter les requêtes réseau
  await page.setRequestInterception(true);
  
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('.css')) {
      console.log('CSS Request:', url);
      console.log('Resource Type:', request.resourceType());
    }
    request.continue();
  });
  
  // Intercepter les réponses
  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('.css')) {
      console.log('CSS Response:', url);
      console.log('Status:', response.status());
      console.log('Headers:', response.headers());
    }
  });
  
  await page.goto('http://localhost:3000');
  
  // Attendre un peu et examiner le DOM
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Vérifier les éléments link et script
  const cssInfo = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const scripts = Array.from(document.querySelectorAll('script'));
    
    return {
      cssLinks: links.map(link => ({
        href: link.href,
        rel: link.rel,
        type: link.type
      })),
      scriptSrcs: scripts.filter(s => s.src && s.src.includes('.css')).map(script => ({
        src: script.src,
        type: script.type
      }))
    };
  });
  
  console.log('\n=== CSS Links ===');
  console.log(JSON.stringify(cssInfo.cssLinks, null, 2));
  
  console.log('\n=== Scripts loading CSS ===');
  console.log(JSON.stringify(cssInfo.scriptSrcs, null, 2));
  
  await browser.close();
}

checkCSSIssue().catch(console.error);