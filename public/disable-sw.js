// Disable service workers completely in development
(function() {
    if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
        // Prevent service worker registration
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register = () => Promise.reject(new Error('Service Worker disabled in development'));
            
            // Unregister existing service workers
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.unregister();
                });
            });
        }
        
        // Clear caches
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }
    }
})();