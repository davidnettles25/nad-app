# Apache 404 Configuration for Custom Error Pages

## Issue
When accessing invalid URLs like `mynadtest.info/blowfart`, Apache serves its generic "Not Found" page instead of routing the request to Node.js for our custom 404 page.

## Solution
The Apache virtual host configuration needs to be updated to route 404 errors through the Node.js application.

## Required Apache Configuration

Add the following lines to both HTTP and HTTPS virtual host files:
- `/opt/bitnami/apache2/conf/vhosts/mynadtest-http.conf`
- `/opt/bitnami/apache2/conf/vhosts/mynadtest-ssl.conf`

```apache
# Custom 404 error handling - route through Node.js
ErrorDocument 404 /404.html

# Ensure 404.html requests are proxied to Node.js
RewriteRule ^/404\.html$ http://127.0.0.1:3001/404.html [P,L]
```

## Alternative Solution (if above doesn't work)
If the above doesn't work, try routing all 404s directly to Node.js:

```apache
# Route all 404 errors to Node.js for custom handling
ErrorDocument 404 http://127.0.0.1:3001/404.html
```

## How to Apply
1. SSH to server: `ssh bitnami@18.189.59.176`
2. Edit the Apache config files:
   ```bash
   sudo vi /opt/bitnami/apache2/conf/vhosts/mynadtest-http.conf
   sudo vi /opt/bitnami/apache2/conf/vhosts/mynadtest-ssl.conf
   ```
3. Add the configuration lines above
4. Restart Apache: `sudo systemctl restart apache2`
5. Test with: `curl -I https://mynadtest.info/blowfart`

## Testing
After applying the configuration, test these URLs:
- `https://mynadtest.info/nonexistent`
- `https://mynadtest.info/blowfart` 
- `https://mynadtest.info/random-page`

All should return the custom 404.html page with "Access Required" message.

## Current Status
- ✅ Node.js 404 handler implemented
- ❌ Apache configuration not yet applied
- ❌ Generic Apache 404 still showing for invalid URLs