#!/bin/bash

# Script pour pusher avec un token GitHub depuis une variable d'environnement

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ Erreur: GITHUB_TOKEN n'est pas défini"
  echo ""
  echo "Utilisation:"
  echo "  export GITHUB_TOKEN=votre_token_github"
  echo "  ./github-push-with-env.sh"
  exit 1
fi

if [ -z "$GITHUB_USERNAME" ]; then
  echo "❌ Erreur: GITHUB_USERNAME n'est pas défini"
  echo ""
  echo "Utilisation:"
  echo "  export GITHUB_USERNAME=votre_username"
  echo "  export GITHUB_TOKEN=votre_token_github"
  echo "  ./github-push-with-env.sh"
  exit 1
fi

echo "🔧 Configuration de Git avec les credentials..."
git remote set-url origin https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/vperreard/Mathildanesth.git

echo "📤 Push de la branche feat/api-affectations-trames..."
git push origin feat/api-affectations-trames

if [ $? -eq 0 ]; then
  echo "✅ Push réussi!"
else
  echo "❌ Échec du push"
fi