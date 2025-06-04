// Force unregister ALL service workers and clear ALL caches
(async function() {
    console.log('🧹 Starting aggressive Service Worker cleanup...');
    
    // 1. Unregister ALL service workers
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log(`Found ${registrations.length} service worker(s)`);
        
        for (let registration of registrations) {
            const success = await registration.unregister();
            console.log(`Unregistered SW: ${registration.scope} - Success: ${success}`);
        }
        
        // Force update to ensure SW is gone
        try {
            await navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) {
                    console.log('SW still exists, forcing update...');
                    return reg.update();
                }
            });
        } catch (e) {
            console.log('SW update error (good - means it\'s gone):', e);
        }
    }
    
    // 2. Clear ALL caches aggressively
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log(`Found ${cacheNames.length} cache(s)`);
        
        for (let name of cacheNames) {
            const success = await caches.delete(name);
            console.log(`Deleted cache: ${name} - Success: ${success}`);
        }
        
        // Double check
        const remainingCaches = await caches.keys();
        if (remainingCaches.length > 0) {
            console.error('Some caches still exist:', remainingCaches);
        }
    }
    
    // 3. Clear ALL storage
    console.log('Clearing all storage...');
    try {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear IndexedDB
        if ('indexedDB' in window) {
            const databases = await indexedDB.databases();
            for (let db of databases) {
                indexedDB.deleteDatabase(db.name);
                console.log(`Deleted IndexedDB: ${db.name}`);
            }
        }
    } catch (e) {
        console.error('Storage clear error:', e);
    }
    
    // 4. Remove SW from cache storage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        console.log(`Storage used: ${estimate.usage} / ${estimate.quota}`);
    }
    
    console.log('✅ Cleanup complete! Please refresh the page (Ctrl+F5 or Cmd+Shift+R)');
    
    // 5. Auto refresh after 2 seconds
    setTimeout(() => {
        window.location.reload(true);
    }, 2000);
})();