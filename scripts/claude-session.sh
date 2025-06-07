#!/bin/bash

# Script de gestion des sessions ClaudeBox persistantes
set -euo pipefail

# Configuration
SESSION_NAME="mathildanesth-claude"
IMAGE_NAME="claudebox"
USER_ID=$(id -u)
GROUP_ID=$(id -g)
PROJECT_DIR="$(pwd)"
CLAUDE_DATA_DIR="$HOME/.claude"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Fonctions
check_container() {
    docker ps -q -f name="$SESSION_NAME" 2>/dev/null
}

check_container_exists() {
    docker ps -aq -f name="$SESSION_NAME" 2>/dev/null
}

start_session() {
    echo -e "${BLUE}🚀 Démarrage d'une nouvelle session ClaudeBox...${NC}"
    
    # Supprime le container s'il existe déjà (arrêté)
    if [[ -n "$(check_container_exists)" ]]; then
        docker rm -f "$SESSION_NAME" >/dev/null 2>&1
    fi
    
    # Démarre un nouveau container persistent
    docker run -d \
        --name "$SESSION_NAME" \
        -w /workspace \
        -v "$PROJECT_DIR":/workspace \
        -v "$CLAUDE_DATA_DIR":/home/claude/.claude \
        -v "$HOME/.claude.json":/home/claude/.claude.json \
        -v "$HOME/.npmrc:/home/claude/.npmrc:ro" \
        -v "$HOME/.ssh:/home/claude/.ssh:ro" \
        -e "ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}" \
        --network host \
        "$IMAGE_NAME" sleep infinity >/dev/null
    
    echo -e "${GREEN}✅ Session '$SESSION_NAME' démarrée !${NC}"
}

attach_session() {
    echo -e "${BLUE}🔗 Connexion à la session existante...${NC}"
    docker exec -it "$SESSION_NAME" bash
}

claude_session() {
    echo -e "${BLUE}🤖 Lancement de Claude dans la session...${NC}"
    docker exec -it "$SESSION_NAME" bash -c "
        source /home/claude/.nvm/nvm.sh
        nvm use default
        claude $*
    "
}

stop_session() {
    echo -e "${YELLOW}⏹️  Arrêt de la session ClaudeBox...${NC}"
    docker stop "$SESSION_NAME" >/dev/null 2>&1
    docker rm "$SESSION_NAME" >/dev/null 2>&1
    echo -e "${GREEN}✅ Session arrêtée !${NC}"
}

show_status() {
    if [[ -n "$(check_container)" ]]; then
        echo -e "${GREEN}✅ Session '$SESSION_NAME' active${NC}"
        echo -e "   Container ID: $(check_container)"
        echo -e "   Pour te connecter: ${YELLOW}./scripts/claude-session.sh shell${NC}"
        echo -e "   Pour lancer Claude: ${YELLOW}./scripts/claude-session.sh claude${NC}"
    else
        echo -e "${RED}❌ Aucune session active${NC}"
        echo -e "   Pour démarrer: ${YELLOW}./scripts/claude-session.sh start${NC}"
    fi
}

show_help() {
    echo -e "${BLUE}ClaudeBox Session Manager pour Mathildanesth${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./scripts/claude-session.sh start       # Démarre une nouvelle session persistante"
    echo "  ./scripts/claude-session.sh shell       # Se connecte au bash de la session"
    echo "  ./scripts/claude-session.sh claude      # Lance Claude dans la session"
    echo "  ./scripts/claude-session.sh status      # Affiche le statut de la session"
    echo "  ./scripts/claude-session.sh stop        # Arrête la session"
    echo "  ./scripts/claude-session.sh restart     # Redémarre la session"
    echo ""
    echo -e "${YELLOW}Exemples:${NC}"
    echo "  ./scripts/claude-session.sh claude --model opus -c"
    echo "  ./scripts/claude-session.sh claude --help"
}

# Menu principal
case "${1:-}" in
    start)
        if [[ -n "$(check_container)" ]]; then
            echo -e "${YELLOW}⚠️  Une session est déjà active !${NC}"
            show_status
        else
            start_session
        fi
        ;;
    shell)
        if [[ -n "$(check_container)" ]]; then
            attach_session
        else
            echo -e "${RED}❌ Aucune session active. Démarrage...${NC}"
            start_session
            attach_session
        fi
        ;;
    claude)
        shift
        if [[ -n "$(check_container)" ]]; then
            claude_session "$@"
        else
            echo -e "${RED}❌ Aucune session active. Démarrage...${NC}"
            start_session
            claude_session "$@"
        fi
        ;;
    stop)
        if [[ -n "$(check_container)" ]]; then
            stop_session
        else
            echo -e "${YELLOW}⚠️  Aucune session à arrêter${NC}"
        fi
        ;;
    restart)
        if [[ -n "$(check_container)" ]]; then
            stop_session
        fi
        start_session
        ;;
    status)
        show_status
        ;;
    *)
        show_help
        ;;
esac 