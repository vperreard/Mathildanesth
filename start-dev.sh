#!/bin/bash

# Définir les variables d'environnement nécessaires
export JWT_SECRET="un_secret_jwt_robuste_et_difficile_a_deviner_pour_la_securite_de_l_application_mathildanesth_2024"
export NODE_ENV="development"
export NEXT_TELEMETRY_DISABLED=1

echo "Variables d'environnement définies:"
echo "JWT_SECRET: ${JWT_SECRET:0:20}..."
echo "NODE_ENV: $NODE_ENV"

# Lancer le serveur de développement
npm run dev 