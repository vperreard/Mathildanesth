#!/bin/bash

echo "Configuration de l'authentification GitHub"
echo "========================================="
echo ""
echo "Choisissez une méthode :"
echo "1) Personal Access Token (PAT)"
echo "2) GitHub CLI avec token"
echo ""
read -p "Votre choix (1 ou 2): " choice

case $choice in
  1)
    echo ""
    echo "Entrez votre nom d'utilisateur GitHub:"
    read username
    echo ""
    echo "Entrez votre Personal Access Token:"
    read -s token
    echo ""
    
    # Configure git avec le token
    git config --global user.name "$username"
    git remote set-url origin https://${username}:${token}@github.com/vperreard/Mathildanesth.git
    
    echo "✅ Configuration terminée!"
    echo "Essayons de pusher..."
    git push origin feat/api-affectations-trames
    ;;
    
  2)
    echo ""
    echo "Entrez votre Personal Access Token GitHub:"
    read -s token
    echo ""
    
    # Login avec gh
    echo $token | gh auth login --with-token
    
    if [ $? -eq 0 ]; then
      echo "✅ Authentification réussie!"
      echo "Push en cours..."
      git push origin feat/api-affectations-trames
    else
      echo "❌ Échec de l'authentification"
    fi
    ;;
    
  *)
    echo "Choix invalide"
    exit 1
    ;;
esac