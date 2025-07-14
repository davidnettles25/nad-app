# Fix Dashboard Styling and JavaScript Issues

echo "🔧 Fixing dashboard styling and JavaScript issues..."

cd /opt/nad-app

# STEP 1: Fix the CSS styling issues
echo "📝 Step 1: Adding missing CSS styles to admin.html..."

# Add comprehensive CSS directly to admin.html
cat >> frontend/admin.html << 'EOF'

<style>
/* Enhanced Test Management Styles */
.content-section {
    display: none;
    padding: 20px;
    background: white;
    border-radius: 8px;
    margin: 20px 0;
}

.content-section.active {
    display: block;
}

.section-header {
    margin-bottom: 30px;
    border-bottom: 2px solid #e9ecef;
    padding-bottom: 15px;
}

.section-header h2 {
    margin: 0 0 5px 0;
    color: #495057;
    font-size: 24px;
    font-weight: 600;
}

.section-header p {
    margin: 0;
    color: #6c757d;
    font-size: 14px;
}

/* Bulk Creation Section */
.bulk-creation-section {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border: 1px solid #dee2e6;
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 30px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.bulk-creation-section h3 {
    margin: 0 0 15px 0;
    color: #495057;
    font-size: 20px;
    font-weight: 600;
}

.bulk-creation-section p {
    margin: 0 0 20px 0;
    color: #6c757d;
    font-size: 14px;
}

.creation-form {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr auto;
    gap: 20px;
    align-items: end;
    margin: 25px 0;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group label {
    font-weight: 600;
    margin-bottom: 8px;
    color: #495057;
    font-size: 14px;
}

.form-group input {
    padding: 12px 15px;
    border: 2px solid #ced4da;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.3s ease;
}

.form-group input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-group small {
    color: #6c757d;
    font-size: 12px;
    margin-top: 4px;
}

.test-id-preview {
    background: #343a40;
    color: #fff;
    padding: 12px 15px;
    border-radius: 6px;
    font-family: 'Courier New', monospace;
    font-size: 16px;
    font-weight: bold;
    text-align: center;
    border: 2px solid #495057;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
}

.create-btn {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;
    box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
}

.create-btn:hover {
    background: linear-gradient(135deg, #218838 0%, #1abc9c 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(40, 167, 69, 0.4);
}

.create-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

/* Messages */
.success-message {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
    border-radius: 6px;
    padding: 15px;
    margin-bottom: 20px;
    border-left: 4px solid #28a745;
}

.error-message {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
    border-radius: 6px;
    padding: 15px;
    margin-bottom: 20px;
    border-left: 4px solid #dc3545;
}

/* Loading States */
.loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #6c757d;
    padding: 20px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 6px;
    margin-top: 15px;
}

.spinner {
    width: 20px;
    height: 20px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* General Button Styles */
.btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    text-decoration: none;
    display: inline-block;
}

.btn.secondary {
    background: #6c757d;
    color: white;
}

.btn.secondary:hover {
    background: #5a6268;
}

/* Responsive Design */
@media (max-width: 768px) {
    .creation-form {
        grid-template-columns: 1fr;
        gap: 15px;
    }
    
    .bulk-creation-section {
        padding: 20px;
    }
}
</style>
EOF

echo "✅ Added comprehensive CSS styles"

# STEP 2: Fix the JavaScript initialization issues
echo "📝 Step 2: Creating working JavaScript initialization..."

# Create a simple, working initialization script
cat > /tmp/init_script.js << 'EOF'

<script>
console.log('🚀 Initializing NAD Admin Dashboard...');

// Simple but robust Test Management functionality
function setupTestManagement() {
    console.log('🧪 Setting up Test Management...');
    
    const form = document.getElementById('bulk-creation-form');
    const button = document.getElementById('create-test-btn');
    const preview = document.getElementById('test-id-preview');
    
    if (!form || !button) {
        console.log('⚠️ Test Management elements not found, will retry...');
        return false;
    }
    
    console.log('✅ Found Test Management elements');
    
    // Remove any existing event listeners
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Get references to the new elements
    const finalForm = document.getElementById('bulk-creation-form');
    const finalButton = document.getElementById('create-test-btn');
    
    // Add form submission handler
    finalForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('📝 Create Tests form submitted');
        
        const quantity = parseInt(document.getElementById('test-quantity').value);
        const notes = document.getElementById('batch-notes').value || '';
        
        if (quantity < 1 || quantity > 1000) {
            alert('❌ Quantity must be between 1 and 1000');
            return;
        }
        
        // Show loading state
        finalButton.disabled = true;
        finalButton.textContent = '⏳ Creating...';
        
        const spinner = document.getElementById('test-loading-spinner');
        if (spinner) spinner.style.display = 'flex';
        
        try {
            console.log('📡 Sending API request for', quantity, 'tests...');
            
            const response = await fetch('/api/admin/create-test-batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ quantity, notes })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('📡 API Response:', result);
            
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
                
                // Reset form
                finalForm.reset();
                document.getElementById('test-quantity').value = 10;
                
                console.log('✅ Test creation completed successfully');
            } else {
                alert('❌ Error: ' + (result.message || 'Failed to create test batch'));
            }
            
        } catch (error) {
            console.error('❌ Error creating tests:', error);
            alert('❌ Network error: ' + error.message);
        } finally {
            // Reset button state
            finalButton.disabled = false;
            finalButton.textContent = '📦 Create Tests';
            if (spinner) spinner.style.display = 'none';
        }
    });
    
    // Set up test ID preview animation
    function updatePreview() {
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
    
    console.log('✅ Test Management fully configured and ready!');
    return true;
}

// Enhanced navigation function
function showSection(sectionName) {
    console.log('📍 Switching to section:', sectionName);
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const navLink = document.querySelector('[data-section="' + sectionName + '"]');
        if (navLink) {
            navLink.classList.add('active');
        }
        
        // Initialize Test Management when tests section is shown
        if (sectionName === 'tests') {
            setTimeout(() => {
                const success = setupTestManagement();
                if (!success) {
                    // Retry after a delay if elements aren't ready
                    setTimeout(setupTestManagement, 500);
                }
            }, 100);
        }
        
        console.log('✅ Section activated:', sectionName);
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM ready, setting up navigation...');
    
    // Setup navigation handlers
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionName = this.getAttribute('data-section');
            if (sectionName) {
                showSection(sectionName);
            }
        });
    });
    
    // Show overview by default
    showSection('overview');
    
    console.log('✅ Admin dashboard initialization complete!');
});

// Make functions globally available
window.showSection = showSection;
window.setupTestManagement = setupTestManagement;
</script>
EOF

# Add the initialization script to admin.html
cat /tmp/init_script.js >> frontend/admin.html

# Clean up temp file
rm -f /tmp/init_script.js

echo "✅ Added working JavaScript initialization"

# STEP 3: Verify the Test Management section HTML is correct
echo "📝 Step 3: Verifying Test Management section..."

if [ ! -f "frontend/admin/sections/tests.html" ]; then
    echo "📝 Creating tests.html section..."
    
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

    echo "✅ Created tests.html section"
else
    echo "✅ tests.html section already exists"
fi

echo ""
echo "🎉 Dashboard fixes completed!"
echo "============================"
echo ""
echo "📋 What was fixed:"
echo "✅ Added comprehensive CSS styling for Test Management"
echo "✅ Fixed JavaScript initialization issues"
echo "✅ Created robust form handling and event listeners"
echo "✅ Added proper loading states and error handling"
echo "✅ Fixed section navigation and activation"
echo ""
echo "🔄 Next steps:"
echo "1. Refresh your browser (Ctrl+F5)"
echo "2. Navigate to Test Management section"
echo "3. The interface should now look properly styled"
echo "4. Try the Create Tests button - it should work!"
echo ""
echo "✨ The dashboard should now look and function correctly!"
