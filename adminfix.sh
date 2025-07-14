cd /opt/nad-app

# Create the tests section HTML with Create Tests interface
mkdir -p frontend/admin/sections

cat > frontend/admin/sections/tests.html << 'EOF'
<div id="tests" class="content-section">
    <div class="section-header">
        <h2>🧪 Test Management</h2>
        <p>Create test blocks and manage test lifecycle</p>
    </div>

    <div class="bulk-creation-section">
        <h3>📦 Create Test Block</h3>
        <p>Generate a batch of test IDs for shipping. Tests will use the new format: <code>yyyy-mm-n-xxxxxx</code></p>
        
        <div class="success-message" id="test-success-message" style="display: none;"></div>
        <div class="error-message" id="test-error-message" style="display: none;"></div>
        
        <form id="bulk-creation-form" class="creation-form">
            <div class="form-group">
                <label for="test-quantity">Number of Tests</label>
                <input type="number" id="test-quantity" min="1" max="1000" value="10" required>
                <small>Min: 1, Max: 1000</small>
            </div>
            
            <div class="form-group">
                <label for="batch-notes">Notes (Optional)</label>
                <input type="text" id="batch-notes" placeholder="e.g., Q1 2025 Inventory">
            </div>
            
            <div class="form-group">
                <label>Preview Format</label>
                <div class="test-id-preview" id="test-id-preview">
                    2025-07-123-45678
                </div>
            </div>
            
            <button type="submit" class="create-btn" id="create-test-btn">
                📦 Create Tests
            </button>
        </form>
        
        <div class="loading-spinner" id="test-loading-spinner" style="display: none;">
            <div class="spinner"></div>
            <span>Creating tests...</span>
        </div>
    </div>
</div>
EOF

# Make sure the JavaScript file exists
mkdir -p frontend/admin/js/sections

# Create a simple working version
cat > frontend/admin/js/sections/tests.js << 'EOF'
// Simple Test Management that works
console.log('🧪 Loading Test Management...');

function initTestManagement() {
    console.log('🚀 Initializing Test Management...');
    
    // Wait a moment for DOM to be ready
    setTimeout(() => {
        const form = document.getElementById('bulk-creation-form');
        const button = document.getElementById('create-test-btn');
        
        if (form && button) {
            console.log('✅ Found form and button');
            
            // Remove existing listeners
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            // Add event listener
            const finalForm = document.getElementById('bulk-creation-form');
            finalForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('📝 Form submitted!');
                
                const quantity = parseInt(document.getElementById('test-quantity').value);
                const notes = document.getElementById('batch-notes').value || '';
                
                if (quantity < 1 || quantity > 1000) {
                    alert('Quantity must be between 1 and 1000');
                    return;
                }
                
                // Show loading
                button.disabled = true;
                button.textContent = '⏳ Creating...';
                
                try {
                    const response = await fetch('/api/admin/create-test-batch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ quantity, notes })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        const totalCreated = result.data.quantity;
                        const samplesShown = result.data.sample_test_ids.length;
                        
                        let message = `✅ SUCCESS! Created ${totalCreated} tests\n\nBatch ID: ${result.data.batch_id}\n\n`;
                        
                        if (totalCreated <= 5) {
                            message += `All Test IDs:\n${result.data.sample_test_ids.join('\n')}`;
                        } else {
                            message += `Sample Test IDs (showing first ${samplesShown} of ${totalCreated} total):\n`;
                            message += `${result.data.sample_test_ids.join('\n')}\n\n`;
                            message += `✨ ${totalCreated - samplesShown} additional tests were also created in this batch\n\n`;
                            message += `All ${totalCreated} tests are ready for shipping and use!`;
                        }
                        
                        alert(message);
                        finalForm.reset();
                        document.getElementById('test-quantity').value = 10;
                    } else {
                        alert('Error: ' + result.message);
                    }
                } catch (error) {
                    alert('Network error: ' + error.message);
                } finally {
                    button.disabled = false;
                    button.textContent = '📦 Create Tests';
                }
            });
            
            // Start test ID preview
            function updatePreview() {
                const preview = document.getElementById('test-id-preview');
                if (preview) {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const randomId = Math.floor(Math.random() * 1000) + 100;
                    const randomSuffix = Math.floor(Math.random() * 90000) + 10000;
                    preview.textContent = `${year}-${month}-${randomId}-${randomSuffix}`;
                }
            }
            updatePreview();
            setInterval(updatePreview, 3000);
            
            console.log('✅ Test Management ready!');
        } else {
            console.error('❌ Form or button not found');
        }
    }, 500);
}

window.initTestManagement = initTestManagement;
EOF

echo "✅ Fixed Test Management files created!"
