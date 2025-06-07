#!/bin/bash
# Script pour maintenir Claude Code actif dans Docker

# 1. Utiliser des commandes avec timeout explicite
run_with_timeout() {
    timeout 10s "$@" || echo "Command completed or timed out"
}

# 2. Diviser les tâches longues en petites étapes
echo "🔄 Keep-alive script for Claude Code in Docker"

# 3. Utiliser des commandes non-bloquantes
start_dev_background() {
    echo "Starting dev server in background..."
    nohup npm run dev > /tmp/dev.log 2>&1 &
    echo $! > /tmp/dev.pid
    sleep 3
    echo "Dev server started with PID: $(cat /tmp/dev.pid)"
}

# 4. Fonction pour vérifier le serveur
check_dev_server() {
    if [ -f /tmp/dev.pid ]; then
        PID=$(cat /tmp/dev.pid)
        if kill -0 $PID 2>/dev/null; then
            echo "✅ Dev server running on PID $PID"
            curl -s http://localhost:3000 > /dev/null && echo "✅ Port 3000 responding" || echo "⚠️ Port 3000 not responding"
        else
            echo "❌ Dev server not running"
        fi
    fi
}

# 5. Arrêter le serveur proprement
stop_dev_server() {
    if [ -f /tmp/dev.pid ]; then
        PID=$(cat /tmp/dev.pid)
        kill $PID 2>/dev/null && echo "Stopped dev server"
        rm /tmp/dev.pid
    fi
}

# Commandes disponibles
case "$1" in
    start)
        start_dev_background
        ;;
    stop)
        stop_dev_server
        ;;
    check)
        check_dev_server
        ;;
    *)
        echo "Usage: $0 {start|stop|check}"
        ;;
esac