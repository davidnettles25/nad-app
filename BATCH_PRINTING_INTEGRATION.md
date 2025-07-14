# Batch Printing Integration Instructions

## Files Created
- `admin/css/batch-printing.css` - Modular CSS styles
- `admin/sections/batch-printing.html` - Main section HTML  
- `admin/components/batch-card.html` - Batch card component template
- `admin/components/print-options.html` - Print options component
- `admin/js/sections/batch-printing.js` - JavaScript module

## Integration Steps

### 1. Add CSS to admin.html
Add this line in the `<head>` section:
```html
<link rel="stylesheet" href="admin/css/batch-printing.css">
```

### 2. Add JavaScript to admin.html  
Add this line before closing `</body>`:
```html
<script src="admin/js/sections/batch-printing.js"></script>
```

### 3. Include HTML Section
In your admin.html, add this where you want the batch printing section:
```html
<!-- Include batch printing section -->
<div data-component="batch-printing" data-src="admin/sections/batch-printing.html"></div>
```

OR manually include the content from `admin/sections/batch-printing.html`

### 4. Add Navigation
Add this to your sidebar navigation:
```html
<li><a href="#" onclick="showBatchPrinting()" data-section="batch-printing">🖨️ Batch Printing</a></li>
```

### 5. Initialize When Section is Shown
Add this function to show the batch printing section:
```javascript
function showBatchPrinting() {
    showSection('batch-printing');
    
    // Initialize batch printing if not already done
    if (batchPrintingManager && !batchPrintingManager.isInitialized) {
        batchPrintingManager.init();
    }
}
```

## Testing
1. Create some test batches first
2. Run the database changes from Step 1
3. Deploy the backend endpoints from Step 2  
4. Test the interface:
   - View available batches
   - Select a batch for printing
   - Try different print formats
   - Verify print status tracking

## Dependencies
- Requires the backend API endpoints from Step 2
- Requires the database changes from Step 1
- Uses existing showAlert() function for notifications
- Uses existing showSection() function for navigation
