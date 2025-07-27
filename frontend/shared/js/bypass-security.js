/**
 * Bypass Parameter Security Check
 * 
 * This script validates bypass parameters for protected HTML pages.
 * If an invalid bypass key is provided, the user is redirected to mynadtest.com.
 * 
 * Usage: Include this script in the <head> section of any protected HTML page:
 * <script src="shared/js/bypass-security.js"></script>
 */
(function() {
    'use strict';
    
    const urlParams = new URLSearchParams(window.location.search);
    const bypassParam = urlParams.get('bypass');
    
    // Only check if bypass parameter is present
    if (bypassParam) {
        // Get any user information from URL parameters
        const email = urlParams.get('email');
        const firstName = urlParams.get('first_name');
        const lastName = urlParams.get('last_name');
        
        // Build validation URL with user info if provided
        let validationUrl = '/api/admin/validate-bypass?bypass=' + encodeURIComponent(bypassParam);
        if (email) validationUrl += '&email=' + encodeURIComponent(email);
        if (firstName) validationUrl += '&first_name=' + encodeURIComponent(firstName);
        if (lastName) validationUrl += '&last_name=' + encodeURIComponent(lastName);
        
        // Validate bypass parameter with server
        fetch(validationUrl, {
            method: 'GET',
            redirect: 'manual'
        })
        .then(response => {
            if (!response.ok || response.status === 401) {
                // Invalid bypass key - redirect to company site
                window.location.href = 'http://mynadtest.com';
            }
            // If response is ok, bypass is valid - continue loading page
        })
        .catch(() => {
            // On network error or other issues, assume invalid and redirect
            window.location.href = 'http://mynadtest.com';
        });
    }
    
    // No bypass parameter present - normal page loading continues
})();