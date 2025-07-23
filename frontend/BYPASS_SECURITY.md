# Bypass Parameter Security

This document explains how to add bypass parameter security to HTML pages in the NAD application.

## Overview

The bypass parameter security system prevents unauthorized access to protected pages. When someone uses an invalid bypass key (e.g., `?bypass=wrongkey`), they are automatically redirected to `http://mynadtest.com`.

## How It Works

1. User accesses page with bypass parameter: `https://mynadtest.info/page.html?bypass=somekey`
2. Client-side script validates the bypass key via API call to `/api/admin/validate-bypass`
3. If key is invalid, user is redirected to company website
4. If key is valid, page loads normally

## Adding Security to New HTML Pages

To protect a new HTML page, simply add this line in the `<head>` section:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Page Title</title>
    
    <!-- Bypass parameter security check -->
    <script src="shared/js/bypass-security.js"></script>
    
    <!-- Rest of your HTML head content -->
</head>
```

## Important Notes

- **File Location**: The security script is located at `/frontend/shared/js/bypass-security.js`
- **Placement**: Include the script early in the `<head>` section, before other scripts
- **Path**: Use the relative path `shared/js/bypass-security.js` from your HTML file
- **No Configuration**: The script works automatically - no additional setup required

## Protected Pages

Currently protected pages:
- `/frontend/admin.html` - Admin dashboard
- `/frontend/customer-portal.html` - Customer portal

## Testing

To test bypass security on a new page:

1. **Valid key**: `https://mynadtest.info/yourpage.html?bypass=CORRECT_KEY` - should load normally
2. **Invalid key**: `https://mynadtest.info/yourpage.html?bypass=wrongkey` - should redirect to mynadtest.com
3. **No key**: `https://mynadtest.info/yourpage.html` - should load normally (no bypass check needed)

## Troubleshooting

If bypass security isn't working:

1. Check that the script path is correct relative to your HTML file
2. Verify the script loads properly (check browser Network tab)
3. Test the validation endpoint directly: `/api/admin/validate-bypass?bypass=wrongkey`
4. Check browser console for any JavaScript errors