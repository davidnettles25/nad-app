/**
 * Client-side 404 redirect handler
 * This script can be injected into Apache's default 404 page
 * to redirect users to our custom 404 page
 */

(function() {
    'use strict';
    
    // Check if we're on a generic 404 page (Apache default)
    function isGeneric404Page() {
        const title = document.title.toLowerCase();
        const body = document.body ? document.body.textContent.toLowerCase() : '';
        
        // Check for common Apache 404 indicators
        const apache404Indicators = [
            'not found',
            '404',
            'the requested url',
            'was not found on this server',
            'apache'
        ];
        
        return apache404Indicators.some(indicator => 
            title.includes(indicator) || body.includes(indicator)
        );
    }
    
    // Redirect to our custom 404 page
    function redirectToCustom404() {
        const currentUrl = window.location.href;
        const custom404Url = '/404.html?original=' + encodeURIComponent(window.location.pathname);
        
        console.log('Redirecting from generic 404 to custom 404:', custom404Url);
        
        // Use replace to avoid adding to browser history
        window.location.replace(custom404Url);
    }
    
    // Wait for DOM to be ready
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                if (isGeneric404Page()) {
                    setTimeout(redirectToCustom404, 500); // Small delay for better UX
                }
            });
        } else {
            if (isGeneric404Page()) {
                setTimeout(redirectToCustom404, 500);
            }
        }
    }
    
    init();
})();