#!/bin/bash

# Script to create French route folders with proper structure
# Based on route translations mapping

echo "🇫🇷 Creating French route directories..."

# Function to create route with proper structure
create_route() {
    local source_path=$1
    local target_path=$2
    
    if [ -d "$source_path" ]; then
        echo "  ✓ Creating $target_path from $source_path"
        mkdir -p "$target_path"
        
        # Copy page.tsx if exists
        if [ -f "$source_path/page.tsx" ]; then
            cp "$source_path/page.tsx" "$target_path/"
        fi
        
        # Copy layout.tsx if exists
        if [ -f "$source_path/layout.tsx" ]; then
            cp "$source_path/layout.tsx" "$target_path/"
        fi
        
        # Copy loading.tsx if exists
        if [ -f "$source_path/loading.tsx" ]; then
            cp "$source_path/loading.tsx" "$target_path/"
        fi
        
        # Copy error.tsx if exists
        if [ -f "$source_path/error.tsx" ]; then
            cp "$source_path/error.tsx" "$target_path/"
        fi
    else
        echo "  ⚠️  Source not found: $source_path"
    fi
}

# Base directory
APP_DIR="/workspace/src/app"

# Admin routes
echo "📁 Creating admin routes..."
create_route "$APP_DIR/admin/command-center" "$APP_DIR/admin/centre-commande"
create_route "$APP_DIR/admin/emergency-replacement" "$APP_DIR/admin/remplacement-urgence"
create_route "$APP_DIR/admin/performance" "$APP_DIR/admin/performances"
create_route "$APP_DIR/admin/planning-generator" "$APP_DIR/admin/generateur-planning"
create_route "$APP_DIR/admin/planning-rules" "$APP_DIR/admin/regles-planning"
create_route "$APP_DIR/admin/schedule-rules" "$APP_DIR/admin/regles-horaires"
create_route "$APP_DIR/admin/skills" "$APP_DIR/admin/competences"
create_route "$APP_DIR/admin/team-configurations" "$APP_DIR/admin/configurations-equipes"
create_route "$APP_DIR/admin/site-assignments" "$APP_DIR/admin/affectations-sites"
create_route "$APP_DIR/admin/rules" "$APP_DIR/admin/regles"
create_route "$APP_DIR/admin/analytics" "$APP_DIR/admin/analyses"

# Other routes
echo "📁 Creating other routes..."
create_route "$APP_DIR/quota-management" "$APP_DIR/gestion-quotas"

# Test/Dev routes (optional)
echo "📁 Creating test/dev routes..."
create_route "$APP_DIR/test-auth" "$APP_DIR/test-authentification"
create_route "$APP_DIR/design-system" "$APP_DIR/systeme-design"
create_route "$APP_DIR/drag-and-drop-demo" "$APP_DIR/demo-glisser-deposer"

echo "✅ French routes creation completed!"

# Check if old routes still exist
echo ""
echo "🔍 Checking for routes that need manual migration:"
find "$APP_DIR" -type d -name "command-center" -o -name "emergency-replacement" -o -name "planning-generator" -o -name "planning-rules" -o -name "schedule-rules" | head -20

echo ""
echo "💡 Next steps:"
echo "1. Update internal links in components to use French routes"
echo "2. Test all redirections work correctly"
echo "3. Remove old English route folders once confirmed working"