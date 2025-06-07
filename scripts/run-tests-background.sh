#!/bin/bash
# Script pour exécuter les tests en arrière-plan avec logs en temps réel

echo "🚀 Lancement des tests en arrière-plan..."
echo "📝 Les logs seront sauvegardés dans: /tmp/test-manual-logs.txt"
echo "👀 Suivez les logs avec: tail -f /tmp/test-manual-logs.txt"

# Nettoyer les anciens logs
rm -f /tmp/test-manual-logs.txt

# Exécuter les tests en arrière-plan avec logs
nohup node scripts/automated-manual-tester-complete.js > /tmp/test-manual-logs.txt 2>&1 &
PID=$!

echo "✅ Tests lancés avec PID: $PID"
echo "📊 Pour voir l'état: ps -p $PID"
echo "🛑 Pour arrêter: kill $PID"

# Afficher les 10 premières secondes de logs pour confirmer le démarrage
sleep 2
echo -e "\n📋 Premières lignes de log:"
head -20 /tmp/test-manual-logs.txt

echo -e "\n💡 Commandes utiles:"
echo "   tail -f /tmp/test-manual-logs.txt    # Suivre les logs"
echo "   ps -p $PID                           # Vérifier l'état"
echo "   kill $PID                            # Arrêter les tests"