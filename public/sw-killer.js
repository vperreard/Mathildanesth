// Force kill all service workers and prevent re-registration
(function() {
    console.log('🔥 SW Killer activated!');
    
    // 1. Override service worker registration to prevent any SW from being registered
    if ('serviceWorker' in navigator) {
        const originalRegister = navigator.serviceWorker.register;
        navigator.serviceWorker.register = function() {
            console.warn('⛔ Service Worker registration blocked by SW Killer');
            return Promise.reject(new Error('Service Worker registration disabled'));
        };
    }
    
    // 2. Unregister all existing service workers
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            console.log(`Found ${registrations.length} service worker(s) to kill`);
            registrations.forEach(registration => {
                registration.unregister().then(success => {
                    console.log(`☠️ Killed SW: ${registration.scope}`);
                });
            });
        });
    }
    
    // 3. Clear all caches
    if ('caches' in window) {
        caches.keys().then(names => {
            console.log(`Found ${names.length} cache(s) to delete`);
            names.forEach(name => {
                caches.delete(name).then(() => {
                    console.log(`🗑️ Deleted cache: ${name}`);
                });
            });
        });
    }
    
    // 4. Intercept and fix CSS loading
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.tagName === 'SCRIPT' && node.src && node.src.includes('.css')) {
                    // Remove timestamp from CSS URLs
                    const cleanUrl = node.src.split('?')[0];
                    console.log(`🔧 Fixing CSS: ${node.src} → ${cleanUrl}`);
                    
                    // Block the script
                    node.remove();
                    
                    // Add proper CSS link
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = cleanUrl;
                    link.type = 'text/css';
                    document.head.appendChild(link);
                }
            });
        });
    });
    
    // Start observing
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
    
    // 5. Fix existing CSS scripts
    document.querySelectorAll('script[src*=".css"]').forEach(script => {
        const cleanUrl = script.src.split('?')[0];
        console.log(`🔧 Fixing existing CSS: ${script.src}`);
        
        script.remove();
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cleanUrl;
        link.type = 'text/css';
        document.head.appendChild(link);
    });
    
    console.log('✅ SW Killer active - Service Workers disabled, CSS loading fixed');
})();