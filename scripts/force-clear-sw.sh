#!/bin/bash

echo "🧹 Force clearing Service Worker and cache..."

# Kill all Chrome processes
echo "Closing Chrome..."
pkill -f "Google Chrome"

# Clear Chrome cache directories
echo "Clearing Chrome cache..."
rm -rf ~/Library/Caches/Google/Chrome/
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Service\ Worker/
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Cache/
rm -rf ~/Library/Application\ Support/Google/Chrome/Default/Code\ Cache/

echo "✅ Cache cleared!"
echo ""
echo "📝 Next steps:"
echo "1. Restart Chrome"
echo "2. Go to http://localhost:3000/unregister-sw.html"
echo "3. Open DevTools > Application > Storage > Clear site data"
echo "4. Restart your dev server: npm run dev"