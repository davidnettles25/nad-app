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
    
    console.log('Bypass security script loading...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const bypassParam = urlParams.get('bypass');
    
    console.log('URL params:', window.location.search);
    console.log('Bypass param:', bypassParam);
    
    // Only check if bypass parameter is present
    if (bypassParam) {
        console.log('Bypass parameter found, processing...');
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
        console.log('Bypass validation: sending request to', validationUrl);
        
        // Set a flag that dashboard should wait for bypass validation
        sessionStorage.setItem('nad_bypass_pending', 'true');
        
        fetch(validationUrl, {
            method: 'GET',
            redirect: 'manual'
        })
        .then(response => {
            console.log('Bypass validation response:', response.status, response.ok);
            if (!response.ok || response.status === 401) {
                console.log('Invalid bypass key - redirecting to mynadtest.com');
                // Invalid bypass key - redirect to company site
                window.location.href = 'http://mynadtest.com';
            } else {
                console.log('Valid bypass - setting sessionStorage flags');
                // Valid bypass - set flag for dashboard to use
                sessionStorage.setItem('nad_bypass_validated', 'true');
                sessionStorage.setItem('nad_bypass_user', JSON.stringify({
                    email: email || 'john.doe@example.com',
                    first_name: firstName || 'John',
                    last_name: lastName || 'Doe'
                }));
                console.log('Bypass sessionStorage set:', sessionStorage.getItem('nad_bypass_validated'));
                
                // Clear pending flag and trigger dashboard init if it's waiting
                sessionStorage.removeItem('nad_bypass_pending');
                
                // Dispatch event to signal bypass validation is complete
                window.dispatchEvent(new CustomEvent('nadBypassValidated'));
            }
        })
        .catch(error => {
            console.log('Bypass validation error:', error);
            // On network error or other issues, assume invalid and redirect
            window.location.href = 'http://mynadtest.com';
        });
    }
    
    // No bypass parameter present - normal page loading continues
})();