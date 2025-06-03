// CSS Fix Injection - Intercepte et corrige les CSS mal chargés
(function() {
    // Override document.createElement to intercept script creation
    const originalCreateElement = document.createElement.bind(document);
    
    document.createElement = function(tagName) {
        const element = originalCreateElement(tagName);
        
        if (tagName.toLowerCase() === 'script') {
            // Override src setter to detect CSS files
            let _src = '';
            Object.defineProperty(element, 'src', {
                get() {
                    return _src;
                },
                set(value) {
                    if (value && value.includes('.css')) {
                        console.warn('[CSS-FIX] Blocked CSS as script:', value);
                        
                        // Create a proper CSS link instead
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = value.split('?')[0]; // Remove query params
                        
                        // Insert when the script would have been inserted
                        setTimeout(() => {
                            if (element.parentNode) {
                                element.parentNode.insertBefore(link, element);
                                element.remove();
                            } else {
                                document.head.appendChild(link);
                            }
                        }, 0);
                        
                        // Don't set the src
                        return;
                    }
                    _src = value;
                }
            });
        }
        
        return element;
    };
    
    console.log('✅ CSS Fix Injection active');
})();