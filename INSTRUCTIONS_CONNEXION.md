# 📝 Instructions de Connexion - Mathildanesth

## 🔐 Comptes de Test Disponibles

### Utilisateur Standard
- **Login** : `test.user`
- **Mot de passe** : `Test123!`
- **Rôle** : USER

### Administrateur (si existant)
- **Login** : `admin`
- **Mot de passe** : `admin123`
- **Rôle** : ADMIN_TOTAL

## 🚀 Comment se connecter

### Option 1 : Via l'interface web

1. **Ouvrez votre navigateur** et allez à : http://localhost:3000/auth/connexion

2. **Entrez les identifiants** :
   - Identifiant : `test.user`
   - Mot de passe : `Test123!`

3. **Cliquez sur "Se connecter"**

### Option 2 : Via le fichier de test HTML

1. **Ouvrez le fichier** `test-login.html` dans votre navigateur
   - Il se trouve à la racine du projet : `/Users/vincentperreard/Mathildanesth/test-login.html`

2. **Les identifiants sont pré-remplis**, cliquez simplement sur "Se connecter"

3. **Suivez le lien** pour accéder à l'application après connexion réussie

## 🐛 Résolution des Problèmes

### Erreur "Hydration failed"
- **Cause** : Incohérence entre le rendu serveur et client
- **Solution temporaire** : Rafraîchir la page après connexion

### Erreur 401 Unauthorized
- **Cause** : Token manquant ou expiré
- **Solution** : Vider le cache du navigateur et réessayer

### Le service worker cause des problèmes
- **Solution** : Ouvrir les DevTools > Application > Service Workers > Unregister

### Ressources manquantes (fonts, icons)
- **Impact** : Visuel seulement, n'empêche pas la connexion
- **Solution** : Ignorer ces erreurs pour le moment

## ✅ Vérification de la Connexion

Une fois connecté, vous devriez :
1. Être redirigé vers la page d'accueil
2. Voir votre nom dans le header
3. Avoir accès au menu utilisateur

## 🔧 Test de l'API directement

Si l'interface ne fonctionne pas, testez l'API :

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login": "test.user", "password": "Test123!"}'
```

Réponse attendue :
```json
{
  "user": {
    "id": 30,
    "login": "test.user",
    "email": "test@mathildanesth.fr",
    "nom": "User",
    "prenom": "Test",
    "role": "USER"
  },
  "token": "eyJ..."
}
```

## 📱 Note Importante

Le token JWT est stocké dans un cookie HTTPOnly pour la sécurité. Il expire après 24 heures.