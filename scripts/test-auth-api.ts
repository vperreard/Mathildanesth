import fetch from 'node-fetch';

async function testLogin() {
  console.log('🔍 Test de connexion à l\'API...\n');

  const credentials = {
    login: 'test.user',
    password: 'Test123!'
  };

  try {
    console.log('📤 Envoi de la requête de connexion...');
    console.log('URL: http://localhost:3000/api/auth/login');
    console.log('Credentials:', { login: credentials.login, password: '***' });

    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    console.log('\n📥 Réponse reçue:');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers.raw());
    console.log('Body:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Connexion réussie !');
      console.log('Redirection vers:', data.redirectUrl || '/');
      
      // Vérifier les cookies
      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        console.log('\n🍪 Cookies définis:');
        console.log(cookies);
      }
    } else {
      console.log('\n❌ Échec de la connexion');
      console.log('Erreur:', data.error || data.message);
    }

  } catch (error) {
    console.error('\n❌ Erreur réseau:', error);
  }
}

// Test avec des identifiants incorrects
async function testInvalidLogin() {
  console.log('\n\n🔍 Test avec des identifiants incorrects...\n');

  const credentials = {
    login: 'test.user',
    password: 'wrongpassword'
  };

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Rejet correct des identifiants invalides');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter les tests
async function runTests() {
  await testLogin();
  await testInvalidLogin();
}

runTests();